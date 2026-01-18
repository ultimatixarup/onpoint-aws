from __future__ import annotations

from datetime import datetime, timezone


def utc_now_iso() -> str:
    """UTC now as ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()
