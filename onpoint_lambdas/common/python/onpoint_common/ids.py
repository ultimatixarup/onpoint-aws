import uuid
from typing import Any, Dict, Optional


def new_uuid() -> str:
    return str(uuid.uuid4())


def get_upstream_message_id(payload: Dict[str, Any]) -> Optional[str]:
    v = payload.get("cx_msg_id") or payload.get("messageId") or payload.get("trace_id")
    if isinstance(v, str) and v.strip():
        return v.strip()
    return None


def safe_trace_id(payload: Dict[str, Any], fallback: str = "no-trace-id") -> str:
    v = get_upstream_message_id(payload)
    return v if v else fallback
