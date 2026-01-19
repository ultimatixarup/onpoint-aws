import json
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ddb = boto3.client("dynamodb")

TELEMETRY_EVENTS_TABLE = os.environ["TELEMETRY_EVENTS_TABLE"]
TRIP_SUMMARY_TABLE = os.environ["TRIP_SUMMARY_TABLE"]

TRIP_SUMMARY_SCHEMA_VERSION = os.environ.get("TRIP_SUMMARY_SCHEMA_VERSION", "trip-summary-1.0")

# Threshold to treat upward jumps in absolute fuel (gallons) as refuel events.
REFUEL_NOISE_THRESHOLD_GAL = float(os.environ.get("REFUEL_NOISE_THRESHOLD_GAL", "0.25"))

# Used for legacy OS1/OS2 buckets when PSL exists but overspeed enrichment isn't present
DEFAULT_SPEED_THRESHOLD_MPH = float(os.environ.get("SPEED_THRESHOLD_MPH", "5"))


# -----------------------------------------------------------
# Utility helpers
# -----------------------------------------------------------

def _parse_iso(ts: str) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


def _num_from_ddb(it: Dict[str, Any], attr: str) -> Optional[float]:
    v = it.get(attr)
    if not isinstance(v, dict):
        return None
    n = v.get("N")
    if n is None:
        return None
    try:
        return float(Decimal(n))
    except Exception:
        return None


def _str_from_ddb(it: Dict[str, Any], attr: str) -> Optional[str]:
    v = it.get(attr)
    if not isinstance(v, dict):
        return None
    s = v.get("S")
    return s if isinstance(s, str) else None


def _safe_div(a: Optional[float], b: Optional[float]) -> Optional[float]:
    if a is None or b in (None, 0):
        return None
    try:
        return a / b
    except Exception:
        return None


def _sec_to_hms(sec: float) -> str:
    sec = int(sec or 0)
    h = sec // 3600
    m = (sec % 3600) // 60
    s = sec % 60
    return f"{h:02}:{m:02}:{s:02}"


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(v, hi))


# -----------------------------------------------------------
# Fetch events from DynamoDB
# -----------------------------------------------------------

def _fetch_events(pk: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    last_key = None

    while True:
        params = {
            "TableName": TELEMETRY_EVENTS_TABLE,
            "KeyConditionExpression": "PK = :pk",
            "ExpressionAttributeValues": {":pk": {"S": pk}},
        }
        if last_key:
            params["ExclusiveStartKey"] = last_key

        resp = ddb.query(**params)
        out.extend(resp.get("Items", []))

        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break

    # Items already time-ordered by SK (TS#<eventTime>...), but keep explicit sort
    out.sort(key=lambda x: x["SK"]["S"])
    return out


# -----------------------------------------------------------
# Extract normalized event from Telemetry Events DynamoDB item
# -----------------------------------------------------------

def _convert_event(it: Dict[str, Any]) -> Dict[str, Any]:
    raw = {}
    raw_s = _str_from_ddb(it, "raw")
    if raw_s:
        try:
            raw = json.loads(raw_s)
        except Exception:
            raw = {}

    evt: Dict[str, Any] = {}

    evt["time"] = _str_from_ddb(it, "eventTime")
    evt["dt"] = _parse_iso(evt["time"]) if evt["time"] else None

    evt["eventType"] = _str_from_ddb(it, "eventType")
    evt["vehicleState"] = _str_from_ddb(it, "vehicleState")

    evt["speedMph"] = _num_from_ddb(it, "speed_mph")
    evt["lat"] = _num_from_ddb(it, "lat")
    evt["lon"] = _num_from_ddb(it, "lon")
    evt["heading"] = _num_from_ddb(it, "heading")
    evt["altitudeM"] = _num_from_ddb(it, "altitudeM")

    evt["odometerMiles"] = _num_from_ddb(it, "odometer_Miles")
    evt["fuelGallonsAbs"] = _num_from_ddb(it, "fuelLevelGallons")  # cx_abs_fuel_level (gallons)
    evt["fuelPercent"] = _num_from_ddb(it, "fuelPercent")

    evt["batteryVolts"] = _num_from_ddb(it, "batteryVolts")
    evt["coolantC"] = _num_from_ddb(it, "coolantTempC")
    evt["engineRpm"] = _num_from_ddb(it, "engine_speed_rpm")

    # -------------------------
    # PSL enrichment fields
    # -------------------------
    evt["psl"] = _num_from_ddb(it, "postedSpeedLimitMph")
    if evt["psl"] is None:
        # backward compatibility if older attribute name used
        evt["psl"] = _num_from_ddb(it, "postedSpeedLimit")

    evt["pslSource"] = _str_from_ddb(it, "pslSource")
    evt["pslConfidence"] = _str_from_ddb(it, "pslConfidence")

    # pslHttpStatus is stored as a Number in your example
    evt["pslHttpStatus"] = _num_from_ddb(it, "pslHttpStatus")

    # -------------------------
    # Overspeed enrichment fields (authoritative)
    # NOTE: your real telemetry event record stores:
    #   overspeed (N=1), overspeedSeverity, overspeedMilesWindowApprox
    # -------------------------
    evt["overspeed"] = _num_from_ddb(it, "overspeed")  # 1 means overspeed event
    evt["overspeedSeverity"] = _str_from_ddb(it, "overspeedSeverity")  # STANDARD/SEVERE
    evt["overspeedMilesWindow"] = _num_from_ddb(it, "overspeedMilesWindowApprox")  # preferred
    if evt["overspeedMilesWindow"] is None:
        # fallback for any earlier name you might have tried
        evt["overspeedMilesWindow"] = _num_from_ddb(it, "overspeedMilesStep")

    # Tire if you store it later as JSON string field "tire"
    tire_s = _str_from_ddb(it, "tire")
    evt["tire"] = None
    if tire_s:
        try:
            evt["tire"] = json.loads(tire_s)
        except Exception:
            evt["tire"] = None

    evt["seatbelt"] = _str_from_ddb(it, "seatbelt")

    evt["collision"] = _num_from_ddb(it, "collision")
    evt["collision"] = True if evt["collision"] == 1 else False

    # Alerts & DTC from raw payload
    evt["cx_alerts"] = raw.get("cx_alerts")
    evt["cx_dtc"] = raw.get("cx_dtc") or raw.get("cx_vehicle_dtc")

    evt["raw"] = raw
    return evt


# -----------------------------------------------------------
# Harsh events from cx_alerts (authoritative)
# -----------------------------------------------------------

def _extract_alerts_and_harsh(evt: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], int, int, int]:
    alerts_out: List[Dict[str, Any]] = []
    ha = hb = hc = 0

    cx_alerts = evt.get("cx_alerts")
    if not cx_alerts:
        return alerts_out, ha, hb, hc

    alerts_out.append({
        "type": "cx_alerts",
        "timestamp": evt.get("time"),
        "message": cx_alerts
    })

    def iter_alert_records(x):
        if isinstance(x, list):
            for a in x:
                yield a
        elif isinstance(x, dict):
            if "alerts" in x and isinstance(x["alerts"], list):
                for a in x["alerts"]:
                    yield a
            else:
                yield x

    for a in iter_alert_records(cx_alerts):
        if not isinstance(a, dict):
            continue

        desc = (a.get("alert_description") or a.get("description") or a.get("type") or "")
        desc_l = str(desc).lower()

        if "harsh" in desc_l and "brak" in desc_l:
            hb += 1
        elif "harsh" in desc_l and "acceler" in desc_l:
            ha += 1
        elif "harsh" in desc_l and ("corner" in desc_l or "turn" in desc_l or "lateral" in desc_l):
            hc += 1

    return alerts_out, ha, hb, hc


# -----------------------------------------------------------
# Compute night miles
# -----------------------------------------------------------

def _night_miles(events: List[Dict[str, Any]]) -> float:
    total = 0.0
    for i in range(1, len(events)):
        e1, e2 = events[i - 1], events[i]
        if not e2.get("dt") or not e1.get("dt"):
            continue

        o1 = e1.get("odometerMiles")
        o2 = e2.get("odometerMiles")
        if o1 is None or o2 is None or o2 < o1:
            continue

        delta = o2 - o1
        hr = e2["dt"].hour
        if hr >= 23 or hr < 5:
            total += delta
    return total


# -----------------------------------------------------------
# Safety score algorithm (simplified)
# NOTE: still uses legacy os1/os2 buckets as you originally had.
# If you want, we can optionally incorporate enriched overspeed miles.
# -----------------------------------------------------------

def _safety_score(max_speed_mph: float,
                 ha: int, hb: int, hc: int,
                 os1: float, os2: float,
                 idle_sec: float, total_sec: float) -> int:
    score = 100

    if max_speed_mph and max_speed_mph > 80:
        score -= 5

    score -= (ha * 2 + hb * 2 + hc * 2)
    score -= int((os1 or 0) * 0.5)
    score -= int(os2 or 0)

    if total_sec and total_sec > 0:
        if (idle_sec / total_sec) > 0.20:
            score -= 3

    return int(_clamp(score, 1, 100))


# -----------------------------------------------------------
# Fuel consumed + refuel detection from absolute fuel gallons series
# -----------------------------------------------------------

def _fuel_stats_from_abs(events: List[Dict[str, Any]]) -> Tuple[Optional[float], Optional[float], Optional[float], float]:
    vals: List[float] = [e["fuelGallonsAbs"] for e in events if isinstance(e.get("fuelGallonsAbs"), (int, float))]
    if not vals:
        return None, None, None, 0.0

    start = vals[0]
    end = vals[-1]
    consumed = None
    if start is not None and end is not None:
        consumed = max(0.0, start - end)

    refueled = 0.0
    for i in range(1, len(vals)):
        d = vals[i] - vals[i - 1]
        if d > REFUEL_NOISE_THRESHOLD_GAL:
            refueled += d

    return start, end, consumed, refueled


# -----------------------------------------------------------
# Main summary computation
# -----------------------------------------------------------

def _build_summary(events: List[Dict[str, Any]], vin: str, trip_id: str, provider: str) -> Dict[str, Any]:
    first, last = events[0], events[-1]
    t_start, t_end = first.get("dt"), last.get("dt")

    duration_sec = 0.0
    if t_start and t_end:
        duration_sec = max(0.0, (t_end - t_start).total_seconds())

    # ----- Odometer -----
    o_start = first.get("odometerMiles")
    o_end = last.get("odometerMiles")
    miles = None
    if o_start is not None and o_end is not None:
        miles = max(0.0, o_end - o_start)

    # ----- Fuel (absolute gallons) -----
    f_start, f_end, fuel_consumed, refueled = _fuel_stats_from_abs(events)

    idling_sec = 0.0
    driving_sec = 0.0
    fuel_idle = 0.0

    max_mph = 0.0
    city_miles = city_fuel = 0.0
    hwy_miles = hwy_fuel = 0.0

    # Legacy “OS1/OS2” buckets
    os1 = os2 = 0.0
    speed_threshold = DEFAULT_SPEED_THRESHOLD_MPH

    # NEW: enriched overspeed totals (authoritative from PSL enricher)
    os_std_miles = 0.0
    os_sev_miles = 0.0
    os_std_count = 0
    os_sev_count = 0

    # Tire
    tire_start = first.get("tire")
    tire_end = last.get("tire")
    tire_max: Dict[str, float] = {}

    # Battery
    b_start = b_end = b_max = None

    # Coolant
    c_start = c_end = c_max = None

    # Event counters
    ha = hb = hc = 0
    collisions = 0
    seatbelt_count = 0
    seatbelt_miles = 0.0

    alerts: List[Dict[str, Any]] = []
    dtc: List[Dict[str, Any]] = []

    for i in range(1, len(events)):
        p, c = events[i - 1], events[i]

        if not p.get("dt") or not c.get("dt"):
            continue

        dt = (c["dt"] - p["dt"]).total_seconds()
        if dt < 0:
            dt = 0.0

        mph = c.get("speedMph") or 0.0
        max_mph = max(max_mph, mph)

        o1 = p.get("odometerMiles")
        o2 = c.get("odometerMiles")
        step = 0.0
        if o1 is not None and o2 is not None:
            step = max(0.0, o2 - o1)

        # Idle vs driving
        if mph < 1.0 and step == 0.0:
            idling_sec += dt
        else:
            driving_sec += dt

        # PSL (optional) for legacy bucketing + city/highway split
        psl = c.get("psl")
        if isinstance(psl, (int, float)) and psl > 0:
            if mph > psl + speed_threshold:
                os1 += step
            if mph > psl + 15:
                os2 += step

            if psl <= 50:
                city_miles += step
                city_fuel += 0.0
            else:
                hwy_miles += step
                hwy_fuel += 0.0

        # ---------------------------------------------------
        # NEW: Overspeed enrichment rollups (preferred)
        # We only count when the event itself is flagged overspeed (=1)
        # and it has a severity.
        # Miles come from overspeedMilesWindowApprox (best-effort approx),
        # which your PSL enricher already writes.
        # ---------------------------------------------------
        if c.get("overspeed") == 1:
            sev = c.get("overspeedSeverity")
            miles_win = c.get("overspeedMilesWindow") or 0.0

            if sev == "STANDARD":
                os_std_count += 1
                if isinstance(miles_win, (int, float)):
                    os_std_miles += float(miles_win)
            elif sev == "SEVERE":
                os_sev_count += 1
                if isinstance(miles_win, (int, float)):
                    os_sev_miles += float(miles_win)

        # Tire max
        t = c.get("tire") or {}
        if isinstance(t, dict):
            for w in ["fr", "fl", "rr", "rl"]:
                nv = t.get(w)
                if isinstance(nv, (int, float)):
                    tire_max[w] = max(tire_max.get(w, 0.0), float(nv))

        # Battery
        bv = c.get("batteryVolts")
        if isinstance(bv, (int, float)):
            b_start = b_start if b_start is not None else float(bv)
            b_end = float(bv)
            b_max = float(bv) if b_max is None else max(b_max, float(bv))

        # Coolant
        ct = c.get("coolantC")
        if isinstance(ct, (int, float)):
            c_start = c_start if c_start is not None else float(ct)
            c_end = float(ct)
            c_max = float(ct) if c_max is None else max(c_max, float(ct))

        # Harsh events + Alerts (authoritative from cx_alerts)
        a_out, ha_inc, hb_inc, hc_inc = _extract_alerts_and_harsh(c)
        if a_out:
            alerts.extend(a_out)
        ha += ha_inc
        hb += hb_inc
        hc += hc_inc

        # Seatbelt
        if c.get("seatbelt") == "UNBUCKLED":
            seatbelt_count += 1
            seatbelt_miles += step

        # Collision
        if c.get("collision"):
            collisions += 1

        # DTC from raw
        cx_dtc = c.get("cx_dtc")
        if isinstance(cx_dtc, list):
            for code in cx_dtc:
                dtc.append({"code": str(code), "timestamp": c.get("time")})

    # MPG
    avg_mpg = _safe_div(miles, fuel_consumed)
    actual_mpg = _safe_div(miles, (fuel_consumed - fuel_idle) if fuel_consumed else None)

    city_mpg = _safe_div(city_miles, city_fuel) if city_fuel else None
    hwy_mpg = _safe_div(hwy_miles, hwy_fuel) if hwy_fuel else None

    night = _night_miles(events)
    score = _safety_score(max_mph, ha, hb, hc, os1, os2, idling_sec, duration_sec)

    fuel_indicator_percent = last.get("fuelPercent")
    fuel_indicator_abs = f_end

    summary: Dict[str, Any] = {
        "schemaVersion": TRIP_SUMMARY_SCHEMA_VERSION,
        "vin": vin,
        "tripId": trip_id,
        "fleetId": None,

        "startTime": first.get("time"),
        "endTime": last.get("time"),
        "engineHours": _sec_to_hms(duration_sec),
        "idlingTime": _sec_to_hms(idling_sec),
        "drivingTime": _sec_to_hms(driving_sec),

        "odometer": {
            "startMiles": o_start,
            "endMiles": o_end,
            "milesDriven": miles
        },

        "fuel": {
            "startGallons": f_start,
            "endGallons": f_end,
            "fuelConsumed": fuel_consumed,
            "fuelIdling": fuel_idle,
            "fuelIndicatorPercent": fuel_indicator_percent,
            "fuelIndicatorAbsoluteGallons": fuel_indicator_abs,
            "refueledGallons": refueled,
            "fuelCostUsd": None
        },

        "mpg": {
            "averageMpg": avg_mpg,
            "actualMpg": actual_mpg
        },

        "distance": {
            "nightMiles": night,
            "cityMiles": city_miles,
            "cityFuelGallons": city_fuel,
            "cityMpg": city_mpg,
            "highwayMiles": hwy_miles,
            "highwayFuelGallons": hwy_fuel,
            "highwayMpg": hwy_mpg
        },

        "geolocation": {
            "startLat": first.get("lat"),
            "startLon": first.get("lon"),
            "endLat": last.get("lat"),
            "endLon": last.get("lon")
        },

        "battery": {
            "startVolts": b_start,
            "maxVolts": b_max,
            "endVolts": b_end
        },

        "tirePressure": {
            "start": tire_start,
            "end": tire_end,
            "max": tire_max
        },

        "tirePressureStatus": {
            "lowPressureDetected": False,
            "lowPressureMiles": None,
            "lowPressureFuelGallons": None
        },

        "speed": {
            "maxMph": max_mph,
            "averageMphExcludingIdle": None,

            # Legacy buckets (still useful when overspeed enrichment is missing/partial)
            "os1Miles": os1,
            "os2Miles": os2,
            "speedThresholdMph": speed_threshold,

            # Authoritative overspeed rollups from PSL enricher
            "overspeedMilesStandard": os_std_miles,
            "overspeedMilesSevere": os_sev_miles,
            "overspeedMilesTotal": os_std_miles + os_sev_miles,
            "overspeedEventCountStandard": os_std_count,
            "overspeedEventCountSevere": os_sev_count,
            "overspeedEventCountTotal": os_std_count + os_sev_count,
        },

        "oilLife": {
            "endPercent": None
        },

        "events": {
            "collisionCount": collisions,
            "harshAccelerationCount": ha,
            "harshBrakingCount": hb,
            "harshCorneringCount": hc,
            "seatbeltViolationCount": seatbelt_count,
            "seatbeltViolationMilesDriven": seatbelt_miles
        },

        "coolantTemperature": {
            "startCelsius": c_start,
            "maxCelsius": c_max,
            "endCelsius": c_end
        },

        "evData": {
            "batteryLevelStartPercent": None,
            "batteryLevelMaxPercent": None,
            "batteryLevelEndPercent": None,
            "rangeStartMiles": None,
            "rangeEndMiles": None
        },

        "alerts": alerts,
        "dtc": dtc,

        "safetyScore": score,

        "metadata": {
            "provider": provider,
            "generatedAt": _iso_now(),
            "eventCount": len(events),
            "missingDataFields": []
        }
    }

    return summary


# -----------------------------------------------------------
# Store JSON summary + top-level attributes in DynamoDB
# -----------------------------------------------------------

def _store_summary(vin: str, trip_id: str, summary: Dict[str, Any]) -> None:
    start_time = summary.get("startTime")
    end_time = summary.get("endTime")
    trip_status = "COMPLETED"
    miles_driven = (summary.get("odometer") or {}).get("milesDriven")
    fuel_consumed = (summary.get("fuel") or {}).get("fuelConsumed")
    safety_score = summary.get("safetyScore")
    provider = (summary.get("metadata") or {}).get("provider")

    # Overspeed rollups for list/report APIs
    speed_obj = summary.get("speed") or {}
    os_std_miles = speed_obj.get("overspeedMilesStandard")
    os_sev_miles = speed_obj.get("overspeedMilesSevere")
    os_total_miles = speed_obj.get("overspeedMilesTotal")
    os_std_cnt = speed_obj.get("overspeedEventCountStandard")
    os_sev_cnt = speed_obj.get("overspeedEventCountSevere")
    os_total_cnt = speed_obj.get("overspeedEventCountTotal")

    item: Dict[str, Any] = {
        "PK": {"S": f"VEHICLE#{vin}"},
        "SK": {"S": f"TRIP_SUMMARY#{trip_id}"},
        "schemaVersion": {"S": TRIP_SUMMARY_SCHEMA_VERSION},
        "vin": {"S": vin},
        "tripId": {"S": trip_id},
        "startTime": {"S": str(start_time)} if start_time else {"S": ""},
        "endTime": {"S": str(end_time)} if end_time else {"S": ""},
        "tripStatus": {"S": trip_status},
        "provider": {"S": str(provider)} if provider else {"S": "unknown"},
        "safetyScore": {"N": str(int(safety_score))} if isinstance(safety_score, int) else None,
        "milesDriven": {"N": str(miles_driven)} if isinstance(miles_driven, (int, float)) else None,
        "fuelConsumed": {"N": str(fuel_consumed)} if isinstance(fuel_consumed, (int, float)) else None,
        "refueledGallons": {"N": str((summary.get("fuel") or {}).get("refueledGallons"))}
        if isinstance((summary.get("fuel") or {}).get("refueledGallons"), (int, float))
        else None,

        # Overspeed fields
        "overspeedMilesStandard": {"N": str(os_std_miles)} if isinstance(os_std_miles, (int, float)) else None,
        "overspeedMilesSevere": {"N": str(os_sev_miles)} if isinstance(os_sev_miles, (int, float)) else None,
        "overspeedMilesTotal": {"N": str(os_total_miles)} if isinstance(os_total_miles, (int, float)) else None,
        "overspeedEventCountStandard": {"N": str(int(os_std_cnt))} if isinstance(os_std_cnt, int) else None,
        "overspeedEventCountSevere": {"N": str(int(os_sev_cnt))} if isinstance(os_sev_cnt, int) else None,
        "overspeedEventCountTotal": {"N": str(int(os_total_cnt))} if isinstance(os_total_cnt, int) else None,

        "updatedAt": {"S": _iso_now()},
        "summary": {"S": json.dumps(summary)}
    }

    # Remove None-valued entries DynamoDB won't accept
    item = {k: v for k, v in item.items() if v is not None}

    ddb.put_item(
        TableName=TRIP_SUMMARY_TABLE,
        Item=item
    )


# -----------------------------------------------------------
# Lambda handler
# -----------------------------------------------------------

def lambda_handler(event, context):
    logger.info(json.dumps(event, indent=2))

    for record in event.get("Records", []):
        msg = json.loads(record["body"])
        vin = msg["vin"]
        trip_id = msg["tripId"]
        provider = msg.get("provider", "unknown")

        pk = f"VEHICLE#{vin}#TRIP#{trip_id}"
        items = _fetch_events(pk)

        if not items:
            logger.error(f"No events found for trip {trip_id}")
            continue

        events = [_convert_event(i) for i in items]

        # ensure we have valid timestamps
        events = [e for e in events if e.get("dt") is not None]
        if not events:
            logger.error(f"No parseable timestamps for trip {trip_id}")
            continue

        summary = _build_summary(events, vin, trip_id, provider)
        _store_summary(vin, trip_id, summary)

        logger.info(f"Trip summary stored: {vin} / {trip_id}")

    return {"status": "ok"}
