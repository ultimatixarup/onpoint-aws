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


def test_detail_route_with_tripId_does_not_require_vehicleId_query_param(monkeypatch):
    """
    Regression test: API Gateway passes pathParameters with vin and tripId.
    Lambda should treat this as DETAIL route and NOT return the 
    "vehicleId or vehicleIds required" error.
    """
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    # Stub DynamoDB to return no item (404 case)
    mod.ddb = DummyClient(get_item=lambda **kwargs: {})

    # Event exactly as API Gateway sends it
    event = {
        "httpMethod": "GET",
        "pathParameters": {
            "vin": "4JGFB4FB7RA981998",
            "tripId": "CXGM_093B34DED53611F09127121AF9B02FBB"
        },
        "queryStringParameters": None,
        "resource": "/trips/{vin}/{tripId}",
    }

    resp = mod.lambda_handler(event, None)
    
    # Should return 404 (trip not found), NOT 400 (vehicleId required)
    assert resp["statusCode"] == 404, f"Expected 404, got {resp['statusCode']}: {resp.get('body')}"
    body = json.loads(resp["body"])
    assert "not found" in body.get("error", "").lower()
    # Ensure it does NOT have the "vehicleId or vehicleIds" error
    assert "vehicleId" not in body.get("error", "")


def test_trip_events_endpoint_returns_events(monkeypatch):
    """Test GET /trips/{tripId}/events returns telemetry events with normalized and raw."""
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry-events")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    # Mock telemetry events query
    mock_events = [
        {
            "EVENT_ID": {"S": "evt-1"},
            "EVENT_TYPE": {"S": "speed_alert"},
            "EVENT_TIME": {"S": "2026-01-24T02:00:00Z"},
            "NORMALIZED": {"S": '{"speed_mph": 85}'},
            "RAW": {"S": '{"raw_speed": 85000}'},
            "VIN": {"S": "VIN123"},
            "TRIP_ID": {"S": "TRIP456"},
        }
    ]
    mod.ddb = DummyClient(query=lambda **kwargs: {"Items": mock_events, "LastEvaluatedKey": None})

    event = {
        "httpMethod": "GET",
        "pathParameters": {"vin": "VIN123", "tripId": "TRIP456"},
        "queryStringParameters": None,
        "resource": "/trips/{vin}/{tripId}/events",
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["tripId"] == "TRIP456"
    assert body["count"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["eventId"] == "evt-1"
    assert body["items"][0]["normalized"] == {"speed_mph": 85}
    assert body["items"][0]["raw"] == {"raw_speed": 85000}


def test_trip_events_vin_mismatch_returns_404(monkeypatch):
    """Test VIN validation in trip events endpoint."""
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry-events")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    mock_events = [
        {
            "VIN": {"S": "ACTUAL_VIN"},
            "TRIP_ID": {"S": "TRIP456"},
        }
    ]
    mod.ddb = DummyClient(query=lambda **kwargs: {"Items": mock_events})

    event = {
        "httpMethod": "GET",
        "pathParameters": {"vin": "WRONG_VIN", "tripId": "TRIP456"},
        "queryStringParameters": None,
        "resource": "/trips/{vin}/{tripId}/events",
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 404
    body = json.loads(resp["body"])
    assert "VIN does not match" in body.get("error", "")


def test_trip_events_no_tripId_returns_400(monkeypatch):
    """Test that missing tripId returns 400."""
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")
    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry-events")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "trip_summary_api" / "app.py"
    mod = load_lambda_module("trip_summary_api_app", module_path)

    event = {
        "httpMethod": "GET",
        "pathParameters": None,
        "queryStringParameters": None,
        "resource": "/trips/{vin}/{tripId}/events",
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert "tripId" in body.get("error", "")

