# ============================================================
# telematics_processor (Kinesis -> Normalize -> DDB + SQS)
# - Async Trip Summary build via SQS
# - PSL Enrich Job (Option 2) via SQS (psl-enrich-job-1.0)
# ============================================================

import base64
import json
import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

# ---------------------------------------------------------
# Optional shared utilities (preferred)
# ---------------------------------------------------------
try:
    from onpoint_common.timeutil import utc_now_iso  # type: ignore
except Exception:
    def utc_now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

try:
    from onpoint_common.loggingutil import setup_logger  # type: ignore
except Exception:
    def setup_logger(name: str = "onpoint") -> logging.Logger:
        lg = logging.getLogger(name)
        if not lg.handlers:
            handler = logging.StreamHandler()
            fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
            handler.setFormatter(fmt)
            lg.addHandler(handler)
        lg.setLevel(logging.INFO)
        return lg

try:
    from onpoint_common.validate import require_dict  # type: ignore
except Exception:
    def require_dict(obj: Any, msg: str = "Expected JSON object") -> Dict[str, Any]:
        if not isinstance(obj, dict):
            raise ValueError(msg)
        return obj

try:
    from onpoint_common.vin_registry import resolve_vin_registry  # type: ignore
except Exception:
    def resolve_vin_registry(*args, **kwargs):
        return None

logger = setup_logger("onpoint.telematics_processor")

# ---------------------------------------------------------
# AWS Clients
# ---------------------------------------------------------
ddb = boto3.client("dynamodb")
sqs = boto3.client("sqs")

# ---------------------------------------------------------
# Environment Variables (standardized)
# ---------------------------------------------------------
PROJECT_NAME = os.environ.get("PROJECT_NAME", "onpoint")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")
DEFAULT_DOMAIN = os.environ.get("DEFAULT_DOMAIN", "telematics")

TELEMETRY_EVENTS_TABLE = os.environ["TELEMETRY_EVENTS_TABLE"]
VEHICLE_STATE_TABLE = os.environ["VEHICLE_STATE_TABLE"]
TRIPS_TABLE = os.environ["TRIPS_TABLE"]
VIN_REGISTRY_TABLE = os.environ.get("VIN_REGISTRY_TABLE")

# Async trip summary build
TRIP_SUMMARY_QUEUE_URL = os.environ["TRIP_SUMMARY_QUEUE_URL"]

# PSL enrich queue (Option 2) - optional
PSL_ENRICH_QUEUE_URL = os.environ.get("PSL_ENRICH_QUEUE_URL")
PSL_JOB_SCHEMA_VERSION = os.environ.get("PSL_JOB_SCHEMA_VERSION", "psl-enrich-job-1.0")

# Envelope schema enforcement
EXPECTED_SCHEMA_VERSION = os.environ.get("EXPECTED_SCHEMA_VERSION", "telematics-1.0")

# Normalized schema version (what we write)
NORMALIZED_SCHEMA_VERSION = os.environ.get("NORMALIZED_SCHEMA_VERSION", "normalized-telematics-1.0")

KM_TO_MILES = 0.621371
KPH_TO_MPH = 0.621371

# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def _iso_from_epoch(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, tz=timezone.utc).isoformat()

def _num(v) -> Optional[float]:
    try:
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str) and v.strip():
            return float(v)
    except Exception:
        return None
    return None

def _parse_event_time(raw: dict) -> str:
    """
    Prefer cx_readable_timestamp; fallback to epoch; else now.
    """
    ts = raw.get("cx_readable_timestamp")
    if isinstance(ts, str) and ts.strip():
        return ts.strip().replace("Z", "+00:00")

    epoch = raw.get("cx_timestamp")
    if isinstance(epoch, (int, float)):
        return _iso_from_epoch(epoch)

    return utc_now_iso()

def _get_location(raw: dict) -> Tuple[Optional[float], Optional[float], Optional[float], Optional[float]]:
    geo = raw.get("cx_geolocation") or {}
    lat = _num(geo.get("cx_latitude"))
    lon = _num(geo.get("cx_longitude"))
    heading = _num(geo.get("cx_heading"))
    altitude_m = _num(geo.get("cx_altitude"))
    return lat, lon, heading, altitude_m

def _get_speed_mph(raw: dict) -> Optional[float]:
    sp = raw.get("cx_vehicle_speed") or {}
    if isinstance(sp, dict):
        kph = _num(sp.get("value"))
        if kph is not None:
            return kph * KPH_TO_MPH
    return None

def _get_odometer_miles(raw: dict) -> Optional[float]:
    odo = raw.get("cx_odometer") or {}
    if isinstance(odo, dict):
        km = _num(odo.get("value"))
        if km is not None:
            return km * KM_TO_MILES
    return None

def _get_engine_speed_rpm(raw: dict) -> Optional[float]:
    eng = raw.get("cx_engine") or {}
    es = eng.get("cx_engine_speed")
    if isinstance(es, dict):
        return _num(es.get("value"))
    return None

def _get_trip_distance_miles(raw: dict) -> Optional[float]:
    dist = raw.get("cx_trip_distance") or raw.get("cx_trip_distance_inf")
    if isinstance(dist, dict):
        val = _num(dist.get("value"))
        unit = (dist.get("unit") or "").lower()
        if val is None:
            return None
        if unit in ("km", "kilometer", "kilometers"):
            return val * KM_TO_MILES
        if unit in ("mi", "mile", "miles"):
            return val
        return val
    return _num(raw.get("trip_distance_miles"))

def _get_duration_since_trip_start(raw: dict) -> Optional[float]:
    return _num(raw.get("cx_duration"))

def _get_satellite_count(raw: dict) -> Optional[float]:
    return _num(raw.get("cx_satellites_no"))

def _get_gear_position(raw: dict) -> Optional[str]:
    gear = raw.get("cx_gear_position") or raw.get("gear_position")
    if isinstance(gear, str) and gear.strip():
        return gear.strip()
    return None

def _get_coolant_temp_c(raw: dict) -> Optional[float]:
    eng = raw.get("cx_engine") or {}
    ct = eng.get("cx_coolant_temp")
    if isinstance(ct, dict):
        return _num(ct.get("value"))
    return None

def _get_battery_volts(raw: dict) -> Optional[float]:
    batt = (raw.get("cx_battery") or {}).get("cx_battery_level")
    if isinstance(batt, dict):
        return _num(batt.get("value"))
    return None

def _get_fuel_percent(raw: dict) -> Optional[float]:
    """
    cx_fuel.cx_fuel_level.value with unit 'perc' or '%'
    If unit is liters, do NOT coerce -> leave percent null.
    """
    fuel = raw.get("cx_fuel") or {}
    fl = fuel.get("cx_fuel_level")
    if not isinstance(fl, dict):
        return None
    unit = (fl.get("unit") or "").lower()
    val = _num(fl.get("value"))
    if val is None:
        return None
    if unit in ("%", "perc"):
        return val
    return None

def _get_fuel_level_gallons(raw: dict) -> Optional[float]:
    """
    Authoritative absolute fuel: cx_fuel.cx_abs_fuel_level.value (gallons)
    """
    fuel = raw.get("cx_fuel") or {}
    absf = fuel.get("cx_abs_fuel_level")
    if isinstance(absf, dict):
        return _num(absf.get("value"))
    return None

def _get_ignition_status(raw: dict) -> Optional[str]:
    ign = raw.get("cx_ignition_state")
    if ign in (1, 1.0, True):
        return "ON"
    if ign in (0, 0.0, False):
        return "OFF"
    eng = raw.get("cx_engine") or {}
    ign2 = eng.get("cx_ign_status")
    if ign2 in (1, 1.0):
        return "ON"
    if ign2 in (0, 0.0):
        return "OFF"
    return None

def _derive_vehicle_state(event_type: str, speed_mph: Optional[float], ignition_status: Optional[str]) -> str:
    """
    Decision B: speed-based only; no cx_message_reason override.
    """
    moving = (speed_mph is not None and speed_mph > 0)

    if event_type == "trip_start":
        if ignition_status == "ON" and not moving:
            return "ENGINE_ON_IDLE"
        return "TRIP_START"

    if event_type == "trip_ongoing":
        if speed_mph is None:
            return "UNKNOWN"
        return "MOVING" if moving else "STOPPED"

    if event_type == "trip_end":
        return "TRIP_ENDED"

    return "UNKNOWN"

# ---------------------------------------------------------
# Normalization
# ---------------------------------------------------------
def _resolve_vin_tenancy(vin: Optional[str], event_time: str) -> Optional[Dict[str, Any]]:
    if not vin or not VIN_REGISTRY_TABLE:
        return None
    try:
        return resolve_vin_registry(vin, as_of=event_time, table_name=VIN_REGISTRY_TABLE, ddb_client=ddb)
    except Exception as exc:
        logger.warning(f"VIN registry lookup failed for vin={vin}: {exc}")
        return None

def _normalize(envelope: dict) -> dict:
    require_dict(envelope, "Envelope must be an object")

    schema_version = envelope.get("schemaVersion")
    if schema_version and schema_version != EXPECTED_SCHEMA_VERSION:
        raise ValueError(f"Unsupported schemaVersion: {schema_version} (expected {EXPECTED_SCHEMA_VERSION})")

    raw = envelope.get("data") or {}
    require_dict(raw, "Envelope.data must be an object")

    vin = raw.get("cx_vehicle_id") or raw.get("vin")
    trip_id = raw.get("cx_trip_id")
    event_type = raw.get("cx_event_type")
    event_time = _parse_event_time(raw)

    message_id = raw.get("cx_msg_id") or envelope.get("messageId")
    provider_id = envelope.get("providerId") or envelope.get("provider") or "unknown"

    tenancy = _resolve_vin_tenancy(vin, event_time)
    tenant_id = tenancy.get("tenantId") if isinstance(tenancy, dict) else None
    customer_id = tenancy.get("customerId") if isinstance(tenancy, dict) else None
    fleet_id = tenancy.get("fleetId") if isinstance(tenancy, dict) else None

    ignition_status = _get_ignition_status(raw)
    speed_mph = _get_speed_mph(raw)
    lat, lon, heading, altitude_m = _get_location(raw)
    odometer_miles = _get_odometer_miles(raw)

    fuel_percent = _get_fuel_percent(raw)
    fuel_level_gallons = _get_fuel_level_gallons(raw)

    battery_volts = _get_battery_volts(raw)
    coolant_temp_c = _get_coolant_temp_c(raw)
    engine_speed_rpm = _get_engine_speed_rpm(raw)
    gear_position = _get_gear_position(raw)
    trip_distance_miles = _get_trip_distance_miles(raw)
    trip_duration_seconds = _get_duration_since_trip_start(raw)
    satellite_count = _get_satellite_count(raw)

    vehicle_state = _derive_vehicle_state(event_type, speed_mph, ignition_status)

    return {
        "schemaVersion": NORMALIZED_SCHEMA_VERSION,
        "domain": envelope.get("domain") or DEFAULT_DOMAIN,

        "vin": vin,
        "tripId": trip_id,
        "eventType": event_type,
        "eventTime": event_time,
        "messageId": message_id,
        "providerId": provider_id,
        "tenantId": tenant_id,
        "customerId": customer_id,
        "fleetId": fleet_id,

        "ignition_status": ignition_status,
        "vehicleState": vehicle_state,

        "lat": lat,
        "lon": lon,
        "heading": heading,
        "altitudeM": altitude_m,

        "speed_mph": speed_mph,
        "odometer_miles": odometer_miles,
        "odometer_Miles": odometer_miles,

        "fuelPercent": fuel_percent,
        "fuelLevelGallons": fuel_level_gallons,

        "batteryVolts": battery_volts,
        "coolantTempC": coolant_temp_c,
        "engine_rpm": engine_speed_rpm,
        "engine_speed_rpm": engine_speed_rpm,
        "gear_position": gear_position,

        "tripStartTime": event_time if event_type == "trip_start" else None,
        "distanceSinceTripStart_miles": trip_distance_miles,
        "durationSinceTripStart_seconds": trip_duration_seconds,
        "satelliteCount": satellite_count,

        "raw": raw,
    }

# ---------------------------------------------------------
# Telemetry Events Table (idempotent)
# Return: (inserted_new, pk, sk)
# ---------------------------------------------------------
def _put_telemetry_event(n: dict):
    pk = f"VEHICLE#{n['vin']}#TRIP#{n['tripId']}"
    sk = f"TS#{n['eventTime']}#MSG#{n['messageId']}"

    item = {
        "PK": {"S": pk},
        "SK": {"S": sk},
        "schemaVersion": {"S": n["schemaVersion"]},

        "vin": {"S": n["vin"]},
        "tripId": {"S": n["tripId"]},
        "eventType": {"S": n["eventType"]},
        "eventTime": {"S": n["eventTime"]},
        "vehicleState": {"S": n["vehicleState"]},
        "providerId": {"S": n.get("providerId", "unknown")},
        "messageId": {"S": n["messageId"]},
        "ingestedAt": {"S": utc_now_iso()},
        "raw": {"S": json.dumps(n["raw"])},
    }

    if n.get("tenantId"):
        item["tenantId"] = {"S": n["tenantId"]}
    if n.get("customerId"):
        item["customerId"] = {"S": n["customerId"]}
    if n.get("fleetId"):
        item["fleetId"] = {"S": n["fleetId"]}

    if n.get("ignition_status") is not None:
        item["ignition_status"] = {"S": n["ignition_status"]}

    def add_num(key):
        if n.get(key) is not None:
            item[key] = {"N": str(n[key])}

    for k in [
        "lat", "lon", "heading", "altitudeM",
        "speed_mph",
        "odometer_Miles",
        "odometer_miles",
        "fuelPercent",
        "fuelLevelGallons",
        "batteryVolts",
        "coolantTempC",
        "engine_speed_rpm",
        "engine_rpm",
        "distanceSinceTripStart_miles",
        "durationSinceTripStart_seconds",
        "satelliteCount",
    ]:
        add_num(k)

    if n.get("gear_position"):
        item["gear_position"] = {"S": n["gear_position"]}
    if n.get("tripStartTime"):
        item["tripStartTime"] = {"S": n["tripStartTime"]}

    try:
        ddb.put_item(
            TableName=TELEMETRY_EVENTS_TABLE,
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
        )
        return True, pk, sk
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.info(f"Duplicate ignored → {pk} {sk}")
            return False, pk, sk
        raise

# ---------------------------------------------------------
# Vehicle State Snapshot (latest time wins)
# ---------------------------------------------------------
def _update_vehicle_state(n: dict):
    pk = f"VEHICLE#{n['vin']}"
    sk = "STATE"

    expr = "SET lastEventTime=:t, vehicleState=:vs, updatedAt=:u, schemaVersion=:sv"
    vals = {
        ":t": {"S": n["eventTime"]},
        ":vs": {"S": n["vehicleState"]},
        ":u": {"S": utc_now_iso()},
        ":sv": {"S": n["schemaVersion"]},
    }

    if n.get("ignition_status") is not None:
        expr += ", ignition_status=:ig"
        vals[":ig"] = {"S": n["ignition_status"]}

    def set_num(attr, token):
        nonlocal expr, vals
        if n.get(attr) is not None:
            expr += f", {attr}=:{token}"
            vals[f":{token}"] = {"N": str(n[attr])}

    set_num("speed_mph", "sp")
    set_num("lat", "lat")
    set_num("lon", "lon")
    set_num("heading", "hd")
    set_num("odometer_miles", "odo_mi")
    set_num("odometer_Miles", "odo")
    set_num("fuelPercent", "fp")
    set_num("fuelLevelGallons", "fg")
    set_num("engine_rpm", "rpm")
    set_num("distanceSinceTripStart_miles", "dist")
    set_num("durationSinceTripStart_seconds", "dur")
    set_num("satelliteCount", "sat")

    if n.get("gear_position"):
        expr += ", gear_position=:gp"
        vals[":gp"] = {"S": n["gear_position"]}
    if n.get("tripStartTime"):
        expr += ", tripStartTime=:ts"
        vals[":ts"] = {"S": n["tripStartTime"]}

    condition = "attribute_not_exists(lastEventTime) OR :t >= lastEventTime"

    try:
        ddb.update_item(
            TableName=VEHICLE_STATE_TABLE,
            Key={"PK": {"S": pk}, "SK": {"S": sk}},
            UpdateExpression=expr,
            ExpressionAttributeValues=vals,
            ConditionExpression=condition,
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
            raise

# ---------------------------------------------------------
# Trips Table + Async Trip Summary on trip_end
# ---------------------------------------------------------
def _write_trip(n: dict):
    pk = f"VEHICLE#{n['vin']}"
    sk = f"TRIP#{n['tripId']}"

    if n["eventType"] == "trip_start":
        item = {
            "PK": {"S": pk},
            "SK": {"S": sk},
            "schemaVersion": {"S": "trip-1.0"},
            "vin": {"S": n["vin"]},
            "tripId": {"S": n["tripId"]},
            "startTime": {"S": n["eventTime"]},
            "tripStatus": {"S": "IN_PROGRESS"},
            "createdAt": {"S": utc_now_iso()},
        }
        if n.get("lat") is not None:
            item["startLat"] = {"N": str(n["lat"])}
        if n.get("lon") is not None:
            item["startLon"] = {"N": str(n["lon"])}

        try:
            ddb.put_item(
                TableName=TRIPS_TABLE,
                Item=item,
                ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
            )
        except ClientError as e:
            if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
                raise

    elif n["eventType"] == "trip_end":
        expr = "SET endTime=:et, tripStatus=:s, updatedAt=:u"
        vals = {
            ":et": {"S": n["eventTime"]},
            ":s": {"S": "COMPLETED"},
            ":u": {"S": utc_now_iso()},
        }
        if n.get("lat") is not None:
            expr += ", endLat=:lat"
            vals[":lat"] = {"N": str(n["lat"])}
        if n.get("lon") is not None:
            expr += ", endLon=:lon"
            vals[":lon"] = {"N": str(n["lon"])}

        ddb.update_item(
            TableName=TRIPS_TABLE,
            Key={"PK": {"S": pk}, "SK": {"S": sk}},
            UpdateExpression=expr,
            ExpressionAttributeValues=vals,
        )

        # Old model, now async: enqueue trip summary build
        sqs.send_message(
            QueueUrl=TRIP_SUMMARY_QUEUE_URL,
            MessageBody=json.dumps(
                {
                    "vin": n["vin"],
                    "tripId": n["tripId"],
                    "endTime": n["eventTime"],
                    "provider": n.get("providerId", "unknown"),
                    "env": ENVIRONMENT,
                    "project": PROJECT_NAME,
                }
            ),
        )

# ---------------------------------------------------------
# PSL Enrichment Job (Option 2) - enqueue on new inserts
# ---------------------------------------------------------
def _send_psl_job_if_applicable(n: dict, inserted_new_event: bool, telemetry_pk: str, telemetry_sk: str):
    if not PSL_ENRICH_QUEUE_URL:
        return
    if not inserted_new_event:
        return

    if n.get("lat") is None or n.get("lon") is None or n.get("speed_mph") is None:
        return

    job = {
        "schemaVersion": PSL_JOB_SCHEMA_VERSION,
        "vin": n["vin"],
        "tripId": n["tripId"],
        "eventType": n.get("eventType"),
        "eventTime": n["eventTime"],
        "messageId": n["messageId"],
        "providerId": n.get("providerId", "unknown"),
        "lat": n["lat"],
        "lon": n["lon"],
        "speed_mph": n["speed_mph"],

        # deterministic update keys for enricher
        "telemetryPk": telemetry_pk,
        "telemetrySk": telemetry_sk,

        "env": ENVIRONMENT,
        "project": PROJECT_NAME,
    }

    try:
        sqs.send_message(QueueUrl=PSL_ENRICH_QUEUE_URL, MessageBody=json.dumps(job))
    except Exception:
        logger.exception("Failed to enqueue PSL enrichment job (non-fatal)")

# ---------------------------------------------------------
# Lambda Handler
# ---------------------------------------------------------
def lambda_handler(event, context):
    records = event.get("Records") or []
    logger.info(
        json.dumps(
            {
                "msg": "Received Kinesis batch",
                "recordCount": len(records),
                "env": ENVIRONMENT,
                "project": PROJECT_NAME,
            }
        )
    )

    for r in records:
        try:
            payload = json.loads(base64.b64decode(r["kinesis"]["data"]).decode("utf-8"))
            require_dict(payload, "Kinesis record must decode to a JSON object")

            n = _normalize(payload)

            # Hard requirements for normalized storage
            if not n.get("vin") or not n.get("tripId") or not n.get("eventType") or not n.get("eventTime") or not n.get("messageId"):
                logger.warning(f"Dropping: Missing required fields vin/trip/type/time/msgId → {payload}")
                continue

            inserted, telemetry_pk, telemetry_sk = _put_telemetry_event(n)

            _update_vehicle_state(n)
            _write_trip(n)

            _send_psl_job_if_applicable(
                n,
                inserted_new_event=inserted,
                telemetry_pk=telemetry_pk,
                telemetry_sk=telemetry_sk,
            )

        except Exception as e:
            # For Kinesis triggers, one bad record should not poison the whole batch.
            logger.error(f"Failed processing record (skipping). err={e}")

    return {"status": "ok", "processed": len(records)}
