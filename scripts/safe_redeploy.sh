#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
	echo "Usage: $0 [bucket] [--region us-east-1] [--stack-name onpoint-dev] [--env dev] [--project-name onpoint] [--prefix cfn]" >&2
	exit 0
fi

BUCKET="${1:-onpoint-dev-cfn-artifacts}"
shift || true

REGION="us-east-1"
STACK_NAME="onpoint-dev"
ENV="dev"
PROJECT_NAME="onpoint"
PREFIX="cfn"

while [[ $# -gt 0 ]]; do
	case "$1" in
		--region)
			REGION="$2"; shift 2;;
		--stack-name)
			STACK_NAME="$2"; shift 2;;
		--env)
			ENV="$2"; shift 2;;
		--project-name)
			PROJECT_NAME="$2"; shift 2;;
		--prefix)
			PREFIX="$2"; shift 2;;
		*)
			echo "Unknown arg: $1" >&2; exit 2;;
	esac
done

"$ROOT_DIR/scripts/bootstrap_artifacts_bucket.sh" "$BUCKET" --region "$REGION" >/dev/null
"$ROOT_DIR/scripts/deploy_cfn.sh" "$BUCKET" --region "$REGION" --stack-name "$STACK_NAME" --env "$ENV" --project-name "$PROJECT_NAME" --prefix "$PREFIX"
