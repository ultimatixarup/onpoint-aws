#!/usr/bin/env python3
"""Apply tenancy setup JSON file to the Fleet Tenancy API."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import requests

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "documentation" / "test-data" / "tenancy-setup.sd-humane.json"
ENV_PATH = ROOT / "postman" / "onpoint-dev.postman_environment.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _load_env() -> Dict[str, str]:
    env = json.loads(ENV_PATH.read_text())
    return {v["key"]: v["value"] for v in env.get("values", [])}


def _call(session: requests.Session, base_url: str, method: str, path: str, headers: Dict[str, str], body: Any | None = None) -> requests.Response:
    url = base_url.rstrip("/") + path
    resp = session.request(method, url, headers=headers, json=body, timeout=20)
    try:
        payload = resp.json()
    except Exception:
        payload = resp.text
    print(f"{method} {path} -> {resp.status_code}")
    if resp.status_code >= 400:
        print(payload)
    return resp


def main() -> int:
    env = _load_env()
    base_url = env.get("fleetTenancyBaseUrl")
    api_key = env.get("fleetTenancyApiKey")
    if not base_url or not api_key:
        raise SystemExit("Missing fleetTenancyBaseUrl or fleetTenancyApiKey in Postman env")

    data_path = DEFAULT_DATA
    data = json.loads(data_path.read_text())

    session = requests.Session()
    now = _now_iso()

    admin_headers = {
        "x-api-key": api_key,
        "x-role": "admin",
        "Content-Type": "application/json",
    }

    tenant_admin_headers = {
        "x-api-key": api_key,
        "x-role": "tenant-admin",
        "x-tenant-id": data["tenant"]["tenantId"],
        "Content-Type": "application/json",
    }

    # tenant, customer, fleet
    _call(session, base_url, "POST", "/tenants", admin_headers, data["tenant"])
    _call(session, base_url, "POST", "/customers", admin_headers, data["customer"])
    _call(session, base_url, "POST", "/fleets", admin_headers, data["fleet"])

    # vehicle metadata
    for v in data.get("vehicles", []):
        vehicle_body = {
            "vin": v["vin"],
            "make": "Test",
            "model": "Truck",
            "year": 2023,
            "reason": v.get("reason", "seed"),
        }
        _call(session, base_url, "POST", "/vehicles", admin_headers, vehicle_body)

    # VIN registry assignment (requires idempotency key)
    for i, v in enumerate(data.get("vehicles", []), start=1):
        headers = {
            **admin_headers,
            "Idempotency-Key": f"{now}-vin-assign-{i}",
        }
        _call(session, base_url, "POST", "/vin-registry/assign", headers, v)

    # drivers
    for d in data.get("drivers", []):
        _call(session, base_url, "POST", "/drivers", admin_headers, d)

    # driver assignments (requires idempotency key)
    for i, a in enumerate(data.get("driverAssignments", []), start=1):
        headers = {
            **tenant_admin_headers,
            "Idempotency-Key": f"{now}-driver-assign-{i}",
        }
        driver_id = a["driverId"]
        body = {
            "tenantId": data["tenant"]["tenantId"],
            "vin": a["vin"],
            "effectiveFrom": a["effectiveFrom"],
            "assignmentType": a.get("assignmentType", "PRIMARY"),
            "reason": a.get("reason", "seed assignment"),
        }
        _call(session, base_url, "POST", f"/drivers/{driver_id}/assignments", headers, body)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
