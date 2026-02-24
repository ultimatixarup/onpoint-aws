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


def test_ddb_serialize_converts_float_values(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app_float_serialize", module_path)

    serialized = mod._ddb_serialize({"fuelTankCapacity": 15.5})
    assert serialized["fuelTankCapacity"]["N"] == "15.5"


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
    monkeypatch.setenv("VIN_TENANT_FLEET_INDEX", "TenantFleetIndexV2")
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app", module_path)

    def query(**kwargs):
        assert kwargs.get("IndexName") == "TenantFleetIndexV2"
        assert "GSI2PK" in kwargs.get("KeyConditionExpression", "")
        return {"Items": [], "LastEvaluatedKey": None}

    mod._ddb = DummyClient(query=query)

    vins = mod._list_vins_for_tenant("tenant-1", "fleet-1", active_only=False)
    assert vins == []


def test_list_fleets_includes_tenant_name(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app_list_fleets", module_path)

    mod._ddb_scan = lambda _args: [
        {
            "PK": "FLEET#fleet-1",
            "SK": "META",
            "fleetId": "fleet-1",
            "tenantId": "tenant-1",
            "status": "ACTIVE",
        }
    ]
    mod._ddb_get = lambda _table, key: (
        {"tenantId": "tenant-1", "name": "Test Tenant"}
        if key == {"PK": "TENANT#tenant-1", "SK": "META"}
        else None
    )

    response = mod._list_fleets({"tenantId": "tenant-1"}, {}, "admin", None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["items"][0]["tenantName"] == "Test Tenant"


def test_get_fleet_includes_tenant_name(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app_get_fleet", module_path)

    def fake_ddb_get(_table, key):
        if key == {"PK": "FLEET#fleet-1", "SK": "META"}:
            return {
                "PK": "FLEET#fleet-1",
                "SK": "META",
                "fleetId": "fleet-1",
                "tenantId": "tenant-1",
                "status": "ACTIVE",
            }
        if key == {"PK": "TENANT#tenant-1", "SK": "META"}:
            return {"tenantId": "tenant-1", "name": "Test Tenant"}
        return None

    mod._ddb_get = fake_ddb_get

    response = mod._get_fleet("fleet-1", {}, "admin", None)
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["tenantName"] == "Test Tenant"


def test_list_fleet_driver_assignments_active_only(monkeypatch):
    add_common_to_path()

    def fake_client(service_name):
        return DummyClient()

    _set_env(monkeypatch)
    monkeypatch.setattr(boto3, "client", fake_client)

    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "fleet_tenancy_api" / "app.py"
    mod = load_lambda_module("fleet_tenancy_api_app_fleet_assignments", module_path)

    def fake_ddb_get(_table, key):
        if key == {"PK": "FLEET#fleet-1", "SK": "META"}:
            return {
                "PK": "FLEET#fleet-1",
                "SK": "META",
                "fleetId": "fleet-1",
                "tenantId": "tenant-1",
            }
        return None

    def fake_list_vins_for_tenant(tenant_id, fleet_id, active_only):
        assert tenant_id == "tenant-1"
        assert fleet_id == "fleet-1"
        assert active_only is False
        return ["VIN123", "VIN456"]

    def fake_ddb_query(params):
        pk = (params.get("ExpressionAttributeValues") or {}).get(":pk", {}).get("S")
        if pk == "VIN#VIN123":
            return [
                {
                    "driverId": "driver-active",
                    "vin": "VIN123",
                    "tenantId": "tenant-1",
                    "effectiveFrom": "2025-01-01T00:00:00Z",
                },
                {
                    "driverId": "driver-expired",
                    "vin": "VIN123",
                    "tenantId": "tenant-1",
                    "effectiveFrom": "2024-01-01T00:00:00Z",
                    "effectiveTo": "2024-12-31T23:59:59Z",
                },
            ]
        if pk == "VIN#VIN456":
            return [
                {
                    "driverId": "driver-other-tenant",
                    "vin": "VIN456",
                    "tenantId": "tenant-2",
                    "effectiveFrom": "2025-01-01T00:00:00Z",
                }
            ]
        return []

    mod._ddb_get = fake_ddb_get
    mod._list_vins_for_tenant = fake_list_vins_for_tenant
    mod._ddb_query = fake_ddb_query

    event = {
        "httpMethod": "GET",
        "path": "/fleets/fleet-1/driver-assignments",
        "headers": {
            "x-role": "tenant-admin",
            "x-tenant-id": "tenant-1",
        },
        "queryStringParameters": {
            "asOf": "2026-01-15T00:00:00Z",
        },
    }

    resp = mod.lambda_handler(event, None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["fleetId"] == "fleet-1"
    assert body["tenantId"] == "tenant-1"
    assert body["activeOnly"] is True
    assert [item["driverId"] for item in body["items"]] == ["driver-active"]
