import whisperx
import torch
import os
from pathlib import Path
from typing import Optional, Dict, Any
from threading import Lock
from app.whisperx.schemas import STTResponse, TranscriptionSegment


def exist_text_translate(path: str) -> bool:
    return os.path.exists(path)

class WhisperXService:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(WhisperXService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.compute_type = "float16" if torch.cuda.is_available() else "int8"
        self.models: Dict[str, Any] = {}  # 모델 크기별 캐시
        self.align_models: Dict[str, tuple] = {}  # 언어별 정렬 모델 캐시
        self._model_lock = Lock()  # 모델 로딩 동기화
        self._initialized = True
        
        print(f"WhisperX Service initialized - Device: {self.device}, Compute Type: {self.compute_type}")
    
    def _load_model(self, model_size: str = "large-v2"):
        """WhisperX 모델 로드 (싱글톤 캐시)"""
        if model_size not in self.models:
            with self._model_lock:
                if model_size not in self.models:
                    print(f"Loading WhisperX model: {model_size}")
                    self.models[model_size] = whisperx.load_model(
                        model_size, 
                        self.device, 
                        compute_type=self.compute_type
                    )
                    print(f"Model {model_size} loaded successfully")
        return self.models[model_size]
    
    def _load_align_model(self, language_code: str):
        """정렬 모델 로드 (싱글톤 캐시)"""
        if language_code not in self.align_models:
            with self._model_lock:
                if language_code not in self.align_models:
                    print(f"Loading alignment model for language: {language_code}")
                    try:
                        align_model, metadata = whisperx.load_align_model(
                            language_code=language_code, 
                            device=self.device
                        )
                        self.align_models[language_code] = (align_model, metadata)
                        print(f"Alignment model for {language_code} loaded successfully")
                    except Exception as e:
                        print(f"Failed to load alignment model for {language_code}: {e}")
                        return None, None
        return self.align_models[language_code]
    
    async def transcribe_audio(
        self, 
        file_path: str, 
        language: Optional[str] = None,
        model_size: str = "large-v2"
    ) -> STTResponse:
        """
        오디오 파일을 텍스트로 변환
        
        Args:
            file_path: 오디오 파일 경로
            language: 언어 코드 (None이면 자동 감지)
            model_size: WhisperX 모델 크기
            
        Returns:
            STTResponse: 전사 결과
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        
        # 모델 로드
        model = self._load_model(model_size)
        
        # 오디오 로드
        audio = whisperx.load_audio(file_path)
        
        # 전사 수행
        result = model.transcribe(audio, batch_size=16)
        
        # 언어 감지 결과
        detected_language = result.get("language", language or "en")
        
        # 정렬 모델 로드 및 정렬 수행 
        try:
            align_model, metadata = self._load_align_model(detected_language)
            if not align_model or not metadata:
                raise RuntimeError("Alignment model or metadata not loaded")

            aligned = whisperx.align(
                result["segments"],
                align_model,
                metadata,
                audio,
                self.device,
                return_char_alignments=False,
            )
            result["segments"] = aligned["segments"]
            result["aligned"] = True

        except Exception as e:
            print(f"[WARN] Alignment failed: {e}. Using original timestamps.")
            result["aligned"] = False
        # 화자 분리 (선택사항)
        # diarize_model = whisperx.DiarizationPipeline(use_auth_token=YOUR_HF_TOKEN, device=device)
        # diarize_segments = diarize_model(audio)
        # result = whisperx.assign_word_speakers(diarize_segments, result)
        
        # 결과 변환
        segments = []
        full_text_parts = []
        
        for segment in result.get("segments", []):
            seg = TranscriptionSegment(
                start=segment.get("start", 0.0),
                end=segment.get("end", 0.0),
                text=segment.get("text", "").strip()
            )
            segments.append(seg)
            if seg.text:
                full_text_parts.append(seg.text)
        
        full_text = " ".join(full_text_parts)
        
        return STTResponse(
            file_path=file_path,
            language=detected_language,
            segments=segments,
            full_text=full_text
        )
    
    def cleanup_models(self):
        """메모리 정리"""
        with self._model_lock:
            for model_size in list(self.models.keys()):
                del self.models[model_size]
            self.models.clear()
            
            for language in list(self.align_models.keys()):
                align_model, metadata = self.align_models[language]
                del align_model, metadata
            self.align_models.clear()
            
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            print("All WhisperX models cleaned up from memory")
    
    def get_loaded_models_info(self):
        """로드된 모델 정보 반환"""
        return {
            "whisper_models": list(self.models.keys()),
            "align_models": list(self.align_models.keys()),
            "device": self.device,
            "compute_type": self.compute_type
        }
    
    @classmethod
    def get_instance(cls):
        """싱글톤 인스턴스 반환"""
        if cls._instance is None:
            instance = cls()
            instance._load_model()
        return cls._instance