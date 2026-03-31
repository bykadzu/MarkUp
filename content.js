// Sentry error reporting (lightweight - no SDK)
function reportErrorToSentry(error, context = {}) {
  const envelope = `{"event_id":"${crypto.randomUUID().replace(/-/g, '')}","sent_at":"${new Date().toISOString()}","dsn":"https://b627e00815b392f23c364de2274dba73@o4509754720059392.ingest.de.sentry.io/4511121377067088"}
{"type":"event"}
${JSON.stringify({
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    release: 'markup@1.0.0',
    environment: 'production',
    tags: { product: 'markup', component: context.component || 'content' },
    exception: { values: [{ type: error?.name || 'Error', value: error?.message || String(error) }] }
  })}`;
  fetch('https://o4509754720059392.ingest.de.sentry.io/api/4511121377067088/envelope/', {
    method: 'POST',
    body: envelope,
  }).catch(() => {});
}

window.addEventListener('error', (e) => reportErrorToSentry(e.error || e, { component: 'content' }));
window.addEventListener('unhandledrejection', (e) => reportErrorToSentry(e.reason || e, { component: 'content' }));

// MarkUp Content Script — Orchestrator
// Creates overlay, wires events, manages lifecycle. Loaded last after all modules.

(function () {
  'use strict';

  // Prevent double-injection
  if (document.getElementById('markup-overlay')) return;

  var ns = window.__markup = window.__markup || {};

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var COLORS = [
    { value: '#DC2626', label: 'Red' },
    { value: '#F97316', label: 'Orange' },
    { value: '#EAB308', label: 'Yellow' },
    { value: '#16A34A', label: 'Green' },
    { value: '#2563EB', label: 'Blue' },
    { value: '#8B5CF6', label: 'Violet' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#FFFFFF', label: 'White' },
    { value: '#000000', label: 'Black' },
  ];
  ns.COLORS = COLORS;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  var STATE = {
    tool: 'draw',
    color: '#DC2626',
    lineWidth: 3,
    pinCounter: 1,
    stampType: 'checkmark',
    isDrawing: false,
    startX: 0,
    startY: 0,
    annotations: [],
    undoStack: [],
    currentPath: null,
    toolbarDrag: { active: false, offsetX: 0, offsetY: 0 },
    compareStep: null,
    compareAfterImg: null,
    compareBeforeImg: null,
    templateMode: null,
  };

  // ---------------------------------------------------------------------------
  // Listener tracking (Task 2: cleanup on destroy)
  // ---------------------------------------------------------------------------

  var trackedListeners = [];

  ns.addListener = function (el, event, fn, options) {
    el.addEventListener(event, fn, options);
    trackedListeners.push({ el: el, event: event, fn: fn, options: options });
  };

  function removeAllListeners() {
    for (var i = 0; i < trackedListeners.length; i++) {
      var l = trackedListeners[i];
      l.el.removeEventListener(l.event, l.fn, l.options);
    }
    trackedListeners.length = 0;
  }

  // ---------------------------------------------------------------------------
  // Overlay container (full viewport, fixed)
  // ---------------------------------------------------------------------------

  var overlay, canvas, ctx, svgLayer, htmlLayer, toolbar;

  try {
    overlay = document.createElement('div');
    overlay.id = 'markup-overlay';
    document.body.appendChild(overlay);

    canvas = document.createElement('canvas');
    canvas.id = 'markup-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    overlay.appendChild(canvas);

    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.id = 'markup-svg';
    svgLayer.setAttribute('width', window.innerWidth);
    svgLayer.setAttribute('height', window.innerHeight);
    overlay.appendChild(svgLayer);

    htmlLayer = document.createElement('div');
    htmlLayer.id = 'markup-html';
    overlay.appendChild(htmlLayer);

    toolbar = document.createElement('div');
    toolbar.id = 'markup-toolbar';
    toolbar.innerHTML = ns.buildToolbarHTML(STATE);
    htmlLayer.appendChild(toolbar);

    toolbar.style.top = '12px';
    toolbar.style.left = Math.max(8, (window.innerWidth - 224) / 2) + 'px';

    // Feature strip
    var featureStrip = document.createElement('div');
    featureStrip.id = 'markup-features';
    featureStrip.className = 'markup-tb-features';
    featureStrip.innerHTML = ns.buildFeatureStripHTML();
    toolbar.appendChild(featureStrip);
  } catch (err) {
    // Error boundary: if overlay creation fails, show toast and abort
    if (window.__markupCapture) {
      window.__markupCapture.showToast('MarkUp failed to initialize: ' + err.message, 5000);
    }
    if (overlay && overlay.parentNode) overlay.remove();
    return;
  }

  // ---------------------------------------------------------------------------
  // Expose globals for modules and capture.js
  // ---------------------------------------------------------------------------

  window.__markupState = STATE;
  window.__markupOverlay = overlay;
  window.__markupCanvas = canvas;
  window.__markupCtx = ctx;
  window.__markupSvgLayer = svgLayer;
  window.__markupHtmlLayer = htmlLayer;
  window.__markupToolbar = toolbar;

  // ---------------------------------------------------------------------------
  // Initialize toolbar (wires all toolbar event handlers)
  // ---------------------------------------------------------------------------

  ns.initToolbar();
  ns.updateWidthSwatch();

  // ---------------------------------------------------------------------------
  // Pointer helpers
  // ---------------------------------------------------------------------------

  ns.getPos = function (e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  function isOnToolbar(e) {
    return toolbar.contains(e.target);
  }

  // ---------------------------------------------------------------------------
  // Pointer event routing
  // ---------------------------------------------------------------------------

  function onPointerDown(e) {
    if (isOnToolbar(e)) return;
    if (e.target.closest('.markup-text-note, .markup-fmt-bar, .markup-text-input, .markup-text-label, .markup-text-input-wrap, .markup-stamp-picker, .markup-template-panel, #markup-compare-banner, #markup-compare-view, #markup-share-modal')) return;

    var pos = ns.getPos(e);

    if (STATE.templateMode) {
      ns.placeTemplateAnnotation(pos, STATE.templateMode);
      return;
    }

    switch (STATE.tool) {
      case 'draw': ns.startFreehand(pos); break;
      case 'arrow': case 'rect': case 'highlight': case 'blur': case 'crop':
        STATE.isDrawing = true;
        STATE.startX = pos.x;
        STATE.startY = pos.y;
        break;
      case 'text': ns.placeTextNote(pos); break;
      case 'pin': ns.placePin(pos); break;
      case 'stamp': ns.placeStamp(pos); break;
      case 'eraser': ns.tryErase(e); break;
    }
  }

  function onPointerMove(e) {
    if (!STATE.isDrawing) return;
    var pos = ns.getPos(e);
    switch (STATE.tool) {
      case 'draw': ns.continueFreehand(pos); break;
      case 'arrow': ns.previewArrow(pos); break;
      case 'rect': ns.previewRect(pos); break;
      case 'highlight': ns.previewHighlight(pos); break;
      case 'blur': ns.previewBlur(pos); break;
      case 'crop': ns.previewCrop(pos); break;
    }
  }

  function onPointerUp(e) {
    if (!STATE.isDrawing) return;
    var pos = ns.getPos(e);
    switch (STATE.tool) {
      case 'draw': ns.endFreehand(); break;
      case 'arrow': ns.placeArrow(pos); break;
      case 'rect': ns.placeRect(pos); break;
      case 'highlight': ns.placeHighlight(pos); break;
      case 'blur': ns.placeBlur(pos); break;
      case 'crop': ns.finishCrop(pos); break;
    }
    STATE.isDrawing = false;
  }

  // Mouse
  overlay.addEventListener('mousedown', onPointerDown);
  overlay.addEventListener('mousemove', onPointerMove);
  overlay.addEventListener('mouseup', onPointerUp);

  // Touch
  overlay.addEventListener('touchstart', function (e) { e.preventDefault(); onPointerDown(e); }, { passive: false });
  overlay.addEventListener('touchmove', function (e) { e.preventDefault(); onPointerMove(e); }, { passive: false });
  overlay.addEventListener('touchend', function (e) { onPointerUp(e); }, { passive: false });

  // ---------------------------------------------------------------------------
  // Cursor
  // ---------------------------------------------------------------------------

  var cursors = {
    draw: 'crosshair', arrow: 'crosshair', rect: 'crosshair', highlight: 'crosshair',
    blur: 'crosshair', text: 'text', pin: 'crosshair', eraser: 'pointer',
    crop: 'crosshair', stamp: 'crosshair',
  };

  ns.updateCursor = function () {
    overlay.style.cursor = STATE.templateMode ? 'crosshair' : (cursors[STATE.tool] || 'default');
  };
  ns.updateCursor();

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------

  ns.addListener(document, 'keydown', ns.onKeyDown);

  // ---------------------------------------------------------------------------
  // Window resize
  // ---------------------------------------------------------------------------

  ns.addListener(window, 'resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    svgLayer.setAttribute('width', window.innerWidth);
    svgLayer.setAttribute('height', window.innerHeight);
    ns.redrawCanvas();
    ns.clampToolbarPosition();
  });

  // ---------------------------------------------------------------------------
  // Destroy / cleanup
  // ---------------------------------------------------------------------------

  ns.destroyOverlay = function () {
    ns.cancelCompare();
    STATE.templateMode = null;
    removeAllListeners();
    overlay.remove();
    delete window.__markupState;
    delete window.__markupOverlay;
    delete window.__markupCanvas;
    delete window.__markupCtx;
    delete window.__markupSvgLayer;
    delete window.__markupHtmlLayer;
    delete window.__markupToolbar;
  };

})();
