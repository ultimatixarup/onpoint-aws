from pathlib import Path

import boto3

from .helpers import add_common_to_path, load_lambda_module, DummyClient


def test_trip_summary_api_helpers(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    token = mod._encode_token({"a": 1})
    decoded = mod._decode_token(token)
    assert decoded.get("a") == 1

    assert mod._normalize_include("summary", mod.INCLUDE_NONE) == "summary"
    assert mod._normalize_include("summary,alerts", mod.INCLUDE_NONE) == "summary"
    assert mod._normalize_include(None, mod.INCLUDE_NONE) == mod.INCLUDE_NONE
