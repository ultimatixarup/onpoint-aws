#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <bucket> [--region us-east-1]" >&2
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

BUCKET_NAME="$1"
shift

REGION="us-east-1"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"; shift 2;;
    *)
      echo "Unknown arg: $1" >&2; usage; exit 2;;
  esac
done

if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" >/dev/null 2>&1; then
  bucket_region=$(aws s3api get-bucket-location --bucket "$BUCKET_NAME" --output text --query LocationConstraint 2>/dev/null || true)
  if [[ "$bucket_region" == "None" || -z "$bucket_region" ]]; then
    bucket_region="us-east-1"
  fi
  if [[ "$bucket_region" != "$REGION" ]]; then
    echo "Bucket exists in region $bucket_region (expected $REGION)" >&2
    exit 1
  fi
  exit 0
fi

if [[ "$REGION" == "us-east-1" ]]; then
  aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
else
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
fi

aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled \
  --region "$REGION"

aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
  --region "$REGION"

aws s3api put-bucket-ownership-controls \
  --bucket "$BUCKET_NAME" \
  --ownership-controls Rules=[{ObjectOwnership=BucketOwnerEnforced}] \
  --region "$REGION"

echo "$BUCKET_NAME"
