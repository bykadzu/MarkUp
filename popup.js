// MarkUp Popup — Injects content script + styles into the active tab

document.getElementById('btn-annotate').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  // Inject styles first
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['styles.css']
  });

  // Inject html2canvas library
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['lib/html2canvas.min.js']
  });

  // Inject capture utilities
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['capture.js']
  });

  // Inject main annotation engine
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });

  // Close popup
  window.close();
});
