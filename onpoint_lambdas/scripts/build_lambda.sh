#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <lambda_folder_name>" >&2
  echo "Example: $0 ingress" >&2
  exit 1
fi

LAMBDA_FOLDER="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/lambdas/$LAMBDA_FOLDER"
OUT_DIR="$ROOT_DIR/dist"
mkdir -p "$OUT_DIR"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Lambda source dir not found: $SRC_DIR" >&2
  exit 1
fi

ZIP_PATH="$OUT_DIR/${LAMBDA_FOLDER}.zip"
rm -f "$ZIP_PATH"
(
  cd "$SRC_DIR"
  # Package only lambda folder (common code comes from Layer)
  zip -r "$ZIP_PATH" . > /dev/null
)

echo "$ZIP_PATH"
