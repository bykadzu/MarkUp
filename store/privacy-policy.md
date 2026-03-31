# Privacy Policy — MarkUp Chrome Extension

**Last updated:** March 19, 2026

## Summary

MarkUp does not collect, store, or track any user data. All annotation work happens locally in your browser.

## Data Collection

MarkUp collects **no data whatsoever**. Specifically:

- **No personal information** is collected (name, email, account, etc.)
- **No browsing history** is tracked or stored
- **No analytics or telemetry** is sent anywhere
- **No cookies** are set by the extension
- **No user behavior** is monitored or logged
- **No automatic network requests** are made by the extension

## How MarkUp Works

- All annotations (drawings, arrows, text notes, pins, highlights, blur regions) are created and stored **entirely in your browser's memory** during the active session
- When you close MarkUp or navigate away, all annotations are discarded
- Screenshots are composited locally using the browser's native Canvas API with **zero external calls**
- Exported PNG files are saved to your **local Downloads folder** via the browser's standard download API
- File paths may be copied to your clipboard when you save — this is a local clipboard operation only

## Permissions Explained

MarkUp requests only two permissions:

| Permission | Why |
|-----------|-----|
| `activeTab` | To inject the annotation overlay onto the current tab when you click the extension icon. Only activates on the tab you explicitly choose. |
| `scripting` | To inject the annotation engine (content.js, capture.js, styles.css) into the active tab. Required by Manifest V3. |

MarkUp does **not** request permissions for:
- All browsing history
- All website data
- Background execution
- Network access
- Storage sync
- Identity or account info

## Share Feature (Optional)

MarkUp includes an optional **Share** feature. When you explicitly click the Share button:
- Your annotated screenshot is uploaded to **Litterbox by Catbox** (litterbox.catbox.moe), a temporary file hosting service
- The upload expires automatically after **24 hours**
- A shareable link is generated and copied to your clipboard
- **This only happens when you actively choose to share** — no uploads occur during normal annotation use

This is the only network request MarkUp ever makes, and only when you initiate it.

## Third-Party Services

MarkUp uses **no third-party services** during normal operation. There are:
- No analytics providers (no Google Analytics, no Mixpanel, no Plausible)
- No crash reporting services
- No advertising networks
- No data brokers
- The only external service is **Litterbox/Catbox** for the optional Share feature (user-initiated only)

## Data Storage

MarkUp stores **nothing persistently**. There is no local storage, no IndexedDB, no sync storage, no cookies. Each annotation session is ephemeral.

## Account Requirements

MarkUp requires **no account**, no login, no registration, and no email address. Install and use it immediately.

## Open Source

MarkUp is open source. You can inspect the complete source code at:
https://github.com/bykadzu/MarkUp

## Children's Privacy

MarkUp does not collect data from anyone, including children under 13.

## Changes to This Policy

If this privacy policy changes, the update will be reflected in the "Last updated" date above and published to the same URL.

## Contact

For questions about this privacy policy:
- GitHub: https://github.com/bykadzu/MarkUp/issues
- Developer: KADZU (https://github.com/bykadzu)
