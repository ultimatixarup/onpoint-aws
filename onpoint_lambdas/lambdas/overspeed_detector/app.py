# ============================================================
# onpoint-overspeed-detector (v3)
#
# Purpose
# - Consume PSL-enriched telemetry events (typically via SQS)
# - Compute overspeed severity (STANDARD/SEVERE)
# - Compute miles driven while overspeeding (step miles via odometer delta)
# - Idempotency via OverspeedDedupe DynamoDB table
# - Persist overspeed fields back onto the Telemetry Events item (UpdateItem)
# - Emit alert events to EventBridge (subscribers later)
#
# Assumptions
# - Telemetry event items live in TELEMETRY_EVENTS_TABLE with PK/SK keys
# - Each SQS message includes either:
#     A) { "pk": "...", "sk": "...", "vin": "...", "tripId": "...", "eventTime": "...", "messageId": "...",
#          "speedMph": 72.4, "postedSpeedLimit": 45, "pslConfidence": "HIGH", "pslSource": "OSM_OVERPASS" }
#   OR
#     B) { "vin": "...", "tripId": "...", "eventTime": "...", "messageId": "...", "pk": "...", "sk": "..." }
#        and the Lambda will fetch missing fields from DynamoDB item.
#
# Cost controls
# - One dedupe PutItem (conditional) per message (fast fail if duplicate)
# - Only fetches DynamoDB telemetry item if message lacks required fields
# - One VehicleState Get/Update per message to compute odometer delta + cooldown
# - One UpdateItem back to telemetry (writes overspeed fields)
#
# DynamoDB tables
# - TELEMETRY_EVENTS_TABLE (PK,S K)                - TTL optional
# - VEHICLE_STATE_TABLE (PK,SK)                   - no TTL
# - OVERSPEED_DEDUPE_TABLE (PK,SK,expiresAt TTL)  - TTL enabled with expiresAt
#
# EventBridge
# - Sends "OverspeedAlert" events to bus EVENT_BUS_NAME (default "default")
# ============================================================

import json
import os
import time
import logging
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

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
VEHICLE_STATE_TABLE = os.environ["VEHICLE_STATE_TABLE"]
OVERSPEED_DEDUPE_TABLE = os.environ["OVERSPEED_DEDUPE_TABLE"]

EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "default")
EVENT_SOURCE = os.environ.get("EVENT_SOURCE", "onpoint.overspeed")
EVENT_DETAIL_TYPE = os.environ.get("EVENT_DETAIL_TYPE", "OverspeedAlert")

STANDARD_THRESHOLD_MPH = float(os.environ.get("OVERSPEED_STANDARD_THRESHOLD_MPH", "5"))
SEVERE_THRESHOLD_MPH = float(os.environ.get("OVERSPEED_SEVERE_THRESHOLD_MPH", "15"))
try:
    COOLDOWN_SECONDS = int(str(os.environ.get("OVERSPEED_COOLDOWN_SECONDS", "60")))
except Exception:
    COOLDOWN_SECONDS = 60

# If PSL is low confidence, you can choose to skip alerts but still write fields for audit.
MIN_PSL_CONFIDENCE = os.environ.get("MIN_PSL_CONFIDENCE", "LOW").upper()  # LOW|MEDIUM|HIGH
SKIP_ALERTS_BELOW_MIN_CONF = os.environ.get("SKIP_ALERTS_BELOW_MIN_CONF", "true").lower() == "true"

# Dedupe TTL in seconds (keep small, cost-conscious)
_DEDUPE_TTL_ENV = os.environ.get("DEDUPE_TTL_SECONDS")
try:
    DEDUPE_TTL_SECONDS = int(_DEDUPE_TTL_ENV) if _DEDUPE_TTL_ENV else max(86400, COOLDOWN_SECONDS * 2)
except Exception:
    DEDUPE_TTL_SECONDS = max(86400, COOLDOWN_SECONDS * 2)

# -----------------------------
# Helpers
# -----------------------------
_CONF_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


def _rank_conf(c: Optional[str]) -> int:
    if not c:
        return 0
    return _CONF_RANK.get(str(c).upper(), 0)


def _now_epoch() -> int:
    return int(time.time())


def _to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        if isinstance(v, Decimal):
            return float(v)
        return float(v)
    except Exception:
        return None


def _ddb_num(item: Dict[str, Any], key: str) -> Optional[float]:
    v = item.get(key)
    if isinstance(v, dict) and "N" in v:
        try:
            return float(Decimal(v["N"]))
        except Exception:
            return None
    return None


def _ddb_str(item: Dict[str, Any], key: str) -> Optional[str]:
    v = item.get(key)
    if isinstance(v, dict) and "S" in v:
        return v["S"]
    return None


def _safe_json(s: Any) -> Any:
    if isinstance(s, (dict, list)):
        return s
    if not isinstance(s, str) or not s:
        return None
    try:
        return json.loads(s)
    except Exception:
        return None


def _parse_sqs_record_body(record: Dict[str, Any]) -> Dict[str, Any]:
    body = record.get("body")
    if not body:
        return {}
    try:
        return json.loads(body)
    except Exception:
        return {}


def _dedupe_or_skip(message_id: str) -> bool:
    """
    Returns True if this is the first time we see message_id (proceed).
    Returns False if it's a duplicate (skip).
    """
    pk = f"MSG#{message_id}"
    sk = "OVERSPEED"
    expires_at = _now_epoch() + DEDUPE_TTL_SECONDS

    try:
        ddb.put_item(
            TableName=OVERSPEED_DEDUPE_TABLE,
            Item={
                "PK": {"S": pk},
                "SK": {"S": sk},
                "expiresAt": {"N": str(expires_at)},
                "createdAt": {"N": str(_now_epoch())},
            },
            ConditionExpression="attribute_not_exists(PK)",
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise


def _get_telemetry_item(pk: str, sk: str) -> Optional[Dict[str, Any]]:
    resp = ddb.get_item(
        TableName=TELEMETRY_EVENTS_TABLE,
        Key={"PK": {"S": pk}, "SK": {"S": sk}},
        ConsistentRead=False,
    )
    return resp.get("Item")


def _get_vehicle_trip_state(vin: str, trip_id: str) -> Dict[str, Any]:
    pk = f"VEHICLE#{vin}"
    sk = f"TRIP#{trip_id}"
    resp = ddb.get_item(
        TableName=VEHICLE_STATE_TABLE,
        Key={"PK": {"S": pk}, "SK": {"S": sk}},
        ConsistentRead=False,
    )
    return resp.get("Item") or {}


def _put_vehicle_trip_state(
    vin: str,
    trip_id: str,
    last_odometer: Optional[float],
    last_event_time: Optional[str],
    last_emit_epoch: Optional[int],
    last_emit_severity: Optional[str],
) -> None:
    pk = f"VEHICLE#{vin}"
    sk = f"TRIP#{trip_id}"
    expr = []
    vals: Dict[str, Any] = {}
    names: Dict[str, str] = {}

    # Always update updatedAt
    names["#ua"] = "updatedAt"
    vals[":ua"] = {"N": str(_now_epoch())}
    expr.append("#ua = :ua")

    if last_odometer is not None:
        names["#lo"] = "lastOdometerMiles"
        vals[":lo"] = {"N": str(last_odometer)}
        expr.append("#lo = :lo")

    if last_event_time:
        names["#let"] = "lastEventTime"
        vals[":let"] = {"S": last_event_time}
        expr.append("#let = :let")

    if last_emit_epoch is not None:
        names["#lee"] = "lastOverspeedEmitAt"
        vals[":lee"] = {"N": str(int(last_emit_epoch))}
        expr.append("#lee = :lee")

    if last_emit_severity:
        names["#les"] = "lastOverspeedEmitSeverity"
        vals[":les"] = {"S": last_emit_severity}
        expr.append("#les = :les")

    ddb.update_item(
        TableName=VEHICLE_STATE_TABLE,
        Key={"PK": {"S": pk}, "SK": {"S": sk}},
        UpdateExpression="SET " + ", ".join(expr),
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=vals,
    )


def _update_telemetry_with_overspeed(
    pk: str,
    sk: str,
    overspeed_flag: int,
    severity: Optional[str],
    delta_mph: Optional[float],
    threshold_used: float,
    severe_threshold_used: float,
    cooldown_used: int,
    emitted_at_iso: Optional[str],
    miles_step: Optional[float],
    miles_window_approx: Optional[float],
    psl: Optional[float],
    psl_conf: Optional[str],
    psl_source: Optional[str],
    psl_http_status: Optional[int],
    psl_updated_at_iso: Optional[str],
) -> None:
    names = {
        "#os": "overspeed",
        "#sev": "overspeedSeverity",
        "#d": "overspeedDeltaMph",
        "#thr": "overspeedThresholdUsed",
        "#sthr": "overspeedSevereThresholdUsed",
        "#cd": "overspeedCooldownSecondsUsed",
        "#eat": "overspeedEmittedAt",
        "#ms": "overspeedMilesStep",
        "#mm": "overspeedMilesMethod",
        "#mw": "overspeedMilesWindowApprox",
        "#psl": "postedSpeedLimit",
        "#pc": "pslConfidence",
        "#ps": "pslSource",
        "#ph": "pslHttpStatus",
        "#pu": "pslUpdatedAt",
    }

    vals: Dict[str, Any] = {
        ":os": {"N": str(int(overspeed_flag))},
        ":thr": {"N": str(float(threshold_used))},
        ":sthr": {"N": str(float(severe_threshold_used))},
        ":cd": {"N": str(int(cooldown_used))},
        ":mm": {"S": "ODOMETER_DELTA" if miles_step is not None else "NONE"},
    }

    sets = ["#os = :os", "#thr = :thr", "#sthr = :sthr", "#cd = :cd", "#mm = :mm"]
    removes = []

    def set_or_remove_str(attr_name: str, placeholder: str, v: Optional[str]):
        nonlocal sets, removes, vals
        if v is None or v == "":
            removes.append(attr_name)
        else:
            vals[placeholder] = {"S": v}
            sets.append(f"{attr_name} = {placeholder}")

    def set_or_remove_num(attr_name: str, placeholder: str, v: Optional[float]):
        nonlocal sets, removes, vals
        if v is None:
            removes.append(attr_name)
        else:
            vals[placeholder] = {"N": str(float(v))}
            sets.append(f"{attr_name} = {placeholder}")

    def set_or_remove_int(attr_name: str, placeholder: str, v: Optional[int]):
        nonlocal sets, removes, vals
        if v is None:
            removes.append(attr_name)
        else:
            vals[placeholder] = {"N": str(int(v))}
            sets.append(f"{attr_name} = {placeholder}")

    set_or_remove_str("#sev", ":sev", severity)
    set_or_remove_num("#d", ":d", delta_mph)
    set_or_remove_str("#eat", ":eat", emitted_at_iso)
    set_or_remove_num("#ms", ":ms", miles_step)
    set_or_remove_num("#mw", ":mw", miles_window_approx)

    set_or_remove_num("#psl", ":psl", psl)
    set_or_remove_str("#pc", ":pc", psl_conf)
    set_or_remove_str("#ps", ":ps", psl_source)
    set_or_remove_int("#ph", ":ph", psl_http_status)
    set_or_remove_str("#pu", ":pu", psl_updated_at_iso)

    update_expr = "SET " + ", ".join(sets)
    if removes:
        update_expr += " REMOVE " + ", ".join(removes)

    ddb.update_item(
        TableName=TELEMETRY_EVENTS_TABLE,
        Key={"PK": {"S": pk}, "SK": {"S": sk}},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=vals,
    )


def _should_emit_alert(
    severity: str,
    last_emit_epoch: Optional[int],
    last_emit_severity: Optional[str],
    now_epoch: int,
) -> bool:
    """
    Cooldown logic:
    - If no prior emit -> emit
    - If within cooldown:
        - If upgrading from STANDARD -> SEVERE, allow immediate emit
        - Else suppress
    - If outside cooldown -> emit
    """
    if not last_emit_epoch:
        return True

    age = now_epoch - int(last_emit_epoch)
    if age >= COOLDOWN_SECONDS:
        return True

    if severity == "SEVERE" and (last_emit_severity or "").upper() != "SEVERE":
        return True

    return False


def _put_eventbridge_alert(detail: Dict[str, Any]) -> None:
    # EventBridge requires detail as string
    entries = [
        {
            "EventBusName": EVENT_BUS_NAME,
            "Source": EVENT_SOURCE,
            "DetailType": EVENT_DETAIL_TYPE,
            "Detail": json.dumps(detail, default=str),
        }
    ]
    resp = events.put_events(Entries=entries)
    failed = resp.get("FailedEntryCount", 0)
    if failed:
        logger.error("EventBridge put_events failed: %s", json.dumps(resp))


def _compute_severity(speed_mph: float, psl_mph: float) -> Tuple[int, Optional[str], float]:
    """
    Returns (overspeed_flag, severity, delta_mph)
    """
    delta = speed_mph - psl_mph
    if delta >= SEVERE_THRESHOLD_MPH:
        return 1, "SEVERE", delta
    if delta >= STANDARD_THRESHOLD_MPH:
        return 1, "STANDARD", delta
    return 0, None, delta


# -----------------------------
# Handler
# -----------------------------
def lambda_handler(event, context):
    # Supports SQS batch events
    records = event.get("Records", [])
    if not records:
        logger.info("No Records in event")
        return {"status": "ok", "processed": 0}

    processed = 0
    skipped_dupes = 0
    skipped_missing = 0

    for r in records:
        msg = _parse_sqs_record_body(r)

        # Keys
        pk = msg.get("pk") or msg.get("PK")
        sk = msg.get("sk") or msg.get("SK")
        vin = msg.get("vin")
        trip_id = msg.get("tripId")
        event_time = msg.get("eventTime")
        message_id = msg.get("messageId") or msg.get("msgId")

        # Basic validation
        if not message_id:
            logger.warning("Skipping record with no messageId")
            skipped_missing += 1
            continue

        # Dedupe
        try:
            if not _dedupe_or_skip(message_id):
                skipped_dupes += 1
                continue
        except Exception as e:
            logger.exception("Dedupe error for messageId=%s", message_id)
            raise

        # Fetch telemetry item if needed
        telemetry_item = None
        if not (pk and sk and vin and trip_id and event_time):
            # We can still proceed if pk/sk provided; else we can't locate the item.
            if not (pk and sk):
                logger.warning("Skipping messageId=%s due to missing pk/sk", message_id)
                skipped_missing += 1
                continue
            telemetry_item = _get_telemetry_item(pk, sk)
            if not telemetry_item:
                logger.warning("Telemetry item not found for %s %s (messageId=%s)", pk, sk, message_id)
                skipped_missing += 1
                continue

            vin = vin or _ddb_str(telemetry_item, "vin")
            trip_id = trip_id or _ddb_str(telemetry_item, "tripId")
            event_time = event_time or _ddb_str(telemetry_item, "eventTime")

        if not (vin and trip_id and event_time):
            logger.warning("Skipping messageId=%s due to missing vin/tripId/eventTime", message_id)
            skipped_missing += 1
            continue

        # Pull required metrics (prefer message payload; fallback to DynamoDB item)
        if telemetry_item is None:
            # If we didn't fetch yet but may need to read fields from DDB
            # Only fetch if something critical is missing.
            need_fetch = any(
                msg.get(k) is None
                for k in ("speedMph", "speed_mph", "postedSpeedLimit", "postedSpeedLimitMph", "odometerMiles", "odometer_Miles")
            )
            if need_fetch and pk and sk:
                telemetry_item = _get_telemetry_item(pk, sk)

        speed_mph = _to_float(msg.get("speedMph") or msg.get("speed_mph"))
        if speed_mph is None and telemetry_item:
            speed_mph = _ddb_num(telemetry_item, "speed_mph")

        psl = _to_float(msg.get("postedSpeedLimit") or msg.get("postedSpeedLimitMph"))
        if psl is None and telemetry_item:
            # you store "postedSpeedLimit" currently
            psl = _ddb_num(telemetry_item, "postedSpeedLimit")

        psl_conf = msg.get("pslConfidence") or (telemetry_item and _ddb_str(telemetry_item, "pslConfidence"))
        psl_source = msg.get("pslSource") or (telemetry_item and _ddb_str(telemetry_item, "pslSource"))
        psl_http_status = msg.get("pslHttpStatus")
        if psl_http_status is None and telemetry_item:
            psl_http_status = _ddb_num(telemetry_item, "pslHttpStatus")
        try:
            psl_http_status = int(psl_http_status) if psl_http_status is not None else None
        except Exception:
            psl_http_status = None

        psl_updated_at = msg.get("pslUpdatedAt") or (telemetry_item and _ddb_str(telemetry_item, "pslUpdatedAt"))

        odometer = _to_float(msg.get("odometerMiles") or msg.get("odometer_Miles"))
        if odometer is None and telemetry_item:
            odometer = _ddb_num(telemetry_item, "odometer_Miles")

        if speed_mph is None or psl is None or psl <= 0:
            # If PSL not present, we can’t do PSL-based overspeed.
            # We still write a clean "overspeed=0" to prevent stale values.
            if pk and sk:
                _update_telemetry_with_overspeed(
                    pk=pk,
                    sk=sk,
                    overspeed_flag=0,
                    severity=None,
                    delta_mph=None,
                    threshold_used=STANDARD_THRESHOLD_MPH,
                    severe_threshold_used=SEVERE_THRESHOLD_MPH,
                    cooldown_used=COOLDOWN_SECONDS,
                    emitted_at_iso=None,
                    miles_step=None,
                    miles_window_approx=None,
                    psl=psl,
                    psl_conf=psl_conf,
                    psl_source=psl_source,
                    psl_http_status=psl_http_status,
                    psl_updated_at_iso=psl_updated_at,
                )
            processed += 1
            continue

        overspeed_flag, severity, delta_mph = _compute_severity(speed_mph, psl)

        # Read trip state to compute odometer delta + cooldown gating
        state = _get_vehicle_trip_state(vin, trip_id)
        last_odo = _ddb_num(state, "lastOdometerMiles")
        last_emit_epoch = _ddb_num(state, "lastOverspeedEmitAt")
        last_emit_epoch_i = int(last_emit_epoch) if last_emit_epoch is not None else None
        last_emit_sev = _ddb_str(state, "lastOverspeedEmitSeverity")

        miles_step = None
        if overspeed_flag == 1 and odometer is not None and last_odo is not None and odometer >= last_odo:
            miles_step = float(odometer - last_odo)
        elif overspeed_flag == 1 and odometer is not None and last_odo is None:
            # first event in trip state; we can't compute delta yet
            miles_step = None

        # You asked for "miles driven over PSL speed limit during the alert":
        # Here we treat "alert window miles" as the step miles while overspeeding.
        miles_window_approx = miles_step

        now_epoch = _now_epoch()

        # Confidence gating for alerts (still writes data)
        can_alert = True
        if SKIP_ALERTS_BELOW_MIN_CONF:
            can_alert = _rank_conf(psl_conf) >= _rank_conf(MIN_PSL_CONFIDENCE)

        emit_alert = False
        emitted_at_iso = None
        if overspeed_flag == 1 and severity and can_alert:
            emit_alert = _should_emit_alert(severity, last_emit_epoch_i, last_emit_sev, now_epoch)
            if emit_alert:
                emitted_at_iso = time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime(now_epoch))

        # Persist fields back to telemetry event item (so trip summary builder can roll up)
        if pk and sk:
            _update_telemetry_with_overspeed(
                pk=pk,
                sk=sk,
                overspeed_flag=overspeed_flag,
                severity=severity,
                delta_mph=delta_mph if overspeed_flag == 1 else None,
                threshold_used=STANDARD_THRESHOLD_MPH,
                severe_threshold_used=SEVERE_THRESHOLD_MPH,
                cooldown_used=COOLDOWN_SECONDS,
                emitted_at_iso=emitted_at_iso,
                miles_step=miles_step,
                miles_window_approx=miles_window_approx,
                psl=psl,
                psl_conf=psl_conf,
                psl_source=psl_source,
                psl_http_status=psl_http_status,
                psl_updated_at_iso=psl_updated_at,
            )

        # Update state (always track last odometer + last event time)
        new_last_emit_epoch = last_emit_epoch_i
        new_last_emit_sev = last_emit_sev
        if emit_alert:
            new_last_emit_epoch = now_epoch
            new_last_emit_sev = severity

        _put_vehicle_trip_state(
            vin=vin,
            trip_id=trip_id,
            last_odometer=odometer if odometer is not None else last_odo,
            last_event_time=event_time,
            last_emit_epoch=new_last_emit_epoch,
            last_emit_severity=new_last_emit_sev,
        )

        # Emit to EventBridge
        if emit_alert:
            detail = {
                "vin": vin,
                "tripId": trip_id,
                "eventTime": event_time,
                "messageId": message_id,
                "speedMph": speed_mph,
                "postedSpeedLimit": psl,
                "overspeedDeltaMph": delta_mph,
                "overspeedSeverity": severity,
                "overspeedThresholdUsed": STANDARD_THRESHOLD_MPH,
                "overspeedSevereThresholdUsed": SEVERE_THRESHOLD_MPH,
                "overspeedCooldownSecondsUsed": COOLDOWN_SECONDS,
                "overspeedMilesWindowApprox": miles_window_approx,
                "pslSource": psl_source,
                "pslConfidence": psl_conf,
                "pslHttpStatus": psl_http_status,
                "pslUpdatedAt": psl_updated_at,
            }
            _put_eventbridge_alert(detail)

        processed += 1

    logger.info(
        "Done. processed=%d skipped_dupes=%d skipped_missing=%d",
        processed,
        skipped_dupes,
        skipped_missing,
    )
    return {"status": "ok", "processed": processed, "skipped_dupes": skipped_dupes, "skipped_missing": skipped_missing}
