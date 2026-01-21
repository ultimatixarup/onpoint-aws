from pathlib import Path

import boto3

from .helpers import add_common_to_path, load_lambda_module, DummyClient


def test_trip_summary_builder_helpers(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry")
    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_builder" / "app.py"
    mod = load_lambda_module("trip_summary_builder_app", module_path)

    assert mod._safe_div(10, 2) == 5
    assert mod._safe_div(10, 0) is None
    assert mod._sec_to_hms(3661) == "01:01:01"
