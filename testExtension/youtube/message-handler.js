/**
 * 메시지 통신 관리
 * - 백그라운드와의 통신
 * - 메시지 수신 처리
 */

class MessageHandler {
  constructor() {
    this.setupMessageListener();
    this.notificationBox = null;
    this.currentAnalysisTabId = null; // 분석 탭 ID 저장
  }

  /**
   * 백그라운드로 메시지 전송
   */
  sendToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('메시지 전송 실패:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('백그라운드 응답:', response);
          resolve(response);
        }
      });
    });
  }

  /**
   * 분석 시작 알림 (분석 URL 포함)
   */
  notifyAnalysisStart(videoId, videoUrl, analysisUrl) {
    console.log('분석 시작 알림 전송:', videoUrl);
    return this.sendToBackground({
      type: 'START_ANALYSIS',
      videoId: videoId,
      videoUrl: videoUrl,
      analysisUrl: analysisUrl,
      timestamp: Date.now(),
    });
  }

  /**
   * 분석 탭으로 포커스 이동 요청
   */
  focusAnalysisTab(tabId) {
    console.log('분석 탭 포커스 요청:', tabId);
    return this.sendToBackground({
      type: 'FOCUS_ANALYSIS_TAB',
      tabId: tabId,
    });
  }

  /**
   * 메시지 수신 리스너 설정
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('YouTube: 메시지 받음', message);

      if (message.type === 'ANALYSIS_COMPLETE') {
        this.handleAnalysisComplete(message.data);
        sendResponse({ success: true });
      }

      return true;
    });
  }

  /**
   * 분석 완료 처리
   */
  handleAnalysisComplete(data) {
    console.log('분석 완료 데이터:', data);

    // 분석 탭 ID 저장
    this.currentAnalysisTabId = data.analysisTabId;

    // 우측 상단 알림 박스 표시
    this.showNotificationBox(data);

    // AnalysisManager에 알림 (상태 업데이트용)
    if (window.analysisManager) {
      window.analysisManager.onAnalysisComplete(data);
    }
  }

  /**
   * 우측 상단 알림 박스 표시
   */
  showNotificationBox(data) {
    // 기존 알림이 있으면 제거
    if (this.notificationBox) {
      this.notificationBox.remove();
    }

    // 알림 박스 생성
    const box = document.createElement('div');
    box.id = 'factray-notification';
    box.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="font-size: 24px;">🎉</div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
            분석 완료!
          </div>
          <div style="font-size: 12px; color: #e0e0e0; margin-bottom: 8px;">
            팩트체크 결과를 확인하세요
          </div>
          <button id="factray-view-result" 
             style="display: inline-block; padding: 6px 12px; background: #4CAF50; color: white; 
                    text-decoration: none; border: none; border-radius: 4px; font-size: 12px; 
                    font-weight: bold; cursor: pointer;">
            결과 보기
          </button>
        </div>
        <button id="factray-notification-close" 
                style="background: none; border: none; color: #999; cursor: pointer; 
                       font-size: 20px; line-height: 1; padding: 0; width: 24px; height: 24px;">
          ×
        </button>
      </div>
    `;

    // 스타일 적용
    Object.assign(box.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '320px',
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      zIndex: '99999',
      fontFamily: 'Arial, sans-serif',
      animation: 'factraySlideIn 0.3s ease-out',
    });

    // 애니메이션 CSS 추가
    if (!document.getElementById('factray-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'factray-notification-styles';
      style.textContent = `
        @keyframes factraySlideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes factraySlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
        
        #factray-notification-close:hover {
          color: #fff !important;
        }
        
        #factray-view-result:hover {
          background: #45a049 !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(box);
    this.notificationBox = box;

    // 결과 보기 버튼 이벤트
    const viewBtn = box.querySelector('#factray-view-result');
    viewBtn.addEventListener('click', () => {
      console.log('결과 보기 버튼 클릭');
      if (this.currentAnalysisTabId) {
        this.focusAnalysisTab(this.currentAnalysisTabId);
        this.hideNotificationBox();
      } else {
        // 탭 ID가 없으면 새 탭으로 열기
        window.open(data.resultUrl, '_blank');
      }
    });

    // 닫기 버튼 이벤트
    const closeBtn = box.querySelector('#factray-notification-close');
    closeBtn.addEventListener('click', () => {
      this.hideNotificationBox();
    });

    // 10초 후 자동으로 숨김
    setTimeout(() => {
      this.hideNotificationBox();
    }, 10000);
  }

  /**
   * 알림 박스 숨김
   */
  hideNotificationBox() {
    if (this.notificationBox) {
      this.notificationBox.style.animation = 'factraySlideOut 0.3s ease-out';
      setTimeout(() => {
        if (this.notificationBox) {
          this.notificationBox.remove();
          this.notificationBox = null;
        }
      }, 300);
    }
  }

  /**
   * 알림 권한 요청
   */
  requestNotificationPermission() {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

// 전역 인스턴스 생성
window.messageHandler = new MessageHandler();
