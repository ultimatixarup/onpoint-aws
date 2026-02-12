import base64
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import boto3
from boto3.dynamodb.types import TypeDeserializer

try:
    from onpoint_common.vin_registry import resolve_vin_registry  # type: ignore
except Exception:
    def resolve_vin_registry(*args, **kwargs):
        return None

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_ddb = boto3.client("dynamodb")
_deserializer = TypeDeserializer()

GEOFENCE_EVENTS_TABLE = os.environ.get("GEOFENCE_EVENTS_TABLE")
GEOFENCE_STATE_TABLE = os.environ.get("GEOFENCE_STATE_TABLE")
VIN_REGISTRY_TABLE = os.environ.get("VIN_REGISTRY_TABLE")


def _resp(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,OPTIONS",
            "access-control-allow-headers": "content-type,authorization",
        },
        "body": json.dumps(body, default=str),
    }


def _ddb_deserialize(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _deserializer.deserialize(v) for k, v in item.items()}


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _get_caller_tenant_id(event: dict) -> Optional[str]:
    headers = event.get("headers") or {}
    tenant_header = headers.get("x-tenant-id") or headers.get("X-Tenant-Id") or headers.get("x-tenantId")
    if isinstance(tenant_header, str) and tenant_header.strip():
        return tenant_header.strip()

    query = event.get("queryStringParameters") or {}
    tenant_query = query.get("tenantId") or query.get("tenant_id")
    if isinstance(tenant_query, str) and tenant_query.strip():
        return tenant_query.strip()

    ctx = event.get("requestContext") or {}
    authorizer = ctx.get("authorizer") or {}
    claims = authorizer.get("claims") or {}
    if isinstance(claims, dict):
        tenant_id = claims.get("custom:tenantId") or claims.get("tenantId")
        if isinstance(tenant_id, str) and tenant_id.strip():
            return tenant_id.strip()
    jwt = authorizer.get("jwt") or {}
    jwt_claims = jwt.get("claims") or {}
    if isinstance(jwt_claims, dict):
        tenant_id = jwt_claims.get("custom:tenantId") or jwt_claims.get("tenantId")
        if isinstance(tenant_id, str) and tenant_id.strip():
            return tenant_id.strip()
    return None


def _resolve_vin_tenancy(vin: str, as_of: Optional[str]) -> Optional[dict]:
    if not VIN_REGISTRY_TABLE:
        return None
    try:
        return resolve_vin_registry(vin, as_of=as_of, table_name=VIN_REGISTRY_TABLE, ddb_client=_ddb)
    except Exception as exc:
        logger.warning("VIN registry lookup failed for vin=%s: %s", vin, exc)
        return None


def _authorize_vin(vin: str, tenant_id: Optional[str], as_of: Optional[str]) -> bool:
    if not VIN_REGISTRY_TABLE:
        return True
    if not tenant_id:
        return False
    record = _resolve_vin_tenancy(vin, as_of)
    if not record:
        record = _resolve_vin_tenancy(vin, None)
    if not record:
        return False
    return record.get("tenantId") == tenant_id


def _encode_token(key: Dict[str, Any]) -> str:
    return base64.urlsafe_b64encode(json.dumps(key).encode("utf-8")).decode("utf-8")


def _decode_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        return json.loads(raw)
    except Exception:
        return None


def _query_events(vin: str, tenant_id: str, frm: Optional[str], to: Optional[str], limit: int, next_token: Optional[str]) -> Dict[str, Any]:
    if not GEOFENCE_EVENTS_TABLE:
        return {"items": [], "nextToken": None}
    pk = f"TENANT#{tenant_id}#VIN#{vin}"
    start_key = _decode_token(next_token)
    expr_vals = {":pk": {"S": pk}}
    key_expr = "PK = :pk"
    if frm:
        key_expr += " AND SK >= :from"
        expr_vals[":from"] = {"S": f"TS#{frm}"}
    if to:
        key_expr += " AND SK <= :to"
        expr_vals[":to"] = {"S": f"TS#{to}#"}

    params = {
        "TableName": GEOFENCE_EVENTS_TABLE,
        "KeyConditionExpression": key_expr,
        "ExpressionAttributeValues": expr_vals,
        "ScanIndexForward": False,
        "Limit": limit,
    }
    if start_key:
        params["ExclusiveStartKey"] = start_key
    resp = _ddb.query(**params)
    items = [_ddb_deserialize(it) for it in resp.get("Items") or []]
    last_key = resp.get("LastEvaluatedKey")
    return {"items": items, "nextToken": _encode_token(last_key) if last_key else None}


def _scan_events_by_trip(tenant_id: str, trip_id: str, frm: Optional[str], to: Optional[str], limit: int, next_token: Optional[str]) -> Dict[str, Any]:
    if not GEOFENCE_EVENTS_TABLE:
        return {"items": [], "nextToken": None}
    start_key = _decode_token(next_token)
    expr_vals = {":tripId": {"S": trip_id}, ":tenant": {"S": f"TENANT#{tenant_id}"}}
    filter_expr = "tripId = :tripId AND begins_with(PK, :tenant)"
    params = {
        "TableName": GEOFENCE_EVENTS_TABLE,
        "FilterExpression": filter_expr,
        "ExpressionAttributeValues": expr_vals,
        "Limit": limit,
    }
    if start_key:
        params["ExclusiveStartKey"] = start_key
    resp = _ddb.scan(**params)
    items = [_ddb_deserialize(it) for it in resp.get("Items") or []]
    last_key = resp.get("LastEvaluatedKey")
    return {"items": items, "nextToken": _encode_token(last_key) if last_key else None}


def _get_geofence_state(vin: str, tenant_id: Optional[str]) -> List[Dict[str, Any]]:
    if not GEOFENCE_STATE_TABLE:
        return []
    resp = _ddb.query(
        TableName=GEOFENCE_STATE_TABLE,
        KeyConditionExpression="PK = :pk",
        ExpressionAttributeValues={":pk": {"S": f"VIN#{vin}"}},
    )
    items = [_ddb_deserialize(it) for it in resp.get("Items") or []]
    if tenant_id:
        items = [it for it in items if it.get("tenantId") == tenant_id]
    return items


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    path = event.get("rawPath") or event.get("path") or ""
    path_params = event.get("pathParameters") or {}
    query = event.get("queryStringParameters") or {}

    tenant_id = _get_caller_tenant_id(event)
    vin = path_params.get("vin")
    trip_id = path_params.get("tripId")

    if "/vehicles/" in path and path.endswith("/geofence-events"):
        if not vin or not _authorize_vin(vin, tenant_id, query.get("from")):
            return _resp(403, {"error": "Forbidden"})
        limit = int(query.get("limit") or 100)
        data = _query_events(vin, tenant_id or "", query.get("from"), query.get("to"), limit, query.get("nextToken"))
        return _resp(200, data)

    if "/vehicles/" in path and path.endswith("/geofence-state"):
        if not vin or not _authorize_vin(vin, tenant_id, None):
            return _resp(403, {"error": "Forbidden"})
        items = _get_geofence_state(vin, tenant_id)
        return _resp(200, {"items": items})

    if "/trips/" in path and path.endswith("/geofence-events"):
        if not trip_id or not tenant_id:
            return _resp(400, {"error": "tripId and tenantId required"})
        limit = int(query.get("limit") or 100)
        data = _scan_events_by_trip(tenant_id, trip_id, query.get("from"), query.get("to"), limit, query.get("nextToken"))
        return _resp(200, data)

    return _resp(404, {"error": "Not Found"})
