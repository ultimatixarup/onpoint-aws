from datetime import datetime, timedelta, timezone
from pathlib import Path

from .helpers import add_common_to_path, load_lambda_module


def _load_module():
    add_common_to_path()
    module_path = Path(__file__).resolve().parents[1] / "lambdas" / "geofence_processor" / "app.py"
    return load_lambda_module("geofence_processor", module_path)


def test_point_in_polygon():
    mod = _load_module()
    square = [[0.0, 0.0], [0.0, 1.0], [1.0, 1.0], [1.0, 0.0]]
    assert mod._point_in_polygon((0.5, 0.5), square) is True
    assert mod._point_in_polygon((1.5, 0.5), square) is False


def test_haversine_distance():
    mod = _load_module()
    dist = mod._haversine_meters(0.0, 0.0, 0.0, 1.0)
    assert 110000 <= dist <= 112500


def test_assignment_inheritance_override_exclusion():
    mod = _load_module()

    def fake_load_assignments(_tenant_id):
        return [
            {"geofenceId": "g1", "scopeType": "TENANT"},
            {"geofenceId": "g1", "scopeType": "FLEET", "scopeId": "fleet-1", "exclude": True},
            {"geofenceId": "g2", "scopeType": "CUSTOMER", "scopeId": "cust-1"},
            {"geofenceId": "g3", "scopeType": "VIN", "scopeId": "VIN123"},
        ]

    mod._load_assignments = fake_load_assignments
    resolved = mod._resolve_geofences("tenant-1", "VIN123", "cust-1", "fleet-1")

    assert resolved["g1"]["exclude"] is True
    assert resolved["g2"]["scopeType"] == "CUSTOMER"
    assert resolved["g3"]["scopeType"] == "VIN"


def test_debounce_and_dwell_logic():
    mod = _load_module()

    state_store = {}

    def get_state(vin, geofence_id):
        return state_store.get((vin, geofence_id))

    def put_state(item):
        state_store[(item["vin"], item["geofenceId"])] = item

    mod._get_state = get_state
    mod._put_state = put_state

    geofence = {
        "geofenceId": "g1",
        "type": "CIRCLE",
        "version": 1,
        "geometry": {"center": [0.0, 0.0], "radiusMeters": 1000},
        "debounceSeconds": 0,
        "dwellSeconds": 1,
    }

    now = datetime.now(timezone.utc)
    events = mod._evaluate_state(geofence, "VIN123", "tenant-1", now, 0.0, 0.0, 10, 90, None)
    assert any(evt["eventType"] == mod.EVENT_ENTER for evt in events)

    later = now + timedelta(seconds=2)
    events = mod._evaluate_state(geofence, "VIN123", "tenant-1", later, 0.0, 0.0, 10, 90, None)
    assert any(evt["eventType"] == mod.EVENT_DWELL_START for evt in events)
