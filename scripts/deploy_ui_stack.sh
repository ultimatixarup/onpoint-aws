#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <bucket> [--region us-east-1] [--stack-name onpoint-dev] [--env dev] [--project-name onpoint] [--prefix cfn] [--template-version v1]" >&2
  echo "       [--ui-bucket-name name] [--ui-price-class PriceClass_100]" >&2
  echo "       [--ui-custom-domain name] [--ui-acm-arn arn] [--ui-hosted-zone-id ZONEID]" >&2
  echo "       [--cleanup-ui-bucket 1|0] [--max-wait-seconds 1800]" >&2
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
CLEANUP_UI_BUCKET="1"
MAX_WAIT_SECONDS="1800"
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
    --cleanup-ui-bucket)
      CLEANUP_UI_BUCKET="$2"; shift 2;;
    --max-wait-seconds)
      MAX_WAIT_SECONDS="$2"; shift 2;;
    --allow-integration-responses)
      ALLOW_INTEGRATION_RESPONSES="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/cfn/root.yaml"
TMP_DIR="$ROOT_DIR/tmp"
mkdir -p "$TMP_DIR"

declare -a TMP_LOGS=()

cleanup_temp_logs() {
  for log_file in "${TMP_LOGS[@]:-}"; do
    [[ -f "$log_file" ]] && rm -f "$log_file"
  done
}

trap cleanup_temp_logs EXIT

run_logged() {
  local label="$1"
  shift
  local log_file
  log_file="$(mktemp "$TMP_DIR/${label}.XXXXXX.log")"
  TMP_LOGS+=("$log_file")

  if "$@" >"$log_file" 2>&1; then
    cat "$log_file"
    return 0
  fi

  cat "$log_file" >&2
  return 1
}

run_capture() {
  local __out_var="$1"
  local label="$2"
  shift 2
  local log_file
  log_file="$(mktemp "$TMP_DIR/${label}.XXXXXX.log")"
  TMP_LOGS+=("$log_file")

  if "$@" >"$log_file" 2>&1; then
    local out
    out="$(cat "$log_file")"
    printf -v "$__out_var" "%s" "$out"
    return 0
  fi

  cat "$log_file" >&2
  return 1
}

wait_for_stack_ready() {
  local stack_name="$1"
  local region="$2"
  local start_ts="$SECONDS"

  while true; do
    local status
    status=""
    run_capture status stack_status \
      env AWS_PAGER="" aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].StackStatus" \
      --output text || true

    if [[ -z "$status" || "$status" == "None" ]]; then
      echo "Stack not found: $stack_name" >&2
      return 1
    fi

    if (( SECONDS - start_ts > MAX_WAIT_SECONDS )); then
      echo "Timed out waiting for stack readiness: $stack_name" >&2
      run_logged recent_events env AWS_PAGER="" aws cloudformation describe-stack-events \
        --region "$region" \
        --stack-name "$stack_name" \
        --max-items 20 \
        --query "StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId,ResourceStatusReason]" \
        --output table || true
      return 1
    fi

    case "$status" in
      *_IN_PROGRESS)
        echo "Stack is busy ($status); waiting..."
        sleep 15
        ;;
      UPDATE_ROLLBACK_FAILED)
        echo "Stack in UPDATE_ROLLBACK_FAILED; continuing rollback..."
        run_logged continue_rollback env AWS_PAGER="" aws cloudformation continue-update-rollback \
          --region "$region" \
          --stack-name "$stack_name"
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

wait_for_stack_update_completion() {
  local stack_name="$1"
  local region="$2"
  local start_ts="$SECONDS"

  while true; do
    local status
    status=""
    run_capture status stack_update_status \
      env AWS_PAGER="" aws cloudformation describe-stacks \
      --region "$region" \
      --stack-name "$stack_name" \
      --query "Stacks[0].StackStatus" \
      --output text || true

    case "$status" in
      UPDATE_COMPLETE)
        echo "Stack update completed: $status"
        return 0
        ;;
      UPDATE_IN_PROGRESS|UPDATE_COMPLETE_CLEANUP_IN_PROGRESS)
        ;;
      UPDATE_ROLLBACK_IN_PROGRESS|UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS)
        ;;
      UPDATE_ROLLBACK_COMPLETE|UPDATE_ROLLBACK_FAILED|ROLLBACK_COMPLETE|ROLLBACK_FAILED)
        echo "Stack update failed: $status" >&2
        run_logged recent_events env AWS_PAGER="" aws cloudformation describe-stack-events \
          --region "$region" \
          --stack-name "$stack_name" \
          --max-items 30 \
          --query "StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId,ResourceStatusReason]" \
          --output table || true
        return 1
        ;;
      *)
        if [[ -n "$status" && "$status" != "None" ]]; then
          echo "Current stack status: $status"
        fi
        ;;
    esac

    if (( SECONDS - start_ts > MAX_WAIT_SECONDS )); then
      echo "Timed out waiting for stack update completion: $stack_name" >&2
      run_logged recent_events env AWS_PAGER="" aws cloudformation describe-stack-events \
        --region "$region" \
        --stack-name "$stack_name" \
        --max-items 30 \
        --query "StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId,ResourceStatusReason]" \
        --output table || true
      return 1
    fi
    sleep 15
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

# UI-only path: sync templates to S3 and update existing root stack with UI parameters.
run_logged sync_templates env AWS_PAGER="" aws s3 sync \
  "$ROOT_DIR/cfn" "s3://${BUCKET}/${PREFIX}/${TEMPLATE_VERSION}" \
  --region "$REGION"

wait_for_stack_ready "$STACK_NAME" "$REGION"

declare -a PARAMS=()
SEEN_KEYS=""

EXISTING_KEYS_RAW=""
run_capture EXISTING_KEYS_RAW existing_keys \
  env AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Parameters[].ParameterKey" \
  --output text
EXISTING_KEYS_RAW="$(echo "$EXISTING_KEYS_RAW" | tr '\t' '\n' | sed '/^$/d')"

if [[ "$CLEANUP_UI_BUCKET" == "1" ]]; then
  EXISTING_UI_BUCKET=""
  run_capture EXISTING_UI_BUCKET existing_ui_bucket \
    env AWS_PAGER="" aws cloudformation describe-stacks \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='UiBucketName'].OutputValue" \
    --output text || true
  if [[ -n "$EXISTING_UI_BUCKET" && "$EXISTING_UI_BUCKET" != "None" ]]; then
    echo "Pre-cleaning UI bucket before stack update: $EXISTING_UI_BUCKET"
    run_logged cleanup_ui_bucket \
      bash "$ROOT_DIR/scripts/cleanup_s3_bucket.sh" "$EXISTING_UI_BUCKET" --region "$REGION" || true
  fi
fi

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
UPDATE_LOG_FILE="$(mktemp "$TMP_DIR/update_stack.XXXXXX.log")"
TMP_LOGS+=("$UPDATE_LOG_FILE")
env AWS_PAGER="" aws cloudformation update-stack \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-body "file://$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --parameters "${PARAMS[@]}" >"$UPDATE_LOG_FILE" 2>&1
UPDATE_CODE=$?
set -e
UPDATE_OUT="$(cat "$UPDATE_LOG_FILE")"

if [[ $UPDATE_CODE -ne 0 ]]; then
  if echo "$UPDATE_OUT" | grep -q "No updates are to be performed"; then
    echo "No updates are to be performed."
  else
    echo "$UPDATE_OUT" >&2
    echo "Recent stack events:" >&2
    run_logged recent_events env AWS_PAGER="" aws cloudformation describe-stack-events \
      --region "$REGION" \
      --stack-name "$STACK_NAME" \
      --max-items 15 \
      --query "StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId,ResourceStatusReason]" \
      --output table || true
    exit 1
  fi
else
  wait_for_stack_update_completion "$STACK_NAME" "$REGION"
fi

run_logged describe_outputs env AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table

UI_BUCKET=""
run_capture UI_BUCKET ui_bucket_output \
  env AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='UiBucketName'].OutputValue" \
  --output text || true

UI_DISTRIBUTION=""
run_capture UI_DISTRIBUTION ui_distribution_output \
  env AWS_PAGER="" aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='UiDistributionId'].OutputValue" \
  --output text || true

if [[ -n "$UI_BUCKET" && "$UI_BUCKET" != "None" ]]; then
  echo "UI bucket: $UI_BUCKET"
fi
if [[ -n "$UI_DISTRIBUTION" && "$UI_DISTRIBUTION" != "None" ]]; then
  echo "UI distribution: $UI_DISTRIBUTION"
fi
