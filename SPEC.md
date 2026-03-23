# WebPen — Persistent Web Annotations

> The next evolution of MarkUp: annotations that stay on websites.

## Problem

MarkUp today is a screenshot-first workflow. You annotate, export a PNG, send it over. The client sees a static image — not the actual site. They squint at pixel coordinates, guess which element you meant, and reply "which button?"

The feedback loop is broken: annotate → screenshot → send → client opens image → cross-references with live site → replies → repeat.

## Vision

**Annotations that live on the website itself.**

You annotate a client's site with MarkUp. Instead of exporting a PNG, you generate a shareable link. The client opens their own site and sees your notes overlaid directly on the page — pins, comments, highlights, all positioned exactly where you placed them.

No extension needed on the viewer's side. One `<script>` tag.

## How It Works

### For the annotator (Myfrendo team)
1. Open client site with MarkUp extension
2. Annotate as usual — pins, text notes, arrows, highlights
3. Click "Share" → annotations are saved as JSON (local file, Supabase, or static URL)
4. A unique overlay URL is generated

### For the viewer (client)
1. Add one script tag to their page:
   ```html
   <script src="overlay.js" data-annotations="https://example.com/annotations.json"></script>
   ```
2. Open their site — annotations appear as interactive pins
3. Click a pin → see the note, author, timestamp, status
4. Mark notes as resolved when addressed

### Zero-install viewing
The overlay script is standalone JavaScript. No framework, no build step, no extension. Works on any website that can add a `<script>` tag.

## Annotation Schema

```json
{
  "version": "1.0",
  "url": "https://client-site.com/page",
  "created": "2026-03-23T14:30:00Z",
  "author": "Myfrendo Design Team",
  "annotations": [
    {
      "id": "a1",
      "x": 420,
      "y": 280,
      "width": 200,
      "height": 100,
      "type": "pin",
      "text": "This button needs more contrast — fails WCAG 4.5:1",
      "color": "#DC2626",
      "author": "Kole",
      "timestamp": "2026-03-23T14:30:00Z",
      "resolved": false
    }
  ]
}
```

### Annotation Types
- **pin** — Numbered marker at (x, y). Click to expand note.
- **region** — Highlighted rectangle (x, y, width, height) with attached note.
- **arrow** — Points from (x, y) toward a target. Draws attention.

## Overlay Rendering

The overlay script (`overlay.js`) handles:

1. **Fetch** — Loads JSON from the `data-annotations` URL
2. **Render pins** — Positioned absolutely, numbered sequentially
3. **Expand on click** — Note card with author, timestamp, text, status
4. **Resolve toggle** — Viewer can mark notes as resolved (local storage)
5. **Minimize** — Collapse all notes, show only pin dots
6. **Responsive** — Pins reposition based on viewport (percentage-based coords optional)

### Styling Principles
- Glass morphism: `backdrop-filter: blur(16px)`, subtle borders, dark translucent backgrounds
- Does NOT inject a CSS file — all styles are inline or scoped via shadow DOM
- Never interferes with the host site's layout (position: fixed, high z-index)
- Respects `prefers-reduced-motion`
- Touch targets: 44x44px minimum for mobile
- Typography: system font stack, -2.5% letter-spacing on headings

## Architecture

```
overlay.js          Standalone viewer script (no dependencies)
overlay-demo.html   Demo page with sample annotations
```

### Future (not in prototype)
- `overlay-editor.js` — Annotation creation UI (extracted from content.js)
- Supabase backend for annotation storage + real-time sync
- Unique shareable URLs (webpen.myfrendo.com/abc123)
- WebSocket presence (see who's viewing)
- Thread replies on annotations
- Version diffing (annotation set A vs B)
- Integration with MarkUp extension: "Share as WebPen" button in toolbar

## Prototype Scope

The current prototype (`overlay.js` + `overlay-demo.html`) proves the core concept:

1. Load annotations from JSON via script tag attribute
2. Render numbered pins at correct positions
3. Click pin → expand note card with glass morphism styling
4. Show author, timestamp, resolved/unresolved status
5. Toggle resolved state (persisted in localStorage)
6. Annotation count badge + minimize/expand all toggle

This is the foundation. If the viewing experience works, the creation + sharing pipeline follows.

---

*WebPen: "Point at the actual thing."*
