/**
 * 분석 프로세스 관리
 * - 분석 시작
 * - 분석 완료 처리
 * - 상태 관리
 */

class AnalysisManager {
  constructor() {
    this.currentAnalysis = null;
    this.analysisHistory = [];
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
      const analysisUrl = this.getAnalysisUrl(videoUrl);

      // 백그라운드에 알림 (탭 생성 포함)
      await window.messageHandler.notifyAnalysisStart(
        videoId,
        videoUrl,
        analysisUrl
      );

      // UI 업데이트
      if (window.uiManager) {
        window.uiManager.updateAnalysisStatus('analyzing');
      }

      return true;
    } catch (error) {
      console.error('분석 시작 실패:', error);
      this.currentAnalysis = null;

      if (window.uiManager) {
        window.uiManager.updateAnalysisStatus('error');
      }

      return false;
    }
  }

  /**
   * 분석 URL 생성
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
