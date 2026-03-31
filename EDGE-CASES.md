# Edge Case Analysis: MarkUp

> Scanned 5 files on 2026-03-28
> Multi-pass analysis: Security + Logic/Edge Cases + State/Cleanup
> 8 issues: 1 critical, 5 warning, 2 info
> Confidence: 1 high, 5 medium, 2 low

> **DISCLAIMER**: Verify critical findings against actual code before acting.
> Issues marked CONFIDENCE: LOW may be false positives from truncated file analysis.

---

## CRITICAL (1)

### background.js:20
**Category:** edge-case | **Confidence:** MEDIUM

**Issue:** The regex `/:(.*?);/` might not match if the mime type string in `dataUrl` is malformed, lacking a colon or semicolon (e.g., `data:image/pngbase64,...`). This would cause an error when accessing the first element of the resulting array, potentially crashing the upload.

**Scenario:** The `dataUrl` received from the capture tab is intentionally corrupted (e.g., `dataimage/png;base64,...`), or some other unforeseen format.

**Fix:**
`background.js:20`

Before:
```
const mime = parts[0].match(/:(.*?);/)[1];
```

After:
```
const mimeMatch = parts[0].match(/:(.*?);/); const mime = mimeMatch ? mimeMatch[1] : 'image/png';
```

*Adds a check for a failed regex match and provides a default `mime` type, preventing a crash.*

---

## WARNING (5)

### background.js:20
**Category:** ssrf | **Confidence:** MEDIUM

**Issue:** The `fetch` call uses a hardcoded URL ('https://litterbox.catbox.moe/resources/internals/api.php'). While not directly user-controlled, this dependency introduces a potential risk. If the catbox.moe service is compromised, this extension could be used to perform requests to other internal services and thus become a beachhead for an SSRF attack.

**Scenario:** If catbox.moe is compromised, the background script would be sending user data to an attacker-controlled service.

**Fix:**
`background.js:20`

Before:
```
const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
```

After:
```
const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { // CONSIDER: Add a configuration option to allow users or maintainers to specify an alternative backend, with appropriate validation. Also, add integrity checks for responses and consider rate-limiting calls to this API.
```

*A configuration option would give the user more control and prevent the background service from using a possibly compromised remote service. However, due to the limited scope of the provided code, this cannot automatically be replaced by safer code.*

---

### capture.js:641
**Category:** logic | **Confidence:** MEDIUM

**Issue:** After saving the full page screenshot to a file, the code attempts to copy the *filename* to the clipboard, not the image data itself. The clipboard now contains the filename only, which is probably not what the user expects. Users would likely expect the image to be copied.

**Scenario:** User clicks the 'Full Page Screenshot' button and expects to be able to paste the full page image.

**Fix:**
`capture.js:641`

Before:
```
navigator.clipboard.writeText(filename).then(function() {
```

After:
```
fullCanvas.toBlob(function(blob) { navigator.clipboard.write([new ClipboardItem({'image/png': blob})]).then(function() {
```

*Modifies the code to save the image as a blob and copy the blob to the clipboard in png format.*

---

### content.js:1775-1781
**Category:** memory-leak | **Confidence:** MEDIUM

**Issue:** The `window.addEventListener('resize', ...)` does not have a corresponding `removeEventListener` call, which can lead to a memory leak. Every time the extension is activated, this listener is added again while the old listeners persist on page reload.

**Scenario:** Repeatedly activating and deactivating the extension on the same page without reloading the page.

---

### content.js:350
**Category:** xss | **Confidence:** LOW

**Issue:** The code constructs HTML using template literals which could be vulnerable to XSS if the COLORS array or STATE.color contain user-provided data, due to the interpolation of the variables into the HTML string. It's possible the color values are sanitized elsewhere, so the CONFIDENCE is reduced to LOW.

**Scenario:** If an attacker can modify the COLORS array or the STATE.color variable to include malicious HTML, it could be injected into the toolbar.

**Fix:**
`content.js:350`

Before:
```
${COLORS.map(c => `<button class="markup-color-btn${c.value === STATE.color ? ' active' : ''}" data-color="${c.value}" style="background:${c.value};${c.value === '#FFFFFF' || c.value === '#000000' ? 'border-color:#555;' : ''}" title="${c.label}"></button>`).join('')}
```

After:
```
${COLORS.map(c => `<button class="markup-color-btn${c.value === STATE.color ? ' active' : ''}" data-color="${DOMPurify.sanitize(c.value)}" style="background:${DOMPurify.sanitize(c.value)};${c.value === '#FFFFFF' || c.value === '#000000' ? 'border-color:#555;' : ''}" title="${DOMPurify.sanitize(c.label)}"></button>`).join('')}
```

*Sanitize color codes being inserted into the HTML. Requires DOMPurify library or similar to be included.*

---

### content.js:1704
**Category:** logic | **Confidence:** HIGH

**Issue:** In `tryErase`, after removing a 'draw' annotation from `STATE.annotations`, the `redrawCanvas()` function is called immediately, but there is no mechanism to stop the loop. Therefore, if another annotation point on a *different* `draw` annotation also lies within the same threshold, it will also be removed in subsequent iterations of the `for` loop, potentially erasing more than the user intended.

**Scenario:** User attempts to erase part of one freehand drawing but inadvertently erases parts of another freehand drawing which are in close proximity.

**Fix:**
`content.js:1704`

Before:
```
redrawCanvas();
```

After:
```
redrawCanvas(); return;
```

*Adding a `return` statement prevents further iterations of the loop after erasing a single element.*

---

## INFO (2)

### overlay.js:332
**Category:** silent-fail | **Confidence:** MEDIUM

**Issue:** The `setResolved` function catches errors during `localStorage.setItem`, but the catch block is empty. If `localStorage` is full or otherwise unavailable (e.g., in private browsing mode), the "resolved" state will not be saved, but the user will not be notified. This constitutes a silent failure.

**Scenario:** User marks issues as resolved, but the state is not persisted because localStorage is unavailable.

**Fix:**
`overlay.js:332`

Before:
```
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (_) {}
```

After:
```
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (e) {console.warn('Failed to save resolved state to localStorage:', e);}
```

*Logs a warning to the console when saving to localStorage fails.*

---

### content.js:1648
**Category:** edge-case | **Confidence:** LOW

**Issue:** The `pinCounter ` in `STATE` is only preserved across `clearAll()` invocations when pinning to the page. If the page is later reloaded or the extension is reactivated (creating a new overlay), the `pinCounter ` will reset to `1`, potentially resulting in duplicate pin numbers on the same page across different sessions.

**Scenario:** User creates pinned annotations, then reloads/reopens the Markup extension and creates new pins. The new pins may begin at 1 again, causing numbering conflicts.

**Fix:**
`content.js:1648`

Before:
```
STATE.pinCounter = savedPinCounter;
```

After:
```
STATE.pinCounter = savedPinCounter; localStorage.setItem('markup-pin-counter', savedPinCounter);
```

*Persists the pinCounter in localStorage so it can last until next invocation of the extension.*

---

