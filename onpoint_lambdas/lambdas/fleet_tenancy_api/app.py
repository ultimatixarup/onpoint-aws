import json
import os
import logging
import hashlib
from datetime import datetime, timezone
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

TENANTS_TABLE = os.environ.get("TENANTS_TABLE")
CUSTOMERS_TABLE = os.environ.get("CUSTOMERS_TABLE")
FLEETS_TABLE = os.environ.get("FLEETS_TABLE")
VEHICLES_TABLE = os.environ.get("VEHICLES_TABLE")
VIN_REGISTRY_TABLE = os.environ.get("VIN_REGISTRY_TABLE")
DRIVERS_TABLE = os.environ.get("DRIVERS_TABLE")
DRIVER_ASSIGNMENTS_TABLE = os.environ.get("DRIVER_ASSIGNMENTS_TABLE")
AUDIT_LOG_TABLE = os.environ.get("AUDIT_LOG_TABLE")
IDEMPOTENCY_TABLE = os.environ.get("IDEMPOTENCY_TABLE")

VIN_TENANT_INDEX = os.environ.get("VIN_TENANT_INDEX", "TenantIndex")
VIN_TENANT_FLEET_INDEX = os.environ.get("VIN_TENANT_FLEET_INDEX")

ROLE_ADMIN = "admin"
ROLE_TENANT_ADMIN = "tenant-admin"
ROLE_FLEET_MANAGER = "fleet-manager"
ROLE_ANALYST = "analyst"
ROLE_READ_ONLY = "read-only"


# -----------------------------
# Helpers
# -----------------------------

def _resp(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
            "access-control-allow-headers": "content-type,authorization,idempotency-key,x-tenant-id,x-role,x-fleet-id,x-actor-id,x-correlation-id",
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
        return obj, None
    except Exception:
        return None, "Invalid JSON body"


def _get_caller_tenant_id(event: dict) -> Optional[str]:
    identity = (event.get("requestContext") or {}).get("identity") or {}
    tenant_id = identity.get("apiKey") or identity.get("apiKeyId")
    if isinstance(tenant_id, str) and tenant_id.strip():
        return tenant_id.strip()
    headers = event.get("headers") or {}
    fallback = headers.get("x-tenant-id") or headers.get("X-Tenant-Id")
    if isinstance(fallback, str) and fallback.strip():
        return fallback.strip()
    return None


def _get_role(headers: Dict[str, str]) -> str:
    role = headers.get("x-role") or headers.get("x-roles") or ""
    role = role.strip().lower() if isinstance(role, str) else ""
    if role:
        return role
    return ROLE_READ_ONLY


def _require_role(role: str, allowed: List[str]) -> Optional[str]:
    if role not in allowed:
        return "Forbidden"
    return None


def _require_write_role(role: str) -> Optional[str]:
    return _require_role(role, [ROLE_ADMIN, ROLE_TENANT_ADMIN])


def _apply_fleet_scope(role: str, headers: Dict[str, str], fleet_id: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    if role != ROLE_FLEET_MANAGER:
        return fleet_id, None
    scoped = headers.get("x-fleet-id")
    if not scoped:
        return fleet_id, "Fleet scope required"
    if fleet_id and fleet_id != scoped:
        return fleet_id, "Forbidden"
    return scoped, None


def _require_tenant_access(role: str, caller_tenant: Optional[str], target_tenant: Optional[str]) -> Optional[str]:
    if role == ROLE_ADMIN:
        return None
    if not caller_tenant:
        return "Tenant identity required"
    if target_tenant and caller_tenant != target_tenant:
        return "Forbidden"
    return None


def _ddb_serialize(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _serializer.serialize(v) for k, v in item.items()}


def _ddb_deserialize(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _deserializer.deserialize(v) for k, v in item.items()}


def _ddb_get(table: str, key: Dict[str, Any]) -> Optional[dict]:
    resp = _ddb.get_item(TableName=table, Key=_ddb_serialize(key))
    item = resp.get("Item")
    return _ddb_deserialize(item) if item else None


def _ddb_put(table: str, item: Dict[str, Any], condition: Optional[str] = None, expr_vals: Optional[Dict[str, Any]] = None):
    params = {"TableName": table, "Item": _ddb_serialize(item)}
    if condition:
        params["ConditionExpression"] = condition
    if expr_vals:
        params["ExpressionAttributeValues"] = _ddb_serialize(expr_vals)
    _ddb.put_item(**params)


def _ddb_update(
    table: str,
    key: Dict[str, Any],
    update_expression: str,
    expr_vals: Dict[str, Any],
    condition: Optional[str] = None,
    expr_names: Optional[Dict[str, str]] = None,
):
    params = {
        "TableName": table,
        "Key": _ddb_serialize(key),
        "UpdateExpression": update_expression,
        "ExpressionAttributeValues": _ddb_serialize(expr_vals),
        "ReturnValues": "ALL_NEW",
    }
    if condition:
        params["ConditionExpression"] = condition
    if expr_names:
        params["ExpressionAttributeNames"] = expr_names
    resp = _ddb.update_item(**params)
    item = resp.get("Attributes")
    return _ddb_deserialize(item) if item else None


def _ddb_query(params: Dict[str, Any]) -> List[dict]:
    items: List[dict] = []
    last_key = None
    while True:
        if last_key:
            params["ExclusiveStartKey"] = last_key
        resp = _ddb.query(**params)
        for it in resp.get("Items") or []:
            items.append(_ddb_deserialize(it))
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return items


def _ddb_scan(params: Dict[str, Any]) -> List[dict]:
    items: List[dict] = []
    last_key = None
    while True:
        if last_key:
            params["ExclusiveStartKey"] = last_key
        resp = _ddb.scan(**params)
        for it in resp.get("Items") or []:
            items.append(_ddb_deserialize(it))
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return items


def _ddb_batch_get(table: str, keys: List[Dict[str, Any]]) -> List[dict]:
    if not keys:
        return []
    request_items = {table: {"Keys": [_ddb_serialize(k) for k in keys]}}
    resp = _ddb.batch_get_item(RequestItems=request_items)
    items = resp.get("Responses", {}).get(table, [])
    return [_ddb_deserialize(it) for it in items]


def _hash_request(method: str, path: str, body: Optional[dict]) -> str:
    payload = json.dumps({"method": method, "path": path, "body": body}, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _get_idempotency_key(headers: Dict[str, str]) -> Optional[str]:
    key = headers.get("idempotency-key") or headers.get("x-idempotency-key")
    if isinstance(key, str) and key.strip():
        return key.strip()
    return None


def _get_actor(headers: Dict[str, str], caller_tenant: Optional[str]) -> str:
    actor = headers.get("x-actor-id") or headers.get("x-user-id")
    if isinstance(actor, str) and actor.strip():
        return actor.strip()
    return caller_tenant or "unknown"


def _audit(
    *,
    entity_type: str,
    entity_id: str,
    action: str,
    actor: str,
    reason: Optional[str],
    before: Optional[dict],
    after: Optional[dict],
    tenant_id: Optional[str],
    correlation_id: Optional[str],
):
    if not AUDIT_LOG_TABLE:
        return
    ts = utc_now_iso()
    item = {
        "PK": f"ENTITY#{entity_type}#{entity_id}",
        "SK": f"TS#{ts}#ACTION#{action}",
        "entityType": entity_type,
        "entityId": entity_id,
        "action": action,
        "actor": actor,
        "reason": reason,
        "before": before,
        "after": after,
        "tenantId": tenant_id,
        "correlationId": correlation_id,
        "createdAt": ts,
    }
    _ddb_put(AUDIT_LOG_TABLE, item)


def _idempotency_fetch(key: str, route_key: str) -> Optional[dict]:
    if not IDEMPOTENCY_TABLE:
        return None
    return _ddb_get(IDEMPOTENCY_TABLE, {"PK": f"IDEMPOTENCY#{key}", "SK": f"ROUTE#{route_key}"})


def _idempotency_store(key: str, route_key: str, request_hash: str, response: dict, tenant_id: Optional[str]):
    if not IDEMPOTENCY_TABLE:
        return
    item = {
        "PK": f"IDEMPOTENCY#{key}",
        "SK": f"ROUTE#{route_key}",
        "requestHash": request_hash,
        "statusCode": response.get("statusCode"),
        "responseBody": response.get("body"),
        "tenantId": tenant_id,
        "createdAt": utc_now_iso(),
    }
    _ddb_put(IDEMPOTENCY_TABLE, item)


def _with_idempotency(
    key: Optional[str],
    route_key: str,
    request_hash: str,
    tenant_id: Optional[str],
    handler,
):
    if not key:
        return handler()
    existing = _idempotency_fetch(key, route_key)
    if existing:
        if existing.get("requestHash") and existing.get("requestHash") != request_hash:
            return _resp(409, {"error": "Idempotency-Key reuse with different payload"})
        status = int(existing.get("statusCode") or 200)
        body_raw = existing.get("responseBody") or "{}"
        try:
            body = json.loads(body_raw)
        except Exception:
            body = {"raw": body_raw}
        return _resp(status, body)

    response = handler()
    _idempotency_store(key, route_key, request_hash, response, tenant_id)
    return response


def _require_body(body: Optional[dict]) -> Optional[str]:
    if body is None:
        return "Body is required"
    return None


def _normalize_iso(ts: str) -> Optional[str]:
    if not ts:
        return None
    parsed = parse_iso(ts)
    return parsed.isoformat() if parsed else None


def _range_overlaps(a_from: str, a_to: Optional[str], b_from: str, b_to: Optional[str]) -> bool:
    a_start = parse_iso(a_from) if a_from else None
    b_start = parse_iso(b_from) if b_from else None
    if not a_start or not b_start:
        return True
    a_end = parse_iso(a_to) if a_to else None
    b_end = parse_iso(b_to) if b_to else None
    a_end = a_end or datetime.max.replace(tzinfo=timezone.utc)
    b_end = b_end or datetime.max.replace(tzinfo=timezone.utc)
    return a_start <= b_end and b_start <= a_end


def _is_missing_index_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "validationexception" in msg and "index" in msg and ("not found" in msg or "does not exist" in msg)

def _vin_history(vin: str) -> List[dict]:
    if not VIN_REGISTRY_TABLE:
        return []
    pk = f"VIN#{vin}"
    params = {
        "TableName": VIN_REGISTRY_TABLE,
        "KeyConditionExpression": "PK = :pk",
        "ExpressionAttributeValues": {":pk": {"S": pk}},
        "ScanIndexForward": True,
    }
    items = _ddb.query(**params).get("Items") or []
    return [_ddb_deserialize(it) for it in items]


def _vin_active_for_tenant(vin: str, tenant_id: str, as_of: Optional[str]) -> bool:
    if not VIN_REGISTRY_TABLE:
        return False
    try:
        from onpoint_common.vin_registry import resolve_vin_registry  # type: ignore
    except Exception:
        return False
    record = resolve_vin_registry(vin, as_of=as_of, table_name=VIN_REGISTRY_TABLE, ddb_client=_ddb)
    return bool(record and record.get("tenantId") == tenant_id)


def _list_vins_for_tenant(tenant_id: str, fleet_id: Optional[str], active_only: bool) -> List[str]:
    if not VIN_REGISTRY_TABLE:
        return []
    now = utc_now_iso()
    vins: List[str] = []
    if fleet_id:
        if VIN_TENANT_FLEET_INDEX:
            gsi_pk = f"TENANT#{tenant_id}#FLEET#{fleet_id}"
            params = {
                "TableName": VIN_REGISTRY_TABLE,
                "IndexName": VIN_TENANT_FLEET_INDEX,
                "KeyConditionExpression": "GSI2PK = :pk",
                "ExpressionAttributeValues": {":pk": {"S": gsi_pk}},
                "ScanIndexForward": True,
            }
        else:
            gsi_pk = f"TENANT#{tenant_id}"
            params = {
                "TableName": VIN_REGISTRY_TABLE,
                "IndexName": VIN_TENANT_INDEX,
                "KeyConditionExpression": "GSI1PK = :pk",
                "ExpressionAttributeValues": {":pk": {"S": gsi_pk}},
                "ScanIndexForward": True,
            }
    else:
        gsi_pk = f"TENANT#{tenant_id}"
        params = {
            "TableName": VIN_REGISTRY_TABLE,
            "IndexName": VIN_TENANT_INDEX,
            "KeyConditionExpression": "GSI1PK = :pk",
            "ExpressionAttributeValues": {":pk": {"S": gsi_pk}},
            "ScanIndexForward": True,
        }
    try:
        items = _ddb_query(params)
    except Exception as exc:
        if fleet_id and VIN_TENANT_FLEET_INDEX and _is_missing_index_error(exc):
            params = {
                "TableName": VIN_REGISTRY_TABLE,
                "IndexName": VIN_TENANT_INDEX,
                "KeyConditionExpression": "GSI1PK = :pk",
                "ExpressionAttributeValues": {":pk": {"S": f"TENANT#{tenant_id}"}},
                "ScanIndexForward": True,
            }
            items = _ddb_query(params)
        else:
            raise
    for rec in items:
        if active_only:
            if not _range_overlaps(rec.get("effectiveFrom"), rec.get("effectiveTo"), now, now):
                continue
        if fleet_id and not VIN_TENANT_FLEET_INDEX:
            if rec.get("fleetId") != fleet_id:
                continue
        vin = rec.get("vin")
        if not vin:
            gsi2 = rec.get("GSI2SK")
            gsi1 = rec.get("GSI1SK")
            src = gsi2 or gsi1 or ""
            if isinstance(src, str) and src.startswith("VIN#"):
                vin = src.split("VIN#", 1)[1]
        if vin and vin not in vins:
            vins.append(vin)
    return vins


def _batch_get_vehicles(vins: List[str]) -> List[dict]:
    if not VEHICLES_TABLE:
        return []
    items: List[dict] = []
    for i in range(0, len(vins), 100):
        batch = vins[i : i + 100]
        keys = [{"PK": f"VIN#{vin}", "SK": "META"} for vin in batch]
        items.extend(_ddb_batch_get(VEHICLES_TABLE, keys))
    return items


def _require_tables() -> Optional[str]:
    required = [
        (TENANTS_TABLE, "TENANTS_TABLE"),
        (CUSTOMERS_TABLE, "CUSTOMERS_TABLE"),
        (FLEETS_TABLE, "FLEETS_TABLE"),
        (VEHICLES_TABLE, "VEHICLES_TABLE"),
        (VIN_REGISTRY_TABLE, "VIN_REGISTRY_TABLE"),
        (DRIVERS_TABLE, "DRIVERS_TABLE"),
        (DRIVER_ASSIGNMENTS_TABLE, "DRIVER_ASSIGNMENTS_TABLE"),
        (AUDIT_LOG_TABLE, "AUDIT_LOG_TABLE"),
        (IDEMPOTENCY_TABLE, "IDEMPOTENCY_TABLE"),
    ]
    missing = [name for val, name in required if not val]
    if missing:
        return f"Missing environment variables: {', '.join(missing)}"
    return None


# -----------------------------
# Handlers
# -----------------------------

def _create_tenant(body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_role(role, [ROLE_ADMIN])
    if err:
        return _resp(403, {"error": err})

    tenant_id = body.get("tenantId") or body.get("id")
    if not isinstance(tenant_id, str) or not tenant_id.strip():
        tenant_id = hashlib.sha1(utc_now_iso().encode("utf-8")).hexdigest()[:12]

    name = body.get("name") or body.get("displayName")
    if not isinstance(name, str) or not name.strip():
        return _resp(400, {"error": "name is required"})

    config = body.get("config") or {}
    status = "ACTIVE"
    now = utc_now_iso()

    item = {
        "PK": f"TENANT#{tenant_id}",
        "SK": "META",
        "tenantId": tenant_id,
        "name": name.strip(),
        "status": status,
        "config": config,
        "createdAt": now,
        "updatedAt": now,
    }

    idempotency_key = _get_idempotency_key(headers)
    route_key = "POST:/tenants"
    request_hash = _hash_request("POST", "/tenants", body)

    def _do():
        try:
            _ddb_put(TENANTS_TABLE, item, condition="attribute_not_exists(PK)")
        except Exception:
            return _resp(409, {"error": "Tenant already exists", "tenantId": tenant_id})

        _audit(
            entity_type="tenant",
            entity_id=tenant_id,
            action="create",
            actor=_get_actor(headers, caller_tenant),
            reason=body.get("reason"),
            before=None,
            after=item,
            tenant_id=tenant_id,
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"tenantId": tenant_id, "status": status})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _get_tenant(tenant_id: str, role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    item = _ddb_get(TENANTS_TABLE, {"PK": f"TENANT#{tenant_id}", "SK": "META"})
    if not item:
        return _resp(404, {"error": "Tenant not found"})
    return _resp(200, item)


def _list_tenants(role: str) -> dict:
    err = _require_role(role, [ROLE_ADMIN])
    if err:
        return _resp(403, {"error": err})
    items = _ddb_scan({"TableName": TENANTS_TABLE})
    return _resp(200, {"items": items})


def _patch_tenant(tenant_id: str, body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    existing = _ddb_get(TENANTS_TABLE, {"PK": f"TENANT#{tenant_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Tenant not found"})

    name = body.get("name") or existing.get("name")
    config = body.get("config") if isinstance(body.get("config"), dict) else existing.get("config")
    status = body.get("status") or existing.get("status")
    if status not in ("ACTIVE", "SUSPENDED", "DELETED"):
        return _resp(400, {"error": "Invalid status"})

    now = utc_now_iso()
    updated = _ddb_update(
        TENANTS_TABLE,
        {"PK": f"TENANT#{tenant_id}", "SK": "META"},
        "SET #n=:n, config=:c, #s=:s, updatedAt=:u",
        {":n": name, ":c": config, ":s": status, ":u": now},
        expr_names={"#n": "name", "#s": "status"},
    )

    _audit(
        entity_type="tenant",
        entity_id=tenant_id,
        action="update",
        actor=_get_actor(headers, caller_tenant),
        reason=body.get("reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, updated or {})


def _set_tenant_status(tenant_id: str, status: str, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    existing = _ddb_get(TENANTS_TABLE, {"PK": f"TENANT#{tenant_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Tenant not found"})

    now = utc_now_iso()
    updated = _ddb_update(
        TENANTS_TABLE,
        {"PK": f"TENANT#{tenant_id}", "SK": "META"},
        "SET #s=:s, updatedAt=:u",
        {":s": status, ":u": now},
        expr_names={"#s": "status"},
    )
    _audit(
        entity_type="tenant",
        entity_id=tenant_id,
        action=f"status:{status.lower()}",
        actor=_get_actor(headers, caller_tenant),
        reason=headers.get("x-reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, {"tenantId": tenant_id, "status": status})


def _create_customer(body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    tenant_id = body.get("tenantId")
    tenant_ids = body.get("tenantIds")

    if tenant_id and not isinstance(tenant_id, str):
        return _resp(400, {"error": "tenantId must be a string"})
    if tenant_ids and not isinstance(tenant_ids, list):
        return _resp(400, {"error": "tenantIds must be a list"})
    if not tenant_id and not tenant_ids:
        return _resp(400, {"error": "tenantId or tenantIds is required"})
    if not tenant_id and isinstance(tenant_ids, list) and len(tenant_ids) == 1:
        tenant_id = tenant_ids[0]

    if tenant_ids and len(tenant_ids) > 1:
        err = _require_role(role, [ROLE_ADMIN])
        if err:
            return _resp(403, {"error": err})
    else:
        err = _require_tenant_access(role, caller_tenant, tenant_id)
        if err:
            return _resp(403, {"error": err})

    customer_id = body.get("customerId") or body.get("id")
    if not isinstance(customer_id, str) or not customer_id.strip():
        customer_id = hashlib.sha1(utc_now_iso().encode("utf-8")).hexdigest()[:12]

    now = utc_now_iso()
    item = {
        "PK": f"CUSTOMER#{customer_id}",
        "SK": "META",
        "customerId": customer_id,
        "tenantId": tenant_id,
        "tenantIds": tenant_ids,
        "billingProfile": body.get("billingProfile"),
        "contractMetadata": body.get("contractMetadata"),
        "contacts": body.get("contacts"),
        "serviceTier": body.get("serviceTier"),
        "status": "ACTIVE",
        "createdAt": now,
        "updatedAt": now,
    }

    idempotency_key = _get_idempotency_key(headers)
    route_key = "POST:/customers"
    request_hash = _hash_request("POST", "/customers", body)

    def _do():
        try:
            _ddb_put(CUSTOMERS_TABLE, item, condition="attribute_not_exists(PK)")
        except Exception:
            return _resp(409, {"error": "Customer already exists", "customerId": customer_id})

        _audit(
            entity_type="customer",
            entity_id=customer_id,
            action="create",
            actor=_get_actor(headers, caller_tenant),
            reason=body.get("reason"),
            before=None,
            after=item,
            tenant_id=tenant_id or (tenant_ids[0] if isinstance(tenant_ids, list) and tenant_ids else None),
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"customerId": customer_id, "status": "ACTIVE"})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _get_customer(customer_id: str, role: str, caller_tenant: Optional[str]) -> dict:
    item = _ddb_get(CUSTOMERS_TABLE, {"PK": f"CUSTOMER#{customer_id}", "SK": "META"})
    if not item:
        return _resp(404, {"error": "Customer not found"})

    tenant_id = item.get("tenantId")
    tenant_ids = item.get("tenantIds") or []
    if role != ROLE_ADMIN:
        if caller_tenant not in ([tenant_id] + (tenant_ids if isinstance(tenant_ids, list) else [])):
            return _resp(403, {"error": "Forbidden"})
    return _resp(200, item)


def _list_customers(query: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    tenant_id = query.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})
    if not tenant_id:
        return _resp(400, {"error": "tenantId is required"})

    items = _ddb_scan({"TableName": CUSTOMERS_TABLE})
    filtered = []
    for it in items:
        if it.get("tenantId") == tenant_id:
            filtered.append(it)
        else:
            tids = it.get("tenantIds") or []
            if isinstance(tids, list) and tenant_id in tids:
                filtered.append(it)
    return _resp(200, {"items": filtered})


def _patch_customer(customer_id: str, body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    existing = _ddb_get(CUSTOMERS_TABLE, {"PK": f"CUSTOMER#{customer_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Customer not found"})

    tenant_id = existing.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    now = utc_now_iso()
    updated = _ddb_update(
        CUSTOMERS_TABLE,
        {"PK": f"CUSTOMER#{customer_id}", "SK": "META"},
        "SET billingProfile=:bp, contractMetadata=:cm, contacts=:c, serviceTier=:st, updatedAt=:u",
        {
            ":bp": body.get("billingProfile", existing.get("billingProfile")),
            ":cm": body.get("contractMetadata", existing.get("contractMetadata")),
            ":c": body.get("contacts", existing.get("contacts")),
            ":st": body.get("serviceTier", existing.get("serviceTier")),
            ":u": now,
        },
    )
    _audit(
        entity_type="customer",
        entity_id=customer_id,
        action="update",
        actor=_get_actor(headers, caller_tenant),
        reason=body.get("reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, updated or {})


def _set_customer_status(customer_id: str, status: str, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    existing = _ddb_get(CUSTOMERS_TABLE, {"PK": f"CUSTOMER#{customer_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Customer not found"})

    tenant_id = existing.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    now = utc_now_iso()
    updated = _ddb_update(
        CUSTOMERS_TABLE,
        {"PK": f"CUSTOMER#{customer_id}", "SK": "META"},
        "SET #s=:s, updatedAt=:u",
        {":s": status, ":u": now},
        expr_names={"#s": "status"},
    )
    _audit(
        entity_type="customer",
        entity_id=customer_id,
        action=f"status:{status.lower()}",
        actor=_get_actor(headers, caller_tenant),
        reason=headers.get("x-reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, {"customerId": customer_id, "status": status})


def _create_fleet(body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    tenant_id = body.get("tenantId")
    if not tenant_id:
        return _resp(400, {"error": "tenantId is required"})
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    fleet_id = body.get("fleetId") or body.get("id")
    if not isinstance(fleet_id, str) or not fleet_id.strip():
        fleet_id = hashlib.sha1(utc_now_iso().encode("utf-8")).hexdigest()[:12]

    now = utc_now_iso()
    item = {
        "PK": f"FLEET#{fleet_id}",
        "SK": "META",
        "fleetId": fleet_id,
        "tenantId": tenant_id,
        "customerId": body.get("customerId"),
        "policies": body.get("policies"),
        "status": "ACTIVE",
        "createdAt": now,
        "updatedAt": now,
    }

    idempotency_key = _get_idempotency_key(headers)
    route_key = "POST:/fleets"
    request_hash = _hash_request("POST", "/fleets", body)

    def _do():
        try:
            _ddb_put(FLEETS_TABLE, item, condition="attribute_not_exists(PK)")
        except Exception:
            return _resp(409, {"error": "Fleet already exists", "fleetId": fleet_id})

        _audit(
            entity_type="fleet",
            entity_id=fleet_id,
            action="create",
            actor=_get_actor(headers, caller_tenant),
            reason=body.get("reason"),
            before=None,
            after=item,
            tenant_id=tenant_id,
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"fleetId": fleet_id, "status": "ACTIVE"})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _get_fleet(fleet_id: str, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    item = _ddb_get(FLEETS_TABLE, {"PK": f"FLEET#{fleet_id}", "SK": "META"})
    if not item:
        return _resp(404, {"error": "Fleet not found"})

    tenant_id = item.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})
    scoped, scope_err = _apply_fleet_scope(role, headers, fleet_id)
    if scope_err:
        return _resp(403, {"error": scope_err})
    return _resp(200, item)


def _list_fleets(query: Dict[str, str], headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    tenant_id = query.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})
    if not tenant_id:
        return _resp(400, {"error": "tenantId is required"})

    items = _ddb_scan({"TableName": FLEETS_TABLE})
    filtered = [it for it in items if it.get("tenantId") == tenant_id]
    customer_id = query.get("customerId")
    if customer_id:
        filtered = [it for it in filtered if it.get("customerId") == customer_id]
    if role == ROLE_FLEET_MANAGER:
        fleet_id = query.get("fleetId") or headers.get("x-fleet-id")
        scoped, scope_err = _apply_fleet_scope(role, headers, fleet_id)
        if scope_err:
            return _resp(403, {"error": scope_err})
        if scoped:
            filtered = [it for it in filtered if it.get("fleetId") == scoped]
    return _resp(200, {"items": filtered})


def _patch_fleet(fleet_id: str, body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    existing = _ddb_get(FLEETS_TABLE, {"PK": f"FLEET#{fleet_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Fleet not found"})

    tenant_id = existing.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    now = utc_now_iso()
    updated = _ddb_update(
        FLEETS_TABLE,
        {"PK": f"FLEET#{fleet_id}", "SK": "META"},
        "SET policies=:p, updatedAt=:u",
        {":p": body.get("policies", existing.get("policies")), ":u": now},
    )
    _audit(
        entity_type="fleet",
        entity_id=fleet_id,
        action="update",
        actor=_get_actor(headers, caller_tenant),
        reason=body.get("reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, updated or {})


def _set_fleet_status(fleet_id: str, status: str, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    existing = _ddb_get(FLEETS_TABLE, {"PK": f"FLEET#{fleet_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Fleet not found"})

    tenant_id = existing.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    now = utc_now_iso()
    updated = _ddb_update(
        FLEETS_TABLE,
        {"PK": f"FLEET#{fleet_id}", "SK": "META"},
        "SET #s=:s, updatedAt=:u",
        {":s": status, ":u": now},
        expr_names={"#s": "status"},
    )
    _audit(
        entity_type="fleet",
        entity_id=fleet_id,
        action=f"status:{status.lower()}",
        actor=_get_actor(headers, caller_tenant),
        reason=headers.get("x-reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, {"fleetId": fleet_id, "status": status})


def _create_vehicle(body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    vin = body.get("vin") or body.get("VIN")
    if not isinstance(vin, str) or not vin.strip():
        return _resp(400, {"error": "vin is required"})
    vin = vin.strip()

    if role != ROLE_ADMIN:
        if not caller_tenant:
            return _resp(403, {"error": "Tenant identity required"})
        if not _vin_active_for_tenant(vin, caller_tenant, utc_now_iso()):
            return _resp(403, {"error": "Forbidden"})

    item = {
        "PK": f"VIN#{vin}",
        "SK": "META",
        "vin": vin,
        "make": body.get("make"),
        "model": body.get("model"),
        "year": body.get("year"),
        "assetTags": body.get("assetTags"),
        "metadata": body.get("metadata"),
        "status": body.get("status") or "ACTIVE",
        "createdAt": utc_now_iso(),
        "updatedAt": utc_now_iso(),
    }

    idempotency_key = _get_idempotency_key(headers)
    route_key = "POST:/vehicles"
    request_hash = _hash_request("POST", "/vehicles", body)

    def _do():
        try:
            _ddb_put(VEHICLES_TABLE, item, condition="attribute_not_exists(PK)")
        except Exception:
            return _resp(409, {"error": "Vehicle already exists", "vin": vin})

        _audit(
            entity_type="vehicle",
            entity_id=vin,
            action="create",
            actor=_get_actor(headers, caller_tenant),
            reason=body.get("reason"),
            before=None,
            after=item,
            tenant_id=caller_tenant,
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"vin": vin, "status": item.get("status")})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _get_vehicle(vin: str, role: str, caller_tenant: Optional[str]) -> dict:
    if role != ROLE_ADMIN:
        if not caller_tenant:
            return _resp(403, {"error": "Tenant identity required"})
        if not _vin_active_for_tenant(vin, caller_tenant, utc_now_iso()):
            return _resp(403, {"error": "Forbidden"})

    item = _ddb_get(VEHICLES_TABLE, {"PK": f"VIN#{vin}", "SK": "META"})
    if not item:
        return _resp(404, {"error": "Vehicle not found"})
    return _resp(200, item)


def _list_vehicles(query: Dict[str, str], headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    tenant_id = query.get("tenantId")
    fleet_id = query.get("fleetId")
    status = query.get("status")

    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})
    if not tenant_id:
        return _resp(400, {"error": "tenantId is required"})

    if role == ROLE_FLEET_MANAGER:
        if not fleet_id:
            fleet_id = headers.get("x-fleet-id")
        scoped, scope_err = _apply_fleet_scope(role, headers, fleet_id)
        if scope_err:
            return _resp(403, {"error": scope_err})
        fleet_id = scoped
    vins = _list_vins_for_tenant(tenant_id, fleet_id, active_only=True)
    items = _batch_get_vehicles(vins)
    if status:
        items = [it for it in items if it.get("status") == status]
    return _resp(200, {"items": items})


def _patch_vehicle(vin: str, body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    if role != ROLE_ADMIN:
        if not caller_tenant:
            return _resp(403, {"error": "Tenant identity required"})
        if not _vin_active_for_tenant(vin, caller_tenant, utc_now_iso()):
            return _resp(403, {"error": "Forbidden"})

    existing = _ddb_get(VEHICLES_TABLE, {"PK": f"VIN#{vin}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Vehicle not found"})

    now = utc_now_iso()
    updated = _ddb_update(
        VEHICLES_TABLE,
        {"PK": f"VIN#{vin}", "SK": "META"},
        "SET make=:mk, model=:md, #yr=:yr, assetTags=:at, metadata=:m, status=:s, updatedAt=:u",
        {
            ":mk": body.get("make", existing.get("make")),
            ":md": body.get("model", existing.get("model")),
            ":yr": body.get("year", existing.get("year")),
            ":at": body.get("assetTags", existing.get("assetTags")),
            ":m": body.get("metadata", existing.get("metadata")),
            ":s": body.get("status", existing.get("status")),
            ":u": now,
        },
        expr_names={"#yr": "year"},
    )
    _audit(
        entity_type="vehicle",
        entity_id=vin,
        action="update",
        actor=_get_actor(headers, caller_tenant),
        reason=body.get("reason"),
        before=existing,
        after=updated,
        tenant_id=caller_tenant,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, updated or {})


def _assign_vin(body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_role(role, [ROLE_ADMIN])
    if err:
        return _resp(403, {"error": err})

    vin = body.get("vin")
    tenant_id = body.get("tenantId")
    effective_from = _normalize_iso(body.get("effectiveFrom"))
    reason = body.get("reason")
    if not vin or not tenant_id or not effective_from:
        return _resp(400, {"error": "vin, tenantId, effectiveFrom are required"})
    if not reason:
        return _resp(400, {"error": "reason is required"})

    effective_to = _normalize_iso(body.get("effectiveTo"))
    history = _vin_history(vin)
    for rec in history:
        if _range_overlaps(rec.get("effectiveFrom"), rec.get("effectiveTo"), effective_from, effective_to):
            return _resp(409, {"error": "VIN assignment overlaps existing record"})

    status = "ACTIVE" if _range_overlaps(effective_from, effective_to, utc_now_iso(), utc_now_iso()) else "INACTIVE"
    now = utc_now_iso()
    item = {
        "PK": f"VIN#{vin}",
        "SK": f"EFFECTIVE_FROM#{effective_from}",
        "vin": vin,
        "tenantId": tenant_id,
        "customerId": body.get("customerId"),
        "fleetId": body.get("fleetId"),
        "effectiveFrom": effective_from,
        "effectiveTo": effective_to,
        "status": status,
        "reason": reason,
        "createdAt": now,
        "updatedAt": now,
        "GSI1PK": f"TENANT#{tenant_id}",
        "GSI1SK": f"VIN#{vin}#EFFECTIVE_FROM#{effective_from}",
    }
    if body.get("fleetId"):
        item["GSI2PK"] = f"TENANT#{tenant_id}#FLEET#{body.get('fleetId')}"
        item["GSI2SK"] = f"VIN#{vin}"

    idempotency_key = _get_idempotency_key(headers)
    if not idempotency_key:
        return _resp(400, {"error": "Idempotency-Key is required for VIN assignment"})
    route_key = "POST:/vin-registry/assign"
    request_hash = _hash_request("POST", "/vin-registry/assign", body)

    def _do():
        try:
            _ddb_put(VIN_REGISTRY_TABLE, item, condition="attribute_not_exists(PK) AND attribute_not_exists(SK)")
        except Exception:
            return _resp(409, {"error": "VIN assignment already exists"})

        _audit(
            entity_type="vin-registry",
            entity_id=vin,
            action="assign",
            actor=_get_actor(headers, caller_tenant),
            reason=reason,
            before=None,
            after=item,
            tenant_id=tenant_id,
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"vin": vin, "tenantId": tenant_id, "status": status})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _transfer_vin(body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_role(role, [ROLE_ADMIN])
    if err:
        return _resp(403, {"error": err})

    vin = body.get("vin")
    from_tenant = body.get("fromTenantId")
    to_tenant = body.get("toTenantId")
    effective_from = _normalize_iso(body.get("effectiveFrom"))
    reason = body.get("reason")
    if not vin or not from_tenant or not to_tenant or not effective_from:
        return _resp(400, {"error": "vin, fromTenantId, toTenantId, effectiveFrom are required"})
    if not reason:
        return _resp(400, {"error": "reason is required"})

    idempotency_key = _get_idempotency_key(headers)
    if not idempotency_key:
        return _resp(400, {"error": "Idempotency-Key is required for VIN transfer"})

    history = _vin_history(vin)
    if not history:
        return _resp(404, {"error": "VIN not found in registry"})

    current = None
    for rec in history:
        if _range_overlaps(rec.get("effectiveFrom"), rec.get("effectiveTo"), effective_from, effective_from):
            current = rec
            break
    if not current or current.get("tenantId") != from_tenant:
        return _resp(409, {"error": "VIN not owned by fromTenantId at effectiveFrom"})

    for rec in history:
        if rec == current:
            continue
        if _range_overlaps(rec.get("effectiveFrom"), rec.get("effectiveTo"), effective_from, None):
            return _resp(409, {"error": "VIN transfer overlaps existing record"})

    status = "ACTIVE" if _range_overlaps(effective_from, None, utc_now_iso(), utc_now_iso()) else "INACTIVE"
    now = utc_now_iso()

    route_key = "POST:/vin-registry/transfer"
    request_hash = _hash_request("POST", "/vin-registry/transfer", body)

    def _do():
        _ddb_update(
            VIN_REGISTRY_TABLE,
            {"PK": current["PK"], "SK": current["SK"]},
            "SET effectiveTo=:to, #status=:st, updatedAt=:u",
            {":to": effective_from, ":st": "TRANSFERRED", ":u": now},
            expr_names={"#status": "status"},
        )

        new_item = {
            "PK": f"VIN#{vin}",
            "SK": f"EFFECTIVE_FROM#{effective_from}",
            "vin": vin,
            "tenantId": to_tenant,
            "customerId": body.get("toCustomerId") or body.get("customerId"),
            "fleetId": body.get("toFleetId") or body.get("fleetId"),
            "effectiveFrom": effective_from,
            "status": status,
            "reason": reason,
            "approvalRef": body.get("approvalRef"),
            "createdAt": now,
            "updatedAt": now,
            "GSI1PK": f"TENANT#{to_tenant}",
            "GSI1SK": f"VIN#{vin}#EFFECTIVE_FROM#{effective_from}",
        }
        if new_item.get("fleetId"):
            new_item["GSI2PK"] = f"TENANT#{to_tenant}#FLEET#{new_item.get('fleetId')}"
            new_item["GSI2SK"] = f"VIN#{vin}"

        _ddb_put(VIN_REGISTRY_TABLE, new_item, condition="attribute_not_exists(PK) AND attribute_not_exists(SK)")

        _audit(
            entity_type="vin-registry",
            entity_id=vin,
            action="transfer",
            actor=_get_actor(headers, caller_tenant),
            reason=reason,
            before=current,
            after=new_item,
            tenant_id=to_tenant,
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"vin": vin, "fromTenantId": from_tenant, "toTenantId": to_tenant, "status": status})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _get_vin_history(vin: str, role: str, caller_tenant: Optional[str]) -> dict:
    history = _vin_history(vin)
    if not history:
        return _resp(404, {"error": "VIN not found"})

    if role != ROLE_ADMIN:
        if not caller_tenant:
            return _resp(403, {"error": "Tenant identity required"})
        authorized = any(rec.get("tenantId") == caller_tenant for rec in history)
        if not authorized:
            return _resp(403, {"error": "Forbidden"})

    return _resp(200, {"items": history})


def _list_vin_registry(query: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    tenant_id = query.get("tenantId")
    active_only = (query.get("active") or "").lower() == "true"

    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})
    if not tenant_id:
        return _resp(400, {"error": "tenantId is required"})

    params = {
        "TableName": VIN_REGISTRY_TABLE,
        "IndexName": VIN_TENANT_INDEX,
        "KeyConditionExpression": "GSI1PK = :pk",
        "ExpressionAttributeValues": {":pk": {"S": f"TENANT#{tenant_id}"}},
        "ScanIndexForward": True,
    }
    items = _ddb_query(params)
    if active_only:
        now = utc_now_iso()
        items = [
            it
            for it in items
            if _range_overlaps(it.get("effectiveFrom"), it.get("effectiveTo"), now, now)
        ]
    return _resp(200, {"items": items})


def _create_driver(body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    tenant_id = body.get("tenantId")
    if not tenant_id:
        return _resp(400, {"error": "tenantId is required"})
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    driver_id = body.get("driverId") or body.get("id")
    if not isinstance(driver_id, str) or not driver_id.strip():
        driver_id = hashlib.sha1(utc_now_iso().encode("utf-8")).hexdigest()[:12]

    now = utc_now_iso()
    item = {
        "PK": f"DRIVER#{driver_id}",
        "SK": "META",
        "driverId": driver_id,
        "tenantId": tenant_id,
        "customerId": body.get("customerId"),
        "fleetId": body.get("fleetId"),
        "metadata": body.get("metadata"),
        "status": "ACTIVE",
        "createdAt": now,
        "updatedAt": now,
    }

    idempotency_key = _get_idempotency_key(headers)
    route_key = "POST:/drivers"
    request_hash = _hash_request("POST", "/drivers", body)

    def _do():
        try:
            _ddb_put(DRIVERS_TABLE, item, condition="attribute_not_exists(PK)")
        except Exception:
            return _resp(409, {"error": "Driver already exists", "driverId": driver_id})

        _audit(
            entity_type="driver",
            entity_id=driver_id,
            action="create",
            actor=_get_actor(headers, caller_tenant),
            reason=body.get("reason"),
            before=None,
            after=item,
            tenant_id=tenant_id,
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"driverId": driver_id, "status": "ACTIVE"})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _get_driver(driver_id: str, role: str, caller_tenant: Optional[str]) -> dict:
    item = _ddb_get(DRIVERS_TABLE, {"PK": f"DRIVER#{driver_id}", "SK": "META"})
    if not item:
        return _resp(404, {"error": "Driver not found"})

    tenant_id = item.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})
    return _resp(200, item)


def _list_drivers(query: Dict[str, str], headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    tenant_id = query.get("tenantId")
    fleet_id = query.get("fleetId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})
    if not tenant_id:
        return _resp(400, {"error": "tenantId is required"})

    if role == ROLE_FLEET_MANAGER:
        if not fleet_id:
            fleet_id = headers.get("x-fleet-id")
        scoped, scope_err = _apply_fleet_scope(role, headers, fleet_id)
        if scope_err:
            return _resp(403, {"error": scope_err})
        fleet_id = scoped

    items = _ddb_scan({"TableName": DRIVERS_TABLE})
    filtered = [it for it in items if it.get("tenantId") == tenant_id]
    if fleet_id:
        filtered = [it for it in filtered if it.get("fleetId") == fleet_id]
    return _resp(200, {"items": filtered})


def _patch_driver(driver_id: str, body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    existing = _ddb_get(DRIVERS_TABLE, {"PK": f"DRIVER#{driver_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Driver not found"})

    tenant_id = existing.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    now = utc_now_iso()
    updated = _ddb_update(
        DRIVERS_TABLE,
        {"PK": f"DRIVER#{driver_id}", "SK": "META"},
        "SET metadata=:m, fleetId=:f, customerId=:c, updatedAt=:u",
        {
            ":m": body.get("metadata", existing.get("metadata")),
            ":f": body.get("fleetId", existing.get("fleetId")),
            ":c": body.get("customerId", existing.get("customerId")),
            ":u": now,
        },
    )
    _audit(
        entity_type="driver",
        entity_id=driver_id,
        action="update",
        actor=_get_actor(headers, caller_tenant),
        reason=body.get("reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, updated or {})


def _set_driver_status(driver_id: str, status: str, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    existing = _ddb_get(DRIVERS_TABLE, {"PK": f"DRIVER#{driver_id}", "SK": "META"})
    if not existing:
        return _resp(404, {"error": "Driver not found"})

    tenant_id = existing.get("tenantId")
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    now = utc_now_iso()
    updated = _ddb_update(
        DRIVERS_TABLE,
        {"PK": f"DRIVER#{driver_id}", "SK": "META"},
        "SET #s=:s, updatedAt=:u",
        {":s": status, ":u": now},
        expr_names={"#s": "status"},
    )
    _audit(
        entity_type="driver",
        entity_id=driver_id,
        action=f"status:{status.lower()}",
        actor=_get_actor(headers, caller_tenant),
        reason=headers.get("x-reason"),
        before=existing,
        after=updated,
        tenant_id=tenant_id,
        correlation_id=headers.get("x-correlation-id"),
    )
    return _resp(200, {"driverId": driver_id, "status": status})


def _create_driver_assignment(driver_id: str, body: dict, headers: Dict[str, str], role: str, caller_tenant: Optional[str]) -> dict:
    err = _require_write_role(role)
    if err:
        return _resp(403, {"error": err})
    tenant_id = body.get("tenantId") or caller_tenant
    err = _require_tenant_access(role, caller_tenant, tenant_id)
    if err:
        return _resp(403, {"error": err})

    vin = body.get("vin")
    effective_from = _normalize_iso(body.get("effectiveFrom"))
    if not vin or not effective_from:
        return _resp(400, {"error": "vin and effectiveFrom are required"})

    if tenant_id and not _vin_active_for_tenant(vin, tenant_id, effective_from):
        return _resp(403, {"error": "Forbidden"})

    idempotency_key = _get_idempotency_key(headers)
    if not idempotency_key:
        return _resp(400, {"error": "Idempotency-Key is required for driver assignments"})

    effective_to = _normalize_iso(body.get("effectiveTo"))
    assignment_type = body.get("assignmentType")

    item = {
        "PK": f"DRIVER#{driver_id}",
        "SK": f"EFFECTIVE_FROM#{effective_from}#VIN#{vin}",
        "driverId": driver_id,
        "vin": vin,
        "tenantId": tenant_id,
        "effectiveFrom": effective_from,
        "effectiveTo": effective_to,
        "assignmentType": assignment_type,
        "createdAt": utc_now_iso(),
        "GSI1PK": f"VIN#{vin}",
        "GSI1SK": f"EFFECTIVE_FROM#{effective_from}#DRIVER#{driver_id}",
    }

    route_key = f"POST:/drivers/{driver_id}/assignments"
    request_hash = _hash_request("POST", f"/drivers/{driver_id}/assignments", body)

    def _do():
        try:
            _ddb_put(DRIVER_ASSIGNMENTS_TABLE, item, condition="attribute_not_exists(PK) AND attribute_not_exists(SK)")
        except Exception:
            return _resp(409, {"error": "Assignment already exists"})

        _audit(
            entity_type="driver-assignment",
            entity_id=f"{driver_id}:{vin}:{effective_from}",
            action="assign",
            actor=_get_actor(headers, caller_tenant),
            reason=body.get("reason"),
            before=None,
            after=item,
            tenant_id=tenant_id,
            correlation_id=headers.get("x-correlation-id"),
        )
        return _resp(201, {"driverId": driver_id, "vin": vin, "effectiveFrom": effective_from})

    return _with_idempotency(idempotency_key, route_key, request_hash, caller_tenant, _do)


def _list_driver_assignments(driver_id: str, role: str, caller_tenant: Optional[str]) -> dict:
    params = {
        "TableName": DRIVER_ASSIGNMENTS_TABLE,
        "KeyConditionExpression": "PK = :pk",
        "ExpressionAttributeValues": {":pk": {"S": f"DRIVER#{driver_id}"}},
        "ScanIndexForward": True,
    }
    items = _ddb_query(params)
    if role != ROLE_ADMIN:
        if not caller_tenant:
            return _resp(403, {"error": "Tenant identity required"})
        items = [it for it in items if it.get("tenantId") == caller_tenant]
    return _resp(200, {"items": items})


def _list_vehicle_assignments(vin: str, role: str, caller_tenant: Optional[str]) -> dict:
    if role != ROLE_ADMIN:
        if not caller_tenant:
            return _resp(403, {"error": "Tenant identity required"})
        if not _vin_active_for_tenant(vin, caller_tenant, utc_now_iso()):
            return _resp(403, {"error": "Forbidden"})

    params = {
        "TableName": DRIVER_ASSIGNMENTS_TABLE,
        "IndexName": "VinIndex",
        "KeyConditionExpression": "GSI1PK = :pk",
        "ExpressionAttributeValues": {":pk": {"S": f"VIN#{vin}"}},
        "ScanIndexForward": True,
    }
    items = _ddb_query(params)
    return _resp(200, {"items": items})


# -----------------------------
# Lambda Handler
# -----------------------------

def lambda_handler(event, context):
    if _require_tables():
        return _resp(500, {"error": "Service not configured"})

    method = _get_method(event)
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    headers = _headers(event)
    role = _get_role(headers)
    caller_tenant = _get_caller_tenant_id(event)
    path = _normalize_path(event)

    if path == "/":
        return _resp(404, {"error": "Not found"})

    segments = [seg for seg in path.strip("/").split("/") if seg]
    query = event.get("queryStringParameters") or {}

    body, body_err = _parse_body(event)
    if body_err:
        return _resp(400, {"error": body_err})

    # /tenants
    if segments[:1] == ["tenants"]:
        if len(segments) == 1:
            if method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _create_tenant(body, headers, role, caller_tenant)
            if method == "GET":
                return _list_tenants(role)
        if len(segments) == 2:
            tenant_id = segments[1]
            if method == "GET":
                return _get_tenant(tenant_id, role, caller_tenant)
            if method == "PATCH":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _patch_tenant(tenant_id, body, headers, role, caller_tenant)
        if len(segments) == 2 and segments[1].endswith(":suspend") and method == "POST":
            tenant_id = segments[1].split(":suspend")[0]
            return _set_tenant_status(tenant_id, "SUSPENDED", headers, role, caller_tenant)
        if len(segments) == 2 and segments[1].endswith(":activate") and method == "POST":
            tenant_id = segments[1].split(":activate")[0]
            return _set_tenant_status(tenant_id, "ACTIVE", headers, role, caller_tenant)

    # /customers
    if segments[:1] == ["customers"]:
        if len(segments) == 1:
            if method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _create_customer(body, headers, role, caller_tenant)
            if method == "GET":
                return _list_customers(query, role, caller_tenant)
        if len(segments) == 2:
            customer_id = segments[1]
            if method == "GET":
                return _get_customer(customer_id, role, caller_tenant)
            if method == "PATCH":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _patch_customer(customer_id, body, headers, role, caller_tenant)
        if len(segments) == 2 and segments[1].endswith(":deactivate") and method == "POST":
            customer_id = segments[1].split(":deactivate")[0]
            return _set_customer_status(customer_id, "INACTIVE", headers, role, caller_tenant)

    # /fleets
    if segments[:1] == ["fleets"]:
        if len(segments) == 1:
            if method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _create_fleet(body, headers, role, caller_tenant)
            if method == "GET":
                return _list_fleets(query, headers, role, caller_tenant)
        if len(segments) == 2:
            fleet_id = segments[1]
            if method == "GET":
                return _get_fleet(fleet_id, headers, role, caller_tenant)
            if method == "PATCH":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _patch_fleet(fleet_id, body, headers, role, caller_tenant)
        if len(segments) == 2 and segments[1].endswith(":archive") and method == "POST":
            fleet_id = segments[1].split(":archive")[0]
            return _set_fleet_status(fleet_id, "ARCHIVED", headers, role, caller_tenant)

    # /vehicles
    if segments[:1] == ["vehicles"]:
        if len(segments) == 1:
            if method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _create_vehicle(body, headers, role, caller_tenant)
            if method == "GET":
                return _list_vehicles(query, headers, role, caller_tenant)
        if len(segments) == 2:
            vin = segments[1]
            if method == "GET":
                return _get_vehicle(vin, role, caller_tenant)
            if method == "PATCH":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _patch_vehicle(vin, body, headers, role, caller_tenant)
        if len(segments) == 3 and segments[2] == "driver-assignments" and method == "GET":
            vin = segments[1]
            return _list_vehicle_assignments(vin, role, caller_tenant)

    # /vin-registry
    if segments[:1] == ["vin-registry"]:
        if len(segments) == 1 and method == "GET":
            return _list_vin_registry(query, role, caller_tenant)
        if len(segments) == 2:
            if segments[1] == "assign" and method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _assign_vin(body, headers, role, caller_tenant)
            if segments[1] == "transfer" and method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _transfer_vin(body, headers, role, caller_tenant)
            if method == "GET":
                vin = segments[1]
                return _get_vin_history(vin, role, caller_tenant)

    # /drivers
    if segments[:1] == ["drivers"]:
        if len(segments) == 1:
            if method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _create_driver(body, headers, role, caller_tenant)
            if method == "GET":
                return _list_drivers(query, headers, role, caller_tenant)
        if len(segments) == 2:
            driver_id = segments[1]
            if method == "GET":
                return _get_driver(driver_id, role, caller_tenant)
            if method == "PATCH":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _patch_driver(driver_id, body, headers, role, caller_tenant)
        if len(segments) == 2 and segments[1].endswith(":deactivate") and method == "POST":
            driver_id = segments[1].split(":deactivate")[0]
            return _set_driver_status(driver_id, "INACTIVE", headers, role, caller_tenant)
        if len(segments) == 3 and segments[2] == "assignments":
            driver_id = segments[1]
            if method == "POST":
                err = _require_body(body)
                return _resp(400, {"error": err}) if err else _create_driver_assignment(driver_id, body, headers, role, caller_tenant)
            if method == "GET":
                return _list_driver_assignments(driver_id, role, caller_tenant)

    return _resp(404, {"error": "Not found"})
