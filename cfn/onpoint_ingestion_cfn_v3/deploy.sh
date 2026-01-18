#!/usr/bin/env bash
set -euo pipefail

REGION="${REGION:-us-east-1}"
STACK_NAME="${STACK_NAME:-onpoint-dev-v3}"
ARTIFACT_BUCKET="${ARTIFACT_BUCKET:?Set ARTIFACT_BUCKET to an existing S3 bucket name}"

echo "Region: $REGION"
echo "Stack:  $STACK_NAME"
echo "Bucket: $ARTIFACT_BUCKET"
echo

aws s3 cp "root.yaml" "s3://$ARTIFACT_BUCKET/root.yaml" --region "$REGION"
aws s3 cp "templates/" "s3://$ARTIFACT_BUCKET/templates/" --recursive --region "$REGION"

aws cloudformation deploy   --region "$REGION"   --stack-name "$STACK_NAME"   --template-file "root.yaml"   --capabilities CAPABILITY_NAMED_IAM   --parameter-overrides ArtifactBucket="$ARTIFACT_BUCKET"

echo
echo "Outputs:"
aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output table
