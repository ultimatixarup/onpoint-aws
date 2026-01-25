from .helpers.client import dump_response


def test_missing_api_key(trip_base_url):
    import requests

    resp = requests.get(f"{trip_base_url.rstrip('/')}/trips/unknown/unknown")
    assert resp.status_code in (401, 403)


def test_create_tenant_customer_fleet(provisioned_resources):
    assert provisioned_resources["ids"]["tenant_id"]


def test_vehicle_and_vin_registry(provisioned_resources):
    assert provisioned_resources["vin"]


def test_driver_assignment(provisioned_resources):
    assert provisioned_resources["ids"]["driver_id"]


def test_get_and_list_resources(fleet_client, provisioned_resources):
    ids = provisioned_resources["ids"]
    vin = provisioned_resources["vin"]

    resp = fleet_client.request_with_retry("GET", f"/tenants/{ids['tenant_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/customers/{ids['customer_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/fleets/{ids['fleet_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/vehicles/{vin}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/drivers/{ids['driver_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/customers?tenantId={ids['tenant_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/fleets?tenantId={ids['tenant_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/vehicles?tenantId={ids['tenant_id']}&fleetId={ids['fleet_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/drivers?tenantId={ids['tenant_id']}&fleetId={ids['fleet_id']}")
    assert resp.status_code == 200, dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/vin-registry/{vin}")
    assert resp.status_code in (200, 404), dump_response(resp)

    resp = fleet_client.request_with_retry("GET", f"/vin-registry?tenantId={ids['tenant_id']}&active=true")
    assert resp.status_code == 200, dump_response(resp)


def test_idempotency_replay(fleet_client, ids, idempotency_key):
    body = {
        "tenantId": ids["tenant_id"],
        "name": "Idempotent Tenant",
        "reason": "idempotency"
    }
    resp1 = fleet_client.request("POST", "/tenants", headers={"Idempotency-Key": idempotency_key}, json_body=body)
    resp2 = fleet_client.request("POST", "/tenants", headers={"Idempotency-Key": idempotency_key}, json_body=body)
    assert resp1.status_code == resp2.status_code
    if resp1.status_code in (200, 201):
        assert resp1.json() == resp2.json()


def test_vin_transfer(fleet_client, ids, test_vin, idempotency_key):
    transfer_body = {
        "vin": test_vin,
        "fromTenantId": ids["tenant_id"],
        "toTenantId": f"{ids['tenant_id']}-b",
        "toFleetId": f"{ids['fleet_id']}-b",
        "effectiveFrom": "2026-02-01T00:00:00Z",
        "reason": "transfer",
        "approvalRef": "APR-001"
    }
    resp = fleet_client.request("POST", "/vin-registry/transfer", headers={"Idempotency-Key": idempotency_key}, json_body=transfer_body)
    assert resp.status_code in (200, 201, 409, 404), dump_response(resp)


def test_unauthorized_vin_returns_403(trip_client, forbidden_vin):
    if not forbidden_vin:
        import pytest
        pytest.skip("ONPOINT_FORBIDDEN_VIN not set")
    resp = trip_client.request_with_retry("GET", f"/trips/{forbidden_vin}/unknown")
    assert resp.status_code == 403, dump_response(resp)
    body = resp.json()
    assert "error" in body


def test_wrong_vin_negative_case(trip_client, ids):
    resp = trip_client.request_with_retry("GET", f"/trips/INVALIDVIN00000000/unknown")
    assert resp.status_code in (403, 404), dump_response(resp)
