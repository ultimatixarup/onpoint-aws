# TenantFleetIndex staged deployment

This repo uses a staged deployment for the VIN Registry GSI `TenantFleetIndex` to avoid DynamoDB’s single‑GSI‑per‑update limitation.

## Step A — baseline (no new GSI)
1) Deploy with the default parameter (no GSI creation):
   - `EnableTenantFleetIndex=false` (default)

If using the helper script:
- `ENABLE_TENANT_FLEET_INDEX=false ./scripts/deploy_stack.sh onpoint-dev-cfn-artifacts`

## Step B — add TenantFleetIndex only
1) Re‑deploy with the flag enabled:
   - `EnableTenantFleetIndex=true`

If using the helper script:
- `ENABLE_TENANT_FLEET_INDEX=true ./scripts/deploy_stack.sh onpoint-dev-cfn-artifacts`

This update **only** adds the `TenantFleetIndex` to the VIN Registry table.

## Backfill (required for existing data)
After Step B completes, backfill existing VIN registry items to set `GSI2PK`/`GSI2SK`:

```
/Users/arupbanerjee/Downloads/onpoint-aws/.venv/bin/python scripts/backfill_vin_registry_tenant_fleet_index.py \
  --table onpoint-dev-vin-registry \
  --region us-east-1
```

Dry‑run:
```
/Users/arupbanerjee/Downloads/onpoint-aws/.venv/bin/python scripts/backfill_vin_registry_tenant_fleet_index.py \
  --table onpoint-dev-vin-registry \
  --region us-east-1 \
  --dry-run
```

## Verify
- Fleet queries use `TenantFleetIndex` when `VIN_TENANT_FLEET_INDEX` is set.
- CloudFormation outputs should include the updated VIN Registry table.
