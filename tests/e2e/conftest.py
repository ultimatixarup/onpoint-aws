import os
import uuid
import pytest

from .helpers.client import ApiClient
from .helpers.fixtures import load_env_file, require_env, optional_env, make_ids, make_vin


@pytest.fixture(scope="session", autouse=True)
def _load_env():
    load_env_file()


@pytest.fixture(scope="session")
def base_url():
    return optional_env("ONPOINT_BASE_URL")


@pytest.fixture(scope="session")
def trip_base_url(base_url):
    return optional_env("ONPOINT_TRIP_BASE_URL") or base_url or require_env("ONPOINT_TRIP_BASE_URL")


@pytest.fixture(scope="session")
def fleet_base_url(base_url):
    return optional_env("ONPOINT_FLEET_BASE_URL") or base_url or require_env("ONPOINT_FLEET_BASE_URL")


@pytest.fixture(scope="session")
def ingest_base_url(base_url):
    return optional_env("ONPOINT_INGEST_BASE_URL") or base_url or require_env("ONPOINT_INGEST_BASE_URL")


@pytest.fixture(scope="session")
def api_key():
    return require_env("ONPOINT_API_KEY")


@pytest.fixture(scope="session")
def trip_api_key(api_key):
    return optional_env("ONPOINT_TRIP_API_KEY") or api_key


@pytest.fixture(scope="session")
def fleet_api_key(api_key):
    return optional_env("ONPOINT_FLEET_API_KEY") or api_key


@pytest.fixture(scope="session")
def ingest_api_key(api_key):
    return optional_env("ONPOINT_INGEST_API_KEY") or api_key


@pytest.fixture(scope="session")
def trip_client(trip_base_url, trip_api_key):
    return ApiClient(trip_base_url, trip_api_key)


@pytest.fixture(scope="session")
def fleet_client(fleet_base_url, fleet_api_key):
    return ApiClient(fleet_base_url, fleet_api_key, default_headers={"x-role": "admin"})


@pytest.fixture(scope="session")
def ingest_client(ingest_base_url, ingest_api_key):
    return ApiClient(ingest_base_url, ingest_api_key)


@pytest.fixture(scope="session")
def env_vin():
    return require_env("ONPOINT_VIN")


@pytest.fixture(scope="session")
def env_trip_id():
    return require_env("ONPOINT_TRIP_ID")


@pytest.fixture(scope="session")
def forbidden_vin():
    return optional_env("ONPOINT_FORBIDDEN_VIN")


@pytest.fixture(scope="session")
def ids():
    return make_ids()


@pytest.fixture(scope="session")
def test_vin():
    return make_vin()


@pytest.fixture(scope="session")
def api_key_header(api_key):
    return {"x-api-key": api_key}


@pytest.fixture(scope="session")
def idempotency_key():
    return os.getenv("ONPOINT_IDEMPOTENCY_KEY", f"e2e-idempotency-{uuid.uuid4().hex[:8]}")


@pytest.fixture(scope="session")
def provisioned_resources(fleet_client, ids, test_vin, idempotency_key):
    tenant_body = {
        "tenantId": ids["tenant_id"],
        "name": "E2E Tenant",
        "config": {"retentionDays": 7},
        "reason": "e2e"
    }
    fleet_client.request("POST", "/tenants", headers={"Idempotency-Key": idempotency_key}, json_body=tenant_body)

    customer_body = {
        "customerId": ids["customer_id"],
        "tenantId": ids["tenant_id"],
        "billingProfile": {"plan": "test"},
        "reason": "e2e"
    }
    fleet_client.request("POST", "/customers", headers={"Idempotency-Key": idempotency_key}, json_body=customer_body)

    fleet_body = {
        "fleetId": ids["fleet_id"],
        "tenantId": ids["tenant_id"],
        "customerId": ids["customer_id"],
        "policies": {"speedLimitMph": 65},
        "reason": "e2e"
    }
    fleet_client.request("POST", "/fleets", headers={"Idempotency-Key": idempotency_key}, json_body=fleet_body)

    vehicle_body = {
        "vin": test_vin,
        "make": "Test",
        "model": "Truck",
        "year": 2023,
        "reason": "e2e"
    }
    fleet_client.request("POST", "/vehicles", headers={"Idempotency-Key": idempotency_key}, json_body=vehicle_body)

    assign_body = {
        "vin": test_vin,
        "tenantId": ids["tenant_id"],
        "customerId": ids["customer_id"],
        "fleetId": ids["fleet_id"],
        "effectiveFrom": "2026-01-01T00:00:00Z",
        "reason": "assign"
    }
    fleet_client.request("POST", "/vin-registry/assign", headers={"Idempotency-Key": idempotency_key}, json_body=assign_body)

    driver_body = {
        "driverId": ids["driver_id"],
        "tenantId": ids["tenant_id"],
        "fleetId": ids["fleet_id"],
        "metadata": {"name": "E2E Driver"},
        "reason": "e2e"
    }
    fleet_client.request("POST", "/drivers", headers={"Idempotency-Key": idempotency_key}, json_body=driver_body)

    assignment_body = {
        "vin": test_vin,
        "effectiveFrom": "2026-01-15T00:00:00Z",
        "assignmentType": "PRIMARY",
        "reason": "e2e"
    }
    fleet_client.request(
        "POST",
        f"/drivers/{ids['driver_id']}/assignments",
        headers={"Idempotency-Key": idempotency_key},
        json_body=assignment_body,
    )

    return {"ids": ids, "vin": test_vin}
