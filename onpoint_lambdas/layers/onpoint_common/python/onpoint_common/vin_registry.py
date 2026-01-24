import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import boto3

try:
    from onpoint_common.timeutil import parse_iso, utc_now_iso  # type: ignore
except Exception:
    def utc_now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def parse_iso(ts: str) -> Optional[datetime]:
        if not ts:
            return None
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            return None


def _ddb_unmarshal_value(value: dict) -> Any:
    if "S" in value:
        return value["S"]
    if "N" in value:
        num = value["N"]
        try:
            return int(num) if num.isdigit() else float(num)
        except Exception:
            return num
    if "BOOL" in value:
        return value["BOOL"]
    if "NULL" in value:
        return None
    if "M" in value:
        return {k: _ddb_unmarshal_value(v) for k, v in value["M"].items()}
    if "L" in value:
        return [_ddb_unmarshal_value(v) for v in value["L"]]
    return value


def _ddb_unmarshal_item(item: dict) -> dict:
    return {k: _ddb_unmarshal_value(v) for k, v in item.items()}


def _normalize_as_of(as_of: Optional[str]) -> str:
    if not as_of:
        return utc_now_iso()
    if isinstance(as_of, str):
        parsed = parse_iso(as_of)
        return parsed.isoformat() if parsed else utc_now_iso()
    return utc_now_iso()


def resolve_vin_registry(
    vin: str,
    *,
    as_of: Optional[str] = None,
    table_name: Optional[str] = None,
    ddb_client=None,
) -> Optional[Dict[str, Any]]:
    """
    Resolve VIN tenancy from registry.

    Table schema:
      PK = VIN#{vin}
      SK = EFFECTIVE_FROM#{iso}
    """
    if not vin or not isinstance(vin, str):
        return None

    table = table_name or os.environ.get("VIN_REGISTRY_TABLE")
    if not table:
        return None

    as_of_iso = _normalize_as_of(as_of)
    pk = f"VIN#{vin}"
    sk = f"EFFECTIVE_FROM#{as_of_iso}"

    ddb = ddb_client or boto3.client("dynamodb")
    last_key = None

    while True:
        params = {
            "TableName": table,
            "KeyConditionExpression": "PK = :pk AND SK <= :sk",
            "ExpressionAttributeValues": {
                ":pk": {"S": pk},
                ":sk": {"S": sk},
            },
            "ScanIndexForward": False,
            "Limit": 10,
        }
        if last_key:
            params["ExclusiveStartKey"] = last_key

        resp = ddb.query(**params)
        items = resp.get("Items") or []
        for item in items:
            record = _ddb_unmarshal_item(item)
            effective_to = record.get("effectiveTo")
            if effective_to:
                parsed_to = parse_iso(effective_to)
                parsed_as_of = parse_iso(as_of_iso)
                if parsed_to and parsed_as_of and parsed_to < parsed_as_of:
                    continue
            return record

        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            return None
