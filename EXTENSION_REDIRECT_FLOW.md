# Chrome 확장 프로그램 - FactRay 페이지 리다이렉션 흐름

## 개요
사용자가 YouTube Shorts에서 "분석 시작" 버튼을 클릭하면 즉시 FactRay 분석 페이지로 이동하고, 백그라운드에서 분석이 진행됩니다.

## 수정 사항

### 1. Extension - analysis-manager.js
**변경 전:**
- 분석 완료를 기다린 후 페이지 이동

**변경 후:**
- 즉시 FactRay 페이지로 리다이렉션 (`window.open()`)
- 백그라운드에서 비동기로 분석 진행 (`runAnalysisInBackground()`)

```javascript
// 1. 즉시 FactRay 페이지로 리다이렉션
const analysisUrl = `http://localhost:5173/?videoUrl=${encodeURIComponent(videoUrl)}`;
window.open(analysisUrl, '_blank');

// 2. 백그라운드에서 분석 진행 (비동기)
this.runAnalysisInBackground(videoUrl);
```

### 2. Frontend - App.jsx
**추가 기능:**
- URL 파라미터에서 `videoUrl` 추출
- 자동으로 분석 요청 발송 (`send()`)
- 로딩 단계로 즉시 이동

```javascript
// URL 파라미터에서 videoUrl 추출
const params = new URLSearchParams(window.location.search);
const videoUrl = params.get('videoUrl');

if (videoUrl) {
  // 1. 로딩 단계로 이동
  moveToStep(WORKFLOW_STEPS.LOADING);

  // 2. 비디오 정보 설정
  updateVideoData({ title: 'YouTube Video', url: videoUrl, ... });

  // 3. WebSocket으로 분석 요청 전송
  setTimeout(() => {
    send({ file_path: videoUrl, language: 'en' });
  }, 500);
}
```

## 전체 흐름

```
🎬 YouTube Shorts 페이지
    ↓
[분석 시작] 버튼 클릭
    ↓
AnalysisManager.startAnalysis(videoUrl)
    ↓
✨ 즉시 FactRay 페이지로 리다이렉션
   http://localhost:5173/?videoUrl=...
    ↓
⏳ 로딩 화면 표시
    ↓
🔄 백그라운드에서 분석 시작:
   1️⃣ YouTube 영상 다운로드
      POST /api/youtube/download

   2️⃣ WebSocket 분석 요청
      WS /ws/analyze

   3️⃣ Extract 데이터 수신
      - full_text
      - argument_graph
      - summary
    ↓
✅ Extract 화면 표시
    (동시에 백엔드에서 분석 중)
    ↓
📊 분석 결과 표시 (실시간 업데이트)
```

## URL 파라미터

### 확장 프로그램에서 전달하는 URL
```
http://localhost:5173/?videoUrl=https://www.youtube.com/shorts/[videoId]
```

### URL 파라미터 추출
```javascript
const params = new URLSearchParams(window.location.search);
const videoUrl = params.get('videoUrl');
```

## 주요 개선 사항

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| **페이지 이동 타이밍** | 분석 완료 후 | 즉시 |
| **사용자 경험** | 오래 대기 | 즉시 로딩 화면 표시 |
| **분석 프로세스** | 동기 | 백그라운드 비동기 |
| **반응성** | 낮음 | 높음 |

## 데이터 흐름

### 확장 프로그램 → 프론트엔드
```
URL 파라미터: ?videoUrl=...
```

### 프론트엔드 → 백엔드
```javascript
// WebSocket 메시지
{
  file_path: "https://www.youtube.com/shorts/...",  // YouTube URL
  language: "en"
}
```

### 백엔드 처리
```
1. YouTube 영상 다운로드
   POST /api/youtube/download
   → 파일 경로 반환

2. WebSocket으로 분석 요청
   WS /ws/analyze
   → Extract 데이터 전송
```

## 에러 처리

### 확장 프로그램에서 에러 발생
```javascript
alert('분석 중 오류가 발생했습니다: {error.message}');
```

### 프론트엔드에서 에러 수신
```javascript
on('error', (error) => {
  console.error('WebSocket error:', error);
  // 에러 처리
});
```

## 테스트 체크리스트

- [ ] FastAPI 서버 실행 (`localhost:8000`)
- [ ] React 개발 서버 실행 (`localhost:5173`)
- [ ] Chrome 확장 프로그램 로드
- [ ] YouTube Shorts 페이지 접속
- [ ] "분석 시작" 버튼 클릭
- [ ] FactRay 페이지가 새 탭에서 열림
- [ ] 로딩 화면 표시됨
- [ ] Extract 데이터 수신 확인
- [ ] 분석 결과 표시됨

## 주의사항

1. **CORS 설정**: FastAPI와 React가 다른 포트이므로 CORS 허용 필요
2. **WebSocket 연결**: 500ms 지연 후 요청 (연결 보장)
3. **파일 경로**: YouTube URL을 그대로 전달 (백엔드에서 처리)
