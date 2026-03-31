// Sentry error reporting (lightweight - no SDK)
function reportError(error, context = {}) {
  const envelope = `{"event_id":"${crypto.randomUUID().replace(/-/g, '')}","sent_at":"${new Date().toISOString()}","dsn":"https://b627e00815b392f23c364de2274dba73@o4509754720059392.ingest.de.sentry.io/4511121377067088"}
{"type":"event"}
${JSON.stringify({
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    release: 'markup@1.0.0',
    environment: 'production',
    tags: { product: 'markup', component: context.component || 'background' },
    exception: { values: [{ type: error?.name || 'Error', value: error?.message || String(error) }] }
  })}`;
  fetch('https://o4509754720059392.ingest.de.sentry.io/api/4511121377067088/envelope/', {
    method: 'POST',
    body: envelope,
  }).catch(() => {});
}

self.addEventListener('error', (e) => reportError(e.error || e, { component: 'background' }));
self.addEventListener('unhandledrejection', (e) => reportError(e.reason || e, { component: 'background' }));

// MarkUp Background — Service worker for native tab capture
// Uses chrome.tabs.captureVisibleTab for instant screenshots (JPEG for speed)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'captureTab') {
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 92 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: 'Tab capture failed: ' + chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true; // keep message channel open for async response
  }

  if (msg.type === 'uploadShare') {
    (async () => {
      try {
        // Validate dataUrl format
        if (!msg.dataUrl || typeof msg.dataUrl !== 'string' || !msg.dataUrl.includes(',')) {
          sendResponse({ error: 'Invalid screenshot data.' });
          return;
        }

        const parts = msg.dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (!mimeMatch || !mimeMatch[1]) {
          sendResponse({ error: 'Invalid data URL: missing MIME type.' });
          return;
        }
        const mime = mimeMatch[1];

        // Safe base64 decode with size guard
        let binary;
        try {
          binary = atob(parts[1]);
        } catch (decodeErr) {
          sendResponse({ error: 'Base64 decode failed: ' + decodeErr.message });
          return;
        }

        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: mime });

        // Unique filename to avoid collisions
        const filename = 'markup-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.png';

        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('time', '24h');
        formData.append('fileToUpload', blob, filename);

        const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
          method: 'POST',
          body: formData,
        });

        // Check HTTP status
        if (!response.ok) {
          sendResponse({ error: 'Upload failed with status: ' + response.status });
          return;
        }

        const url = await response.text();
        const trimmedUrl = url.trim();

        // Validate returned URL
        try {
          new URL(trimmedUrl);
        } catch (_e) {
          sendResponse({ error: 'Invalid URL received from server.' });
          return;
        }

        sendResponse({ url: trimmedUrl });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    })();
    return true;
  }
});
