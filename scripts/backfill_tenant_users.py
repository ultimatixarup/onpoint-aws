#!/usr/bin/env python3
import argparse
from datetime import datetime, timezone
from typing import Dict, List, Optional

import boto3
from boto3.dynamodb.types import TypeSerializer


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Backfill tenant users into DynamoDB from Cognito.")
    p.add_argument("--user-pool-id", required=True)
    p.add_argument("--users-table", required=True)
    p.add_argument("--region", default="us-east-1")
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


def attr_map(attrs: List[Dict[str, str]]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for a in attrs or []:
        name = a.get("Name")
        val = a.get("Value")
        if isinstance(name, str) and isinstance(val, str):
            out[name] = val
    return out


def main() -> int:
    args = parse_args()
    cognito = boto3.client("cognito-idp", region_name=args.region)
    ddb = boto3.client("dynamodb", region_name=args.region)
    serializer = TypeSerializer()

    now = datetime.now(timezone.utc).isoformat()
    pagination_token: Optional[str] = None
    total = 0
    written = 0

    while True:
        params = {"UserPoolId": args.user_pool_id, "Limit": 60}
        if pagination_token:
            params["PaginationToken"] = pagination_token
        resp = cognito.list_users(**params)
        users = resp.get("Users") or []

        for user in users:
            username = user.get("Username")
            attrs = attr_map(user.get("Attributes") or [])
            tenant_id = attrs.get("custom:tenantId")
            email = attrs.get("email") or username
            groups: List[str] = []

            if not tenant_id or not username:
                continue

            item = {
                "PK": f"TENANT#{tenant_id}",
                "SK": f"USER#{username}",
                "tenantId": tenant_id,
                "userId": username,
                "email": email,
                "groups": groups,
                "createdAt": now,
                "updatedAt": now,
                "entityType": "USER",
            }
            total += 1

            if args.dry_run:
                continue

            ddb.put_item(
                TableName=args.users_table,
                Item={k: serializer.serialize(v) for k, v in item.items()},
            )
            written += 1

        pagination_token = resp.get("PaginationToken")
        if not pagination_token:
            break

    print(f"Discovered {total} users with tenantId; wrote {written} records to {args.users_table}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
