// MarkUp Popup — Injects content script + styles into the active tab
// Safari/WebKit compatibility: use browser.* API with chrome.* fallback

const api = (typeof browser !== 'undefined' && browser.tabs) ? browser : chrome;

document.getElementById('btn-annotate').addEventListener('click', async () => {
  const tabs = await api.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) return;

  // Inject styles first
  await api.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['styles.css']
  });

  // Inject html2canvas library
  await api.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['lib/html2canvas.min.js']
  });

  // Inject capture utilities
  await api.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['capture.js']
  });

  // Inject main annotation engine
  await api.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });

  // Close popup
  window.close();
});
