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
TEMPLATE_VERSION="v1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAMBDA_BUILD_SCRIPT="$ROOT_DIR/onpoint_lambdas/scripts/build_lambda.sh"
LAYER_BUILD_SCRIPT="$ROOT_DIR/onpoint_lambdas/scripts/build_layers.sh"
ENABLE_TENANT_FLEET_INDEX="${ENABLE_TENANT_FLEET_INDEX:-false}"
LAMBDA_ONLY="${LAMBDA_ONLY:-false}"
LAMBDA_KEY_SUFFIX="${LAMBDA_KEY_SUFFIX:-}"

# Validate bucket exists
aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" --region "$REGION" >/dev/null 2>&1 || {
  echo "S3 bucket not found or not accessible: $ARTIFACT_BUCKET" >&2
  exit 1
}

# Upload templates
aws s3 sync cfn "s3://${ARTIFACT_BUCKET}/cfn/${TEMPLATE_VERSION}" --region "$REGION"

# Build and upload lambda packages
LAMBDA_OUT_DIR="$ROOT_DIR/onpoint_lambdas/dist"
mkdir -p "$LAMBDA_OUT_DIR"

echo "Building Lambda functions..."
ingress_zip=$($LAMBDA_BUILD_SCRIPT ingress)
telematics_zip=$($LAMBDA_BUILD_SCRIPT telematics_processor)
psl_enricher_zip=$($LAMBDA_BUILD_SCRIPT psl_enricher)
overspeed_zip=$($LAMBDA_BUILD_SCRIPT overspeed_detector)
trip_summary_builder_zip=$($LAMBDA_BUILD_SCRIPT trip_summary_builder)
trip_summary_api_zip=$($LAMBDA_BUILD_SCRIPT trip_summary_api)
vehicle_state_api_zip=$($LAMBDA_BUILD_SCRIPT vehicle_state_api)
fleet_tenancy_api_zip=$($LAMBDA_BUILD_SCRIPT fleet_tenancy_api)
geofence_processor_zip=$($LAMBDA_BUILD_SCRIPT geofence_processor)
geofence_api_zip=$($LAMBDA_BUILD_SCRIPT geofence_api)
geofence_admin_api_zip=$($LAMBDA_BUILD_SCRIPT geofence_admin_api)

echo "Building Lambda layers..."
$LAYER_BUILD_SCRIPT

if [[ "$LAMBDA_ONLY" == "true" || "$LAMBDA_ONLY" == "1" ]]; then
  if [[ -z "$LAMBDA_KEY_SUFFIX" ]]; then
    LAMBDA_KEY_SUFFIX="$(date +%Y%m%d%H%M%S)"
  fi
  LAMBDA_KEY_PREFIX="lambda/${LAMBDA_KEY_SUFFIX}"
else
  LAMBDA_KEY_PREFIX="lambda"
fi

INGRESS_KEY="${LAMBDA_KEY_PREFIX}/ingress.zip"
TELEMATICS_PROCESSOR_KEY="${LAMBDA_KEY_PREFIX}/telematics_processor.zip"
PSL_ENRICHER_KEY="${LAMBDA_KEY_PREFIX}/psl_enricher.zip"
OVERSPEED_DETECTOR_KEY="${LAMBDA_KEY_PREFIX}/overspeed_detector.zip"
TRIP_SUMMARY_BUILDER_KEY="${LAMBDA_KEY_PREFIX}/trip_summary_builder.zip"
TRIP_SUMMARY_API_KEY="${LAMBDA_KEY_PREFIX}/trip_summary_api.zip"
VEHICLE_STATE_API_KEY="${LAMBDA_KEY_PREFIX}/vehicle_state_api.zip"
FLEET_TENANCY_API_KEY="${LAMBDA_KEY_PREFIX}/fleet_tenancy_api.zip"
GEOFENCE_PROCESSOR_KEY="${LAMBDA_KEY_PREFIX}/geofence_processor.zip"
GEOFENCE_API_KEY="${LAMBDA_KEY_PREFIX}/geofence_api.zip"
GEOFENCE_ADMIN_API_KEY="${LAMBDA_KEY_PREFIX}/geofence_admin_api.zip"

echo "Uploading Lambda functions to S3..."
aws s3 cp "$ingress_zip" "s3://${ARTIFACT_BUCKET}/${INGRESS_KEY}" --region "$REGION"
aws s3 cp "$telematics_zip" "s3://${ARTIFACT_BUCKET}/${TELEMATICS_PROCESSOR_KEY}" --region "$REGION"
aws s3 cp "$psl_enricher_zip" "s3://${ARTIFACT_BUCKET}/${PSL_ENRICHER_KEY}" --region "$REGION"
aws s3 cp "$overspeed_zip" "s3://${ARTIFACT_BUCKET}/${OVERSPEED_DETECTOR_KEY}" --region "$REGION"
aws s3 cp "$trip_summary_builder_zip" "s3://${ARTIFACT_BUCKET}/${TRIP_SUMMARY_BUILDER_KEY}" --region "$REGION"
aws s3 cp "$trip_summary_api_zip" "s3://${ARTIFACT_BUCKET}/${TRIP_SUMMARY_API_KEY}" --region "$REGION"
aws s3 cp "$vehicle_state_api_zip" "s3://${ARTIFACT_BUCKET}/${VEHICLE_STATE_API_KEY}" --region "$REGION"
aws s3 cp "$fleet_tenancy_api_zip" "s3://${ARTIFACT_BUCKET}/${FLEET_TENANCY_API_KEY}" --region "$REGION"
aws s3 cp "$geofence_processor_zip" "s3://${ARTIFACT_BUCKET}/${GEOFENCE_PROCESSOR_KEY}" --region "$REGION"
aws s3 cp "$geofence_api_zip" "s3://${ARTIFACT_BUCKET}/${GEOFENCE_API_KEY}" --region "$REGION"
aws s3 cp "$geofence_admin_api_zip" "s3://${ARTIFACT_BUCKET}/${GEOFENCE_ADMIN_API_KEY}" --region "$REGION"

echo "Uploading Lambda layers to S3..."
common_layer_zip="$LAMBDA_OUT_DIR/onpoint_common_layer.zip"
COMMON_LAYER_KEY="${LAMBDA_KEY_PREFIX}/onpoint_common_layer.zip"
if [[ -f "$common_layer_zip" ]]; then
  aws s3 cp "$common_layer_zip" "s3://${ARTIFACT_BUCKET}/${COMMON_LAYER_KEY}" --region "$REGION"
  echo "✓ Uploaded common layer"
else
  echo "✗ Common layer zip not found at $common_layer_zip" >&2
  exit 1
fi

if [[ "$LAMBDA_ONLY" == "true" || "$LAMBDA_ONLY" == "1" ]]; then
  LAMBDAS_STACK_ID=$(aws cloudformation list-stack-resources \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --query "StackResourceSummaries[?LogicalResourceId=='LambdasStack'].PhysicalResourceId" \
    --output text)

  if [[ -z "$LAMBDAS_STACK_ID" || "$LAMBDAS_STACK_ID" == "None" ]]; then
    echo "LambdasStack not found in stack $STACK_NAME" >&2
    exit 1
  fi

  mkdir -p "$ROOT_DIR/.cfn_cached"
  PARAMS_FILE="$ROOT_DIR/.cfn_cached/lambdas.params.json"

  PYTHON_BIN="python3"
  if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    PYTHON_BIN="python"
  fi

  LAMBDAS_STACK_ID="$LAMBDAS_STACK_ID" ARTIFACT_BUCKET="$ARTIFACT_BUCKET" REGION="$REGION" \
  INGRESS_KEY="$INGRESS_KEY" \
  TELEMATICS_PROCESSOR_KEY="$TELEMATICS_PROCESSOR_KEY" \
  PSL_ENRICHER_KEY="$PSL_ENRICHER_KEY" \
  OVERSPEED_DETECTOR_KEY="$OVERSPEED_DETECTOR_KEY" \
  TRIP_SUMMARY_BUILDER_KEY="$TRIP_SUMMARY_BUILDER_KEY" \
  TRIP_SUMMARY_API_KEY="$TRIP_SUMMARY_API_KEY" \
  VEHICLE_STATE_API_KEY="$VEHICLE_STATE_API_KEY" \
  FLEET_TENANCY_API_KEY="$FLEET_TENANCY_API_KEY" \
  GEOFENCE_PROCESSOR_KEY="$GEOFENCE_PROCESSOR_KEY" \
  GEOFENCE_API_KEY="$GEOFENCE_API_KEY" \
  GEOFENCE_ADMIN_API_KEY="$GEOFENCE_ADMIN_API_KEY" \
  COMMON_LAYER_KEY="$COMMON_LAYER_KEY" \
    "$PYTHON_BIN" - <<'PY' > "$PARAMS_FILE"
import json
import os
import subprocess

stack_id = os.environ["LAMBDAS_STACK_ID"]
region = os.environ["REGION"]
bucket = os.environ["ARTIFACT_BUCKET"]
ingress_key = os.environ["INGRESS_KEY"]
telematics_key = os.environ["TELEMATICS_PROCESSOR_KEY"]
psl_key = os.environ["PSL_ENRICHER_KEY"]
overspeed_key = os.environ["OVERSPEED_DETECTOR_KEY"]
trip_builder_key = os.environ["TRIP_SUMMARY_BUILDER_KEY"]
trip_api_key = os.environ["TRIP_SUMMARY_API_KEY"]
vehicle_state_key = os.environ["VEHICLE_STATE_API_KEY"]
fleet_tenancy_key = os.environ["FLEET_TENANCY_API_KEY"]
geofence_processor_key = os.environ["GEOFENCE_PROCESSOR_KEY"]
geofence_api_key = os.environ["GEOFENCE_API_KEY"]
geofence_admin_key = os.environ["GEOFENCE_ADMIN_API_KEY"]
common_layer_key = os.environ["COMMON_LAYER_KEY"]

raw = subprocess.check_output(
    [
        "aws",
        "cloudformation",
        "describe-stacks",
        "--region",
        region,
        "--stack-name",
        stack_id,
        "--query",
        "Stacks[0].Parameters",
        "--output",
        "json",
    ]
)
params = json.loads(raw)

updates = {
    "IngressCodeS3Bucket": bucket,
  "IngressCodeS3Key": ingress_key,
    "TelematicsProcessorCodeS3Bucket": bucket,
  "TelematicsProcessorCodeS3Key": telematics_key,
    "PslEnricherCodeS3Bucket": bucket,
  "PslEnricherCodeS3Key": psl_key,
    "OverspeedDetectorCodeS3Bucket": bucket,
  "OverspeedDetectorCodeS3Key": overspeed_key,
    "TripSummaryBuilderCodeS3Bucket": bucket,
  "TripSummaryBuilderCodeS3Key": trip_builder_key,
    "TripSummaryApiCodeS3Bucket": bucket,
  "TripSummaryApiCodeS3Key": trip_api_key,
    "VehicleStateApiCodeS3Bucket": bucket,
  "VehicleStateApiCodeS3Key": vehicle_state_key,
    "FleetTenancyApiCodeS3Bucket": bucket,
  "FleetTenancyApiCodeS3Key": fleet_tenancy_key,
    "GeofenceProcessorCodeS3Bucket": bucket,
  "GeofenceProcessorCodeS3Key": geofence_processor_key,
    "GeofenceApiCodeS3Bucket": bucket,
  "GeofenceApiCodeS3Key": geofence_api_key,
    "GeofenceAdminApiCodeS3Bucket": bucket,
  "GeofenceAdminApiCodeS3Key": geofence_admin_key,
    "CommonLayerS3Bucket": bucket,
  "CommonLayerS3Key": common_layer_key,
}

out = []
for p in params:
    key = p.get("ParameterKey")
    if not key:
        continue
    if key in updates:
        out.append({"ParameterKey": key, "ParameterValue": updates[key]})
    else:
        out.append({"ParameterKey": key, "UsePreviousValue": True})

print(json.dumps(out))
PY

  aws cloudformation update-stack \
    --region "$REGION" \
    --stack-name "$LAMBDAS_STACK_ID" \
    --use-previous-template \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameters "file://$PARAMS_FILE" || {
      echo "No updates to perform."
      exit 0
    }

  aws cloudformation wait stack-update-complete --region "$REGION" --stack-name "$LAMBDAS_STACK_ID"
  echo "LambdasStack update completed successfully"
  exit 0
fi

PARAMS=(
  "ParameterKey=Env,ParameterValue=dev"
  "ParameterKey=ProjectName,ParameterValue=onpoint"
  "ParameterKey=TemplateBucket,ParameterValue=${ARTIFACT_BUCKET}"
  "ParameterKey=TemplatePrefix,ParameterValue=cfn"
  "ParameterKey=TemplateVersion,ParameterValue=${TEMPLATE_VERSION}"
  "ParameterKey=EnableTenantFleetIndex,ParameterValue=${ENABLE_TENANT_FLEET_INDEX}"
  "ParameterKey=UserPoolId,ParameterValue=${USER_POOL_ID:-}"
  "ParameterKey=IngressCodeS3Key,ParameterValue=lambda/ingress.zip"
  "ParameterKey=TelematicsProcessorCodeS3Key,ParameterValue=lambda/telematics_processor.zip"
  "ParameterKey=PslEnricherCodeS3Key,ParameterValue=lambda/psl_enricher.zip"
  "ParameterKey=OverspeedDetectorCodeS3Key,ParameterValue=lambda/overspeed_detector.zip"
  "ParameterKey=TripSummaryBuilderCodeS3Key,ParameterValue=lambda/trip_summary_builder.zip"
  "ParameterKey=TripSummaryApiCodeS3Key,ParameterValue=lambda/trip_summary_api.zip"
  "ParameterKey=VehicleStateApiCodeS3Key,ParameterValue=lambda/vehicle_state_api.zip"
  "ParameterKey=FleetTenancyApiCodeS3Key,ParameterValue=lambda/fleet_tenancy_api.zip"
  "ParameterKey=GeofenceProcessorCodeS3Key,ParameterValue=lambda/geofence_processor.zip"
  "ParameterKey=GeofenceApiCodeS3Key,ParameterValue=lambda/geofence_api.zip"
  "ParameterKey=GeofenceAdminApiCodeS3Key,ParameterValue=lambda/geofence_admin_api.zip"
  "ParameterKey=CommonLayerS3Key,ParameterValue=lambda/onpoint_common_layer.zip"
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
