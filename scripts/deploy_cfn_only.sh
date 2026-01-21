#!/usr/bin/env bash
set -euo pipefail
set -x

# Deploy instructions:
#   ARTIFACT_BUCKET=onpoint-dev-cfn-artifacts
#   ./scripts/deploy_cfn_only.sh onpoint-dev-cfn-artifacts

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <ARTIFACT_BUCKET>" >&2
  exit 1
fi

ARTIFACT_BUCKET="$1"
REGION="us-east-1"
STACK_NAME="onpoint-dev"
TEMPLATE_FILE="cfn/root.yaml"

# Validate bucket exists
aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" --region "$REGION" >/dev/null 2>&1 || {
  echo "S3 bucket not found or not accessible: $ARTIFACT_BUCKET" >&2
  exit 1
}

# Sync templates
aws s3 sync cfn "s3://${ARTIFACT_BUCKET}/cfn" --region "$REGION"

aws cloudformation update-stack \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-body "file://$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --parameters \
    ParameterKey=Env,ParameterValue=dev \
    ParameterKey=ProjectName,ParameterValue=onpoint \
    ParameterKey=TemplateBucket,ParameterValue="$ARTIFACT_BUCKET" \
    ParameterKey=TemplatePrefix,ParameterValue=cfn || {
      echo "No updates to perform."
      aws cloudformation describe-stacks \
        --region "$REGION" \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs" \
        --output table
      exit 0
    }

aws cloudformation wait stack-update-complete --region "$REGION" --stack-name "$STACK_NAME"

aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table
