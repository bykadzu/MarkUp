# MarkUp — Visual Website Annotations

## Short description (132 chars max):
Annotate any website live — arrows, pins, blur, text notes — then save as PNG. Built for design QA and developer handoff.

## Full description:

MarkUp lets you annotate directly on any live webpage. No screenshot-first workflow. Drop numbered pins, draw arrows, highlight sections, blur sensitive info, then export as PNG with one click.

11 tools: Pen, Arrow, Rectangle, Highlighter, Blur/Redact, Text (with B/I/U formatting), Pin, Stamps, Eraser, Crop, and Undo. 9 colors + custom color picker.

Export options: Save PNG (file path auto-copied to clipboard), copy to clipboard, or export all notes as markdown.

Built for developers: The file path is auto-copied on save. Paste directly into Claude Code, VS Code, or any dev tool.

Zero data collection. No analytics. No tracking. No account required. Works offline. Open source.

## Category: Developer Tools

## Language: English

## Pricing: Free

## Website: https://github.com/bykadzu/MarkUp

## Privacy policy URL: https://github.com/bykadzu/MarkUp/blob/main/store/privacy-policy.md

## Support URL: https://github.com/bykadzu/MarkUp/issues

## Required assets checklist:
- [x] Icon 128x128 (icons/icon-128.png)
- [ ] Screenshot 1: 1280x800 — core annotation workflow (see screenshot-1.txt)
- [ ] Screenshot 2: 1280x800 — text formatting toolbar (see screenshot-2.txt)
- [ ] Screenshot 3: 1280x800 — blur/redact tool (see screenshot-3.txt)
- [ ] Promo tile 440x280 (see promo-tile.txt)
- [x] Privacy policy (store/privacy-policy.md)
- [x] Detailed description (store/description.txt)

## Publishing steps:
1. Go to https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 developer registration fee (if not already registered)
3. Click "New Item" > upload ZIP of the extension folder
4. Fill in listing details from this file
5. Upload screenshots and promo tile
6. Link privacy policy URL
7. Submit for review (typically 1-3 business days)

## ZIP packaging command:
```bash
cd C:/Users/gentl/Documents/MarkUp
zip -r markup-extension.zip manifest.json popup.html popup.css popup.js content.js capture.js styles.css icons/ lib/ -x "*.git*" "store/*" "*.md"
```
