console.log('분석 사이트 스크립트 로드됨');

const urlParams = new URLSearchParams(window.location.search);
const videoUrl = urlParams.get('videoUrl');

console.log('분석할 비디오 URL:', videoUrl);

function checkAnalysisComplete() {
  const observer = new MutationObserver((mutations) => {
    const completeElement =
      document.querySelector('.analysis-complete') ||
      document.querySelector('[data-status="complete"]') ||
      document.querySelector('#analysis-done');

    if (completeElement) {
      console.log('분석 완료 감지!');
      notifyAnalysisComplete();
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-status'],
  });

  const checkInterval = setInterval(() => {
    const isComplete = checkIfAnalysisIsComplete();

    if (isComplete) {
      console.log('분석 완료 (주기 체크)');
      notifyAnalysisComplete();
      clearInterval(checkInterval);
    }
  }, 2000);

  setTimeout(() => {
    clearInterval(checkInterval);
    observer.disconnect();
  }, 600000);
}

function checkIfAnalysisIsComplete() {
  const progressBar = document.querySelector('.progress-bar');
  const completeText =
    document.body.innerText.includes('분석 완료') ||
    document.body.innerText.includes('Analysis Complete');
  const completeButton = document.querySelector('.view-result-btn');

  return (
    completeText ||
    (progressBar && progressBar.style.width === '100%') ||
    completeButton
  );
}

function notifyAnalysisComplete() {
  console.log('백그라운드에 분석 완료 알림 전송');

  const resultUrl = window.location.href;

  chrome.runtime.sendMessage(
    {
      type: 'ANALYSIS_DONE',
      videoUrl: videoUrl,
      resultUrl: resultUrl,
      timestamp: Date.now(),
    },
    (response) => {
      console.log('백그라운드 응답:', response);
    }
  );
}

if (videoUrl) {
  console.log('분석 감지 시작...');
  checkAnalysisComplete();

  setTimeout(() => {
    if (checkIfAnalysisIsComplete()) {
      notifyAnalysisComplete();
    }
  }, 1000);
}

// 테스트 버튼
const testBtn = document.createElement('button');
testBtn.innerText = '분석 완료 알림 테스트';
testBtn.style.cssText =
  'position:fixed;bottom:10px;right:10px;z-index:99999;padding:10px;background:red;color:white;border:none;border-radius:5px;cursor:pointer;';
testBtn.onclick = () => notifyAnalysisComplete();
document.body.appendChild(testBtn);
