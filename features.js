// MarkUp Features — Share, templates panel, and pin-to-page
// Module: exports feature functions to window.__markup

(function () {
  'use strict';
  var ns = window.__markup = window.__markup || {};

  // ---------------------------------------------------------------------------
  // Feature: Share Link (with privacy confirmation)
  // ---------------------------------------------------------------------------

  ns.shareScreenshot = async function () {
    var STATE = window.__markupState;
    if (STATE.annotations.length === 0) {
      window.__markupCapture?.showToast('Add annotations before sharing.', 3000);
      return;
    }
    showShareConfirmation();
  };

  function showShareConfirmation() {
    var htmlLayer = window.__markupHtmlLayer;
    var modal = document.createElement('div');
    modal.id = 'markup-share-modal';
    modal.innerHTML =
      '<div class="markup-share-dialog">' +
        '<div style="font-size:14px;color:#e0e0e0;margin-bottom:12px;">Share this screenshot? It will be uploaded to a temporary hosting service (24h expiry).</div>' +
        '<div style="font-size:12px;color:#999;margin-bottom:16px;">If you cancel, the screenshot will be copied to your clipboard instead.</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
          '<button id="markup-share-cancel" class="markup-compare-btn">Cancel (copy instead)</button>' +
          '<button id="markup-share-confirm" class="markup-compare-btn markup-compare-btn-primary">Upload &amp; Share</button>' +
        '</div>' +
      '</div>';
    htmlLayer.appendChild(modal);

    document.getElementById('markup-share-cancel').addEventListener('click', async function () {
      modal.remove();
      try {
        await window.__markupCapture?.copyToClipboard();
      } catch (_e) {
        window.__markupCapture?.showToast('Copy failed.', 3000);
      }
    });

    document.getElementById('markup-share-confirm').addEventListener('click', async function () {
      modal.remove();
      await doShareUpload();
    });
  }

  async function doShareUpload() {
    window.__markupCapture?.showToast('Capturing & uploading...', 8000);
    try {
      var compositeCanvas = await window.__markupCapture.captureComposite();
      var dataUrl = compositeCanvas.toDataURL('image/png');

      var api = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;
      var response = await new Promise(function (resolve, reject) {
        api.runtime.sendMessage({ type: 'uploadShare', dataUrl: dataUrl }, function (resp) {
          if (api.runtime.lastError) reject(new Error(api.runtime.lastError.message));
          else if (resp && resp.error) reject(new Error(resp.error));
          else resolve(resp);
        });
      });

      if (response && response.url) {
        await navigator.clipboard.writeText(response.url);
        window.__markupCapture?.showToast('Link copied! Expires in 24 hours.', 5000);
      } else {
        window.__markupCapture?.showToast('Upload failed. Try again.', 4000);
      }
    } catch (err) {
      window.__markupCapture?.showToast('Share error: ' + err.message, 4000);
    }
  }

  // ---------------------------------------------------------------------------
  // Feature: Template Panel
  // ---------------------------------------------------------------------------

  var BUILTIN_TEMPLATES = [
    { id: 'tpl-mobile', name: 'Mobile Issue', text: 'Mobile viewport issue', color: '#DC2626' },
    { id: 'tpl-contrast', name: 'Contrast Fail', text: 'Contrast too low', color: '#EAB308' },
    { id: 'tpl-missing', name: 'Missing Element', text: 'Expected element missing', color: '#DC2626' },
    { id: 'tpl-alignment', name: 'Alignment Off', text: 'Misaligned', color: '#2563EB' },
    { id: 'tpl-approved', name: 'Looks Good', text: 'Approved', color: '#16A34A' },
  ];

  ns.toggleTemplatePanel = function () {
    var panel = document.getElementById('markup-template-panel');
    if (!panel) return;
    var isOpen = panel.classList.contains('open');
    var cp = document.getElementById('markup-color-panel');
    if (cp) cp.classList.remove('open');
    var wp = document.getElementById('markup-width-panel');
    if (wp) wp.classList.remove('open');
    if (isOpen) {
      panel.classList.remove('open');
    } else {
      var btn = document.getElementById('markup-templates');
      if (btn) {
        var rect = btn.getBoundingClientRect();
        panel.style.left = rect.left + 'px';
        panel.style.top = (rect.bottom + 6) + 'px';
      }
      renderTemplatePanel();
      panel.classList.add('open');
    }
  };

  async function renderTemplatePanel() {
    var STATE = window.__markupState;
    var COLORS = ns.COLORS;
    var panel = document.getElementById('markup-template-panel');
    if (!panel) return;

    var customTemplates = [];
    try {
      var sApi = (typeof browser !== 'undefined' && browser.storage) ? browser : chrome;
      var data = await sApi.storage.local.get('markupCustomTemplates');
      customTemplates = data.markupCustomTemplates || [];
    } catch (_e) {}

    var allTemplates = BUILTIN_TEMPLATES.concat(customTemplates);
    panel.textContent = '';

    var list = document.createElement('div');
    list.className = 'markup-template-list';
    allTemplates.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'markup-template-item';
      btn.dataset.templateId = t.id;
      btn.title = t.name;
      var dot = document.createElement('span');
      dot.className = 'markup-template-item-dot';
      dot.style.background = t.color;
      var name = document.createElement('span');
      name.className = 'markup-template-item-name';
      name.textContent = t.name;
      btn.appendChild(dot);
      btn.appendChild(name);
      list.appendChild(btn);
    });
    panel.appendChild(list);

    var divider = document.createElement('div');
    divider.className = 'markup-template-divider';
    panel.appendChild(divider);

    var createBtn = document.createElement('button');
    createBtn.className = 'markup-template-create-btn';
    createBtn.textContent = '+ Create Template';
    panel.appendChild(createBtn);

    var form = document.createElement('div');
    form.className = 'markup-template-create-form';
    form.style.display = 'none';

    var nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Name';
    nameInput.className = 'markup-tpl-input';
    nameInput.maxLength = 30;
    form.appendChild(nameInput);

    var textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Annotation text';
    textInput.className = 'markup-tpl-input';
    textInput.maxLength = 60;
    form.appendChild(textInput);

    var colorsDiv = document.createElement('div');
    colorsDiv.className = 'markup-tpl-colors';
    COLORS.slice(0, 7).forEach(function (c) {
      var colorBtn = document.createElement('button');
      colorBtn.className = 'markup-tpl-color-btn' + (c.value === '#DC2626' ? ' active' : '');
      colorBtn.dataset.tplColor = c.value;
      colorBtn.style.background = c.value;
      colorBtn.title = c.label;
      colorsDiv.appendChild(colorBtn);
    });
    form.appendChild(colorsDiv);

    var btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '6px';
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'markup-compare-btn';
    cancelBtn.style.flex = '1';
    cancelBtn.textContent = 'Cancel';
    var saveBtn = document.createElement('button');
    saveBtn.className = 'markup-compare-btn markup-compare-btn-primary';
    saveBtn.style.flex = '1';
    saveBtn.textContent = 'Save';
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    form.appendChild(btnRow);
    panel.appendChild(form);

    // Wire template selection
    panel.querySelectorAll('.markup-template-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var id = item.dataset.templateId;
        var template = allTemplates.find(function (t) { return t.id === id; });
        if (template) {
          STATE.templateMode = template;
          ns.updateCursor();
          panel.classList.remove('open');
          window.__markupCapture?.showToast('Click to place: ' + template.name, 3000);
        }
      });
    });

    // Wire create form
    createBtn.addEventListener('click', function () {
      createBtn.style.display = 'none';
      form.style.display = 'block';
      setTimeout(function () { nameInput.focus(); }, 50);
    });

    var selectedColor = '#DC2626';
    panel.querySelectorAll('[data-tpl-color]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedColor = btn.dataset.tplColor;
        panel.querySelectorAll('.markup-tpl-color-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    cancelBtn.addEventListener('click', function () {
      form.style.display = 'none';
      createBtn.style.display = '';
    });

    saveBtn.addEventListener('click', async function () {
      var name = (nameInput.value || '').trim();
      var text = (textInput.value || '').trim();
      if (!name || !text) {
        window.__markupCapture?.showToast('Name and text are required.', 2000);
        return;
      }
      customTemplates.push({ id: 'custom-' + Date.now(), name: name, text: text, color: selectedColor, custom: true });
      try {
        var sApi = (typeof browser !== 'undefined' && browser.storage) ? browser : chrome;
        await sApi.storage.local.set({ markupCustomTemplates: customTemplates });
      } catch (_e) {}
      window.__markupCapture?.showToast('Template "' + name + '" saved!', 3000);
      renderTemplatePanel();
    });
  }

  // ---------------------------------------------------------------------------
  // Feature: Pin Annotations to Page DOM
  // ---------------------------------------------------------------------------

  ns.pinAnnotationsToPage = function () {
    var STATE = window.__markupState;
    var canvas = window.__markupCanvas;
    var svgLayer = window.__markupSvgLayer;
    if (STATE.annotations.length === 0) {
      window.__markupCapture?.showToast('No annotations to pin.', 2000);
      return;
    }

    var scrollX = window.scrollX;
    var scrollY = window.scrollY;
    var viewW = window.innerWidth;
    var viewH = window.innerHeight;

    var frame = document.createElement('div');
    frame.className = 'markup-pinned-annotation';
    frame.style.cssText = 'position:absolute;pointer-events:none;z-index:2147483630;overflow:visible;';
    frame.style.left = scrollX + 'px';
    frame.style.top = scrollY + 'px';
    frame.style.width = viewW + 'px';
    frame.style.height = viewH + 'px';

    var hasDrawings = STATE.annotations.some(function (a) { return a.type === 'draw'; });
    if (hasDrawings) {
      var img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
      img.style.width = viewW + 'px';
      img.style.height = viewH + 'px';
      frame.appendChild(img);
    }

    var hasSvg = STATE.annotations.some(function (a) { return a.type === 'arrow' || a.type === 'rect' || a.type === 'highlight'; });
    if (hasSvg) {
      var svgClone = svgLayer.cloneNode(true);
      svgClone.removeAttribute('id');
      svgClone.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
      svgClone.querySelectorAll('.markup-preview').forEach(function (el) { el.remove(); });
      frame.appendChild(svgClone);
    }

    for (var i = 0; i < STATE.annotations.length; i++) {
      var ann = STATE.annotations[i];
      if (ann.element && (ann.type === 'text' || ann.type === 'pin' || ann.type === 'stamp' || ann.type === 'blur' || ann.type === 'template')) {
        var clone = ann.element.cloneNode(true);
        clone.style.pointerEvents = 'none';
        frame.appendChild(clone);
      }
    }

    document.body.appendChild(frame);

    var savedPinCounter = STATE.pinCounter;
    ns.clearAll();
    STATE.pinCounter = savedPinCounter;

    window.__markupCapture?.showToast('Annotations pinned to page!', 3000);
    ns.updateClearPinsVisibility();
  };

  ns.clearPinnedAnnotations = function () {
    document.querySelectorAll('.markup-pinned-annotation').forEach(function (el) { el.remove(); });
    window.__markupCapture?.showToast('All pins cleared.', 2000);
    ns.updateClearPinsVisibility();
  };

  ns.updateClearPinsVisibility = function () {
    var btn = document.getElementById('markup-clear-pins');
    if (!btn) return;
    btn.style.display = document.querySelectorAll('.markup-pinned-annotation').length > 0 ? '' : 'none';
  };
})();
