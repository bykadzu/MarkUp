# MarkUp

**Draw on any website.** Annotate live pages with pen, arrows, text, pins, blur. Export as PNG. One click.

The missing feedback tool for designers, developers, and anyone who points at screens and says "make this bigger."

## What it does

Annotate directly on any live webpage. No screenshot-first workflow. Drop numbered notes, draw arrows, highlight sections, blur sensitive info, then export as PNG with one click. The file path auto-copies to clipboard — paste it straight into Claude Code or any dev tool.

## Tools

| Tool | What it does | Shortcut |
|------|-------------|----------|
| **Pen** | Freehand drawing (adjustable width + color) | — |
| **Arrow** | Click start point, click end point | — |
| **Rectangle** | Drag to draw outline | — |
| **Highlighter** | Semi-transparent overlay (mix-blend-mode: multiply) | — |
| **Blur/Redact** | Backdrop-filter blur — censors sensitive info | — |
| **Text** | Numbered notes with B/I/U formatting, 3 sizes, drag to reposition, double-click to re-edit | Ctrl+B/I/U |
| **Pin** | Drop numbered markers (1, 2, 3...) | — |
| **Stamp** | Quick reactions: checkmark, cross, question, star | — |
| **Eraser** | Click any annotation to remove it | — |
| **Crop** | Region select — saves just that area as PNG | — |
| **Undo** | Step back | Ctrl+Z |

## Text notes

- Click anywhere with the Text tool to place a note
- **Format bar**: Bold, Italic, Underline, Size (S/M/L)
- **Color**: follows the active toolbar color
- **Finalize**: click the checkmark or press Ctrl+Enter
- **Re-edit**: double-click any finalized note
- **Reposition**: drag finalized notes anywhere
- **Multiline**: Enter for new lines, Ctrl+Enter to finish

## Colors

9 preset colors + custom color picker (rainbow wheel). Active color applies to all tools including text.

## Export

- **Save (green arrow)**: Downloads PNG + copies file path to clipboard (for Claude Code workflow)
- **Copy**: Copies annotated screenshot to clipboard
- **Notes export**: All text notes + pins as markdown file

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Ctrl+B | Bold (in text tool) |
| Ctrl+I | Italic (in text tool) |
| Ctrl+U | Underline (in text tool) |
| Ctrl+Z | Undo last annotation |
| Ctrl+Enter | Finalize text note |
| ESC | Close extension |

## Install

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the MarkUp folder
5. Pin the extension to your toolbar

Also works in Safari 15.4+ via Web Extension support.

## Files

```
manifest.json       Manifest V3 config
popup.html/css/js   Extension popup
content.js          Annotation engine (canvas + SVG + HTML)
capture.js          Screenshot capture + clipboard + export
styles.css          Toolbar + annotation styles (glass morphism dark)
lib/html2canvas     Bundled — no CDN, works offline
icons/              16/48/128px
COMPARISON.md       MarkUp vs Windows Snipping Tool
CHANGELOG.md        Version history
```

## Tech

- Manifest V3 — chrome.scripting API, Safari 15.4+ compatible
- 3-layer composite: Canvas (freehand) + SVG (shapes) + HTML (text/pins)
- html2canvas for page capture, handles oklch/oklab CSS
- Zero external dependencies at runtime

---

Built by [KADZU](https://github.com/bykadzu) with Claude Code.
