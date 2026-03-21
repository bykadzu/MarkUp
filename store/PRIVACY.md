# Privacy Policy — MarkUp

**Last updated:** March 21, 2026

## Summary

MarkUp does not collect, store, or transmit any user data. All annotations are processed locally in the browser.

## Data Collection

MarkUp collects **no data whatsoever**:

- **No personal information** — no name, email, or account info
- **No browsing history** — no pages visited, no URLs logged
- **No analytics or telemetry** — nothing is tracked or measured
- **No cookies** — the extension sets none
- **No external network requests** — the extension makes none
- **No user behavior monitoring** — no clicks, sessions, or usage patterns

## How It Works

- All annotations (drawings, arrows, text notes, pins, highlights, blur regions) exist **entirely in your browser's memory** during the active session
- When you close MarkUp or navigate away, all annotations are discarded
- Screenshots are rendered locally using a bundled library (html2canvas) with **zero external calls**
- Exported PNG files are saved to your **local Downloads folder** via the browser's standard download API
- File paths copied to clipboard are a **local clipboard operation only**

## Permissions

MarkUp requests only two permissions:

| Permission | Purpose |
|-----------|---------|
| `activeTab` | Injects the annotation overlay onto the current tab when you click the extension icon. Only activates on the tab you explicitly choose. |
| `scripting` | Injects the annotation engine (content.js, styles.css, html2canvas) into the active tab. Required by Manifest V3. |

MarkUp does **not** request permissions for: browsing history, all website data, background execution, network access, storage sync, or identity/account info.

## Third-Party Services

None. No analytics providers, no crash reporting, no advertising networks, no data brokers, no external APIs.

## Data Storage

MarkUp stores **nothing persistently**. No localStorage, no IndexedDB, no sync storage, no cookies. Each session is ephemeral.

## Account Requirements

No account required. No login, no registration, no email address. Install and use immediately.

## Open Source

The complete source code is available at: https://github.com/bykadzu/MarkUp

## Children's Privacy

MarkUp does not collect data from anyone, including children under 13.

## Changes to This Policy

Updates will be reflected in the "Last updated" date above and published to the same URL.

## Contact

For questions about this privacy policy:
- **Email:** contact@myfrendo.com
- **GitHub:** https://github.com/bykadzu/MarkUp/issues
