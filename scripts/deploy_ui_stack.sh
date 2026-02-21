#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <bucket> [--region us-east-1] [--stack-name onpoint-dev] [--env dev] [--project-name onpoint] [--prefix cfn] [--template-version v1]" >&2
  echo "       [--ui-bucket-name name] [--ui-price-class PriceClass_100]" >&2
  echo "       [--ui-custom-domain name] [--ui-acm-arn arn] [--ui-hosted-zone-id ZONEID]" >&2
  echo "       [--allow-integration-responses 1|0]" >&2
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
ALLOW_INTEGRATION_RESPONSES="1"

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
    --allow-integration-responses)
      ALLOW_INTEGRATION_RESPONSES="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/cfn/root.yaml"

wait_for_stack_ready() {
  local stack_name="$1"
  local region="$2"

  while true; do
    local status
    status="$(AWS_PAGER="" aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].StackStatus" \
      --output text 2>/dev/null || true)"

    if [[ -z "$status" || "$status" == "None" ]]; then
      echo "Stack not found: $stack_name" >&2
      return 1
    fi

    case "$status" in
      *_IN_PROGRESS)
        echo "Stack is busy ($status); waiting..."
        sleep 15
        ;;
      UPDATE_ROLLBACK_FAILED)
        echo "Stack in UPDATE_ROLLBACK_FAILED; continuing rollback..."
        AWS_PAGER="" aws cloudformation continue-update-rollback \
          --region "$region" \
          --stack-name "$stack_name" >/dev/null
        sleep 10
        ;;
      ROLLBACK_COMPLETE|REVIEW_IN_PROGRESS|DELETE_COMPLETE)
        echo "Stack is in unrecoverable state for update: $status" >&2
        return 1
        ;;
      *)
        echo "Stack ready: $status"
        return 0
        ;;
    esac
  done
}

override_value_for_key() {
  local key="$1"
  case "$key" in
    Env) echo "$ENV"; return 0 ;;
    ProjectName) echo "$PROJECT_NAME"; return 0 ;;
    TemplateBucket) echo "$BUCKET"; return 0 ;;
    TemplatePrefix) echo "$PREFIX"; return 0 ;;
    TemplateVersion) echo "$TEMPLATE_VERSION"; return 0 ;;
    EnableUiStack) echo "true"; return 0 ;;
    UiBucketName)
      if [[ -n "$UI_BUCKET_NAME" ]]; then echo "$UI_BUCKET_NAME"; return 0; fi
      return 1
      ;;
    UiPriceClass)
      if [[ -n "$UI_PRICE_CLASS" ]]; then echo "$UI_PRICE_CLASS"; return 0; fi
      return 1
      ;;
    UiCustomDomainName)
      if [[ -n "$UI_CUSTOM_DOMAIN" ]]; then echo "$UI_CUSTOM_DOMAIN"; return 0; fi
      return 1
      ;;
    UiAcmCertificateArn)
      if [[ -n "$UI_ACM_ARN" ]]; then echo "$UI_ACM_ARN"; return 0; fi
      return 1
      ;;
    UiHostedZoneId)
      if [[ -n "$UI_HOSTED_ZONE_ID" ]]; then echo "$UI_HOSTED_ZONE_ID"; return 0; fi
      return 1
      ;;
    *)
      return 1
      ;;
  esac
}

ALLOW_INTEGRATION_RESPONSES="$ALLOW_INTEGRATION_RESPONSES" "$ROOT_DIR/scripts/deploy_cfn.sh" "$BUCKET" \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --env "$ENV" \
  --project-name "$PROJECT_NAME" \
  --prefix "$PREFIX" \
  --template-version "$TEMPLATE_VERSION"

wait_for_stack_ready "$STACK_NAME" "$REGION"

declare -a PARAMS=()
SEEN_KEYS=""

EXISTING_KEYS_RAW="$(AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Parameters[].ParameterKey" \
  --output text | tr '\t' '\n' | sed '/^$/d')"

while IFS= read -r key; do
  [[ -z "$key" ]] && continue
  SEEN_KEYS+="\n$key\n"
  if value="$(override_value_for_key "$key")"; then
    PARAMS+=("ParameterKey=$key,ParameterValue=$value")
  else
    PARAMS+=("ParameterKey=$key,UsePreviousValue=true")
  fi
done <<< "$EXISTING_KEYS_RAW"

for key in Env ProjectName TemplateBucket TemplatePrefix TemplateVersion EnableUiStack UiBucketName UiPriceClass UiCustomDomainName UiAcmCertificateArn UiHostedZoneId; do
  if [[ "$SEEN_KEYS" != *$'\n'"$key"$'\n'* ]]; then
    if value="$(override_value_for_key "$key")"; then
      PARAMS+=("ParameterKey=$key,ParameterValue=$value")
    fi
  fi
done

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
    echo "Recent stack events:" >&2
    AWS_PAGER="" aws cloudformation describe-stack-events \
      --region "$REGION" \
      --stack-name "$STACK_NAME" \
      --max-items 15 \
      --query "StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId,ResourceStatusReason]" \
      --output table >&2 || true
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

UI_BUCKET=$(AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='UiBucketName'].OutputValue" \
  --output text)

UI_DISTRIBUTION=$(AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='UiDistributionId'].OutputValue" \
  --output text)

if [[ -n "$UI_BUCKET" && "$UI_BUCKET" != "None" ]]; then
  echo "UI bucket: $UI_BUCKET"
fi
if [[ -n "$UI_DISTRIBUTION" && "$UI_DISTRIBUTION" != "None" ]]; then
  echo "UI distribution: $UI_DISTRIBUTION"
fi
