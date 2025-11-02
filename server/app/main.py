from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.youtube import router as youtube_router
from app.whisperx.router import router as whisperx_router
from app.whisperx import WhisperXService
from app.llm.ask import router as llm_router
from app.analysis import router as analysis_router
from app.socket_manager import socket_app

app = FastAPI(
    title="STT & OpenAI API",
    description="Speech-to-Text와 OpenAI API 서비스",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "API Support",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WhisperX 싱글톤 인스턴스 초기화
WhisperXService.get_instance()

app.include_router(youtube_router, prefix="/api/youtube", tags=["YouTube"])
app.include_router(whisperx_router, prefix="/api/stt", tags=["STT"])
app.include_router(llm_router)
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])

# Socket.IO 마운트
app.mount("/socket.io", socket_app)


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint that provides basic API information and documentation links.
    """
    return {
        "message": "STT & OpenAI API Server",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json",
        "endpoints": {
            "youtube_info": "/api/youtube/info",
            "youtube_download": "/api/youtube/download", 
            "youtube_process": "/api/youtube/process",
            "stt_transcribe": "/api/stt/transcribe"
        }
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify the API is running properly.
    
    Returns:
        dict: Status information
    """
    return {"status": "healthy"}
