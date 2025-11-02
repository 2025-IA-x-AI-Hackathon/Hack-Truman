/**
 * 분석 프로세스 관리
 * - 분석 시작
 * - 분석 완료 처리
 * - 상태 관리
 * - FastAPI WebSocket 통신
 */

class AnalysisManager {
  constructor() {
    this.currentAnalysis = null;
    this.analysisHistory = [];
    this.websocket = null;
    this.backendUrl = 'http://localhost:8000'; // FastAPI 백엔드 URL
    this.websocketUrl = 'ws://localhost:8000/ws/analyze';
  }

  /**
   * 분석 시작
   */
  async startAnalysis(videoUrl) {
    const videoId = this.extractVideoId(videoUrl);

    if (!videoId) {
      console.error('비디오 ID를 추출할 수 없음:', videoUrl);
      alert('비디오 ID를 찾을 수 없습니다.');
      return false;
    }

    console.log('분석 시작:', { videoId, videoUrl });

    // 현재 분석 정보 저장
    this.currentAnalysis = {
      videoId: videoId,
      videoUrl: videoUrl,
      startTime: Date.now(),
      status: 'analyzing',
    };

    try {
      // UI 업데이트 (즉시 분석 중 상태로 변경)
      if (window.uiManager) {
        window.uiManager.updateAnalysisStatus('analyzing');
      }

      // FactRay 분석 페이지로 즉시 리다이렉션
      const analysisUrl = `http://localhost:5173/?videoUrl=${encodeURIComponent(videoUrl)}`;
      window.open(analysisUrl, '_blank');

      // 백그라운드에서 분석 진행 (리다이렉션 후 실행)
      this.runAnalysisInBackground(videoUrl);

      return true;
    } catch (error) {
      console.error('분석 시작 실패:', error);
      this.currentAnalysis = null;

      if (window.uiManager) {
        window.uiManager.updateAnalysisStatus('error');
      }

      alert(`분석 중 오류가 발생했습니다: ${error.message}`);
      return false;
    }
  }

  /**
   * 백그라운드에서 분석 실행 (비동기)
   */
  async runAnalysisInBackground(videoUrl) {
    try {
      console.log('백그라운드 분석 시작:', videoUrl);

      // YouTube 영상 다운로드
      const filePath = await this.fetchVideoAndGetFilePath(videoUrl);

      if (!filePath) {
        throw new Error('영상 파일을 가져올 수 없습니다.');
      }

      // WebSocket 연결 및 분석 요청
      await this.startWebSocketAnalysis(filePath, videoUrl);

      console.log('백그라운드 분석 완료:', videoUrl);
    } catch (error) {
      console.error('백그라운드 분석 실패:', error);
      this.currentAnalysis = null;
    }
  }

  /**
   * YouTube 영상 다운로드 및 파일 경로 획득
   */
  async fetchVideoAndGetFilePath(videoUrl) {
    try {
      console.log('YouTube 영상 다운로드 요청:', videoUrl);

      const response = await fetch(`${this.backendUrl}/api/youtube/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`다운로드 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('다운로드 완료:', data);

      // 응답에서 파일 경로 추출
      return data.file_path || data.download_info?.file_path;
    } catch (error) {
      console.error('영상 다운로드 실패:', error);
      throw error;
    }
  }

  /**
   * WebSocket을 통한 분석 시작
   */
  async startWebSocketAnalysis(filePath, videoUrl) {
    return new Promise((resolve, reject) => {
      try {
        // WebSocket 연결
        this.websocket = new WebSocket(this.websocketUrl);

        this.websocket.onopen = () => {
          console.log('WebSocket 연결됨');

          // 분석 요청 전송
          const analysisRequest = {
            file_path: filePath,
            language: 'en', // 기본 언어
          };

          this.websocket.send(JSON.stringify(analysisRequest));
          console.log('분석 요청 전송:', analysisRequest);
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('WebSocket 메시지:', message);

            if (message.stage === 'extract') {
              // Extract 데이터 받음
              this.handleExtractData(message.data, videoUrl);
              resolve();
            } else if (message.stage === 'error') {
              // 에러 처리
              console.error('분석 에러:', message.error);
              reject(new Error(message.error));
            } else if (message.stage === 'complete') {
              console.log('분석 완료:', message);
            }
          } catch (error) {
            console.error('메시지 파싱 오류:', error);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket 에러:', error);
          reject(new Error('WebSocket 연결 실패'));
        };

        this.websocket.onclose = () => {
          console.log('WebSocket 연결 종료');
        };

        // 타임아웃 설정 (30초)
        setTimeout(() => {
          if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            reject(new Error('분석 요청 타임아웃'));
          }
        }, 30000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract 데이터 처리
   */
  handleExtractData(data, videoUrl) {
    console.log('Extract 데이터 처리:', data);

    // 분석 데이터를 로컬 스토리지에 저장
    const analysisData = {
      videoUrl: videoUrl,
      timestamp: Date.now(),
      extractData: data,
    };

    chrome.storage.local.set(
      { [`analysis_${Date.now()}`]: analysisData },
      () => {
        console.log('분석 데이터 저장 완료');

        // 분석 사이트 URL 생성
        const analysisUrl = `http://localhost:5173/analyze?videoUrl=${encodeURIComponent(
          videoUrl
        )}`;

        // 분석 완료 알림 전송
        window.messageHandler.notifyAnalysisComplete(videoUrl, analysisUrl);
      }
    );
  }

  /**
   * 분석 URL 생성 (레거시)
   */
  getAnalysisUrl(videoUrl) {
    return `http://localhost:5173/analyze?videoUrl=${encodeURIComponent(
      videoUrl
    )}`;
  }

  /**
   * 분석 완료 처리
   */
  onAnalysisComplete(data) {
    console.log('분석 완료 처리:', data);

    if (this.currentAnalysis) {
      this.currentAnalysis.status = 'complete';
      this.currentAnalysis.endTime = Date.now();
      this.currentAnalysis.resultUrl = data.resultUrl;

      // 히스토리에 추가
      this.analysisHistory.push({ ...this.currentAnalysis });

      // 현재 분석 초기화
      this.currentAnalysis = null;
    }

    // UI 버튼 상태만 업데이트 (alert는 message-handler에서 처리)
    if (window.uiManager) {
      window.uiManager.resetAnalyzeButton();
    }
  }

  /**
   * 비디오 ID 추출
   */
  extractVideoId(url) {
    const match = url.match(/\/shorts\/([^?]+)/);
    return match ? match[1] : null;
  }

  /**
   * 현재 분석 상태 확인
   */
  isAnalyzing() {
    return (
      this.currentAnalysis !== null &&
      this.currentAnalysis.status === 'analyzing'
    );
  }

  /**
   * 분석 히스토리 가져오기
   */
  getHistory() {
    return this.analysisHistory;
  }
}

// 전역 인스턴스 생성
window.analysisManager = new AnalysisManager();
