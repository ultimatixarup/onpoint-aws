from .helpers.client import dump_response


def test_health(trip_client, env_vin, env_trip_id):
    resp = trip_client.request_with_retry("GET", f"/trips/{env_vin}/{env_trip_id}")
    assert resp.status_code in (200, 403, 404), dump_response(resp)
    if resp.status_code == 403:
        body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        message = body.get("message") or body.get("error")
        assert message != "Missing Authentication Token", dump_response(resp)
