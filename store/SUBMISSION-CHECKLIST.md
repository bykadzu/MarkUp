# Chrome Web Store Submission Checklist

## Prerequisites

- [ ] Chrome Developer account registered at https://chrome.google.com/webstore/devconsole ($5 one-time fee)
- [ ] Extension tested locally via `chrome://extensions/` → Load unpacked

## 1. Build the Extension ZIP

```bash
bash store/build.sh
```

This creates `store/markup-extension-v2.0.0.zip` — the file you upload.

## 2. Upload to Chrome Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Click **"New Item"**
3. Upload `store/markup-extension-v2.0.0.zip`

## 3. Fill In Listing Details

Use the copy from `store/LISTING.md`:

| Field | Value |
|-------|-------|
| Title | MarkUp - Screenshot and Annotate Any Website |
| Short description | Copy from LISTING.md (132 chars max) |
| Detailed description | Copy full description from LISTING.md |
| Category | Productivity |
| Language | English |
| Website | https://github.com/bykadzu/MarkUp |
| Support URL | https://github.com/bykadzu/MarkUp/issues |

## 4. Privacy

| Field | Value |
|-------|-------|
| Privacy policy URL | https://github.com/bykadzu/MarkUp/blob/main/store/privacy-policy.html |
| Single purpose | Annotate any webpage and export as PNG |
| Permissions justification | `activeTab`: overlay annotations on current page. `scripting`: inject annotation engine (Manifest V3 requirement). |
| Data use disclosure | Select "This extension does not collect or use user data" |

## 5. Screenshots & Graphics

Required assets:

- [ ] **Screenshots** (1280x800 or 640x400, minimum 1, up to 5):
  - Screenshot 1: Annotation toolbar active on a webpage with pen/arrow annotations
  - Screenshot 2: Text notes with formatting toolbar visible
  - Screenshot 3: Blur/redact tool in use on sensitive content
  - Screenshot 4: Export flow — save button, clipboard toast
  - Screenshot 5: Color picker expanded with all 9 colors + custom

- [ ] **Small promo tile** (440x280): Extension logo + tagline

- [ ] **Icon** (128x128): Already at `icons/icon-128.png`

Tip: Take screenshots on a clean, visually interesting webpage. Avoid pages with sensitive/personal content.

## 6. Distribution

| Field | Value |
|-------|-------|
| Visibility | Public |
| Distribution | All regions |
| Pricing | Free |

## 7. Submit for Review

1. Review all fields one final time
2. Click **"Submit for review"**
3. Typical review time: **1–3 business days**
4. You'll receive an email when approved (or if changes are requested)

## Post-Approval

- [ ] Verify the listing is live and install works
- [ ] Add the Chrome Web Store link to README.md
- [ ] Add the Chrome Web Store link to the GitHub repo description

---

## Safari Web Extension (Apple App Store)

Safari uses the same extension code but requires a different submission process:

### Key Differences from Chrome

| Aspect | Chrome Web Store | Apple App Store |
|--------|-----------------|-----------------|
| Account | $5 one-time | $99/year Apple Developer Program |
| Wrapper | ZIP upload | Xcode project wrapping the extension |
| Review | 1–3 days | 1–7 days |
| Tool | Chrome DevConsole | Xcode + App Store Connect |

### Safari Submission Steps

1. **Join Apple Developer Program** ($99/year) at https://developer.apple.com/programs/
2. **Convert extension** using Xcode:
   ```bash
   xcrun safari-web-extension-converter /path/to/MarkUp
   ```
3. **Build and sign** the Xcode project
4. **Submit via App Store Connect** as a Safari Web Extension (listed under macOS apps)
5. MarkUp already declares `browser_specific_settings.safari.strict_min_version: "15.4"` in manifest.json

### Safari Notes

- The same `manifest.json`, `content.js`, `popup.html`, etc. are used
- Xcode wraps the extension in a minimal macOS app container
- Safari extensions are distributed through the Mac App Store, not a separate store
- Test in Safari before submitting: Enable Develop menu → Allow Unsigned Extensions
