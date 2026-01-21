#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <bucket> [--region us-east-1] [--stack-name onpoint-dev] [--env dev] [--project-name onpoint] [--prefix cfn]" >&2
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

BUCKET="$1"
shift

REGION="us-east-1"
STACK_NAME="onpoint-dev"
ENV="dev"
PROJECT_NAME="onpoint"
PREFIX="cfn"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"; shift 2;;
    --stack-name)
      STACK_NAME="$2"; shift 2;;
    --env)
      ENV="$2"; shift 2;;
    --project-name)
      PROJECT_NAME="$2"; shift 2;;
    --prefix)
      PREFIX="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/cfn/root.yaml"

AWS_PAGER="" aws s3 sync "$ROOT_DIR/cfn" "s3://${BUCKET}/${PREFIX}" --region "$REGION"

AWS_PAGER="" aws cloudformation validate-template \
  --region "$REGION" \
  --template-body "file://$TEMPLATE_FILE" \
  --output json > /dev/null

for f in "$ROOT_DIR"/cfn/nested/*.yaml; do
  AWS_PAGER="" aws cloudformation validate-template \
    --region "$REGION" \
    --template-body "file://$f" \
    --output json > /dev/null
  done

PARAMS=(
  "ParameterKey=Env,ParameterValue=${ENV}"
  "ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME}"
  "ParameterKey=TemplateBucket,ParameterValue=${BUCKET}"
  "ParameterKey=TemplatePrefix,ParameterValue=${PREFIX}"
)

if AWS_PAGER="" aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" >/dev/null 2>&1; then
  set +e
  UPDATE_OUT=$(AWS_PAGER="" aws cloudformation update-stack \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE_FILE" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --parameters "${PARAMS[@]}" 2>&1)
  UPDATE_CODE=$?
  set -e

  if [[ $UPDATE_CODE -ne 0 ]]; then
    if echo "$UPDATE_OUT" | grep -q "No updates are to be performed"; then
      echo "No updates are to be performed."
      AWS_PAGER="" aws cloudformation describe-stacks \
        --region "$REGION" \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs" \
        --output table
      exit 0
    fi
    echo "$UPDATE_OUT" >&2
    AWS_PAGER="" aws cloudformation describe-stack-events \
      --region "$REGION" \
      --stack-name "$STACK_NAME" \
      --max-items 30 \
      --output table
    exit 1
  fi

  set +e
  AWS_PAGER="" aws cloudformation wait stack-update-complete --region "$REGION" --stack-name "$STACK_NAME"
  WAIT_CODE=$?
  set -e
  if [[ $WAIT_CODE -ne 0 ]]; then
    AWS_PAGER="" aws cloudformation describe-stack-events \
      --region "$REGION" \
      --stack-name "$STACK_NAME" \
      --max-items 30 \
      --output table
    exit 1
  fi
else
  AWS_PAGER="" aws cloudformation create-stack \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE_FILE" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --parameters "${PARAMS[@]}"
  set +e
  AWS_PAGER="" aws cloudformation wait stack-create-complete --region "$REGION" --stack-name "$STACK_NAME"
  WAIT_CODE=$?
  set -e
  if [[ $WAIT_CODE -ne 0 ]]; then
    AWS_PAGER="" aws cloudformation describe-stack-events \
      --region "$REGION" \
      --stack-name "$STACK_NAME" \
      --max-items 30 \
      --output table
    exit 1
  fi
fi

AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table
