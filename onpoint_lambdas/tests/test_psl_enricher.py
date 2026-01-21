from pathlib import Path

import boto3

from .helpers import add_common_to_path, load_lambda_module, DummyClient


def test_psl_enricher_parsing(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry")
    monkeypatch.setenv("PSL_CACHE_TABLE", "psl-cache")
    monkeypatch.setenv("OVERSPEED_DEDUPE_TABLE", "overspeed-dedupe")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "psl_enricher" / "app.py"
    mod = load_lambda_module("psl_enricher_app", module_path)

    mph, conf = mod._parse_maxspeed_to_mph("45 mph")
    assert mph == 45
    assert conf == "HIGH"

    mph, conf = mod._parse_maxspeed_to_mph("70 km/h")
    assert mph is not None
    assert conf == "MEDIUM"
