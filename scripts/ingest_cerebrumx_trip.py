#!/usr/bin/env python3
"""Ingest CerebrumX trip events into the ingest API.

Defaults are read from postman/onpoint-dev.postman_environment.json:
- ingestBaseUrl
- ingestApiKey
- providerId

Usage:
  python scripts/ingest_cerebrumx_trip.py \
    --file documentation/test-data/CXGM_093B34DED53611F09127121AF9B02FBB.json

Optional args:
  --base-url    Override ingest base URL (e.g., https://.../v1)
  --api-key     Override API key
  --provider-id Override providerId
  --limit       Only ingest first N events
  --dry-run     Print payloads without sending
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

import requests

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = ROOT / "postman" / "onpoint-dev.postman_environment.json"
DEFAULT_FILE = ROOT / "documentation" / "test-data" / "CXGM_093B34DED53611F09127121AF9B02FBB.json"


def load_env(env_path: Path) -> Dict[str, str]:
    data = json.loads(env_path.read_text())
    return {v["key"]: v["value"] for v in data.get("values", [])}


def render_env_template(value: str, env: Dict[str, str]) -> str:
    rendered = value
    for key, env_val in env.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(env_val))
    return rendered


def resolve_ingest_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    if base.endswith("/ingest/telematics"):
        return base
    return f"{base}/ingest/telematics"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest CerebrumX trip events")
    parser.add_argument("--file", default=str(DEFAULT_FILE), help="Path to CerebrumX JSON file")
    parser.add_argument("--env", default=str(DEFAULT_ENV), help="Postman environment JSON path")
    parser.add_argument("--base-url", default=None, help="Ingest base URL (e.g., https://.../v1)")
    parser.add_argument("--api-key", default=None, help="Ingest API key")
    parser.add_argument("--provider-id", default=None, help="Provider ID")
    parser.add_argument("--limit", type=int, default=None, help="Only ingest first N events")
    parser.add_argument("--dry-run", action="store_true", help="Print payloads without sending")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    env = load_env(Path(args.env)) if Path(args.env).exists() else {}
    base_url = args.base_url or env.get("ingestBaseUrl")
    api_key = args.api_key or env.get("ingestApiKey")
    provider_id = args.provider_id or env.get("providerId")

    if not base_url:
        raise SystemExit("Missing ingest base URL (set --base-url or ingestBaseUrl in Postman env)")
    if not api_key:
        raise SystemExit("Missing ingest API key (set --api-key or ingestApiKey in Postman env)")
    if not provider_id:
        raise SystemExit("Missing providerId (set --provider-id or providerId in Postman env)")

    base_url = render_env_template(base_url, env)
    ingest_url = resolve_ingest_url(base_url)

    events: List[Dict[str, Any]] = json.loads(Path(args.file).read_text())
    if args.limit:
        events = events[: args.limit]

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }

    session = requests.Session()

    ok = 0
    failed = 0
    for idx, event in enumerate(events, start=1):
        payload = dict(event)
        payload.setdefault("providerId", provider_id)

        if args.dry_run:
            print(f"DRY_RUN[{idx}] {payload.get('cx_msg_id')}")
            continue

        resp = session.post(ingest_url, headers=headers, json=payload, timeout=20)
        if resp.status_code in (200, 202):
            ok += 1
        else:
            failed += 1
            print(f"FAILED[{idx}] status={resp.status_code} body={resp.text}")

    print(f"Ingest complete. ok={ok} failed={failed} total={len(events)}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
