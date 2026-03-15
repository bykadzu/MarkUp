# MarkUp by Myfrendo

Visuelles Annotations-Tool als Chrome-Extension. Zeichne, schreibe Notizen, setze nummerierte Pins auf jede Website und speichere das Ergebnis als PNG.

## Installation

1. Oeffne Chrome und navigiere zu `chrome://extensions/`
2. Aktiviere oben rechts den **Entwicklermodus** (Developer mode)
3. Klicke auf **Entpackte Erweiterung laden** (Load unpacked)
4. Waehle den Ordner `C:\Users\gentl\Documents\MarkUp\`
5. Die Extension erscheint in der Toolbar — fertig

## Verwendung

1. Oeffne eine beliebige Website
2. Klicke auf das MarkUp-Icon in der Chrome-Toolbar
3. Klicke **Annotieren** im Popup
4. Die Toolbar erscheint oben auf der Seite — nutze die Werkzeuge:

| Werkzeug | Beschreibung |
|----------|-------------|
| Stift | Freihand zeichnen (Maus/Touch) |
| Pfeil | Klicke Start- und Endpunkt |
| Rechteck | Ziehe ein Rechteck auf |
| Text | Klicke und tippe eine Notiz (mit Nummer) |
| Pin | Setze nummerierte Markierungen (1, 2, 3...) |
| Radierer | Klicke auf eine Annotation zum Loeschen |
| Rueckgaengig | Letzte Aktion rueckgaengig (auch Ctrl+Z) |
| Papierkorb | Alles loeschen |

### Speichern und Exportieren

- **Download-Pfeil (gruen):** Speichert PNG-Screenshot mit Annotationen. Zeigt den Dateipfad als Toast-Benachrichtigung.
- **Kopieren:** Kopiert den annotierten Screenshot in die Zwischenablage.
- **Notizen-Export:** Exportiert alle Textnotizen und Pins als Markdown-Datei.

### Weitere Funktionen

- **Farbwahl:** Rot, Blau, Gruen, Gelb, Weiss
- **Linienstaerke:** Einstellbar von 2px bis 8px
- **Toolbar verschieben:** Am Griff-Icon (links) ziehen
- **Beenden:** ESC-Taste oder X-Button

## Dateien

```
MarkUp/
  manifest.json        Manifest V3 Konfiguration
  popup.html/css/js     Popup beim Klick auf Extension-Icon
  content.js            Annotations-Engine (Canvas + SVG + HTML)
  capture.js            Screenshot-Erfassung und Export
  styles.css            Overlay- und Toolbar-Styles
  lib/html2canvas.min.js  Bundled html2canvas Bibliothek
  icons/                Extension-Icons (16/48/128px)
```

## Technische Details

- **Manifest V3** — keine Background-Page, nutzt chrome.scripting API
- **html2canvas** lokal gebundled — keine CDN-Abhaengigkeit, funktioniert offline
- Freehand-Zeichnung auf einem `<canvas>` Element
- Pfeile und Rechtecke als SVG-Elemente
- Textnotizen und Pins als HTML-Elemente
- Alle drei Layer werden beim Screenshot zusammengefuehrt
- Unterstuetzt Maus und Touch
