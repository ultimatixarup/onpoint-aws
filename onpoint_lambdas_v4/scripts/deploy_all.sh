#!/usr/bin/env bash
set -euo pipefail

# Deploys all lambdas in this repo.
# You can pass through:
#   REGION, LAYER_ARN
# Example:
#   REGION=us-east-1 LAYER_ARN=arn:aws:lambda:us-east-1:123:layer:onpoint-shared:3 ./scripts/deploy_all.sh

REGION="${REGION:-us-east-1}"
LAYER_ARN="${LAYER_ARN:-}"

args=(--region "$REGION")
if [[ -n "$LAYER_ARN" ]]; then
  args+=(--layer-arn "$LAYER_ARN")
fi

./scripts/deploy_lambda.sh ingress onpoint-dev-ingress "${args[@]}"
./scripts/deploy_lambda.sh telematics_processor onpoint-dev-telematics-processor "${args[@]}"
./scripts/deploy_lambda.sh trip_summary_builder onpoint-dev-trip-summary-builder "${args[@]}"
./scripts/deploy_lambda.sh trip_summary_api onpoint-trip-summary-api "${args[@]}"
./scripts/deploy_lambda.sh overspeed_detector onpoint-overspeed-detector "${args[@]}"
# Add PSL enricher if/when you recreate it:
# ./scripts/deploy_lambda.sh psl_enricher onpoint-psl-enricher "${args[@]}"

echo "Done."
