#!/usr/bin/env bash
set -euo pipefail

# Publishes a new Lambda Layer version from dist/onpoint-common-layer.zip
# Usage:
#   ./scripts/publish_layer.sh <layer-name> [--region us-east-1]

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <layer-name> [--region us-east-1]" >&2
  exit 1
fi

LAYER_NAME="$1"
shift || true

REGION="${AWS_REGION:-us-east-1}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_FILE="$($ROOT_DIR/scripts/build_layer.sh)"

aws lambda publish-layer-version \
  --region "$REGION" \
  --layer-name "$LAYER_NAME" \
  --zip-file "fileb://$ZIP_FILE" \
  --compatible-runtimes python3.11 python3.12 \
  --output json
