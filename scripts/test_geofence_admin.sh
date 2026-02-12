#!/usr/bin/env bash
set -euo pipefail

: "${GEOFENCE_API_URL:?Set GEOFENCE_API_URL}"
: "${API_KEY:?Set API_KEY}"
: "${TENANT_ID:?Set TENANT_ID}"

BASE_URL="${GEOFENCE_API_URL%/}"

create_resp=$(curl -sS -X POST "${BASE_URL}/geofences" \
  -H "x-api-key: ${API_KEY}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "content-type: application/json" \
  -d '{
    "type": "CIRCLE",
    "geometry": {"center": [37.7749, -122.4194], "radiusMeters": 300},
    "priority": 5,
    "status": "ACTIVE",
    "createdBy": "script",
    "reason": "integration test"
  }')

echo "Create response: ${create_resp}"

gf_id=$(python - <<'PY'
import json,sys
print(json.loads(sys.stdin.read()).get("geofenceId",""))
PY
<<<"${create_resp}")

if [[ -z "${gf_id}" ]]; then
  echo "Failed to parse geofenceId"
  exit 1
fi

assign_resp=$(curl -sS -X POST "${BASE_URL}/geofences/${gf_id}/assignments" \
  -H "x-api-key: ${API_KEY}" \
  -H "x-tenant-id: ${TENANT_ID}" \
  -H "content-type: application/json" \
  -d '{
    "scopeType": "TENANT",
    "scopeId": "'"${TENANT_ID}"'",
    "exclude": false
  }')

echo "Assignment response: ${assign_resp}"

echo "Geofence ID: ${gf_id}"
