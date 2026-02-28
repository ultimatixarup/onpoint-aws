#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${1:-$ROOT_DIR/deploy/config/test.env}"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

: "${REGION:?Missing REGION}"
: "${STACK_NAME:?Missing STACK_NAME}"
: "${S3_BUCKET:?Missing S3_BUCKET}"

PROJECT_NAME="${PROJECT_NAME:-onpoint}"
ENV_NAME="${ENV_NAME:-test}"
PREFIX="${PREFIX:-cfn}"

"$ROOT_DIR/scripts/safe_redeploy.sh" "$S3_BUCKET" \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --env "$ENV_NAME" \
  --project-name "$PROJECT_NAME" \
  --prefix "$PREFIX"

echo "Test environment deployment completed for stack: $STACK_NAME"
