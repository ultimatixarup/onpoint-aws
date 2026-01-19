"""Tenant key helpers.

These are string helpers only (no AWS calls).
Keep all partition key conventions in ONE place.
"""

from typing import Optional


def tenant_pk(customer_id: str) -> str:
    return f"TENANT#{customer_id}"


def customer_pk(customer_id: str) -> str:
    return tenant_pk(customer_id)


def fleet_pk(customer_id: str, fleet_id: str) -> str:
    return f"{tenant_pk(customer_id)}#FLEET#{fleet_id}"


def vehicle_pk(customer_id: str, vin: str) -> str:
    return f"{tenant_pk(customer_id)}#VEHICLE#{vin}"


def trip_pk(customer_id: str, vin: str, trip_id: str) -> str:
    return f"{vehicle_pk(customer_id, vin)}#TRIP#{trip_id}"


def normalize_customer_id(v: Optional[str]) -> Optional[str]:
    if isinstance(v, str) and v.strip():
        return v.strip()
    return None
