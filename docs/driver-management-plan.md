# Driver Management Implementation Plan

## Overview

Implement driver management per requirements while reusing existing fleet tenancy patterns (RBAC, tenant isolation, idempotency, audit) and the existing driver/assignment tables.

## Existing Assets Found

- Drivers and assignments already live in fleet tenancy API, plus tables in [cfn/nested/tables.yaml](../cfn/nested/tables.yaml).
- Idempotency and audit helpers exist in [onpoint_lambdas/lambdas/fleet_tenancy_api/app.py](../onpoint_lambdas/lambdas/fleet_tenancy_api/app.py).
- UI already has Drivers list and platform driver management pages, but no dashboard metrics or tenant-scoped routes.

## Data Model (DynamoDB)

- Drivers table: add GSI for tenant and optional fleet filtering.
  - GSI: TenantIndex (PK: tenantId, SK: driverId)
  - Optional GSI: TenantFleetIndex (PK: tenantId, SK: fleetId#driverId)
- Driver assignments table: keep current PK/SK; add GSI for driverId and effective date range query if needed.
- Driver metrics rollup table (optional, low cost):
  - Table: onpoint-${Env}-driver-metrics
  - PK: DRIVER#${driverId}, SK: DATE#YYYY-MM-DD
  - Attributes: tenantId, fleetId, totals, updatedAt
- Audit log already exists; continue writing for all mutations.

### Staged GSI Deployment Pattern

1. Deploy new table attributes + GSIs disabled in code paths.
2. Backfill GSI keys for existing items.
3. Enable queries in code for GSI usage.
   Document these steps in README.

## API Design (REST)

Add tenant-scoped routes in fleet tenancy API:

- /tenants/{tenantId}/drivers (POST/GET)
- /tenants/{tenantId}/drivers/{driverId} (GET/PATCH)
- /tenants/{tenantId}/drivers/{driverId}:activate and :deactivate
- /tenants/{tenantId}/drivers/{driverId}/assignments (POST/GET)
- /tenants/{tenantId}/drivers/{driverId}/dashboard + drilldowns

Ensure:

- RBAC enforced for PlatformAdmin, TenantAdmin, FleetManager, Dispatcher, ReadOnly.
- Tenant isolation returns 403 on unauthorized access.
- Idempotency-Key required for create and assignment operations.
- Audit log entries for all mutations.

## Metrics Strategy

- Prefer trip summary table where available for distance/time metrics.
- Fallback to telemetry events table if no trip summary exists.
- Attribute telemetry to drivers via effective-dated assignments.
- Compute KPIs and drilldowns (trips/events) on demand.
- Optional caching: write daily rollups to driver-metrics table with TTL.

## Lambda Changes

- Extend fleet_tenancy_api to include tenant-scoped driver endpoints and dashboard endpoints.
- Add IAM permissions for telemetry and trip summary tables as needed.
- Add env vars for telemetry/trip summary table names.

## UI Changes

- Add Driver Profile (details + assignments)
- Add Driver Create/Edit form
- Add Driver Dashboard (KPIs + drilldowns)
- Add assignments UI integrated with VIN registry and effective dates
- Keep tenant context switcher and fleet filters consistent with existing UX.

## Tests

- Unit tests: RBAC, tenant isolation, idempotency, assignment overlap validation, dashboard metrics calculations.
- E2E smoke: create tenant + driver, assign driver to VIN, call dashboard endpoints.

## Implementation Sequence

1. CFN + DynamoDB updates (tables, GSIs, env vars) + README deploy notes.
2. Lambda API changes (tenant-scoped routes + assignments + validation).
3. Metrics + drilldowns (telemetry/trip summary queries, optional rollups).
4. React pages (profile, dashboard, assignments).
5. Tests + docs updates.
