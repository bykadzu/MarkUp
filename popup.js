// MarkUp Popup — Injects content script + styles into the active tab
// Safari/WebKit compatibility: use browser.* API with chrome.* fallback

const api = (typeof browser !== 'undefined' && browser.tabs) ? browser : chrome;

document.getElementById('btn-annotate').addEventListener('click', async () => {
  try {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab?.id) return;

    // Inject styles
    await api.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['styles.css']
    });

    // Inject modules in dependency order (all define functions, no side effects)
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['capture.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['annotations.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['annotations-html.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['compare.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['features.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['toolbar.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['eraser.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['keyboard.js']
    });

    // Orchestrator — loaded last, creates DOM and wires everything
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    window.close();
  } catch (err) {
    console.error('MarkUp injection failed:', err);
  }
});
