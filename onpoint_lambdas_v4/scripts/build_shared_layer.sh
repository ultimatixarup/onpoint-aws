#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAYER_SRC="$ROOT_DIR/shared"
OUT_DIR="$ROOT_DIR/dist"
mkdir -p "$OUT_DIR"

LAYER_ZIP="$OUT_DIR/onpoint-shared-layer.zip"
rm -f "$LAYER_ZIP"

(
  cd "$LAYER_SRC"
  zip -r "$LAYER_ZIP" python > /dev/null
)

echo "$LAYER_ZIP"
