#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <bucket> [--region us-east-1] [--stack-name onpoint-dev] [--env dev] [--project-name onpoint] [--prefix cfn] [--template-version v1]" >&2
  echo "       [--ui-bucket-name name] [--ui-price-class PriceClass_100]" >&2
  echo "       [--ui-custom-domain name] [--ui-acm-arn arn] [--ui-hosted-zone-id ZONEID]" >&2
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
TEMPLATE_VERSION="v1"
UI_BUCKET_NAME=""
UI_PRICE_CLASS=""
UI_CUSTOM_DOMAIN=""
UI_ACM_ARN=""
UI_HOSTED_ZONE_ID=""

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
    --template-version)
      TEMPLATE_VERSION="$2"; shift 2;;
    --ui-bucket-name)
      UI_BUCKET_NAME="$2"; shift 2;;
    --ui-price-class)
      UI_PRICE_CLASS="$2"; shift 2;;
    --ui-custom-domain)
      UI_CUSTOM_DOMAIN="$2"; shift 2;;
    --ui-acm-arn)
      UI_ACM_ARN="$2"; shift 2;;
    --ui-hosted-zone-id)
      UI_HOSTED_ZONE_ID="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/cfn/root.yaml"

"$ROOT_DIR/scripts/deploy_cfn.sh" "$BUCKET" \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --env "$ENV" \
  --project-name "$PROJECT_NAME" \
  --prefix "$PREFIX" \
  --template-version "$TEMPLATE_VERSION"

PARAMS=(
  "ParameterKey=Env,ParameterValue=${ENV}"
  "ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME}"
  "ParameterKey=TemplateBucket,ParameterValue=${BUCKET}"
  "ParameterKey=TemplatePrefix,ParameterValue=${PREFIX}"
  "ParameterKey=TemplateVersion,ParameterValue=${TEMPLATE_VERSION}"
  "ParameterKey=EnableUiStack,ParameterValue=true"
)

if [[ -n "$UI_BUCKET_NAME" ]]; then
  PARAMS+=("ParameterKey=UiBucketName,ParameterValue=${UI_BUCKET_NAME}")
fi
if [[ -n "$UI_PRICE_CLASS" ]]; then
  PARAMS+=("ParameterKey=UiPriceClass,ParameterValue=${UI_PRICE_CLASS}")
fi
if [[ -n "$UI_CUSTOM_DOMAIN" ]]; then
  PARAMS+=("ParameterKey=UiCustomDomainName,ParameterValue=${UI_CUSTOM_DOMAIN}")
fi
if [[ -n "$UI_ACM_ARN" ]]; then
  PARAMS+=("ParameterKey=UiAcmCertificateArn,ParameterValue=${UI_ACM_ARN}")
fi
if [[ -n "$UI_HOSTED_ZONE_ID" ]]; then
  PARAMS+=("ParameterKey=UiHostedZoneId,ParameterValue=${UI_HOSTED_ZONE_ID}")
fi

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
  else
    echo "$UPDATE_OUT" >&2
    exit 1
  fi
else
  AWS_PAGER="" aws cloudformation wait stack-update-complete \
    --region "$REGION" \
    --stack-name "$STACK_NAME"
fi

AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table
