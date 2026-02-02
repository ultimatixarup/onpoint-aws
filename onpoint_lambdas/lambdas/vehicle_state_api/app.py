# ============================================================
# onpoint-dev-vehicle-state-api
# API Gateway (REST API) -> Lambda -> DynamoDB (Vehicle State table)
#
# Endpoints:
#   GET /vehicles/{vin}/latest-state
#   GET /fleets/{fleetId}/vehicles/state?range=...|from=...&to=...
# ============================================================

import os
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

import boto3

try:
    from onpoint_common.vin_registry import resolve_vin_registry  # type: ignore
except Exception:
    def resolve_vin_registry(*args, **kwargs):
        return None

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ddb = boto3.client("dynamodb")

BUILD_ID = "2026-02-01T00:00:00Z"

VEHICLE_STATE_TABLE = os.environ.get("VEHICLE_STATE_TABLE", "onpoint-dev-vehicle-state")
VIN_REGISTRY_TABLE = os.environ.get("VIN_REGISTRY_TABLE")
VIN_TENANT_FLEET_INDEX = os.environ.get("VIN_TENANT_FLEET_INDEX")


# -----------------------------
# Response / parsing helpers
# -----------------------------

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


def _parse_iso(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
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


# -----------------------------
# Auth helpers
# -----------------------------

def _get_caller_tenant_id(event: dict) -> Optional[str]:
    headers = event.get("headers") or {}
    tenant_header = headers.get("x-tenant-id") or headers.get("X-Tenant-Id") or headers.get("x-tenantId")
    if isinstance(tenant_header, str) and tenant_header.strip():
        return tenant_header.strip()

    mv_headers = event.get("multiValueHeaders") or {}
    mv_vals = mv_headers.get("x-tenant-id") or mv_headers.get("X-Tenant-Id") or mv_headers.get("x-tenantId") or []
    if mv_vals and isinstance(mv_vals, list):
        for val in mv_vals:
            if isinstance(val, str) and val.strip():
                return val.strip()

    query = event.get("queryStringParameters") or {}
    tenant_query = query.get("tenantId") or query.get("tenant_id")
    if isinstance(tenant_query, str) and tenant_query.strip():
        return tenant_query.strip()

    mv_query = event.get("multiValueQueryStringParameters") or {}
    mv_vals = mv_query.get("tenantId") or mv_query.get("tenant_id") or []
    if mv_vals and isinstance(mv_vals, list):
        for val in mv_vals:
            if isinstance(val, str) and val.strip():
                return val.strip()

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
    identity = ctx.get("identity") or {}
    tenant_id = identity.get("apiKey") or identity.get("apiKeyId")
    if isinstance(tenant_id, str) and tenant_id.strip():
        return tenant_id.strip()
    return None


def _resolve_vin_tenancy(vin: str, as_of: Optional[str]) -> Optional[dict]:
    if not VIN_REGISTRY_TABLE:
        logger.warning("VIN_REGISTRY_TABLE not configured; skipping tenancy enforcement.")
        return None
    try:
        return resolve_vin_registry(vin, as_of=as_of, table_name=VIN_REGISTRY_TABLE, ddb_client=ddb)
    except Exception as exc:
        logger.error(f"VIN registry lookup failed for vin={vin}: {exc}")
        return None


def _get_role_from_headers(headers: Dict[str, str]) -> Optional[str]:
    role = headers.get("x-role") or headers.get("x-roles")
    if isinstance(role, str) and role.strip():
        return role.strip().lower()
    return None


def _authorize_vin(vin: str, tenant_id: Optional[str], as_of: Optional[str], role: Optional[str] = None) -> bool:
    if role == "admin":
        return True
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


# -----------------------------
# Fleet helpers
# -----------------------------

def _record_active(record: dict, as_of: datetime) -> bool:
    ef = _parse_iso(record.get("effectiveFrom"))
    et = _parse_iso(record.get("effectiveTo"))
    if ef and ef > as_of:
        return False
    if et and et < as_of:
        return False
    return True


def _is_missing_index_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "validationexception" in msg and "index" in msg and ("not found" in msg or "does not exist" in msg)


def _ddb_query_all(params: Dict[str, Any]) -> List[dict]:
    items: List[dict] = []
    last_key = None
    while True:
        if last_key:
            params["ExclusiveStartKey"] = last_key
        resp = ddb.query(**params)
        for it in resp.get("Items") or []:
            items.append(_ddb_unmarshal_item(it))
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return items


def _list_vins_for_fleet(tenant_id: str, fleet_id: str) -> List[str]:
    if not VIN_REGISTRY_TABLE:
        return []
    pk = f"TENANT#{tenant_id}#FLEET#{fleet_id}"
    params: Dict[str, Any] = {}
    items: List[dict] = []
    missing_index = False
    if VIN_TENANT_FLEET_INDEX:
        params = {
            "TableName": VIN_REGISTRY_TABLE,
            "IndexName": VIN_TENANT_FLEET_INDEX,
            "KeyConditionExpression": "GSI2PK = :pk",
            "ExpressionAttributeValues": {":pk": {"S": pk}},
        }
        try:
            items = _ddb_query_all(params)
        except Exception as exc:
            if _is_missing_index_error(exc):
                logger.warning(f"VIN registry index missing ({VIN_TENANT_FLEET_INDEX}); falling back to TenantIndex")
                missing_index = True
            else:
                raise
    if missing_index:
        pk = f"TENANT#{tenant_id}"
        params = {
            "TableName": VIN_REGISTRY_TABLE,
            "IndexName": "TenantIndex",
            "KeyConditionExpression": "GSI1PK = :pk",
            "ExpressionAttributeValues": {":pk": {"S": pk}},
        }
        items = _ddb_query_all(params)
    now = datetime.now(timezone.utc)
    vins = []
    for it in items:
        if _record_active(it, now):
            if not VIN_TENANT_FLEET_INDEX and it.get("fleetId") != fleet_id:
                continue
            vin = it.get("vin")
            if not vin:
                gsi2 = it.get("GSI2SK") or ""
                if isinstance(gsi2, str) and gsi2.startswith("VIN#"):
                    vin = gsi2.split("VIN#", 1)[1]
            if isinstance(vin, str) and vin.strip():
                vins.append(vin.strip())
    return list(dict.fromkeys(vins))


def _resolve_range(qs: Dict[str, Any]) -> Tuple[Optional[datetime], Optional[datetime]]:
    range_key = (qs.get("range") or "").strip().lower()
    now = datetime.now(timezone.utc)

    if range_key == "today":
        return _utc_start_of_day(now), now
    if range_key == "week":
        start = _utc_start_of_day(now) - timedelta(days=now.weekday())
        return start, now
    if range_key == "month":
        start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        return start, now
    if range_key == "year":
        start = datetime(now.year, 1, 1, tzinfo=timezone.utc)
        return start, now

    frm = _parse_iso(qs.get("from"))
    to = _parse_iso(qs.get("to"))
    if frm or to:
        return frm, to

    return _utc_start_of_day(now), now


def _utc_start_of_day(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)


# -----------------------------
# DynamoDB access
# -----------------------------

def _get_vehicle_state(vin: str) -> Optional[dict]:
    pk = f"VEHICLE#{vin}"
    sk = "STATE"
    resp = ddb.get_item(TableName=VEHICLE_STATE_TABLE, Key={"PK": {"S": pk}, "SK": {"S": sk}})
    item = resp.get("Item")
    if not item:
        return None
    return _ddb_unmarshal_item(item)


# -----------------------------
# Handler
# -----------------------------

def _is_fleet_vehicle_state_route(resource: str, path: str) -> bool:
    if resource == "/fleets/{fleetId}/vehicles/state":
        return True
    return bool(path and path.startswith("/fleets/") and path.endswith("/vehicles/state"))


def _is_vehicle_state_route(resource: str, path: str) -> bool:
    if resource == "/vehicles/{vin}/latest-state":
        return True
    return bool(path and path.startswith("/vehicles/") and path.endswith("/latest-state"))


def lambda_handler(event, context):
    request_id = getattr(context, "aws_request_id", "unknown") if context else "unknown"

    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    path_params = event.get("pathParameters") or {}
    query = event.get("queryStringParameters") or {}
    vin = path_params.get("vin")
    fleet_id = path_params.get("fleetId")
    resource = event.get("resource", "") or ""
    path = event.get("path") or event.get("rawPath") or ""

    if _is_vehicle_state_route(resource, path):
        route_type = "VEHICLE_STATE"
    elif _is_fleet_vehicle_state_route(resource, path):
        route_type = "FLEET_VEHICLE_STATE"
    else:
        return _resp(404, {"error": "Not Found"})

    logger.info(
        json.dumps(
            {
                "buildId": BUILD_ID,
                "requestId": request_id,
                "route": route_type,
                "vin": vin,
                "fleetId": fleet_id,
            }
        )
    )

    vin_path = (vin or "").strip()
    fleet_id_path = (fleet_id or "").strip()
    tenant_id = _get_caller_tenant_id(event)
    role = _get_role_from_headers(event.get("headers") or {})

    if route_type == "VEHICLE_STATE":
        if not vin_path:
            return _resp(400, {"error": "vin is required"})
        state = _get_vehicle_state(vin_path)
        if not state:
            return _resp(404, {"error": "Vehicle state not found"})
        if not _authorize_vin(vin_path, tenant_id, state.get("lastEventTime"), role):
            return _resp(403, {"error": "Forbidden"})
        return _resp(200, state)

    if route_type == "FLEET_VEHICLE_STATE":
        if not fleet_id_path and path:
            parts = [p for p in path.split("/") if p]
            if len(parts) >= 4 and parts[0] == "fleets" and parts[2] == "vehicles" and parts[3] == "state":
                fleet_id_path = parts[1]
        if not fleet_id_path:
            return _resp(400, {"error": "fleetId is required"})
        if not tenant_id:
            return _resp(403, {"error": "Forbidden"})

        vins = _list_vins_for_fleet(tenant_id, fleet_id_path)
        if not vins:
            return _resp(200, {"items": [], "count": 0})

        frm, to = _resolve_range(query)
        results: List[dict] = []
        found_any = False
        authorized_any = False

        for vin_item in vins:
            state = _get_vehicle_state(vin_item)
            if not state:
                continue
            found_any = True
            event_time = _parse_iso(state.get("lastEventTime"))
            if frm and event_time and event_time < frm:
                continue
            if to and event_time and event_time > to:
                continue
            if not _authorize_vin(vin_item, tenant_id, state.get("lastEventTime"), role):
                continue
            authorized_any = True
            results.append(state)

        if found_any and not authorized_any:
            return _resp(403, {"error": "Forbidden"})

        return _resp(
            200,
            {
                "items": results,
                "count": len(results),
                "from": frm.isoformat() if frm else None,
                "to": to.isoformat() if to else None,
            },
        )

    return _resp(404, {"error": "Not Found"})
