from .helpers import add_common_to_path

add_common_to_path()

from onpoint_common.settings_cache import EffectiveSettingsCache


def test_effective_settings_cache_hit_and_refresh():
    calls = {"count": 0}

    def loader(tenant_id, fleet_id):
        calls["count"] += 1
        return {"tenantId": tenant_id, "fleetId": fleet_id, "version": calls["count"]}

    cache = EffectiveSettingsCache(loader=loader, ttl_seconds=60)

    first = cache.get("tenant-1", "fleet-1")
    second = cache.get("tenant-1", "fleet-1")

    assert first["version"] == 1
    assert second["version"] == 1
    assert calls["count"] == 1
    assert cache.hits == 1
    assert cache.misses == 1

    cache.invalidate("tenant-1", "fleet-1")
    third = cache.get("tenant-1", "fleet-1")

    assert third["version"] == 2
    assert calls["count"] == 2
