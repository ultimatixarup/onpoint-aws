#!/usr/bin/env python3
"""Single-file CerebrumX ingest helper.

Usage:
  python ingest_cerebrumx_trip_single.py <trip_file.json>

Optional:
  --limit N   Only ingest first N events
  --dry-run   Print payloads without sending

You can override config with env vars:
  INGEST_BASE_URL, INGEST_API_KEY, PROVIDER_ID
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, List

BASE_URL = "https://pxiwaan426.execute-api.us-east-1.amazonaws.com/v1"
API_KEY = "XJJ5SnRJ7p4GQnwHIIYwU64qDq0ZnJXl1aWmaMTg"
PROVIDER_ID = "test-provider"


def resolve_ingest_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    if base.endswith("/ingest/telematics"):
        return base
    return f"{base}/ingest/telematics"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest CerebrumX trip events")
    parser.add_argument("file", help="Path to CerebrumX JSON file")
    parser.add_argument("--limit", type=int, default=None, help="Only ingest first N events")
    parser.add_argument("--dry-run", action="store_true", help="Print payloads without sending")
    return parser.parse_args()


def build_headers(api_key: str, provider_id: str) -> Dict[str, str]:
    return {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "providerId": provider_id,
        "x-provider-id": provider_id,
    }


def post_json(url: str, headers: Dict[str, str], payload: Dict[str, Any]) -> int:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.getcode()
    except urllib.error.HTTPError as exc:
        return exc.code


def main() -> int:
    args = parse_args()

    base_url = os.getenv("INGEST_BASE_URL", BASE_URL)
    api_key = os.getenv("INGEST_API_KEY", API_KEY)
    provider_id = os.getenv("PROVIDER_ID", PROVIDER_ID)

    if not base_url or not api_key or not provider_id:
        print("Missing config: base URL, API key, or provider ID", file=sys.stderr)
        return 2

    ingest_url = resolve_ingest_url(base_url)

    events: List[Dict[str, Any]] = json.loads(open(args.file, "r", encoding="utf-8").read())
    if args.limit:
        events = events[: args.limit]

    headers = build_headers(api_key, provider_id)

    ok = 0
    failed = 0
    for idx, event in enumerate(events, start=1):
        payload = dict(event)
        payload.setdefault("providerId", provider_id)

        if args.dry_run:
            print(f"DRY_RUN[{idx}] {payload.get('cx_msg_id')}")
            continue

        status = post_json(ingest_url, headers, payload)
        if status in (200, 202):
            ok += 1
        else:
            failed += 1
            print(f"FAILED[{idx}] status={status}")

    print(f"Ingest complete. ok={ok} failed={failed} total={len(events)}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
