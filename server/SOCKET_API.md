# Socket.IO API 문서

## 개요

FactRay 백엔드는 실시간 분석 상태를 프론트엔드에 전달하기 위해 Socket.IO를 사용합니다.

## 연결 정보

- **Socket.IO 서버**: `http://localhost:8000/socket.io`
- **분석 API 엔드포인트**: `GET /api/analysis`

## API 엔드포인트

### GET /api/analysis

YouTube 비디오를 분석하고 각 단계별로 Socket.IO 이벤트를 전송합니다.

**Parameters:**
- `videoURL` (required): YouTube 비디오 URL

**Response:**
```json
{
  "status": true
}
```

**처리 흐름:**
1. YouTube 정보 수집 → `info` 이벤트 전송
2. 오디오 다운로드
3. STT 전사 → `transcription` 이벤트 전송
4. 논증 그래프 생성 → `extract` 이벤트 전송
5. 결론 생성 → `conclusion` 이벤트 전송

## Socket.IO 이벤트

### 1. `info` 이벤트

영상 정보를 전송합니다.

**Payload:**
```javascript
{
  "title": "영상 제목",
  "thumbnail": "썸네일 URL",
  "step": "info"
}
```

**예시:**
```javascript
socket.on('info', (data) => {
  console.log(data.title);      // "Climate Change Impact"
  console.log(data.thumbnail);  // "https://i.ytimg.com/..."
  console.log(data.step);       // "info"
});
```

### 2. `transcription` 이벤트

STT 전사 스크립트를 전송합니다.

**Payload:**
```javascript
{
  "script": "전체 전사 텍스트",
  "step": "transcription"
}
```

**예시:**
```javascript
socket.on('transcription', (data) => {
  console.log(data.script);  // "안녕하세요. 오늘은 기후 변화에 대해..."
  console.log(data.step);    // "transcription"
});
```

### 3. `extract` 이벤트

논증 그래프 및 분석 데이터를 전송합니다.

**Payload:**
```javascript
{
  "full_text": "전체 텍스트",
  "argument_graph": {
    "nodes": [
      {
        "id": "seg_1",
        "start": 0.0,
        "end": 5.2,
        "text": "이 정책은 효과적입니다.",
        "classification": "CLAIM"
      },
      // ... more nodes
    ],
    "edges": [
      {
        "source_id": "seg_2",
        "target_id": "seg_1",
        "relationship": "supports",
        "confidence": 0.85
      },
      // ... more edges
    ]
  },
  "summary": {
    "total_segments": 10,
    "claims": 5,
    "facts": 5,
    "relationships": 8,
    "relationship_types": {"supports": 5, "contradicts": 2, "relates": 1},
    "avg_confidence": 0.82,
    "claim_evidence_mapping": { /* ... */ },
    "claim_evidence_summary": { /* ... */ }
  },
  "step": "extract"
}
```

**예시:**
```javascript
socket.on('extract', (data) => {
  console.log(data.argument_graph.nodes.length);  // 10
  console.log(data.summary.claims);                // 5
  console.log(data.summary.facts);                 // 5
});
```

### 4. `conclusion` 이벤트

최종 분석 결론을 전송합니다.

**Payload:**
```javascript
{
  "total_segments": 10,
  "claims": 5,
  "facts": 5,
  "relationships": 8,
  "avg_confidence": 0.82,
  "step": "conclusion"
}
```

**예시:**
```javascript
socket.on('conclusion', (data) => {
  console.log(`총 ${data.total_segments}개 세그먼트`);
  console.log(`주장: ${data.claims}, 사실: ${data.facts}`);
  console.log(`평균 신뢰도: ${data.avg_confidence}`);
});
```

## 사용 예시

### React (socket.io-client)

```javascript
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

function App() {
  const [socket, setSocket] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [extractData, setExtractData] = useState(null);
  const [conclusion, setConclusion] = useState(null);

  useEffect(() => {
    // Socket.IO 연결
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    // 이벤트 리스너 등록
    newSocket.on('info', (data) => {
      setVideoInfo(data);
    });

    newSocket.on('transcription', (data) => {
      setTranscript(data.script);
    });

    newSocket.on('extract', (data) => {
      setExtractData(data);
    });

    newSocket.on('conclusion', (data) => {
      setConclusion(data);
    });

    return () => newSocket.close();
  }, []);

  const startAnalysis = async (videoUrl) => {
    const response = await fetch(
      `http://localhost:8000/api/analysis?videoURL=${encodeURIComponent(videoUrl)}`
    );
    const result = await response.json();
    console.log('Analysis started:', result.status);
  };

  return (
    <div>
      <button onClick={() => startAnalysis('https://youtube.com/...')}>
        분석 시작
      </button>
      {videoInfo && <h1>{videoInfo.title}</h1>}
      {transcript && <p>{transcript}</p>}
      {extractData && <div>/* 논증 그래프 렌더링 */</div>}
      {conclusion && <div>완료: {conclusion.total_segments} 세그먼트</div>}
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
// Socket.IO 연결
const socket = io('http://localhost:8000');

// 이벤트 리스너
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('info', (data) => {
  console.log('Video info:', data);
  document.getElementById('title').textContent = data.title;
});

socket.on('transcription', (data) => {
  console.log('Transcript:', data);
  document.getElementById('transcript').textContent = data.script;
});

socket.on('extract', (data) => {
  console.log('Extract:', data);
  // 논증 그래프 렌더링
  renderArgumentGraph(data.argument_graph);
});

socket.on('conclusion', (data) => {
  console.log('Conclusion:', data);
  showFinalResults(data);
});

// 분석 시작
async function startAnalysis(videoUrl) {
  const response = await fetch(
    `http://localhost:8000/api/analysis?videoURL=${encodeURIComponent(videoUrl)}`
  );
  const result = await response.json();
  console.log('Started:', result.status);
}
```

## 테스트

### 1. HTML 테스트 클라이언트 사용

```bash
# 브라우저에서 열기
open server/test_socket_client.html
```

1. "연결" 버튼 클릭
2. YouTube URL 입력
3. "분석 시작" 버튼 클릭
4. 실시간 이벤트 수신 확인

### 2. 프론트엔드 통합 테스트

```bash
# 백엔드 실행
cd server
uvicorn app.main:app --reload

# 프론트엔드 실행 (별도 터미널)
cd front
npm run dev
```

## 에러 처리

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## 주의사항

1. **CORS**: Socket.IO 서버는 모든 origin(`*`)을 허용하도록 설정되어 있습니다.
2. **순서 보장**: 이벤트는 `info` → `transcription` → `extract` → `conclusion` 순서로 전송됩니다.
3. **연결 상태**: API 호출 전에 Socket.IO 연결이 성공했는지 확인하세요.
4. **재연결**: 연결이 끊어지면 socket.io-client가 자동으로 재연결을 시도합니다.
