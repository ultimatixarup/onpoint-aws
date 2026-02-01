#!/usr/bin/env python3
"""Interactive CLI to generate tenancy test data from template.

Creates a filled JSON file from documentation/test-data/tenancy-setup.template.json
using interactive prompts.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_PATH = ROOT / "documentation" / "test-data" / "tenancy-setup.template.json"


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _prompt(label: str, default: str | None = None) -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{label}{suffix}: ").strip()
    return value or (default or "")


def main() -> int:
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")

    now = _now_iso()
    tenant_id = _prompt("Tenant ID", "tenant-001")
    tenant_name = _prompt("Tenant name", "Tenant Org")
    customer_id = _prompt("Customer ID", f"{tenant_id}-customer")
    fleet_id = _prompt("Fleet ID", f"{tenant_id}-fleet")
    fleet_name = _prompt("Fleet name", f"{tenant_name} Fleet")
    vin_prefix = _prompt("VIN prefix (base 11 chars)", "TESTVIN0000")
    driver_prefix = _prompt("Driver ID prefix", f"{tenant_id}-driver")
    driver_name_1 = _prompt("Driver name 1", "Driver One")
    driver_name_2 = _prompt("Driver name 2", "Driver Two")
    driver_name_3 = _prompt("Driver name 3", "Driver Three")
    effective_from = _prompt("VIN effectiveFrom (UTC ISO)", now)
    assignment_effective_from = _prompt("Assignment effectiveFrom (UTC ISO)", now)

    output_default = ROOT / "documentation" / "test-data" / f"tenancy-setup.{tenant_id}.json"
    output_path = Path(_prompt("Output file", str(output_default)))

    template = TEMPLATE_PATH.read_text()
    replacements = {
        "<TENANT_ID>": tenant_id,
        "<TENANT_NAME>": tenant_name,
        "<CUSTOMER_ID>": customer_id,
        "<FLEET_ID>": fleet_id,
        "<FLEET_NAME>": fleet_name,
        "<VIN_PREFIX>": vin_prefix,
        "<DRIVER_ID_PREFIX>": driver_prefix,
        "<DRIVER_NAME_1>": driver_name_1,
        "<DRIVER_NAME_2>": driver_name_2,
        "<DRIVER_NAME_3>": driver_name_3,
        "<EFFECTIVE_FROM_ISO_UTC>": effective_from,
        "<ASSIGNMENT_EFFECTIVE_FROM_ISO_UTC>": assignment_effective_from,
    }

    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)

    # Validate JSON after replacement
    data = json.loads(template)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, indent=2) + "\n")

    print(f"Wrote: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
