import time
from typing import Any, Callable, Dict, Optional, Tuple


class EffectiveSettingsCache:
    """Simple in-memory cache for effective settings with TTL."""

    def __init__(self, loader: Callable[[str, Optional[str]], Dict[str, Any]], ttl_seconds: int = 60):
        self._loader = loader
        self._ttl_seconds = max(1, int(ttl_seconds))
        self._store: Dict[Tuple[str, Optional[str]], Tuple[float, Dict[str, Any]]] = {}
        self.hits = 0
        self.misses = 0
        self.refreshes = 0

    def _cache_key(self, tenant_id: str, fleet_id: Optional[str]) -> Tuple[str, Optional[str]]:
        return tenant_id, fleet_id or None

    def get(self, tenant_id: str, fleet_id: Optional[str] = None) -> Dict[str, Any]:
        key = self._cache_key(tenant_id, fleet_id)
        now = time.monotonic()
        cached = self._store.get(key)
        if cached and (now - cached[0]) < self._ttl_seconds:
            self.hits += 1
            return cached[1]

        self.misses += 1
        value = self._loader(tenant_id, fleet_id)
        self._store[key] = (now, value)
        self.refreshes += 1
        return value

    def invalidate(self, tenant_id: str, fleet_id: Optional[str] = None) -> None:
        self._store.pop(self._cache_key(tenant_id, fleet_id), None)

    def clear(self) -> None:
        self._store.clear()
