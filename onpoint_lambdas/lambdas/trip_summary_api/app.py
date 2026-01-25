# ============================================================
# onpoint-dev-trip-summary-api
# API Gateway (REST API) -> Lambda -> DynamoDB (Trip Summary & Telemetry Events tables)
#
# Endpoints:
#   GET /trips?vehicleId=VIN[&from=...&to=...&limit=...&nextToken=...&include=...]
#   GET /trips?vehicleIds=VIN1,VIN2,... (bounded fan-out; no global index)
#   GET /trips/{vin}/{tripId}[?include=summary|none|summary,alerts,events]
#   GET /trips/{vin}/{tripId}/events[?limit=...&nextToken=...]
#   GET /vehicles/{vin}/latest-state
#   GET /fleets/{fleetId}/trips?from=...&to=...&limit=...&nextToken=...&include=...
#
# Standard behavior:
# - List endpoint (GET /trips) default: include=none (fast), returns top-level rollups
# - Detail endpoint (GET /trips/{vin}/{tripId}) default: include=summary
# - Events endpoint (GET /trips/{tripId}/events) returns normalized + raw events from telemetry table
# - Overspeed rollups are returned top-level if stored on the item:
#     overspeedMilesStandard / Severe / Total
#     overspeedEventCountStandard / Severe / Total
# - No duplicate "alerts/harsh/os1/os2" outside summary; those remain inside summary JSON.
# ============================================================

import os
import json
import base64
import logging
from datetime import datetime, timezone
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

BUILD_ID = "2026-01-23T18:45:00Z"

TABLE = os.environ["TRIP_SUMMARY_TABLE"]
TELEMETRY_EVENTS_TABLE = os.environ.get("TELEMETRY_EVENTS_TABLE", "onpoint-dev-telemetry-events")
VEHICLE_STATE_TABLE = os.environ.get("VEHICLE_STATE_TABLE", "onpoint-dev-vehicle-state")
VIN_REGISTRY_TABLE = os.environ.get("VIN_REGISTRY_TABLE")
VIN_TENANT_FLEET_INDEX = os.environ.get("VIN_TENANT_FLEET_INDEX")
DEFAULT_LIMIT = int(os.environ.get("DEFAULT_LIMIT", "50"))
MAX_LIMIT = int(os.environ.get("MAX_LIMIT", "200"))
EVENTS_DEFAULT_LIMIT = int(os.environ.get("EVENTS_DEFAULT_LIMIT", "100"))
EVENTS_MAX_LIMIT = int(os.environ.get("EVENTS_MAX_LIMIT", "500"))

# List endpoint scanning caps per VIN (cost guardrails)
DEFAULT_PAGE_SIZE = int(os.environ.get("PAGE_SIZE", "100"))
DEFAULT_MAX_PAGES_PER_VIN = int(os.environ.get("MAX_PAGES_PER_VIN", "3"))

# include modes
INCLUDE_NONE = "none"
INCLUDE_SUMMARY = "summary"

# token version
TOKEN_VERSION = 1


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


def _get_qs(event) -> Dict[str, str]:
    return event.get("queryStringParameters") or {}


def _parse_iso(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def _ddb_str(item: dict, key: str) -> Optional[str]:
    v = item.get(key)
    if isinstance(v, dict) and "S" in v:
        return v["S"]
    return None


def _ddb_num(item: dict, key: str) -> Optional[float]:
    v = item.get(key)
    if isinstance(v, dict) and "N" in v:
        try:
            return float(v["N"])
        except Exception:
            return None
    return None


def _ddb_int(item: dict, key: str) -> Optional[int]:
    v = item.get(key)
    if isinstance(v, dict) and "N" in v:
        try:
            return int(float(v["N"]))
        except Exception:
            return None
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


def _encode_token(obj: dict) -> str:
    raw = json.dumps(obj).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def _decode_token(token: str) -> dict:
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8"))
        j = json.loads(raw.decode("utf-8"))
        return j if isinstance(j, dict) else {}
    except Exception:
        return {}


def _decode_lek_token(token: Optional[str]) -> Tuple[Optional[dict], Optional[str]]:
    if not token:
        return None, None
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8"))
        j = json.loads(raw.decode("utf-8"))
        if not isinstance(j, dict):
            return None, "Invalid nextToken"
        return j, None
    except Exception:
        return None, "Invalid nextToken"


def _normalize_include(v: Optional[str], default: str) -> str:
    if not v:
        return default
    v = v.strip().lower()
    if v in (INCLUDE_NONE, INCLUDE_SUMMARY):
        return v
    # accept include=summary,alerts,events etc -> treat as summary for now
    if "summary" in v:
        return INCLUDE_SUMMARY
    return default


def _safe_parse_summary_json(summary_s: Optional[str]) -> Optional[dict]:
    if not summary_s or not isinstance(summary_s, str):
        return None
    try:
        obj = json.loads(summary_s)
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def _in_range(start_s: Optional[str], end_s: Optional[str], frm: Optional[datetime], to: Optional[datetime]) -> bool:
    # Trip overlaps [from,to] if start <= to AND end >= from
    if not frm and not to:
        return True

    st = _parse_iso(start_s) if start_s else None
    et = _parse_iso(end_s) if end_s else None

    # If missing times, include (don't hide data)
    if not st or not et:
        return True

    if frm and et < frm:
        return False
    if to and st > to:
        return False
    return True


def _sort_key_endtime_desc(x: dict):
    et = _parse_iso(x.get("endTime")) or datetime.min.replace(tzinfo=timezone.utc)
    st = _parse_iso(x.get("startTime")) or datetime.min.replace(tzinfo=timezone.utc)
    vin = x.get("vin") or ""
    trip_id = x.get("tripId") or ""
    return (et, st, vin, trip_id)


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


def _resolve_vin_tenancy(vin: str, as_of: Optional[str]) -> Optional[dict]:
    if not VIN_REGISTRY_TABLE:
        logger.warning("VIN_REGISTRY_TABLE not configured; skipping tenancy enforcement.")
        return None
    try:
        return resolve_vin_registry(vin, as_of=as_of, table_name=VIN_REGISTRY_TABLE, ddb_client=ddb)
    except Exception as exc:
        logger.error(f"VIN registry lookup failed for vin={vin}: {exc}")
        return None


def _authorize_vin(vin: str, tenant_id: Optional[str], as_of: Optional[str]) -> bool:
    if not VIN_REGISTRY_TABLE:
        return True
    if not tenant_id:
        return False
    record = _resolve_vin_tenancy(vin, as_of)
    if not record:
        return False
    return record.get("tenantId") == tenant_id


def _is_events_route(resource: str, path: str) -> bool:
    if resource == "/trips/{vin}/{tripId}/events":
        return True
    return bool(path and path.startswith("/trips/") and path.endswith("/events"))


def _is_fleet_trips_route(resource: str, path: str) -> bool:
    if resource == "/fleets/{fleetId}/trips":
        return True
    return bool(path and path.startswith("/fleets/") and path.endswith("/trips"))


# -----------------------------
# DynamoDB access
# -----------------------------
def _query_vehicle(
    vin: str,
    exclusive_start_key: Optional[dict] = None,
    page_size: int = DEFAULT_PAGE_SIZE,
    scan_forward: bool = False,
) -> Tuple[List[dict], Optional[dict]]:
    """
    Query PK=VEHICLE#{vin}, SK begins_with TRIP_SUMMARY#
    NOTE: SK is not time-sortable (tripId), so we sort by endTime client-side.
    """
    pk = f"VEHICLE#{vin}"
    params: Dict[str, Any] = {
        "TableName": TABLE,
        "KeyConditionExpression": "PK = :pk AND begins_with(SK, :skp)",
        "ExpressionAttributeValues": {
            ":pk": {"S": pk},
            ":skp": {"S": "TRIP_SUMMARY#"},
        },
        "Limit": page_size,
        "ScanIndexForward": scan_forward,  # False = descending by SK (still fine)
    }
    if exclusive_start_key:
        params["ExclusiveStartKey"] = exclusive_start_key

    resp = ddb.query(**params)
    return resp.get("Items", []), resp.get("LastEvaluatedKey")


def _summarize_item(it: dict) -> dict:
    # Core top-level fields
    start_time = _ddb_str(it, "startTime")
    end_time = _ddb_str(it, "endTime")
    trip_id = _ddb_str(it, "tripId")
    vin = _ddb_str(it, "vin")
    provider = _ddb_str(it, "provider")
    status = _ddb_str(it, "tripStatus")
    miles = _ddb_num(it, "milesDriven")
    fuel = _ddb_num(it, "fuelConsumed")
    score = _ddb_num(it, "safetyScore")
    refueled = _ddb_num(it, "refueledGallons")
    updated_at = _ddb_str(it, "updatedAt")
    schema_version = _ddb_str(it, "schemaVersion")

    # Overspeed rollups (NEW standard)
    os_miles_std = _ddb_num(it, "overspeedMilesStandard")
    os_miles_sev = _ddb_num(it, "overspeedMilesSevere")
    os_miles_total = _ddb_num(it, "overspeedMilesTotal")
    os_cnt_std = _ddb_int(it, "overspeedEventCountStandard")
    os_cnt_sev = _ddb_int(it, "overspeedEventCountSevere")
    os_cnt_total = _ddb_int(it, "overspeedEventCountTotal")

    # Fallback to keys if missing
    if not trip_id:
        sk = _ddb_str(it, "SK") or ""
        if sk.startswith("TRIP_SUMMARY#"):
            trip_id = sk.split("#", 1)[1]

    if not vin:
        pk = _ddb_str(it, "PK") or ""
        if pk.startswith("VEHICLE#"):
            vin = pk.split("#", 1)[1]

    out = {
        "vin": vin,
        "tripId": trip_id,
        "schemaVersion": schema_version,
        "startTime": start_time,
        "endTime": end_time,
        "tripStatus": status,
        "provider": provider,
        "milesDriven": miles,
        "fuelConsumed": fuel,
        "refueledGallons": refueled,
        "safetyScore": score,
        "updatedAt": updated_at,
    }

    # Only include overspeed if present (older trips may not have it)
    if os_miles_total is not None or os_cnt_total is not None:
        out["overspeedMilesStandard"] = os_miles_std
        out["overspeedMilesSevere"] = os_miles_sev
        out["overspeedMilesTotal"] = os_miles_total
        out["overspeedEventCountStandard"] = os_cnt_std
        out["overspeedEventCountSevere"] = os_cnt_sev
        out["overspeedEventCountTotal"] = os_cnt_total

    return out


def _query_trip_events_raw(
    vin: str,
    trip_id: str,
    limit: int = EVENTS_DEFAULT_LIMIT,
    exclusive_start_key: Optional[dict] = None,
) -> Tuple[List[dict], Optional[dict]]:
    """
    Query telemetry events for a specific vin + tripId.
    PK=VEHICLE#{vin}#TRIP#{trip_id}
    SK=TS#{eventTime}#MSG#{messageId}
    """
    pk = f"VEHICLE#{vin}#TRIP#{trip_id}"
    params: Dict[str, Any] = {
        "TableName": TELEMETRY_EVENTS_TABLE,
        "KeyConditionExpression": "PK = :pk AND begins_with(SK, :skp)",
        "ExpressionAttributeValues": {
            ":pk": {"S": pk},
            ":skp": {"S": "TS#"},
        },
        "Limit": limit,
        "ScanIndexForward": True,
    }

    if exclusive_start_key:
        params["ExclusiveStartKey"] = exclusive_start_key

    resp = ddb.query(**params)
    return resp.get("Items", []), resp.get("LastEvaluatedKey")


def _get_trip_summary_times(vin: str, trip_id: str) -> Tuple[Optional[str], Optional[str]]:
    pk = f"VEHICLE#{vin}"
    sk = f"TRIP_SUMMARY#{trip_id}"
    resp = ddb.get_item(
        TableName=TABLE,
        Key={"PK": {"S": pk}, "SK": {"S": sk}},
        ProjectionExpression="startTime,endTime",
    )
    item = resp.get("Item") or {}
    return _ddb_str(item, "startTime"), _ddb_str(item, "endTime")


def _get_trip_detail(vin: str, trip_id: str, include: str) -> Optional[dict]:
    pk = f"VEHICLE#{vin}"
    sk = f"TRIP_SUMMARY#{trip_id}"

    resp = ddb.get_item(TableName=TABLE, Key={"PK": {"S": pk}, "SK": {"S": sk}})
    item = resp.get("Item")
    if not item:
        return None

    # Standard top-level (same shape as list row)
    out = _summarize_item(item)

    # Ensure path params win
    out["vin"] = vin
    out["tripId"] = trip_id

    if include == INCLUDE_SUMMARY:
        summary_s = _ddb_str(item, "summary")
        summary_obj = _safe_parse_summary_json(summary_s)
        out["summary"] = summary_obj if summary_obj is not None else summary_s

    return out


def _get_vehicle_state(vin: str) -> Optional[dict]:
    pk = f"VEHICLE#{vin}"
    sk = "STATE"
    resp = ddb.get_item(TableName=VEHICLE_STATE_TABLE, Key={"PK": {"S": pk}, "SK": {"S": sk}})
    item = resp.get("Item")
    if not item:
        return None
    return _ddb_unmarshal_item(item)


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


# -----------------------------
# Handler
# -----------------------------
def lambda_handler(event, context):
    request_id = getattr(context, "aws_request_id", "unknown") if context else "unknown"

    # Prefer HTTP API v2 method if present, otherwise REST API v1 httpMethod
    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    # Parse path and query params at the top
    path_params = event.get("pathParameters") or {}
    query = event.get("queryStringParameters") or {}
    vin = path_params.get("vin")
    trip_id = path_params.get("tripId")
    fleet_id = path_params.get("fleetId")
    resource = event.get("resource", "") or ""
    path = event.get("path") or event.get("rawPath") or ""

    # Detect route type based on resource path first (most specific)
    if _is_events_route(resource, path):
        route_type = "TRIP_EVENTS"
    elif resource == "/vehicles/{vin}/latest-state":
        route_type = "VEHICLE_STATE"
    elif _is_fleet_trips_route(resource, path):
        route_type = "FLEET_TRIPS"
    # /trips/{vin}/{tripId} detail route
    elif resource == "/trips/{vin}/{tripId}" and trip_id:
        route_type = "DETAIL"
    # /trips list route
    else:
        route_type = "LIST"
    logger.info(
        json.dumps(
            {
                "buildId": BUILD_ID,
                "requestId": request_id,
                "route": route_type,
                "vin": vin,
                "tripId": trip_id,
            }
        )
    )

    vin_path = (vin or "").strip()
    trip_id_path = (trip_id or "").strip()
    fleet_id_path = (fleet_id or "").strip()
    qs = query
    tenant_id = _get_caller_tenant_id(event)

    if route_type == "FLEET_TRIPS" and not fleet_id_path and path:
        parts = [p for p in path.split("/") if p]
        if len(parts) >= 3 and parts[0] == "fleets" and parts[2] == "trips":
            fleet_id_path = parts[1]

    # TRIP EVENTS ROUTE: GET /trips/{tripId}/events
    if route_type == "TRIP_EVENTS":
        if not vin_path or not trip_id_path:
            return _resp(400, {"error": "vin and tripId are required"})

        start_time, end_time = _get_trip_summary_times(vin_path, trip_id_path)
        as_of = start_time or end_time
        if not _authorize_vin(vin_path, tenant_id, as_of):
            return _resp(403, {"error": "Forbidden"})

        try:
            limit = int(qs.get("limit") or EVENTS_DEFAULT_LIMIT)
        except Exception:
            limit = EVENTS_DEFAULT_LIMIT
        limit = max(1, min(limit, EVENTS_MAX_LIMIT))

        token = qs.get("nextToken")
        esk, token_error = _decode_lek_token(token)
        if token_error:
            return _resp(400, {"error": token_error})

        logger.info(
            json.dumps(
                {
                    "routeType": "TRIP_EVENTS",
                    "tripId": trip_id_path,
                    "vin": vin_path,
                    "limit": limit,
                }
            )
        )

        try:
            items, lek = _query_trip_events_raw(
                vin_path,
                trip_id_path,
                limit=limit,
                exclusive_start_key=esk,
            )
        except Exception as e:
            logger.error(f"Query telemetry events failed: {e}")
            return _resp(500, {"error": "Failed to query telemetry events", "requestId": request_id})

        next_token = _encode_token(lek) if lek else None
        raw_items = [_ddb_unmarshal_item(item) for item in items]

        return _resp(
            200,
            {
                "vin": vin_path,
                "tripId": trip_id_path,
                "count": len(raw_items),
                "items": raw_items,
                "nextToken": next_token,
            },
        )

    if route_type == "VEHICLE_STATE":
        if not vin_path:
            return _resp(400, {"error": "vin is required"})
        state = _get_vehicle_state(vin_path)
        if not state:
            return _resp(404, {"error": "Vehicle state not found"})
        if not _authorize_vin(vin_path, tenant_id, state.get("lastEventTime")):
            return _resp(403, {"error": "Forbidden"})
        return _resp(200, state)

    if route_type == "FLEET_TRIPS":
        if not fleet_id_path:
            return _resp(400, {"error": "fleetId is required"})
        if not tenant_id:
            return _resp(403, {"error": "Forbidden"})

        vins = _list_vins_for_fleet(tenant_id, fleet_id_path)
        if not vins:
            return _resp(200, {"items": [], "nextToken": None})

        frm = _parse_iso(qs.get("from"))
        to = _parse_iso(qs.get("to"))
        include = _normalize_include(qs.get("include"), default=INCLUDE_NONE)

        try:
            limit = int(qs.get("limit") or DEFAULT_LIMIT)
        except Exception:
            limit = DEFAULT_LIMIT
        limit = max(1, min(limit, MAX_LIMIT))

        token = qs.get("nextToken")
        token_obj = _decode_token(token) if token else {}
        if token_obj and token_obj.get("v") not in (None, TOKEN_VERSION):
            token_obj = {}

        per_vin_state = token_obj.get("vins") if isinstance(token_obj.get("vins"), dict) else {}

        results: List[dict] = []
        next_state: Dict[str, Any] = {"v": TOKEN_VERSION, "vins": {}}
        page_size = DEFAULT_PAGE_SIZE
        max_pages_per_vin = DEFAULT_MAX_PAGES_PER_VIN
        expansion_cap = max(limit * 3, 50)

        for vin in vins:
            esk = per_vin_state.get(vin)
            pages = 0
            collected: List[dict] = []

            while pages < max_pages_per_vin:
                items, lek = _query_vehicle(vin, exclusive_start_key=esk, page_size=page_size)
                pages += 1

                for it in items:
                    s = _summarize_item(it)
                    if _in_range(s.get("startTime"), s.get("endTime"), frm, to):
                        if include == INCLUDE_SUMMARY:
                            tid = s.get("tripId") or ""
                            d = _get_trip_detail(vin, tid, include=INCLUDE_SUMMARY)
                            if d and "summary" in d:
                                s["summary"] = d["summary"]
                        collected.append(s)

                esk = lek
                if not lek or len(collected) >= expansion_cap:
                    break

            if esk:
                next_state["vins"][vin] = esk
            results.extend(collected)

        results.sort(key=_sort_key_endtime_desc, reverse=True)
        results = results[:limit]
        next_token = None
        if any(next_state["vins"].get(v) for v in vins):
            next_token = _encode_token(next_state)

        return _resp(200, {"items": results, "nextToken": next_token})

    # HARD ROUTE SWITCH: If tripId exists in pathParameters -> DETAIL route
    # This must happen BEFORE any "vehicleId required" validation
    if trip_id_path:
        # Detail endpoint: GET /trips/{vin}/{tripId}
        vehicle_id = vin_path
        include = _normalize_include(qs.get("include"), default=INCLUDE_SUMMARY)

        detail = _get_trip_detail(vehicle_id, trip_id_path, include=include)
        if not detail:
            return _resp(404, {"error": "Trip summary not found", "vin": vehicle_id, "tripId": trip_id_path})

        if not _authorize_vin(vehicle_id, tenant_id, detail.get("startTime") or detail.get("endTime")):
            return _resp(403, {"error": "Forbidden"})

        return _resp(200, detail)

    # If we reach here: LIST route (no tripId in path)

    # -----------------------
    # List endpoint
    # GET /trips?vehicleId=... or GET /trips/{vin}
    # -----------------------
    # For list: use vin_path if present (from /trips/{vin} route), else query params
    vehicle_id = vin_path or (qs.get("vehicleId") or "").strip()
    vehicle_ids = (qs.get("vehicleIds") or "").strip()
    include = _normalize_include(qs.get("include"), default=INCLUDE_NONE)  # list default is fast

    frm = _parse_iso(qs.get("from"))
    to = _parse_iso(qs.get("to"))

    try:
        limit = int(qs.get("limit") or DEFAULT_LIMIT)
    except Exception:
        limit = DEFAULT_LIMIT
    limit = max(1, min(limit, MAX_LIMIT))

    token = qs.get("nextToken")
    token_obj = _decode_token(token) if token else {}
    if token_obj and token_obj.get("v") not in (None, TOKEN_VERSION):
        token_obj = {}

    per_vin_state = token_obj.get("vins") if isinstance(token_obj.get("vins"), dict) else {}

    vins: List[str] = []
    if vehicle_id:
        vins = [vehicle_id]
    elif vehicle_ids:
        vins = [v.strip() for v in vehicle_ids.split(",") if v.strip()]

    logger.info(f"List request: vins={vins}, from={frm}, to={to}, limit={limit}")

    if not vins:
        return _resp(
            400,
            {
                "error": "Provide vehicleId or vehicleIds. Global listing across all vehicles requires an index table (planned)."
            },
        )

    results: List[dict] = []
    next_state: Dict[str, Any] = {"v": TOKEN_VERSION, "vins": {}}

    page_size = DEFAULT_PAGE_SIZE
    max_pages_per_vin = DEFAULT_MAX_PAGES_PER_VIN

    # collect >limit then sort, but cap expansion
    expansion_cap = max(limit * 3, 50)

    for vin in vins:
        esk = per_vin_state.get(vin)
        pages = 0
        collected: List[dict] = []
        found_any = False
        authorized_any = False

        while pages < max_pages_per_vin:
            items, lek = _query_vehicle(vin, exclusive_start_key=esk, page_size=page_size)
            pages += 1

            for it in items:
                found_any = True
                s = _summarize_item(it)
                if _in_range(s.get("startTime"), s.get("endTime"), frm, to):
                    if not _authorize_vin(vin, tenant_id, s.get("startTime") or s.get("endTime")):
                        continue
                    authorized_any = True
                    if include == INCLUDE_SUMMARY:
                        # attach summary (expensive, explicit)
                        tid = s.get("tripId") or ""
                        d = _get_trip_detail(vin, tid, include=INCLUDE_SUMMARY)
                        if d and "summary" in d:
                            s["summary"] = d["summary"]
                    collected.append(s)

            esk = lek
            if not lek:
                break
            if len(collected) >= expansion_cap:
                break

        if esk:
            next_state["vins"][vin] = esk

        if found_any and not authorized_any:
            return _resp(403, {"error": "Forbidden"})

        results.extend(collected)

    results.sort(key=_sort_key_endtime_desc, reverse=True)
    results = results[:limit]

    next_token = None
    if any(next_state["vins"].get(v) for v in vins):
        next_token = _encode_token(next_state)

    return _resp(200, {"items": results, "nextToken": next_token})
