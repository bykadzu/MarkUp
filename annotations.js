// MarkUp Annotations — Shape drawing tools (freehand, arrow, rect, highlight, blur, crop)
// Module: exports tool functions to window.__markup

(function () {
  'use strict';
  var ns = window.__markup = window.__markup || {};
  var previewEl = null;
  var cropPreview = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  ns.hexToRgba = function (hex, alpha) {
    var c = hex.replace('#', '');
    var r = parseInt(c.substring(0, 2), 16);
    var g = parseInt(c.substring(2, 4), 16);
    var b = parseInt(c.substring(4, 6), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  };

  // ---------------------------------------------------------------------------
  // Tool: Freehand draw
  // ---------------------------------------------------------------------------

  ns.startFreehand = function (pos) {
    var STATE = window.__markupState;
    var ctx = window.__markupCtx;
    STATE.isDrawing = true;
    STATE.currentPath = { points: [pos], color: STATE.color, width: STATE.lineWidth };
    ctx.strokeStyle = STATE.color;
    ctx.lineWidth = STATE.lineWidth;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  ns.continueFreehand = function (pos) {
    var STATE = window.__markupState;
    var ctx = window.__markupCtx;
    if (!STATE.currentPath) return;
    STATE.currentPath.points.push(pos);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  ns.endFreehand = function () {
    var STATE = window.__markupState;
    if (!STATE.currentPath && !STATE.isDrawing) return;
    if (STATE.currentPath && STATE.currentPath.points.length > 1) {
      STATE.annotations.push({
        type: 'draw',
        element: null,
        data: { points: STATE.currentPath.points, color: STATE.currentPath.color, width: STATE.currentPath.width },
      });
      STATE.undoStack = [];
    }
    STATE.currentPath = null;
  };

  ns.redrawCanvas = function () {
    var canvas = window.__markupCanvas;
    var ctx = window.__markupCtx;
    var STATE = window.__markupState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < STATE.annotations.length; i++) {
      var ann = STATE.annotations[i];
      if (ann.type === 'draw') {
        var d = ann.data;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        for (var j = 1; j < d.points.length; j++) {
          ctx.lineTo(d.points[j].x, d.points[j].y);
        }
        ctx.stroke();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Tool: Arrow
  // ---------------------------------------------------------------------------

  function createSVGArrow(x1, y1, x2, y2, color, width) {
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    var markerId = 'markup-ah-' + Date.now() + Math.random().toString(36).slice(2, 6);
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', color);
    marker.appendChild(polygon);
    defs.appendChild(marker);
    g.appendChild(defs);
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('marker-end', 'url(#' + markerId + ')');
    line.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))';
    g.appendChild(line);
    return g;
  }

  ns.previewArrow = function (pos) {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    if (previewEl) previewEl.remove();
    previewEl = createSVGArrow(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    previewEl.classList.add('markup-preview');
    svgLayer.appendChild(previewEl);
  };

  ns.placeArrow = function (pos) {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    if (previewEl) previewEl.remove();
    previewEl = null;
    var dx = pos.x - STATE.startX;
    var dy = pos.y - STATE.startY;
    if (Math.sqrt(dx * dx + dy * dy) < 5) return;
    var el = createSVGArrow(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    el.classList.add('markup-annotation');
    svgLayer.appendChild(el);
    STATE.annotations.push({
      type: 'arrow', element: el,
      data: { x1: STATE.startX, y1: STATE.startY, x2: pos.x, y2: pos.y, color: STATE.color, width: STATE.lineWidth },
    });
    STATE.undoStack = [];
  };

  // ---------------------------------------------------------------------------
  // Tool: Rectangle
  // ---------------------------------------------------------------------------

  function createSVGRect(x1, y1, x2, y2, color, width) {
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', Math.min(x1, x2));
    rect.setAttribute('y', Math.min(y1, y2));
    rect.setAttribute('width', Math.abs(x2 - x1));
    rect.setAttribute('height', Math.abs(y2 - y1));
    rect.setAttribute('rx', '3');
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', width);
    rect.setAttribute('fill', ns.hexToRgba(color, 0.08));
    rect.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))';
    return rect;
  }

  ns.previewRect = function (pos) {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    if (previewEl) previewEl.remove();
    previewEl = createSVGRect(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    previewEl.classList.add('markup-preview');
    svgLayer.appendChild(previewEl);
  };

  ns.placeRect = function (pos) {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    if (previewEl) previewEl.remove();
    previewEl = null;
    if (Math.abs(pos.x - STATE.startX) < 5 && Math.abs(pos.y - STATE.startY) < 5) return;
    var el = createSVGRect(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color, STATE.lineWidth);
    el.classList.add('markup-annotation');
    svgLayer.appendChild(el);
    STATE.annotations.push({
      type: 'rect', element: el,
      data: { x1: STATE.startX, y1: STATE.startY, x2: pos.x, y2: pos.y, color: STATE.color, width: STATE.lineWidth },
    });
    STATE.undoStack = [];
  };

  // ---------------------------------------------------------------------------
  // Tool: Highlighter
  // ---------------------------------------------------------------------------

  function createSVGHighlight(x1, y1, x2, y2, color) {
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', Math.min(x1, x2));
    rect.setAttribute('y', Math.min(y1, y2));
    rect.setAttribute('width', Math.abs(x2 - x1));
    rect.setAttribute('height', Math.abs(y2 - y1));
    rect.setAttribute('rx', '2');
    rect.setAttribute('stroke', 'none');
    rect.setAttribute('fill', ns.hexToRgba(color, 0.3));
    rect.style.mixBlendMode = 'multiply';
    return rect;
  }

  ns.previewHighlight = function (pos) {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    if (previewEl) previewEl.remove();
    previewEl = createSVGHighlight(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color);
    previewEl.classList.add('markup-preview');
    svgLayer.appendChild(previewEl);
  };

  ns.placeHighlight = function (pos) {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    if (previewEl) previewEl.remove();
    previewEl = null;
    if (Math.abs(pos.x - STATE.startX) < 5 && Math.abs(pos.y - STATE.startY) < 5) return;
    var el = createSVGHighlight(STATE.startX, STATE.startY, pos.x, pos.y, STATE.color);
    el.classList.add('markup-annotation');
    svgLayer.appendChild(el);
    STATE.annotations.push({
      type: 'highlight', element: el,
      data: { x1: STATE.startX, y1: STATE.startY, x2: pos.x, y2: pos.y, color: STATE.color },
    });
    STATE.undoStack = [];
  };

  // ---------------------------------------------------------------------------
  // Tool: Blur / Redact
  // ---------------------------------------------------------------------------

  function createBlurOverlay(x1, y1, x2, y2) {
    var div = document.createElement('div');
    div.className = 'markup-blur-region';
    div.style.position = 'absolute';
    div.style.left = Math.min(x1, x2) + 'px';
    div.style.top = Math.min(y1, y2) + 'px';
    div.style.width = Math.abs(x2 - x1) + 'px';
    div.style.height = Math.abs(y2 - y1) + 'px';
    div.style.backdropFilter = 'blur(12px)';
    div.style.webkitBackdropFilter = 'blur(12px)';
    div.style.background = 'rgba(0, 0, 0, 0.15)';
    div.style.borderRadius = '4px';
    div.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    div.style.pointerEvents = 'auto';
    div.style.zIndex = '2147483645';
    return div;
  }

  ns.previewBlur = function (pos) {
    var STATE = window.__markupState;
    var htmlLayer = window.__markupHtmlLayer;
    if (previewEl) previewEl.remove();
    previewEl = createBlurOverlay(STATE.startX, STATE.startY, pos.x, pos.y);
    previewEl.classList.add('markup-preview');
    htmlLayer.appendChild(previewEl);
  };

  ns.placeBlur = function (pos) {
    var STATE = window.__markupState;
    var htmlLayer = window.__markupHtmlLayer;
    if (previewEl) previewEl.remove();
    previewEl = null;
    if (Math.abs(pos.x - STATE.startX) < 10 && Math.abs(pos.y - STATE.startY) < 10) return;
    var el = createBlurOverlay(STATE.startX, STATE.startY, pos.x, pos.y);
    htmlLayer.appendChild(el);
    STATE.annotations.push({
      type: 'blur', element: el,
      data: { x1: STATE.startX, y1: STATE.startY, x2: pos.x, y2: pos.y },
    });
    STATE.undoStack = [];
  };

  // ---------------------------------------------------------------------------
  // Tool: Crop
  // ---------------------------------------------------------------------------

  ns.previewCrop = function (pos) {
    var STATE = window.__markupState;
    var htmlLayer = window.__markupHtmlLayer;
    if (cropPreview) cropPreview.remove();
    var x = Math.min(STATE.startX, pos.x);
    var y = Math.min(STATE.startY, pos.y);
    var w = Math.abs(pos.x - STATE.startX);
    var h = Math.abs(pos.y - STATE.startY);
    cropPreview = document.createElement('div');
    cropPreview.className = 'markup-crop-preview';
    cropPreview.style.left = x + 'px';
    cropPreview.style.top = y + 'px';
    cropPreview.style.width = w + 'px';
    cropPreview.style.height = h + 'px';
    htmlLayer.appendChild(cropPreview);
  };

  ns.finishCrop = function (pos) {
    var STATE = window.__markupState;
    if (cropPreview) { cropPreview.remove(); cropPreview = null; }
    var x = Math.min(STATE.startX, pos.x);
    var y = Math.min(STATE.startY, pos.y);
    var w = Math.abs(pos.x - STATE.startX);
    var h = Math.abs(pos.y - STATE.startY);
    if (w < 10 || h < 10) return;
    window.__markupCapture?.saveCrop({ x: x, y: y, width: w, height: h });
  };
})();
