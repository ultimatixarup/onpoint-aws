#!/usr/bin/env bash
set -euo pipefail

# Deploys ONE lambda + (optionally) updates env vars from env/dev/<name>.json.
# Assumes:
#  - the Lambda already exists
#  - you are using Zip packaging
#  - you attach the shared layer separately (or pass --layer-arn)

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <lambda_folder_name> <lambda_function_name> [--region us-east-1] [--layer-arn arn:...:layer:...:1] [--env-file ...]" >&2
  exit 1
fi

LAMBDA_FOLDER="$1"     # e.g. ingress
FUNCTION_NAME="$2"     # e.g. onpoint-dev-ingress
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
PKG_SCRIPT="$ROOT_DIR/scripts/package_lambda.sh"
ZIP_FILE="$($PKG_SCRIPT "$LAMBDA_FOLDER")"

echo "Updating function code for $FUNCTION_NAME ($ZIP_FILE)"
aws lambda update-function-code \
  --region "$REGION" \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$ZIP_FILE" \
  >/dev/null

echo "Code update submitted."

# Update env vars if provided (expects {"Variables":{...}})
if [[ -n "$ENV_FILE" ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required to parse env JSON. Install jq or omit --env-file" >&2
    exit 3
  fi
  VARS_JSON="$(cat "$ENV_FILE" | jq -c '.Variables')"
  echo "Updating environment variables from $ENV_FILE"
  aws lambda update-function-configuration \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --environment "Variables=$VARS_JSON" \
    >/dev/null
fi

# Update layers if requested
if [[ -n "$LAYER_ARN" ]]; then
  echo "Attaching layer $LAYER_ARN"
  aws lambda update-function-configuration \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --layers "$LAYER_ARN" \
    >/dev/null
fi

echo "Done: $FUNCTION_NAME"
