// MarkUp Compare — Before/After comparison mode
// Module: exports compare functions to window.__markup

(function () {
  'use strict';
  var ns = window.__markup = window.__markup || {};

  function requestScreenshot() {
    var api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;
    return new Promise(function (resolve, reject) {
      api.runtime.sendMessage({ type: 'captureTab' }, function (response) {
        if (api.runtime.lastError) reject(new Error(api.runtime.lastError.message));
        else if (response && response.error) reject(new Error(response.error));
        else if (response && response.dataUrl) resolve(response.dataUrl);
        else reject(new Error('No screenshot data'));
      });
    });
  }

  function loadImg(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  ns.startCompare = async function () {
    var STATE = window.__markupState;
    var overlay = window.__markupOverlay;
    var toolbar = window.__markupToolbar;
    if (STATE.compareStep) return;
    window.__markupCapture?.showToast('Capturing current state...', 2000);

    overlay.style.display = 'none';
    toolbar.style.display = 'none';
    await new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 80); }); });

    try {
      STATE.compareAfterImg = await requestScreenshot();
      STATE.compareStep = 'capture-before';
    } catch (err) {
      window.__markupCapture?.showToast('Capture failed: ' + err.message, 3000);
      STATE.compareStep = null;
      overlay.style.display = '';
      toolbar.style.display = '';
      return;
    }

    overlay.style.display = '';
    toolbar.style.display = '';
    showCompareBanner();
  };

  function showCompareBanner() {
    var htmlLayer = window.__markupHtmlLayer;
    var banner = document.createElement('div');
    banner.id = 'markup-compare-banner';
    banner.innerHTML =
      '<span>Navigate to the "before" state, then:</span>' +
      '<button id="markup-capture-before" class="markup-compare-btn markup-compare-btn-primary">Capture Before</button>' +
      '<button id="markup-cancel-compare" class="markup-compare-btn">Cancel</button>';
    htmlLayer.appendChild(banner);
    document.getElementById('markup-capture-before').addEventListener('click', captureBeforeAndShow);
    document.getElementById('markup-cancel-compare').addEventListener('click', ns.exitCompare);
  }

  async function captureBeforeAndShow() {
    var STATE = window.__markupState;
    var overlay = window.__markupOverlay;
    var toolbar = window.__markupToolbar;
    window.__markupCapture?.showToast('Capturing "Before" state...', 2000);
    var banner = document.getElementById('markup-compare-banner');
    if (banner) banner.remove();

    overlay.style.display = 'none';
    toolbar.style.display = 'none';
    await new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 80); }); });

    try {
      STATE.compareBeforeImg = await requestScreenshot();
      STATE.compareStep = 'viewing';
    } catch (err) {
      window.__markupCapture?.showToast('Capture failed: ' + err.message, 3000);
      ns.cancelCompare();
      overlay.style.display = '';
      toolbar.style.display = '';
      return;
    }

    overlay.style.display = '';
    toolbar.style.display = 'none';
    showComparisonView();
  }

  ns.cancelCompare = function () {
    var STATE = window.__markupState;
    STATE.compareStep = null;
    STATE.compareAfterImg = null;
    STATE.compareBeforeImg = null;
    var banner = document.getElementById('markup-compare-banner');
    if (banner) banner.remove();
    var view = document.getElementById('markup-compare-view');
    if (view) view.remove();
  };

  ns.exitCompare = function () {
    ns.cancelCompare();
    var toolbar = window.__markupToolbar;
    toolbar.style.display = '';
  };

  function showComparisonView() {
    var STATE = window.__markupState;
    var overlay = window.__markupOverlay;
    var view = document.createElement('div');
    view.id = 'markup-compare-view';

    var beforeImg = document.createElement('img');
    beforeImg.src = STATE.compareBeforeImg;
    beforeImg.className = 'markup-compare-img markup-compare-before';

    var afterImg = document.createElement('img');
    afterImg.src = STATE.compareAfterImg;
    afterImg.className = 'markup-compare-img markup-compare-after';

    var slider = document.createElement('div');
    slider.id = 'markup-compare-slider';
    slider.innerHTML = '<div class="markup-compare-slider-handle"><span>&#9664; &#9654;</span></div>';

    var labelBefore = document.createElement('div');
    labelBefore.className = 'markup-compare-label markup-compare-label-before';
    labelBefore.textContent = 'BEFORE';

    var labelAfter = document.createElement('div');
    labelAfter.className = 'markup-compare-label markup-compare-label-after';
    labelAfter.textContent = 'AFTER';

    var actions = document.createElement('div');
    actions.className = 'markup-compare-actions';
    actions.innerHTML =
      '<button id="markup-compare-save" class="markup-compare-btn markup-compare-btn-primary">Save as PNG</button>' +
      '<button id="markup-compare-close" class="markup-compare-btn">Close (ESC)</button>';

    view.appendChild(beforeImg);
    view.appendChild(afterImg);
    view.appendChild(slider);
    view.appendChild(labelBefore);
    view.appendChild(labelAfter);
    view.appendChild(actions);
    overlay.appendChild(view);

    var sliderPos = 0.5;
    updateSlider(sliderPos, afterImg, slider);

    var dragging = false;
    function onMove(clientX) {
      sliderPos = Math.max(0.02, Math.min(0.98, clientX / window.innerWidth));
      updateSlider(sliderPos, afterImg, slider);
    }

    slider.addEventListener('mousedown', function (e) { dragging = true; e.preventDefault(); });
    view.addEventListener('mousemove', function (e) { if (dragging) onMove(e.clientX); });
    view.addEventListener('mouseup', function () { dragging = false; });
    slider.addEventListener('touchstart', function (e) { dragging = true; e.preventDefault(); }, { passive: false });
    view.addEventListener('touchmove', function (e) { if (dragging) onMove(e.touches[0].clientX); }, { passive: false });
    view.addEventListener('touchend', function () { dragging = false; });

    view.addEventListener('click', function (e) {
      if (e.target.closest('.markup-compare-actions, #markup-compare-slider')) return;
      onMove(e.clientX);
    });

    document.getElementById('markup-compare-save').addEventListener('click', saveComparison);
    document.getElementById('markup-compare-close').addEventListener('click', ns.exitCompare);
  }

  function updateSlider(pos, afterImg, slider) {
    var pct = pos * 100;
    afterImg.style.clipPath = 'inset(0 0 0 ' + pct + '%)';
    slider.style.left = pct + '%';
  }

  function drawRoundedRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  async function saveComparison() {
    var STATE = window.__markupState;
    window.__markupCapture?.showToast('Saving comparison...', 3000);
    try {
      var bImg = await loadImg(STATE.compareBeforeImg);
      var aImg = await loadImg(STATE.compareAfterImg);
      var w = bImg.naturalWidth || bImg.width;
      var h = bImg.naturalHeight || bImg.height;
      var gap = 4;

      var c = document.createElement('canvas');
      c.width = w * 2 + gap;
      c.height = h;
      var cx = c.getContext('2d');
      if (!cx) { window.__markupCapture?.showToast('Canvas error.', 3000); return; }

      cx.drawImage(bImg, 0, 0, w, h);
      cx.fillStyle = '#fff';
      cx.fillRect(w, 0, gap, h);
      cx.drawImage(aImg, w + gap, 0, w, h);

      cx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
      cx.textAlign = 'center';

      cx.fillStyle = 'rgba(0,0,0,0.6)';
      drawRoundedRect(cx, w / 2 - 45, 12, 90, 26, 6);
      cx.fill();
      cx.fillStyle = '#fff';
      cx.fillText('BEFORE', w / 2, 31);

      cx.fillStyle = 'rgba(0,0,0,0.6)';
      drawRoundedRect(cx, w + gap + w / 2 - 45, 12, 90, 26, 6);
      cx.fill();
      cx.fillStyle = '#fff';
      cx.fillText('AFTER', w + gap + w / 2, 31);

      c.toBlob(function (blob) {
        if (!blob) { window.__markupCapture?.showToast('Failed to save.', 3000); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        var d = new Date();
        var pad = function (n) { return String(n).padStart(2, '0'); };
        a.download = 'markup-compare-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.__markupCapture?.showToast('Comparison saved!', 3000);
      }, 'image/png');
    } catch (err) {
      window.__markupCapture?.showToast('Error: ' + err.message, 4000);
    }
  }
})();
