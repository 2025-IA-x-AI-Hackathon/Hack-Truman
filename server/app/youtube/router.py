from fastapi import APIRouter, HTTPException
from app.youtube.service import YouTubeService
from app.youtube.schemas import YouTubeInfo, YouTubeDownloadRequest, YouTubeDownloadResponse
from app.whisperx.service import WhisperXService
from app.whisperx.schemas import YouTubeSTTResponse

router = APIRouter()
youtube_service = YouTubeService()
# 싱글톤 인스턴스 사용
whisperx_service = WhisperXService.get_instance()

@router.post("/info", response_model=YouTubeInfo)
async def get_youtube_info(request: YouTubeDownloadRequest):
    """
    YouTube 영상 정보 가져오기
    """
    try:
        info = await youtube_service.get_info(request.url)
        return info
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"YouTube 정보를 가져올 수 없습니다: {str(e)}"
        )

@router.post("/download", response_model=YouTubeDownloadResponse)
async def download_youtube_audio(request: YouTubeDownloadRequest):
    """
    YouTube 영상을 오디오로 다운로드
    """
    try:
        result = await youtube_service.download_audio(request.url)
        return YouTubeDownloadResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"YouTube 다운로드 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/process", response_model=YouTubeSTTResponse)
async def process_youtube_with_stt(request: YouTubeDownloadRequest):
    """
    YouTube 영상 다운로드 후 STT 변환까지 한번에 처리
    """
    try:
        # 1. YouTube 정보 가져오기
        youtube_info = await youtube_service.get_info(request.url)
        
        # 2. 오디오 다운로드
        download_result = await youtube_service.download_audio(request.url)
        
        # 3. STT 변환
        stt_result = await whisperx_service.transcribe_audio(
            file_path=download_result["file_path"],
            language="ko"  # 기본값으로 한국어 설정
        )
        
        return YouTubeSTTResponse(
            youtube_info=youtube_info.dict(),
            download_info=download_result,
            stt_result=stt_result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"YouTube 처리 중 오류가 발생했습니다: {str(e)}"
        )
