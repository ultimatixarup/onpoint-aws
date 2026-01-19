#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <Env>" >&2
  exit 1
fi

ENV="$1"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_FILE="$ROOT_DIR/deploy/config/${ENV}.env"

REGION=""
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
  REGION="${REGION:-}"
fi

REGION="${REGION:-us-east-1}"

PREFIX="onpoint-${ENV}-"

TABLES=$(aws dynamodb list-tables \
  --region "$REGION" \
  --query "TableNames" \
  --output text)

MATCHED=()
for t in $TABLES; do
  if [[ "$t" == ${PREFIX}* ]] || [[ "$t" == "dev-vehicle-registry" ]]; then
    MATCHED+=("$t")
  fi
done

if [[ ${#MATCHED[@]} -eq 0 ]]; then
  echo "No matching DynamoDB tables found for Env=$ENV in region $REGION."
  exit 0
fi

echo "The following DynamoDB tables will be deleted (region: $REGION):"
for t in "${MATCHED[@]}"; do
  echo "  - $t"
done

echo "Type DELETE to continue:"
read -r CONFIRM
if [[ "$CONFIRM" != "DELETE" ]]; then
  echo "Aborted."
  exit 1
fi

for t in "${MATCHED[@]}"; do
  echo "Deleting table: $t"
  aws dynamodb delete-table --region "$REGION" --table-name "$t" > /dev/null
  aws dynamodb wait table-not-exists --region "$REGION" --table-name "$t"
  echo "Deleted: $t"
done
