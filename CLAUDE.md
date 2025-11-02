# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FactRay is a fact-checking application for YouTube Shorts videos. It consists of three components:
1. **Backend (FastAPI)**: YouTube download, Speech-to-Text with WhisperX, argument graph generation, and LLM-based fact verification
2. **Frontend (React + Vite)**: Analysis visualization interface
3. **Chrome Extension**: YouTube Shorts integration for triggering analysis

The system downloads YouTube videos, transcribes audio, classifies claims vs. facts, builds argument graphs, and verifies claims using multiple LLM providers (Gemini, Groq, Ollama).

## Architecture

### Backend Structure ([server/app/](server/app/))

**Main Application** ([main.py](server/app/main.py)):
- FastAPI app with CORS enabled for `*` origins
- Initializes WhisperX singleton on startup
- Registers three router modules: YouTube, STT (WhisperX), LLM

**YouTube Module** ([app/youtube/](server/app/youtube/)):
- `service.py`: Uses yt-dlp to download audio as WAV, extract metadata, send WebSocket events
- `router.py`: Endpoints for `/info`, `/download`, `/process` (download + STT)
- `schemas.py`: Pydantic models for requests/responses

**WhisperX Module** ([app/whisperx/](server/app/whisperx/)):
- `service.py`: Singleton WhisperX service with model caching, transcription, alignment
- `router.py`: Endpoints for `/transcribe`, `/transcribe-with-graph`, model/cache management
- `schemas.py`: Pydantic models for transcription segments, argument graphs, claim-evidence mappings
- `graph_service.py`: Builds argument graphs from classified segments
- `cache_service.py`: Caches STT results to avoid re-processing
- `system_prompt.py`: Prompts for claim/fact classification
- `convert_claim_fact_mapped.py`: Converts argument graphs to claim-evidence format

**LLM Module** ([app/llm/](server/app/llm/)):
- `ask.py`: Multi-provider fact-checking endpoint (`/ask`) that queries Ollama, Gemini, and Groq in parallel
- Returns aggregated verdict (TRUE/FALSE/UNCERTAIN) with confidence score
- Handles model fallbacks and API errors

### Frontend Structure ([front/](front/))

**React + Vite application** with Socket.IO for real-time updates:
- `server.js`: Mock WebSocket server for testing (emulates backend stages)
- Development server runs on `localhost:5173`
- Receives analysis stages via WebSocket: extract → candidates → verifications → conclusion

### Chrome Extension ([extension/](extension/))

**Manifest V3 extension** that injects UI into YouTube Shorts:
- Content scripts for YouTube pages and localhost:5173
- Background service worker for video downloads
- Redirects to FactRay frontend with video URL parameter

## Development Commands

### Backend Setup
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Environment Variables** (create [server/.env](server/.env)):
```bash
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
OLLAMA_HOST_URL=http://localhost:11434  # Optional
OLLAMA_MODEL=llama3  # Optional
GEMINI_MODEL=gemini-1.5-flash-latest  # Optional
GROQ_MODEL=llama-3.1-70b-versatile  # Optional
```

**Run Backend**:
```bash
cd server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Or with uv:
uv run uvicorn app.main:app --reload
```
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Frontend Setup
```bash
cd front
npm install
npm run dev  # Development server on localhost:5173
npm run server  # Mock WebSocket server on localhost:8000
npm run dev:all  # Run both concurrently
```

### Chrome Extension
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

## Key Dependencies

**Backend** ([server/requirements.txt](server/requirements.txt)):
- `fastapi==0.115.5`, `uvicorn[standard]==0.32.1`: Web framework
- `yt-dlp==2025.10.22`: YouTube video/audio download
- `whisperx==3.7.4`: Speech-to-Text with alignment
- `torch`, `torchaudio`: ML framework for WhisperX
- `google-generativeai`: Gemini API client
- `ffmpeg-python`: Audio processing (requires system FFmpeg)

**Frontend** ([front/package.json](front/package.json)):
- `react`, `react-dom`: UI framework
- `socket.io-client`: Real-time communication
- `axios`: HTTP client
- `framer-motion`: Animations
- `vite`: Build tool

## Testing Flow

See [TEST_FLOW.md](TEST_FLOW.md) and [MOCK_TEST_GUIDE.md](MOCK_TEST_GUIDE.md) for complete testing instructions.

**Quick Test (with mock server)**:
```bash
# Terminal 1
cd front && npm run server

# Terminal 2
cd front && npm run dev

# Browser
http://localhost:5173/?videoUrl=https://www.youtube.com/shorts/test123
```

**Full Integration Test**:
1. Start backend: `cd server && uvicorn app.main:app --reload`
2. Start frontend: `cd front && npm run dev`
3. Load Chrome extension
4. Navigate to YouTube Shorts and click "분석 시작"

## Data Flow

```
YouTube Shorts → Extension → FactRay Frontend (localhost:5173)
                    ↓
              Backend /api/youtube/download
                    ↓
              WhisperX STT (/api/stt/transcribe-with-graph)
                    ↓
              Argument Graph Generation (claims vs. facts)
                    ↓
              LLM Fact Verification (/ask) - parallel queries
                    ↓
              WebSocket → Frontend (real-time updates)
```

## File Structure

```
.
├── server/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── youtube/          # YouTube download module
│   │   ├── whisperx/         # STT + argument graph
│   │   └── llm/              # Multi-provider fact-checking
│   ├── downloads/            # Audio files (gitignored)
│   ├── cache/stt/            # STT cache (gitignored)
│   └── requirements.txt
├── front/
│   ├── src/                  # React components
│   ├── server.js             # Mock WebSocket server
│   └── package.json
├── extension/
│   ├── manifest.json         # Chrome extension config
│   ├── youtube/              # YouTube page scripts
│   ├── background.js         # Service worker
│   └── content-script.js     # Frontend integration
└── CLAUDE.md                 # This file
```

## Important Notes

1. **WhisperX Singleton**: Models are loaded once at startup and cached. Use `/api/stt/cleanup` to free memory.
2. **STT Caching**: Transcriptions are cached in [server/cache/stt/](server/cache/stt/) by file path hash + language.
3. **WebSocket Reference**: The YouTube service imports `WebSocketClient` but socket.py doesn't exist in repo (may be in progress).
4. **LLM Providers**: `/ask` endpoint queries all configured providers in parallel. Requires at least one API key set.
5. **FFmpeg Required**: System must have FFmpeg installed for yt-dlp audio extraction.
