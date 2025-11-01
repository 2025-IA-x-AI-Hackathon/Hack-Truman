from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="STT & OpenAI API",
    description="Speech-to-Text와 OpenAI API 서비스",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(stt_router, prefix="/api/youtube", tags=["STT"])

@app.get("/")
async def root():
    return {
        "message": "STT & OpenAI API Server",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}