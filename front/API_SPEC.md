# Fact+Ray API & Socket 명세서

## 📡 Socket.IO 통신

### 연결 정보
- **Server URL**: `http://localhost:3001`
- **Protocol**: WebSocket (Socket.IO)
- **Auto-reconnect**: 활성화 (최대 5회 시도)

---

## 🔄 클라이언트 → 서버

### 1. `request_analysis`
영상 분석을 시작하는 요청

**발송 시점**: 앱 초기화 시 (App.jsx useEffect)

**데이터 형식**:
```javascript
emit('request_analysis', {})
```

**응답**:
- `video_info` 이벤트 수신
- `transcript` 이벤트 수신
- `candidates` 이벤트 수신
- `verification` 이벤트 (반복)
- `conclusion` 이벤트 수신

---

## 🔀 서버 → 클라이언트

### 1. `video_info`
영상의 기본 정보 전송

**발송 시점**: `request_analysis` 수신 후 ~500ms

**데이터 형식**:
```javascript
{
  title: string,           // 영상 제목
  thumbnail: string,       // 썸네일 이미지 URL
  url: string             // 영상 URL
}
```

**상태 변화**: `INFO` 단계로 진행

**예시**:
```javascript
{
  title: 'The Impact of Climate Change on Global Economy 2024',
  thumbnail: 'https://via.placeholder.com/320x180?text=Climate+Change',
  url: 'https://www.youtube.com/watch?v=example'
}
```

---

### 2. `transcript`
영상 대본 정보 전송

**발송 시점**: `video_info` 후 ~1500ms

**데이터 형식**:
```javascript
{
  text: string,           // 전체 대본 텍스트
  timeline: Array<{
    time: number,         // 시작 시간 (초)
    duration: number      // 지속 시간 (초)
  }>
}
```

**상태 변화**: `EXTRACT` 단계로 진행

**예시**:
```javascript
{
  text: 'The global economy is facing unprecedented challenges...',
  timeline: [
    { time: 0, duration: 10 },
    { time: 15, duration: 12 },
    { time: 30, duration: 8 }
  ]
}
```

---

### 3. `candidates`
팩트/의견 후보 목록 전송

**발송 시점**: `transcript` 후 ~2000ms

**데이터 형식**:
```javascript
{
  candidates: Array<{
    id: string,              // 고유 ID
    type: 'fact' | 'claim', // 유형
    text: string,            // 후보 텍스트
    timestamp: string        // 영상 내 시간 (MM:SS)
  }>
}
```

**상태 변화**: `CLASSIFY` 단계로 진행

**예시**:
```javascript
{
  candidates: [
    {
      id: 'fact_1',
      type: 'fact',
      text: 'By 2050, climate-related losses could reach up to 23% of global GDP',
      timestamp: '0:05'
    },
    {
      id: 'claim_1',
      type: 'claim',
      text: 'Electric vehicles will completely replace gas cars by 2035',
      timestamp: '0:30'
    }
  ]
}
```

---

### 4. `verification`
개별 팩트/의견 검증 결과 전송 (개수만큼 반복)

**발송 시점**: `candidates` 후 ~2000ms부터 1초 간격

**데이터 형식**:
```javascript
{
  candidateId: string,     // 후보의 ID
  verification: {
    trustScore: number,    // 신뢰도 (0-100)
    reasoning: string,     // AI의 판단 근거
    references: Array<string> // 참고 자료 목록
  }
}
```

**상태 변화**: `VERIFY` 단계로 진행 (첫 수신 시)

**예시**:
```javascript
{
  candidateId: 'fact_1',
  verification: {
    trustScore: 75,
    reasoning: 'According to World Economic Forum and IMF reports, climate-related economic losses are estimated between 15-23% of global GDP by 2050...',
    references: [
      'World Economic Forum - Global Risks Report 2024',
      'International Monetary Fund - Climate Change Impact Study',
      'IPCC Sixth Assessment Report'
    ]
  }
}
```

---

### 5. `conclusion`
최종 신뢰도 평가 전송

**발송 시점**: 모든 검증 완료 후 ~1000ms

**데이터 형식**:
```javascript
{
  claimCount: number,    // 의견 개수
  factCount: number,       // 팩트 개수
  trustScore: number       // 최종 신뢰도 (0-100)
}
```

**상태 변화**: `CONCLUDE` 단계로 진행

**예시**:
```javascript
{
  claimCount: 2,
  factCount: 3,
  trustScore: 68
}
```

---

### 6. `error`
에러 발생 시 전송

**데이터 형식**:
```javascript
{
  message: string  // 에러 메시지
}
```

---

## 📊 통신 시간 흐름

```
클라이언트 연결
    ↓
emit: request_analysis ({})
    ↓
[~500ms]  recv: video_info → 상태: INFO
    ↓
[~2000ms] recv: transcript → 상태: EXTRACT
    ↓
[~4000ms] recv: candidates → 상태: CLASSIFY
    ↓
[~6000ms] recv: verification (1번째) → 상태: VERIFY
[~7000ms] recv: verification (2번째)
[~8000ms] recv: verification (3번째)
[~9000ms] recv: verification (4번째)
[~10000ms] recv: verification (5번째)
    ↓
[~11000ms] recv: conclusion → 상태: CONCLUDE
```

**총 소요 시간**: ~11초 (모의 데이터 기준)

---

## 🔌 Socket 상태 관리

### 자동 연결 해제 처리
```javascript
// useSocket.js에서 처리
- 최대 5회 재연결 시도
- 재연결 간격: 1000ms ~ 5000ms (점진적 증가)
- 자동 연결 끊김 시 자동 복구
```

### 이벤트 등록/해제
```javascript
// App.jsx에서
on('video_info', handler)      // 리스너 등록
on('transcript', handler)
on('candidates', handler)
on('verification', handler)
on('conclusion', handler)
on('error', handler)

// cleanup은 return 함수에서 처리 (필요 시)
```

---

## 🚀 실제 백엔드 연동 시

### 필요한 수정 사항

1. **App.jsx**의 Socket URL 변경
```javascript
// 현재
const { on, emit } = useSocket('http://localhost:3001');

// 변경 예시
const { on, emit } = useSocket('https://your-api.com');
```

2. **데이터 구조 확인**
   - 백엔드에서 보내는 데이터 구조가 위 명세와 일치해야 함
   - 필요시 적응 계층(adapter)을 추가할 수 있음

3. **타이밍 조정**
   - 모의 서버는 고정 시간 간격으로 전송
   - 실제 서버는 처리 시간에 따라 유동적일 수 있음
   - 클라이언트는 이벤트 순서 의존 (시간 독립적)

---

## 📝 호출 예시 (클라이언트 코드)

```javascript
// App.jsx
const { on, emit } = useSocket('http://localhost:3001');

// 분석 시작
emit('request_analysis', {});

// 이벤트 리스너 등록
on('video_info', (data) => {
  console.log('영상 정보:', data);
  // { title, thumbnail, url }
});

on('transcript', (data) => {
  console.log('대본:', data);
  // { text, timeline }
});

on('candidates', (data) => {
  console.log('후보들:', data.candidates);
  // [{ id, type, text, timestamp }, ...]
});

on('verification', (data) => {
  console.log('검증 결과:', data);
  // { candidateId, verification: { trustScore, reasoning, references } }
});

on('conclusion', (data) => {
  console.log('최종 평가:', data);
  // { claimCount, factCount, trustScore }
});

on('error', (error) => {
  console.error('에러:', error);
  // { message }
});
```

---

## 📱 REST API (향후 추가 예정)

현재는 Socket.IO만 사용하지만, 필요시 다음 엔드포인트 추가 가능:

- `GET /api/analysis/:id` - 분석 결과 조회
- `GET /api/history` - 분석 히스토리 조회
- `POST /api/share` - 결과 공유
- `POST /api/feedback` - 피드백 제출

