import json
import logging
import math
import os
from datetime import datetime, timezone, timedelta
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

try:
    from onpoint_common.vin_registry import resolve_vin_registry  # type: ignore
except Exception:
    def resolve_vin_registry(*args, **kwargs):
        return None

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_ddb = boto3.client("dynamodb")
_serializer = TypeSerializer()
_deserializer = TypeDeserializer()

TELEMETRY_EVENTS_TABLE = os.environ.get("TELEMETRY_EVENTS_TABLE")
VIN_REGISTRY_TABLE = os.environ.get("VIN_REGISTRY_TABLE")
GEOFENCE_DEFINITIONS_TABLE = os.environ.get("GEOFENCE_DEFINITIONS_TABLE")
GEOFENCE_ASSIGNMENTS_TABLE = os.environ.get("GEOFENCE_ASSIGNMENTS_TABLE")
GEOFENCE_STATE_TABLE = os.environ.get("GEOFENCE_STATE_TABLE")
GEOFENCE_EVENTS_TABLE = os.environ.get("GEOFENCE_EVENTS_TABLE")
GEOFENCE_EVENTS_TTL_DAYS = int(os.environ.get("GEOFENCE_EVENTS_TTL_DAYS", "30"))

DEFAULT_DEBOUNCE_SECONDS = 30
DEFAULT_DWELL_SECONDS = 300
DEFAULT_HYSTERESIS_METERS = 10
DEFAULT_POINT_RADIUS_METERS = 10

EVENT_ENTER = "ENTER"
EVENT_EXIT = "EXIT"
EVENT_DWELL_START = "DWELL_START"
EVENT_DWELL_END = "DWELL_END"

SUPPORTED_TYPES = {"CIRCLE", "POLYGON", "RECTANGLE", "POINT"}


def _ddb_serialize(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _serializer.serialize(v) for k, v in item.items()}


def _ddb_deserialize(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _deserializer.deserialize(v) for k, v in item.items()}


def _unmarshal_stream_image(image: Dict[str, Any]) -> Dict[str, Any]:
    return _ddb_deserialize(image)


def _parse_event_time(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    return parse_iso(value)


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _point_in_polygon(point: Tuple[float, float], polygon: List[List[float]]) -> bool:
    x, y = point
    inside = False
    n = len(polygon)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        intersect = ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi)
        if intersect:
            inside = not inside
        j = i
    return inside


def _evaluate_geofence(geofence: Dict[str, Any], lat: float, lon: float) -> Tuple[bool, float]:
    gtype = geofence.get("type")
    geometry = geofence.get("geometry") or {}
    if gtype == "CIRCLE":
        center = geometry.get("center")
        radius = geometry.get("radiusMeters")
        if not center or radius is None:
            return False, 0.0
        distance = _haversine_meters(lat, lon, center[0], center[1])
        return distance <= float(radius), distance
    if gtype == "POINT":
        center = geometry.get("center")
        radius = geometry.get("radiusMeters") or DEFAULT_POINT_RADIUS_METERS
        if not center:
            return False, 0.0
        distance = _haversine_meters(lat, lon, center[0], center[1])
        return distance <= float(radius), distance
    if gtype in ("POLYGON", "RECTANGLE"):
        coords = geometry.get("coordinates") or []
        if not coords:
            return False, 0.0
        return _point_in_polygon((lat, lon), coords), 0.0
    return False, 0.0


def _resolve_vin_tenancy(vin: str, event_time: Optional[str]) -> Optional[dict]:
    if not VIN_REGISTRY_TABLE:
        return None
    try:
        return resolve_vin_registry(vin, as_of=event_time, table_name=VIN_REGISTRY_TABLE, ddb_client=_ddb)
    except Exception as exc:
        logger.warning("VIN registry lookup failed for vin=%s: %s", vin, exc)
        return None


def _load_assignments(tenant_id: str) -> List[Dict[str, Any]]:
    if not GEOFENCE_ASSIGNMENTS_TABLE:
        return []
    pk = f"TENANT#{tenant_id}"
    resp = _ddb.query(
        TableName=GEOFENCE_ASSIGNMENTS_TABLE,
        KeyConditionExpression="PK = :pk",
        ExpressionAttributeValues={":pk": {"S": pk}},
    )
    items = resp.get("Items") or []
    return [_ddb_deserialize(it) for it in items]


def _assignment_matches(assignment: Dict[str, Any], vin: str, customer_id: Optional[str], fleet_id: Optional[str]) -> bool:
    scope_type = (assignment.get("scopeType") or "").upper()
    scope_id = assignment.get("scopeId")
    if scope_type == "TENANT":
        return True
    if scope_type == "CUSTOMER":
        return scope_id and customer_id and scope_id == customer_id
    if scope_type == "FLEET":
        return scope_id and fleet_id and scope_id == fleet_id
    if scope_type == "VIN":
        return scope_id and scope_id == vin
    return False


def _resolve_geofences(tenant_id: str, vin: str, customer_id: Optional[str], fleet_id: Optional[str]) -> Dict[str, Dict[str, Any]]:
    assignments = _load_assignments(tenant_id)
    resolved: Dict[str, Dict[str, Any]] = {}
    specificity = {"TENANT": 1, "CUSTOMER": 2, "FLEET": 3, "VIN": 4}

    for assignment in assignments:
        if not _assignment_matches(assignment, vin, customer_id, fleet_id):
            continue
        geofence_id = assignment.get("geofenceId")
        if not geofence_id:
            continue
        scope_type = (assignment.get("scopeType") or "TENANT").upper()
        priority = assignment.get("priorityOverride") or assignment.get("priority")
        exclude = bool(assignment.get("exclude"))
        existing = resolved.get(geofence_id)
        rank = specificity.get(scope_type, 0)
        if existing:
            existing_rank = existing.get("_specificity", 0)
            if rank < existing_rank:
                continue
        resolved[geofence_id] = {
            **assignment,
            "exclude": exclude,
            "priority": priority,
            "_specificity": rank,
        }

    return resolved


def _get_geofence_definition(tenant_id: str, geofence_id: str, as_of: Optional[str]) -> Optional[Dict[str, Any]]:
    if not GEOFENCE_DEFINITIONS_TABLE:
        return None
    pk = f"TENANT#{tenant_id}#GEOFENCE#{geofence_id}"
    sk = f"VERSION#999999#EFFECTIVE_FROM#{as_of or utc_now_iso()}"
    resp = _ddb.query(
        TableName=GEOFENCE_DEFINITIONS_TABLE,
        KeyConditionExpression="PK = :pk AND SK <= :sk",
        ExpressionAttributeValues={":pk": {"S": pk}, ":sk": {"S": sk}},
        ScanIndexForward=False,
        Limit=1,
    )
    items = resp.get("Items") or []
    if not items:
        return None
    return _ddb_deserialize(items[0])


def _get_state(vin: str, geofence_id: str) -> Optional[Dict[str, Any]]:
    if not GEOFENCE_STATE_TABLE:
        return None
    resp = _ddb.get_item(
        TableName=GEOFENCE_STATE_TABLE,
        Key={"PK": {"S": f"VIN#{vin}"}, "SK": {"S": f"GEOFENCE#{geofence_id}"}},
    )
    item = resp.get("Item")
    return _ddb_deserialize(item) if item else None


def _put_state(item: Dict[str, Any]) -> None:
    if not GEOFENCE_STATE_TABLE:
        return
    _ddb.put_item(TableName=GEOFENCE_STATE_TABLE, Item=_ddb_serialize(item))


def _put_event(event: Dict[str, Any]) -> None:
    if not GEOFENCE_EVENTS_TABLE:
        return
    _ddb.put_item(TableName=GEOFENCE_EVENTS_TABLE, Item=_ddb_serialize(event))


def _expires_at(event_time: datetime) -> int:
    return int((event_time + timedelta(days=GEOFENCE_EVENTS_TTL_DAYS)).timestamp())


def _should_emit_transition(last_transition: Optional[str], now: datetime, debounce_seconds: int) -> bool:
    if not last_transition:
        return True
    last_ts = parse_iso(last_transition)
    if not last_ts:
        return True
    return (now - last_ts).total_seconds() >= debounce_seconds


def _evaluate_state(
    geofence: Dict[str, Any],
    vin: str,
    tenant_id: str,
    event_time: datetime,
    lat: float,
    lon: float,
    speed_mph: Optional[float],
    heading: Optional[float],
    trip_id: Optional[str],
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    geofence_id = geofence.get("geofenceId")
    gtype = geofence.get("type")
    if not geofence_id or gtype not in SUPPORTED_TYPES:
        return events

    debounce_seconds = int(geofence.get("debounceSeconds") or DEFAULT_DEBOUNCE_SECONDS)
    dwell_seconds = int(geofence.get("dwellSeconds") or DEFAULT_DWELL_SECONDS)
    hysteresis_m = float(geofence.get("hysteresisMeters") or DEFAULT_HYSTERESIS_METERS)

    inside_now, distance = _evaluate_geofence(geofence, lat, lon)
    state = _get_state(vin, geofence_id) or {}
    inside_prev = bool(state.get("inside"))

    if gtype == "CIRCLE" and inside_prev and not inside_now:
        radius = (geofence.get("geometry") or {}).get("radiusMeters")
        center = (geofence.get("geometry") or {}).get("center")
        if radius is not None and center:
            dist = _haversine_meters(lat, lon, center[0], center[1])
            if dist <= float(radius) + hysteresis_m:
                inside_now = True

    last_transition = state.get("lastTransitionTime")
    emit_transition = _should_emit_transition(last_transition, event_time, debounce_seconds)

    if inside_now and not inside_prev and emit_transition:
        events.append(_build_event(tenant_id, vin, geofence, event_time, lat, lon, speed_mph, heading, trip_id, EVENT_ENTER))
        state["lastTransitionTime"] = event_time.isoformat()
        state["dwellStartTime"] = event_time.isoformat()
    elif not inside_now and inside_prev and emit_transition:
        events.append(_build_event(tenant_id, vin, geofence, event_time, lat, lon, speed_mph, heading, trip_id, EVENT_EXIT))
        if state.get("dwellStartTime"):
            events.append(_build_event(tenant_id, vin, geofence, event_time, lat, lon, speed_mph, heading, trip_id, EVENT_DWELL_END))
        state["lastTransitionTime"] = event_time.isoformat()
        state["dwellStartTime"] = None

    dwell_start = state.get("dwellStartTime")
    if inside_now and dwell_start:
        dwell_ts = parse_iso(dwell_start)
        if dwell_ts and (event_time - dwell_ts).total_seconds() >= dwell_seconds:
            if not state.get("dwellEmitted"):
                events.append(_build_event(tenant_id, vin, geofence, event_time, lat, lon, speed_mph, heading, trip_id, EVENT_DWELL_START))
                state["dwellEmitted"] = True

    state.update(
        {
            "PK": f"VIN#{vin}",
            "SK": f"GEOFENCE#{geofence_id}",
            "vin": vin,
            "tenantId": tenant_id,
            "geofenceId": geofence_id,
            "geofenceVersion": geofence.get("version"),
            "inside": inside_now,
            "lastEventTime": event_time.isoformat(),
            "lastLat": lat,
            "lastLon": lon,
        }
    )
    _put_state(state)
    return events


def _build_event(
    tenant_id: str,
    vin: str,
    geofence: Dict[str, Any],
    event_time: datetime,
    lat: float,
    lon: float,
    speed_mph: Optional[float],
    heading: Optional[float],
    trip_id: Optional[str],
    event_type: str,
) -> Dict[str, Any]:
    geofence_id = geofence.get("geofenceId")
    event_time_iso = event_time.isoformat()
    pk = f"TENANT#{tenant_id}#VIN#{vin}"
    sk = f"TS#{event_time_iso}#GEOFENCE#{geofence_id}#TYPE#{event_type}"
    return {
        "PK": pk,
        "SK": sk,
        "tenantId": tenant_id,
        "vin": vin,
        "tripId": trip_id,
        "geofenceId": geofence_id,
        "geofenceVersion": geofence.get("version"),
        "geofenceType": geofence.get("type"),
        "eventType": event_type,
        "eventTime": event_time_iso,
        "lat": lat,
        "lon": lon,
        "speed_mph": speed_mph,
        "heading": heading,
        "expiresAt": _expires_at(event_time),
    }


def _handle_record(record: Dict[str, Any]) -> int:
    if record.get("eventName") != "INSERT":
        return 0
    image = record.get("dynamodb", {}).get("NewImage")
    if not image:
        return 0
    item = _unmarshal_stream_image(image)
    vin = item.get("vin")
    event_time = item.get("eventTime")
    lat = item.get("lat")
    lon = item.get("lon")
    if not vin or lat is None or lon is None:
        return 0

    tenancy = _resolve_vin_tenancy(vin, event_time)
    if not tenancy:
        logger.info("Skipping vin with no tenancy: %s", vin)
        return 0

    tenant_id = tenancy.get("tenantId")
    if not tenant_id:
        return 0

    customer_id = tenancy.get("customerId")
    fleet_id = tenancy.get("fleetId")
    trip_id = item.get("tripId")
    speed_mph = item.get("speed_mph")
    heading = item.get("heading")
    event_dt = _parse_event_time(event_time) or datetime.now(timezone.utc)

    assignments = _resolve_geofences(tenant_id, vin, customer_id, fleet_id)
    if not assignments:
        return 0

    emitted = 0
    for geofence_id, assignment in assignments.items():
        if assignment.get("exclude"):
            continue
        geofence = _get_geofence_definition(tenant_id, geofence_id, event_time)
        if not geofence or geofence.get("status") in ("INACTIVE", "DELETED"):
            continue
        if geofence.get("type") not in SUPPORTED_TYPES:
            continue
        events = _evaluate_state(
            geofence,
            vin,
            tenant_id,
            event_dt,
            float(lat),
            float(lon),
            speed_mph if isinstance(speed_mph, (int, float)) else None,
            heading if isinstance(heading, (int, float)) else None,
            trip_id,
        )
        for evt in events:
            _put_event(evt)
            emitted += 1

    return emitted


def lambda_handler(event, context):
    records = event.get("Records") or []
    total_events = 0
    for record in records:
        try:
            total_events += _handle_record(record)
        except Exception as exc:
            logger.exception("Failed geofence record: %s", exc)
    return {"statusCode": 200, "body": json.dumps({"events": total_events})}
