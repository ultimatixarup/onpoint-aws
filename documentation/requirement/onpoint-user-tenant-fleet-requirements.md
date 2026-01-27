# OnPoint User, Tenant & Fleet Management Requirements (AWS Serverless)

## 1. Purpose
This document defines authoritative product and technical requirements for **user management, tenant management, and fleet-domain entities** for the OnPoint telematics platform, implemented using AWS-native serverless services with cost efficiency in early product stages.

---

## 2. Core Principles
- AWS-native serverless first: Cognito, API Gateway, Lambda, DynamoDB.
- No always-on infrastructure.
- VIN is the only authoritative upstream vehicle identity.
- Tenant, customer, and fleet are **derived internally** (late binding).
- Raw telemetry data is immutable.
- Authorization failures return **403**, never 404.
- Do not trust client-supplied tenant headers.

---

## 3. Identity & Authentication

### 3.1 Identity Provider
- Amazon Cognito User Pool is the system of record for:
  - Users
  - Passwords
  - MFA (optional)
  - Account recovery
- API Gateway JWT Authorizer validates tokens.

### 3.2 User Attributes
Each user MUST have:
- `sub` (Cognito subject)
- `email`
- `custom:tenantId` (required for tenant users)

---

## 4. Roles & RBAC (Cognito Groups)

Defined groups:
- PlatformAdmin (OnPoint internal)
- TenantAdmin
- FleetManager
- Dispatcher
- ReadOnly

Rules:
- PlatformAdmin can access all tenants.
- TenantAdmin manages users and fleets within their tenant.
- FleetManager manages vehicles/drivers/fleets.
- Dispatcher operational access.
- ReadOnly read-only access.

All Lambdas MUST enforce group membership.

---

## 5. Tenant & Fleet Domain Model

### 5.1 Entities
- Tenant
- Customer (optional sub-tenant)
- Fleet
- Vehicle (VIN-based)
- Driver
- DriverAssignment

Each entity is stored in DynamoDB using PK/SK patterns.

### 5.2 VIN Registry (System of Record)
Maps:
- VIN → TenantId
- VIN → CustomerId (optional)
- VIN → FleetId
- EffectiveFrom / EffectiveTo

Supports reassignment with historical integrity.

---

## 6. User Lifecycle

### 6.1 Tenant Creation (PlatformAdmin)
1. Create Tenant record.
2. Create initial TenantAdmin in Cognito.
3. Assign `custom:tenantId`.
4. Add to TenantAdmin group.

### 6.2 Tenant User Creation (TenantAdmin)
- AdminCreateUser in Cognito.
- Set `custom:tenantId`.
- Add to role groups.
- Send invite / temporary password.

### 6.3 Password Management
Handled by Cognito:
- Forgot password
- Reset
- MFA (optional)

### 6.4 Disable / Enable
TenantAdmin may disable/enable users via Cognito Admin APIs.

---

## 7. Authorization Rules

### 7.1 Tenant Isolation
- Every request derives tenant from JWT + VIN Registry.
- If VIN resolves to a different tenant → 403.

### 7.2 VIN Access
For VIN-based APIs:
1. Resolve VIN via VinRegistry.
2. Compare to caller tenant.
3. Deny if mismatch.

---

## 8. Required APIs

### Platform (PlatformAdmin only)
- POST /platform/tenants
- POST /platform/tenants/{tenantId}/admins

### Tenant Admin
- POST /tenants/{tenantId}/users
- GET /tenants/{tenantId}/users
- PUT /tenants/{tenantId}/users/{userId}/roles
- POST /tenants/{tenantId}/users/{userId}/disable
- POST /tenants/{tenantId}/users/{userId}/enable

### Fleet Domain
- CRUD tenants/customers/fleets/vehicles/drivers
- VIN assignment & transfer
- Driver assignment

### Telematics
- GET /trips/{vin}/{tripId}
- GET /trips/{vin}/{tripId}/events
- GET /vehicles/{vin}/state

All VIN APIs enforce registry ownership.

---

## 9. Audit & Compliance

All administrative actions MUST write immutable records to AuditLogTable:
- actorSub
- actorTenantId
- action
- target
- timestamp
- requestId

Raw telemetry must support legal hold and replay.

---

## 10. Testing Requirements

### Unit Tests
- RBAC allow/deny
- Tenant mismatch
- VIN access enforcement
- Reassignment edge cases

### Integration Tests
- Cross-tenant isolation
- User lifecycle
- VIN reassignment replay
- Fleet filtering

---

## 11. Non-Goals
- Trusting upstream tenant/fleet identifiers
- Hard-binding tenant during ingestion
- Mutating raw telemetry

---

## 12. Acceptance Criteria
- TenantAdmin can manage users without AWS console.
- Unauthorized VIN access returns 403.
- All admin actions are auditable.
- System runs fully serverless.
- Cost scales with usage.

---

## 13. Summary
- VIN is king.
- Tenancy is derived.
- Raw data is immutable.
- Cognito provides identity.
- DynamoDB provides state.
- Lambda enforces authorization.
