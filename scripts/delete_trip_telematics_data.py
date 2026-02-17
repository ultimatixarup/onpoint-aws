#!/usr/bin/env python3
"""Delete telemetry/trip data for a specific trip ID.

Deletes matching items from these tables:
- onpoint-<env>-telemetry-events
- onpoint-<env>-trips
- onpoint-<env>-trip-summary

Usage:
  python scripts/delete_trip_telematics_data.py --env dev --region us-east-1 --trip-id <TRIP_ID> --confirm
"""
from __future__ import annotations

import argparse
from typing import Any, Dict, Iterable, List

import boto3

TABLE_SUFFIXES = [
    "telemetry-events",
    "trips",
    "trip-summary",
]

TRIP_KEYS = {
    "tripId",
    "trip_id",
    "tripID",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Delete telematics data for a trip")
    parser.add_argument("--env", default="dev", help="Environment name (default: dev)")
    parser.add_argument("--region", default="us-east-1", help="AWS region")
    parser.add_argument("--trip-id", required=True, help="Trip ID to delete")
    parser.add_argument("--confirm", action="store_true", help="Actually perform deletes")
    return parser.parse_args()


def table_name(env: str, suffix: str) -> str:
    return f"onpoint-{env}-{suffix}"


def iter_items(table) -> Iterable[Dict[str, Any]]:
    scan_kwargs: Dict[str, Any] = {}
    while True:
        resp = table.scan(**scan_kwargs)
        for item in resp.get("Items", []):
            yield item
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
        scan_kwargs["ExclusiveStartKey"] = last_key


def item_matches_trip(item: Dict[str, Any], trip_id: str) -> bool:
    for key in TRIP_KEYS:
        value = item.get(key)
        if isinstance(value, str) and value == trip_id:
            return True
    for value in item.values():
        if not isinstance(value, str):
            continue
        if value == trip_id:
            return True
        if f"TRIP#{trip_id}" in value:
            return True
    return False


def build_key(item: Dict[str, Any], key_names: List[str]) -> Dict[str, Any] | None:
    key: Dict[str, Any] = {}
    for name in key_names:
        if name not in item:
            return None
        key[name] = item[name]
    return key


def delete_trip_items(table, trip_id: str, confirm: bool) -> int:
    deleted = 0
    key_names = [k["AttributeName"] for k in table.key_schema]
    with table.batch_writer() as batch:
        for item in iter_items(table):
            if not item_matches_trip(item, trip_id):
                continue
            key = build_key(item, key_names)
            if not key:
                continue
            if confirm:
                batch.delete_item(Key=key)
            deleted += 1
    return deleted


def main() -> int:
    args = parse_args()
    if not args.confirm:
        print("Refusing to delete without --confirm")
        return 1

    ddb = boto3.resource("dynamodb", region_name=args.region)
    total_deleted = 0

    for suffix in TABLE_SUFFIXES:
        name = table_name(args.env, suffix)
        table = ddb.Table(name)
        try:
            deleted = delete_trip_items(table, args.trip_id, confirm=True)
        except Exception as exc:
            print(f"Failed to delete from {name}: {exc}")
            continue
        total_deleted += deleted
        print(f"{name}: deleted {deleted}")

    print(f"Total deleted: {total_deleted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
