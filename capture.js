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

  // Toast notification
  function showToast(message, duration) {
    duration = duration || 4000;
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

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
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
      htmlLayer.querySelectorAll('.markup-text-note, .markup-pin, .markup-stamp').forEach(function(el) {
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

  async function captureComposite(cropBounds) {
    const overlay = window.__markupOverlay;
    const toolbar = window.__markupToolbar;
    const annotCanvas = window.__markupCanvas;

    if (!overlay || !annotCanvas) {
      throw new Error('MarkUp overlay nicht gefunden.');
    }

    // Calculate capture bounds that include all annotations
    const bounds = getAnnotationBounds();
    const captureW = bounds.width;
    const captureH = bounds.height;
    const offX = bounds.offsetX;
    const offY = bounds.offsetY;

    // Temporarily hide the toolbar and overlay pointer-events so html2canvas captures the page
    toolbar.style.display = 'none';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';

    let pageCanvas;
    try {
      // Capture the underlying page
      // Pre-process: strip oklab/oklch from ALL stylesheets + inline styles
      // html2canvas can't parse modern CSS color functions
      const allStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
      const originalStyles = [];
      const oklabRegex = /oklab\([^)]*\)/g;
      const oklchRegex = /oklch\([^)]*\)/g;
      const fallback = 'rgb(128,128,128)';

      // Fix <style> tags
      document.querySelectorAll('style').forEach(function(s) {
        originalStyles.push({ el: s, text: s.textContent });
        s.textContent = s.textContent.replace(oklabRegex, fallback).replace(oklchRegex, fallback);
      });

      // Fix inline styles on all elements
      const inlineFixed = [];
      document.querySelectorAll('[style]').forEach(function(el) {
        var orig = el.getAttribute('style');
        if (orig && (orig.includes('oklab') || orig.includes('oklch'))) {
          inlineFixed.push({ el: el, style: orig });
          el.setAttribute('style', orig.replace(oklabRegex, fallback).replace(oklchRegex, fallback));
        }
      });

      // Fix CSS custom properties on :root / html
      var rootStyle = document.documentElement.getAttribute('style') || '';
      var hadRootFix = false;
      if (rootStyle.includes('oklab') || rootStyle.includes('oklch')) {
        hadRootFix = true;
        document.documentElement.setAttribute('style', rootStyle.replace(oklabRegex, fallback).replace(oklchRegex, fallback));
      }

      pageCanvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        width: captureW,
        height: captureH,
        windowWidth: captureW,
        windowHeight: captureH,
        x: window.scrollX + bounds.x,
        y: window.scrollY + bounds.y,
        scale: 1,
        logging: false,
        onclone: function(clonedDoc) {
          // Also fix in the cloned document html2canvas uses
          clonedDoc.querySelectorAll('style').forEach(function(s) {
            s.textContent = s.textContent.replace(oklabRegex, fallback).replace(oklchRegex, fallback);
          });
          clonedDoc.querySelectorAll('[style]').forEach(function(el) {
            var st = el.getAttribute('style');
            if (st && (st.includes('oklab') || st.includes('oklch'))) {
              el.setAttribute('style', st.replace(oklabRegex, fallback).replace(oklchRegex, fallback));
            }
          });
        }
      });

      // Restore everything
      originalStyles.forEach(function(item) { item.el.textContent = item.text; });
      inlineFixed.forEach(function(item) { item.el.setAttribute('style', item.style); });
      if (hadRootFix) document.documentElement.setAttribute('style', rootStyle);
    } finally {
      overlay.style.display = '';
      overlay.style.pointerEvents = '';
      toolbar.style.display = '';
    }

    // Create composite canvas at the expanded size
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = captureW;
    compositeCanvas.height = captureH;
    const cctx = compositeCanvas.getContext('2d');

    // 1. Draw page screenshot (already sized to captureW x captureH)
    cctx.drawImage(pageCanvas, 0, 0, captureW, captureH);

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

    // 4. Render HTML annotations (text notes, pins) via html2canvas
    const htmlLayer = window.__markupHtmlLayer;
    const stampPicker = document.getElementById('markup-stamp-picker');
    const stampPickerDisplay = stampPicker ? stampPicker.style.display : '';
    if (htmlLayer) {
      // Temporarily hide toolbar and stamp picker for this capture
      toolbar.style.display = 'none';
      if (stampPicker) stampPicker.style.display = 'none';
      try {
        const htmlCanvas = await html2canvas(htmlLayer, {
          backgroundColor: null,
          scale: 1,
          logging: false,
          width: captureW,
          height: captureH,
          x: bounds.x,
          y: bounds.y,
        });
        cctx.drawImage(htmlCanvas, 0, 0);
      } catch (_e) {
        // HTML layer capture failed — skip silently
      } finally {
        toolbar.style.display = '';
        if (stampPicker) stampPicker.style.display = stampPickerDisplay;
      }
    }

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

  // ---------------------------------------------------------------------------
  // Save as PNG
  // ---------------------------------------------------------------------------

  async function savePNG() {
    showToast('Wird erfasst...', 15000);

    try {
      // Small delay so toast renders before html2canvas blocks
      await new Promise(r => setTimeout(r, 50));

      const compositeCanvas = await captureComposite();
      const filename = getFilename();
      const savePath = `C:\\Users\\gentl\\Downloads\\${filename}`;

      // Use original callback pattern (proven to work)
      compositeCanvas.toBlob(function(blob) {
        if (!blob) {
          showToast('Fehler: Screenshot konnte nicht erstellt werden.', 3000);
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

        // Copy PATH to clipboard (most useful for Claude Code workflow)
        navigator.clipboard.writeText(savePath).then(function() {
          showToast(`Gespeichert + Pfad kopiert: ${savePath}`, 5000);
        }).catch(function() {
          showToast(`Gespeichert: ${savePath}`, 5000);
        });
      }, 'image/png');
    } catch (err) {
      showToast('Fehler: ' + err.message, 4000);
    }
  }

  // ---------------------------------------------------------------------------
  // Save cropped region as PNG
  // ---------------------------------------------------------------------------

  async function saveCrop(bounds) {
    showToast('Bereich wird erfasst...', 15000);

    try {
      await new Promise(r => setTimeout(r, 50));

      const croppedCanvas = await captureComposite(bounds);
      const filename = getFilename();
      const savePath = `C:\\Users\\gentl\\Downloads\\${filename}`;

      croppedCanvas.toBlob(function(blob) {
        if (!blob) {
          showToast('Fehler: Screenshot konnte nicht erstellt werden.', 3000);
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

        navigator.clipboard.writeText(savePath).then(function() {
          showToast(`Gespeichert + Pfad kopiert: ${savePath}`, 5000);
        }).catch(function() {
          showToast(`Gespeichert: ${savePath}`, 5000);
        });
      }, 'image/png');
    } catch (err) {
      showToast('Fehler: ' + err.message, 4000);
    }
  }

  // ---------------------------------------------------------------------------
  // Copy to clipboard
  // ---------------------------------------------------------------------------

  async function copyToClipboard() {
    showToast('Wird erfasst...', 15000);

    try {
      await new Promise(r => setTimeout(r, 50));

      const compositeCanvas = await captureComposite();

      compositeCanvas.toBlob(function(blob) {
        if (!blob) {
          showToast('Fehler beim Kopieren.', 3000);
          return;
        }
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(function() {
          showToast('In Zwischenablage kopiert!', 3000);
        }).catch(function(err) {
          showToast('Zwischenablage-Fehler: ' + err.message, 4000);
        });
      }, 'image/png');
    } catch (err) {
      showToast('Fehler: ' + err.message, 4000);
    }
  }

  // ---------------------------------------------------------------------------
  // Export notes as markdown
  // ---------------------------------------------------------------------------

  function exportNotes(annotations) {
    if (!annotations) {
      showToast('Keine Annotationen vorhanden.', 3000);
      return;
    }

    const textNotes = annotations.filter(a => a.type === 'text');
    const pins = annotations.filter(a => a.type === 'pin');

    if (textNotes.length === 0 && pins.length === 0) {
      showToast('Keine Textnotizen oder Pins vorhanden.', 3000);
      return;
    }

    let md = `# MarkUp Notizen — ${window.location.hostname}\n`;
    md += `Datum: ${new Date().toLocaleString('de-CH')}\n`;
    md += `URL: ${window.location.href}\n\n`;

    if (textNotes.length > 0) {
      md += `## Textnotizen\n\n`;
      for (const note of textNotes) {
        md += `${note.data.num}. ${note.data.text}\n`;
      }
      md += '\n';
    }

    if (pins.length > 0) {
      md += `## Pins\n\n`;
      for (const pin of pins) {
        md += `- Pin #${pin.data.num} bei Position (${Math.round(pin.data.x)}, ${Math.round(pin.data.y)})\n`;
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

    showToast(`${textNotes.length} Notizen + ${pins.length} Pins exportiert.`, 3000);
  }

  // ---------------------------------------------------------------------------
  // Expose API
  // ---------------------------------------------------------------------------

  window.__markupCapture = {
    savePNG,
    saveCrop,
    copyToClipboard,
    exportNotes,
  };

})();
