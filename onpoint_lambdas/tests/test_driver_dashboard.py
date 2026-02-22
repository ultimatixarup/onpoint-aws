import json
from decimal import Decimal
from pathlib import Path

import boto3

from .helpers import add_common_to_path, load_lambda_module, DummyClient


def _set_env(monkeypatch):
    monkeypatch.setenv("TENANTS_TABLE", "tenants")
    monkeypatch.setenv("CUSTOMERS_TABLE", "customers")
    monkeypatch.setenv("FLEETS_TABLE", "fleets")
    monkeypatch.setenv("VEHICLES_TABLE", "vehicles")
    monkeypatch.setenv("VIN_REGISTRY_TABLE", "vin-registry")
    monkeypatch.setenv("DRIVERS_TABLE", "drivers")
    monkeypatch.setenv("DRIVER_ASSIGNMENTS_TABLE", "driver-assignments")
    monkeypatch.setenv("AUDIT_LOG_TABLE", "audit")
    monkeypatch.setenv("IDEMPOTENCY_TABLE", "idempotency")
    monkeypatch.setenv("TELEMETRY_EVENTS_TABLE", "telemetry-events")
    monkeypatch.setenv("TRIP_SUMMARY_TABLE", "trip-summary")


def _load_module(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_dashboard", module_path)
    return mod


def _driver_item():
    return {
        "PK": "DRIVER#driver-1",
        "SK": "META",
        "driverId": "driver-1",
        "tenantId": "tenant-1",
        "fleetId": "fleet-1",
    }


def _assignment_item():
    return {
        "PK": "DRIVER#driver-1",
        "SK": "EFFECTIVE_FROM#2026-01-01T00:00:00Z#VIN#VIN123",
        "vin": "VIN123",
        "tenantId": "tenant-1",
        "effectiveFrom": "2026-01-01T00:00:00Z",
        "effectiveTo": None,
    }


def _trip_summary_item():
    summary = {
        "distance": {"nightMiles": 5.0},
        "speed": {"maxMph": 80},
        "events": {
            "harshBrakingCount": 1,
            "harshAccelerationCount": 2,
            "harshCorneringCount": 0,
            "collisionCount": 1,
            "seatbeltViolationCount": 3,
        },
        "drivingTime": "00:30:00",
        "idlingTime": "00:05:00",
        "mpg": {"actualMpg": 15.0},
    }


def _trip_summary_item_without_top_level_miles():
    summary = {
        "distance": {"totalMiles": 42.3, "nightMiles": 5.0},
        "speed": {"maxMph": 80},
        "events": {
            "harshBrakingCount": 1,
            "harshAccelerationCount": 2,
            "harshCorneringCount": 0,
            "collisionCount": 1,
            "seatbeltViolationCount": 3,
        },
        "drivingTime": "00:30:00",
        "idlingTime": "00:05:00",
        "mpg": {"actualMpg": 15.0},
    }
    return {
        "PK": "VEHICLE#VIN123",
        "SK": "TRIP_SUMMARY#TRIP1",
        "vin": "VIN123",
        "tripId": "TRIP1",
        "startTime": "2026-02-01T00:00:00Z",
        "endTime": "2026-02-01T00:30:00Z",
        "fuelConsumed": Decimal("2.0"),
        "safetyScore": 90,
        "overspeedMilesStandard": Decimal("1.0"),
        "overspeedMilesSevere": Decimal("0.5"),
        "overspeedMilesTotal": Decimal("1.5"),
        "overspeedEventCountStandard": 2,
        "overspeedEventCountSevere": 1,
        "overspeedEventCountTotal": 3,
        "summary": json.dumps(summary),
    }
    return {
        "PK": "VEHICLE#VIN123",
        "SK": "TRIP_SUMMARY#TRIP1",
        "vin": "VIN123",
        "tripId": "TRIP1",
        "startTime": "2026-02-01T00:00:00Z",
        "endTime": "2026-02-01T00:30:00Z",
        "milesDriven": Decimal("30.0"),
        "fuelConsumed": Decimal("2.0"),
        "safetyScore": 90,
        "overspeedMilesStandard": Decimal("1.0"),
        "overspeedMilesSevere": Decimal("0.5"),
        "overspeedMilesTotal": Decimal("1.5"),
        "overspeedEventCountStandard": 2,
        "overspeedEventCountSevere": 1,
        "overspeedEventCountTotal": 3,
        "summary": json.dumps(summary),
    }


def test_driver_dashboard_totals(monkeypatch):
    mod = _load_module(monkeypatch)

    def get_item(**kwargs):
        return {"Item": mod._ddb_serialize(_driver_item())}

    def query(**kwargs):
        table = kwargs.get("TableName")
        if table == "driver-assignments":
            return {"Items": [mod._ddb_serialize(_assignment_item())], "LastEvaluatedKey": None}
        if table == "trip-summary":
            return {"Items": [mod._ddb_serialize(_trip_summary_item())], "LastEvaluatedKey": None}
        return {"Items": [], "LastEvaluatedKey": None}

    mod._ddb = DummyClient(query=query, get_item=get_item)

    event = {
        "httpMethod": "GET",
        "headers": {"x-role": "tenant-admin", "x-tenant-id": "tenant-1"},
        "path": "/tenants/tenant-1/drivers/driver-1/dashboard",
        "queryStringParameters": {
            "from": "2026-02-01T00:00:00Z",
            "to": "2026-02-02T00:00:00Z",
        },
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    totals = body["totals"]
    assert totals["milesDriven"] == 30.0
    assert totals["drivingTimeSeconds"] == 1800
    assert totals["idlingTimeSeconds"] == 300
    assert totals["nightMiles"] == 5.0
    assert totals["averageSpeedMph"] == 60.0
    assert totals["topSpeedMph"] == 80
    assert totals["harshBraking"] == 1
    assert totals["harshAcceleration"] == 2
    assert totals["harshCornering"] == 0
    assert totals["collisionCount"] == 1
    assert totals["seatbeltViolations"] == 3
    assert totals["overspeed"]["eventCountTotal"] == 3
    assert totals["overspeed"]["milesTotal"] == 1.5
    assert totals["safetyScore"] == 90.0
    assert totals["fuelEfficiencyMpg"] == 15.0
    assert body["trips"]["count"] == 1


def test_driver_dashboard_totals_miles_fallback_from_summary(monkeypatch):
    mod = _load_module(monkeypatch)

    def get_item(**kwargs):
        return {"Item": mod._ddb_serialize(_driver_item())}

    def query(**kwargs):
        table = kwargs.get("TableName")
        if table == "driver-assignments":
            return {"Items": [mod._ddb_serialize(_assignment_item())], "LastEvaluatedKey": None}
        if table == "trip-summary":
            return {
                "Items": [mod._ddb_serialize(_trip_summary_item_without_top_level_miles())],
                "LastEvaluatedKey": None,
            }
        return {"Items": [], "LastEvaluatedKey": None}

    mod._ddb = DummyClient(query=query, get_item=get_item)

    event = {
        "httpMethod": "GET",
        "headers": {"x-role": "tenant-admin", "x-tenant-id": "tenant-1"},
        "path": "/tenants/tenant-1/drivers/driver-1/dashboard",
        "queryStringParameters": {
            "from": "2026-02-01T00:00:00Z",
            "to": "2026-02-02T00:00:00Z",
        },
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    totals = body["totals"]
    assert totals["milesDriven"] == 42.3
    assert totals["averageSpeedMph"] == 84.6
    assert body["trips"]["count"] == 1


def test_driver_dashboard_trips(monkeypatch):
    mod = _load_module(monkeypatch)

    def get_item(**kwargs):
        return {"Item": mod._ddb_serialize(_driver_item())}

    def query(**kwargs):
        table = kwargs.get("TableName")
        if table == "driver-assignments":
            return {"Items": [mod._ddb_serialize(_assignment_item())], "LastEvaluatedKey": None}
        if table == "trip-summary":
            return {"Items": [mod._ddb_serialize(_trip_summary_item())], "LastEvaluatedKey": None}
        return {"Items": [], "LastEvaluatedKey": None}

    mod._ddb = DummyClient(query=query, get_item=get_item)

    event = {
        "httpMethod": "GET",
        "headers": {"x-role": "tenant-admin", "x-tenant-id": "tenant-1"},
        "path": "/tenants/tenant-1/drivers/driver-1/dashboard/trips",
        "queryStringParameters": {"limit": "10"},
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert len(body["items"]) == 1
    row = body["items"][0]
    assert row["tripId"] == "TRIP1"
    assert row["milesDriven"] == 30.0
    assert row["fuelConsumed"] == 2.0
    assert row["safetyScore"] == 90.0
    assert row["overspeedMilesStandard"] == 1.0
    assert row["overspeedMilesSevere"] == 0.5
    assert row["overspeedMilesTotal"] == 1.5
    assert row["overspeedEventCountStandard"] == 2
    assert row["overspeedEventCountSevere"] == 1
    assert row["overspeedEventCountTotal"] == 3
    assert row["topSpeedMph"] == 80.0


def test_driver_dashboard_trips_miles_fallback_from_summary(monkeypatch):
    mod = _load_module(monkeypatch)

    def get_item(**kwargs):
        return {"Item": mod._ddb_serialize(_driver_item())}

    def query(**kwargs):
        table = kwargs.get("TableName")
        if table == "driver-assignments":
            return {"Items": [mod._ddb_serialize(_assignment_item())], "LastEvaluatedKey": None}
        if table == "trip-summary":
            return {
                "Items": [mod._ddb_serialize(_trip_summary_item_without_top_level_miles())],
                "LastEvaluatedKey": None,
            }
        return {"Items": [], "LastEvaluatedKey": None}

    mod._ddb = DummyClient(query=query, get_item=get_item)

    event = {
        "httpMethod": "GET",
        "headers": {"x-role": "tenant-admin", "x-tenant-id": "tenant-1"},
        "path": "/tenants/tenant-1/drivers/driver-1/dashboard/trips",
        "queryStringParameters": {"limit": "25"},
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert len(body["items"]) == 1
    row = body["items"][0]
    assert row["tripId"] == "TRIP1"
    assert row["milesDriven"] == 42.3
    assert row["fuelConsumed"] == 2.0
    assert row["safetyScore"] == 90.0
    assert row["overspeedMilesStandard"] == 1.0
    assert row["overspeedMilesSevere"] == 0.5
    assert row["overspeedMilesTotal"] == 1.5
    assert row["overspeedEventCountStandard"] == 2
    assert row["overspeedEventCountSevere"] == 1
    assert row["overspeedEventCountTotal"] == 3


def test_driver_dashboard_events_filter(monkeypatch):
    event_items = [
        {
            "PK": "VEHICLE#VIN123#TRIP#TRIP1",
            "SK": "TS#2026-02-01T00:10:00Z#MSG#1",
            "eventType": "harsh_braking",
            "eventTime": "2026-02-01T00:10:00Z",
            "speed_mph": Decimal("55.0"),
        },
        {
            "PK": "VEHICLE#VIN123#TRIP#TRIP1",
            "SK": "TS#2026-02-01T00:12:00Z#MSG#2",
            "eventType": "telemetry",
            "eventTime": "2026-02-01T00:12:00Z",
            "speed_mph": Decimal("30.0"),
        },
    ]

    mod = _load_module(monkeypatch)

    def get_item(**kwargs):
        return {"Item": mod._ddb_serialize(_driver_item())}

    def query(**kwargs):
        table = kwargs.get("TableName")
        if table == "driver-assignments":
            return {"Items": [mod._ddb_serialize(_assignment_item())], "LastEvaluatedKey": None}
        if table == "trip-summary":
            return {"Items": [mod._ddb_serialize(_trip_summary_item())], "LastEvaluatedKey": None}
        if table == "telemetry-events":
            return {"Items": [mod._ddb_serialize(it) for it in event_items], "LastEvaluatedKey": None}
        return {"Items": [], "LastEvaluatedKey": None}

    mod._ddb = DummyClient(query=query, get_item=get_item)

    event = {
        "httpMethod": "GET",
        "headers": {"x-role": "tenant-admin", "x-tenant-id": "tenant-1"},
        "path": "/tenants/tenant-1/drivers/driver-1/dashboard/events",
        "queryStringParameters": {"type": "harsh_braking"},
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert len(body["items"]) == 1
    assert body["items"][0]["eventType"] == "harsh_braking"
