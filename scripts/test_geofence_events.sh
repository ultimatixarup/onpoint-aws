#!/usr/bin/env bash
set -euo pipefail

: "${GEOFENCE_API_URL:?Set GEOFENCE_API_URL}"
: "${API_KEY:?Set API_KEY}"
: "${TENANT_ID:?Set TENANT_ID}"
: "${VIN:?Set VIN}"
: "${TELEMETRY_EVENTS_TABLE:?Set TELEMETRY_EVENTS_TABLE}"

BASE_URL="${GEOFENCE_API_URL%/}"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PK="VEHICLE#${VIN}"
SK="TS#${NOW}#MSG#geofence-test"

aws dynamodb put-item \
  --table-name "${TELEMETRY_EVENTS_TABLE}" \
  --item "{\"PK\": {\"S\": \"${PK}\"}, \"SK\": {\"S\": \"${SK}\"}, \"schemaVersion\": {\"S\": \"normalized-telematics-1.0\"}, \"eventTime\": {\"S\": \"${NOW}\"}, \"vin\": {\"S\": \"${VIN}\"}, \"lat\": {\"N\": \"37.7749\"}, \"lon\": {\"N\": \"-122.4194\"}, \"speed_mph\": {\"N\": \"12\"}}" > /dev/null

echo "Inserted telemetry event for ${VIN} at ${NOW}"

sleep 5

curl -sS -X GET "${BASE_URL}/vehicles/${VIN}/geofence-events?from=${NOW}&limit=10" \
  -H "x-api-key: ${API_KEY}" \
  -H "x-tenant-id: ${TENANT_ID}" | cat
