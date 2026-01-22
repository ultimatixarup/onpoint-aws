#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <FULL_INGEST_URL> <API_KEY> <PROVIDER_ID>" >&2
  echo "Example: $0 https://agpzpas961.execute-api.us-east-1.amazonaws.com/v1/ingest/telematics <API_KEY> test-provider" >&2
}

INGEST_URL="${1:-}"
API_KEY="${2:-}"
PROVIDER_ID="${3:-}"

if [[ -z "$INGEST_URL" || -z "$API_KEY" || -z "$PROVIDER_ID" ]]; then
  usage
  exit 2
fi

NOW_ISO="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
CX_VEHICLE_ID="vehicle-$(date -u +"%Y%m%d%H%M%S")"
CX_TRIP_ID="trip-$(date -u +"%Y%m%d%H%M%S")"
CX_MSG_ID="msg-$(date -u +"%Y%m%d%H%M%S%N")"

PAYLOAD_FILE="$(mktemp)"
BODY_FILE="$(mktemp)"

cat > "$PAYLOAD_FILE" <<EOF
{
  "providerId": "${PROVIDER_ID}",
  "cx_vehicle_id": "${CX_VEHICLE_ID}",
  "cx_trip_id": "${CX_TRIP_ID}",
  "cx_event_type": "location_update",
  "cx_timestamp": "${NOW_ISO}",
  "cx_msg_id": "${CX_MSG_ID}",
  "cx_geolocation": {
    "cx_latitude": 42.3601,
    "cx_longitude": -71.0589
  },
  "cx_vehicle_speed": {
    "value": 37.5,
    "unit": "mph"
  }
}
EOF

echo "POST URL: ${INGEST_URL}"

echo "Curl command:"
echo "curl -sS -X POST -H 'Content-Type: application/json' -H 'x-api-key: ${API_KEY}' --data @${PAYLOAD_FILE} '${INGEST_URL}'"

CURL_TIMINGS="$(
  curl -sS -o "$BODY_FILE" -w "HTTP_CODE=%{http_code}\nTIME_TOTAL=%{time_total}\nTIME_NAMELOOKUP=%{time_namelookup}\nTIME_CONNECT=%{time_connect}\nTIME_STARTTRANSFER=%{time_starttransfer}\nSIZE_DOWNLOAD=%{size_download}\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${API_KEY}" \
    --data "@${PAYLOAD_FILE}" \
    "${INGEST_URL}"
)"

HTTP_CODE="$(echo "$CURL_TIMINGS" | awk -F= '/HTTP_CODE/ {print $2}')"

echo "HTTP status: ${HTTP_CODE}"
echo "Response body:"
cat "$BODY_FILE"
echo

echo "Curl timing summary:"
echo "$CURL_TIMINGS"

rm -f "$PAYLOAD_FILE" "$BODY_FILE"

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "202" ]]; then
  exit 1
fi

STACK_NAME="${STACK_NAME:-onpoint-dev}"
REGION="${REGION:-us-east-1}"

QUEUE_URL="$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`IngestQueueUrl`].OutputValue' --output text)"
if [[ -z "$QUEUE_URL" || "$QUEUE_URL" == "None" ]]; then
  echo "Could not resolve IngestQueueUrl from stack outputs (stack=$STACK_NAME, region=$REGION)." >&2
  exit 1
fi

echo
echo "SQS receive-message (1 message):"
aws sqs receive-message --region "$REGION" \
  --queue-url "$QUEUE_URL" \
  --max-number-of-messages 1 \
  --wait-time-seconds 2 \
  --message-attribute-names All \
  --output json

cat <<EOF

Follow-up verification commands (run manually):

A) SQS: show last 20 messages (if queue is configured)
   aws sqs receive-message --region us-east-1 \
     --queue-url <INGRESS_QUEUE_URL> \
     --max-number-of-messages 10 \
     --visibility-timeout 0 \
     --wait-time-seconds 1

B) Kinesis: fetch latest records
   aws kinesis describe-stream-summary --region us-east-1 --stream-name <INGRESS_STREAM_NAME>
   aws kinesis list-shards --region us-east-1 --stream-name <INGRESS_STREAM_NAME>
   aws kinesis get-shard-iterator --region us-east-1 \
     --stream-name <INGRESS_STREAM_NAME> \
     --shard-id <SHARD_ID> \
     --shard-iterator-type LATEST
   aws kinesis get-records --region us-east-1 --shard-iterator <ITERATOR> --limit 20

C) DynamoDB: query telemetry table for this vehicle/trip (after a short wait)
   aws dynamodb query --region us-east-1 \
     --table-name <TELEMETRY_EVENTS_TABLE> \
     --key-condition-expression "pk = :pk" \
     --expression-attribute-values '{":pk":{"S":"${CX_VEHICLE_ID}"}}' \
     --limit 20
EOF
