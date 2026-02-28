#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: scripts/setup_aws_profiles.sh [--region us-east-1] [--mode configure|sso]

Creates/updates AWS CLI named profiles for dev, test, prod.

Modes:
  configure  -> runs `aws configure --profile <name>` interactively for each profile
  sso        -> runs `aws configure sso --profile <name>` interactively for each profile

Examples:
  scripts/setup_aws_profiles.sh
  scripts/setup_aws_profiles.sh --mode sso --region us-east-1
EOF
}

REGION="us-east-1"
MODE="configure"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ "$MODE" != "configure" && "$MODE" != "sso" ]]; then
  echo "Invalid --mode '$MODE' (expected configure|sso)" >&2
  exit 2
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI not found in PATH" >&2
  exit 1
fi

configure_profile() {
  local profile="$1"
  if [[ "$MODE" == "sso" ]]; then
    echo "\nConfiguring SSO profile: $profile"
    aws configure sso --profile "$profile"
  else
    echo "\nConfiguring access-key profile: $profile"
    aws configure --profile "$profile"
  fi

  aws configure set region "$REGION" --profile "$profile"
  aws configure set output json --profile "$profile"
}

for p in dev test prod; do
  configure_profile "$p"
done

echo "\nConfigured profiles: dev, test, prod"
echo "\nVerifying identity for each profile..."
for p in dev test prod; do
  echo "-- $p"
  if aws sts get-caller-identity --profile "$p" --query 'Account' --output text >/dev/null 2>&1; then
    aws sts get-caller-identity --profile "$p" --query '[Account,Arn]' --output text
  else
    echo "Unable to call sts for profile '$p' yet (credentials/session may still be needed)."
    if [[ "$MODE" == "sso" ]]; then
      echo "Run: aws sso login --profile $p"
    fi
  fi
done
