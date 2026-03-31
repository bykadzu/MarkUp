# Datenschutzerklarung -- MarkUp

**Letzte Aktualisierung:** 28. Marz 2026

---

## Zusammenfassung

MarkUp erhebt, speichert oder verarbeitet keine personenbezogenen Daten. Alle Annotationen und Screenshots werden lokal im Browser verarbeitet. Nur wenn Sie die Funktion "Upload & Share" ausdrucklich aktivieren, wird der Screenshot an den Drittanbieter-Dienst Catbox.moe ubertragen.

## Datenerhebung

MarkUp erhebt **keine personenbezogenen Daten**:

- **Keine personlichen Informationen** -- kein Name, keine E-Mail, kein Benutzerkonto
- **Kein Browserverlauf** -- keine besuchten Seiten, keine URLs
- **Keine Analyse oder Telemetrie** -- es wird nichts getrackt oder gemessen
- **Keine Cookies** -- die Erweiterung setzt keine Cookies
- **Kein Nutzerverhalten-Monitoring** -- keine Klicks, Sitzungen oder Nutzungsmuster

## Funktionsweise

### Lokale Verarbeitung (Standard)

- Alle Annotationen (Zeichnungen, Pfeile, Textnotizen, Pins, Hervorhebungen, Weichzeichner-Bereiche) existieren **ausschliesslich im Arbeitsspeicher des Browsers** wahrend der aktiven Sitzung
- Wenn Sie MarkUp schliessen oder die Seite verlassen, werden alle Annotationen verworfen
- Screenshots werden lokal mit der Canvas-API des Browsers zusammengesetzt
- Exportierte PNG-Dateien werden uber die Standard-Download-API des Browsers in Ihren **lokalen Download-Ordner** gespeichert

### Upload-Funktion (nur bei ausdrucklicher Aktivierung)

Wenn Sie die Funktion **"Upload & Share"** aktivieren, geschieht Folgendes:

1. Der erstellte Screenshot wird direkt vom Browser an **Litterbox (catbox.moe)** ubertragen -- einen offentlichen Datei-Hosting-Dienst
2. Catbox.moe gibt einen offentlichen Link zuruck, der in Ihre Zwischenablage kopiert wird
3. **Jede Person mit diesem Link kann den Screenshot einsehen**
4. Litterbox-Uploads sind standardmassig temporar (24 Stunden), aber Myfrendo ubernimmt keine Garantie fur die tatsachliche Loschung

**Wichtig:** Dieser Upload erfolgt direkt vom Browser an Catbox.moe. Die Daten werden nicht uber Myfrendo-Server geleitet. Es werden keine zusatzlichen Metadaten (IP-Adresse, Benutzerdaten, Browserverlauf) von der Erweiterung an Catbox ubermittelt.

## Drittanbieter-Dienste

### Catbox.moe / Litterbox

Catbox.moe wird ausschliesslich fur die optionale Upload-Funktion verwendet. Es gelten:

- Myfrendo betreibt Catbox.moe nicht und hat keinen Einfluss auf dessen Datenverarbeitung, Speicherdauer oder Loschrichtlinien
- Die Datenschutzbestimmungen und Nutzungsbedingungen von Catbox.moe gelten zusatzlich
- Myfrendo kann hochgeladene Dateien nicht von Catbox.moe entfernen

Abgesehen von Catbox.moe verwendet MarkUp **keine** weiteren Drittanbieter-Dienste -- keine Analyse-Tools, kein Crash-Reporting, keine Werbenetzwerke, keine externen APIs.

## Berechtigungen

MarkUp benotigt nur zwei Browser-Berechtigungen:

| Berechtigung | Zweck |
|-------------|-------|
| `activeTab` | Injiziert die Annotations-Oberflache in den aktuellen Tab, wenn Sie auf das Erweiterungssymbol klicken. Wird nur auf dem explizit gewahlten Tab aktiviert. |
| `scripting` | Injiziert die Annotations-Engine (content.js, capture.js, styles.css) in den aktiven Tab. Erforderlich fur Manifest V3. |

MarkUp fordert **keine** Berechtigungen fur: Browserverlauf, Zugriff auf alle Webseiten, Hintergrundausfuhrung, Netzwerkzugriff, Speicher-Synchronisierung oder Identitats-/Kontoinformationen.

## Datenspeicherung

MarkUp speichert **nichts dauerhaft**. Kein localStorage, kein IndexedDB, kein Sync Storage, keine Cookies. Jede Sitzung ist ephemer.

## Kontovoraussetzungen

Kein Konto erforderlich. Kein Login, keine Registrierung, keine E-Mail-Adresse. Installieren und sofort nutzen.

## Open Source

Der vollstandige Quellcode ist verfugbar unter: https://github.com/bykadzu/MarkUp

## Datenschutz von Kindern

MarkUp erhebt keine Daten von Personen jeglichen Alters, einschliesslich Kindern unter 13 Jahren.

## Anderungen dieser Datenschutzerklarung

Aktualisierungen werden durch Anderung des Datums "Letzte Aktualisierung" angezeigt und unter derselben URL veroffentlicht.

## Kontakt

Bei Fragen zu dieser Datenschutzerklarung:
- **E-Mail:** contact@myfrendo.com
- **GitHub:** https://github.com/bykadzu/MarkUp/issues

---
---

# Privacy Policy -- MarkUp

**Last updated:** March 28, 2026

---

## Summary

MarkUp does not collect, store, or process any personal data. All annotations and screenshots are processed locally in the browser. Only when you explicitly activate the "Upload & Share" function is the screenshot transmitted to the third-party service Catbox.moe.

## Data Collection

MarkUp collects **no personal data**:

- **No personal information** -- no name, email, or account info
- **No browsing history** -- no pages visited, no URLs logged
- **No analytics or telemetry** -- nothing is tracked or measured
- **No cookies** -- the extension sets none
- **No user behavior monitoring** -- no clicks, sessions, or usage patterns

## How It Works

### Local Processing (Default)

- All annotations (drawings, arrows, text notes, pins, highlights, blur regions) exist **entirely in your browser's memory** during the active session
- When you close MarkUp or navigate away, all annotations are discarded
- Screenshots are composited locally using the browser's native Canvas API
- Exported PNG files are saved to your **local Downloads folder** via the browser's standard download API

### Upload Function (Only When Explicitly Activated)

When you activate the **"Upload & Share"** function, the following occurs:

1. The generated screenshot is transmitted directly from your browser to **Litterbox (catbox.moe)** -- a public file hosting service
2. Catbox.moe returns a public link, which is copied to your clipboard
3. **Anyone with this link can view the screenshot**
4. Litterbox uploads are temporary by default (24 hours), but Myfrendo does not guarantee actual deletion

**Important:** This upload occurs directly from your browser to Catbox.moe. Data is not routed through Myfrendo servers. No additional metadata (IP address, user data, browsing history) is transmitted by the extension to Catbox.

## Third-Party Services

### Catbox.moe / Litterbox

Catbox.moe is used exclusively for the optional upload function. The following applies:

- Myfrendo does not operate Catbox.moe and has no control over its data processing, retention periods, or deletion policies
- The privacy policy and terms of service of Catbox.moe apply additionally
- Myfrendo cannot remove uploaded files from Catbox.moe

Apart from Catbox.moe, MarkUp uses **no** other third-party services -- no analytics providers, no crash reporting, no advertising networks, no external APIs.

## Permissions

MarkUp requests only two browser permissions:

| Permission | Purpose |
|-----------|---------|
| `activeTab` | Injects the annotation overlay onto the current tab when you click the extension icon. Only activates on the tab you explicitly choose. |
| `scripting` | Injects the annotation engine (content.js, capture.js, styles.css) into the active tab. Required by Manifest V3. |

MarkUp does **not** request permissions for: browsing history, all website data, background execution, network access, storage sync, or identity/account info.

## Data Storage

MarkUp stores **nothing persistently**. No localStorage, no IndexedDB, no sync storage, no cookies. Each session is ephemeral.

## Account Requirements

No account required. No login, no registration, no email address. Install and use immediately.

## Open Source

The complete source code is available at: https://github.com/bykadzu/MarkUp

## Children's Privacy

MarkUp does not collect data from anyone of any age, including children under 13.

## Changes to This Policy

Updates will be reflected in the "Last updated" date above and published to the same URL.

## Contact

For questions about this privacy policy:
- **Email:** contact@myfrendo.com
- **GitHub:** https://github.com/bykadzu/MarkUp/issues
