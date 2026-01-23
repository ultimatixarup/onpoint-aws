#!/usr/bin/env bash
set -euo pipefail

# Build script for Lambda layers
# Creates deployable layer zips with correct structure: python/<module>/...

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAYERS_DIR="$ROOT_DIR/layers"
OUT_DIR="$ROOT_DIR/dist"
COMMON_SRC_DIR="$ROOT_DIR/common/python/onpoint_common"
COMMON_LAYER_DIR="$LAYERS_DIR/onpoint_common/python/onpoint_common"
mkdir -p "$OUT_DIR"

# Build onpoint_common layer
echo "Building onpoint-common layer..."
mkdir -p "$COMMON_LAYER_DIR"
rm -rf "$COMMON_LAYER_DIR"/*
cp -R "$COMMON_SRC_DIR"/* "$COMMON_LAYER_DIR"/
LAYER_ZIP="$OUT_DIR/onpoint_common_layer.zip"
rm -f "$LAYER_ZIP"

(
  cd "$LAYERS_DIR/onpoint_common"
  # Zip with correct structure: python/onpoint_common/...
  zip -r "$LAYER_ZIP" python > /dev/null
)

echo "✓ Created $LAYER_ZIP"

# Output all created layer zips
echo ""
echo "Layer artifacts ready:"
ls -lh "$OUT_DIR"/*.zip 2>/dev/null || echo "No layer zips found"
