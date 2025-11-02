# Chrome 확장 프로그램 - FastAPI 통합 흐름

## 개요
YouTube Shorts 확장 프로그램에서 "분석 시작" 버튼을 클릭하면 FastAPI 백엔드와 WebSocket으로 통신하여 영상 분석을 수행합니다.

## 전체 흐름

```
YouTube Shorts 페이지
    ↓
[분석 시작] 버튼 클릭
    ↓
AnalysisManager.startAnalysis(videoUrl)
    ↓
① YouTube 영상 다운로드
   POST /api/youtube/download
   Request: { url: "https://www.youtube.com/shorts/..." }
   Response: { file_path: "downloads/videoId.wav", ... }
    ↓
② WebSocket 분석 요청
   WS /ws/analyze
   Message: { file_path: "downloads/videoId.wav", language: "en" }
    ↓
백엔드 처리 (STT + 논증 그래프 분석)
    ↓
③ Extract 데이터 수신
   Message: {
     stage: "extract",
     data: {
       file_path: "downloads/videoId.wav",
       language: "en",
       full_text: "...",
       argument_graph: { nodes: [...], edges: [...] },
       summary: { total_segments: 5, claims: 0, facts: 5, ... }
     }
   }
    ↓
④ 분석 데이터 저장 (Chrome Storage)
    ↓
⑤ 분석 완료 알림 전송
   Background: ANALYSIS_DONE 메시지
    ↓
YouTube 탭에서 분석 완료 알림 표시
    ↓
사용자가 "결과 보기" 클릭
    ↓
분석 사이트 (localhost:5173)로 이동
```

## 주요 수정 사항

### 1. analysis-manager.js 수정
- **추가된 메서드:**
  - `fetchVideoAndGetFilePath(videoUrl)`: YouTube 영상 다운로드 API 호출
  - `startWebSocketAnalysis(filePath, videoUrl)`: WebSocket 연결 및 분석 요청
  - `handleExtractData(data, videoUrl)`: Extract 데이터 처리 및 저장

- **수정된 메서드:**
  - `startAnalysis(videoUrl)`: 백엔드 API 통신 추가

### 2. message-handler.js 수정
- **추가된 메서드:**
  - `notifyAnalysisComplete(videoUrl, resultUrl)`: 분석 완료 알림 백그라운드 전송

### 3. manifest.json 수정
- **host_permissions 추가:**
  - `"http://localhost:8000/*"` (FastAPI 백엔드 접근)

## API 엔드포인트

### 1. YouTube 영상 다운로드
```
POST http://localhost:8000/api/youtube/download
Content-Type: application/json

Request:
{
  "url": "https://www.youtube.com/shorts/..."
}

Response:
{
  "file_path": "downloads/videoId.wav",
  "title": "Video Title",
  "duration": 30,
  ...
}
```

### 2. WebSocket 분석
```
WS ws://localhost:8000/ws/analyze

Send:
{
  "file_path": "downloads/videoId.wav",
  "language": "en"
}

Receive (Extract Stage):
{
  "stage": "extract",
  "data": {
    "file_path": "downloads/videoId.wav",
    "language": "en",
    "full_text": "완전한 전사 텍스트...",
    "argument_graph": {
      "nodes": [
        {
          "id": "seg_1",
          "start": 0.0,
          "end": 5.2,
          "text": "...",
          "classification": "FACT"
        }
      ],
      "edges": []
    },
    "summary": {
      "total_segments": 5,
      "claims": 0,
      "facts": 5,
      "relationships": 0,
      "avg_confidence": 0
    }
  }
}

Receive (Complete):
{
  "stage": "complete",
  "message": "Analysis completed successfully"
}
```

## 에러 처리

### WebSocket 에러
```javascript
{
  "stage": "error",
  "error": "에러 메시지"
}
```

### HTTP 에러
```javascript
- 다운로드 실패 (404, 500 등)
- alert로 사용자에게 알림
```

## 데이터 저장 (Chrome Storage)
```javascript
chrome.storage.local.set({
  [`analysis_${timestamp}`]: {
    videoUrl: "...",
    timestamp: Date.now(),
    extractData: { ... }
  }
})
```

## 주의사항

1. **로컬호스트 URL**: 모든 URL이 `localhost:8000`과 `localhost:5173`로 설정되어 있습니다
2. **언어 설정**: 현재 기본값은 영어(`en`)입니다
3. **타임아웃**: WebSocket 요청은 30초 타임아웃이 설정되어 있습니다
4. **권한**: manifest.json에서 localhost:8000 접근 권한이 필요합니다

## 테스트 방법

1. FastAPI 서버 실행: `uvicorn app.main:app --reload` (포트 8000)
2. React 분석 사이트 실행: `npm run dev` (포트 5173)
3. Chrome에 확장 프로그램 로드
4. YouTube Shorts 페이지 방문
5. "분석 시작" 버튼 클릭
6. 콘솔에서 로그 확인
