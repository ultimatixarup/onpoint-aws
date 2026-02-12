"""Tests for updated ingress envelope normalization."""
import json
import os
from pathlib import Path
from unittest.mock import Mock, patch

import pytest


def test_envelope_normalizes_minimal_payload():
    """Test that minimal payload with cx_event_type and vin produces required top-level fields."""
    # Add common to path
    import sys
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))

    from onpoint_common.envelope import build_ingress_envelope

    raw_payload = {
        "cx_event_type": "trip_start",
        "vin": "TE66666ST123",
        "cx_timestamp": "2026-01-23T18:00:00Z",
        "cx_msg_id": "msg-001"
    }

    sqs_record = {
        "messageId": "sqs-123",
        "attributes": {}
    }

    with patch.dict(os.environ, {"ENV": "dev", "PROJECT": "onpoint"}):
        envelope = build_ingress_envelope(
            raw_payload=raw_payload,
            provider_id="CEREBRUMX",
            sqs_record=sqs_record
        )

    # Verify required top-level fields
    assert envelope["vin"] == "TE66666ST123"
    assert envelope["type"] == "trip_start"
    assert envelope["time"] == "2026-01-23T18:00:00Z"
    assert envelope["msgId"] == "msg-001"
    assert envelope["providerId"] == "CEREBRUMX"
    assert envelope["environment"] == "dev"
    assert envelope["project"] == "onpoint"
    assert envelope["domain"] == "telematics"
    assert envelope["schemaVersion"] == "telematics-1.0"

    # Verify original data is preserved
    assert envelope["data"] == raw_payload


def test_envelope_missing_timestamp_uses_current_time():
    """Test that payload without cx_timestamp gets current UTC time."""
    import sys
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))

    from onpoint_common.envelope import build_ingress_envelope

    raw_payload = {
        "cx_event_type": "telemetry",
        "vin": "TEST123"
        # No cx_timestamp
    }

    sqs_record = {"messageId": "sqs-456"}

    with patch.dict(os.environ, {"ENV": "test", "PROJECT": "test"}):
        envelope = build_ingress_envelope(
            raw_payload=raw_payload,
            provider_id="TEST_PROVIDER",
            sqs_record=sqs_record
        )

    # Should have a time field (current UTC ISO string)
    assert envelope["time"] is not None
    assert "T" in envelope["time"]  # ISO format
    assert envelope["vin"] == "TEST123"
    assert envelope["type"] == "telemetry"


def test_envelope_fallback_vin_from_cx_vehicle_id():
    """Test that vin can come from cx_vehicle_id if vin is missing."""
    import sys
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))

    from onpoint_common.envelope import build_ingress_envelope

    raw_payload = {
        "cx_event_type": "trip_end",
        "cx_vehicle_id": "VIN999",  # Should be extracted
        "cx_timestamp": "2026-01-23T19:00:00Z"
    }

    sqs_record = {"messageId": "sqs-789"}

    with patch.dict(os.environ, {"ENV": "dev"}):
        envelope = build_ingress_envelope(
            raw_payload=raw_payload,
            provider_id="PROVIDER2",
            sqs_record=sqs_record
        )

    assert envelope["vin"] == "VIN999"


def test_envelope_msgid_fallback_to_sqs_messageid():
    """Test that msgId falls back to SQS messageId if cx_msg_id is missing."""
    import sys
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))

    from onpoint_common.envelope import build_ingress_envelope

    raw_payload = {
        "cx_event_type": "ignition_on",
        "vin": "ABC123"
        # No cx_msg_id
    }

    sqs_record = {"messageId": "sqs-999"}

    with patch.dict(os.environ, {}):
        envelope = build_ingress_envelope(
            raw_payload=raw_payload,
            provider_id="PROVIDER3",
            sqs_record=sqs_record
        )

    assert envelope["msgId"] == "sqs-999"


def test_provider_lookup_unknown_returns_unknown():
    """Test that missing API key returns 'unknown' provider."""
    import sys
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))

    from onpoint_common.envelope import resolve_provider_id

    sqs_record = {
        "messageAttributes": {
            "providerId": {"stringValue": "UNKNOWN_KEY_VALUE"}
        }
    }
    raw_payload = {}

    with patch.dict(os.environ, {"PROVIDER_LOOKUP_MODE": "dynamodb", "PROVIDER_TABLE": "test-table"}):
        with patch("boto3.client") as mock_client:
            # Mock DynamoDB returning no item
            mock_ddb = Mock()
            mock_ddb.get_item.return_value = {}
            mock_client.return_value = mock_ddb

            provider_id = resolve_provider_id(sqs_record, raw_payload)

    assert provider_id == "unknown"


def test_provider_lookup_dynamodb_success():
    """Test successful provider lookup from DynamoDB."""
    import sys
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))

    from onpoint_common.envelope import resolve_provider_id

    sqs_record = {
        "messageAttributes": {
            "providerId": {"stringValue": "NFNdM4PQTz8jKeNZQMF6o8gNXKdNnTpO1Ljuj52T"}
        }
    }
    raw_payload = {}

    with patch.dict(os.environ, {"PROVIDER_LOOKUP_MODE": "dynamodb", "PROVIDER_TABLE": "provider-keys"}):
        with patch("boto3.client") as mock_client:
            # Mock DynamoDB returning provider name
            mock_ddb = Mock()
            mock_ddb.get_item.return_value = {
                "Item": {
                    "providerId": {"S": "CEREBRUMX"}
                }
            }
            mock_client.return_value = mock_ddb

            provider_id = resolve_provider_id(sqs_record, raw_payload)

    assert provider_id == "CEREBRUMX"


def test_envelope_has_optional_tripid():
    """Test that tripId is included when present in payload."""
    import sys
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))

    from onpoint_common.envelope import build_ingress_envelope

    raw_payload = {
        "cx_event_type": "telemetry",
        "vin": "VIN123",
        "cx_trip_id": "trip-456",
        "cx_timestamp": "2026-01-23T20:00:00Z"
    }

    sqs_record = {"messageId": "msg-001"}

    with patch.dict(os.environ, {}):
        envelope = build_ingress_envelope(
            raw_payload=raw_payload,
            provider_id="TEST",
            sqs_record=sqs_record
        )

    assert envelope["tripId"] == "trip-456"
