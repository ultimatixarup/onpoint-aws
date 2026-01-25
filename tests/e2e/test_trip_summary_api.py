from .helpers.client import dump_response


def test_trip_summary_by_vin_trip(trip_client, env_vin, env_trip_id):
    resp = trip_client.request_with_retry("GET", f"/trips/{env_vin}/{env_trip_id}")
    assert resp.status_code in (200, 403), dump_response(resp)
    if resp.status_code == 403:
        body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        message = body.get("message") or body.get("error")
        assert message != "Missing Authentication Token", dump_response(resp)
        return
    body = resp.json()
    assert body.get("vin") == env_vin
    assert body.get("tripId") == env_trip_id
    assert body.get("schemaVersion")


def test_trip_events_pagination(trip_client, env_vin, env_trip_id):
    resp = trip_client.request_with_retry(
        "GET",
        f"/trips/{env_vin}/{env_trip_id}/events",
        params={"limit": 1},
    )
    assert resp.status_code in (200, 403), dump_response(resp)
    if resp.status_code == 403:
        body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        message = body.get("message") or body.get("error")
        assert message != "Missing Authentication Token", dump_response(resp)
        return
    body = resp.json()
    assert body.get("vin") == env_vin
    assert body.get("tripId") == env_trip_id
    assert isinstance(body.get("items"), list)
    if body.get("items"):
        first = body["items"][0]
        assert "raw" in first
        if len(body["items"]) > 1:
            times = [it.get("eventTime") for it in body["items"] if it.get("eventTime")]
            assert times == sorted(times)
    next_token = body.get("nextToken")
    if next_token:
        assert isinstance(next_token, str)
        resp2 = trip_client.request_with_retry(
            "GET",
            f"/trips/{env_vin}/{env_trip_id}/events",
            params={"limit": 1, "nextToken": next_token},
        )
        assert resp2.status_code == 200, dump_response(resp2)
        body2 = resp2.json()
        assert isinstance(body2.get("items"), list)


def test_vehicle_latest_state(trip_client, env_vin):
    resp = trip_client.request_with_retry("GET", f"/vehicles/{env_vin}/latest-state")
    assert resp.status_code in (200, 403, 404), dump_response(resp)
    if resp.status_code == 403:
        body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        message = body.get("message") or body.get("error")
        assert message != "Missing Authentication Token", dump_response(resp)


def test_fleet_trips(trip_client, provisioned_resources):
    fleet_id = provisioned_resources["ids"]["fleet_id"]
    tenant_id = provisioned_resources["ids"]["tenant_id"]
    resp = trip_client.request_with_retry(
        "GET",
        f"/fleets/{fleet_id}/trips",
        params={"limit": 5},
        headers={"x-tenant-id": tenant_id},
    )
    assert resp.status_code == 200, dump_response(resp)
