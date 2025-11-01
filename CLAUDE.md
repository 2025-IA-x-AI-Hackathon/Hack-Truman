# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FastAPI-based backend service for YouTube audio processing and Speech-to-Text (STT) operations. The application is currently in early development with a focus on YouTube video downloading and audio extraction using yt-dlp.

## Architecture

### Application Structure

The project follows a modular FastAPI architecture:

- **[server/app/main.py](server/app/main.py)**: FastAPI application entry point with CORS middleware configured for unrestricted access
- **[server/app/youtube/](server/app/youtube/)**: YouTube-related functionality module
  - `router.py`: API endpoints for YouTube operations
  - `service.py`: Business logic using yt-dlp for video info extraction and audio download
  - `schemas.py`: Pydantic models (currently empty - needs implementation)
  - `__init__.py`: Module exports

### Key Components

**YouTubeService** ([server/app/youtube/service.py](server/app/youtube/service.py)):
- Downloads YouTube audio as WAV files using yt-dlp with FFmpeg post-processing
- Stores files in `downloads/` directory with pattern `{video_id}.wav`
- Extracts video metadata (title, duration, uploader, thumbnail, description, view_count)

**Router Integration**: The YouTube router is currently NOT included in the main FastAPI app (commented out at [main.py:18](server/app/main.py#L18))

## Development Commands

### Environment Setup
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Server
```bash
cd server
uvicorn app.main:app --reload
```

The server runs on `http://localhost:8000` by default.
- API documentation: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Dependencies

Core dependencies ([server/requirements.txt](server/requirements.txt)):
- `fastapi==0.104.1`: Web framework
- `uvicorn[standard]==0.24.0`: ASGI server
- `pydantic==2.5.0`: Data validation
- `python-multipart==0.0.6`: Form data parsing
- `yt-dlp==2025.10.22`: YouTube video/audio processing

**External dependency**: FFmpeg is required for audio extraction (yt-dlp uses it for post-processing)

## Known Issues

1. **Router Not Registered**: The YouTube router is commented out in [main.py:18](server/app/main.py#L18), so YouTube endpoints are not accessible
2. **Empty Schemas**: [schemas.py](server/app/youtube/schemas.py) exists but is empty - the router references `YouTubeInfo`, `YouTubeDownloadRequest`, and `YouTubeDownloadResponse` that need to be defined
3. **Missing Error Handling**: No validation for YouTube URL format or yt-dlp failures beyond basic exception catching

## API Design Pattern

The codebase uses async/await throughout, even though yt-dlp operations are synchronous. Consider using `asyncio.to_thread()` or similar for actual async behavior when making changes.

## File Organization

```
server/
├── app/
│   ├── main.py           # FastAPI app with middleware
│   └── youtube/          # YouTube feature module
│       ├── __init__.py   # Module exports
│       ├── router.py     # API endpoints
│       ├── service.py    # Business logic
│       └── schemas.py    # Pydantic models (empty)
├── downloads/            # Created at runtime for audio files
└── requirements.txt      # Python dependencies
```
