import json
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import boto3

# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# -------------------------------------------------------------------
# AWS Clients
# -------------------------------------------------------------------
kinesis = boto3.client("kinesis")

# -------------------------------------------------------------------
# Environment Variables
# -------------------------------------------------------------------
INGRESS_STREAM_NAME = os.environ["INGRESS_STREAM_NAME"]

# Batch tuning (Kinesis PutRecords limits)
KINESIS_MAX_RECORDS = 500
KINESIS_MAX_TOTAL_BYTES = 5 * 1024 * 1024  # 5 MiB
KINESIS_MAX_RECORD_BYTES = 1024 * 1024     # 1 MiB

# Guardrails for incoming payload (before envelope)
MAX_RAW_PAYLOAD_BYTES = int(os.environ.get("MAX_RAW_PAYLOAD_BYTES", str(256 * 1024)))  # 256 KiB default

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------
def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_json_loads(s: str) -> Dict[str, Any]:
    obj = json.loads(s)
    if not isinstance(obj, dict):
        raise ValueError("Payload must be a JSON object")
    return obj


def _byte_len_utf8(s: str) -> int:
    return len(s.encode("utf-8"))


def build_envelope(raw_payload: dict, provider_id: str, record: dict) -> dict:
    """
    Wrap raw CerebrumX payload into OnPoint ingestion envelope.
    Raw payload is preserved exactly (no normalization here).
    """
    # Prefer upstream msg ids when present (helps end-to-end trace + dedupe later)
    upstream_msg_id = (
        raw_payload.get("cx_msg_id")
        or raw_payload.get("messageId")
        or raw_payload.get("trace_id")
    )

    attrs = record.get("attributes") or {}
    approx_receive_count = attrs.get("ApproximateReceiveCount")

    return {
        "messageId": str(uuid.uuid4()),  # internal id for this envelope
        "upstreamMessageId": upstream_msg_id,
        "providerId": provider_id,
        "domain": "telematics",
        "schemaVersion": "telematics-1.0",
        "ingestedAt": utc_now_iso(),
        "meta": {
            "sqsMessageId": record.get("messageId"),
            "approxReceiveCount": int(approx_receive_count) if str(approx_receive_count).isdigit() else None,
        },
        "data": raw_payload,
    }


def resolve_provider_id(record: dict, raw_payload: dict) -> str:
    """
    Resolve providerId priority:
    1) SQS message attribute 'providerId' (injected by API Gateway)
    2) providerId in payload (fallback)
    3) unknown-provider
    """
    message_attributes = record.get("messageAttributes") or {}
    provider_attr = message_attributes.get("providerId")
    if isinstance(provider_attr, dict):
        value = provider_attr.get("stringValue")
        if isinstance(value, str) and value.strip():
            return value.strip()

    v = raw_payload.get("providerId")
    if isinstance(v, str) and v.strip():
        return v.strip()

    return "unknown-provider"


def resolve_partition_key(raw_payload: dict, provider_id: str) -> str:
    """
    Partitioning strategy:
    - Use VIN if present (cx_vehicle_id or vin)
    - Else fall back to providerId (keeps it somewhat stable)
    """
    vin = raw_payload.get("cx_vehicle_id") or raw_payload.get("vin")
    if isinstance(vin, str) and vin.strip():
        return vin.strip()

    return provider_id


def _kinesis_entry(envelope: dict, partition_key: str) -> Dict[str, Any]:
    data_bytes = json.dumps(envelope, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    if len(data_bytes) > KINESIS_MAX_RECORD_BYTES:
        raise ValueError(f"Envelope too large for Kinesis record: {len(data_bytes)} bytes")
    return {
        "Data": data_bytes,
        "PartitionKey": partition_key,
    }


def put_batch_to_kinesis(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    PutRecords batch call. Raises on partial failure so SQS retries.
    """
    resp = kinesis.put_records(StreamName=INGRESS_STREAM_NAME, Records=entries)
    failed = int(resp.get("FailedRecordCount") or 0)

    if failed > 0:
        # Log a compact summary of which records failed
        recs = resp.get("Records") or []
        failures = []
        for i, r in enumerate(recs):
            if r.get("ErrorCode"):
                failures.append(
                    {
                        "index": i,
                        "errorCode": r.get("ErrorCode"),
                        "errorMessage": r.get("ErrorMessage"),
                    }
                )
        logger.error(f"Kinesis PutRecords partial failure: failed={failed} details={failures[:10]}")
        # Fail fast -> SQS retry -> DLQ after maxReceiveCount
        raise RuntimeError(f"Kinesis PutRecords had {failed} failed records")

    return resp


# -------------------------------------------------------------------
# Lambda Handler
# -------------------------------------------------------------------
def lambda_handler(event, context):
    """
    SQS-triggered ingress Lambda.
    Each SQS message corresponds to ONE API request payload.
    This lambda should stay lightweight; heavy checks happen downstream.
    """
    records = event.get("Records") or []
    logger.info(f"Received {len(records)} SQS records")

    # Build Kinesis batch with size caps
    batch: List[Dict[str, Any]] = []
    batch_bytes = 0
    processed = 0

    def flush():
        nonlocal batch, batch_bytes
        if not batch:
            return
        logger.info(f"Flushing {len(batch)} records to Kinesis stream={INGRESS_STREAM_NAME}")
        resp = put_batch_to_kinesis(batch)
        logger.info(
            f"PutRecords ok: Records={len(resp.get('Records') or [])} "
            f"FailedRecordCount={resp.get('FailedRecordCount')}"
        )
        batch = []
        batch_bytes = 0

    for record in records:
        body = record.get("body")
        if not body:
            raise ValueError(f"Empty SQS message body (messageId={record.get('messageId')})")

        # Guardrail: raw payload size (before parsing)
        raw_len = _byte_len_utf8(body)
        if raw_len > MAX_RAW_PAYLOAD_BYTES:
            raise ValueError(f"Raw payload too large: {raw_len} bytes > {MAX_RAW_PAYLOAD_BYTES}")

        raw_payload = _safe_json_loads(body)

        trace_id = (
            raw_payload.get("trace_id")
            or raw_payload.get("cx_msg_id")
            or record.get("messageId")
            or "no-trace-id"
        )

        provider_id = resolve_provider_id(record, raw_payload)
        partition_key = resolve_partition_key(raw_payload, provider_id)

        envelope = build_envelope(raw_payload=raw_payload, provider_id=provider_id, record=record)
        entry = _kinesis_entry(envelope, partition_key)

        # batch size / bytes cap (Kinesis hard limits)
        if (len(batch) + 1) > KINESIS_MAX_RECORDS:
            flush()

        if (batch_bytes + len(entry["Data"])) > KINESIS_MAX_TOTAL_BYTES:
            flush()

        batch.append(entry)
        batch_bytes += len(entry["Data"])
        processed += 1

        if processed % 50 == 0:
            logger.info(f"Prepared {processed}/{len(records)} records (trace_id sample={trace_id})")

    flush()

    return {"status": "ok", "processedRecords": processed}