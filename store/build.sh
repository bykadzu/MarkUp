#!/bin/bash
# Build script: packages MarkUp extension into a versioned ZIP for Chrome Web Store.
# Usage: bash store/build.sh
# Output: store/markup-extension-v{version}.zip

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Read version from manifest.json
VERSION=$(grep '"version"' "$ROOT_DIR/manifest.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
if [ -z "$VERSION" ]; then
  echo "ERROR: Could not read version from manifest.json"
  exit 1
fi

OUT="$SCRIPT_DIR/markup-extension-v${VERSION}.zip"

# Remove old zip if present
rm -f "$OUT"

cd "$ROOT_DIR"

# Extension files to include
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
  zip -r "$OUT" "${FILES[@]}"
else
  # Windows fallback using PowerShell
  WIN_OUT=$(cygpath -w "$OUT" 2>/dev/null || echo "$OUT")
  WIN_DIR=$(cygpath -w "$ROOT_DIR" 2>/dev/null || echo "$ROOT_DIR")
  powershell.exe -NoProfile -Command "
    \$src = '${WIN_DIR}'
    \$files = @($(printf "'%s'," "${FILES[@]}" | sed 's/,$//'))
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
ls -lh "$OUT" 2>/dev/null || powershell.exe -NoProfile -Command "Get-Item '$(cygpath -w "$OUT" 2>/dev/null || echo "$OUT")' | Select-Object Name, Length"
echo ""
echo "Upload at: https://chrome.google.com/webstore/devconsole"
