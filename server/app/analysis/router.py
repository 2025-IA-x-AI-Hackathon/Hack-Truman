from fastapi import APIRouter, HTTPException, Query
from app.youtube.service import YouTubeService
from app.whisperx.service import WhisperXService
from app.whisperx.router import extract_with_graph
from app.socket_manager import SocketManager
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
youtube_service = YouTubeService()
whisperx_service = WhisperXService.get_instance()
socket_manager = SocketManager.get_instance()


class AnalysisResponse(BaseModel):
    """분석 응답"""
    status: bool


@router.get("/analysis", response_model=AnalysisResponse)
async def analyze_video(
    videoURL: str = Query(..., description="YouTube 비디오 URL"),
):
    """
    YouTube 비디오 분석 엔드포인트

    1. YouTube 정보 가져오기 -> Socket 전송 (step: 'info')
    2. 오디오 다운로드
    3. STT 전사 -> Socket 전송 (step: 'transcription')
    4. Extract (논증 그래프) -> Socket 전송 (step: 'extract')
    5. Conclusion -> Socket 전송 (step: 'conclusion')

    Args:
        videoURL: YouTube 비디오 URL

    Returns:
        status: true
    """
    try:
        # 1. YouTube 정보 가져오기
        print(f"Fetching YouTube info for: {videoURL}")
        youtube_info = await youtube_service.get_info(videoURL)

        # Socket으로 info 전송
        await socket_manager.emit_info({
            'title': youtube_info.title,
            'thumbnail': youtube_info.thumbnail
        })

        # 2. 오디오 다운로드
        print(f"Downloading audio...")
        download_result = await youtube_service.download_audio(videoURL)
        file_path = download_result['file_path']

        # 3. STT 전사
        print(f"Transcribing audio...")
        stt_result = await whisperx_service.transcribe_audio(
            file_path=file_path,
        )

        # Socket으로 transcription 전송
        await socket_manager.emit_transcription({
            'script': stt_result.full_text
        })

        # 4. Extract (논증 그래프 생성)
        print(f"Generating argument graph...")
        extract_result = await extract_with_graph(stt_result)

        # Socket으로 extract 전송
        await socket_manager.emit_extract({
            'full_text': extract_result.full_text,
            'argument_graph': extract_result.argument_graph.dict(),
            'summary': extract_result.summary
        })

        # 5. Conclusion
        print(f"Generating conclusion...")
        conclusion_data = {
            'total_segments': extract_result.summary.get('total_segments', 0),
            'claims': extract_result.summary.get('claims', 0),
            'facts': extract_result.summary.get('facts', 0),
            'relationships': extract_result.summary.get('relationships', 0),
            'avg_confidence': extract_result.summary.get('avg_confidence', 0.0)
        }

        # Socket으로 conclusion 전송
        await socket_manager.emit_conclusion(conclusion_data)

        return AnalysisResponse(status=True)

    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"분석 중 오류가 발생했습니다: {str(e)}"
        )
