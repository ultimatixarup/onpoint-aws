#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <ui-bucket> <cloudfront-distribution-id> [--ui-dir ui] [--config-file path/to/config.json]" >&2
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

UI_BUCKET="$1"
UI_DISTRIBUTION_ID="$2"
shift 2

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="ui"
CONFIG_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ui-dir)
      UI_DIR="$2"; shift 2;;
    --config-file)
      CONFIG_FILE="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

if [[ "$UI_DIR" == "ui" && ! -d "$ROOT_DIR/$UI_DIR" && -d "$ROOT_DIR/src-ui" ]]; then
  UI_DIR="src-ui"
fi

if [[ ! -d "$ROOT_DIR/$UI_DIR" ]]; then
  echo "UI directory not found: $ROOT_DIR/$UI_DIR" >&2
  exit 1
fi

if [[ -z "$CONFIG_FILE" ]]; then
  if [[ -f "$ROOT_DIR/$UI_DIR/config/config.json" ]]; then
    CONFIG_FILE="$ROOT_DIR/$UI_DIR/config/config.json"
  elif [[ -f "$ROOT_DIR/$UI_DIR/public/config.json" ]]; then
    CONFIG_FILE="$ROOT_DIR/$UI_DIR/public/config.json"
  fi
fi

DIST_DIR="$ROOT_DIR/$UI_DIR/dist"

pushd "$ROOT_DIR/$UI_DIR" >/dev/null
npm install
npm run build
popd >/dev/null

if [[ ! -d "$DIST_DIR" ]]; then
  echo "Build output not found: $DIST_DIR" >&2
  exit 1
fi

declare -a AWS_ARGS=()
if [[ -n "${AWS_REGION:-}" ]]; then
  AWS_ARGS+=("--region" "$AWS_REGION")
fi

# Upload immutable hashed assets
if [[ -d "$DIST_DIR/assets" ]]; then
  AWS_PAGER="" aws s3 sync "$DIST_DIR/assets" "s3://${UI_BUCKET}/assets" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    ${AWS_ARGS[@]+"${AWS_ARGS[@]}"}
fi

# Upload other files (index.html, favicon, etc) with no-cache
AWS_PAGER="" aws s3 sync "$DIST_DIR" "s3://${UI_BUCKET}" \
  --delete \
  --exclude "assets/*" \
  --cache-control "no-store, max-age=0, must-revalidate" \
  ${AWS_ARGS[@]+"${AWS_ARGS[@]}"}

# Upload runtime config.json with no-cache
if [[ -n "$CONFIG_FILE" ]]; then
  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Config file not found: $CONFIG_FILE" >&2
    exit 1
  fi
  AWS_PAGER="" aws s3 cp "$CONFIG_FILE" "s3://${UI_BUCKET}/config.json" \
    --cache-control "no-store, max-age=0, must-revalidate" \
    --content-type "application/json" \
    ${AWS_ARGS[@]+"${AWS_ARGS[@]}"}
fi

AWS_PAGER="" aws cloudfront create-invalidation \
  --distribution-id "$UI_DISTRIBUTION_ID" \
  --paths "/index.html" "/config.json" \
  ${AWS_ARGS[@]+"${AWS_ARGS[@]}"}

echo "UI assets deployed to s3://${UI_BUCKET}"
