import json
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


def test_vin_assign_requires_idempotency(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app", module_path)

    mod._ddb = DummyClient(
        query=lambda **kwargs: {"Items": [], "LastEvaluatedKey": None},
        put_item=lambda **kwargs: {},
    )

    event = {
        "httpMethod": "POST",
        "requestContext": {"identity": {"apiKey": "admin"}},
        "headers": {"x-role": "admin"},
        "path": "/vin-registry/assign",
        "body": json.dumps(
            {
                "vin": "VIN123",
                "tenantId": "tenant-1",
                "effectiveFrom": "2026-01-01T00:00:00Z",
                "reason": "initial assignment",
            }
        ),
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 400
    body = json.loads(resp["body"])
    assert "Idempotency-Key" in body.get("error", "")


def test_vin_transfer_requires_from_owner(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app", module_path)

    history_item = {
        "PK": "VIN#VIN123",
        "SK": "EFFECTIVE_FROM#2026-01-01T00:00:00Z",
        "vin": "VIN123",
        "tenantId": "tenant-1",
        "effectiveFrom": "2026-01-01T00:00:00Z",
    }

    mod._ddb = DummyClient(
        query=lambda **kwargs: {"Items": [mod._ddb_serialize(history_item)], "LastEvaluatedKey": None},
        update_item=lambda **kwargs: {},
        put_item=lambda **kwargs: {},
        get_item=lambda **kwargs: {},
    )

    event = {
        "httpMethod": "POST",
        "requestContext": {"identity": {"apiKey": "admin"}},
        "headers": {"x-role": "admin", "idempotency-key": "abc"},
        "path": "/vin-registry/transfer",
        "body": json.dumps(
            {
                "vin": "VIN123",
                "fromTenantId": "tenant-2",
                "toTenantId": "tenant-3",
                "effectiveFrom": "2026-02-01T00:00:00Z",
                "reason": "transfer",
            }
        ),
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 409
    body = json.loads(resp["body"])
    assert "fromTenantId" in body.get("error", "")


def test_vehicle_get_forbidden_without_tenant(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app", module_path)

    mod._ddb = DummyClient(
        get_item=lambda **kwargs: {
            "Item": {
                "PK": {"S": "VIN#VIN123"},
                "SK": {"S": "META"},
                "vin": {"S": "VIN123"},
            }
        }
    )

    event = {
        "httpMethod": "GET",
        "requestContext": {"identity": {"apiKey": ""}},
        "pathParameters": {"vin": "VIN123"},
        "resource": "/vehicles/{vin}",
        "path": "/vehicles/VIN123",
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 403


def test_assign_vin_sets_tenant_fleet_index_keys(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app", module_path)

    captured = {}

    def put_item(**kwargs):
        captured.update(kwargs.get("Item", {}))

    mod._ddb = DummyClient(
        query=lambda **kwargs: {"Items": [], "LastEvaluatedKey": None},
        get_item=lambda **kwargs: {},
        put_item=put_item,
    )

    event = {
        "httpMethod": "POST",
        "requestContext": {"identity": {"apiKey": "admin"}},
        "headers": {"x-role": "admin", "idempotency-key": "abc"},
        "path": "/vin-registry/assign",
        "body": json.dumps(
            {
                "vin": "VIN123",
                "tenantId": "tenant-1",
                "fleetId": "fleet-1",
                "effectiveFrom": "2026-01-01T00:00:00Z",
                "reason": "assign",
            }
        ),
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 201
    assert captured.get("GSI2PK", {}).get("S") == "TENANT#tenant-1#FLEET#fleet-1"
    assert captured.get("GSI2SK", {}).get("S") == "VIN#VIN123"


def test_list_vins_for_tenant_uses_fleet_index(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setenv("VIN_TENANT_FLEET_INDEX", "TenantFleetIndex")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app", module_path)

    def query(**kwargs):
        assert kwargs.get("IndexName") == "TenantFleetIndex"
        assert "GSI2PK" in kwargs.get("KeyConditionExpression", "")
        return {"Items": [], "LastEvaluatedKey": None}

    mod._ddb = DummyClient(query=query)

    vins = mod._list_vins_for_tenant("tenant-1", "fleet-1", active_only=False)
    assert vins == []
