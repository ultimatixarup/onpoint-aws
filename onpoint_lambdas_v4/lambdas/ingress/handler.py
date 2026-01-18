import json
import os
from typing import Any, Dict, List

import boto3

from onpoint_common.logging import get_logger
from onpoint_common.envelope import (
    build_ingress_envelope,
    resolve_partition_key,
    resolve_provider_id,
    safe_json_object_loads,
    byte_len_utf8,
)

logger = get_logger(__name__)

kinesis = boto3.client("kinesis")

INGRESS_STREAM_NAME = os.environ["INGRESS_STREAM_NAME"]

# Batch tuning (Kinesis PutRecords limits)
KINESIS_MAX_RECORDS = 500
KINESIS_MAX_TOTAL_BYTES = 5 * 1024 * 1024  # 5 MiB
KINESIS_MAX_RECORD_BYTES = 1024 * 1024     # 1 MiB

# Guardrails for incoming payload (before envelope)
MAX_RAW_PAYLOAD_BYTES = int(os.environ.get("MAX_RAW_PAYLOAD_BYTES", str(256 * 1024)))


def _kinesis_entry(envelope: dict, partition_key: str) -> Dict[str, Any]:
    data_bytes = json.dumps(envelope, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    if len(data_bytes) > KINESIS_MAX_RECORD_BYTES:
        raise ValueError(f"Envelope too large for Kinesis record: {len(data_bytes)} bytes")
    return {"Data": data_bytes, "PartitionKey": partition_key}


def _put_batch_to_kinesis(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    resp = kinesis.put_records(StreamName=INGRESS_STREAM_NAME, Records=entries)
    failed = int(resp.get("FailedRecordCount") or 0)

    if failed > 0:
        recs = resp.get("Records") or []
        failures = []
        for i, r in enumerate(recs):
            if r.get("ErrorCode"):
                failures.append(
                    {"index": i, "errorCode": r.get("ErrorCode"), "errorMessage": r.get("ErrorMessage")}
                )
        logger.error(f"Kinesis PutRecords partial failure: failed={failed} details={failures[:10]}")
        raise RuntimeError(f"Kinesis PutRecords had {failed} failed records")

    return resp


def lambda_handler(event, context):
    records = event.get("Records") or []
    logger.info(f"Received {len(records)} SQS records")

    batch: List[Dict[str, Any]] = []
    batch_bytes = 0
    processed = 0

    def flush():
        nonlocal batch, batch_bytes
        if not batch:
            return
        logger.info(f"Flushing {len(batch)} records to Kinesis stream={INGRESS_STREAM_NAME}")
        resp = _put_batch_to_kinesis(batch)
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

        raw_len = byte_len_utf8(body)
        if raw_len > MAX_RAW_PAYLOAD_BYTES:
            raise ValueError(f"Raw payload too large: {raw_len} bytes > {MAX_RAW_PAYLOAD_BYTES}")

        raw_payload = safe_json_object_loads(body)

        provider_id = resolve_provider_id(record, raw_payload)
        partition_key = resolve_partition_key(raw_payload, provider_id)

        envelope = build_ingress_envelope(raw_payload=raw_payload, provider_id=provider_id, sqs_record=record)
        entry = _kinesis_entry(envelope, partition_key)

        if (len(batch) + 1) > KINESIS_MAX_RECORDS:
            flush()
        if (batch_bytes + len(entry["Data"])) > KINESIS_MAX_TOTAL_BYTES:
            flush()

        batch.append(entry)
        batch_bytes += len(entry["Data"])
        processed += 1

    flush()

    return {"status": "ok", "processedRecords": processed}
