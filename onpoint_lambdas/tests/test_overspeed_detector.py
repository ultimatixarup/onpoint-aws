from pathlib import Path

import boto3

from .helpers import add_common_to_path, load_lambda_module, DummyClient


def test_overspeed_helpers(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry")
    monkeypatch.setenv("VEHICLE_STATE_TABLE", "vehicle")
    monkeypatch.setenv("OVERSPEED_DEDUPE_TABLE", "dedupe")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "overspeed_detector" / "app.py"
    mod = load_lambda_module("overspeed_app", module_path)

    assert mod._rank_conf("HIGH") == 2
    assert mod._rank_conf("LOW") == 0
    assert mod._to_float("12.3") == 12.3
    assert mod._to_float(None) is None
