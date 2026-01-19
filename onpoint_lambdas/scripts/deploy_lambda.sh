#!/usr/bin/env bash
set -euo pipefail

# Deploys ONE lambda + (optionally) updates env vars from env/dev/<function_name>.json or custom file.
# Assumes the Lambda already exists.

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <lambda_folder_name> <lambda_function_name> [--region us-east-1] [--layer-arn arn:...:layer:...:1] [--env-file path.json]" >&2
  exit 1
fi

LAMBDA_FOLDER="$1"
FUNCTION_NAME="$2"
shift 2

REGION="${AWS_REGION:-us-east-1}"
LAYER_ARN=""
ENV_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"; shift 2;;
    --layer-arn)
      LAYER_ARN="$2"; shift 2;;
    --env-file)
      ENV_FILE="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_FILE="$($ROOT_DIR/scripts/build_lambda.sh "$LAMBDA_FOLDER")"

echo "Updating function code for $FUNCTION_NAME ($ZIP_FILE)"
aws lambda update-function-code \
  --region "$REGION" \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$ZIP_FILE" \
  --output json > /dev/null

echo "Code updated."

# Update layer if requested
if [[ -n "$LAYER_ARN" ]]; then
  echo "Updating layers for $FUNCTION_NAME -> $LAYER_ARN"
  aws lambda update-function-configuration \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --layers "$LAYER_ARN" \
    --output json > /dev/null
fi

# Update env vars if env file provided or default exists
if [[ -z "$ENV_FILE" ]]; then
  if [[ -f "$ROOT_DIR/env/dev/$FUNCTION_NAME.json" ]]; then
    ENV_FILE="$ROOT_DIR/env/dev/$FUNCTION_NAME.json"
  elif [[ -f "$ROOT_DIR/lambdas/$LAMBDA_FOLDER/env/dev.json" ]]; then
    ENV_FILE="$ROOT_DIR/lambdas/$LAMBDA_FOLDER/env/dev.json"
  fi
fi

if [[ -n "$ENV_FILE" ]]; then
  python3 - <<'PY' "$ENV_FILE"
import json
import sys

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

if not isinstance(data, dict) or not isinstance(data.get("Variables"), dict):
    raise SystemExit(f"Invalid env file format: {path} (expected top-level Variables object)")
PY
  echo "Updating environment for $FUNCTION_NAME from $ENV_FILE"
  aws lambda update-function-configuration \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --environment "file://$ENV_FILE" \
    --output json > /dev/null
fi

echo "Done: $FUNCTION_NAME"
