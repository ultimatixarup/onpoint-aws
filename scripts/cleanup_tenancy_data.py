#!/usr/bin/env python3
"""Cleanup tenancy-related DynamoDB data for a given environment.

Deletes all items from the following tables (by name prefix):
- tenants, customers, fleets, vehicles, drivers, driver-assignments,
  vin-registry, audit-log, idempotency

Usage:
  python scripts/cleanup_tenancy_data.py --env dev --region us-east-1 --confirm

Notes:
- This does NOT delete tables, only items.
- This does NOT touch Cognito users.
"""

from __future__ import annotations

import argparse
import sys
from typing import Iterable, List

import boto3

TABLE_SUFFIXES = [
    "tenants",
    "customers",
    "fleets",
    "vehicles",
    "drivers",
    "driver-assignments",
    "vin-registry",
    "audit-log",
    "idempotency",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Cleanup tenancy-related DynamoDB data")
    parser.add_argument("--env", required=True, help="Environment name (e.g., dev)")
    parser.add_argument("--region", default="us-east-1", help="AWS region")
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Actually perform deletes (required).",
    )
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
        print("Refusing to run without --confirm.")
        return 2

    ddb = boto3.resource("dynamodb", region_name=args.region)

    tables: List[str] = [table_name(args.env, s) for s in TABLE_SUFFIXES]
    print("Target tables:")
    for t in tables:
        print(f"- {t}")

    total_deleted = 0
    for name in tables:
        table = ddb.Table(name)
        try:
            deleted = delete_all_items(table)
            total_deleted += deleted
            print(f"Deleted {deleted} items from {name}")
        except Exception as exc:
            print(f"Error deleting from {name}: {exc}")

    print(f"Total deleted: {total_deleted}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
