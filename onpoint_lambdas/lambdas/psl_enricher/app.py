import json
import os
import time
import logging
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ddb = boto3.client("dynamodb")
events = boto3.client("events")

# -----------------------------
# Env
# -----------------------------
TELEMETRY_EVENTS_TABLE = os.environ["TELEMETRY_EVENTS_TABLE"]
PSL_CACHE_TABLE = os.environ["PSL_CACHE_TABLE"]
OVERSPEED_DEDUPE_TABLE = os.environ["OVERSPEED_DEDUPE_TABLE"]  # UPDATED

OVERPASS_ENDPOINTS = os.environ.get("OVERPASS_ENDPOINTS", "https://overpass-api.de/api/interpreter")  # UPDATED
OVERPASS_URL = OVERPASS_ENDPOINTS.split(",")[0].strip()  # UPDATED
OVERPASS_TIMEOUT_SECONDS = int(os.environ.get("OVERPASS_TIMEOUT_SECONDS", "10"))  # UPDATED
OVERPASS_MAX_RETRIES = int(os.environ.get("OVERPASS_MAX_RETRIES", "1"))  # UPDATED

OVERSPEED_THRESHOLD_MPH_DEFAULT = float(os.environ.get("OVERSPEED_THRESHOLD_MPH", "5"))
SEVERE_THRESHOLD_MPH_DEFAULT = float(os.environ.get("SEVERE_THRESHOLD_MPH", "15"))
COOLDOWN_SECONDS_DEFAULT = int(os.environ.get("COOLDOWN_SECONDS", "60"))

CACHE_TTL_DAYS = int(os.environ.get("CACHE_TTL_DAYS", "14"))
NULL_CACHE_TTL_HOURS = int(os.environ.get("NULL_CACHE_TTL_HOURS", "12"))

ALERT_SCHEMA_VERSION = "overspeed-alert-1.0"
RULE_VERSION = "overspeed-rule-1.0"
SUPPORTED_JOB_SCHEMAS = {"psl-enrich-job-1.0", "psl-job-1.0"}

# -----------------------------
# Helpers
# -----------------------------
def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _num(v):
    if v is None:
        return None
    if isinstance(v, Decimal):
        return float(v)
    try:
        return float(v)
    except Exception:
        return None

def _ttl_epoch_days(days: int) -> int:
    return int(time.time()) + int(days) * 86400

def _ttl_epoch_hours(hours: int) -> int:
    return int(time.time()) + int(hours) * 3600

def _geo_cell(lat: float, lon: float, precision: int = 4) -> str:
    # caching grid key (coarse by design)
    return f"{round(lat, precision)}:{round(lon, precision)}"

def _ddb_get_str(it, key):
    v = it.get(key)
    if not v:
        return None
    if "S" in v:
        return v["S"]
    return None

def _ddb_get_num(it, key):
    v = it.get(key)
    if not v:
        return None
    if "N" in v:
        return _num(v["N"])
    return None

# -----------------------------
# PSL Cache
# PK = CELL#{cell}, SK = PSL
# -----------------------------
def _get_cached_psl(cell: str):
    resp = ddb.get_item(
        TableName=PSL_CACHE_TABLE,
        Key={"PK": {"S": f"CELL#{cell}"}, "SK": {"S": "PSL"}},
        ConsistentRead=False,
    )
    it = resp.get("Item")
    if not it:
        return None

    exp = _ddb_get_num(it, "expiresAt")
    if exp is not None and time.time() > exp:
        return None

    psl = _ddb_get_num(it, "postedSpeedLimitMph")
    source = _ddb_get_str(it, "source") or "unknown"
    confidence = _ddb_get_str(it, "confidence") or "LOW"

    return {"psl_mph": psl, "source": source, "confidence": confidence}

def _put_cached_psl(cell: str, psl_mph, source: str, confidence: str):
    expires = _ttl_epoch_hours(NULL_CACHE_TTL_HOURS) if psl_mph is None else _ttl_epoch_days(CACHE_TTL_DAYS)

    item = {
        "PK": {"S": f"CELL#{cell}"},
        "SK": {"S": "PSL"},
        "expiresAt": {"N": str(expires)},
        "updatedAt": {"S": _iso_now()},
        "source": {"S": source},
        "confidence": {"S": confidence},
    }
    if psl_mph is not None:
        item["postedSpeedLimitMph"] = {"N": str(psl_mph)}

    ddb.put_item(TableName=PSL_CACHE_TABLE, Item=item)

# -----------------------------
# Overpass lookup
# -----------------------------
def _overpass_lookup_maxspeed(lat: float, lon: float) -> str | None:
    query = f"""
    [out:json][timeout:20];
    (
      way(around:40,{lat},{lon})["highway"]["maxspeed"];
    );
    out tags 1;
    """
    data = query.encode("utf-8")
    req = urllib.request.Request(
        OVERPASS_URL,
        data=data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "onpoint-psl-enricher/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=OVERPASS_TIMEOUT_SECONDS) as resp:  # UPDATED
        body = resp.read().decode("utf-8")
        j = json.loads(body)

    elements = j.get("elements", [])
    if not elements:
        return None

    tags = elements[0].get("tags") or {}
    return tags.get("maxspeed")

def _parse_maxspeed_to_mph(maxspeed: str | None):
    if not maxspeed or not isinstance(maxspeed, str):
        return (None, "LOW")

    ms = maxspeed.strip().lower()

    if any(x in ms for x in ["signals", "walk", "none", "variable"]):
        return (None, "LOW")

    num = ""
    for ch in ms:
        if ch.isdigit() or ch == ".":
            num += ch
        elif num:
            break
    if not num:
        return (None, "LOW")

    val = _num(num)
    if val is None:
        return (None, "LOW")

    if "km" in ms:
        return (val * 0.621371, "MEDIUM")
    if "mph" in ms:
        return (val, "HIGH")

    # unit missing -> usable but ambiguous
    return (val, "LOW")

# -----------------------------
# Job adapters / normalization
# -----------------------------
def _normalize_job(job: dict):
    sv = job.get("schemaVersion")
    if sv == "psl-enrich-job-1.0":
        return {
            "schemaVersion": sv,
            "vin": job.get("vin"),
            "tripId": job.get("tripId"),
            "eventTime": job.get("eventTime"),
            "messageId": job.get("messageId"),
            "lat": _num(job.get("lat")),
            "lon": _num(job.get("lon")),
            # allow camelCase speed field
            "speed_mph": _num(job.get("speed_mph") or job.get("speedMph")),
            # provider field name may vary
            "providerId": job.get("providerId") or job.get("provider") or "unknown",
        }
    if sv == "psl-job-1.0":
        loc = job.get("location") or {}
        lat_val = job.get("lat") or job.get("latitude") or loc.get("lat") or loc.get("latitude")
        lon_val = job.get("lon") or job.get("longitude") or loc.get("lon") or loc.get("longitude")

        speed_val = job.get("speed_mph") or job.get("speedMph")
        if speed_val is None:
            kph = job.get("speedKph") or job.get("speed_kph")
            speed_val = (_num(kph) * 0.621371) if kph is not None else None

        return {
            "schemaVersion": sv,
            "vin": job.get("vin"),
            "tripId": job.get("tripId") or job.get("tripID") or job.get("trip_id"),
            "eventTime": job.get("eventTime") or job.get("timestamp") or job.get("time"),
            "messageId": job.get("messageId") or job.get("msgId") or job.get("id"),
            "lat": _num(lat_val),
            "lon": _num(lon_val),
            "speed_mph": _num(speed_val),
            "providerId": job.get("providerId") or job.get("provider") or "unknown",
        }
    return None

# -----------------------------
# Cooldown / dedupe
# PK = OVERSPEED#VIN#{vin}#SEV#{severity}, SK = COOLDOWN
# -----------------------------
def _dedupe_allow(vin: str, severity: str, cooldown_seconds: int) -> bool:
    pk = f"OVERSPEED#VIN#{vin}#SEV#{severity}"
    now = int(time.time())
    expires = now + int(cooldown_seconds)

    try:
        ddb.put_item(
            TableName=OVERSPEED_DEDUPE_TABLE,  # UPDATED
            Item={
                "PK": {"S": pk},
                "SK": {"S": "COOLDOWN"},
                "expiresAt": {"N": str(expires)},
                "createdAt": {"S": _iso_now()},
            },
            ConditionExpression="attribute_not_exists(PK)",
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise

# -----------------------------
# Update telemetry event with PSL fields (best-effort)
# -----------------------------
def _update_telemetry_event_with_psl(vin: str, trip_id: str, event_time: str, message_id: str,
                                    psl_mph, source: str, confidence: str):
    pk = f"VEHICLE#{vin}#TRIP#{trip_id}"
    sk = f"TS#{event_time}#MSG#{message_id}"

    expr = "SET pslUpdatedAt=:u, pslSource=:s, pslConfidence=:c"
    vals = {
        ":u": {"S": _iso_now()},
        ":s": {"S": source},
        ":c": {"S": confidence},
    }
    if psl_mph is not None:
        expr += ", postedSpeedLimit=:p"
        vals[":p"] = {"N": str(psl_mph)}

    try:
        ddb.update_item(
            TableName=TELEMETRY_EVENTS_TABLE,
            Key={"PK": {"S": pk}, "SK": {"S": sk}},
            UpdateExpression=expr,
            ExpressionAttributeValues=vals,
        )
    except ClientError:
        logger.exception(f"Failed to update PSL fields for {pk} {sk}")

# -----------------------------
# Mark telemetry event overspeed fields (best-effort)
# -----------------------------
def _mark_telemetry_event_overspeed(vin: str, trip_id: str, event_time: str, message_id: str,
                                   severity: str, speed_mph: float, psl_mph: float,
                                   threshold_used: float, severe_threshold_used: float,
                                   cooldown_seconds_used: int, policy_source: str):
    pk = f"VEHICLE#{vin}#TRIP#{trip_id}"
    sk = f"TS#{event_time}#MSG#{message_id}"

    delta = speed_mph - psl_mph

    expr = (
        "SET overspeed=:os, overspeedSeverity=:sev, overspeedEmittedAt=:t, "
        "overspeedDeltaMph=:d, overspeedThresholdUsed=:th, "
        "overspeedSevereThresholdUsed=:sth, overspeedCooldownSecondsUsed=:cd, "
        "overspeedPolicySource=:ps"
    )
    vals = {
        ":os": {"N": "1"},
        ":sev": {"S": severity},
        ":t": {"S": _iso_now()},
        ":d": {"N": str(delta)},
        ":th": {"N": str(threshold_used)},
        ":sth": {"N": str(severe_threshold_used)},
        ":cd": {"N": str(int(cooldown_seconds_used))},
        ":ps": {"S": policy_source},
    }

    try:
        ddb.update_item(
            TableName=TELEMETRY_EVENTS_TABLE,
            Key={"PK": {"S": pk}, "SK": {"S": sk}},
            UpdateExpression=expr,
            ExpressionAttributeValues=vals,
        )
    except ClientError:
        logger.exception(f"Failed to mark overspeed for {pk} {sk}")

# -----------------------------
# EventBridge emit
# -----------------------------
def _emit_overspeed_event(detail: dict):
    events.put_events(
        Entries=[
            {
                "Source": "onpoint.telemetry",
                "DetailType": "OverspeedDetected",
                "Detail": json.dumps(detail),
            }
        ]
    )

# -----------------------------
# Threshold resolution
# For now: global defaults only (policy tables can be added later)
# -----------------------------
def _resolve_thresholds(vin: str):
    return (
        OVERSPEED_THRESHOLD_MPH_DEFAULT,
        SEVERE_THRESHOLD_MPH_DEFAULT,
        COOLDOWN_SECONDS_DEFAULT,
        "GLOBAL_DEFAULT",
        None,  # fleetId
    )

# -----------------------------
# Main processing
# -----------------------------
def _process_job(job: dict):
    sv = job.get("schemaVersion")
    norm = _normalize_job(job)
    if norm is None:
        logger.warning(f"Skipping: unknown job schemaVersion={sv} msgId={job.get('messageId')}")
        return
    vin = norm.get("vin")
    trip_id = norm.get("tripId")
    event_time = norm.get("eventTime")
    message_id = norm.get("messageId")
    lat = norm.get("lat")
    lon = norm.get("lon")
    speed_mph = norm.get("speed_mph")
    provider = norm.get("providerId") or "unknown"

    if not vin or not trip_id or not event_time or not message_id:
        logger.warning(f"Skipping: missing identity fields vin/tripId/eventTime/messageId msgId={message_id}")
        return
    if lat is None or lon is None or speed_mph is None:
        return

    th, sth, cooldown, policy_source, fleet_id = _resolve_thresholds(vin)

    # PSL lookup with caching
    cell = _geo_cell(lat, lon, precision=4)
    cached = _get_cached_psl(cell)

    if cached is None:
        try:
            maxspeed = _overpass_lookup_maxspeed(lat, lon)
            psl_mph, conf = _parse_maxspeed_to_mph(maxspeed)
            src = "OSM_OVERPASS"
        except Exception:
            logger.exception("Overpass lookup failed; caching null PSL for short TTL")
            psl_mph, conf = None, "LOW"
            src = "OSM_OVERPASS_ERROR"

        _put_cached_psl(cell, psl_mph, src, conf)
        cached = {"psl_mph": psl_mph, "source": src, "confidence": conf}

    psl_mph = cached["psl_mph"]
    psl_source = cached["source"]
    psl_conf = cached["confidence"]

    # Always store PSL fields (even if psl_mph is None)
    _update_telemetry_event_with_psl(
        vin, trip_id, event_time, message_id,
        psl_mph, psl_source, psl_conf
    )

    # If PSL missing -> cannot evaluate overspeed
    if psl_mph is None:
        return

    # Overspeed evaluation (inclusive)
    overspeed_at = psl_mph + float(th)
    severe_at = psl_mph + float(sth)

    severity = None
    if speed_mph >= severe_at:
        severity = "SEVERE"
    elif speed_mph >= overspeed_at:
        severity = "STANDARD"

    if not severity:
        return

    # Cooldown / dedupe per VIN + severity
    if not _dedupe_allow(vin, severity, int(cooldown)):
        return

    detail = {
        "schemaVersion": ALERT_SCHEMA_VERSION,
        "ruleVersion": RULE_VERSION,
        "vin": vin,
        "fleetId": fleet_id,
        "tripId": trip_id,
        "eventTime": event_time,
        "messageId": message_id,
        "provider": provider,
        "lat": lat,
        "lon": lon,
        "speedMph": speed_mph,
        "postedSpeedLimitMph": psl_mph,
        "deltaMph": speed_mph - psl_mph,
        "thresholdMphUsed": float(th),
        "severeThresholdMphUsed": float(sth),
        "cooldownSecondsUsed": int(cooldown),
        "policySource": policy_source,
        "pslSource": psl_source,
        "pslConfidence": psl_conf,
        "severity": severity,
        "generatedAt": _iso_now(),
    }

    _emit_overspeed_event(detail)

    # Also mark the telemetry event record for debugging/analytics
    _mark_telemetry_event_overspeed(
        vin=vin,
        trip_id=trip_id,
        event_time=event_time,
        message_id=message_id,
        severity=severity,
        speed_mph=speed_mph,
        psl_mph=psl_mph,
        threshold_used=float(th),
        severe_threshold_used=float(sth),
        cooldown_seconds_used=int(cooldown),
        policy_source=policy_source,
    )

def lambda_handler(event, context):
    for rec in event.get("Records", []):
        body = rec.get("body") or "{}"
        try:
            job = json.loads(body)
        except Exception:
            logger.warning(f"Bad JSON in SQS message: {body[:200]}")
            continue

        _process_job(job)

    return {"status": "ok"}
