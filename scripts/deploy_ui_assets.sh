#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <ui-bucket> <cloudfront-distribution-id> [--ui-dir ui] [--config-file path/to/config.json] [--vite-mode production]" >&2
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
VITE_MODE="production"
TMP_DIR="$ROOT_DIR/tmp"
mkdir -p "$TMP_DIR"

declare -a TMP_LOGS=()

cleanup_temp_logs() {
  for log_file in "${TMP_LOGS[@]:-}"; do
    [[ -f "$log_file" ]] && rm -f "$log_file"
  done
}

trap cleanup_temp_logs EXIT

run_logged() {
  local label="$1"
  shift
  local log_file
  log_file="$(mktemp "$TMP_DIR/${label}.XXXXXX.log")"
  TMP_LOGS+=("$log_file")

  if "$@" >"$log_file" 2>&1; then
    cat "$log_file"
    return 0
  fi

  cat "$log_file" >&2
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ui-dir)
      UI_DIR="$2"; shift 2;;
    --config-file)
      CONFIG_FILE="$2"; shift 2;;
    --vite-mode)
      VITE_MODE="$2"; shift 2;;
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
run_logged npm_install npm install
run_logged npm_build npm run build -- --mode "$VITE_MODE"
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
  run_logged s3_sync_assets env AWS_PAGER="" aws s3 sync "$DIST_DIR/assets" "s3://${UI_BUCKET}/assets" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    ${AWS_ARGS[@]+"${AWS_ARGS[@]}"}
fi

# Upload other files (index.html, favicon, etc) with no-cache
run_logged s3_sync_root env AWS_PAGER="" aws s3 sync "$DIST_DIR" "s3://${UI_BUCKET}" \
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
  run_logged s3_cp_config env AWS_PAGER="" aws s3 cp "$CONFIG_FILE" "s3://${UI_BUCKET}/config.json" \
    --cache-control "no-store, max-age=0, must-revalidate" \
    --content-type "application/json" \
    ${AWS_ARGS[@]+"${AWS_ARGS[@]}"}
fi

run_logged cf_invalidate env AWS_PAGER="" aws cloudfront create-invalidation \
  --distribution-id "$UI_DISTRIBUTION_ID" \
  --paths "/index.html" "/config.json" \
  ${AWS_ARGS[@]+"${AWS_ARGS[@]}"}

echo "UI assets deployed to s3://${UI_BUCKET}"
