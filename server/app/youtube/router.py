from fastapi import APIRouter, HTTPException
from app.youtube.service import YouTubeService
from app.youtube.schemas import YouTubeInfo, YouTubeDownloadRequest, YouTubeDownloadResponse

router = APIRouter()
youtube_service = YouTubeService()

@router.post("/info", response_model=YouTubeInfo)
async def get_youtube_info(request: YouTubeDownloadRequest):
    """
    YouTube 영상 정보 가져오기
    """
    try:
        info = await youtube_service.get_info(request.url)
        result = await youtube_service.download_audio(request.url)
        return info
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"YouTube 정보를 가져올 수 없습니다: {str(e)}"
        )
