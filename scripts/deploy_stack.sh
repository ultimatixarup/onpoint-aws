#!/usr/bin/env bash
set -euo pipefail
set -x

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <ARTIFACT_BUCKET>" >&2
  exit 1
fi

ARTIFACT_BUCKET="$1"
REGION="us-east-1"
STACK_NAME="onpoint-dev"
TEMPLATE_FILE="cfn/root.yaml"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAMBDA_BUILD_SCRIPT="$ROOT_DIR/onpoint_lambdas/scripts/build_lambda.sh"

# Validate bucket exists
aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" --region "$REGION" >/dev/null 2>&1 || {
  echo "S3 bucket not found or not accessible: $ARTIFACT_BUCKET" >&2
  exit 1
}

# Upload templates
aws s3 sync cfn "s3://${ARTIFACT_BUCKET}/cfn" --region "$REGION"

# Build and upload lambda packages
LAMBDA_OUT_DIR="$ROOT_DIR/onpoint_lambdas/dist"
mkdir -p "$LAMBDA_OUT_DIR"

ingress_zip=$($LAMBDA_BUILD_SCRIPT ingress)
telematics_zip=$($LAMBDA_BUILD_SCRIPT telematics_processor)
psl_enricher_zip=$($LAMBDA_BUILD_SCRIPT psl_enricher)
overspeed_zip=$($LAMBDA_BUILD_SCRIPT overspeed_detector)
trip_summary_builder_zip=$($LAMBDA_BUILD_SCRIPT trip_summary_builder)
trip_summary_api_zip=$($LAMBDA_BUILD_SCRIPT trip_summary_api)

aws s3 cp "$ingress_zip" "s3://${ARTIFACT_BUCKET}/lambda/ingress.zip" --region "$REGION"
aws s3 cp "$telematics_zip" "s3://${ARTIFACT_BUCKET}/lambda/telematics_processor.zip" --region "$REGION"
aws s3 cp "$psl_enricher_zip" "s3://${ARTIFACT_BUCKET}/lambda/psl_enricher.zip" --region "$REGION"
aws s3 cp "$overspeed_zip" "s3://${ARTIFACT_BUCKET}/lambda/overspeed_detector.zip" --region "$REGION"
aws s3 cp "$trip_summary_builder_zip" "s3://${ARTIFACT_BUCKET}/lambda/trip_summary_builder.zip" --region "$REGION"
aws s3 cp "$trip_summary_api_zip" "s3://${ARTIFACT_BUCKET}/lambda/trip_summary_api.zip" --region "$REGION"

PARAMS=(
  "ParameterKey=Env,ParameterValue=dev"
  "ParameterKey=ProjectName,ParameterValue=onpoint"
  "ParameterKey=TemplateBucket,ParameterValue=${ARTIFACT_BUCKET}"
  "ParameterKey=TemplatePrefix,ParameterValue=cfn"
  "ParameterKey=IngressCodeS3Key,ParameterValue=lambda/ingress.zip"
  "ParameterKey=TelematicsProcessorCodeS3Key,ParameterValue=lambda/telematics_processor.zip"
  "ParameterKey=PslEnricherCodeS3Key,ParameterValue=lambda/psl_enricher.zip"
  "ParameterKey=OverspeedDetectorCodeS3Key,ParameterValue=lambda/overspeed_detector.zip"
  "ParameterKey=TripSummaryBuilderCodeS3Key,ParameterValue=lambda/trip_summary_builder.zip"
  "ParameterKey=TripSummaryApiCodeS3Key,ParameterValue=lambda/trip_summary_api.zip"
)

if aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" >/dev/null 2>&1; then
  aws cloudformation update-stack \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE_FILE" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --parameters "${PARAMS[@]}" || {
      echo "No updates to perform."
      aws cloudformation describe-stacks \
        --region "$REGION" \
        --stack-name "$STACK_NAME" \
        --query "Stacks[0].Outputs" \
        --output table
      echo "CloudFormation deployment completed successfully"
      exit 0
    }
  aws cloudformation wait stack-update-complete --region "$REGION" --stack-name "$STACK_NAME"
else
  aws cloudformation create-stack \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE_FILE" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --parameters "${PARAMS[@]}"
  aws cloudformation wait stack-create-complete --region "$REGION" --stack-name "$STACK_NAME"
fi

aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

echo "CloudFormation deployment completed successfully"
