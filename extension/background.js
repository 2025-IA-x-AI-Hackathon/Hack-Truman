console.log('백그라운드 서비스 워커 시작');

const analysisQueue = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('백그라운드: 메시지 받음', message);

  if (message.type === 'START_ANALYSIS') {
    // 분석 시작 기록
    analysisQueue.set(message.videoUrl, {
      videoId: message.videoId,
      videoUrl: message.videoUrl,
      startTime: Date.now(),
      tabId: sender.tab?.id,
    });

    console.log('분석 시작 기록:', message.videoUrl);

    // 백그라운드 탭으로 분석 사이트 열기
    chrome.tabs.create(
      {
        url: message.analysisUrl,
        active: false, // 백그라운드에서 열기
      },
      (tab) => {
        console.log('분석 탭 생성:', tab.id);
        // 분석 탭 ID 저장
        const analysis = analysisQueue.get(message.videoUrl);
        if (analysis) {
          analysis.analysisTabId = tab.id;
          analysisQueue.set(message.videoUrl, analysis);
        }
        sendResponse({
          success: true,
          message: 'Analysis started',
          tabId: tab.id,
        });
      }
    );

    return true;
  } else if (message.type === 'ANALYSIS_DONE') {
    const analysis = analysisQueue.get(message.videoUrl);

    if (analysis) {
      console.log('분석 완료 감지:', message.videoUrl);

      // YouTube 탭들에 알림 전송 (분석 탭 ID 포함)
      chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs
            .sendMessage(tab.id, {
              type: 'ANALYSIS_COMPLETE',
              data: {
                videoUrl: message.videoUrl,
                resultUrl: message.resultUrl,
                timestamp: message.timestamp,
                analysisTabId: analysis.analysisTabId, // 분석 탭 ID 전달
              },
            })
            .catch((err) => console.log('탭에 메시지 전송 실패:', err));
        });
      });

      analysisQueue.delete(message.videoUrl);
      sendResponse({ success: true, message: 'Notification sent' });
    } else {
      console.log('해당 분석을 찾을 수 없음:', message.videoUrl);
      sendResponse({ success: false, message: 'Analysis not found' });
    }
  } else if (message.type === 'FOCUS_ANALYSIS_TAB') {
    // 분석 탭으로 포커스 이동
    chrome.tabs.update(message.tabId, { active: true }, (tab) => {
      if (tab) {
        chrome.windows.update(tab.windowId, { focused: true });
        console.log('분석 탭으로 포커스 이동:', tab.id);
        sendResponse({ success: true });
      } else {
        console.log('탭을 찾을 수 없음:', message.tabId);
        sendResponse({ success: false });
      }
    });

    return true;
  }

  return true;
});

setInterval(() => {
  const now = Date.now();
  for (const [videoUrl, analysis] of analysisQueue.entries()) {
    if (now - analysis.startTime > 600000) {
      console.log('오래된 분석 제거:', videoUrl);
      analysisQueue.delete(videoUrl);
    }
  }
}, 60000);
