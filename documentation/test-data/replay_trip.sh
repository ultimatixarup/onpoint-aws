#!/bin/bash

ENV_PATH="/Users/ayushpareek/Documents/onpoint-aws/postman/onpoint-dev.postman_environment.json"
API_URL=""
API_KEY=""
INPUT_FILE="/Users/ayushpareek/Documents/OnPointIngres/trip2.json"   # <-- your file with array of messages
DELAY=1                       # seconds between sends

# Ensure jq exists
if ! command -v jq &> /dev/null
then
    echo "Error: jq is not installed. Install via: brew install jq"
    exit 1
fi

if [[ ! -f "$ENV_PATH" ]]; then
    echo "Error: Postman env file not found at $ENV_PATH"
    exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "Error: Input file not found at $INPUT_FILE"
    exit 1
fi

get_env_value() {
    local key="$1"
    jq -r --arg k "$key" '.values[] | select(.key==$k) | .value' "$ENV_PATH" | tail -n1
}

REGION=$(get_env_value region)
INGEST_API_ID=$(get_env_value ingestApiId)
INGEST_STAGE=$(get_env_value ingestStage)
INGEST_BASE_URL=$(get_env_value ingestBaseUrl)
API_KEY=$(get_env_value ingestApiKey)
PROVIDER_ID=$(get_env_value providerId)

if [[ -z "$INGEST_BASE_URL" ]]; then
    echo "Error: ingestBaseUrl missing in Postman env"
    exit 1
fi

API_URL="$INGEST_BASE_URL"
API_URL="${API_URL//\{\{region\}\}/$REGION}"
API_URL="${API_URL//\{\{ingestApiId\}\}/$INGEST_API_ID}"
API_URL="${API_URL//\{\{ingestStage\}\}/$INGEST_STAGE}"

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
    API_KEY=$(AWS_PAGER="" aws apigateway get-api-keys --include-values --region "${REGION:-us-east-1}" --query "items[?name=='CEREBRUMX']|[0].value" --output text)
    if [[ -z "$API_KEY" || "$API_KEY" == "None" ]]; then
        API_KEY=$(AWS_PAGER="" aws apigateway get-api-keys --include-values --region "${REGION:-us-east-1}" --query "items[?name=='cerebrumx-dev']|[0].value" --output text)
    fi
fi

if [[ -z "$API_KEY" || "$API_KEY" == "None" ]]; then
    echo "Error: ingest API key not found"
    exit 1
fi

if [[ -z "$PROVIDER_ID" ]]; then
    echo "Error: providerId missing in Postman env"
    exit 1
fi

# Parse JSON array size
TOTAL=$(jq length "$INPUT_FILE")
echo "Total events in file: $TOTAL"
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
