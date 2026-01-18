# ============================================================
# onpoint-dev-telematics-processor  (Kinesis -> Normalize -> DDB + SQS)
# Adds: PSL Enrich Job (Option 2) -> SQS (psl-enrich-job-1.0)
# ============================================================
import base64
import json
import os
import logging
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ddb = boto3.client("dynamodb")
sqs = boto3.client("sqs")

TELEMETRY_EVENTS_TABLE = os.environ["TELEMETRY_EVENTS_TABLE"]
VEHICLE_STATE_TABLE = os.environ["VEHICLE_STATE_TABLE"]
TRIPS_TABLE = os.environ["TRIPS_TABLE"]
TRIP_SUMMARY_QUEUE_URL = os.environ["TRIP_SUMMARY_QUEUE_URL"]

# NEW: PSL enrich queue (Option 2)
PSL_ENRICH_QUEUE_URL = os.environ.get("PSL_ENRICH_QUEUE_URL")  # optional; if not set, PSL is skipped
PSL_JOB_SCHEMA_VERSION = os.environ.get("PSL_JOB_SCHEMA_VERSION", "psl-enrich-job-1.0")

# Enforce schema version for incoming envelope
EXPECTED_SCHEMA_VERSION = os.environ.get("EXPECTED_SCHEMA_VERSION", "telematics-1.0")

# Normalized schema version (what we write)
NORMALIZED_SCHEMA_VERSION = os.environ.get("NORMALIZED_SCHEMA_VERSION", "normalized-telematics-1.0")

KM_TO_MILES = 0.621371
KPH_TO_MPH = 0.621371

# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _iso_from_epoch(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, tz=timezone.utc).isoformat()

def _num(v):
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

    return _iso_now()

def _get_location(raw: dict):
    geo = raw.get("cx_geolocation") or {}
    lat = _num(geo.get("cx_latitude"))
    lon = _num(geo.get("cx_longitude"))
    heading = _num(geo.get("cx_heading"))
    altitude_m = _num(geo.get("cx_altitude"))
    return lat, lon, heading, altitude_m

def _get_speed_mph(raw: dict):
    sp = raw.get("cx_vehicle_speed") or {}
    if isinstance(sp, dict):
        kph = _num(sp.get("value"))
        if kph is not None:
            return kph * KPH_TO_MPH
    return None

def _get_odometer_miles(raw: dict):
    odo = raw.get("cx_odometer") or {}
    if isinstance(odo, dict):
        km = _num(odo.get("value"))
        if km is not None:
            return km * KM_TO_MILES
    return None

def _get_engine_speed_rpm(raw: dict):
    eng = raw.get("cx_engine") or {}
    es = eng.get("cx_engine_speed")
    if isinstance(es, dict):
        return _num(es.get("value"))
    return None

def _get_coolant_temp_c(raw: dict):
    eng = raw.get("cx_engine") or {}
    ct = eng.get("cx_coolant_temp")
    if isinstance(ct, dict):
        return _num(ct.get("value"))
    return None

def _get_battery_volts(raw: dict):
    batt = (raw.get("cx_battery") or {}).get("cx_battery_level")
    if isinstance(batt, dict):
        return _num(batt.get("value"))
    return None

def _get_fuel_percent(raw: dict):
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

def _get_fuel_level_gallons(raw: dict):
    """
    Authoritative absolute fuel: cx_fuel.cx_abs_fuel_level.value (gallons)
    """
    fuel = raw.get("cx_fuel") or {}
    absf = fuel.get("cx_abs_fuel_level")
    if isinstance(absf, dict):
        return _num(absf.get("value"))
    return None

def _get_ignition_status(raw: dict):
    ign = raw.get("cx_ignition_state")
    if ign in (1, 1.0, True):
        return "ON"
    if ign in (0, 0.0, False):
        return "OFF"
    # fallback if ignition_state missing
    eng = raw.get("cx_engine") or {}
    ign2 = eng.get("cx_ign_status")
    if ign2 in (1, 1.0):
        return "ON"
    if ign2 in (0, 0.0):
        return "OFF"
    return None  # optional

def _derive_vehicle_state(event_type: str, speed_mph, ignition_status) -> str:
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
def _normalize(envelope: dict) -> dict:
    schema_version = envelope.get("schemaVersion")
    if schema_version and schema_version != EXPECTED_SCHEMA_VERSION:
        raise ValueError(f"Unsupported schemaVersion: {schema_version} (expected {EXPECTED_SCHEMA_VERSION})")

    raw = envelope.get("data", {}) or {}

    vin = raw.get("cx_vehicle_id")
    trip_id = raw.get("cx_trip_id")
    event_type = raw.get("cx_event_type")
    event_time = _parse_event_time(raw)

    message_id = raw.get("cx_msg_id") or envelope.get("messageId")
    provider_id = envelope.get("providerId") or envelope.get("provider") or "unknown"

    ignition_status = _get_ignition_status(raw)
    speed_mph = _get_speed_mph(raw)
    lat, lon, heading, altitude_m = _get_location(raw)
    odometer_miles = _get_odometer_miles(raw)

    fuel_percent = _get_fuel_percent(raw)
    fuel_level_gallons = _get_fuel_level_gallons(raw)

    battery_volts = _get_battery_volts(raw)
    coolant_temp_c = _get_coolant_temp_c(raw)
    engine_speed_rpm = _get_engine_speed_rpm(raw)

    vehicle_state = _derive_vehicle_state(event_type, speed_mph, ignition_status)

    return {
        "schemaVersion": NORMALIZED_SCHEMA_VERSION,

        "vin": vin,
        "tripId": trip_id,
        "eventType": event_type,
        "eventTime": event_time,
        "messageId": message_id,
        "providerId": provider_id,

        "ignition_status": ignition_status,
        "vehicleState": vehicle_state,

        "lat": lat,
        "lon": lon,
        "heading": heading,
        "altitudeM": altitude_m,

        "speed_mph": speed_mph,
        "odometer_Miles": odometer_miles,

        "fuelPercent": fuel_percent,
        "fuelLevelGallons": fuel_level_gallons,

        "batteryVolts": battery_volts,
        "coolantTempC": coolant_temp_c,
        "engine_speed_rpm": engine_speed_rpm,

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
        "ingestedAt": {"S": _iso_now()},
        "raw": {"S": json.dumps(n["raw"])},
    }

    if n.get("ignition_status") is not None:
        item["ignition_status"] = {"S": n["ignition_status"]}

    def add_num(key):
        if n.get(key) is not None:
            item[key] = {"N": str(n[key])}

    for k in [
        "lat", "lon", "heading", "altitudeM",
        "speed_mph",
        "odometer_Miles",
        "fuelPercent",
        "fuelLevelGallons",
        "batteryVolts",
        "coolantTempC",
        "engine_speed_rpm",
    ]:
        add_num(k)

    try:
        ddb.put_item(
            TableName=TELEMETRY_EVENTS_TABLE,
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
        )
        return True, pk, sk  # inserted new
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
        ":u": {"S": _iso_now()},
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
    set_num("odometer_Miles", "odo")
    set_num("fuelPercent", "fp")
    set_num("fuelLevelGallons", "fg")

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
# Trips Table (Start/End + send trip_end to SQS)
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
            "createdAt": {"S": _iso_now()},
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
            ":u": {"S": _iso_now()},
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

        sqs.send_message(
            QueueUrl=TRIP_SUMMARY_QUEUE_URL,
            MessageBody=json.dumps({
                "vin": n["vin"],
                "tripId": n["tripId"],
                "endTime": n["eventTime"],
                "provider": n.get("providerId", "unknown"),
            }),
        )

# ---------------------------------------------------------
# NEW: Send PSL enrichment job (Option 2)
# We do this only when we have lat/lon/speed and a queue URL is configured.
# Also: we only enqueue when telemetry event is newly inserted to avoid duplicate jobs.
#
# IMPORTANT: Include telemetryPk/telemetrySk to allow PSL enricher to update
# the exact event item deterministically.
# ---------------------------------------------------------
def _send_psl_job_if_applicable(n: dict, inserted_new_event: bool, telemetry_pk: str, telemetry_sk: str):
    if not PSL_ENRICH_QUEUE_URL:
        return
    if not inserted_new_event:
        return

    # Need minimal fields to evaluate PSL + overspeed
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
    }

    try:
        sqs.send_message(
            QueueUrl=PSL_ENRICH_QUEUE_URL,
            MessageBody=json.dumps(job),
        )
    except Exception:
        # Non-fatal: we still keep normalized event in DDB
        logger.exception("Failed to enqueue PSL enrichment job")

# ---------------------------------------------------------
# Lambda Handler
# ---------------------------------------------------------
def lambda_handler(event, context):
    records = event.get("Records", [])
    logger.info(f"Received {len(records)} Kinesis records")

    for r in records:
        payload = json.loads(base64.b64decode(r["kinesis"]["data"]).decode("utf-8"))

        try:
            n = _normalize(payload)
        except Exception as e:
            logger.error(f"Dropping message due to schema/normalize error: {e}")
            continue

        # Hard requirements for normalized storage
        if not n.get("vin") or not n.get("tripId") or not n.get("eventType") or not n.get("eventTime") or not n.get("messageId"):
            logger.warning(f"Dropping: Missing required fields vin/trip/type/time/msgId → {payload}")
            continue

        inserted, telemetry_pk, telemetry_sk = _put_telemetry_event(n)

        # Always update snapshot/trips (idempotency handled by DynamoDB)
        _update_vehicle_state(n)
        _write_trip(n)

        # NEW: PSL Enrichment job (Option 2)
        _send_psl_job_if_applicable(n, inserted_new_event=inserted, telemetry_pk=telemetry_pk, telemetry_sk=telemetry_sk)

    return {"status": "ok", "processed": len(records)}