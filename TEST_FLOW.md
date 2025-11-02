# Testing the Complete Flow

## Setup Instructions

### 1. Start the Backend Server
```bash
cd server
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn app.main:app --reload
```
Server should be running at http://localhost:8000

### 2. Start the React Frontend
```bash
cd front
npm start
```
Frontend should be running at http://localhost:5173

### 3. Load the Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/Users/haecho/projects/Hack-Truman/extension` folder
5. The FactRay Extension should appear in your extensions list

## Testing Flow

### Test 1: Basic Flow
1. Go to a YouTube Shorts page (e.g., https://www.youtube.com/shorts/[VIDEO_ID])
2. Wait for the "분석 시작" button to appear in the YouTube page
3. Click the "분석 시작" button
4. You should be redirected to http://localhost:5173/?videoUrl=[VIDEO_URL]
5. The React app should:
   - Show loading state
   - Receive DOWNLOAD_READY message from extension
   - Send WebSocket request to backend with file_path
   - Receive extract data via WebSocket
   - Display the analysis results

### What to Check in Console

#### YouTube Page Console:
- "분석 시작 버튼 추가됨" - Button added
- "분석 시작:" - Analysis started
- "백그라운드 영상 다운로드 시작:" - Download started

#### React App Console (http://localhost:5173):
- "FactRay content script loaded" - Content script loaded
- "확장 프로그램에서 전달받은 videoUrl:" - Received video URL
- "Download ready from extension:" - Received download complete message
- "Received extract data:" - WebSocket data received

#### Backend Server Logs:
- POST /api/youtube/download - Download endpoint called
- WebSocket connection accepted at /ws/analyze
- Extract data sent via WebSocket

## Architecture Overview

```
Chrome Extension (YouTube)
    ↓ (redirect with videoUrl)
React App (localhost:5173)
    ↑ (postMessage via content script)
Chrome Extension Background
    ↓ (download video)
FastAPI Backend
    ↓ (return file_path)
Chrome Extension
    ↓ (send DOWNLOAD_READY message)
React App
    ↓ (WebSocket request with file_path)
FastAPI Backend (WebSocket)
    ↓ (send extract data)
React App (Display results)
```

## Troubleshooting

### Extension not working:
- Check if extension is loaded in chrome://extensions/
- Reload the extension after any changes
- Check for errors in extension's background page console

### Messages not received in React:
- Check if content script is loaded (console should show "FactRay content script loaded")
- Verify the React app is running on http://localhost:5173
- Check browser console for any CORS or security errors

### WebSocket connection fails:
- Ensure backend is running on http://localhost:8000
- Check if WebSocket endpoint is accessible at ws://localhost:8000/ws/analyze
- Look for connection errors in React console

### Download fails:
- Check if backend /api/youtube/download endpoint is working
- Verify yt-dlp and ffmpeg are installed on the system
- Check backend logs for download errors