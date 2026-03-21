#!/bin/bash
# Build script: packages MarkUp extension into a ZIP for Chrome Web Store upload.
# Works on Windows (PowerShell) and Unix (zip).
# Usage: bash build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$SCRIPT_DIR/store/markup-extension.zip"

# Remove old zip if present
rm -f "$OUT"

cd "$SCRIPT_DIR"

FILES=(
  manifest.json
  popup.html
  popup.css
  popup.js
  content.js
  capture.js
  styles.css
  icons/
  lib/
)

if command -v zip &>/dev/null; then
  zip -r "$OUT" "${FILES[@]}" -x "*.git*"
else
  # Windows fallback using PowerShell
  WIN_OUT=$(cygpath -w "$OUT" 2>/dev/null || echo "$OUT")
  WIN_DIR=$(cygpath -w "$SCRIPT_DIR" 2>/dev/null || echo "$SCRIPT_DIR")
  powershell.exe -NoProfile -Command "
    \$src = '${WIN_DIR}'
    \$files = @($(printf "'%s'," "${FILES[@]}" | sed 's/,$//' ))
    \$tmp = Join-Path \$env:TEMP 'markup-build'
    if (Test-Path \$tmp) { Remove-Item \$tmp -Recurse -Force }
    New-Item -ItemType Directory -Path \$tmp | Out-Null
    foreach (\$f in \$files) {
      \$srcPath = Join-Path \$src \$f
      \$destPath = Join-Path \$tmp \$f
      if (Test-Path \$srcPath -PathType Container) {
        Copy-Item \$srcPath \$destPath -Recurse
      } else {
        \$destDir = Split-Path \$destPath -Parent
        if (!(Test-Path \$destDir)) { New-Item -ItemType Directory -Path \$destDir | Out-Null }
        Copy-Item \$srcPath \$destPath
      }
    }
    Compress-Archive -Path (Join-Path \$tmp '*') -DestinationPath '${WIN_OUT}' -Force
    Remove-Item \$tmp -Recurse -Force
    Write-Host 'ZIP created successfully'
  "
fi

echo ""
echo "Created: $OUT"
ls -lh "$OUT" 2>/dev/null || true
echo ""
echo "Upload this file at: https://chrome.google.com/webstore/devconsole"
