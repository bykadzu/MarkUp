/**
 * WebPen Overlay — Persistent web annotations viewer
 *
 * Usage: Add to any page via script tag:
 *   <script src="overlay.js" data-annotations="annotations.json"></script>
 *
 * Or load inline JSON:
 *   <script src="overlay.js" data-annotations-inline='[...]'></script>
 *
 * Zero dependencies. No framework. Works on any website.
 */
(function () {
  'use strict';

  // Prevent double-init
  if (window.__webpen) return;
  window.__webpen = true;

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var PREFIX = 'webpen';
  var Z_BASE = 2147483600;
  var STORAGE_KEY = 'webpen-resolved';
  var FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

  // Colors (HSL-based for dark mode math)
  var C = {
    bgPanel:     'hsla(230, 25%, 9%, 0.88)',
    bgCard:      'hsla(230, 25%, 11%, 0.92)',
    border:      'hsla(0, 0%, 100%, 0.1)',
    borderHover: 'hsla(0, 0%, 100%, 0.18)',
    text:        'hsl(0, 0%, 94%)',
    textMuted:   'hsl(0, 0%, 55%)',
    textDim:     'hsl(0, 0%, 40%)',
    resolved:    'hsl(142, 71%, 45%)',
    resolvedBg:  'hsla(142, 71%, 45%, 0.12)',
    pinDefault:  'hsl(0, 84%, 50%)',
    white12:     'hsla(0, 0%, 100%, 0.12)',
    white06:     'hsla(0, 0%, 100%, 0.06)',
    shadow:      'hsla(0, 0%, 0%, 0.4)',
    shadowDeep:  'hsla(0, 0%, 0%, 0.6)',
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'style' && typeof attrs[k] === 'object') {
          Object.assign(node.style, attrs[k]);
        } else if (k === 'className') {
          node.className = attrs[k];
        } else if (k.startsWith('on')) {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      if (typeof children === 'string') {
        node.textContent = children;
      } else if (Array.isArray(children)) {
        children.forEach(function (c) { if (c) node.appendChild(c); });
      } else {
        node.appendChild(children);
      }
    }
    return node;
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() +
      ' at ' + d.getHours().toString().padStart(2, '0') + ':' +
      d.getMinutes().toString().padStart(2, '0');
  }

  function getResolved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) { return {}; }
  }

  function setResolved(id, val) {
    var map = getResolved();
    map[id] = val;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (_) {}
  }

  // Check prefers-reduced-motion
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function transition(props) {
    if (prefersReducedMotion) return 'none';
    return props;
  }

  // ---------------------------------------------------------------------------
  // Inject scoped styles (no external CSS file needed)
  // ---------------------------------------------------------------------------

  function injectStyles() {
    var css = [
      // Pin marker
      '.' + PREFIX + '-pin {',
      '  position: absolute;',
      '  width: 36px;',
      '  height: 36px;',
      '  border-radius: 50%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  font-family: ' + FONT_STACK + ';',
      '  font-size: 14px;',
      '  font-weight: 700;',
      '  color: #fff;',
      '  cursor: pointer;',
      '  user-select: none;',
      '  border: 2px solid hsla(0, 0%, 100%, 0.3);',
      '  z-index: ' + (Z_BASE + 10) + ';',
      '  transform: scale(1);',
      '  transition: ' + transition('transform 0.15s ease-out, box-shadow 0.15s ease-out') + ';',
      '  box-shadow: 0 2px 8px ' + C.shadow + ';',
      '}',
      '.' + PREFIX + '-pin:hover {',
      '  transform: scale(1.12);',
      '  box-shadow: 0 4px 16px ' + C.shadowDeep + ';',
      '}',
      '.' + PREFIX + '-pin:active {',
      '  transform: scale(0.96);',
      '}',
      '.' + PREFIX + '-pin[data-resolved="true"] {',
      '  opacity: 0.5;',
      '  filter: saturate(0.3);',
      '}',

      // Region highlight
      '.' + PREFIX + '-region {',
      '  position: absolute;',
      '  border: 2px dashed;',
      '  border-radius: 4px;',
      '  cursor: pointer;',
      '  z-index: ' + (Z_BASE + 5) + ';',
      '  transition: ' + transition('background 0.15s ease-out') + ';',
      '}',
      '.' + PREFIX + '-region:hover {',
      '  background: hsla(0, 0%, 100%, 0.04);',
      '}',

      // Note card
      '.' + PREFIX + '-card {',
      '  position: absolute;',
      '  width: 300px;',
      '  max-width: calc(100vw - 32px);',
      '  background: ' + C.bgCard + ';',
      '  backdrop-filter: blur(20px) saturate(1.4);',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.4);',
      '  border: 1px solid ' + C.border + ';',
      '  border-radius: 12px;',
      '  box-shadow: 0 8px 32px ' + C.shadowDeep + ', 0 0 0 1px ' + C.white06 + ' inset;',
      '  z-index: ' + (Z_BASE + 20) + ';',
      '  font-family: ' + FONT_STACK + ';',
      '  color: ' + C.text + ';',
      '  overflow: hidden;',
      '  opacity: 0;',
      '  transform: translateY(8px) scale(0.96);',
      '  transition: ' + transition('opacity 0.2s ease-out, transform 0.2s ease-out') + ';',
      '  pointer-events: none;',
      '}',
      '.' + PREFIX + '-card.open {',
      '  opacity: 1;',
      '  transform: translateY(0) scale(1);',
      '  pointer-events: auto;',
      '}',

      // Card header
      '.' + PREFIX + '-card-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 12px 16px 8px;',
      '  border-bottom: 1px solid ' + C.white06 + ';',
      '}',
      '.' + PREFIX + '-card-author {',
      '  font-size: 13px;',
      '  font-weight: 600;',
      '  letter-spacing: -0.01em;',
      '}',
      '.' + PREFIX + '-card-time {',
      '  font-size: 11px;',
      '  color: ' + C.textDim + ';',
      '}',

      // Card body
      '.' + PREFIX + '-card-body {',
      '  padding: 12px 16px;',
      '  font-size: 14px;',
      '  line-height: 1.5;',
      '  color: hsl(0, 0%, 85%);',
      '}',

      // Card footer
      '.' + PREFIX + '-card-footer {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 8px 16px 12px;',
      '  border-top: 1px solid ' + C.white06 + ';',
      '}',

      // Resolve button
      '.' + PREFIX + '-resolve-btn {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  padding: 6px 12px;',
      '  border: 1px solid ' + C.border + ';',
      '  border-radius: 8px;',
      '  background: transparent;',
      '  color: ' + C.textMuted + ';',
      '  font-family: ' + FONT_STACK + ';',
      '  font-size: 12px;',
      '  font-weight: 500;',
      '  cursor: pointer;',
      '  transition: ' + transition('all 0.15s ease-out') + ';',
      '  min-height: 32px;',
      '}',
      '.' + PREFIX + '-resolve-btn:hover {',
      '  border-color: ' + C.borderHover + ';',
      '  color: ' + C.text + ';',
      '  background: ' + C.white06 + ';',
      '}',
      '.' + PREFIX + '-resolve-btn[data-resolved="true"] {',
      '  border-color: hsla(142, 71%, 45%, 0.3);',
      '  color: ' + C.resolved + ';',
      '  background: ' + C.resolvedBg + ';',
      '}',

      // Status badge
      '.' + PREFIX + '-status {',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  padding: 4px 8px;',
      '  border-radius: 6px;',
      '}',
      '.' + PREFIX + '-status-open {',
      '  color: hsl(35, 92%, 55%);',
      '  background: hsla(35, 92%, 55%, 0.12);',
      '}',
      '.' + PREFIX + '-status-resolved {',
      '  color: ' + C.resolved + ';',
      '  background: ' + C.resolvedBg + ';',
      '}',

      // Floating badge (annotation count)
      '.' + PREFIX + '-badge {',
      '  position: fixed;',
      '  bottom: 20px;',
      '  right: 20px;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 10px 16px;',
      '  background: ' + C.bgPanel + ';',
      '  backdrop-filter: blur(20px) saturate(1.4);',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.4);',
      '  border: 1px solid ' + C.border + ';',
      '  border-radius: 12px;',
      '  box-shadow: 0 4px 24px ' + C.shadow + ';',
      '  z-index: ' + (Z_BASE + 30) + ';',
      '  font-family: ' + FONT_STACK + ';',
      '  font-size: 13px;',
      '  font-weight: 500;',
      '  color: ' + C.text + ';',
      '  cursor: pointer;',
      '  user-select: none;',
      '  transition: ' + transition('transform 0.15s ease-out, box-shadow 0.15s ease-out') + ';',
      '}',
      '.' + PREFIX + '-badge:hover {',
      '  transform: translateY(-2px);',
      '  box-shadow: 0 8px 32px ' + C.shadowDeep + ';',
      '}',
      '.' + PREFIX + '-badge:active {',
      '  transform: scale(0.98);',
      '}',
      '.' + PREFIX + '-badge-dot {',
      '  width: 8px;',
      '  height: 8px;',
      '  border-radius: 50%;',
      '  background: ' + C.pinDefault + ';',
      '}',
      '.' + PREFIX + '-badge-count {',
      '  font-variant-numeric: tabular-nums;',
      '}',

      // Connector line from pin to card
      '.' + PREFIX + '-connector {',
      '  position: absolute;',
      '  pointer-events: none;',
      '  z-index: ' + (Z_BASE + 15) + ';',
      '}',
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.setAttribute('data-webpen', 'true');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ---------------------------------------------------------------------------
  // Core: Render annotations
  // ---------------------------------------------------------------------------

  var state = {
    annotations: [],
    activeId: null,
    visible: true,
    pins: {},       // id -> pin element
    cards: {},      // id -> card element
    regions: {},    // id -> region element
  };

  // Container for all overlay elements (absolute positioning relative to document)
  var container = null;

  function createContainer() {
    container = el('div', {
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '0',
        height: '0',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: Z_BASE,
      }
    });
    document.body.appendChild(container);
  }

  // ---------------------------------------------------------------------------
  // Build a single pin element
  // ---------------------------------------------------------------------------

  function createPin(ann, index) {
    var resolved = getResolved()[ann.id] || false;
    var pinColor = ann.color || C.pinDefault;

    var pin = el('div', {
      className: PREFIX + '-pin',
      style: {
        left: ann.x + 'px',
        top: ann.y + 'px',
        background: pinColor,
        pointerEvents: 'auto',
        marginLeft: '-18px',
        marginTop: '-18px',
      },
      'data-resolved': resolved.toString(),
      'data-id': ann.id,
      title: ann.text ? ann.text.substring(0, 80) : 'Annotation #' + (index + 1),
    }, String(index + 1));

    pin.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleCard(ann.id);
    });

    return pin;
  }

  // ---------------------------------------------------------------------------
  // Build a region highlight element
  // ---------------------------------------------------------------------------

  function createRegion(ann, index) {
    var regionColor = ann.color || C.pinDefault;
    var region = el('div', {
      className: PREFIX + '-region',
      style: {
        left: ann.x + 'px',
        top: ann.y + 'px',
        width: (ann.width || 200) + 'px',
        height: (ann.height || 100) + 'px',
        borderColor: regionColor,
        background: regionColor.replace(')', ', 0.06)').replace('hsl(', 'hsla(').replace('rgb(', 'rgba('),
        pointerEvents: 'auto',
      },
      'data-id': ann.id,
    });

    region.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleCard(ann.id);
    });

    return region;
  }

  // ---------------------------------------------------------------------------
  // Build a note card (expanded annotation detail)
  // ---------------------------------------------------------------------------

  function createCard(ann, index) {
    var resolved = getResolved()[ann.id] || false;

    // Header
    var header = el('div', { className: PREFIX + '-card-header' }, [
      el('div', {}, [
        el('div', { className: PREFIX + '-card-author' }, ann.author || 'Anonymous'),
        el('div', { className: PREFIX + '-card-time' }, formatDate(ann.timestamp)),
      ]),
      el('span', {
        className: PREFIX + '-status ' + PREFIX + '-status-' + (resolved ? 'resolved' : 'open'),
      }, resolved ? 'Resolved' : 'Open'),
    ]);

    // Body
    var body = el('div', { className: PREFIX + '-card-body' }, ann.text || '');

    // Footer with resolve toggle
    var resolveBtn = el('button', {
      className: PREFIX + '-resolve-btn',
      'data-resolved': resolved.toString(),
      onClick: function (e) {
        e.stopPropagation();
        var newVal = !getResolved()[ann.id];
        setResolved(ann.id, newVal);
        updateResolvedState(ann.id, newVal);
      },
    }, [
      el('span', {}, resolved ? '\u2714' : '\u25CB'),
      el('span', {}, resolved ? 'Resolved' : 'Mark resolved'),
    ]);

    var indexLabel = el('span', {
      style: { fontSize: '11px', color: C.textDim },
    }, '#' + (index + 1));

    var footer = el('div', { className: PREFIX + '-card-footer' }, [
      resolveBtn,
      indexLabel,
    ]);

    // Card container — positioned next to the pin
    var cardX = ann.x + 24;
    var cardY = ann.y + 8;

    // Shift left if card would overflow right edge
    if (cardX + 316 > window.innerWidth) {
      cardX = ann.x - 316;
    }

    var card = el('div', {
      className: PREFIX + '-card',
      style: {
        left: cardX + 'px',
        top: cardY + 'px',
        pointerEvents: 'none',
      },
      'data-id': ann.id,
    }, [header, body, footer]);

    card.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    return card;
  }

  // ---------------------------------------------------------------------------
  // Toggle card visibility
  // ---------------------------------------------------------------------------

  function toggleCard(id) {
    if (state.activeId === id) {
      closeAllCards();
      return;
    }
    closeAllCards();
    state.activeId = id;
    var card = state.cards[id];
    if (card) {
      // Reposition card to avoid viewport overflow
      repositionCard(id);
      requestAnimationFrame(function () {
        card.classList.add('open');
      });
    }
  }

  function closeAllCards() {
    state.activeId = null;
    Object.keys(state.cards).forEach(function (id) {
      state.cards[id].classList.remove('open');
    });
  }

  function repositionCard(id) {
    var ann = state.annotations.find(function (a) { return a.id === id; });
    var card = state.cards[id];
    if (!ann || !card) return;

    var cardW = 300;
    var cardH = card.offsetHeight || 180;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scrollX = window.scrollX;
    var scrollY = window.scrollY;

    var cx = ann.x + 24;
    var cy = ann.y + 8;

    // Shift left if overflowing right
    if (cx + cardW > scrollX + vw - 16) {
      cx = ann.x - cardW - 8;
    }
    // Shift up if overflowing bottom
    if (cy + cardH > scrollY + vh - 16) {
      cy = ann.y - cardH - 8;
    }
    // Clamp to viewport
    cx = Math.max(scrollX + 8, cx);
    cy = Math.max(scrollY + 8, cy);

    card.style.left = cx + 'px';
    card.style.top = cy + 'px';
  }

  // ---------------------------------------------------------------------------
  // Update resolved state across pin + card
  // ---------------------------------------------------------------------------

  function updateResolvedState(id, resolved) {
    var pin = state.pins[id];
    if (pin) {
      pin.setAttribute('data-resolved', resolved.toString());
    }

    var card = state.cards[id];
    if (!card) return;

    // Update status badge
    var statusEl = card.querySelector('.' + PREFIX + '-status');
    if (statusEl) {
      statusEl.className = PREFIX + '-status ' + PREFIX + '-status-' + (resolved ? 'resolved' : 'open');
      statusEl.textContent = resolved ? 'Resolved' : 'Open';
    }

    // Update resolve button
    var btn = card.querySelector('.' + PREFIX + '-resolve-btn');
    if (btn) {
      btn.setAttribute('data-resolved', resolved.toString());
      btn.innerHTML = '';
      btn.appendChild(el('span', {}, resolved ? '\u2714' : '\u25CB'));
      btn.appendChild(el('span', {}, resolved ? 'Resolved' : 'Mark resolved'));
    }

    // Update badge counts
    updateBadge();
  }

  // ---------------------------------------------------------------------------
  // Floating badge (bottom-right)
  // ---------------------------------------------------------------------------

  var badgeEl = null;

  function createBadge() {
    var total = state.annotations.length;
    var resolvedMap = getResolved();
    var resolvedCount = state.annotations.filter(function (a) {
      return resolvedMap[a.id];
    }).length;

    badgeEl = el('div', {
      className: PREFIX + '-badge',
      onClick: function () {
        state.visible = !state.visible;
        toggleVisibility();
      },
    }, [
      el('span', { className: PREFIX + '-badge-dot' }),
      el('span', { className: PREFIX + '-badge-count' },
        resolvedCount + '/' + total + ' resolved'),
      el('span', {
        style: { fontSize: '11px', color: C.textDim, marginLeft: '4px' },
      }, state.visible ? 'Hide' : 'Show'),
    ]);

    document.body.appendChild(badgeEl);
  }

  function updateBadge() {
    if (!badgeEl) return;
    var total = state.annotations.length;
    var resolvedMap = getResolved();
    var resolvedCount = state.annotations.filter(function (a) {
      return resolvedMap[a.id];
    }).length;

    var countEl = badgeEl.querySelector('.' + PREFIX + '-badge-count');
    if (countEl) {
      countEl.textContent = resolvedCount + '/' + total + ' resolved';
    }
  }

  function toggleVisibility() {
    if (!container) return;
    container.style.display = state.visible ? '' : 'none';
    if (badgeEl) {
      var toggleLabel = badgeEl.querySelector('span:last-child');
      if (toggleLabel) {
        toggleLabel.textContent = state.visible ? 'Hide' : 'Show';
      }
    }
    if (!state.visible) {
      closeAllCards();
    }
  }

  // ---------------------------------------------------------------------------
  // Render all annotations
  // ---------------------------------------------------------------------------

  function render(annotations) {
    state.annotations = annotations;

    createContainer();
    injectStyles();

    annotations.forEach(function (ann, i) {
      // Pin (all types get a pin)
      var pin = createPin(ann, i);
      state.pins[ann.id] = pin;
      container.appendChild(pin);

      // Region highlight (if type is region and has dimensions)
      if (ann.type === 'region' && ann.width && ann.height) {
        var region = createRegion(ann, i);
        state.regions[ann.id] = region;
        container.appendChild(region);
      }

      // Note card
      var card = createCard(ann, i);
      state.cards[ann.id] = card;
      container.appendChild(card);
    });

    createBadge();

    // Close cards when clicking outside
    document.addEventListener('click', function () {
      closeAllCards();
    });

    // Reposition on scroll/resize
    window.addEventListener('scroll', function () {
      if (state.activeId) {
        repositionCard(state.activeId);
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      if (state.activeId) {
        repositionCard(state.activeId);
      }
    }, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Load annotations from data attribute or inline
  // ---------------------------------------------------------------------------

  function init() {
    var script = document.currentScript ||
      document.querySelector('script[data-annotations]') ||
      document.querySelector('script[data-annotations-inline]');

    if (!script) return;

    // Inline JSON
    var inline = script.getAttribute('data-annotations-inline');
    if (inline) {
      try {
        var data = JSON.parse(inline);
        var annotations = Array.isArray(data) ? data : (data.annotations || []);
        if (annotations.length > 0) render(annotations);
      } catch (e) {
        console.error('[WebPen] Failed to parse inline annotations:', e);
      }
      return;
    }

    // External JSON URL
    var url = script.getAttribute('data-annotations');
    if (!url) return;

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var annotations = Array.isArray(data) ? data : (data.annotations || []);
        if (annotations.length > 0) render(annotations);
      })
      .catch(function (err) {
        console.error('[WebPen] Failed to load annotations from ' + url + ':', err);
      });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
