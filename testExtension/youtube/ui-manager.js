/**
 * UI 요소 관리
 * - 버튼 생성/업데이트
 * - 상태 표시
 * - 스타일링
 */

class UIManager {
  constructor() {
    this.container = null;
    this.buttons = {};
    this.statusDiv = null;
  }

  /**
   * 모든 UI 요소 초기화
   */
  initializeUI() {
    const container = this.findContainer();
    if (!container) {
      console.log('컨테이너를 찾을 수 없음');
      return false;
    }

    this.container = container;

    // 이미 생성된 UI가 있는지 확인
    if (document.querySelector('#redirect-btn')) {
      console.log('UI가 이미 존재함');
      this.updateButtonLinks();
      return true;
    }

    this.createRedirectButton();
    this.createAnalyzeButton();
    this.createStatusDisplay();

    console.log('UI 초기화 완료');
    return true;
  }

  /**
   * 컨테이너 찾기
   */
  findContainer() {
    return document.querySelector('#reel-video-renderer');
  }

  /**
   * 원본 영상 보기 버튼
   */
  createRedirectButton() {
    const btn = document.createElement('a');
    btn.id = 'redirect-btn';
    btn.innerText = '원본 영상 보기';
    btn.href = this.getWatchUrl();
    btn.target = '_blank';

    this.applyButtonStyle(btn, {
      top: '10px',
      background: 'rgba(255, 0, 0, 0.8)',
    });

    this.container.appendChild(btn);
    this.buttons.redirect = btn;
    console.log('원본 영상 보기 버튼 생성');
  }

  /**
   * 분석 시작 버튼
   */
  createAnalyzeButton() {
    const btn = document.createElement('button');
    btn.id = 'analyze-btn';
    btn.innerText = '분석 시작';

    this.applyButtonStyle(btn, {
      top: '60px',
      background: 'rgba(0, 200, 100, 0.8)',
      border: 'none',
      cursor: 'pointer',
    });

    btn.onclick = () => this.handleAnalyzeClick();

    this.container.appendChild(btn);
    this.buttons.analyze = btn;
    console.log('분석 버튼 생성');
  }

  /**
   * 상태 표시 영역
   */
  createStatusDisplay() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'analysis-status';

    this.applyButtonStyle(statusDiv, {
      top: '110px',
      background: 'rgba(0, 0, 0, 0.8)',
      fontSize: '12px',
      maxWidth: '200px',
      display: 'none',
    });

    this.container.appendChild(statusDiv);
    this.statusDiv = statusDiv;
    console.log('상태 표시 영역 생성');
  }

  /**
   * 공통 버튼 스타일 적용
   */
  applyButtonStyle(element, customStyles = {}) {
    const baseStyle = {
      position: 'fixed',
      right: '10px',
      zIndex: '9999',
      padding: '8px 12px',
      color: '#fff',
      borderRadius: '8px',
      fontWeight: 'bold',
      textDecoration: 'none',
    };

    Object.assign(element.style, baseStyle, customStyles);
  }

  /**
   * 분석 버튼 클릭 처리
   */
  async handleAnalyzeClick() {
    if (window.analysisManager.isAnalyzing()) {
      alert('이미 분석이 진행 중입니다.');
      return;
    }

    const success = await window.analysisManager.startAnalysis(
      window.location.href
    );

    if (!success) {
      this.updateAnalysisStatus('error');
    }
  }

  /**
   * 분석 상태 업데이트
   */
  updateAnalysisStatus(status) {
    const btn = this.buttons.analyze;
    if (!btn) return;

    switch (status) {
      case 'analyzing':
        btn.innerText = '분석 중...';
        btn.disabled = true;
        btn.style.background = 'rgba(150, 150, 150, 0.8)';
        this.showStatus('분석 중... (백그라운드에서 진행)');
        break;

      case 'error':
        btn.innerText = '분석 실패';
        btn.style.background = 'rgba(255, 0, 0, 0.8)';
        this.showStatus('분석 중 오류가 발생했습니다.');
        setTimeout(() => this.resetAnalyzeButton(), 2000);
        break;
    }
  }

  /**
   * 상태 메시지 표시
   */
  showStatus(message) {
    if (this.statusDiv) {
      this.statusDiv.style.display = 'block';
      this.statusDiv.innerText = message;
    }
  }

  /**
   * 상태 메시지 숨김
   */
  hideStatus() {
    if (this.statusDiv) {
      this.statusDiv.style.display = 'none';
    }
  }

  /**
   * 분석 버튼 리셋
   */
  resetAnalyzeButton() {
    const btn = this.buttons.analyze;
    if (btn) {
      btn.innerText = '분석 시작';
      btn.disabled = false;
      btn.style.background = 'rgba(0, 200, 100, 0.8)';
    }
    this.hideStatus();
  }

  /**
   * 버튼 링크 업데이트
   */
  updateButtonLinks() {
    const btn = this.buttons.redirect;
    if (btn) {
      const newHref = this.getWatchUrl();
      btn.href = newHref;
      console.log('버튼 링크 업데이트:', newHref);
    }
  }

  /**
   * Watch URL 생성
   */
  getWatchUrl() {
    return window.location.href.replace('shorts/', 'watch?v=');
  }
}

// 전역 인스턴스 생성
window.uiManager = new UIManager();
