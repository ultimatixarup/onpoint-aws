from __future__ import annotations

import json
import logging
import os
import uuid
from functools import lru_cache
from dataclasses import dataclass
from typing import Any, Dict, Optional

import boto3

from .timeutil import utc_now_iso

logger = logging.getLogger(__name__)


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v


def _get_message_attribute_value(message_attributes: Dict[str, Any], name: str) -> Optional[str]:
    attr = message_attributes.get(name)
    if isinstance(attr, dict):
        value = attr.get("stringValue")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _resolve_api_key_value(sqs_record: Dict[str, Any], raw_payload: Dict[str, Any]) -> Optional[str]:
    """Extract the API key VALUE from SQS message attributes (sent by API Gateway)."""
    message_attributes = sqs_record.get("messageAttributes") or {}
    # API Gateway integration sends the actual API key value as providerId attribute
    value = _get_message_attribute_value(message_attributes, "providerId")
    if value:
        return value

    # Fallback: check payload
    v = raw_payload.get("apiKeyValue")
    if isinstance(v, str) and v.strip():
        return v.strip()

    return None


def _lookup_provider_id_dynamodb(api_key_value: str) -> Optional[str]:
    """Look up provider name by API key value in DynamoDB table."""
    table_name = _env("PROVIDER_TABLE")
    if not table_name:
        return None

    ddb = boto3.client("dynamodb")
    try:
        resp = ddb.get_item(
            TableName=table_name,
            Key={"apiKeyValue": {"S": api_key_value}},
            ConsistentRead=True,
        )
        item = resp.get("Item") or {}
        for key in ("providerId", "provider_id", "providerName"):
            value = item.get(key)
            if isinstance(value, dict) and isinstance(value.get("S"), str) and value["S"].strip():
                return value["S"].strip()
    except Exception as e:
        logger.warning(f"DynamoDB provider lookup failed: {e}")
        return None
    return None


@lru_cache(maxsize=1)
def _load_provider_map_from_ssm() -> Dict[str, str]:
    param_name = _env("PROVIDER_KEYS_PARAM")
    if not param_name:
        return {}
    ssm = boto3.client("ssm")
    try:
        resp = ssm.get_parameter(Name=param_name, WithDecryption=True)
        raw = resp.get("Parameter", {}).get("Value")
        if not isinstance(raw, str) or not raw.strip():
            return {}
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        if not isinstance(obj, dict):
            return {}
        return {str(k): str(v) for k, v in obj.items() if str(k).strip() and str(v).strip()}
    except Exception:
        return {}


def _lookup_provider_id_ssm(api_key_value: str) -> Optional[str]:
    mapping = _load_provider_map_from_ssm()
    value = mapping.get(api_key_value)
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _lookup_provider_id(api_key_value: Optional[str]) -> Optional[str]:
    """Look up provider name using API key value."""
    if not api_key_value:
        return None
    mode = (_env("PROVIDER_LOOKUP_MODE") or "").strip().lower()
    if mode == "dynamodb":
        return _lookup_provider_id_dynamodb(api_key_value)
    if mode == "ssm":
        return _lookup_provider_id_ssm(api_key_value)
    return None


def resolve_provider_id(sqs_record: Dict[str, Any], raw_payload: Dict[str, Any]) -> str:
    """Resolve providerId (provider NAME, not API key value):

    1) PROVIDER_LOOKUP_MODE lookup by API key value (dynamodb or ssm)
    2) payload.providerId (fallback)
    3) "unknown" if not found
    """
    api_key_value = _resolve_api_key_value(sqs_record, raw_payload)
    if api_key_value:
        looked_up = _lookup_provider_id(api_key_value)
        if isinstance(looked_up, str) and looked_up.strip():
            logger.info(f"Resolved provider from API key: {looked_up}")
            return looked_up.strip()
        else:
            logger.warning(f"No provider found for API key (masked), using 'unknown'")
            return "unknown"

    # Fallback to payload
    v = raw_payload.get("providerId")
    if isinstance(v, str) and v.strip():
        return v.strip()

    return "unknown"


def resolve_partition_key(raw_payload: Dict[str, Any], provider_id: str) -> str:
    """Partition key preference: VIN (cx_vehicle_id|vin) else provider_id."""
    vin = raw_payload.get("cx_vehicle_id") or raw_payload.get("vin")
    if isinstance(vin, str) and vin.strip():
        return vin.strip()
    return provider_id


def build_ingress_envelope(
    raw_payload: Dict[str, Any],
    provider_id: str,
    sqs_record: Optional[Dict[str, Any]] = None,
    *,
    domain: Optional[str] = None,
    schema_version: Optional[str] = None,
) -> Dict[str, Any]:
    """Standard OnPoint ingestion envelope with normalized top-level fields.

    Normalizes required fields from raw payload data to top-level for processor consumption.
    """
    domain = domain or _env("DEFAULT_DOMAIN", "telematics") or "telematics"
    schema_version = schema_version or _env("INGRESS_SCHEMA_VERSION", "telematics-1.0") or "telematics-1.0"

    # Extract and normalize required fields from raw payload
    vin = raw_payload.get("vin") or raw_payload.get("cx_vehicle_id")
    event_type = raw_payload.get("cx_event_type")
    
    # Time: prefer cx_timestamp, fallback to current time
    event_time = raw_payload.get("cx_timestamp")
    if not event_time:
        event_time = utc_now_iso()
        logger.warning(f"No cx_timestamp in payload for vin={vin}, using current time")
    
    # Message ID: prefer cx_msg_id, fallback to SQS messageId
    msg_id = raw_payload.get("cx_msg_id")
    if not msg_id and isinstance(sqs_record, dict):
        msg_id = sqs_record.get("messageId")

    # Trip ID (optional)
    trip_id = raw_payload.get("cx_trip_id")

    meta: Dict[str, Any] = {}
    if isinstance(sqs_record, dict):
        attrs = sqs_record.get("attributes") or {}
        approx = attrs.get("ApproximateReceiveCount")
        meta = {
            "sqsMessageId": sqs_record.get("messageId"),
            "approxReceiveCount": int(approx) if str(approx).isdigit() else None,
        }

    envelope = {
        "messageId": str(uuid.uuid4()),
        "providerId": provider_id,
        "environment": _env("ENV") or _env("ENVIRONMENT") or "dev",
        "project": _env("PROJECT") or _env("PROJECT_NAME") or "onpoint",
        "domain": domain,
        "schemaVersion": schema_version,
        "ingestedAt": utc_now_iso(),
        
        # Normalized top-level fields required by processor
        "vin": vin,
        "type": event_type,
        "time": event_time,
        "msgId": msg_id,
        "tripId": trip_id,  # optional
        
        "meta": meta,
        "data": raw_payload,  # Keep original payload
    }

    # Log normalized envelope (without sensitive raw data)
    logger.info(
        json.dumps({
            "msg": "Built ingress envelope",
            "providerId": provider_id,
            "vin": vin,
            "type": event_type,
            "hasTime": bool(event_time),
            "hasMsgId": bool(msg_id),
            "hasTripId": bool(trip_id),
        })
    )

    return envelope


def safe_json_object_loads(s: str) -> Dict[str, Any]:
    obj = json.loads(s)
    if not isinstance(obj, dict):
        raise ValueError("Payload must be a JSON object")
    return obj


def byte_len_utf8(s: str) -> int:
    return len(s.encode("utf-8"))
