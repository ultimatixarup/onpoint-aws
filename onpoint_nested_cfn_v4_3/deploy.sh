#!/usr/bin/env bash
set -euo pipefail

: "${ARTIFACT_BUCKET:?Set ARTIFACT_BUCKET (S3 bucket for nested templates + lambda artifacts)}"

AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME=${STACK_NAME:-onpoint-dev-v4}
PROJECT_NAME=${PROJECT_NAME:-onpoint}
ENVIRONMENT=${ENVIRONMENT:-dev}

TEMPLATE_PREFIX=${TEMPLATE_PREFIX:-onpoint/cfn/v4}
LAMBDA_PREFIX=${LAMBDA_PREFIX:-onpoint/lambda/v4}
ARTIFACT_DIR=${ARTIFACT_DIR:-dist}

COMMON_LAYER_KEY=${COMMON_LAYER_KEY:-${LAMBDA_PREFIX}/layers/onpoint_common_layer.zip}
INGRESS_KEY=${INGRESS_KEY:-${LAMBDA_PREFIX}/onpoint-dev-ingress.zip}
PROCESSOR_KEY=${PROCESSOR_KEY:-${LAMBDA_PREFIX}/onpoint-dev-telematics-processor.zip}
PSL_ENRICHER_KEY=${PSL_ENRICHER_KEY:-${LAMBDA_PREFIX}/onpoint-psl-enricher.zip}
OVERSPEED_KEY=${OVERSPEED_KEY:-${LAMBDA_PREFIX}/onpoint-overspeed-detector.zip}
SUMMARY_BUILDER_KEY=${SUMMARY_BUILDER_KEY:-${LAMBDA_PREFIX}/onpoint-dev-trip-summary-builder.zip}
SUMMARY_API_KEY=${SUMMARY_API_KEY:-${LAMBDA_PREFIX}/onpoint-trip-summary-api.zip}

aws configure set region "$AWS_REGION" >/dev/null

# Ensure bucket exists
if ! aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" 2>/dev/null; then
  aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" --region "$AWS_REGION" \
    $( [[ "$AWS_REGION" != "us-east-1" ]] && echo "--create-bucket-configuration LocationConstraint=$AWS_REGION" ) >/dev/null
fi

# Upload nested templates
aws s3 sync templates "s3://${ARTIFACT_BUCKET}/${TEMPLATE_PREFIX}/templates" --delete

# Optionally upload artifacts if present
if [[ -d "$ARTIFACT_DIR" ]]; then
  for f in \
    onpoint_common_layer.zip \
    onpoint-dev-ingress.zip \
    onpoint-dev-telematics-processor.zip \
    onpoint-psl-enricher.zip \
    onpoint-overspeed-detector.zip \
    onpoint-dev-trip-summary-builder.zip \
    onpoint-trip-summary-api.zip; do
    if [[ -f "${ARTIFACT_DIR}/${f}" ]]; then
      case "$f" in
        onpoint_common_layer.zip) dest="$COMMON_LAYER_KEY";;
        onpoint-dev-ingress.zip) dest="$INGRESS_KEY";;
        onpoint-dev-telematics-processor.zip) dest="$PROCESSOR_KEY";;
        onpoint-psl-enricher.zip) dest="$PSL_ENRICHER_KEY";;
        onpoint-overspeed-detector.zip) dest="$OVERSPEED_KEY";;
        onpoint-dev-trip-summary-builder.zip) dest="$SUMMARY_BUILDER_KEY";;
        onpoint-trip-summary-api.zip) dest="$SUMMARY_API_KEY";;
      esac
      aws s3 cp "${ARTIFACT_DIR}/${f}" "s3://${ARTIFACT_BUCKET}/${dest}"
    fi
  done
fi

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file root.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName="$PROJECT_NAME" \
    Environment="$ENVIRONMENT" \
    ArtifactBucket="$ARTIFACT_BUCKET" \
    NestedTemplatePrefix="$TEMPLATE_PREFIX" \
    CommonPythonLayerS3Key="$COMMON_LAYER_KEY" \
    IngressLambdaS3Key="$INGRESS_KEY" \
    TelematicsProcessorLambdaS3Key="$PROCESSOR_KEY" \
    PslEnricherLambdaS3Key="$PSL_ENRICHER_KEY" \
    OverspeedDetectorLambdaS3Key="$OVERSPEED_KEY" \
    TripSummaryBuilderLambdaS3Key="$SUMMARY_BUILDER_KEY" \
    TripSummaryApiLambdaS3Key="$SUMMARY_API_KEY"

echo "Deployed stack: $STACK_NAME"
