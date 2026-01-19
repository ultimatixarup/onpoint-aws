from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional

from .timeutil import utc_now_iso


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    v = os.environ.get(name)
    if v is None or v == "":
        return default
    return v


def resolve_provider_id(sqs_record: Dict[str, Any], raw_payload: Dict[str, Any]) -> str:
    """Resolve providerId:

    1) SQS message attribute providerId
    2) payload.providerId
    3) unknown-provider
    """
    message_attributes = sqs_record.get("messageAttributes") or {}
    provider_attr = message_attributes.get("providerId")
    if isinstance(provider_attr, dict):
        value = provider_attr.get("stringValue")
        if isinstance(value, str) and value.strip():
            return value.strip()

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
