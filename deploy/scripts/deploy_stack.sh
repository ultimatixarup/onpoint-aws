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
ROOT_TEMPLATE_PACKAGED="$CFN_DIR/root.packaged.yaml"

if [[ ! -f "$ROOT_TEMPLATE_PACKAGED" ]]; then
  echo "Packaged root template not found: $ROOT_TEMPLATE_PACKAGED" >&2
  echo "Run package_cfn.sh first." >&2
  exit 1
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text --region "$REGION")"

echo "Validating root template"
aws cloudformation validate-template \
  --region "$REGION" \
  --template-body "file://$ROOT_TEMPLATE_PACKAGED" \
  --output json > /dev/null

echo "Deploying stack: $STACK_NAME (Account: $ACCOUNT_ID)"
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$ROOT_TEMPLATE_PACKAGED" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

echo "Root stack outputs:"
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

echo "Nested stack outputs:"
# List nested stacks
NESTED_STACKS=$(aws cloudformation list-stack-resources \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "StackResourceSummaries[?ResourceType=='AWS::CloudFormation::Stack'].PhysicalResourceId" \
  --output text)

if [[ -n "$NESTED_STACKS" ]]; then
  for ns in $NESTED_STACKS; do
    echo "--- $ns"
    aws cloudformation describe-stacks \
      --region "$REGION" \
      --stack-name "$ns" \
      --query "Stacks[0].Outputs" \
      --output table
  done
else
  echo "(No nested stacks found)"
fi
