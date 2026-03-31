// MarkUp Annotations HTML — Text notes, pins, stamps, and template annotations
// Module: exports placement functions to window.__markup

(function () {
  'use strict';
  var ns = window.__markup = window.__markup || {};

  // ---------------------------------------------------------------------------
  // Tool: Text note
  // ---------------------------------------------------------------------------

  ns.placeTextNote = function (pos) {
    var STATE = window.__markupState;
    var htmlLayer = window.__markupHtmlLayer;
    var noteNum = STATE.annotations.filter(function (a) { return a.type === 'text'; }).length + 1;

    var wrapper = document.createElement('div');
    wrapper.className = 'markup-text-note';
    wrapper.style.left = pos.x + 'px';
    wrapper.style.top = pos.y + 'px';

    var badge = document.createElement('span');
    badge.className = 'markup-text-badge';
    badge.textContent = noteNum;
    badge.style.background = STATE.color;

    var fmt = { bold: false, italic: false, underline: false, size: 'M' };
    var SIZES = { S: 11, M: 13, L: 17 };

    var fmtBar = document.createElement('div');
    fmtBar.className = 'markup-fmt-bar';
    fmtBar.innerHTML =
      '<button class="markup-fmt-btn" data-fmt="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>' +
      '<button class="markup-fmt-btn" data-fmt="italic" title="Italic (Ctrl+I)"><em>I</em></button>' +
      '<button class="markup-fmt-btn" data-fmt="underline" title="Underline (Ctrl+U)"><span style="text-decoration:underline">U</span></button>' +
      '<span class="markup-fmt-divider"></span>' +
      '<button class="markup-fmt-btn markup-fmt-size" data-fmt="S" title="Small">S</button>' +
      '<button class="markup-fmt-btn markup-fmt-size active" data-fmt="M" title="Medium">M</button>' +
      '<button class="markup-fmt-btn markup-fmt-size" data-fmt="L" title="Large">L</button>' +
      '<span class="markup-fmt-divider"></span>' +
      '<span class="markup-fmt-color" style="background:' + STATE.color + '" title="Text color"></span>' +
      '<button class="markup-fmt-btn markup-fmt-confirm" data-fmt="confirm" title="Done (Ctrl+Enter)">&#10003;</button>';

    var input = document.createElement('textarea');
    input.className = 'markup-text-input';
    input.placeholder = 'Type a note...';
    input.style.borderColor = STATE.color;
    input.rows = 1;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('data-form-type', 'other');

    function autoResize() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    }
    input.addEventListener('input', autoResize);

    function applyFormat() {
      input.style.fontWeight = fmt.bold ? '700' : '400';
      input.style.fontStyle = fmt.italic ? 'italic' : 'normal';
      input.style.textDecoration = fmt.underline ? 'underline' : 'none';
      input.style.fontSize = SIZES[fmt.size] + 'px';
      input.style.color = STATE.color === '#DC2626' ? '#fff' : STATE.color;
      fmtBar.querySelector('[data-fmt="bold"]').classList.toggle('active', fmt.bold);
      fmtBar.querySelector('[data-fmt="italic"]').classList.toggle('active', fmt.italic);
      fmtBar.querySelector('[data-fmt="underline"]').classList.toggle('active', fmt.underline);
      fmtBar.querySelectorAll('.markup-fmt-size').forEach(function (b) {
        b.classList.toggle('active', b.dataset.fmt === fmt.size);
      });
      autoResize();
    }

    fmtBar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fmt]');
      if (!btn) return;
      e.stopPropagation();
      var action = btn.dataset.fmt;
      if (action === 'bold') fmt.bold = !fmt.bold;
      else if (action === 'italic') fmt.italic = !fmt.italic;
      else if (action === 'underline') fmt.underline = !fmt.underline;
      else if (action === 'confirm') { finalize(); return; }
      else if (action === 'S' || action === 'M' || action === 'L') fmt.size = action;
      applyFormat();
      input.focus();
    });
    fmtBar.addEventListener('mousedown', function (e) { e.preventDefault(); });

    var inputWrap = document.createElement('div');
    inputWrap.className = 'markup-text-input-wrap';
    inputWrap.appendChild(fmtBar);
    inputWrap.appendChild(input);

    wrapper.appendChild(badge);
    wrapper.appendChild(inputWrap);
    htmlLayer.appendChild(wrapper);

    applyFormat();
    setTimeout(function () { input.focus(); }, 50);

    var finalized = false;
    var finalize = function () {
      if (finalized) return;
      finalized = true;
      if (!input.value.trim()) {
        if (wrapper.parentNode) wrapper.remove();
        return;
      }
      var textColor = STATE.color === '#DC2626' ? '#f0f0f0' : STATE.color;
      var label = document.createElement('div');
      label.className = 'markup-text-label';
      label.style.fontWeight = fmt.bold ? '700' : '400';
      label.style.fontStyle = fmt.italic ? 'italic' : 'normal';
      label.style.textDecoration = fmt.underline ? 'underline' : 'none';
      label.style.fontSize = SIZES[fmt.size] + 'px';
      label.style.color = textColor;
      label.textContent = input.value;
      if (inputWrap.parentNode) inputWrap.remove();
      wrapper.appendChild(label);

      label.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        label.remove();
        finalized = false;
        if (!inputWrap.querySelector('textarea')) inputWrap.appendChild(input);
        wrapper.appendChild(inputWrap);
        input.value = label.textContent;
        applyFormat();
        setTimeout(function () { input.focus(); }, 50);
      });

      var dragStart = null;
      wrapper.style.cursor = 'grab';
      wrapper.addEventListener('mousedown', function (e) {
        if (e.target.tagName === 'TEXTAREA' || e.target.closest('.markup-fmt-bar')) return;
        dragStart = { x: e.clientX - wrapper.offsetLeft, y: e.clientY - wrapper.offsetTop };
        wrapper.style.cursor = 'grabbing';
        e.preventDefault();
      });
      var onDragMove = function (e) {
        if (!dragStart) return;
        wrapper.style.left = (e.clientX - dragStart.x) + 'px';
        wrapper.style.top = (e.clientY - dragStart.y) + 'px';
      };
      var onDragEnd = function () { dragStart = null; wrapper.style.cursor = 'grab'; };
      ns.addListener(document, 'mousemove', onDragMove);
      ns.addListener(document, 'mouseup', onDragEnd);

      STATE.annotations.push({
        type: 'text', element: wrapper,
        data: { x: pos.x, y: pos.y, text: input.value, num: noteNum, color: STATE.color, bold: fmt.bold, italic: fmt.italic, underline: fmt.underline, size: fmt.size },
      });
      STATE.undoStack = [];
    };

    input.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); finalize(); }
      if (e.key === 'Escape') { wrapper.remove(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); fmt.bold = !fmt.bold; applyFormat(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); fmt.italic = !fmt.italic; applyFormat(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); fmt.underline = !fmt.underline; applyFormat(); }
    });
    input.addEventListener('blur', function () {
      setTimeout(function () {
        try {
          if (!finalized && (!fmtBar.parentNode || !fmtBar.matches(':hover'))) finalize();
        } catch (_e) {
          if (!finalized) finalize();
        }
      }, 200);
    });
  };

  // ---------------------------------------------------------------------------
  // Tool: Number pin
  // ---------------------------------------------------------------------------

  ns.placePin = function (pos) {
    var STATE = window.__markupState;
    var htmlLayer = window.__markupHtmlLayer;
    var num = STATE.pinCounter++;
    var pin = document.createElement('div');
    pin.className = 'markup-pin';
    pin.style.left = (pos.x - 14) + 'px';
    pin.style.top = (pos.y - 14) + 'px';
    pin.style.background = STATE.color;
    pin.textContent = num;
    htmlLayer.appendChild(pin);
    STATE.annotations.push({ type: 'pin', element: pin, data: { x: pos.x, y: pos.y, num: num, color: STATE.color } });
    STATE.undoStack = [];
  };

  // ---------------------------------------------------------------------------
  // Tool: Stamp
  // ---------------------------------------------------------------------------

  var STAMPS = {
    checkmark: { symbol: '\u2713', color: '#16A34A' },
    cross:     { symbol: '\u2717', color: '#DC2626' },
    question:  { symbol: '?',      color: '#F97316' },
    star:      { symbol: '\u2605', color: '#EAB308' },
  };
  ns.STAMPS = STAMPS;

  ns.placeStamp = function (pos) {
    var STATE = window.__markupState;
    var htmlLayer = window.__markupHtmlLayer;
    var type = STATE.stampType || 'checkmark';
    var stamp = STAMPS[type];
    if (!stamp) return;
    var el = document.createElement('div');
    el.className = 'markup-stamp';
    el.style.left = (pos.x - 14) + 'px';
    el.style.top = (pos.y - 14) + 'px';
    el.style.background = stamp.color;
    el.textContent = stamp.symbol;
    htmlLayer.appendChild(el);
    STATE.annotations.push({
      type: 'stamp', element: el,
      data: { x: pos.x, y: pos.y, stampType: type, symbol: stamp.symbol, color: stamp.color },
    });
    STATE.undoStack = [];
  };

  // ---------------------------------------------------------------------------
  // Tool: Template annotation placement
  // ---------------------------------------------------------------------------

  ns.placeTemplateAnnotation = function (pos, template) {
    var STATE = window.__markupState;
    var htmlLayer = window.__markupHtmlLayer;
    var el = document.createElement('div');
    el.className = 'markup-template-annotation';
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.style.borderColor = template.color;
    var dot = document.createElement('span');
    dot.className = 'markup-template-dot';
    dot.style.background = template.color;
    var text = document.createElement('span');
    text.className = 'markup-template-text';
    text.style.color = template.color;
    text.textContent = template.text;
    el.appendChild(dot);
    el.appendChild(text);
    htmlLayer.appendChild(el);
    STATE.annotations.push({
      type: 'template', element: el,
      data: { x: pos.x, y: pos.y, templateId: template.id, name: template.name, text: template.text, color: template.color },
    });
    STATE.undoStack = [];
  };
})();
