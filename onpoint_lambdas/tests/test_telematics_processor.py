from pathlib import Path

import boto3

from .helpers import add_common_to_path, load_lambda_module, DummyClient


def test_telematics_helpers(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry")
    monkeypatch.setenv("VEHICLE_STATE_TABLE", "vehicle")
    monkeypatch.setenv("TRIPS_TABLE", "trips")
    monkeypatch.setenv("TRIP_SUMMARY_QUEUE_URL", "https://sqs.example/queue")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "telematics_processor" / "app.py"
    mod = load_lambda_module("telematics_app", module_path)

    raw = {"cx_readable_timestamp": "2024-01-01T00:00:00Z"}
    assert mod._parse_event_time(raw).endswith("+00:00")

    raw_speed = {"cx_vehicle_speed": {"value": "100"}}
    mph = mod._get_speed_mph(raw_speed)
    assert mph is not None
    assert round(mph, 2) == round(100 * mod.KPH_TO_MPH, 2)
