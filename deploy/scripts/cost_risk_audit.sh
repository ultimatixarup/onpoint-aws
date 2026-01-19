#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${1:-}"
if [[ -z "$CONFIG_FILE" ]]; then
  echo "Usage: $0 <config_file>" >&2
  exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

: "${REGION:?Missing REGION}"

echo "== CloudFormation Stacks =="
aws cloudformation list-stacks \
  --region "$REGION" \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE ROLLBACK_COMPLETE \
  --query "StackSummaries[].{Name:StackName,Status:StackStatus,Updated:LastUpdatedTime}" \
  --output table

echo "== Kinesis Streams =="
aws kinesis list-streams \
  --region "$REGION" \
  --query "StreamNames" \
  --output table

echo "== SQS Queues =="
aws sqs list-queues \
  --region "$REGION" \
  --query "QueueUrls" \
  --output table

echo "== DynamoDB Tables =="
aws dynamodb list-tables \
  --region "$REGION" \
  --query "TableNames" \
  --output table

echo "== API Gateway (HTTP/WebSocket APIs) =="
aws apigatewayv2 get-apis \
  --region "$REGION" \
  --query "Items[].{Name:Name,ProtocolType:ProtocolType,ApiId:ApiId}" \
  --output table

echo "== Lambda Functions =="
aws lambda list-functions \
  --region "$REGION" \
  --query "Functions[].{Name:FunctionName,Runtime:Runtime,LastModified:LastModified}" \
  --output table
