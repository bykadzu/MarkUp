// MarkUp Content Script — Main annotation engine
// Injected into the active tab when user clicks "Annotieren"

(function () {
  'use strict';

  // Prevent double-injection
  if (document.getElementById('markup-overlay')) return;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const STATE = {
    tool: 'draw',           // draw | arrow | rect | highlight | text | pin | eraser
    color: '#DC2626',
    lineWidth: 3,
    pinCounter: 1,
    isDrawing: false,
    startX: 0,
    startY: 0,
    annotations: [],        // { type, element, data }
    undoStack: [],
    currentPath: null,
    toolbarDrag: { active: false, offsetX: 0, offsetY: 0 },
  };

  const COLORS = [
    { value: '#DC2626', label: 'Rot' },
    { value: '#2563EB', label: 'Blau' },
    { value: '#16A34A', label: 'Gruen' },
    { value: '#EAB308', label: 'Gelb' },
    { value: '#FFFFFF', label: 'Weiss' },
  ];

  // ---------------------------------------------------------------------------
  // Overlay container (sits on top of the page, full viewport, fixed)
  // ---------------------------------------------------------------------------

  const overlay = document.createElement('div');
  overlay.id = 'markup-overlay';
  document.body.appendChild(overlay);

  // SVG layer for arrows/rects, canvas layer for freehand
  const canvas = document.createElement('canvas');
  canvas.id = 'markup-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  overlay.appendChild(canvas);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // SVG layer for shape previews and placed shapes
  const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgLayer.id = 'markup-svg';
  svgLayer.setAttribute('width', window.innerWidth);
  svgLayer.setAttribute('height', window.innerHeight);
  overlay.appendChild(svgLayer);

  // HTML layer for text notes, pins, toolbar
  const htmlLayer = document.createElement('div');
  htmlLayer.id = 'markup-html';
  overlay.appendChild(htmlLayer);

  // ---------------------------------------------------------------------------
  // Toolbar
  // ---------------------------------------------------------------------------

  const toolbar = document.createElement('div');
  toolbar.id = 'markup-toolbar';
  toolbar.innerHTML = buildToolbarHTML();
  htmlLayer.appendChild(toolbar);

  // Position toolbar at top-center
  toolbar.style.left = Math.max(8, (window.innerWidth - 600) / 2) + 'px';
  toolbar.style.top = '12px';

  // ---------------------------------------------------------------------------
  // Toolbar HTML builder
  // ---------------------------------------------------------------------------

  function buildToolbarHTML() {
    return `
      <div class="markup-tb-drag" id="markup-tb-drag" title="Verschieben">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
      </div>
      <div class="markup-tb-divider"></div>

      <!-- Tools -->
      <button class="markup-tb-btn active" data-tool="draw" title="Freihand zeichnen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </button>
      <button class="markup-tb-btn" data-tool="arrow" title="Pfeil">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg>
      </button>
      <button class="markup-tb-btn" data-tool="rect" title="Rechteck">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      </button>
      <button class="markup-tb-btn" data-tool="highlight" title="Textmarker">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><rect x="2" y="16" width="20" height="5" rx="1" fill="currentColor" opacity="0.3" stroke="none"/></svg>
      </button>
      <button class="markup-tb-btn" data-tool="text" title="Textnotiz">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V4h16v3"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>
      </button>
      <button class="markup-tb-btn" data-tool="pin" title="Nummerierter Pin">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="7"/><text x="12" y="14" text-anchor="middle" font-size="10" fill="currentColor" stroke="none">1</text></svg>
      </button>

      <div class="markup-tb-divider"></div>

      <button class="markup-tb-btn" data-tool="eraser" title="Radierer (Annotation loeschen)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
      </button>

      <div class="markup-tb-divider"></div>

      <!-- Colors -->
      <div class="markup-tb-colors">
        ${COLORS.map(c => `<button class="markup-color-btn${c.value === STATE.color ? ' active' : ''}" data-color="${c.value}" style="background:${c.value};${c.value === '#FFFFFF' ? 'border:1px solid #555;' : ''}" title="${c.label}"></button>`).join('')}
      </div>

      <div class="markup-tb-divider"></div>

      <!-- Line width -->
      <div class="markup-tb-slider-wrap" title="Linienstaerke">
        <input type="range" id="markup-line-width" class="markup-slider" min="2" max="8" value="${STATE.lineWidth}" step="1">
      </div>

      <div class="markup-tb-divider"></div>

      <!-- Actions -->
      <button class="markup-tb-btn" id="markup-undo" title="Rueckgaengig (Ctrl+Z)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>
      <button class="markup-tb-btn" id="markup-clear" title="Alles loeschen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>

      <div class="markup-tb-divider"></div>

      <!-- Export -->
      <button class="markup-tb-btn markup-tb-accent" id="markup-save" title="Als PNG speichern">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
      <button class="markup-tb-btn" id="markup-copy" title="In Zwischenablage kopieren">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button class="markup-tb-btn" id="markup-export-notes" title="Notizen exportieren">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </button>

      <div class="markup-tb-divider"></div>

      <!-- Close -->
      <button class="markup-tb-btn markup-tb-close" id="markup-close" title="Beenden (ESC)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
  }

  // ---------------------------------------------------------------------------
  // Toolbar interactions
  // ---------------------------------------------------------------------------

  // Tool selection
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tool]');
    if (btn) {
      STATE.tool = btn.dataset.tool;
      toolbar.querySelectorAll('.markup-tb-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateCursor();
    }

    const colorBtn = e.target.closest('[data-color]');
    if (colorBtn) {
      STATE.color = colorBtn.dataset.color;
      toolbar.querySelectorAll('.markup-color-btn').forEach(b => b.classList.remove('active'));
      colorBtn.classList.add('active');
    }
  });

  // Line width slider
  toolbar.querySelector('#markup-line-width').addEventListener('input', (e) => {
    STATE.lineWidth = parseInt(e.target.value, 10);
  });

  // Action buttons
  toolbar.querySelector('#markup-undo').addEventListener('click', undo);
  toolbar.querySelector('#markup-clear').addEventListener('click', clearAll);
  toolbar.querySelector('#markup-save').addEventListener('click', () => window.__markupCapture?.savePNG());
  toolbar.querySelector('#markup-copy').addEventListener('click', () => window.__markupCapture?.copyToClipboard());
  toolbar.querySelector('#markup-export-notes').addEventListener('click', () => window.__markupCapture?.exportNotes(STATE.annotations));
  toolbar.querySelector('#markup-close').addEventListener('click', destroyOverlay);

  // ---------------------------------------------------------------------------
  // Toolbar dragging
  // ---------------------------------------------------------------------------

  const dragHandle = toolbar.querySelector('#markup-tb-drag');

  dragHandle.addEventListener('mousedown', (e) => {
    STATE.toolbarDrag.active = true;
    const rect = toolbar.getBoundingClientRect();
    STATE.toolbarDrag.offsetX = e.clientX - rect.left;
    STATE.toolbarDrag.offsetY = e.clientY - rect.top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!STATE.toolbarDrag.active) return;
    toolbar.style.left = (e.clientX - STATE.toolbarDrag.offsetX) + 'px';
    toolbar.style.top = (e.clientY - STATE.toolbarDrag.offsetY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    STATE.toolbarDrag.active = false;
  });

  // ---------------------------------------------------------------------------
  // Canvas / Drawing — pointer events on the overlay
  // ---------------------------------------------------------------------------

  function getPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function isOnToolbar(e) {
    return toolbar.contains(e.target);
  }

  // Preview element for arrows / rects while dragging
  let previewEl = null;

  // --- POINTER DOWN ---
  function onPointerDown(e) {
    if (isOnToolbar(e)) return;
    if (e.target.closest('.markup-text-note, .markup-fmt-bar, .markup-text-input, .markup-text-label, .markup-text-input-wrap')) return;

    const pos = getPos(e);

    switch (STATE.tool) {
      case 'draw':
        startFreehand(pos);
        break;
      case 'arrow':
      case 'rect':
      case 'highlight':
        STATE.isDrawing = true;
        STATE.startX = pos.x;
        STATE.startY = pos.y;
        break;
      case 'text':
        placeTextNote(pos);
        break;
      case 'pin':
        placePin(pos);
        break;
      case 'eraser':
        tryErase(e);
        break;
    }
  }

  // --- POINTER MOVE ---
  function onPointerMove(e) {
    if (!STATE.isDrawing) return;
    const pos = getPos(e);

    switch (STATE.tool) {
      case 'draw':
        continueFreehand(pos);
        break;
      case 'arrow':
        previewArrow(pos);
        break;
      case 'rect':
        previewRect(pos);
        break;
      case 'highlight':
        previewHighlight(pos);
        break;
    }
  }

  // --- POINTER UP ---
  function onPointerUp(e) {
    if (!STATE.isDrawing) return;
    const pos = getPos(e);

    switch (STATE.tool) {
      case 'draw':
        endFreehand();
        break;
      case 'arrow':
        placeArrow(pos);
        break;
      case 'rect':
        placeRect(pos);
        break;
      case 'highlight':
        placeHighlight(pos);
        break;
    }

    STATE.isDrawing = false;
  }

  // Mouse
  overlay.addEventListener('mousedown', onPointerDown);
  overlay.addEventListener('mousemove', onPointerMove);
  overlay.addEventListener('mouseup', onPointerUp);

  // Touch
  overlay.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e); }, { passive: false });
  overlay.addEventListener('touchmove', (e) => { e.preventDefault(); onPointerMove(e); }, { passive: false });
  overlay.addEventListener('touchend', (e) => { onPointerUp(e); }, { passive: false });

  // ---------------------------------------------------------------------------
  // Tool: Freehand draw
  // ---------------------------------------------------------------------------

  function startFreehand(pos) {
    STATE.isDrawing = true;
    STATE.currentPath = {
      points: [pos],
      color: STATE.color,
      width: STATE.lineWidth,
    };
    ctx.strokeStyle = STATE.color;
    ctx.lineWidth = STATE.lineWidth;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function continueFreehand(pos) {
    if (!STATE.currentPath) return;
    STATE.currentPath.points.push(pos);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function endFreehand() {
    if (!STATE.currentPath && !STATE.isDrawing) return;
    // Store the path data so we can re-render on undo/redo
    if (STATE.currentPath && STATE.currentPath.points.length > 1) {
      const pathData = { ...STATE.currentPath };
      STATE.annotations.push({
        type: 'draw',
        element: null,  // canvas-based, re-rendered
        data: pathData,
      });
      STATE.undoStack = [];
    }
    STATE.currentPath = null;
  }

  // Re-render all freehand paths (used after undo/clear)
  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const ann of STATE.annotations) {
      if (ann.type === 'draw') {
        const d = ann.data;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        for (let i = 1; i < d.points.length; i++) {
          ctx.lineTo(d.points[i].x, d.points[i].y);
        }
        ctx.stroke();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Tool: Arrow
  // ---------------------------------------------------------------------------

  function previewArrow(pos) {
    if (previewEl) previewEl.remove();
    previewEl = createSVGArrow(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    previewEl.classList.add('markup-preview');
    svgLayer.appendChild(previewEl);
  }

  function placeArrow(pos) {
    if (previewEl) previewEl.remove();
    previewEl = null;

    const dx = pos.x - STATE.startX;
    const dy = pos.y - STATE.startY;
    if (Math.sqrt(dx * dx + dy * dy) < 5) return; // Too small

    const el = createSVGArrow(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    el.classList.add('markup-annotation');
    svgLayer.appendChild(el);

    STATE.annotations.push({
      type: 'arrow',
      element: el,
      data: { x1: STATE.startX, y1: STATE.startY, x2: pos.x, y2: pos.y, color: STATE.color, width: STATE.lineWidth },
    });
    STATE.undoStack = [];
  }

  function createSVGArrow(x1, y1, x2, y2, color, width) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Arrowhead marker — unique per arrow to support different colors
    const markerId = 'markup-ah-' + Date.now() + Math.random().toString(36).slice(2, 6);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', color);
    marker.appendChild(polygon);
    defs.appendChild(marker);
    g.appendChild(defs);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('marker-end', `url(#${markerId})`);
    line.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))';
    g.appendChild(line);

    return g;
  }

  // ---------------------------------------------------------------------------
  // Tool: Rectangle
  // ---------------------------------------------------------------------------

  function previewRect(pos) {
    if (previewEl) previewEl.remove();
    previewEl = createSVGRect(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    previewEl.classList.add('markup-preview');
    svgLayer.appendChild(previewEl);
  }

  function placeRect(pos) {
    if (previewEl) previewEl.remove();
    previewEl = null;

    const w = Math.abs(pos.x - STATE.startX);
    const h = Math.abs(pos.y - STATE.startY);
    if (w < 5 && h < 5) return;

    const el = createSVGRect(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    el.classList.add('markup-annotation');
    svgLayer.appendChild(el);

    STATE.annotations.push({
      type: 'rect',
      element: el,
      data: { x1: STATE.startX, y1: STATE.startY, x2: pos.x, y2: pos.y, color: STATE.color, width: STATE.lineWidth },
    });
    STATE.undoStack = [];
  }

  function createSVGRect(x1, y1, x2, y2, color, width) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    rect.setAttribute('x', rx);
    rect.setAttribute('y', ry);
    rect.setAttribute('width', rw);
    rect.setAttribute('height', rh);
    rect.setAttribute('rx', '3');
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', width);
    rect.setAttribute('fill', color.replace(')', ', 0.08)').replace('rgb', 'rgba').replace('#', ''));
    // For hex colors, use a semi-transparent fill
    rect.setAttribute('fill', hexToRgba(color, 0.08));
    rect.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))';
    return rect;
  }

  function hexToRgba(hex, alpha) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ---------------------------------------------------------------------------
  // Tool: Highlighter
  // ---------------------------------------------------------------------------

  function previewHighlight(pos) {
    if (previewEl) previewEl.remove();
    previewEl = createSVGHighlight(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color);
    previewEl.classList.add('markup-preview');
    svgLayer.appendChild(previewEl);
  }

  function placeHighlight(pos) {
    if (previewEl) previewEl.remove();
    previewEl = null;
    const dx = Math.abs(pos.x - STATE.startX);
    const dy = Math.abs(pos.y - STATE.startY);
    if (dx < 5 && dy < 5) return;

    const el = createSVGHighlight(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color);
    el.classList.add('markup-annotation');
    svgLayer.appendChild(el);

    STATE.annotations.push({
      type: 'highlight',
      element: el,
      data: { x1: STATE.startX, y1: STATE.startY, x2: pos.x, y2: pos.y, color: STATE.color },
    });
    STATE.undoStack = [];
  }

  function createSVGHighlight(x1, y1, x2, y2, color) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    rect.setAttribute('x', rx);
    rect.setAttribute('y', ry);
    rect.setAttribute('width', rw);
    rect.setAttribute('height', rh);
    rect.setAttribute('rx', '2');
    rect.setAttribute('stroke', 'none');
    rect.setAttribute('fill', hexToRgba(color, 0.3));
    rect.style.mixBlendMode = 'multiply';
    return rect;
  }

  // ---------------------------------------------------------------------------
  // Tool: Text note
  // ---------------------------------------------------------------------------

  function placeTextNote(pos) {
    const noteNum = STATE.annotations.filter(a => a.type === 'text').length + 1;

    const wrapper = document.createElement('div');
    wrapper.className = 'markup-text-note';
    wrapper.style.left = pos.x + 'px';
    wrapper.style.top = pos.y + 'px';

    const badge = document.createElement('span');
    badge.className = 'markup-text-badge';
    badge.textContent = noteNum;
    badge.style.background = STATE.color;

    // Formatting state for this note
    const fmt = { bold: false, italic: false, underline: false, size: 'M' };
    const SIZES = { S: 11, M: 13, L: 17 };

    // Formatting toolbar
    const fmtBar = document.createElement('div');
    fmtBar.className = 'markup-fmt-bar';
    fmtBar.innerHTML = `
      <button class="markup-fmt-btn" data-fmt="bold" title="Fett (Ctrl+B)"><strong>B</strong></button>
      <button class="markup-fmt-btn" data-fmt="italic" title="Kursiv (Ctrl+I)"><em>I</em></button>
      <button class="markup-fmt-btn" data-fmt="underline" title="Unterstrichen (Ctrl+U)"><span style="text-decoration:underline">U</span></button>
      <span class="markup-fmt-divider"></span>
      <button class="markup-fmt-btn markup-fmt-size" data-fmt="S" title="Klein">S</button>
      <button class="markup-fmt-btn markup-fmt-size active" data-fmt="M" title="Mittel">M</button>
      <button class="markup-fmt-btn markup-fmt-size" data-fmt="L" title="Gross">L</button>
      <span class="markup-fmt-divider"></span>
      <span class="markup-fmt-color" style="background:${STATE.color}" title="Textfarbe"></span>
      <button class="markup-fmt-btn markup-fmt-confirm" data-fmt="confirm" title="Fertig (Ctrl+Enter)">&#10003;</button>
    `;

    // Auto-expanding textarea
    const input = document.createElement('textarea');
    input.className = 'markup-text-input';
    input.placeholder = 'Notiz eingeben...';
    input.style.borderColor = STATE.color;
    input.rows = 1;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('data-form-type', 'other');

    // Auto-resize on input
    function autoResize() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    }
    input.addEventListener('input', autoResize);

    // Apply formatting visually
    function applyFormat() {
      input.style.fontWeight = fmt.bold ? '700' : '400';
      input.style.fontStyle = fmt.italic ? 'italic' : 'normal';
      input.style.textDecoration = fmt.underline ? 'underline' : 'none';
      input.style.fontSize = SIZES[fmt.size] + 'px';
      input.style.color = STATE.color === '#DC2626' ? '#fff' : STATE.color;
      // Update active states on format bar
      fmtBar.querySelector('[data-fmt="bold"]').classList.toggle('active', fmt.bold);
      fmtBar.querySelector('[data-fmt="italic"]').classList.toggle('active', fmt.italic);
      fmtBar.querySelector('[data-fmt="underline"]').classList.toggle('active', fmt.underline);
      fmtBar.querySelectorAll('.markup-fmt-size').forEach(b => {
        b.classList.toggle('active', b.dataset.fmt === fmt.size);
      });
      autoResize();
    }

    // Format bar click handler
    fmtBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fmt]');
      if (!btn) return;
      e.stopPropagation();
      const action = btn.dataset.fmt;
      if (action === 'bold') fmt.bold = !fmt.bold;
      else if (action === 'italic') fmt.italic = !fmt.italic;
      else if (action === 'underline') fmt.underline = !fmt.underline;
      else if (action === 'confirm') { finalize(); return; }
      else if (action === 'S' || action === 'M' || action === 'L') fmt.size = action;
      applyFormat();
      input.focus();
    });
    fmtBar.addEventListener('mousedown', (e) => e.preventDefault()); // Prevent blur

    const inputWrap = document.createElement('div');
    inputWrap.className = 'markup-text-input-wrap';
    inputWrap.appendChild(fmtBar);
    inputWrap.appendChild(input);

    wrapper.appendChild(badge);
    wrapper.appendChild(inputWrap);
    htmlLayer.appendChild(wrapper);

    // Set initial size styling
    applyFormat();

    // Focus the input
    setTimeout(() => input.focus(), 50);

    // On Ctrl+Enter or blur, finalize (Enter inserts newlines)
    let finalized = false;
    const finalize = () => {
      if (finalized) return;
      finalized = true;
      if (!input.value.trim()) {
        if (wrapper.parentNode) wrapper.remove();
        return;
      }
      const textColor = STATE.color === '#DC2626' ? '#f0f0f0' : STATE.color;
      const label = document.createElement('div');
      label.className = 'markup-text-label';
      label.style.fontWeight = fmt.bold ? '700' : '400';
      label.style.fontStyle = fmt.italic ? 'italic' : 'normal';
      label.style.textDecoration = fmt.underline ? 'underline' : 'none';
      label.style.fontSize = SIZES[fmt.size] + 'px';
      label.style.color = textColor;
      label.textContent = input.value;
      if (inputWrap.parentNode) inputWrap.remove();
      wrapper.appendChild(label);

      // Double-click to re-edit
      label.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        label.remove();
        finalized = false;
        inputWrap.querySelector('textarea') || inputWrap.appendChild(input);
        wrapper.appendChild(inputWrap);
        input.value = label.textContent;
        applyFormat();
        setTimeout(() => input.focus(), 50);
      });

      // Drag to reposition
      let dragStart = null;
      wrapper.style.cursor = 'grab';
      wrapper.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.closest('.markup-fmt-bar')) return;
        dragStart = { x: e.clientX - wrapper.offsetLeft, y: e.clientY - wrapper.offsetTop };
        wrapper.style.cursor = 'grabbing';
        e.preventDefault();
      });
      const onDragMove = (e) => {
        if (!dragStart) return;
        wrapper.style.left = (e.clientX - dragStart.x) + 'px';
        wrapper.style.top = (e.clientY - dragStart.y) + 'px';
      };
      const onDragEnd = () => { dragStart = null; wrapper.style.cursor = 'grab'; };
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);

      STATE.annotations.push({
        type: 'text',
        element: wrapper,
        data: { x: pos.x, y: pos.y, text: input.value, num: noteNum, color: STATE.color, bold: fmt.bold, italic: fmt.italic, underline: fmt.underline, size: fmt.size },
      });
      STATE.undoStack = [];
    };

    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // Don't trigger ESC close
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); finalize(); }
      if (e.key === 'Escape') { wrapper.remove(); }
      // Formatting shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); fmt.bold = !fmt.bold; applyFormat(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); fmt.italic = !fmt.italic; applyFormat(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); fmt.underline = !fmt.underline; applyFormat(); }
    });
    input.addEventListener('blur', () => {
      // Small delay to allow format bar clicks
      setTimeout(() => {
        try {
          if (!finalized && (!fmtBar.parentNode || !fmtBar.matches(':hover'))) finalize();
        } catch (_e) {
          if (!finalized) finalize();
        }
      }, 200);
    });
  }

  // ---------------------------------------------------------------------------
  // Tool: Number pin
  // ---------------------------------------------------------------------------

  function placePin(pos) {
    const num = STATE.pinCounter++;

    const pin = document.createElement('div');
    pin.className = 'markup-pin';
    pin.style.left = (pos.x - 14) + 'px';
    pin.style.top = (pos.y - 14) + 'px';
    pin.style.background = STATE.color;
    pin.textContent = num;
    htmlLayer.appendChild(pin);

    STATE.annotations.push({
      type: 'pin',
      element: pin,
      data: { x: pos.x, y: pos.y, num, color: STATE.color },
    });
    STATE.undoStack = [];
  }

  // ---------------------------------------------------------------------------
  // Tool: Eraser
  // ---------------------------------------------------------------------------

  function tryErase(e) {
    const pos = getPos(e);
    const threshold = 20;

    // Check HTML annotations (pins, text notes) — reverse order for topmost first
    for (let i = STATE.annotations.length - 1; i >= 0; i--) {
      const ann = STATE.annotations[i];

      if (ann.type === 'pin' || ann.type === 'text') {
        const rect = ann.element.getBoundingClientRect();
        if (pos.x >= rect.left - 5 && pos.x <= rect.right + 5 &&
            pos.y >= rect.top - 5 && pos.y <= rect.bottom + 5) {
          ann.element.remove();
          STATE.annotations.splice(i, 1);
          return;
        }
      }

      if (ann.type === 'arrow' || ann.type === 'rect') {
        // Check bounding box of SVG element
        const bbox = ann.element.getBoundingClientRect();
        if (pos.x >= bbox.left - threshold && pos.x <= bbox.right + threshold &&
            pos.y >= bbox.top - threshold && pos.y <= bbox.bottom + threshold) {
          ann.element.remove();
          STATE.annotations.splice(i, 1);
          return;
        }
      }

      if (ann.type === 'draw') {
        // Check proximity to any point in the path
        for (const pt of ann.data.points) {
          const dx = pos.x - pt.x;
          const dy = pos.y - pt.y;
          if (Math.sqrt(dx * dx + dy * dy) < threshold) {
            STATE.annotations.splice(i, 1);
            redrawCanvas();
            return;
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Undo / Clear
  // ---------------------------------------------------------------------------

  function undo() {
    if (STATE.annotations.length === 0) return;
    const last = STATE.annotations.pop();
    STATE.undoStack.push(last);

    if (last.element) {
      last.element.remove();
    }
    if (last.type === 'draw') {
      redrawCanvas();
    }
  }

  function clearAll() {
    for (const ann of STATE.annotations) {
      if (ann.element) ann.element.remove();
    }
    STATE.annotations = [];
    STATE.undoStack = [];
    STATE.pinCounter = 1;
    redrawCanvas();
    // Clear SVG preview if any
    svgLayer.querySelectorAll('.markup-preview, .markup-annotation').forEach(el => el.remove());
  }

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  function onKeyDown(e) {
    // Don't intercept when typing in text input
    if (e.target.classList.contains('markup-text-input')) return;

    if (e.key === 'Escape') {
      destroyOverlay();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
  }

  document.addEventListener('keydown', onKeyDown);

  // ---------------------------------------------------------------------------
  // Cursor
  // ---------------------------------------------------------------------------

  function updateCursor() {
    const cursors = {
      draw: 'crosshair',
      arrow: 'crosshair',
      rect: 'crosshair',
      text: 'text',
      pin: 'crosshair',
      eraser: 'pointer',
    };
    overlay.style.cursor = cursors[STATE.tool] || 'default';
  }
  updateCursor();

  // ---------------------------------------------------------------------------
  // Window resize
  // ---------------------------------------------------------------------------

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    svgLayer.setAttribute('width', window.innerWidth);
    svgLayer.setAttribute('height', window.innerHeight);
    redrawCanvas();
  });

  // ---------------------------------------------------------------------------
  // Destroy / cleanup
  // ---------------------------------------------------------------------------

  function destroyOverlay() {
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    delete window.__markupState;
  }

  // Expose state for capture.js
  window.__markupState = STATE;
  window.__markupOverlay = overlay;
  window.__markupCanvas = canvas;
  window.__markupSvgLayer = svgLayer;
  window.__markupHtmlLayer = htmlLayer;
  window.__markupToolbar = toolbar;

})();
