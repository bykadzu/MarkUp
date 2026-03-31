// MarkUp Keyboard — Keyboard shortcut handler
// Module: exports onKeyDown to window.__markup

(function () {
  'use strict';
  var ns = window.__markup = window.__markup || {};

  ns.onKeyDown = function (e) {
    if (e.target.classList.contains('markup-text-input')) return;
    var STATE = window.__markupState;
    if (!STATE) return;

    if (e.key === 'Escape') {
      if (STATE.compareStep) { ns.exitCompare(); return; }
      if (STATE.templateMode) {
        STATE.templateMode = null;
        ns.updateCursor();
        window.__markupCapture?.showToast('Template mode cancelled.', 2000);
        return;
      }
      ns.destroyOverlay();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      ns.undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      ns.redo();
    }
  };
})();
