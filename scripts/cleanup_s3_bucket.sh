#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <bucket-name> [--region us-east-1]" >&2
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

REGION="${AWS_REGION:-us-east-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if ! AWS_PAGER="" aws s3api head-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null 2>&1; then
  echo "Bucket not found or inaccessible: $BUCKET"
  exit 0
fi

echo "Cleaning bucket: s3://$BUCKET"

versioning_status="$(AWS_PAGER="" aws s3api get-bucket-versioning --bucket "$BUCKET" --region "$REGION" --query 'Status' --output text 2>/dev/null || true)"
if [[ "$versioning_status" == "Enabled" ]]; then
  echo "Suspending versioning for bucket: $BUCKET"
  AWS_PAGER="" aws s3api put-bucket-versioning \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --versioning-configuration Status=Suspended >/dev/null
fi

# Delete current object versions (non-versioned buckets and latest objects)
AWS_PAGER="" aws s3 rm "s3://$BUCKET" --recursive --region "$REGION" >/dev/null || true

delete_versions() {
  local kind="$1"
  local query
  if [[ "$kind" == "Versions" ]]; then
    query='Versions[*].[Key,VersionId]'
  else
    query='DeleteMarkers[*].[Key,VersionId]'
  fi

  while true; do
    local rows
    rows="$(AWS_PAGER="" aws s3api list-object-versions --bucket "$BUCKET" --region "$REGION" --query "$query" --output text 2>/dev/null || true)"
    if [[ -z "$rows" || "$rows" == "None" ]]; then
      break
    fi

    while IFS=$'\t' read -r key version_id; do
      [[ -z "${key:-}" || -z "${version_id:-}" || "$key" == "None" || "$version_id" == "None" ]] && continue
      AWS_PAGER="" aws s3api delete-object \
        --bucket "$BUCKET" \
        --key "$key" \
        --version-id "$version_id" \
        --region "$REGION" >/dev/null || true
    done <<< "$rows"
  done
}

delete_versions "Versions"
delete_versions "DeleteMarkers"

echo "Bucket cleanup complete: s3://$BUCKET"
