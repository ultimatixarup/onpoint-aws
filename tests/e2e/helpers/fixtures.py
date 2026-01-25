import os
import time
import uuid
from typing import Dict, Optional


def load_env_file(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def optional_env(name: str) -> Optional[str]:
    value = os.getenv(name)
    return value if value else None


def unique_suffix() -> str:
    return f"{int(time.time())}-{uuid.uuid4().hex[:6]}"


def make_vin(prefix: str = "E2EVIN") -> str:
    suffix = uuid.uuid4().hex[:11].upper()
    return f"{prefix}{suffix}"[:17]


def make_ids() -> Dict[str, str]:
    suffix = unique_suffix()
    return {
        "tenant_id": f"e2e-tenant-{suffix}",
        "customer_id": f"e2e-customer-{suffix}",
        "fleet_id": f"e2e-fleet-{suffix}",
        "driver_id": f"e2e-driver-{suffix}",
    }
