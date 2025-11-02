import socketio
from typing import Optional
import asyncio

# Socket.IO 서버 생성 (CORS 설정 포함)
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # 프론트엔드 localhost:5173 허용
    logger=True,
    engineio_logger=True
)

# Socket.IO ASGI app 생성
socket_app = socketio.ASGIApp(sio)


class SocketManager:
    """WebSocket 연결 관리 및 이벤트 전송을 담당하는 싱글톤 클래스"""

    _instance: Optional['SocketManager'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SocketManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.sio = sio
        self._initialized = True
        print("SocketManager initialized")

    async def emit_info(self, data: dict):
        """영상 정보 전송 (step: 'info')"""
        await self.sio.emit('info', {
            'title': data.get('title'),
            'thumbnail': data.get('thumbnail'),
            'step': 'info'
        })
        print(f"Emitted info: {data.get('title')}")

    async def emit_transcription(self, data: dict):
        """전사 결과 전송 (step: 'transcription')"""
        await self.sio.emit('transcription', {
            'script': data.get('script'),
            'step': 'transcription'
        })
        print(f"Emitted transcription: {len(data.get('script', ''))} characters")

    async def emit_extract(self, data: dict):
        """추출 데이터 전송 (step: 'extract')"""
        await self.sio.emit('extract', {
            **data,
            'step': 'extract'
        })
        print(f"Emitted extract data")

    async def emit_conclusion(self, data: dict):
        """결론 데이터 전송 (step: 'conclusion')"""
        await self.sio.emit('conclusion', {
            **data,
            'step': 'conclusion'
        })
        print(f"Emitted conclusion data")

    @classmethod
    def get_instance(cls) -> 'SocketManager':
        """싱글톤 인스턴스 반환"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance


# Socket.IO 이벤트 핸들러
@sio.event
async def connect(sid, environ):
    """클라이언트 연결 시 호출"""
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    """클라이언트 연결 해제 시 호출"""
    print(f"Client disconnected: {sid}")


@sio.event
async def message(sid, data):
    """클라이언트로부터 메시지 수신"""
    print(f"Message from {sid}: {data}")
    await sio.emit('response', {'status': 'received'}, room=sid)
