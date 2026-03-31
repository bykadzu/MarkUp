// MarkUp Toolbar — Radial toolbar UI, interactions, stamp picker, and drag
// Module: exports toolbar functions to window.__markup

(function () {
  'use strict';
  var ns = window.__markup = window.__markup || {};

  // ---------------------------------------------------------------------------
  // Toolbar HTML builder — radial circular layout
  // ---------------------------------------------------------------------------

  ns.buildToolbarHTML = function (STATE) {
    return '' +
      '<button class="markup-tb-center" id="markup-save" title="Save as PNG">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring active" style="--a:270deg" data-tool="draw" title="Pen">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:306deg" data-tool="arrow" title="Arrow">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:342deg" data-tool="rect" title="Rectangle">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:18deg" data-tool="highlight" title="Highlighter">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><rect x="2" y="16" width="20" height="5" rx="1" fill="currentColor" opacity="0.3" stroke="none"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:54deg" data-tool="blur" title="Blur / Redact">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:90deg" data-tool="text" title="Text Note">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V4h16v3"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:126deg" data-tool="pin" title="Numbered Pin">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="7"/><text x="12" y="14" text-anchor="middle" font-size="10" fill="currentColor" stroke="none">1</text></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:162deg" data-tool="stamp" title="Stamp">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 21h14"/><rect x="5" y="17" width="14" height="2"/><path d="M10 17v-3h4v3"/><rect x="9" y="5" width="6" height="9" rx="1"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:198deg" data-tool="eraser" title="Eraser">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>' +
      '</button>' +
      '<button class="markup-tb-ring" style="--a:234deg" data-tool="crop" title="Crop & Save">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2v4"/><path d="M6 6h12v12"/><path d="M18 22v-4"/><path d="M2 6h4"/><path d="M22 18h-4"/></svg>' +
      '</button>' +
      '<button class="markup-tb-inner" style="--a:283deg" id="markup-color-toggle" title="Color">' +
        '<span class="markup-tb-color-swatch" id="markup-color-swatch" style="background:' + STATE.color + '"></span>' +
      '</button>' +
      '<button class="markup-tb-inner" style="--a:334deg" id="markup-width-toggle" title="Stroke width">' +
        '<span class="markup-tb-width-swatch" id="markup-width-swatch"></span>' +
      '</button>' +
      '<button class="markup-tb-inner" style="--a:25deg" id="markup-undo" title="Undo (Ctrl+Z)">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>' +
      '</button>' +
      '<button class="markup-tb-inner" style="--a:76deg" id="markup-redo" title="Redo (Ctrl+Y)">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>' +
      '</button>' +
      '<button class="markup-tb-inner" style="--a:127deg" id="markup-clear" title="Clear all">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
      '</button>' +
      '<button class="markup-tb-inner" style="--a:178deg" id="markup-copy" title="Copy to clipboard">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
      '</button>' +
      '<button class="markup-tb-inner" style="--a:229deg" id="markup-export-notes" title="Export notes">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
      '</button>' +
      '<div class="markup-tb-color-panel" id="markup-color-panel">' +
        ns.COLORS.map(function (c) {
          return '<button class="markup-color-btn' + (c.value === STATE.color ? ' active' : '') + '" data-color="' + c.value + '" style="background:' + c.value + ';' + (c.value === '#FFFFFF' || c.value === '#000000' ? 'border-color:#555;' : '') + '" title="' + c.label + '"></button>';
        }).join('') +
        '<label class="markup-color-custom" title="Custom color">' +
          '<input type="color" id="markup-custom-color" value="' + STATE.color + '" style="opacity:0;position:absolute;width:0;height:0;">' +
          '<span style="display:flex;width:22px;height:22px;border-radius:50%;background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red);border:2px solid transparent;cursor:pointer;"></span>' +
        '</label>' +
      '</div>' +
      '<div class="markup-tb-width-panel" id="markup-width-panel">' +
        '<button class="markup-tb-width-opt' + (STATE.lineWidth <= 2 ? ' active' : '') + '" data-width="2" title="Thin">' +
          '<svg width="24" height="6" viewBox="0 0 24 6"><line x1="2" y1="3" x2="22" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<button class="markup-tb-width-opt' + (STATE.lineWidth > 2 && STATE.lineWidth <= 5 ? ' active' : '') + '" data-width="4" title="Medium">' +
          '<svg width="24" height="8" viewBox="0 0 24 8"><line x1="2" y1="4" x2="22" y2="4" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<button class="markup-tb-width-opt' + (STATE.lineWidth > 5 ? ' active' : '') + '" data-width="8" title="Thick">' +
          '<svg width="24" height="12" viewBox="0 0 24 12"><line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>' +
        '</button>' +
      '</div>';
  };

  // ---------------------------------------------------------------------------
  // Feature strip HTML
  // ---------------------------------------------------------------------------

  ns.buildFeatureStripHTML = function () {
    return '' +
      '<button class="markup-tb-feat" id="markup-compare" title="Compare Before/After">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>' +
      '</button>' +
      '<button class="markup-tb-feat" id="markup-share" title="Share">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
      '</button>' +
      '<button class="markup-tb-feat" id="markup-templates" title="Templates">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' +
      '</button>' +
      '<span class="markup-tb-feat-sep"></span>' +
      '<button class="markup-tb-feat" id="markup-fullpage" title="Full Page Screenshot">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>' +
      '</button>' +
      '<button class="markup-tb-feat" id="markup-pin-to-page" title="Pin Annotations to Page">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M5 17h14v-2l-3-3V6h1V4H7v2h1v6l-3 3z"/></svg>' +
      '</button>' +
      '<button class="markup-tb-feat" id="markup-clear-pins" title="Clear Pinned Annotations" style="display:none">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
      '<span class="markup-tb-feat-sep"></span>' +
      '<button class="markup-tb-feat markup-tb-close-btn" id="markup-close" title="Close (ESC)">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';
  };

  // ---------------------------------------------------------------------------
  // Toolbar interactions — wired by content.js after DOM creation
  // ---------------------------------------------------------------------------

  ns.initToolbar = function () {
    var STATE = window.__markupState;
    var toolbar = window.__markupToolbar;
    var htmlLayer = window.__markupHtmlLayer;

    // Tool selection + color/width from panels
    toolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tool]');
      if (btn) {
        STATE.tool = btn.dataset.tool;
        toolbar.querySelectorAll('.markup-tb-ring[data-tool]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        ns.updateCursor();
        if (STATE.tool === 'stamp') ns.showStampPicker();
        else ns.hideStampPicker();
      }

      var colorBtn = e.target.closest('[data-color]');
      if (colorBtn) {
        STATE.color = colorBtn.dataset.color;
        toolbar.querySelectorAll('.markup-color-btn').forEach(function (b) { b.classList.remove('active'); });
        colorBtn.classList.add('active');
        document.getElementById('markup-color-swatch').style.background = STATE.color;
        document.getElementById('markup-color-panel').classList.remove('open');
      }

      var widthBtn = e.target.closest('[data-width]');
      if (widthBtn) {
        STATE.lineWidth = parseInt(widthBtn.dataset.width, 10);
        toolbar.querySelectorAll('.markup-tb-width-opt').forEach(function (b) { b.classList.remove('active'); });
        widthBtn.classList.add('active');
        ns.updateWidthSwatch();
        document.getElementById('markup-width-panel').classList.remove('open');
      }
    });

    // Color panel toggle
    document.getElementById('markup-color-toggle').addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('markup-width-panel').classList.remove('open');
      document.getElementById('markup-color-panel').classList.toggle('open');
    });

    // Width panel toggle
    document.getElementById('markup-width-toggle').addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('markup-color-panel').classList.remove('open');
      document.getElementById('markup-width-panel').classList.toggle('open');
    });

    // Close panels on outside click
    ns.addListener(document, 'mousedown', function (e) {
      if (!e.target.closest('#markup-color-toggle') && !e.target.closest('#markup-color-panel')) {
        var cp = document.getElementById('markup-color-panel');
        if (cp) cp.classList.remove('open');
      }
      if (!e.target.closest('#markup-width-toggle') && !e.target.closest('#markup-width-panel')) {
        var wp = document.getElementById('markup-width-panel');
        if (wp) wp.classList.remove('open');
      }
      if (!e.target.closest('#markup-templates') && !e.target.closest('#markup-template-panel')) {
        var tp = document.getElementById('markup-template-panel');
        if (tp) tp.classList.remove('open');
      }
    });

    // Custom color picker
    var customColorInput = toolbar.querySelector('#markup-custom-color');
    if (customColorInput) {
      customColorInput.addEventListener('input', function (e) {
        STATE.color = e.target.value;
        toolbar.querySelectorAll('.markup-color-btn').forEach(function (b) { b.classList.remove('active'); });
        document.getElementById('markup-color-swatch').style.background = STATE.color;
      });
    }

    // Action buttons
    toolbar.querySelector('#markup-undo').addEventListener('click', ns.undo);
    toolbar.querySelector('#markup-redo').addEventListener('click', ns.redo);
    toolbar.querySelector('#markup-clear').addEventListener('click', ns.clearAll);
    toolbar.querySelector('#markup-save').addEventListener('click', function () { window.__markupCapture?.savePNG(); });
    toolbar.querySelector('#markup-copy').addEventListener('click', function () { window.__markupCapture?.copyToClipboard(); });
    toolbar.querySelector('#markup-export-notes').addEventListener('click', function () { window.__markupCapture?.exportNotes(STATE.annotations); });
    toolbar.querySelector('#markup-close').addEventListener('click', function () { ns.destroyOverlay(); });

    // Feature button handlers
    toolbar.querySelector('#markup-compare').addEventListener('click', ns.startCompare);
    toolbar.querySelector('#markup-share').addEventListener('click', ns.shareScreenshot);
    toolbar.querySelector('#markup-templates').addEventListener('click', ns.toggleTemplatePanel);
    toolbar.querySelector('#markup-fullpage').addEventListener('click', function () { window.__markupCapture?.saveFullPagePNG(); });
    toolbar.querySelector('#markup-pin-to-page').addEventListener('click', ns.pinAnnotationsToPage);
    toolbar.querySelector('#markup-clear-pins').addEventListener('click', ns.clearPinnedAnnotations);

    ns.updateClearPinsVisibility();

    // Stamp picker
    var stampPicker = document.createElement('div');
    stampPicker.id = 'markup-stamp-picker';
    stampPicker.className = 'markup-stamp-picker';
    stampPicker.innerHTML =
      '<button class="markup-stamp-opt active" data-stamp="checkmark" title="Checkmark"><span style="color:#16A34A">\u2713</span></button>' +
      '<button class="markup-stamp-opt" data-stamp="cross" title="Cross"><span style="color:#DC2626">\u2717</span></button>' +
      '<button class="markup-stamp-opt" data-stamp="question" title="Question"><span style="color:#F97316">?</span></button>' +
      '<button class="markup-stamp-opt" data-stamp="star" title="Star"><span style="color:#EAB308">\u2605</span></button>';
    stampPicker.style.display = 'none';
    htmlLayer.appendChild(stampPicker);

    stampPicker.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-stamp]');
      if (!opt) return;
      e.stopPropagation();
      STATE.stampType = opt.dataset.stamp;
      stampPicker.querySelectorAll('.markup-stamp-opt').forEach(function (b) { b.classList.remove('active'); });
      opt.classList.add('active');
    });

    ns.showStampPicker = function () {
      var stampBtn = toolbar.querySelector('[data-tool="stamp"]');
      if (!stampBtn) return;
      var rect = stampBtn.getBoundingClientRect();
      stampPicker.style.left = rect.left + 'px';
      stampPicker.style.top = (rect.bottom + 6) + 'px';
      stampPicker.style.display = 'flex';
    };

    ns.hideStampPicker = function () {
      stampPicker.style.display = 'none';
    };

    // Template panel container
    var templatePanel = document.createElement('div');
    templatePanel.id = 'markup-template-panel';
    templatePanel.className = 'markup-template-panel';
    htmlLayer.appendChild(templatePanel);

    // Toolbar dragging
    toolbar.addEventListener('mousedown', function (e) {
      if (e.target.closest('button, input, label, .markup-tb-color-panel, .markup-tb-width-panel, .markup-tb-features, .markup-template-panel')) return;
      STATE.toolbarDrag.active = true;
      var rect = toolbar.getBoundingClientRect();
      STATE.toolbarDrag.offsetX = e.clientX - rect.left;
      STATE.toolbarDrag.offsetY = e.clientY - rect.top;
      toolbar.style.cursor = 'grabbing';
      e.preventDefault();
    });

    ns.addListener(document, 'mousemove', function (e) {
      if (!STATE.toolbarDrag.active) return;
      var tbRect = toolbar.getBoundingClientRect();
      var newLeft = Math.max(40 - tbRect.width, Math.min(window.innerWidth - 40, e.clientX - STATE.toolbarDrag.offsetX));
      var newTop = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - STATE.toolbarDrag.offsetY));
      toolbar.style.left = newLeft + 'px';
      toolbar.style.top = newTop + 'px';
    });

    ns.addListener(document, 'mouseup', function () {
      if (STATE.toolbarDrag.active) toolbar.style.cursor = '';
      STATE.toolbarDrag.active = false;
    });
  };

  // Width swatch updater
  ns.updateWidthSwatch = function () {
    var STATE = window.__markupState;
    var swatch = document.getElementById('markup-width-swatch');
    if (swatch) swatch.style.height = Math.max(2, STATE.lineWidth) + 'px';
  };

  // Clamp toolbar into visible area
  ns.clampToolbarPosition = function () {
    var toolbar = window.__markupToolbar;
    var tbRect = toolbar.getBoundingClientRect();
    var newLeft = Math.max(40 - tbRect.width, Math.min(window.innerWidth - 40, tbRect.left));
    var newTop = Math.max(0, Math.min(window.innerHeight - 40, tbRect.top));
    toolbar.style.left = newLeft + 'px';
    toolbar.style.top = newTop + 'px';
  };
})();
