# Browser Compatibility — MarkUp v3.0.0

## Primary: Chrome (Manifest V3)

- [ ] Extension loads from `chrome://extensions` (load unpacked)
- [ ] Popup opens, "Annotate" button injects overlay
- [ ] All 10 tools work: draw, arrow, rect, highlight, blur, text, pin, stamp, eraser, crop
- [ ] Toolbar draggable, snaps to visible area on resize
- [ ] Color picker: 9 presets + custom color wheel
- [ ] Width picker: thin / medium / thick
- [ ] Undo / redo / clear all
- [ ] Save as PNG (download + clipboard)
- [ ] Copy to clipboard
- [ ] Export notes as markdown
- [ ] Full page screenshot (scroll-stitch)
- [ ] Compare mode (before/after slider)
- [ ] Share link (upload + clipboard fallback on cancel)
- [ ] Templates: 5 built-in + custom creation
- [ ] Pin annotations to page DOM
- [ ] Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo), ESC (close)
- [ ] Text note formatting: bold, italic, underline, size S/M/L
- [ ] Toast notifications don't stack
- [ ] Overlay destroys cleanly on close (no leaked listeners)
- [ ] Re-open after close works (no double-injection)

## Secondary: Edge (Chromium)

Edge uses the same Chromium engine. Expected to work identically.

- [ ] Extension loads from `edge://extensions` (developer mode)
- [ ] All tools functional
- [ ] Screenshot capture works (`chrome.tabs.captureVisibleTab`)
- [ ] Share upload works (host_permissions for catbox)

## Tertiary: Firefox (Manifest V2 fallback)

Firefox uses `browser.*` API namespace. The codebase includes `browser`/`chrome` fallback detection.

**Known differences:**
- Manifest V3 is partially supported in Firefox. May need a separate `manifest.json` for Firefox (V2 format with `background.scripts` instead of `service_worker`).
- `browser.scripting.executeScript` requires Firefox 102+.
- `browser.tabs.captureVisibleTab` works but returns PNG by default (we request JPEG).
- `backdrop-filter` for blur tool requires Firefox 103+.

**Firefox-specific checks:**
- [ ] Extension loads in Firefox with V2 manifest
- [ ] `browser.*` API detection works in popup.js
- [ ] `browser.runtime.sendMessage` works in content scripts
- [ ] Blur regions render (backdrop-filter support)
- [ ] Share upload works (fetch in background script)

## Safari (via Web Extension)

Manifest declares `browser_specific_settings.safari.strict_min_version: "15.4"`.

**Known differences:**
- Requires Xcode and Safari Web Extension wrapper
- `browser.*` API namespace used
- `chrome.tabs.captureVisibleTab` may need `<all_urls>` permission
- Touch events on iPad should work (touchstart/move/end handlers exist)

**Safari-specific checks:**
- [ ] Extension loads via Xcode project
- [ ] `browser.*` fallback works
- [ ] Canvas 2D context available with `willReadFrequently`
- [ ] SVG marker elements render (arrow heads)
- [ ] `backdrop-filter` works for blur tool

## Cross-Browser Test Matrix

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Load extension | | | | |
| Draw tool | | | | |
| Arrow tool | | | | |
| Rectangle tool | | | | |
| Highlight tool | | | | |
| Blur tool | | | | |
| Text note | | | | |
| Pin tool | | | | |
| Stamp tool | | | | |
| Eraser tool | | | | |
| Crop tool | | | | |
| Save PNG | | | | |
| Copy to clipboard | | | | |
| Full page screenshot | | | | |
| Compare mode | | | | |
| Share link | | | | |
| Templates | | | | |
| Pin to page | | | | |
| Keyboard shortcuts | | | | |
| Touch events | | | | |

## Testing Sites

Test on at least 3 different types of sites:
1. **Static site** — e.g., a landing page or blog
2. **Web app** — e.g., Gmail, GitHub, or a dashboard
3. **Heavy JS site** — e.g., YouTube, Twitter/X

Verify on each:
- Overlay doesn't break page layout
- Annotations render correctly over dynamic content
- Close/destroy doesn't leave artifacts
- z-index doesn't conflict with site modals/dropdowns
