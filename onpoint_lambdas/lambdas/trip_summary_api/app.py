# ============================================================
# onpoint-dev-trip-summary-api
# API Gateway (HTTP API) -> Lambda -> DynamoDB (Trip Summary table)
#
# Endpoints:
#   GET /trips?vehicleId=VIN[&from=...&to=...&limit=...&nextToken=...&include=...]
#   GET /trips?vehicleIds=VIN1,VIN2,... (bounded fan-out; no global index)
#   GET /trips/{vin}/{tripId}[?include=summary|none|summary,alerts,events]
#
# Standard behavior:
# - List endpoint (GET /trips) default: include=none (fast), returns top-level rollups
# - Detail endpoint (GET /trips/{vin}/{tripId}) default: include=summary
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

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ddb = boto3.client("dynamodb")

TABLE = os.environ["TRIP_SUMMARY_TABLE"]
DEFAULT_LIMIT = int(os.environ.get("DEFAULT_LIMIT", "50"))
MAX_LIMIT = int(os.environ.get("MAX_LIMIT", "200"))

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


# -----------------------------
# Handler
# -----------------------------
def lambda_handler(event, context):
    # Prefer HTTP API v2 method if present, otherwise REST API v1 httpMethod
    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod")
    if method == "OPTIONS":
        return _resp(200, {"ok": True})

    path_params = event.get("pathParameters") or {}
    vin_path = (path_params.get("vin") or "").strip()
    trip_id_path = (path_params.get("tripId") or "").strip()
    qs = _get_qs(event)

    # -----------------------
    # Detail endpoint (path params win)
    # GET /trips/{vin}/{tripId}
    # -----------------------
    if vin_path and trip_id_path:
        include = _normalize_include(qs.get("include"), default=INCLUDE_SUMMARY)

        detail = _get_trip_detail(vin_path, trip_id_path, include=include)
        if not detail:
            return _resp(404, {"error": "Trip summary not found", "vin": vin_path, "tripId": trip_id_path})

        return _resp(200, detail)

    # -----------------------
    # List endpoint
    # GET /trips
    # -----------------------
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

        while pages < max_pages_per_vin:
            items, lek = _query_vehicle(vin, exclusive_start_key=esk, page_size=page_size)
            pages += 1

            for it in items:
                s = _summarize_item(it)
                if _in_range(s.get("startTime"), s.get("endTime"), frm, to):
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

        results.extend(collected)

    results.sort(key=_sort_key_endtime_desc, reverse=True)
    results = results[:limit]

    next_token = None
    if any(next_state["vins"].get(v) for v in vins):
        next_token = _encode_token(next_state)

    return _resp(200, {"items": results, "nextToken": next_token})
