import json
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


def test_trip_detail_routes_with_path_params(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    # stub DynamoDB get_item for detail fetch
    mod.ddb = DummyClient(
        get_item=lambda **kwargs: {
            "Item": {
                "PK": {"S": "VEHICLE#V1"},
                "SK": {"S": "TRIP_SUMMARY#T1"},
                "vin": {"S": "V1"},
                "tripId": {"S": "T1"},
                "startTime": {"S": "2026-01-01T00:00:00Z"},
                "endTime": {"S": "2026-01-01T00:10:00Z"},
                "summary": {"S": "{\"foo\":\"bar\"}"},
            }
        }
    )

    event = {
        "httpMethod": "GET",
        "pathParameters": {"vin": "V1", "tripId": "T1"},
        "queryStringParameters": {"include": "summary"},
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["vin"] == "V1"
    assert body["tripId"] == "T1"
    assert body.get("summary") == {"foo": "bar"}


def test_list_trips_uses_path_vin(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    sample_item = {
        "PK": {"S": "VEHICLE#V1"},
        "SK": {"S": "TRIP_SUMMARY#T1"},
        "vin": {"S": "V1"},
        "tripId": {"S": "T1"},
        "startTime": {"S": "2026-01-01T00:00:00Z"},
        "endTime": {"S": "2026-01-01T00:10:00Z"},
    }

    mod._query_vehicle = lambda vin, exclusive_start_key=None, page_size=None, scan_forward=False: ([sample_item], None)

    event = {
        "httpMethod": "GET",
        "pathParameters": {"vin": "V1"},
        "queryStringParameters": {},
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["items"][0]["vin"] == "V1"
    assert body["nextToken"] is None


def test_list_trips_without_vehicle_returns_400(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    event = {
        "httpMethod": "GET",
        "queryStringParameters": {},
        "pathParameters": None,
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert "vehicleId" in body.get("error", "")
