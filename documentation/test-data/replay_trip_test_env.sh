#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ENV_PATH="${ENV_PATH:-$ROOT_DIR/postman/onpoint-test.postman_environment.json}"
STACK_NAME="${STACK_NAME:-onpoint-test}"
REGION="${REGION:-us-east-1}"
API_URL="${API_URL:-}"
API_KEY="${API_KEY:-}"
INPUT_FILE="${INPUT_FILE:-$ROOT_DIR/documentation/test-data/test-data-generator.json}"
DELAY="${DELAY:-1}"
AWS_PROFILE="${AWS_PROFILE:-test}"
PROVIDER_ID="${PROVIDER_ID:-}"

# Ensure jq exists
if ! command -v jq &> /dev/null
then
    echo "Error: jq is not installed. Install via: brew install jq"
    exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "Error: Input file not found at $INPUT_FILE"
    exit 1
fi

get_env_value() {
    local key="$1"
    if [[ ! -f "$ENV_PATH" ]]; then
        echo ""
        return 0
    fi
    jq -r --arg k "$key" '.values[] | select(.key==$k) | .value' "$ENV_PATH" | tail -n1
}

get_stack_output() {
    local key="$1"
    AWS_PAGER="" AWS_PROFILE="$AWS_PROFILE" aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue" \
      --output text 2>/dev/null || true
}

if [[ -z "$API_URL" ]]; then
    INGEST_API_ID="$(get_env_value ingestApiId)"
    INGEST_STAGE="$(get_env_value ingestStage)"
    INGEST_BASE_URL="$(get_env_value ingestBaseUrl)"

    if [[ -z "$INGEST_API_ID" || "$INGEST_API_ID" == "None" ]]; then
        INGEST_API_ID="$(get_stack_output IngestApiId)"
    fi
    if [[ -z "$INGEST_STAGE" || "$INGEST_STAGE" == "None" ]]; then
        INGEST_STAGE="$(get_stack_output IngestApiStageName)"
    fi
    INGEST_STAGE="${INGEST_STAGE:-v1}"

    if [[ -n "$INGEST_BASE_URL" ]]; then
        API_URL="$INGEST_BASE_URL"
        API_URL="${API_URL//\{\{region\}\}/$REGION}"
        API_URL="${API_URL//\{\{ingestApiId\}\}/$INGEST_API_ID}"
        API_URL="${API_URL//\{\{ingestStage\}\}/$INGEST_STAGE}"
    else
        if [[ -z "$INGEST_API_ID" || "$INGEST_API_ID" == "None" ]]; then
            echo "Error: Could not resolve test ingest API ID from stack outputs or env file." >&2
            exit 1
        fi
        API_URL="https://${INGEST_API_ID}.execute-api.${REGION}.amazonaws.com/${INGEST_STAGE}/ingest/telematics"
    fi
fi

if [[ -z "$API_KEY" ]]; then
    API_KEY="$(get_env_value ingestApiKey)"
fi
if [[ -z "$PROVIDER_ID" ]]; then
    PROVIDER_ID="$(get_env_value providerId)"
fi

if [[ "$API_URL" == *"{{"*"}}"* ]]; then
    echo "Error: Unresolved API URL template values: $API_URL"
    exit 1
fi

if [[ "$API_URL" != */ingest/telematics ]]; then
    API_URL="${API_URL%/}/ingest/telematics"
fi

if [[ -z "$API_KEY" || "$API_KEY" == "<API_KEY>" ]]; then
    if ! command -v aws &> /dev/null; then
        echo "Error: aws CLI is not installed. Install via: brew install awscli"
        exit 1
    fi
    API_KEY=$(AWS_PAGER="" AWS_PROFILE="$AWS_PROFILE" aws apigateway get-api-keys --include-values --region "$REGION" --query "items[?name=='CEREBRUMX']|[0].value" --output text)
    if [[ -z "$API_KEY" || "$API_KEY" == "None" ]]; then
        API_KEY=$(AWS_PAGER="" AWS_PROFILE="$AWS_PROFILE" aws apigateway get-api-keys --include-values --region "$REGION" --query "items[?name=='cerebrumx-test']|[0].value" --output text)
    fi
    if [[ -z "$API_KEY" || "$API_KEY" == "None" ]]; then
        API_KEY=$(AWS_PAGER="" AWS_PROFILE="$AWS_PROFILE" aws apigateway get-api-keys --include-values --region "$REGION" --query "items[?name=='cerebrumx-dev']|[0].value" --output text)
    fi
fi

if [[ -z "$API_KEY" || "$API_KEY" == "None" ]]; then
    echo "Error: ingest API key not found"
    exit 1
fi

if [[ -z "$PROVIDER_ID" ]]; then
    PROVIDER_ID="cerebrumx"
fi

# Parse JSON array size
TOTAL=$(jq length "$INPUT_FILE")
echo "Total events in file: $TOTAL"
echo "AWS Profile: $AWS_PROFILE"
echo "Stack: $STACK_NAME"
echo "Target API URL: $API_URL"
echo "Sending events to API every $DELAY seconds..."
echo

# Loop through array elements
for ((i=0; i<"$TOTAL"; i++))
do
    echo "----------------------------------------------------"
    echo "Sending event $((i+1))/$TOTAL..."

    EVENT=$(jq -c ".[$i]" "$INPUT_FILE")

    RESPONSE=$(curl -s -w "\n%{http_code}" \
      --location "$API_URL" \
      --header "x-api-key: $API_KEY" \
            --header "providerId: $PROVIDER_ID" \
            --header "x-provider-id: $PROVIDER_ID" \
      --header "Content-Type: application/json" \
      --data "$EVENT")

    BODY=$(echo "$RESPONSE" | sed '$d')
    STATUS=$(echo "$RESPONSE" | tail -n1)

    echo "Status: $STATUS"
    echo "Response: $BODY"

    if [[ "$STATUS" != "200" && "$STATUS" != "202" ]]; then
        echo "⚠️ ERROR: Non-200 response. Stopping script."
        exit 1
    fi

    if [[ $i -lt $((TOTAL-1)) ]]; then
        echo "Sleeping for $DELAY seconds..."
        sleep $DELAY
    fi
done

echo "All events sent successfully."
