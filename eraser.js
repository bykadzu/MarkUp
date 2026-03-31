// MarkUp Eraser — Eraser tool, undo, redo, and clear all
// Module: exports tryErase, undo, redo, clearAll to window.__markup

(function () {
  'use strict';
  var ns = window.__markup = window.__markup || {};

  ns.tryErase = function (e) {
    var STATE = window.__markupState;
    var pos = ns.getPos(e);
    var threshold = 20;

    for (var i = STATE.annotations.length - 1; i >= 0; i--) {
      var ann = STATE.annotations[i];

      if (ann.type === 'pin' || ann.type === 'text' || ann.type === 'stamp' || ann.type === 'template') {
        var rect = ann.element.getBoundingClientRect();
        if (pos.x >= rect.left - 5 && pos.x <= rect.right + 5 &&
            pos.y >= rect.top - 5 && pos.y <= rect.bottom + 5) {
          ann.element.remove();
          STATE.annotations.splice(i, 1);
          return;
        }
      }

      if (ann.type === 'arrow' || ann.type === 'rect' || ann.type === 'highlight' || ann.type === 'blur') {
        var bbox = ann.element.getBoundingClientRect();
        if (pos.x >= bbox.left - threshold && pos.x <= bbox.right + threshold &&
            pos.y >= bbox.top - threshold && pos.y <= bbox.bottom + threshold) {
          ann.element.remove();
          STATE.annotations.splice(i, 1);
          return;
        }
      }

      if (ann.type === 'draw') {
        for (var j = 0; j < ann.data.points.length; j++) {
          var pt = ann.data.points[j];
          var dx = pos.x - pt.x;
          var dy = pos.y - pt.y;
          if (Math.sqrt(dx * dx + dy * dy) < threshold) {
            STATE.annotations.splice(i, 1);
            ns.redrawCanvas();
            return;
          }
        }
      }
    }
  };

  ns.undo = function () {
    var STATE = window.__markupState;
    if (STATE.annotations.length === 0) return;
    var last = STATE.annotations.pop();
    STATE.undoStack.push(last);
    if (last.element) last.element.remove();
    if (last.type === 'draw') ns.redrawCanvas();
  };

  ns.redo = function () {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    var htmlLayer = window.__markupHtmlLayer;
    if (STATE.undoStack.length === 0) return;
    var item = STATE.undoStack.pop();

    if (item.type === 'draw') {
      STATE.annotations.push(item);
      ns.redrawCanvas();
    } else if (item.type === 'arrow' || item.type === 'rect' || item.type === 'highlight') {
      svgLayer.appendChild(item.element);
      STATE.annotations.push(item);
    } else if (item.element) {
      htmlLayer.appendChild(item.element);
      STATE.annotations.push(item);
    }
  };

  ns.clearAll = function () {
    var STATE = window.__markupState;
    var svgLayer = window.__markupSvgLayer;
    for (var i = 0; i < STATE.annotations.length; i++) {
      if (STATE.annotations[i].element) STATE.annotations[i].element.remove();
    }
    STATE.annotations = [];
    STATE.undoStack = [];
    STATE.pinCounter = 1;
    ns.redrawCanvas();
    svgLayer.querySelectorAll('.markup-preview, .markup-annotation').forEach(function (el) { el.remove(); });
  };
})();
