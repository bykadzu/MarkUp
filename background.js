// MarkUp Background — Service worker for native tab capture
// Uses chrome.tabs.captureVisibleTab for instant screenshots instead of html2canvas

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'captureTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true; // keep message channel open for async response
  }
});
