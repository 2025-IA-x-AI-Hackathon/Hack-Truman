from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

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
                "language": "en",
                "segments": [
                    {
                        "start": 0.0,
                        "end": 5.2,
                        "text": "안녕하세요, 이것은 예시 텍스트입니다."
                    }
                ],
                "full_text": "안녕하세요, 이것은 예시 텍스트입니다.",
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


class SentenceType(str, Enum):
    """문장 유형"""
    CLAIM = "CLAIM"    # 주장
    FACT = "FACT"      # 사실


class ClassifiedSegment(BaseModel):
    """분류된 세그먼트"""
    id: str = Field(..., description="세그먼트 고유 ID")
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    text: str = Field(..., description="Transcribed text")
    classification: SentenceType = Field(..., description="분류 결과 (CLAIM/FACT)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "seg_1",
                "start": 0.0,
                "end": 5.2,
                "text": "이 정책은 효과적입니다.",
                "classification": "CLAIM"
            }
        }


class GraphEdge(BaseModel):
    """그래프 엣지 (연결)"""
    source_id: str = Field(..., description="소스 세그먼트 ID")
    target_id: str = Field(..., description="타겟 세그먼트 ID")
    relationship: str = Field(..., description="관계 유형 (supports, contradicts, relates)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="관계 신뢰도")
    
    class Config:
        json_schema_extra = {
            "example": {
                "source_id": "seg_2",
                "target_id": "seg_1", 
                "relationship": "supports",
                "confidence": 0.85
            }
        }


class ArgumentGraph(BaseModel):
    """논증 그래프"""
    nodes: List[ClassifiedSegment] = Field(..., description="그래프 노드들 (분류된 세그먼트)")
    edges: List[GraphEdge] = Field(..., description="그래프 엣지들 (관계)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "nodes": [
                    {
                        "id": "seg_1",
                        "start": 0.0,
                        "end": 5.2,
                        "text": "이 정책은 효과적입니다.",
                        "classification": "CLAIM"
                    },
                    {
                        "id": "seg_2", 
                        "start": 5.2,
                        "end": 10.1,
                        "text": "연구에 따르면 70% 개선되었습니다.",
                        "classification": "FACT"
                    }
                ],
                "edges": [
                    {
                        "source_id": "seg_2",
                        "target_id": "seg_1",
                        "relationship": "supports",
                        "confidence": 0.85
                    }
                ]
            }
        }


class STTWithGraphResponse(BaseModel):
    """STT + 그래프 분석 응답"""
    file_path: str = Field(..., description="Original audio file path")
    language: str = Field(..., description="Detected/specified language")
    full_text: str = Field(..., description="Complete transcribed text")
    argument_graph: ArgumentGraph = Field(..., description="논증 그래프")
    summary: dict = Field(..., description="분석 요약")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_path": "downloads/example.wav",
                "language": "ko",
                "full_text": "전체 전사 텍스트",
                "argument_graph": {
                    "nodes": [],
                    "edges": []
                },
                "summary": {
                    "total_segments": 5,
                    "claims": 2,
                    "facts": 3,
                    "relationships": 4
                }
            }
        }