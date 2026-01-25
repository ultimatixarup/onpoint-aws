#!/usr/bin/env python3
import argparse
import time
from typing import Dict, Any

import boto3


def _parse_args():
    parser = argparse.ArgumentParser(description="Backfill VIN registry TenantFleetIndexV2 keys")
    parser.add_argument("--table", required=True, help="VIN registry table name")
    parser.add_argument("--region", default="us-east-1")
    parser.add_argument("--page-size", type=int, default=200)
    parser.add_argument("--sleep", type=float, default=0.0, help="Sleep between writes")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def _compute_keys(item: Dict[str, Any]):
    vin = (item.get("vin") or "").strip()
    tenant_id = (item.get("tenantId") or "").strip()
    fleet_id = (item.get("fleetId") or "").strip()
    if not vin or not tenant_id or not fleet_id:
        return None
    gsi2pk = f"TENANT#{tenant_id}#FLEET#{fleet_id}"
    gsi2sk = f"VIN#{vin}"
    return gsi2pk, gsi2sk


def main():
    args = _parse_args()
    ddb = boto3.client("dynamodb", region_name=args.region)

    scanned = 0
    updated = 0
    last_key = None

    while True:
        params = {
            "TableName": args.table,
            "Limit": args.page_size,
        }
        if last_key:
            params["ExclusiveStartKey"] = last_key

        resp = ddb.scan(**params)
        items = resp.get("Items") or []

        for it in items:
            scanned += 1
            gsi2 = _compute_keys(
                {
                    "vin": it.get("vin", {}).get("S"),
                    "tenantId": it.get("tenantId", {}).get("S"),
                    "fleetId": it.get("fleetId", {}).get("S"),
                }
            )
            if not gsi2:
                continue
            gsi2pk, gsi2sk = gsi2

            existing_pk = (it.get("GSI2PK") or {}).get("S")
            existing_sk = (it.get("GSI2SK") or {}).get("S")
            if existing_pk == gsi2pk and existing_sk == gsi2sk:
                continue

            if args.dry_run:
                updated += 1
                continue

            ddb.update_item(
                TableName=args.table,
                Key={"PK": it["PK"], "SK": it["SK"]},
                UpdateExpression="SET GSI2PK=:pk, GSI2SK=:sk",
                ExpressionAttributeValues={
                    ":pk": {"S": gsi2pk},
                    ":sk": {"S": gsi2sk},
                },
            )
            updated += 1
            if args.sleep:
                time.sleep(args.sleep)

        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break

    print(f"Scanned: {scanned}, Updated: {updated}")


if __name__ == "__main__":
    main()
