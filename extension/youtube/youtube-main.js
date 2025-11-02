/**
 * 메인 진입점
 * - URL 변경 감지
 * - 초기화
 * - 전체 흐름 조율
 */

class YouTubeShortsExtension {
  constructor() {
    this.currentUrl = window.location.href;
    this.observer = null;
  }

  /**
   * 확장 프로그램 초기화
   */
  initialize() {
    console.log('YouTube Shorts 확장 프로그램 시작');

    // 알림 권한 요청
    window.messageHandler.requestNotificationPermission();

    // 초기 UI 생성
    if (this.isShortsPage()) {
      this.initializeShortsUI();
    }

    // URL 변경 감지 설정
    this.setupUrlChangeDetection();
  }

  /**
   * Shorts 페이지 확인
   */
  isShortsPage() {
    return window.location.href.includes('/shorts/');
  }

  /**
   * Shorts UI 초기화
   */
  initializeShortsUI() {
    console.log('Shorts 페이지 감지 - UI 초기화');

    // UI 생성 시도 (DOM이 준비될 때까지 재시도)
    const tryInit = () => {
      const success = window.uiManager.initializeUI();
      if (!success) {
        console.log('UI 초기화 실패 - 0.5초 후 재시도');
        setTimeout(tryInit, 500);
      }
    };

    tryInit();
  }

  /**
   * URL 변경 감지 설정
   */
  setupUrlChangeDetection() {
    this.observer = new MutationObserver(() => {
      if (window.location.href !== this.currentUrl) {
        console.log(
          'URL 변경 감지:',
          this.currentUrl,
          '→',
          window.location.href
        );

        this.currentUrl = window.location.href;

        if (this.isShortsPage()) {
          // Shorts 페이지면 UI 업데이트
          window.uiManager.updateButtonLinks();
        }
      }

      // Shorts 페이지에서 UI 확인
      if (this.isShortsPage()) {
        window.uiManager.initializeUI();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log('URL 변경 감지 활성화');
  }

  /**
   * 확장 프로그램 정리
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// 확장 프로그램 시작
const extension = new YouTubeShortsExtension();
extension.initialize();
