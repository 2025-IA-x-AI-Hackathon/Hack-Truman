import yt_dlp
import os
from pathlib import Path
from app.youtube.schemas import YouTubeInfo
from fastapi import HTTPException

class YouTubeService:
    def __init__(self):
        self.download_dir = Path("downloads")
        self.download_dir.mkdir(exist_ok=True)

    async def get_info(self, url: str) -> YouTubeInfo:
        """YouTube 영상 정보 가져오기"""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'noprogress': True,
            'ignoreerrors': False,
            'extractor_args': {'youtube': {'skip': ['hls', 'dash']}},
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            youtube_info = YouTubeInfo(
                title=info.get('title'),
                duration=info.get('duration'),
                uploader=info.get('uploader'),
                thumbnail=info.get('thumbnail'),
                description=info.get('description'),
                view_count=info.get('view_count'),
            )

            return youtube_info
    
    async def download_audio(self, url: str) -> dict:
        """YouTube 영상을 WAV로 다운로드"""
        output_path = self.download_dir / '%(id)s.%(ext)s'

        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
            }],
            'outtmpl': str(output_path),
            'quiet': True,
            'no_warnings': True,
            'noprogress': True,
            'extractor_args': {'youtube': {'skip': ['hls', 'dash']}},
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_id = info.get('id')
            file_path = self.download_dir / f"{video_id}.wav"
            
            return {
                "file_path": str(file_path),
                "title": info.get('title'),
                "duration": info.get('duration'),
            }