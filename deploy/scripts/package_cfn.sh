#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${1:-}"
if [[ -z "$CONFIG_FILE" ]]; then
  echo "Usage: $0 <config_file>" >&2
  exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

: "${REGION:?Missing REGION}"
: "${STACK_NAME:?Missing STACK_NAME}"
: "${S3_BUCKET:?Missing S3_BUCKET}"
: "${S3_PREFIX:?Missing S3_PREFIX}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CFN_DIR="$ROOT_DIR/onpoint_nested_cfn"
TEMPLATES_DIR="$CFN_DIR/templates"
ROOT_TEMPLATE="$CFN_DIR/root.yaml"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$REGION")"
S3_PREFIX_FULL="$S3_PREFIX/$ACCOUNT_ID"

if [[ ! -d "$TEMPLATES_DIR" ]]; then
  echo "Templates directory not found: $TEMPLATES_DIR" >&2
  exit 1
fi

if [[ ! -f "$ROOT_TEMPLATE" ]]; then
  echo "Root template not found: $ROOT_TEMPLATE" >&2
  exit 1
fi

echo "Syncing nested templates to s3://$S3_BUCKET/$S3_PREFIX_FULL/templates"
aws s3 sync "$TEMPLATES_DIR" "s3://$S3_BUCKET/$S3_PREFIX_FULL/templates" \
  --region "$REGION" \
  --only-show-errors

PACKAGED_ROOT="$CFN_DIR/root.packaged.yaml"
cp "$ROOT_TEMPLATE" "$PACKAGED_ROOT"

# Rewrite TemplateURL for nested stacks to point at S3
python3 - <<'PY' "$PACKAGED_ROOT" "$S3_BUCKET" "$S3_PREFIX_FULL" "$REGION"
import re
import sys

path, bucket, prefix, region = sys.argv[1:5]
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

# Replace any TemplateURL ending with templates/<file>.yaml or .yml
pattern = re.compile(r"(TemplateURL:\s*)([^\s]+/templates/([^\s]+\.ya?ml))")

def repl(match):
    fname = match.group(3)
    url = f"https://{bucket}.s3.{region}.amazonaws.com/{prefix}/templates/{fname}"
    return f"{match.group(1)}{url}"

new_data, count = pattern.subn(repl, data)

with open(path, "w", encoding="utf-8") as f:
    f.write(new_data)

print(f"Updated TemplateURL entries: {count}")
PY

echo "Packaged root template: $PACKAGED_ROOT"
