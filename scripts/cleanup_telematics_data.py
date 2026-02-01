#!/usr/bin/env python3
"""Cleanup telematics/trip-related DynamoDB data for a given environment.

Deletes all items from the following tables (by name prefix):
- telemetry-events, trips, trip-summary, geofence-events

Usage:
  python scripts/cleanup_telematics_data.py --env dev --region us-east-1 --confirm

Notes:
- This does NOT delete tables, only items.
- Use --confirm to actually delete.
"""
from __future__ import annotations

import argparse
import sys
from typing import Iterable

import boto3

TABLE_SUFFIXES = [
    "telemetry-events",
    "trips",
    "trip-summary",
    "geofence-events",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Cleanup telematics DynamoDB data")
    parser.add_argument("--env", required=True, help="Environment name (e.g., dev)")
    parser.add_argument("--region", default="us-east-1", help="AWS region")
    parser.add_argument("--confirm", action="store_true", help="Actually perform deletes (required).")
    return parser.parse_args()


def table_name(env: str, suffix: str) -> str:
    return f"onpoint-{env}-{suffix}"


def iter_keys(table) -> Iterable[dict]:
    scan_kwargs = {
        "ProjectionExpression": "#pk, #sk",
        "ExpressionAttributeNames": {"#pk": "PK", "#sk": "SK"},
    }
    while True:
        resp = table.scan(**scan_kwargs)
        for item in resp.get("Items", []):
            yield {"PK": item["PK"], "SK": item["SK"]}
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
        scan_kwargs["ExclusiveStartKey"] = last_key


def delete_all_items(table) -> int:
    deleted = 0
    with table.batch_writer() as batch:
        for key in iter_keys(table):
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
            deleted = delete_all_items(table)
        except Exception as exc:
            print(f"Failed to delete from {name}: {exc}")
            continue
        total_deleted += deleted
        print(f"{name}: deleted {deleted}")

    print(f"Total deleted: {total_deleted}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
