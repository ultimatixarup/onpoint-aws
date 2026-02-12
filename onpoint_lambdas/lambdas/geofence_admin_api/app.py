import json
import logging
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

import boto3
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

try:
    from onpoint_common.timeutil import utc_now_iso, parse_iso  # type: ignore
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

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_ddb = boto3.client("dynamodb")
_serializer = TypeSerializer()
_deserializer = TypeDeserializer()

GEOFENCE_DEFINITIONS_TABLE = os.environ.get("GEOFENCE_DEFINITIONS_TABLE")
GEOFENCE_ASSIGNMENTS_TABLE = os.environ.get("GEOFENCE_ASSIGNMENTS_TABLE")
VIN_REGISTRY_TABLE = os.environ.get("VIN_REGISTRY_TABLE")

ROLE_ADMIN = "admin"
ROLE_TENANT_ADMIN = "tenant-admin"
ROLE_FLEET_MANAGER = "fleet-manager"
ROLE_ANALYST = "analyst"
ROLE_READ_ONLY = "read-only"

GROUP_PLATFORM_ADMIN = "PlatformAdmin"
GROUP_TENANT_ADMIN = "TenantAdmin"
GROUP_FLEET_MANAGER = "FleetManager"
GROUP_DISPATCHER = "Dispatcher"
GROUP_READ_ONLY = "ReadOnly"


def _resp(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
            "access-control-allow-headers": "content-type,authorization,x-api-key,idempotency-key,x-tenant-id,x-role,x-fleet-id,x-actor-id,x-correlation-id",
        },
        "body": json.dumps(body, default=str),
    }


def _headers(event: dict) -> Dict[str, str]:
    raw = event.get("headers") or {}
    out: Dict[str, str] = {}
    for k, v in raw.items():
        if isinstance(k, str) and isinstance(v, str):
            out[k.lower()] = v
    return out


def _get_claims(event: dict) -> Dict[str, Any]:
    ctx = event.get("requestContext") or {}
    authorizer = ctx.get("authorizer") or {}
    claims = authorizer.get("claims") or {}
    if isinstance(claims, dict) and claims:
        return claims
    jwt = authorizer.get("jwt") or {}
    jwt_claims = jwt.get("claims") or {}
    return jwt_claims if isinstance(jwt_claims, dict) else {}


def _get_groups_from_claims(claims: Dict[str, Any]) -> List[str]:
    groups = claims.get("cognito:groups") or claims.get("groups") or []
    if isinstance(groups, str):
        groups = [g.strip() for g in groups.split(",") if g.strip()]
    if isinstance(groups, list):
        return [g for g in groups if isinstance(g, str)]
    return []


def _get_method(event: dict) -> str:
    return (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or ""
    ).upper()


def _normalize_path(event: dict) -> str:
    path = event.get("rawPath") or event.get("path") or ""
    stage = event.get("requestContext", {}).get("stage")
    if stage and path.startswith(f"/{stage}/"):
        path = path[len(stage) + 1 :]
    return path


def _parse_body(event: dict) -> Tuple[Optional[dict], Optional[str]]:
    body = event.get("body")
    if body is None:
        return None, None
    try:
        obj = json.loads(body)
        if not isinstance(obj, dict):
            return None, "Payload must be a JSON object"
        return _normalize_numbers(obj), None
    except Exception:
        return None, "Invalid JSON body"


def _normalize_numbers(value: Any) -> Any:
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: _normalize_numbers(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_normalize_numbers(v) for v in value]
    return value


def _get_caller_tenant_id(event: dict) -> Optional[str]:
    headers = event.get("headers") or {}
    tenant_header = headers.get("x-tenant-id") or headers.get("X-Tenant-Id") or headers.get("x-tenantId")
    if isinstance(tenant_header, str) and tenant_header.strip():
        return tenant_header.strip()

    query = event.get("queryStringParameters") or {}
    tenant_query = query.get("tenantId") or query.get("tenant_id")
    if isinstance(tenant_query, str) and tenant_query.strip():
        return tenant_query.strip()

    claims = _get_claims(event)
    tenant_id = claims.get("custom:tenantId") or claims.get("tenantId")
    if isinstance(tenant_id, str) and tenant_id.strip():
        return tenant_id.strip()
    return None


def _get_role(event: dict, headers: Dict[str, str]) -> str:
    claims = _get_claims(event)
    groups = _get_groups_from_claims(claims)
    if GROUP_PLATFORM_ADMIN in groups:
        return ROLE_ADMIN
    if GROUP_TENANT_ADMIN in groups:
        return ROLE_TENANT_ADMIN
    if GROUP_FLEET_MANAGER in groups:
        return ROLE_FLEET_MANAGER
    if GROUP_DISPATCHER in groups:
        return ROLE_ANALYST
    if GROUP_READ_ONLY in groups:
        return ROLE_READ_ONLY
    legacy = headers.get("x-role") or headers.get("x-roles") or ""
    legacy = legacy.strip().lower() if isinstance(legacy, str) else ""
    return legacy or ROLE_READ_ONLY


def _require_role(role: str, allowed: List[str]) -> Optional[str]:
    if role not in allowed:
        return "Forbidden"
    return None


def _require_write_role(role: str) -> Optional[str]:
    return _require_role(role, [ROLE_ADMIN, ROLE_TENANT_ADMIN])


def _ddb_serialize(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _serializer.serialize(v) for k, v in item.items()}


def _ddb_deserialize(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _deserializer.deserialize(v) for k, v in item.items()}


def _ddb_put(table: str, item: Dict[str, Any]):
    _ddb.put_item(TableName=table, Item=_ddb_serialize(item))


def _ddb_query(table: str, pk: str, sk_prefix: Optional[str] = None) -> List[dict]:
    expr_vals = {":pk": {"S": pk}}
    key_expr = "PK = :pk"
    if sk_prefix:
        key_expr += " AND begins_with(SK, :sk)"
        expr_vals[":sk"] = {"S": sk_prefix}
    resp = _ddb.query(TableName=table, KeyConditionExpression=key_expr, ExpressionAttributeValues=expr_vals)
    return [_ddb_deserialize(it) for it in resp.get("Items") or []]


def _list_geofences(tenant_id: str, include_versions: bool) -> List[dict]:
    if not GEOFENCE_DEFINITIONS_TABLE:
        return []
    pk_prefix = f"TENANT#{tenant_id}#GEOFENCE#"
    resp = _ddb.scan(
        TableName=GEOFENCE_DEFINITIONS_TABLE,
        FilterExpression="begins_with(PK, :pk)",
        ExpressionAttributeValues={":pk": {"S": pk_prefix}},
    )
    items = [_ddb_deserialize(it) for it in resp.get("Items") or []]
    if include_versions:
        return items
    latest: Dict[str, dict] = {}
    for item in items:
        geofence_id = item.get("geofenceId")
        version = int(item.get("version") or 0)
        if geofence_id not in latest or version > int(latest[geofence_id].get("version") or 0):
            latest[geofence_id] = item
    return list(latest.values())


def _get_latest_definition(tenant_id: str, geofence_id: str) -> Optional[dict]:
    pk = f"TENANT#{tenant_id}#GEOFENCE#{geofence_id}"
    resp = _ddb.query(
        TableName=GEOFENCE_DEFINITIONS_TABLE,
        KeyConditionExpression="PK = :pk",
        ExpressionAttributeValues={":pk": {"S": pk}},
        ScanIndexForward=False,
        Limit=1,
    )
    items = resp.get("Items") or []
    return _ddb_deserialize(items[0]) if items else None


def _create_definition(tenant_id: str, payload: dict, version: int, geofence_id: Optional[str] = None, change_type: str = "CREATE") -> dict:
    geofence_id = geofence_id or str(uuid.uuid4())
    effective_from = payload.get("effectiveFrom") or utc_now_iso()
    sk = f"VERSION#{version}#EFFECTIVE_FROM#{effective_from}"
    item = {
        "PK": f"TENANT#{tenant_id}#GEOFENCE#{geofence_id}",
        "SK": sk,
        "tenantId": tenant_id,
        "geofenceId": geofence_id,
        "version": version,
        "effectiveFrom": effective_from,
        "type": payload.get("type"),
        "geometry": payload.get("geometry"),
        "priority": payload.get("priority"),
        "schedule": payload.get("schedule"),
        "status": payload.get("status", "ACTIVE"),
        "createdBy": payload.get("createdBy"),
        "reason": payload.get("reason"),
        "tags": payload.get("tags"),
        "changeType": change_type,
        "createdAt": utc_now_iso(),
    }
    _ddb_put(GEOFENCE_DEFINITIONS_TABLE, item)
    return item


def _write_assignment(tenant_id: str, geofence_id: str, payload: dict) -> dict:
    scope_type = (payload.get("scopeType") or "TENANT").upper()
    scope_id = payload.get("scopeId") or tenant_id
    item = {
        "PK": f"TENANT#{tenant_id}",
        "SK": f"SCOPE#{scope_type}#{scope_id}#GEOFENCE#{geofence_id}",
        "tenantId": tenant_id,
        "geofenceId": geofence_id,
        "scopeType": scope_type,
        "scopeId": scope_id,
        "exclude": bool(payload.get("exclude")),
        "priorityOverride": payload.get("priorityOverride"),
        "effectiveFrom": payload.get("effectiveFrom") or utc_now_iso(),
        "effectiveTo": payload.get("effectiveTo"),
        "createdBy": payload.get("createdBy"),
        "createdAt": utc_now_iso(),
    }
    _ddb_put(GEOFENCE_ASSIGNMENTS_TABLE, item)
    return item


def lambda_handler(event, context):
    method = _get_method(event)
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    headers = _headers(event)
    role = _get_role(event, headers)
    tenant_id = _get_caller_tenant_id(event)
    if not tenant_id:
        return _resp(400, {"error": "tenantId required"})

    path = _normalize_path(event)
    path_params = event.get("pathParameters") or {}
    query = event.get("queryStringParameters") or {}

    if method == "GET" and path == "/geofences":
        if _require_role(role, [ROLE_ADMIN, ROLE_TENANT_ADMIN, ROLE_FLEET_MANAGER, ROLE_ANALYST, ROLE_READ_ONLY]):
            return _resp(403, {"error": "Forbidden"})
        include_versions = (query.get("includeVersions") or "").lower() == "true"
        items = _list_geofences(tenant_id, include_versions)
        return _resp(200, {"items": items})

    if method == "POST" and path == "/geofences":
        err = _require_write_role(role)
        if err:
            return _resp(403, {"error": err})
        payload, perr = _parse_body(event)
        if perr:
            return _resp(400, {"error": perr})
        item = _create_definition(tenant_id, payload or {}, version=1)
        return _resp(201, item)

    geofence_id = path_params.get("geofenceId")
    if not geofence_id and path.startswith("/geofences/"):
        geofence_id = path.split("/geofences/", 1)[1].split("/", 1)[0]
        if ":" in geofence_id:
            geofence_id = geofence_id.split(":", 1)[0]
    if not geofence_id:
        return _resp(404, {"error": "Not Found"})

    if method == "PUT" and path.startswith(f"/geofences/{geofence_id}") and path == f"/geofences/{geofence_id}":
        err = _require_write_role(role)
        if err:
            return _resp(403, {"error": err})
        payload, perr = _parse_body(event)
        if perr:
            return _resp(400, {"error": perr})
        latest = _get_latest_definition(tenant_id, geofence_id)
        version = int(latest.get("version") or 0) + 1 if latest else 1
        item = _create_definition(tenant_id, payload or {}, version=version, geofence_id=geofence_id, change_type="UPDATE")
        return _resp(200, item)

    if method == "DELETE" and path == f"/geofences/{geofence_id}":
        err = _require_write_role(role)
        if err:
            return _resp(403, {"error": err})
        latest = _get_latest_definition(tenant_id, geofence_id)
        version = int(latest.get("version") or 0) + 1 if latest else 1
        payload = latest or {}
        payload["status"] = "DELETED"
        item = _create_definition(tenant_id, payload, version=version, geofence_id=geofence_id, change_type="SOFT_DELETE")
        return _resp(200, item)

    if method == "POST" and path in {f"/geofences/{geofence_id}:activate", f"/geofences/{geofence_id}/activate"}:
        err = _require_write_role(role)
        if err:
            return _resp(403, {"error": err})
        latest = _get_latest_definition(tenant_id, geofence_id)
        payload = latest or {}
        payload["status"] = "ACTIVE"
        version = int(payload.get("version") or 0) + 1
        item = _create_definition(tenant_id, payload, version=version, geofence_id=geofence_id, change_type="ACTIVATE")
        return _resp(200, item)

    if method == "POST" and path in {f"/geofences/{geofence_id}:deactivate", f"/geofences/{geofence_id}/deactivate"}:
        err = _require_write_role(role)
        if err:
            return _resp(403, {"error": err})
        latest = _get_latest_definition(tenant_id, geofence_id)
        payload = latest or {}
        payload["status"] = "INACTIVE"
        version = int(payload.get("version") or 0) + 1
        item = _create_definition(tenant_id, payload, version=version, geofence_id=geofence_id, change_type="DEACTIVATE")
        return _resp(200, item)

    if method == "POST" and path == f"/geofences/{geofence_id}/assignments":
        err = _require_write_role(role)
        if err:
            return _resp(403, {"error": err})
        payload, perr = _parse_body(event)
        if perr:
            return _resp(400, {"error": perr})
        item = _write_assignment(tenant_id, geofence_id, payload or {})
        return _resp(201, item)

    if method == "GET" and path == f"/geofences/{geofence_id}/versions":
        if _require_role(role, [ROLE_ADMIN, ROLE_TENANT_ADMIN, ROLE_FLEET_MANAGER, ROLE_ANALYST, ROLE_READ_ONLY]):
            return _resp(403, {"error": "Forbidden"})
        pk = f"TENANT#{tenant_id}#GEOFENCE#{geofence_id}"
        versions = _ddb_query(GEOFENCE_DEFINITIONS_TABLE, pk)
        return _resp(200, {"items": versions})

    return _resp(404, {"error": "Not Found"})
