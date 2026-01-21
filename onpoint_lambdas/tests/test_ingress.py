import json
from pathlib import Path

import boto3

from .helpers import add_common_to_path, load_lambda_module, DummyClient


def test_ingress_lambda_handler_processes_records(monkeypatch):
    add_common_to_path()

    records_seen = {}

    def put_records(StreamName, Records):
        records_seen["stream"] = StreamName
        records_seen["records"] = Records
        return {"FailedRecordCount": 0, "Records": [{} for _ in Records]}

    def fake_client(service_name):
        if service_name == "kinesis":
            return DummyClient(put_records=put_records)
        raise AssertionError(f"Unexpected client: {service_name}")

    monkeypatch.setenv("INGRESS_STREAM_NAME", "test-stream")
    monkeypatch.setenv("MAX_RAW_PAYLOAD_BYTES", "262144")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "ingress" / "app.py"
    mod = load_lambda_module("ingress_app", module_path)

    event = {
        "Records": [
            {
                "messageId": "m1",
                "body": json.dumps({"vin": "VIN123", "speed": 50}),
                "messageAttributes": {
                    "providerId": {"stringValue": "CEREBRUMX"}
                },
            }
        ]
    }

    resp = mod.lambda_handler(event, None)

    assert resp["status"] == "ok"
    assert resp["processedRecords"] == 1
    assert records_seen["stream"] == "test-stream"
    assert len(records_seen["records"]) == 1
