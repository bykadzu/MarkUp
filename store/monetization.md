# MarkUp — Free/Pro Split Plan

## Free Tier (v2.x — current)

Everything that ships today stays free forever:

| Tool | Included |
|------|----------|
| Pen (freehand drawing) | Yes |
| Arrow | Yes |
| Rectangle | Yes |
| Text (basic — single color, no formatting) | Yes |
| Pin (numbered markers) | Yes |
| Eraser | Yes |
| Undo (Ctrl+Z) | Yes |
| 5 colors (red, blue, green, yellow, white) | Yes |
| Save as PNG | Yes |
| Copy to clipboard | Yes |

## Pro Tier — $4.99/month

Premium tools for power users and design teams:

| Tool | Pro Feature |
|------|------------|
| Highlighter | Semi-transparent overlay |
| Blur/Redact | Backdrop-filter censoring |
| Stamps | Checkmark, cross, question, star |
| Crop | Region select screenshot |
| Custom color picker | Full rainbow wheel + hex input |
| Text formatting | Bold, Italic, Underline (B/I/U) |
| Text sizes | Small, Medium, Large |
| Drag notes | Reposition finalized text notes |
| 9 preset colors | Orange, violet, pink, black added |
| Markdown notes export | Export all annotations as .md |

## Implementation Plan

### Phase 1: Feature flag (no paywall yet)

Add a single flag at the top of `content.js`:

```javascript
const IS_PRO = true; // Set to false to enable free-tier restrictions
```

When `IS_PRO === false`:
- Hide Pro tools from the toolbar (highlighter, blur, stamp, crop buttons not rendered)
- Hide custom color picker (only show 5 basic colors)
- Hide text formatting bar (B/I/U/size buttons)
- Disable drag-to-reposition on finalized text notes
- Hide markdown export button
- Show a subtle "Upgrade to Pro" link in the toolbar footer

When `IS_PRO === true`:
- All features available (current behavior, unchanged)

### Phase 2: Payment integration

**Option A — ExtensionPay.com (recommended for simplicity)**
- Chrome extension payment platform
- Handles licensing, receipts, subscription management
- SDK is a single JS file (~5KB)
- $0.05 per payment + Stripe fees
- No server needed

**Option B — Stripe Payment Link**
- Create a Stripe payment link for $4.99/mo subscription
- On payment success, redirect to a page with a license key
- User enters license key in extension popup
- Extension validates key against a simple Supabase table
- More control but needs a backend check

**Option C — Chrome Web Store Payments (deprecated)**
- Google deprecated Chrome Web Store payments in 2020
- Not an option

### Recommendation

Start with **ExtensionPay.com** for Phase 2. Minimal code, handles edge cases (refunds, failed payments, trial periods). Switch to Stripe + own backend only if volume justifies the engineering effort.

### Phase 3: Trial period

- 7-day free trial of Pro features for new installs
- After trial: Pro tools show a lock icon overlay
- Clicking a locked tool shows a toast: "This is a Pro feature. Upgrade for $4.99/mo to unlock all tools."
- Trial status stored in `chrome.storage.local` (device-specific, resets on reinstall — acceptable for this price point)

## Revenue Projections

Conservative estimates based on Chrome Web Store developer tools category:

| Scenario | Installs/mo | Pro conversion | MRR |
|----------|------------|----------------|-----|
| Quiet | 100 | 3% | $15 |
| Steady | 500 | 3% | $75 |
| Growing | 2,000 | 5% | $500 |
| Hit | 10,000 | 5% | $2,500 |

Break-even on $5 developer fee: 1 Pro subscriber.

## Pricing Rationale

- $4.99/mo is the sweet spot for individual developer tools
- Below the "need manager approval" threshold
- Competitive: most annotation tools are $8-15/mo (Marker.io, BugHerd, Usersnap)
- Alternative: $39.99 lifetime purchase (one-time, simpler, but less recurring revenue)

## Timeline

| Phase | When | Effort |
|-------|------|--------|
| Phase 1: Feature flag | Before store launch | 2 hours |
| Store launch (all features free) | Now | Ready |
| Phase 2: Payment integration | After 500+ installs | 4 hours |
| Phase 3: Trial system | After first 10 Pro subscribers | 2 hours |

## Decision needed (Captain L0 — involves money):
- Confirm $4.99/mo pricing vs $39.99 lifetime
- Confirm ExtensionPay vs Stripe
- Confirm the free/pro feature split above
- The $5 Chrome Web Store developer fee
