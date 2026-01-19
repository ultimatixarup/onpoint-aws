import json
from typing import Any, Dict, Optional


def validate_max_bytes(body: str, max_bytes: int) -> None:
    if len(body.encode("utf-8")) > max_bytes:
        raise ValueError(f"Body too large: > {max_bytes} bytes")


def require_json_object(body: str) -> Dict[str, Any]:
    obj = json.loads(body)
    if not isinstance(obj, dict):
        raise ValueError("Payload must be a JSON object")
    return obj


def require_str(obj: Dict[str, Any], field: str, *, allow_empty: bool = False) -> str:
    v = obj.get(field)
    if not isinstance(v, str):
        raise ValueError(f"Missing/invalid '{field}'")
    v = v.strip()
    if not allow_empty and not v:
        raise ValueError(f"'{field}' must not be empty")
    return v


def optional_str(obj: Dict[str, Any], field: str) -> Optional[str]:
    v = obj.get(field)
    if isinstance(v, str) and v.strip():
        return v.strip()
    return None


def clamp_int(value: Optional[str], lo: int, hi: int, default: int) -> int:
    try:
        v = int(value) if value is not None else default
    except Exception:
        v = default
    return max(lo, min(hi, v))
