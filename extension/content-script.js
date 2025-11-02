/**
 * Content Script - React 페이지와 Extension 간 메시지 중계
 * localhost:5173에서만 동작
 */

console.log('FactRay content script loaded');

// Background script로부터 메시지 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  // React 페이지로 메시지 전달
  if (message.type === 'DOWNLOAD_READY' || message.type === 'DOWNLOAD_ERROR') {
    window.postMessage(message, '*');
    console.log('Message forwarded to React:', message);
  }

  // 응답 전송
  sendResponse({ received: true });
  return true;
});

// React 페이지로부터 메시지 수신 (필요시 background로 전달)
window.addEventListener('message', (event) => {
  // 자기 자신이 보낸 메시지는 무시
  if (event.source !== window) return;

  // React에서 Extension으로 메시지 전송이 필요한 경우
  if (event.data.type === 'REQUEST_ANALYSIS_STATUS') {
    chrome.runtime.sendMessage({
      type: 'GET_ANALYSIS_STATUS',
      data: event.data
    }, (response) => {
      window.postMessage({
        type: 'ANALYSIS_STATUS_RESPONSE',
        data: response
      }, '*');
    });
  }
});