#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <bucket> [--region us-east-1] [--stack-name onpoint-dev] [--env dev] [--project-name onpoint] [--prefix cfn] [--template-version v1]" >&2
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
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/cfn/root.yaml"

TEMPLATE_URL="https://${BUCKET}.s3.${REGION}.amazonaws.com/${PREFIX}/${TEMPLATE_VERSION}/nested/trip_summary_api.yaml"
TEMPLATE_S3_KEY="${PREFIX}/${TEMPLATE_VERSION}/nested/trip_summary_api.yaml"

echo "TemplateURL (ApiStack): ${TEMPLATE_URL}"

echo "Searching repo for IntegrationResponses (case-sensitive)..."
grep -R "IntegrationResponses" -n "$ROOT_DIR" || true

echo "Listing trip api templates (max depth 4)..."
find "$ROOT_DIR" -maxdepth 4 -name "*trip*api*.yaml" -print

echo "Template S3 key: ${TEMPLATE_S3_KEY}"

AWS_PAGER="" aws s3 sync "$ROOT_DIR/cfn" "s3://${BUCKET}/${PREFIX}/${TEMPLATE_VERSION}" --region "$REGION"

echo "Verifying uploaded object metadata..."
AWS_PAGER="" aws s3api head-object \
  --bucket "$BUCKET" \
  --key "$TEMPLATE_S3_KEY" \
  --query "{LastModified:LastModified,ETag:ETag,ContentLength:ContentLength}" \
  --output table

echo "Downloading uploaded template (first 160 lines)..."
AWS_PAGER="" aws s3 cp "s3://${BUCKET}/${TEMPLATE_S3_KEY}" - --region "$REGION" | sed -n '1,160p'

echo "Validating nested template URL: ${TEMPLATE_URL}"
AWS_PAGER="" aws cloudformation validate-template \
  --region "$REGION" \
  --template-url "$TEMPLATE_URL" \
  --output json > /dev/null

AWS_PAGER="" aws cloudformation validate-template \
  --region "$REGION" \
  --template-body "file://$TEMPLATE_FILE" \
  --output json > /dev/null

shopt -s nullglob
for f in "$ROOT_DIR"/cfn/nested/*.yaml; do
  AWS_PAGER="" aws cloudformation validate-template \
    --region "$REGION" \
    --template-body "file://$f" \
    --output json > /dev/null
done
shopt -u nullglob

PARAMS=(
  "ParameterKey=Env,ParameterValue=${ENV}"
  "ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME}"
  "ParameterKey=TemplateBucket,ParameterValue=${BUCKET}"
  "ParameterKey=TemplatePrefix,ParameterValue=${PREFIX}"
  "ParameterKey=TemplateVersion,ParameterValue=${TEMPLATE_VERSION}"
)

dump_nested_template() {
  echo "Stack outputs (root):"
  AWS_PAGER="" aws cloudformation describe-stacks \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs" \
    --output table || true

  API_STACK_ID=$(AWS_PAGER="" aws cloudformation list-stack-resources \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --query "StackResourceSummaries[?LogicalResourceId=='ApiStack'].PhysicalResourceId" \
    --output text 2>/dev/null || true)

  if [[ -n "${API_STACK_ID}" ]]; then
    echo "ApiStack physical id: ${API_STACK_ID}"
    echo "Nested ApiStack template (first 220 lines):"
    AWS_PAGER="" aws cloudformation get-template \
      --region "$REGION" \
      --stack-name "$API_STACK_ID" \
      --query "TemplateBody" \
      --output text | head -n 220
  else
    echo "ApiStack physical id not found."
  fi
}

normalize_template() {
  local input="$1"
  local output="$2"

  if command -v ruby >/dev/null 2>&1; then
    ruby -ryaml -rjson -e '
def sort_obj(o)
  case o
  when Hash
    o.keys.sort.each_with_object({}) { |k,h| h[k]=sort_obj(o[k]) }
  when Array
    o.map { |v| sort_obj(v) }
  else
    o
  end
end
content = ARGF.read
docs = if YAML.respond_to?(:safe_load_stream)
  YAML.safe_load_stream(content, permitted_classes: [], permitted_symbols: [], aliases: false)
else
  [YAML.safe_load(content, permitted_classes: [], permitted_symbols: [], aliases: false)]
end
normalized = docs.map { |d| sort_obj(d) }
puts JSON.generate(normalized)
' "$input" > "$output"
  else
    # Fallback: formatting-only normalization may produce false diffs without Ruby
    sed 's/[[:space:]]*$//' "$input" | grep -vE '^[[:space:]]*$' > "$output"
  fi
}

verify_nested_template() {
  echo "Verifying stored nested template matches uploaded template..."

  mkdir -p "$ROOT_DIR/.cfn_cached"

  API_STACK_ID=$(AWS_PAGER="" aws cloudformation list-stack-resources \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --query "StackResourceSummaries[?LogicalResourceId=='ApiStack'].PhysicalResourceId" \
    --output text)

  if [[ -z "${API_STACK_ID}" ]]; then
    echo "ApiStack physical id not found." >&2
    exit 1
  fi

  LOCAL_TEMPLATE="$ROOT_DIR/.cfn_cached/local.trip_summary_api.yaml"
  S3_TEMPLATE="$ROOT_DIR/.cfn_cached/s3.trip_summary_api.yaml"
  CACHED_TEMPLATE="$ROOT_DIR/.cfn_cached/ApiStack.template.yaml"
  NORMALIZED_LOCAL="$ROOT_DIR/.cfn_cached/local.trip_summary_api.normalized.yaml"
  NORMALIZED_S3="$ROOT_DIR/.cfn_cached/s3.trip_summary_api.normalized.yaml"
  NORMALIZED_CACHED="$ROOT_DIR/.cfn_cached/ApiStack.template.normalized.yaml"

  cp "$ROOT_DIR/cfn/nested/trip_summary_api.yaml" "$LOCAL_TEMPLATE"

  AWS_PAGER="" aws s3 cp "s3://${BUCKET}/${TEMPLATE_S3_KEY}" "$S3_TEMPLATE" --region "$REGION"

  AWS_PAGER="" aws cloudformation get-template \
    --region "$REGION" \
    --stack-name "$API_STACK_ID" \
    --query "TemplateBody" \
    --output text > "$CACHED_TEMPLATE"

  normalize_template "$LOCAL_TEMPLATE" "$NORMALIZED_LOCAL"
  normalize_template "$S3_TEMPLATE" "$NORMALIZED_S3"
  normalize_template "$CACHED_TEMPLATE" "$NORMALIZED_CACHED"

  if diff -u "$NORMALIZED_LOCAL" "$NORMALIZED_S3"; then
    :
  else
    echo "S3 template differs from local repo template." >&2
    exit 1
  fi

  if diff -u "$NORMALIZED_LOCAL" "$NORMALIZED_CACHED"; then
    :
  else
    echo "CloudFormation stored template differs from uploaded template." >&2
    exit 1
  fi

  if [[ "${ALLOW_INTEGRATION_RESPONSES:-}" != "1" ]]; then
    matches="$(grep -nEi "^[[:space:]]*(IntegrationResponses|MethodResponses):" "$ROOT_DIR/cfn/nested/trip_summary_api.yaml" 2>/dev/null || true)"
    matches="$(printf "%s\n" "$matches" | grep -vE "^[[:space:]]*#" || true)"
    if [[ -n "$matches" ]]; then
      echo "$matches" >&2
      echo "Forbidden keys found in local template. Set ALLOW_INTEGRATION_RESPONSES=1 to override." >&2
      exit 1
    fi

    matches="$(grep -nEi "^[[:space:]]*(IntegrationResponses|MethodResponses):" "$CACHED_TEMPLATE" 2>/dev/null || true)"
    matches="$(printf "%s\n" "$matches" | grep -vE "^[[:space:]]*#" || true)"
    if [[ -n "$matches" ]]; then
      echo "$matches" >&2
      echo "Forbidden keys found in CloudFormation cached template. Set ALLOW_INTEGRATION_RESPONSES=1 to override." >&2
      exit 1
    fi
  fi

  TEMPLATE_URL_OUT=$(AWS_PAGER="" aws cloudformation describe-stacks \
    --region "$REGION" \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiStackTemplateURL'].OutputValue" \
    --output text || true)

  if [[ -z "${TEMPLATE_URL_OUT}" || "${TEMPLATE_URL_OUT}" == "None" ]]; then
    TEMPLATE_URL_OUT="N/A"
  fi

  echo "Verification OK - RootStack=${STACK_NAME} ApiStack=${API_STACK_ID} ComputedTemplateURL=${TEMPLATE_URL} RootOutputTemplateURL=${TEMPLATE_URL_OUT}"
}

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
      echo "ComputedTemplateURL=${TEMPLATE_URL} S3Key=${TEMPLATE_S3_KEY}"
      verify_nested_template
      exit 0
    fi
    echo "$UPDATE_OUT" >&2
    AWS_PAGER="" aws cloudformation describe-stack-events \
      --region "$REGION" \
      --stack-name "$STACK_NAME" \
      --max-items 30 \
      --output table
    dump_nested_template
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
    dump_nested_template
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

echo "ComputedTemplateURL=${TEMPLATE_URL} S3Key=${TEMPLATE_S3_KEY}"
verify_nested_template
