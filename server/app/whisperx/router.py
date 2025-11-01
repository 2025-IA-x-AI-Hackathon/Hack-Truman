from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.whisperx.service import WhisperXService
from app.whisperx.schemas import STTRequest, STTResponse
from app.whisperx.system_prompt import combine_classification_prompt
from google import genai

router = APIRouter()
# 싱글톤 인스턴스 사용
whisperx_service = WhisperXService.get_instance()

@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(request: STTRequest):
    """
    오디오 파일을 텍스트로 변환
    """
    try:
        result = await whisperx_service.transcribe_audio(
            file_path=request.file_path,
            language=request.language
        )

        for segments in result:
            get_classifiy_text(segments.text)
            
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"STT 변환 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/models/info")
async def get_models_info():
    """
    로드된 모델 정보 조회
    """
    try:
        info = whisperx_service.get_loaded_models_info()
        return info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"모델 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.delete("/cleanup")
async def cleanup_models():
    """
    메모리에서 모델 정리
    """
    try:
        whisperx_service.cleanup_models()
        return {"message": "Models cleaned up successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"모델 정리 중 오류가 발생했습니다: {str(e)}"
        )