# OnPoint Settings Feature — Authoritative Requirements

## 1. Document Control
- **Feature**: Hierarchical Settings Management (Tenant, Fleet, User)
- **Product**: OnPoint Telematics Fleet Management
- **Status**: Authoritative baseline for implementation
- **Version**: 1.0
- **Date**: 2026-02-22

---

## 2. Objective
Implement a standards-aligned settings framework for telematics operations that supports:
- Tenant-level policy control
- Fleet-level operational overrides
- User-level personalization
- Deterministic effective-value resolution
- Auditability, security, and compliance readiness

This feature must reduce hardcoded behavior across services and make policy decisions data-driven.

---

## 3. Scope
### In Scope (v1)
1. Hierarchical settings model (`tenant`, `fleet`, `user`)
2. Inheritance with override
3. Resolved settings read API (with source attribution)
4. CRUD APIs for each scope
5. Validation, RBAC, audit trail, and change history
6. Integration with existing telematics/trip/alert pipelines
7. UI screens for managing settings at each scope

### Out of Scope (v1)
1. Third-party policy marketplace
2. End-user scripting/rules engine
3. Multi-region active-active writes

---

## 4. Hierarchy and Resolution
### 4.1 Precedence Order
Effective value resolution must follow:
1. `user` override
2. `fleet` override
3. `tenant` default
4. `system` default

### 4.2 Inheritance Behavior
- All settings are inheritable unless marked `locked`.
- `lockedAtTenant=true` prevents fleet/user override.
- If a value is absent at a scope, resolver must continue upward.

### 4.3 Resolver Contract
Every resolved response must include:
- `effectiveValue`
- `effectiveScope` (`system|tenant|fleet|user`)
- `inheritedFrom` chain
- `lastUpdatedAt`, `lastUpdatedBy`

---

## 5. Settings Domains (Industry-Standard Telematics)
### 5.1 Safety and Driving Behavior
- Overspeed thresholds (`standardMph`, `severeMph`)
- Harsh events sensitivity (`acceleration`, `braking`, `cornering`)
- Event debouncing/noise thresholds

### 5.2 Driver Scoring
- Score weights (speeding, harsh events, idling, seatbelt if available)
- Score band definitions (`excellent/good/fair/poor`)
- Penalty windows and normalization periods

### 5.3 Geofencing
- Entry/exit notification toggles
- Dwell-time thresholds
- Geofence alert severity mapping

### 5.4 Fuel / EV / Idling
- Idle threshold seconds
- Fuel anomaly sensitivity
- Refuel detection thresholds
- EV SOC low threshold
- EV range warning threshold

### 5.5 Maintenance / Diagnostics
- Service intervals (`miles`, `days`, `engineHours`)
- DTC severity policy mapping
- Maintenance alert cadence

### 5.6 Notifications
- Channel policy (`inApp`, `email`, `sms`, `webhook`)
- Quiet hours
- Escalation and retry policy

### 5.7 Data Privacy and Retention
- Retention duration by dataset category
- PII masking rules
- Location precision for non-admin roles

### 5.8 UX Preferences
- Unit system (`imperial|metric`)
- Timezone and date format
- Map defaults

---

## 6. Configuration Metadata Model
Each setting key must define metadata:
- `key` (stable identifier)
- `type` (`boolean|integer|number|string|enum|json`)
- `allowedValues` or numeric `min/max`
- `defaultValue` (system)
- `category`
- `description`
- `isSensitive`
- `lockedAtTenantAllowed`
- `requiresRestart` (if any service cache invalidation applies)

Validation must reject malformed or out-of-range values.

---

## 7. Data Model Requirements
### 7.1 Logical Entities
1. `SettingDefinition`
2. `SettingValue` (scoped value)
3. `SettingAuditEvent`
4. `ResolvedSettingCache` (optional optimization)

### 7.2 SettingValue Required Fields
- `scopeType` (`tenant|fleet|user`)
- `scopeId`
- `settingKey`
- `value`
- `valueType`
- `locked` (for tenant scope)
- `updatedAt`
- `updatedBy`
- `version`
- `effectiveFrom` (optional)

### 7.3 Audit Event Required Fields
- `eventId`
- `settingKey`
- `scopeType/scopeId`
- `oldValue`, `newValue`
- `changedBy`
- `changedAt`
- `reason`
- `requestId`

---

## 8. API Requirements
### 8.1 Management APIs
1. `GET /settings/definitions`
2. `GET /settings/{scopeType}/{scopeId}`
3. `PUT /settings/{scopeType}/{scopeId}/{settingKey}`
4. `DELETE /settings/{scopeType}/{scopeId}/{settingKey}` (remove override)
5. `POST /settings/bulk` (bulk set)
6. `GET /settings/audit` (filterable)

### 8.2 Resolver APIs
1. `GET /settings/resolved?tenantId=...&fleetId=...&userId=...`
2. `GET /settings/resolved/{settingKey}?tenantId=...&fleetId=...&userId=...`

Resolver responses must include `effectiveScope` and provenance metadata.

### 8.3 Error Handling
- `400` validation errors
- `403` unauthorized scope write/read
- `404` unknown key/scope
- `409` optimistic concurrency/version conflict

---

## 9. Authorization and Access Control
### 9.1 Role Matrix
- **Platform Admin**: full access across tenants
- **Tenant Admin**: manage tenant + fleets + tenant users
- **Fleet Manager**: manage assigned fleet settings; cannot edit tenant lock flags
- **User**: read resolved settings; update only whitelisted personal preferences

### 9.2 Guardrails
- Enforce tenant boundary on every request
- Prevent cross-tenant scope references
- Enforce lock semantics server-side

---

## 10. Runtime and Consistency Requirements
1. Writes must be strongly consistent per setting key.
2. Effective settings reads should be near real-time.
3. If caching is used, TTL must be short and invalidated on write.
4. Change propagation to dependent services must occur via event notification or pull-refresh.

---

## 11. Integration Requirements
The following modules must consume resolved settings, not hardcoded constants:
1. Telematics ingestion normalization and event classification
2. Trip summary builder and score computation
3. Alerting and notifications
4. Geofence processing
5. Dashboard and trip-history UI display logic

---

## 12. Security, Privacy, Compliance
1. Encrypt data in transit and at rest
2. Protect sensitive values in logs and API responses
3. Audit trail must be immutable and queryable
4. Data retention policies must be enforceable by configuration
5. Support compliance evidence export (audit + policy snapshots)

---

## 13. Non-Functional Requirements
- **Availability**: Resolver API target 99.9%
- **Latency**: p95 resolved-read < 150ms (single-key), < 300ms (full-profile)
- **Scalability**: support high read ratio and burst writes during policy rollout
- **Observability**: metrics for hit/miss, override depth, validation failures, auth rejects

---

## 14. UI/UX Requirements
### 14.1 Pages
1. Tenant Settings
2. Fleet Settings
3. User Preferences
4. Settings Audit History

### 14.2 UX Rules
- Show inherited value and source scope
- Show override indicator and lock badge
- Provide “reset to inherited” action
- Require reason/comment for policy changes

---

## 15. Migration and Rollout Plan
1. Seed `SettingDefinition` with system defaults
2. Backfill tenant defaults from current environment constants
3. Enable resolver in read-only shadow mode
4. Compare old vs new behavior via telemetry counters
5. Progressive cutover by module
6. Finalize with hardcoded fallback removal

---

## 16. Testing Requirements
1. Unit tests for resolver precedence and lock behavior
2. Contract tests for all settings APIs
3. Cross-scope authorization tests
4. Integration tests for trip summary/safety/alerts consuming settings
5. Backward-compatibility tests for unset values
6. Performance tests for resolver under load

---

## 17. Acceptance Criteria
1. Effective value resolution matches precedence in all tested combinations
2. Locked tenant settings cannot be overridden below tenant scope
3. Audit logs capture all changes with before/after and actor metadata
4. Trip/alert pipelines consume resolver values in production path
5. UI clearly displays inherited vs overridden values
6. No regression in existing telematics workflows

---

## 18. Implementation Deliverables
1. Data model and persistence schema
2. Settings management and resolver APIs
3. RBAC enforcement and audit logging
4. UI pages and workflows for all scopes
5. Migration scripts and rollout playbook
6. Test suites and operational dashboards

---

## 19. Decision Record (Fixed for v1)
- Precedence: `user > fleet > tenant > system`
- Inheritance and override: enabled
- Tenant lock capability: enabled
- Resolver API with provenance: mandatory
- Full audit trail: mandatory
- Domains included: safety, scoring, geofence, fuel/EV/idling, maintenance, notifications, privacy, UX
- Delivery depth: comprehensive (product + technical requirements)
