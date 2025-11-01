"""
STT 결과 캐시 서비스
"""

import json
import hashlib
import os
from pathlib import Path
from typing import Optional
from app.whisperx.schemas import STTResponse


class STTCacheService:
    def __init__(self, cache_dir: str = "cache/stt"):
        """
        STT 캐시 서비스 초기화
        
        Args:
            cache_dir: 캐시 디렉토리 경로
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_key(self, file_path: str, language: str) -> str:
        """
        파일 경로와 언어로 캐시 키 생성
        
        Args:
            file_path: 오디오 파일 경로
            language: 언어 코드
            
        Returns:
            str: 캐시 키 (해시값)
        """
        # 파일의 수정 시간과 크기도 포함하여 캐시 키 생성
        try:
            stat = os.stat(file_path)
            cache_input = f"{file_path}_{language}_{stat.st_mtime}_{stat.st_size}"
        except OSError:
            cache_input = f"{file_path}_{language}"
        
        return hashlib.md5(cache_input.encode()).hexdigest()
    
    def _get_cache_file_path(self, cache_key: str) -> Path:
        """
        캐시 키로 캐시 파일 경로 생성
        
        Args:
            cache_key: 캐시 키
            
        Returns:
            Path: 캐시 파일 경로
        """
        return self.cache_dir / f"{cache_key}.json"
    
    def exists_cached_result(self, file_path: str, language: str) -> bool:
        """
        캐시된 STT 결과가 존재하는지 확인
        
        Args:
            file_path: 오디오 파일 경로
            language: 언어 코드
            
        Returns:
            bool: 캐시 존재 여부
        """
        cache_key = self._get_cache_key(file_path, language)
        cache_file = self._get_cache_file_path(cache_key)
        
        return cache_file.exists()
    
    def get_cached_result(self, file_path: str, language: str) -> Optional[STTResponse]:
        """
        캐시된 STT 결과 조회
        
        Args:
            file_path: 오디오 파일 경로
            language: 언어 코드
            
        Returns:
            Optional[STTResponse]: 캐시된 결과 (없으면 None)
        """
        try:
            cache_key = self._get_cache_key(file_path, language)
            cache_file = self._get_cache_file_path(cache_key)
            
            if not cache_file.exists():
                return None
            
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
            
            return STTResponse(**cached_data)
            
        except Exception as e:
            print(f"캐시 조회 오류: {e}")
            return None
    
    def save_result(self, file_path: str, language: str, result: STTResponse) -> bool:
        """
        STT 결과를 캐시에 저장
        
        Args:
            file_path: 오디오 파일 경로
            language: 언어 코드
            result: STT 결과
            
        Returns:
            bool: 저장 성공 여부
        """
        try:
            cache_key = self._get_cache_key(file_path, language)
            cache_file = self._get_cache_file_path(cache_key)
            
            # STTResponse를 딕셔너리로 변환
            result_dict = result.dict()
            
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(result_dict, f, ensure_ascii=False, indent=2)
            
            print(f"STT 결과 캐시 저장: {cache_file}")
            return True
            
        except Exception as e:
            print(f"캐시 저장 오류: {e}")
            return False
    
    def clear_cache(self) -> bool:
        """
        모든 캐시 파일 삭제
        
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink()
            
            print("STT 캐시 모두 삭제됨")
            return True
            
        except Exception as e:
            print(f"캐시 삭제 오류: {e}")
            return False
    
    def get_cache_info(self) -> dict:
        """
        캐시 정보 조회
        
        Returns:
            dict: 캐시 정보
        """
        cache_files = list(self.cache_dir.glob("*.json"))
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            "cache_dir": str(self.cache_dir),
            "cached_files": len(cache_files),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        }