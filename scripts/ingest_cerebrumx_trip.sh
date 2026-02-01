#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [--file <path>] [--env <postman_env_json>] [--base-url <url>] [--api-key <key>] [--provider-id <id>] [--limit <n>] [--dry-run]" >&2
}

FILE_PATH=""
ENV_PATH=""
BASE_URL=""
API_KEY=""
PROVIDER_ID=""
LIMIT=""
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) FILE_PATH="$2"; shift 2;;
    --env) ENV_PATH="$2"; shift 2;;
    --base-url) BASE_URL="$2"; shift 2;;
    --api-key) API_KEY="$2"; shift 2;;
    --provider-id) PROVIDER_ID="$2"; shift 2;;
    --limit) LIMIT="$2"; shift 2;;
    --dry-run) DRY_RUN="true"; shift 1;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
 done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_ENV="${ROOT_DIR}/postman/onpoint-dev.postman_environment.json"
DEFAULT_FILE="${ROOT_DIR}/documentation/test-data/CXGM_093B34DED53611F09127121AF9B02FBB.json"

ENV_PATH="${ENV_PATH:-$DEFAULT_ENV}"
FILE_PATH="${FILE_PATH:-$DEFAULT_FILE}"

get_env_value() {
  local key="$1"
  python3 - <<PY
import json
from pathlib import Path
p=Path("${ENV_PATH}")
if not p.exists():
    print("")
    raise SystemExit(0)
obj=json.loads(p.read_text())
vals={v.get("key"): v.get("value") for v in obj.get("values", [])}
print(vals.get("${key}", ""))
PY
}

if [[ -z "$BASE_URL" ]]; then
  BASE_URL="$(get_env_value ingestBaseUrl)"
fi
if [[ -z "$API_KEY" ]]; then
  API_KEY="$(get_env_value ingestApiKey)"
fi
if [[ -z "$PROVIDER_ID" ]]; then
  PROVIDER_ID="$(get_env_value providerId)"
fi

if [[ -z "$BASE_URL" ]]; then
  echo "Missing ingest base URL (set --base-url or ingestBaseUrl in Postman env)." >&2
  exit 1
fi

# Render Postman-style {{var}} in base URL
REGION_VAL="$(get_env_value region)"
INGEST_API_ID_VAL="$(get_env_value ingestApiId)"
INGEST_STAGE_VAL="$(get_env_value ingestStage)"
BASE_URL="${BASE_URL//\{\{region\}\}/${REGION_VAL}}"
BASE_URL="${BASE_URL//\{\{ingestApiId\}\}/${INGEST_API_ID_VAL}}"
BASE_URL="${BASE_URL//\{\{ingestStage\}\}/${INGEST_STAGE_VAL}}"

if [[ "$BASE_URL" != */ingest/telematics ]]; then
  BASE_URL="${BASE_URL%/}/ingest/telematics"
fi

if [[ -z "$API_KEY" || "$API_KEY" == "<API_KEY>" ]]; then
  API_KEY="$(aws apigateway get-api-keys --include-values --region us-east-1 --query "items[?name=='CEREBRUMX']|[0].value" --output text)"
  if [[ -z "$API_KEY" || "$API_KEY" == "None" ]]; then
    API_KEY="$(aws apigateway get-api-keys --include-values --region us-east-1 --query "items[?name=='cerebrumx-dev']|[0].value" --output text)"
  fi
fi

if [[ -z "$API_KEY" || "$API_KEY" == "None" ]]; then
  echo "Missing ingest API key (set --api-key or ensure CEREBRUMX key exists)." >&2
  exit 1
fi

if [[ -z "$PROVIDER_ID" ]]; then
  echo "Missing providerId (set --provider-id or providerId in Postman env)." >&2
  exit 1
fi

INGEST_URL="${BASE_URL}"

if [[ ! -f "$FILE_PATH" ]]; then
  echo "File not found: $FILE_PATH" >&2
  exit 1
fi

export FILE_PATH
export LIMIT
export PROVIDER_ID

if [[ "$DRY_RUN" == "true" ]]; then
  python3 - <<'PY'
import json
import os
from pathlib import Path

file_path = Path(os.environ["FILE_PATH"])
limit = os.environ.get("LIMIT")
limit = int(limit) if limit else None
provider_id = os.environ.get("PROVIDER_ID")

data = json.loads(file_path.read_text())
count = 0
for event in data:
    payload = dict(event)
    payload.setdefault("providerId", provider_id)
    print(json.dumps(payload))
    count += 1
    if limit and count >= limit:
        break
PY
  exit 0
fi

ok=0
failed=0
idx=0

while IFS= read -r payload; do
  idx=$((idx+1))
  http_code=$(curl -sS -o /tmp/ingest_body.json -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: ${API_KEY}" \
    -H "providerId: ${PROVIDER_ID}" \
    --data "$payload" \
    "$INGEST_URL" || true)
  if [[ "$http_code" == "200" || "$http_code" == "202" ]]; then
    ok=$((ok+1))
  else
    failed=$((failed+1))
    echo "FAILED[$idx] status=$http_code body=$(cat /tmp/ingest_body.json)" >&2
  fi
done < <(
  python3 - <<'PY'
import json
import os
from pathlib import Path

file_path = Path(os.environ["FILE_PATH"])
limit = os.environ.get("LIMIT")
limit = int(limit) if limit else None
provider_id = os.environ.get("PROVIDER_ID")

data = json.loads(file_path.read_text())
count = 0
for event in data:
    payload = dict(event)
    payload.setdefault("providerId", provider_id)
    print(json.dumps(payload))
    count += 1
    if limit and count >= limit:
        break
PY
)

echo "Ingest complete. ok=${ok} failed=${failed}"
if [[ "$failed" -ne 0 ]]; then
  exit 1
fi
