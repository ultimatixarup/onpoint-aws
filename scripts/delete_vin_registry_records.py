#!/usr/bin/env python3
"""Delete VIN registry records for VINs listed in a tenancy setup file."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

import boto3

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "documentation" / "test-data" / "tenancy-setup.sd-humane.json"
ENV_PATH = ROOT / "postman" / "onpoint-dev.postman_environment.json"


def _load_env() -> dict:
    env = json.loads(ENV_PATH.read_text())
    return {v["key"]: v["value"] for v in env.get("values", [])}


def _iter_vin_keys(table, vin: str) -> Iterable[dict]:
    pk = f"VIN#{vin}"
    resp = table.query(KeyConditionExpression=boto3.dynamodb.conditions.Key("PK").eq(pk))
    for item in resp.get("Items", []):
        yield {"PK": item["PK"], "SK": item["SK"]}
    last = resp.get("LastEvaluatedKey")
    while last:
        resp = table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key("PK").eq(pk),
            ExclusiveStartKey=last,
        )
        for item in resp.get("Items", []):
            yield {"PK": item["PK"], "SK": item["SK"]}
        last = resp.get("LastEvaluatedKey")


def main() -> int:
    parser = argparse.ArgumentParser(description="Delete VIN registry records for VINs in a tenancy setup file")
    parser.add_argument("--env", default="dev", help="Environment name (default: dev)")
    parser.add_argument("--region", default=None, help="AWS region (default from Postman env)")
    parser.add_argument("--data", default=str(DEFAULT_DATA), help="Path to tenancy setup JSON")
    args = parser.parse_args()

    env = _load_env()
    region = args.region or env.get("region") or "us-east-1"
    table_name = f"onpoint-{args.env}-vin-registry"

    data = json.loads(Path(args.data).read_text())
    vins = [v["vin"] for v in data.get("vehicles", [])]

    ddb = boto3.resource("dynamodb", region_name=region)
    table = ddb.Table(table_name)

    total_deleted = 0
    for vin in vins:
        keys = list(_iter_vin_keys(table, vin))
        if not keys:
            print(f"No records found for VIN {vin}")
            continue
        with table.batch_writer() as batch:
            for key in keys:
                batch.delete_item(Key=key)
                total_deleted += 1
        print(f"Deleted {len(keys)} records for VIN {vin}")

    print(f"Total deleted: {total_deleted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
