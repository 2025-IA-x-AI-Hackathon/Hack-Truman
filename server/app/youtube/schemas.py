from pydantic import BaseModel, Field
from typing import Optional


class YouTubeDownloadRequest(BaseModel):
    """YouTube download request"""
    url: str = Field(..., description="YouTube video URL")

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
        }


class YouTubeInfo(BaseModel):
    """YouTube video information"""
    title: Optional[str] = Field(None, description="Video title")
    duration: Optional[int] = Field(None, description="Video duration in seconds")
    uploader: Optional[str] = Field(None, description="Uploader name")
    thumbnail: Optional[str] = Field(None, description="Thumbnail URL")
    description: Optional[str] = Field(None, description="Video description")
    view_count: Optional[int] = Field(None, description="View count")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Example Video",
                "duration": 240,
                "uploader": "Example Channel",
                "thumbnail": "https://example.com/thumbnail.jpg",
                "description": "This is an example video",
                "view_count": 1000000
            }
        }


class YouTubeDownloadResponse(BaseModel):
    """YouTube download response"""
    file_path: str = Field(..., description="Downloaded file path")
    title: Optional[str] = Field(None, description="Video title")
    duration: Optional[int] = Field(None, description="Video duration in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "file_path": "downloads/dQw4w9WgXcQ.wav",
                "title": "Example Video",
                "duration": 240
            }
        }
