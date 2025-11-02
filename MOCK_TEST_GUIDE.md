# Mock 서버를 이용한 프론트엔드 테스팅 가이드

## 🚀 빠른 시작

### 1. Mock 서버 실행
```bash
cd front
npm run server
```
Mock 서버가 `http://localhost:8000`에서 실행됩니다.

### 2. React 프론트엔드 실행
새 터미널에서:
```bash
cd front
npm run dev
```
프론트엔드가 `http://localhost:5173`에서 실행됩니다.

## 📝 테스트 시나리오

### 시나리오 1: 직접 URL 테스트 (확장 프로그램 없이)

1. 브라우저에서 다음 URL로 접속:
   ```
   http://localhost:5173/?videoUrl=https://www.youtube.com/shorts/test123
   ```

2. 브라우저 콘솔(F12)을 열고 다음 명령어 실행:
   ```javascript
   // Mock 다운로드 완료 메시지 보내기
   window.postMessage({
     type: 'DOWNLOAD_READY',
     data: {
       videoUrl: 'https://www.youtube.com/shorts/test123',
       filePath: '/downloads/test_video.wav',
       timestamp: Date.now(),
       status: 'ready'
     }
   }, '*');
   ```

3. 확인할 수 있는 것들:
   - Loading 화면 → Extract 화면으로 전환
   - Argument Graph 표시
   - Transcript 텍스트 표시
   - Summary 통계 표시

### 시나리오 2: WebSocket 연결 테스트

1. 프론트엔드를 열고 콘솔에서 WebSocket 직접 테스트:
   ```javascript
   // WebSocket 연결 생성
   const ws = new WebSocket('ws://localhost:8000/ws/analyze');

   // 연결 열림 이벤트
   ws.onopen = () => {
     console.log('WebSocket connected');

     // 분석 요청 전송
     ws.send(JSON.stringify({
       file_path: '/test/video.wav',
       language: 'en'
     }));
   };

   // 메시지 수신
   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     console.log('Received:', data.stage, data);
   };
   ```

### 시나리오 3: YouTube 다운로드 API 테스트

터미널이나 Postman에서:
```bash
curl -X POST http://localhost:8000/api/youtube/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/shorts/test123"}'
```

예상 응답:
```json
{
  "status": "success",
  "file_path": "/downloads/mock_video_1234567890.wav",
  "download_info": {
    "file_path": "/downloads/mock_video_1234567890.wav",
    "title": "Climate Change Impact Analysis",
    "duration": 180.5,
    "filesize": 28500000
  }
}
```

## 🔍 디버깅 팁

### 콘솔에서 확인할 메시지들

#### Mock 서버 콘솔:
```
Mock server running on http://localhost:8000
WebSocket endpoint: ws://localhost:8000/ws/analyze
New WebSocket client connected
Received WebSocket message: { file_path: '/test/video.wav', language: 'en' }
Sent extract data
Sent candidates
Sent verification for fact_1
Sent verification for fact_2
Sent conclusion
Analysis complete
```

#### 브라우저 콘솔 (React):
```
확장 프로그램에서 전달받은 videoUrl: https://www.youtube.com/shorts/test123
Download ready from extension: {filePath: '/downloads/test_video.wav', ...}
Received extract data: {argument_graph: {...}, summary: {...}, full_text: '...'}
Received candidates: {candidates: [...]}
Received verification: {candidateId: 'fact_1', verification: {...}}
Received conclusion: {claimCount: 12, factCount: 18, ...}
Analysis complete: {message: 'Analysis completed successfully', ...}
```

## 🛠️ Mock 데이터 수정하기

`front/server.js` 파일에서 다음 데이터를 수정할 수 있습니다:

### 1. Extract 데이터 수정
```javascript
const sampleExtractData = {
  argument_graph: {
    nodes: [
      // 노드 추가/수정
      {
        id: 'custom_node',
        type: 'claim',
        text: '커스텀 주장',
        timestamp: 10.5,
        confidence: 0.9
      }
    ],
    edges: [
      // 관계 추가/수정
    ]
  },
  summary: {
    // 통계 수정
    claims: 20,
    facts: 30
  },
  full_text: "커스텀 텍스트..."
};
```

### 2. WebSocket 타이밍 조정
```javascript
// Stage 1: Send extract data
setTimeout(() => {
  ws.send(JSON.stringify({
    stage: 'extract',
    data: sampleExtractData
  }));
}, 1000);  // 이 값을 변경하여 지연 시간 조정
```

## 📊 테스트 체크리스트

- [ ] Mock 서버가 포트 8000에서 실행 중
- [ ] React 앱이 포트 5173에서 실행 중
- [ ] URL 파라미터로 videoUrl 전달 시 로딩 화면 표시
- [ ] postMessage로 DOWNLOAD_READY 전송 시 WebSocket 연결
- [ ] Extract 데이터 수신 후 UI 업데이트
  - [ ] Argument Graph 렌더링
  - [ ] Transcript 텍스트 표시
  - [ ] Summary 통계 표시
- [ ] Candidates 수신 후 분류 화면 표시
- [ ] Verifications 순차적으로 수신
- [ ] Conclusion 수신 후 최종 화면 표시

## 🎯 일반적인 문제 해결

### 1. WebSocket 연결 실패
- Mock 서버가 실행 중인지 확인
- 포트 8000이 사용 중인지 확인: `lsof -i :8000`
- CORS 설정 확인

### 2. postMessage가 작동하지 않음
- 브라우저 콘솔에서 직접 실행
- React 앱이 메시지 리스너를 등록했는지 확인
- `event.source !== window` 조건 확인

### 3. UI가 업데이트되지 않음
- WorkflowContext의 상태 업데이트 함수 확인
- WebSocket 메시지 형식 확인
- React DevTools로 상태 확인

## 💡 추가 테스트 아이디어

1. **에러 시나리오 테스트**
   ```javascript
   window.postMessage({
     type: 'DOWNLOAD_ERROR',
     error: 'Failed to download video'
   }, '*');
   ```

2. **실시간 업데이트 시뮬레이션**
   - Mock 서버에서 verification 지연 시간 늘리기
   - 각 단계별 UI 전환 확인

3. **대용량 데이터 테스트**
   - `sampleExtractData`에 많은 노드 추가
   - 성능 및 렌더링 확인

## 📌 참고 사항

- Mock 서버는 실제 백엔드 동작을 시뮬레이션합니다
- 실제 YouTube 다운로드는 수행하지 않습니다
- 모든 데이터는 `front/server.js`에 하드코딩되어 있습니다
- 테스트 완료 후 실제 백엔드로 전환 시 URL만 변경하면 됩니다