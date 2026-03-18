# MarkUp

Chrome extension for visual website annotations — draw, write, screenshot. Design feedback made fast.

## What it does

Annotate directly on any live webpage. No screenshot-first workflow. Drop numbered notes, draw arrows, highlight sections, then export as PNG with one click. The file path auto-copies to clipboard — paste it straight into Claude Code or any dev tool.

## Tools

| Tool | What it does | Shortcut |
|------|-------------|----------|
| **Pen** | Freehand drawing (adjustable width + color) | — |
| **Arrow** | Click start + end point | — |
| **Rectangle** | Drag to draw | — |
| **Text** | Numbered notes with B/I/U formatting, 3 sizes | Ctrl+B/I/U |
| **Pin** | Drop numbered markers (1, 2, 3...) | — |
| **Eraser** | Click any annotation to remove it | — |
| **Undo** | Step back | Ctrl+Z |

## Text notes

- Click anywhere with the Text tool to place a note
- **Format bar**: Bold, Italic, Underline, Size (S/M/L)
- **Color**: follows the active toolbar color
- **Finalize**: click the checkmark or press Ctrl+Enter
- **Re-edit**: double-click any finalized note
- **Reposition**: drag finalized notes anywhere
- **Multiline**: Enter for new lines, Ctrl+Enter to finish

## Export

- **Save (green arrow)**: Downloads PNG + copies image to clipboard
- **Copy**: Copies annotated screenshot to clipboard
- **Notes export**: All text notes + pins as markdown file

## Colors

5 presets: Red, Blue, Green, Yellow, White. Active color applies to all tools including text.

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
```

## Tech

- Manifest V3 — chrome.scripting API, Safari compatible
- 3-layer composite: Canvas (freehand) + SVG (shapes) + HTML (text/pins)
- html2canvas for page capture, handles oklch/oklab CSS
- Zero external dependencies at runtime

---

Built by [KADZU](https://github.com/bykadzu) with Claude Code.
