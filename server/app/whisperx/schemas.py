from pydantic import BaseModel, Field
from typing import Optional, List


class STTRequest(BaseModel):
    """STT 변환 요청"""
    file_path: str = Field(..., description="Audio file path")
    language: Optional[str] = Field("ko", description="Language code (ko, en, etc.)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_path": "downloads/dQw4w9WgXcQ.wav",
                "language": "ko"
            }
        }


class TranscriptionSegment(BaseModel):
    """전사 세그먼트"""
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    text: str = Field(..., description="Transcribed text")
    
    class Config:
        json_schema_extra = {
            "example": {
                "start": 0.0,
                "end": 5.2,
                "text": "안녕하세요, 이것은 예시 텍스트입니다."
            }
        }


class STTResponse(BaseModel):
    """STT 변환 응답"""
    file_path: str = Field(..., description="Original audio file path")
    language: str = Field(..., description="Detected/specified language")
    segments: List[TranscriptionSegment] = Field(..., description="Transcription segments")
    full_text: str = Field(..., description="Complete transcribed text")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_path": "downloads/dQw4w9WgXcQ.wav",
                "language": "ko",
                "segments": [
                    {
                        "start": 0.0,
                        "end": 5.2,
                        "text": "안녕하세요, 이것은 예시 텍스트입니다."
                    }
                ],
                "full_text": "안녕하세요, 이것은 예시 텍스트입니다."
            }
        }


class YouTubeSTTResponse(BaseModel):
    """YouTube + STT 통합 응답"""
    youtube_info: dict = Field(..., description="YouTube video information")
    download_info: dict = Field(..., description="Download information")
    stt_result: STTResponse = Field(..., description="STT transcription result")
    
    class Config:
        json_schema_extra = {
            "example": {
                "youtube_info": {
                    "title": "Example Video",
                    "duration": 240,
                    "uploader": "Example Channel"
                },
                "download_info": {
                    "file_path": "downloads/dQw4w9WgXcQ.wav",
                    "title": "Example Video",
                    "duration": 240
                },
                "stt_result": {
                    "file_path": "downloads/dQw4w9WgXcQ.wav",
                    "language": "ko",
                    "segments": [],
                    "full_text": "전체 전사 텍스트"
                }
            }
        }