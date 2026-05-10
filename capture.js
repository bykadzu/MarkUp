// MarkUp Capture — Screenshot + export logic
// Injected before content.js, provides window.__markupCapture

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__markupCapture) return;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function getDomain() {
    return window.location.hostname.replace(/[^a-z0-9.-]/gi, '').replace(/\./g, '-');
  }

  function getTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function getFilename() {
    return `markup-${getDomain()}-${getTimestamp()}.png`;
  }

  // Toast notification (with timeout tracking to prevent stacking)
  var toastTimeout = null;
  var fullPageCaptureState = {
    running: false,
    cancelled: false,
    lastCaptureAt: 0,
  };

  function showToast(message, duration) {
    duration = duration || 4000;

    // Clear pending timeout and remove existing toast
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    const existing = document.getElementById('markup-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'markup-toast';
    toast.className = 'markup-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 300);
      toastTimeout = null;
    }, duration);
  }

  function removeToast() {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    var toast = document.getElementById('markup-toast');
    if (toast) toast.remove();
  }

  function cancelCapture() {
    if (fullPageCaptureState.running) {
      fullPageCaptureState.cancelled = true;
    }
  }

  function ensureNotCancelled() {
    if (fullPageCaptureState.cancelled) {
      throw new Error('Capture cancelled.');
    }
  }

  function nextFrame() {
    return new Promise(function(resolve) {
      requestAnimationFrame(function() {
        requestAnimationFrame(resolve);
      });
    });
  }

  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  async function waitForScrollSettle(targetY, extraDelay) {
    window.scrollTo(0, targetY);
    await nextFrame();

    var lastY = -1;
    var stableFrames = 0;
    var startedAt = Date.now();

    while (Date.now() - startedAt < 1200) {
      ensureNotCancelled();
      await nextFrame();

      var y = window.scrollY;
      if (Math.abs(y - lastY) < 1) {
        stableFrames++;
        if (stableFrames >= 2) break;
      } else {
        stableFrames = 0;
      }
      lastY = y;
    }

    // Let lazy content and sticky relayouts catch up without making capture feel frozen.
    await sleep(typeof extraDelay === 'number' ? extraDelay : 220);
  }

  function getDocumentHeight() {
    return Math.max(
      document.body ? document.body.scrollHeight : 0,
      document.body ? document.body.offsetHeight : 0,
      document.documentElement ? document.documentElement.clientHeight : 0,
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.documentElement ? document.documentElement.offsetHeight : 0
    );
  }

  function createVisibilityHider() {
    var hidden = [];

    function hide(el) {
      for (var i = 0; i < hidden.length; i++) {
        if (hidden[i].el === el) return;
      }
      hidden.push({ el: el, visibility: el.style.visibility });
      el.style.visibility = 'hidden';
    }

    function restore() {
      for (var i = 0; i < hidden.length; i++) {
        hidden[i].el.style.visibility = hidden[i].visibility;
      }
    }

    return { hide: hide, restore: restore };
  }

  function isTopBarLike(rect) {
    return rect.top <= 4 && rect.width >= window.innerWidth * 0.55 && rect.height <= window.innerHeight * 0.25;
  }

  function isFloatingWidgetLike(rect) {
    var nearRight = rect.right >= window.innerWidth - 32;
    var nearBottom = rect.bottom >= window.innerHeight - 32;
    var nearLeft = rect.left <= 32;
    var smallEnough = rect.width <= window.innerWidth * 0.45 && rect.height <= window.innerHeight * 0.45;
    return smallEnough && (nearRight || nearBottom || nearLeft) && !isTopBarLike(rect);
  }

  function hideViewportChrome(hider, includeTopBars) {
    var nodes = Array.prototype.slice.call(document.body ? document.body.querySelectorAll('*') : []);
    var viewportArea = window.innerWidth * window.innerHeight;

    nodes.forEach(function(el) {
      if (!el || el.id === 'markup-overlay' || el.closest('#markup-overlay')) return;
      var cs = window.getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return;

      var rect = el.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      if ((rect.width * rect.height) > viewportArea * 0.75) return;
      if (!includeTopBars && isTopBarLike(rect)) return;
      if (!includeTopBars && !isFloatingWidgetLike(rect)) return;

      hider.hide(el);
    });
  }

  async function warmUpLazyContent(positions) {
    var warmPositions = [];
    if (positions.length <= 8) {
      warmPositions = positions.slice();
    } else {
      for (var i = 0; i < positions.length; i += 2) {
        warmPositions.push(positions[i]);
      }
      if (warmPositions[warmPositions.length - 1] !== positions[positions.length - 1]) {
        warmPositions.push(positions[positions.length - 1]);
      }
    }

    for (var j = 0; j < warmPositions.length; j++) {
      ensureNotCancelled();
      showToast('Preparing page ' + (j + 1) + ' of ' + warmPositions.length + '...', 2000);
      await waitForScrollSettle(warmPositions[j], 300);
    }
  }

  function estimateCanvasPixels(width, height) {
    return Math.ceil(width) * Math.ceil(height);
  }

  async function throttledNativeScreenshot() {
    var elapsed = Date.now() - fullPageCaptureState.lastCaptureAt;
    if (elapsed < 550) {
      await sleep(550 - elapsed);
    }
    ensureNotCancelled();
    var dataUrl = await requestNativeScreenshot();
    fullPageCaptureState.lastCaptureAt = Date.now();
    return dataUrl;
  }

  // ---------------------------------------------------------------------------
  // Composite: render page + annotations into a single canvas
  // ---------------------------------------------------------------------------

  // Calculate bounding box that covers all annotations + viewport
  function getAnnotationBounds() {
    var minX = 0, minY = 0;
    var maxX = window.innerWidth, maxY = window.innerHeight;
    var padding = 20; // extra padding around annotations

    // Check SVG elements (arrows, rects, highlights)
    var svgLayer = window.__markupSvgLayer;
    if (svgLayer) {
      svgLayer.querySelectorAll('line, rect, ellipse, path, polygon').forEach(function(el) {
        if (el.classList.contains('markup-preview')) return;
        var bbox;
        try { bbox = el.getBBox(); } catch(_e) { return; }
        if (bbox.width === 0 && bbox.height === 0) return;
        minX = Math.min(minX, bbox.x - padding);
        minY = Math.min(minY, bbox.y - padding);
        maxX = Math.max(maxX, bbox.x + bbox.width + padding);
        maxY = Math.max(maxY, bbox.y + bbox.height + padding);
      });
    }

    // Check HTML annotations (text notes, pins, stamps)
    var htmlLayer = window.__markupHtmlLayer;
    if (htmlLayer) {
      htmlLayer.querySelectorAll('.markup-text-note, .markup-pin, .markup-stamp, .markup-template-annotation').forEach(function(el) {
        var rect = el.getBoundingClientRect();
        var absTop = rect.top + window.scrollY;
        var absLeft = rect.left + window.scrollX;
        minX = Math.min(minX, absLeft - window.scrollX - padding);
        minY = Math.min(minY, absTop - window.scrollY - padding);
        maxX = Math.max(maxX, absLeft - window.scrollX + rect.width + padding);
        maxY = Math.max(maxY, absTop - window.scrollY + rect.height + padding);
      });
    }

    // Clamp to non-negative and ensure minimum is viewport size
    minX = Math.min(minX, 0);
    minY = Math.min(minY, 0);
    maxX = Math.max(maxX, window.innerWidth);
    maxY = Math.max(maxY, window.innerHeight);

    return {
      x: Math.floor(minX),
      y: Math.floor(minY),
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
      offsetX: Math.floor(-minX), // how much to shift layers right
      offsetY: Math.floor(-minY), // how much to shift layers down
    };
  }

  // ---------------------------------------------------------------------------
  // Direct canvas rendering for HTML annotations
  // ---------------------------------------------------------------------------

  var ANNOTATION_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawCircle(ctx, cx, cy, r, fillColor, borderWidth, borderColor) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCenteredText(ctx, text, cx, cy, fontSize, fontWeight) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = fontWeight + ' ' + fontSize + 'px ' + ANNOTATION_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  function renderAnnotationsToCanvas(cctx, offX, offY) {
    var htmlLayer = window.__markupHtmlLayer;
    if (!htmlLayer || htmlLayer.children.length === 0) return;

    // Render pins (28px circles with number)
    htmlLayer.querySelectorAll('.markup-pin').forEach(function(el) {
      var rect = el.getBoundingClientRect();
      var x = rect.left + offX;
      var y = rect.top + offY;
      var r = rect.width / 2;
      var bg = el.style.background || window.getComputedStyle(el).backgroundColor;
      drawCircle(cctx, x + r, y + r, r - 1, bg, 2, 'rgba(255, 255, 255, 0.3)');
      drawCenteredText(cctx, el.textContent, x + r, y + r, 13, '700');
    });

    // Render stamps (28px circles with symbol)
    htmlLayer.querySelectorAll('.markup-stamp').forEach(function(el) {
      var rect = el.getBoundingClientRect();
      var x = rect.left + offX;
      var y = rect.top + offY;
      var r = rect.width / 2;
      var bg = el.style.background || window.getComputedStyle(el).backgroundColor;
      drawCircle(cctx, x + r, y + r, r - 1, bg, 2, 'rgba(255, 255, 255, 0.3)');
      drawCenteredText(cctx, el.textContent, x + r, y + r, 18, '700');
    });

    // Render template annotations (pill badge)
    htmlLayer.querySelectorAll('.markup-template-annotation').forEach(function(el) {
      var rect = el.getBoundingClientRect();
      var x = rect.left + offX;
      var y = rect.top + offY;
      var w = rect.width;
      var h = rect.height;
      var borderColor = el.style.borderColor || '#DC2626';

      cctx.save();
      cctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      cctx.shadowBlur = 6;
      cctx.shadowOffsetY = 2;
      drawRoundedRect(cctx, x, y, w, h, h / 2);
      cctx.fillStyle = 'rgba(18, 18, 28, 0.9)';
      cctx.fill();
      cctx.strokeStyle = borderColor;
      cctx.lineWidth = 1.5;
      cctx.stroke();
      cctx.restore();

      var dot = el.querySelector('.markup-template-dot');
      if (dot) {
        var dotRect = dot.getBoundingClientRect();
        var dotCx = dotRect.left + offX + dotRect.width / 2;
        var dotCy = dotRect.top + offY + dotRect.height / 2;
        cctx.beginPath();
        cctx.arc(dotCx, dotCy, dotRect.width / 2, 0, Math.PI * 2);
        cctx.fillStyle = dot.style.background || borderColor;
        cctx.fill();
      }

      var textEl = el.querySelector('.markup-template-text');
      if (textEl) {
        var textRect = textEl.getBoundingClientRect();
        cctx.save();
        cctx.fillStyle = textEl.style.color || '#fff';
        cctx.font = '600 12px ' + ANNOTATION_FONT;
        cctx.textBaseline = 'middle';
        cctx.fillText(textEl.textContent, textRect.left + offX, textRect.top + offY + textRect.height / 2);
        cctx.restore();
      }
    });

    // Render text notes (badge circle + label box)
    htmlLayer.querySelectorAll('.markup-text-note').forEach(function(wrapper) {
      var badge = wrapper.querySelector('.markup-text-badge');
      var label = wrapper.querySelector('.markup-text-label');

      // Badge: small numbered circle
      if (badge) {
        var br = badge.getBoundingClientRect();
        var bx = br.left + offX;
        var by = br.top + offY;
        var bRadius = br.width / 2;
        var bg = badge.style.background || window.getComputedStyle(badge).backgroundColor;
        drawCircle(cctx, bx + bRadius, by + bRadius, bRadius, bg, 0, '');
        drawCenteredText(cctx, badge.textContent, bx + bRadius, by + bRadius, 11, '700');
      }

      // Label: dark rounded rectangle with text
      if (label) {
        var lr = label.getBoundingClientRect();
        var lx = lr.left + offX;
        var ly = lr.top + offY;
        var lw = lr.width;
        var lh = lr.height;
        var cs = window.getComputedStyle(label);

        // Background box with shadow
        cctx.save();
        cctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        cctx.shadowBlur = 6;
        cctx.shadowOffsetY = 2;
        drawRoundedRect(cctx, lx, ly, lw, lh, 6);
        cctx.fillStyle = 'rgba(18, 18, 28, 0.9)';
        cctx.fill();
        cctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        cctx.lineWidth = 1;
        cctx.stroke();
        cctx.restore();

        // Text content
        var fontSize = parseFloat(cs.fontSize) || 13;
        var fontWeight = cs.fontWeight || '400';
        var fontStyle = cs.fontStyle || 'normal';
        var color = cs.color || '#f0f0f0';
        var hasUnderline = (cs.textDecorationLine || cs.textDecoration || '').indexOf('underline') !== -1;

        cctx.save();
        cctx.fillStyle = color;
        cctx.font = fontStyle + ' ' + fontWeight + ' ' + fontSize + 'px ' + ANNOTATION_FONT;
        cctx.textBaseline = 'top';

        var padX = 10, padY = 6;
        var lineHeight = fontSize * 1.4;
        var lines = label.textContent.split('\n');
        var textY = ly + padY;

        for (var i = 0; i < lines.length; i++) {
          cctx.fillText(lines[i], lx + padX, textY);
          if (hasUnderline && lines[i].length > 0) {
            var metrics = cctx.measureText(lines[i]);
            cctx.beginPath();
            cctx.moveTo(lx + padX, textY + fontSize + 1);
            cctx.lineTo(lx + padX + metrics.width, textY + fontSize + 1);
            cctx.strokeStyle = color;
            cctx.lineWidth = 1;
            cctx.stroke();
          }
          textY += lineHeight;
        }
        cctx.restore();
      }
    });
  }

  // Request native screenshot from background service worker
  function requestNativeScreenshot() {
    const api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;
    return new Promise(function(resolve, reject) {
      api.runtime.sendMessage({ type: 'captureTab' }, function(response) {
        if (api.runtime.lastError) {
          reject(new Error(api.runtime.lastError.message));
        } else if (response && response.error) {
          reject(new Error(response.error));
        } else if (response && response.dataUrl) {
          resolve(response.dataUrl);
        } else {
          reject(new Error('No screenshot data received'));
        }
      });
    });
  }

  async function captureComposite(cropBounds) {
    const overlay = window.__markupOverlay;
    const toolbar = window.__markupToolbar;
    const annotCanvas = window.__markupCanvas;

    if (!overlay || !annotCanvas) {
      throw new Error('MarkUp overlay not found.');
    }

    // Calculate capture bounds that include all annotations
    const bounds = getAnnotationBounds();
    const captureW = bounds.width;
    const captureH = bounds.height;
    const offX = bounds.offsetX;
    const offY = bounds.offsetY;

    // Hide overlay and toolbar so native screenshot captures clean page
    toolbar.style.display = 'none';
    overlay.style.display = 'none';

    let pageDataUrl;
    try {
      // Wait for repaint so overlay is fully hidden
      await new Promise(function(r) { requestAnimationFrame(function() { setTimeout(r, 50); }); });

      // Native screenshot via chrome.tabs.captureVisibleTab (JPEG for speed)
      pageDataUrl = await requestNativeScreenshot();
    } finally {
      overlay.style.display = '';
      toolbar.style.display = '';
    }

    // Load the screenshot image
    const pageImg = await loadImage(pageDataUrl);

    // Create composite canvas at the expanded size
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = captureW;
    compositeCanvas.height = captureH;
    const cctx = compositeCanvas.getContext('2d');

    // 1. Draw page screenshot at viewport position within expanded bounds
    //    Native capture is at device pixel ratio; draw at 1x to match annotation layers
    cctx.drawImage(pageImg, offX, offY, window.innerWidth, window.innerHeight);

    // 2. Draw the freehand canvas layer (offset to align with expanded bounds)
    cctx.drawImage(annotCanvas, offX, offY);

    // 3. Render SVG layer (arrows, rects) onto the composite
    const svgLayer = window.__markupSvgLayer;
    if (svgLayer && svgLayer.children.length > 0) {
      const svgClone = svgLayer.cloneNode(true);
      // Remove preview elements
      svgClone.querySelectorAll('.markup-preview').forEach(el => el.remove());
      // Offset the SVG viewBox to account for expanded bounds
      svgClone.setAttribute('width', captureW);
      svgClone.setAttribute('height', captureH);
      svgClone.setAttribute('viewBox', bounds.x + ' ' + bounds.y + ' ' + captureW + ' ' + captureH);
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      try {
        const svgImg = await loadImage(svgUrl);
        cctx.drawImage(svgImg, 0, 0);
      } catch (_e) {
        // SVG rendering failed — skip silently
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    }

    // 4. Render blur/redact regions by re-drawing blurred page content
    const htmlLayer = window.__markupHtmlLayer;
    if (htmlLayer) {
      htmlLayer.querySelectorAll('.markup-blur-region').forEach(function(el) {
        const rect = el.getBoundingClientRect();
        const x = Math.round(rect.left + offX);
        const y = Math.round(rect.top + offY);
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (w <= 0 || h <= 0) return;

        // Extract the region, blur it, draw it back
        cctx.save();
        cctx.beginPath();
        cctx.rect(x, y, w, h);
        cctx.clip();
        cctx.filter = 'blur(12px)';
        // Draw a slightly expanded area to avoid blur edge artifacts
        cctx.drawImage(compositeCanvas, x - 4, y - 4, w + 8, h + 8, x - 4, y - 4, w + 8, h + 8);
        cctx.filter = 'none';
        cctx.restore();
      });
    }

    // 5. Render HTML annotations (text notes, pins, stamps) directly to canvas
    //    Direct canvas rendering — these are simple shapes we control
    renderAnnotationsToCanvas(cctx, offX, offY);

    // If crop bounds specified, extract just that region
    if (cropBounds) {
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropBounds.width;
      croppedCanvas.height = cropBounds.height;
      const croppedCtx = croppedCanvas.getContext('2d');
      croppedCtx.drawImage(compositeCanvas,
        cropBounds.x + offX, cropBounds.y + offY, cropBounds.width, cropBounds.height,
        0, 0, cropBounds.width, cropBounds.height);
      return croppedCanvas;
    }

    return compositeCanvas;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function canvasToBlob(canvas) {
    return new Promise(function(resolve) {
      canvas.toBlob(function(blob) {
        resolve(blob);
      }, 'image/png');
    });
  }

  async function copyImageBlob(blob) {
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Image clipboard is not available.');
    }
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
  }

  // ---------------------------------------------------------------------------
  // Save as PNG
  // ---------------------------------------------------------------------------

  async function savePNG() {
    showToast('Capturing...', 5000);

    try {
      // Small delay so toast renders before capture starts
      await new Promise(r => setTimeout(r, 50));

      const compositeCanvas = await captureComposite();
      const filename = getFilename();

      compositeCanvas.toBlob(function(blob) {
        if (!blob) {
          showToast('Error: Failed to create screenshot.', 3000);
          return;
        }

        // Download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Copy filename to clipboard
        navigator.clipboard.writeText(filename).then(function() {
          showToast(`Saved: ${filename} (name copied)`, 5000);
        }).catch(function() {
          showToast(`Saved: ${filename}`, 5000);
        });
      }, 'image/png');
    } catch (err) {
      showToast('Error: ' + err.message, 4000);
    }
  }

  // ---------------------------------------------------------------------------
  // Save cropped region as PNG
  // ---------------------------------------------------------------------------

  async function saveCrop(bounds) {
    showToast('Capturing region...', 5000);

    try {
      await new Promise(r => setTimeout(r, 50));

      const croppedCanvas = await captureComposite(bounds);
      const filename = getFilename();

      croppedCanvas.toBlob(function(blob) {
        if (!blob) {
          showToast('Error: Failed to create screenshot.', 3000);
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        navigator.clipboard.writeText(filename).then(function() {
          showToast(`Saved: ${filename} (name copied)`, 5000);
        }).catch(function() {
          showToast(`Saved: ${filename}`, 5000);
        });
      }, 'image/png');
    } catch (err) {
      showToast('Error: ' + err.message, 4000);
    }
  }

  // ---------------------------------------------------------------------------
  // Copy to clipboard
  // ---------------------------------------------------------------------------

  async function copyToClipboard() {
    showToast('Capturing...', 5000);

    try {
      await new Promise(r => setTimeout(r, 50));

      const compositeCanvas = await captureComposite();

      compositeCanvas.toBlob(function(blob) {
        if (!blob) {
          showToast('Failed to copy.', 3000);
          return;
        }
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(function() {
          showToast('Copied to clipboard!', 3000);
        }).catch(function(err) {
          showToast('Clipboard error: ' + err.message, 4000);
        });
      }, 'image/png');
    } catch (err) {
      showToast('Error: ' + err.message, 4000);
    }
  }

  // ---------------------------------------------------------------------------
  // Export notes as markdown
  // ---------------------------------------------------------------------------

  function exportNotes(annotations) {
    if (!annotations) {
      showToast('No annotations found.', 3000);
      return;
    }

    const textNotes = annotations.filter(a => a.type === 'text');
    const pins = annotations.filter(a => a.type === 'pin');

    if (textNotes.length === 0 && pins.length === 0) {
      showToast('No text notes or pins found.', 3000);
      return;
    }

    let md = `# MarkUp Notes — ${window.location.hostname}\n`;
    md += `Date: ${new Date().toLocaleString('en-US')}\n`;
    md += `URL: ${window.location.href}\n\n`;

    if (textNotes.length > 0) {
      md += `## Text Notes\n\n`;
      for (const note of textNotes) {
        md += `${note.data.num}. ${note.data.text}\n`;
      }
      md += '\n';
    }

    if (pins.length > 0) {
      md += `## Pins\n\n`;
      for (const pin of pins) {
        md += `- Pin #${pin.data.num} at position (${Math.round(pin.data.x)}, ${Math.round(pin.data.y)})\n`;
      }
      md += '\n';
    }

    // Download as .md file
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markup-notes-${getDomain()}-${getTimestamp()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`${textNotes.length} notes + ${pins.length} pins exported.`, 3000);
  }

  // ---------------------------------------------------------------------------
  // Full-page screenshot (scroll-and-stitch)
  // ---------------------------------------------------------------------------

  async function captureFullPage(keepRunningAfterStitch) {
    var overlay = window.__markupOverlay;
    if (!overlay) throw new Error('MarkUp overlay not found.');
    if (fullPageCaptureState.running) throw new Error('Full page capture already in progress.');

    fullPageCaptureState.running = true;
    fullPageCaptureState.cancelled = false;

    // Remove any visible toast so it doesn't appear in captures
    removeToast();

    var origScrollX = window.scrollX;
    var origScrollY = window.scrollY;
    var origScrollBehavior = document.documentElement.style.scrollBehavior;
    var origBodyScrollBehavior = document.body ? document.body.style.scrollBehavior : '';
    var viewW = window.innerWidth;
    var viewH = window.innerHeight;
    var totalH = getDocumentHeight();
    var overlap = Math.min(120, Math.max(48, Math.round(viewH * 0.12)));
    var step = Math.max(1, viewH - overlap);
    var positions = [];

    for (var y = 0; y < totalH; y += step) {
      positions.push(y);
    }
    if (positions.length === 0 || positions[positions.length - 1] < totalH - viewH) {
      positions.push(Math.max(0, totalH - viewH));
    }

    // Browser canvas limits vary by platform. Stay below conservative ceilings.
    if (viewW > 32767 || totalH > 32767 || estimateCanvasPixels(viewW, totalH) > 120000000) {
      fullPageCaptureState.running = false;
      throw new Error('Page is too tall to save as one image. Try crop or zoom out and capture again.');
    }

    // Hide overlay (pinned annotations are in page DOM, stay visible)
    overlay.style.display = 'none';
    document.documentElement.style.scrollBehavior = 'auto';
    if (document.body) document.body.style.scrollBehavior = 'auto';

    var chunks = [];
    var hider = createVisibilityHider();

    try {
      await warmUpLazyContent(positions);
      totalH = getDocumentHeight();
      if (viewW > 32767 || totalH > 32767 || estimateCanvasPixels(viewW, totalH) > 120000000) {
        throw new Error('Page is too tall to save as one image. Try crop or zoom out and capture again.');
      }
      positions = [];
      for (var nextY = 0; nextY < totalH; nextY += step) {
        positions.push(nextY);
      }
      if (positions.length === 0 || positions[positions.length - 1] < totalH - viewH) {
        positions.push(Math.max(0, totalH - viewH));
      }

      for (var i = 0; i < positions.length; i++) {
        ensureNotCancelled();
        showToast('Capturing full page ' + (i + 1) + ' of ' + positions.length + '...', 2500);

        await waitForScrollSettle(positions[i]);

        hideViewportChrome(hider, i > 0);
        if (i > 0) {
          await nextFrame();
        }

        removeToast();
        await nextFrame();

        var dataUrl = await throttledNativeScreenshot();
        var img = await loadImage(dataUrl);
        var pixelRatio = img.width / viewW;
        chunks.push({
          img: img,
          scrollY: window.scrollY,
          sourceW: img.width,
          sourceH: img.height,
          ratio: pixelRatio || 1,
        });
      }
    } finally {
      hider.restore();
      window.scrollTo(origScrollX, origScrollY);
      document.documentElement.style.scrollBehavior = origScrollBehavior;
      if (document.body) document.body.style.scrollBehavior = origBodyScrollBehavior;
      overlay.style.display = '';
      if (!keepRunningAfterStitch) fullPageCaptureState.running = false;
    }

    // Stitch chunks onto a single canvas
    var stitchedCanvas = document.createElement('canvas');
    stitchedCanvas.width = viewW;
    stitchedCanvas.height = totalH;
    var sctx = stitchedCanvas.getContext('2d');
    if (!sctx) throw new Error('Canvas is too large for this browser.');

    for (var j = 0; j < chunks.length; j++) {
      var chunk = chunks[j];
      var nextY = j + 1 < chunks.length ? chunks[j + 1].scrollY : totalH;
      var drawY = Math.max(0, chunk.scrollY);
      var drawH = Math.min(viewH, Math.max(0, nextY - drawY), totalH - drawY);
      if (drawH <= 0) continue;

      var sourceH = Math.min(chunk.sourceH, Math.round(drawH * chunk.ratio));
      sctx.drawImage(
        chunk.img,
        0, 0, chunk.sourceW, sourceH,
        0, drawY, viewW, drawH
      );
    }

    ensureNotCancelled();
    return stitchedCanvas;
  }

  async function saveFullPagePNG() {
    showToast('Capturing full page...', 15000);

    try {
      await new Promise(function(r) { setTimeout(r, 50); });

      var fullCanvas = await captureFullPage(true);
      ensureNotCancelled();
      var filename = 'markup-fullpage-' + getDomain() + '-' + getTimestamp() + '.png';
      var blob = await canvasToBlob(fullCanvas);
      ensureNotCancelled();

      if (!blob) {
        showToast('Error: Failed to create full page screenshot.', 3000);
        return;
      }

      ensureNotCancelled();
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try {
        await copyImageBlob(blob);
        showToast('Full page saved and copied.', 5000);
      } catch (_copyErr) {
        navigator.clipboard.writeText(filename).then(function() {
          showToast('Full page saved: ' + filename + ' (name copied)', 5000);
        }).catch(function() {
          showToast('Full page saved: ' + filename, 5000);
        });
      }
    } catch (err) {
      showToast('Error: ' + err.message, 4000);
    } finally {
      fullPageCaptureState.running = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Expose API
  // ---------------------------------------------------------------------------

  window.__markupCapture = {
    savePNG,
    saveCrop,
    copyToClipboard,
    exportNotes,
    captureComposite,
    captureFullPage,
    saveFullPagePNG,
    requestNativeScreenshot,
    cancelCapture,
    showToast,
    loadImage,
  };

})();
