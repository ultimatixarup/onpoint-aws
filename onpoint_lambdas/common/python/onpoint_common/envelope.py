from __future__ import annotations

import json
import os
import uuid
from functools import lru_cache
from dataclasses import dataclass
from typing import Any, Dict, Optional

import boto3

from .timeutil import utc_now_iso


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


def _resolve_api_key_id(sqs_record: Dict[str, Any], raw_payload: Dict[str, Any]) -> Optional[str]:
    message_attributes = sqs_record.get("messageAttributes") or {}
    value = _get_message_attribute_value(message_attributes, "apiKeyId")
    if value:
        return value

    v = raw_payload.get("apiKeyId")
    if isinstance(v, str) and v.strip():
        return v.strip()

    return None


def _lookup_provider_id_dynamodb(api_key_id: str) -> Optional[str]:
    table_name = _env("PROVIDER_TABLE")
    if not table_name:
        return None

    ddb = boto3.client("dynamodb")
    try:
        resp = ddb.get_item(
            TableName=table_name,
            Key={"apiKeyId": {"S": api_key_id}},
            ConsistentRead=True,
        )
        item = resp.get("Item") or {}
        for key in ("providerId", "provider_id"):
            value = item.get(key)
            if isinstance(value, dict) and isinstance(value.get("S"), str) and value["S"].strip():
                return value["S"].strip()
    except Exception:
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


def _lookup_provider_id_ssm(api_key_id: str) -> Optional[str]:
    mapping = _load_provider_map_from_ssm()
    value = mapping.get(api_key_id)
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _lookup_provider_id(api_key_id: Optional[str]) -> Optional[str]:
    if not api_key_id:
        return None
    mode = (_env("PROVIDER_LOOKUP_MODE") or "").strip().lower()
    if mode == "dynamodb":
        return _lookup_provider_id_dynamodb(api_key_id)
    if mode == "ssm":
        return _lookup_provider_id_ssm(api_key_id)
    return None


def resolve_provider_id(sqs_record: Dict[str, Any], raw_payload: Dict[str, Any]) -> str:
    """Resolve providerId:

    1) PROVIDER_LOOKUP_MODE lookup by apiKeyId (dynamodb or ssm)
    2) SQS message attribute providerId
    3) payload.providerId
    4) unknown-provider
    """
    api_key_id = _resolve_api_key_id(sqs_record, raw_payload)
    looked_up = _lookup_provider_id(api_key_id)
    if isinstance(looked_up, str) and looked_up.strip():
        return looked_up.strip()

    message_attributes = sqs_record.get("messageAttributes") or {}
    provider_value = _get_message_attribute_value(message_attributes, "providerId")
    if provider_value:
        return provider_value

    v = raw_payload.get("providerId")
    if isinstance(v, str) and v.strip():
        return v.strip()

    return "unknown-provider"


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
    """Standard OnPoint ingestion envelope.

    Keep this stable across all providers; downstream systems can rely on it.
    """
    domain = domain or _env("DEFAULT_DOMAIN", "telematics") or "telematics"
    schema_version = schema_version or _env("INGRESS_SCHEMA_VERSION", "telematics-1.0") or "telematics-1.0"

    upstream_msg_id = (
        raw_payload.get("cx_msg_id")
        or raw_payload.get("messageId")
        or raw_payload.get("trace_id")
    )

    meta: Dict[str, Any] = {}
    if isinstance(sqs_record, dict):
        attrs = sqs_record.get("attributes") or {}
        approx = attrs.get("ApproximateReceiveCount")
        meta = {
            "sqsMessageId": sqs_record.get("messageId"),
            "approxReceiveCount": int(approx) if str(approx).isdigit() else None,
        }

    return {
        "messageId": str(uuid.uuid4()),
        "upstreamMessageId": upstream_msg_id,
        "providerId": provider_id,
        "environment": _env("ENVIRONMENT"),
        "project": _env("PROJECT_NAME"),
        "domain": domain,
        "schemaVersion": schema_version,
        "ingestedAt": utc_now_iso(),
        "meta": meta,
        "data": raw_payload,
    }


def safe_json_object_loads(s: str) -> Dict[str, Any]:
    obj = json.loads(s)
    if not isinstance(obj, dict):
        raise ValueError("Payload must be a JSON object")
    return obj


def byte_len_utf8(s: str) -> int:
    return len(s.encode("utf-8"))
