from datetime import datetime, timezone

import boto3
from boto3.dynamodb.types import TypeSerializer

from .helpers import add_common_to_path


def _load():
    add_common_to_path()
    from onpoint_common.vin_registry import resolve_vin_registry
    return resolve_vin_registry


def test_resolve_vin_registry_uses_effective_dates(monkeypatch):
    serializer = TypeSerializer()

    def item(record):
        return {k: serializer.serialize(v) for k, v in record.items()}

    older = {
        "PK": "VIN#VIN123",
        "SK": "EFFECTIVE_FROM#2025-01-01T00:00:00+00:00",
        "vin": "VIN123",
        "tenantId": "tenant-old",
        "effectiveFrom": "2025-01-01T00:00:00+00:00",
        "effectiveTo": "2025-12-31T23:59:59+00:00",
    }
    current = {
        "PK": "VIN#VIN123",
        "SK": "EFFECTIVE_FROM#2026-01-01T00:00:00+00:00",
        "vin": "VIN123",
        "tenantId": "tenant-new",
        "effectiveFrom": "2026-01-01T00:00:00+00:00",
    }

    def fake_client(service_name):
        class Client:
            def query(self, **kwargs):
                return {"Items": [item(current), item(older)], "LastEvaluatedKey": None}
        return Client()

    monkeypatch.setattr(boto3, "client", fake_client)

    resolve_vin_registry = _load()
    as_of = datetime(2026, 1, 2, tzinfo=timezone.utc).isoformat()
    record = resolve_vin_registry("VIN123", as_of=as_of, table_name="vin-registry")
    assert record["tenantId"] == "tenant-new"
