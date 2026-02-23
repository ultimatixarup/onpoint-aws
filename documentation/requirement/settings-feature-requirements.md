# OnPoint Settings Feature — Enterprise Specification (Version 2.1)

## 1. Document Control
- **Feature**: Hierarchical Settings Management (`tenant`, `fleet`, `user`)
- **Product**: OnPoint Telematics Fleet Management
- **Status**: Authoritative enterprise baseline for engineering, QA, SRE, Security, and Product
- **Version**: 2.1
- **Date**: 2026-02-22
- **Architecture Alignment**: AWS Serverless (API Gateway, Lambda, DynamoDB, EventBridge, CloudWatch)
- **Normative Language**: Keywords **MUST**, **SHOULD**, **MAY** are normative.

---

## 2. Architectural Review Findings (V1 Critique)
This section records key weaknesses identified in version 1.0 and the corresponding 2.0 hardening goals.

### 2.1 Missing Enterprise-Grade Elements in v1
1. No explicit idempotency contract for write APIs.
2. No production-safe concurrency protocol (e.g., `If-Match`/ETag + optimistic locking semantics).
3. No concrete DynamoDB partition/sort key design or hot-partition mitigation.
4. No explicit cache invalidation topology (local cache + distributed cache + event-driven invalidation).
5. No rate-limiting or abuse control requirements.
6. No feature-flag rollout controls for progressive activation.
7. No formal failure-mode behaviors (degraded mode, fallback policy, stale reads, poison events).

### 2.2 Ambiguous or Weak Requirement Areas in v1
1. Inheritance behavior lacked strict deterministic resolver algorithm details.
2. Lock semantics did not define governance boundaries (who can lock/unlock, break-glass behavior).
3. “Near real-time” was not measurable for propagation SLO.
4. Role model did not define token claims mapping and cross-tenant spoofing protections.
5. Migration plan lacked compatibility mode, rollback criteria, and data verification checkpoints.

### 2.3 Scalability / Multi-Tenancy / Operational Gaps in v1
1. No per-tenant throughput isolation strategy.
2. No mandatory tenant-aware keys in every persistence/API contract.
3. No statement on resolver cache cardinality limits.
4. No explicit SRE runbooks, alarms, or synthetic checks.

### 2.4 Security and Compliance Weaknesses in v1
1. Sensitive setting handling lacked field-level redaction and encryption guidance.
2. Audit integrity did not require append-only/immutable event chain semantics.
3. Retention and legal hold behavior for audit artifacts was underspecified.

### 2.5 Defect Risks Due to Implementation Ambiguity in v1
1. Different services could implement divergent resolver logic.
2. Parallel writes could silently overwrite each other.
3. Unclear idempotency could duplicate updates during client retries.
4. Undefined stale-cache behavior could produce policy drift.

---

## 3. Objective
Implement an enterprise-grade settings platform that provides deterministic, secure, and scalable policy control across tenant, fleet, and user scopes.

The settings platform **MUST**:
1. Centralize policy decisions now hardcoded in telematics services.
2. Provide deterministic resolver outputs with provenance metadata.
3. Guarantee strong tenant isolation in storage, API, and cache layers.
4. Support safe, auditable, and idempotent configuration changes at scale.

---

## 4. Scope
### 4.1 In Scope (v2)
1. Hierarchical model with inheritance and override.
2. Resolver APIs for single-key and effective-profile retrieval.
3. Management APIs with optimistic concurrency + idempotency.
4. Lock semantics, governance controls, and auditable change history.
5. AWS-native event-driven cache invalidation and downstream propagation.
6. Integration across trip, telemetry, geofencing, scoring, and alerting services.
7. UI workflows for tenant, fleet, user settings and audit explorer.

### 4.2 Out of Scope (v2)
1. Customer-authored scripting language for arbitrary policy logic.
2. Multi-region active-active write topology (single-region writer in v2).
3. External policy marketplace.

---

## 5. Canonical Hierarchy, Inheritance, and Resolver Semantics
### 5.1 Precedence and Determinism
Effective value **MUST** resolve in this exact order:
1. `user`
2. `fleet`
3. `tenant`
4. `system`

Resolver output for same inputs **MUST** be deterministic and side-effect free.

### 5.2 Scope Validation Rules
1. `user` scope resolution **MUST** include parent `tenantId`; optional `fleetId` allowed.
2. `fleet` scope resolution **MUST** include parent `tenantId`.
3. Any scope mismatch (e.g., user from tenant A with fleet from tenant B) **MUST** return `403`.

### 5.3 Lock Semantics
1. `lockedAtTenant=true` **MUST** block lower-scope writes.
2. Only `tenant_admin` (or higher) **MUST** be allowed to set/unset tenant locks.
3. Lock changes **MUST** emit audit events with reason and actor.

### 5.4 Effective Profile Contract
Every resolved setting entry **MUST** include:
- `settingKey`
- `effectiveValue`
- `effectiveScope` (`system|tenant|fleet|user`)
- `resolutionPath` (ordered scopes evaluated)
- `sourceVersion` (version number at effective scope)
- `resolvedAt`
- `isLocked`

---

## 6. Settings Domain Catalog (Telematics Industry Baseline)
### 6.1 Safety and Event Policies
- Overspeed thresholds (`standard`, `severe`) by unit system
- Harsh driving sensitivity and debounce windows
- Event noise suppression and minimum event duration

### 6.2 Driver Scoring and Coaching
- Weighted scoring model
- Grade bands and disciplinary thresholds
- Aggregation windows (daily/weekly/monthly)

### 6.3 Geofencing
- Entry/exit alert toggles
- Dwell threshold and grace windows
- Geofence severity classification

### 6.4 Fuel, EV, and Idling
- Idling threshold by vehicle class
- Fuel anomaly and refuel detection thresholds
- EV low-SOC and range warning thresholds

### 6.5 Maintenance and Diagnostics
- Service intervals (`miles`, `days`, `engineHours`)
- DTC severity routing and escalation windows

### 6.6 Notifications and Escalation
- Channel policy and fallback order
- Quiet hours and emergency bypass policy
- Retry/backoff model for webhook/SMS/email

### 6.7 Privacy, Retention, and Governance
- Dataset retention by data class
- PII masking and role-based visibility
- Location precision controls

### 6.8 UX and Localization
- Units (`imperial|metric`)
- Timezone and date display standards
- Map defaults and route rendering preferences

---

## 7. Configuration Metadata Model
Each `SettingDefinition` **MUST** include:
- `settingKey` (immutable)
- `category`, `displayName`, `description`
- `dataType` (`boolean|integer|number|string|enum|json`)
- Validation (`min|max|regex|allowedValues|jsonSchema`)
- `systemDefaultValue`
- `isSensitive`
- `supportsLock`
- `supportsFutureEffectiveFrom`
- `deprecationState` (`active|deprecated|removed`)
- `introducedVersion`

### 7.1 Setting Dependency Graph and Default Governance
1. Each `SettingDefinition` **MAY** declare dependencies via `dependsOn[]` and impact links via `affects[]`.
2. The platform **MUST** maintain an acyclic dependency graph for all active setting keys.
3. Any create/update that introduces a dependency cycle **MUST** be rejected with `400` and machine-readable cycle details.
4. Dependent recomputation order **MUST** be topological and deterministic.
5. System defaults **MUST** be versioned (`defaultVersion`) and immutable per version.
6. New default versions **MUST NOT** retroactively change effective tenant/fleet/user values unless an explicit migration operation is executed.
7. Default migration operations **MUST** support dry-run impact preview before apply.

Validation behavior:
1. Server-side validation is authoritative.
2. UI validation is advisory only.
3. Unknown keys **MUST** return `404`.

### 7.2 Cross-Setting Validation Engine
1. Validation **MUST** support policy constraints across keys, e.g.:
	- `safety.overspeed.standard < safety.overspeed.severe`
	- `fuel.refuel.threshold > fuel.noise.threshold`
	- `notification.quietHours.start != notification.quietHours.end`
2. Cross-setting validator **MUST** evaluate against the candidate post-change effective state, not just the submitted key.
3. Validation failures **MUST** return `400` with structured payload:
	- `errorCode`
	- `message`
	- `violations[]` with `settingKey`, `ruleId`, `actual`, `expected`, `scope`
4. Validation rules **MUST** be versioned and auditable.

---

## 8. Data Model and DynamoDB Design
### 8.1 Logical Entities
1. `SettingDefinition`
2. `SettingValue`
3. `SettingAuditEvent`
4. `IdempotencyRecord`
5. `ResolverCache` (optional, bounded)

### 8.2 DynamoDB Tables (Recommended)
1. `onpoint-settings-definitions`
2. `onpoint-settings-values`
3. `onpoint-settings-audit`
4. `onpoint-settings-idempotency`

### 8.3 Key Design (Values Table)
- **PK**: `TENANT#{tenantId}#SCOPE#{scopeType}#{scopeId}`
- **SK**: `SETTING#{settingKey}`
- Attributes: `value`, `version`, `locked`, `updatedAt`, `updatedBy`, `effectiveFrom`, `etag`

Design constraints:
1. All value rows **MUST** include `tenantId` for hard isolation.
2. Conditional writes **MUST** enforce optimistic concurrency (`version`/`etag`).
3. PartiQL full scans are prohibited in hot paths.

### 8.4 Audit Table Key Design
- **PK**: `TENANT#{tenantId}#SETTING#{settingKey}`
- **SK**: `TS#{iso8601}#REQ#{requestId}`
- Append-only; no update/delete in normal operations.

### 8.5 Audit Integrity and Immutability
1. Audit records **MUST** be append-only; update/delete APIs for audit data are prohibited.
2. Optional hash-chain integrity (`previousHash`, `entryHash`) **SHOULD** be supported for tamper evidence.
3. Audit export jobs **MUST** include integrity metadata when hash chaining is enabled.

### 8.6 Data Growth Controls and Scale Considerations
1. High-churn global keys **SHOULD** be sharded by optional suffix when needed.
2. Bulk updates **MUST** be chunked and rate-controlled.
3. Large tenant exports **MUST** use async job model.
4. Audit storage **MUST** support partition growth control via time-bucketing strategy (e.g., monthly `PK` suffix) when tenant volume crosses threshold.
5. Retention and archival **MUST** be configurable by tenant policy and compliance requirements.

---

## 9. API Specification Requirements
### 9.1 Management APIs
1. `GET /settings/definitions`
2. `GET /settings/{scopeType}/{scopeId}`
3. `PUT /settings/{scopeType}/{scopeId}/{settingKey}`
4. `DELETE /settings/{scopeType}/{scopeId}/{settingKey}`
5. `POST /settings/bulk`
6. `GET /settings/audit`
7. `POST /settings/snapshots/export`
8. `POST /settings/snapshots/import`
9. `POST /settings/snapshots/restore`
10. `POST /settings/impact-analysis`

### 9.2 Resolver APIs
1. `GET /settings/resolved/{settingKey}?tenantId=...&fleetId=...&userId=...`
2. `GET /settings/resolved/profile?tenantId=...&fleetId=...&userId=...`

### 9.3 API Idempotency
Write APIs (`PUT`, `DELETE`, `POST /bulk`) **MUST** support `Idempotency-Key` header:
1. Duplicate key + same payload returns previous success response.
2. Duplicate key + different payload returns `409`.
3. Idempotency retention window **MUST** be at least 24 hours.

### 9.4 Optimistic Concurrency
1. Writes **MUST** support `If-Match: <etag>`.
2. Missing or stale `If-Match` on guarded resources **MUST** return `412`.
3. Successful writes **MUST** return updated `etag` and `version`.

### 9.5 Error Model
- `400`: invalid payload/validation failure
- `401`: unauthenticated
- `403`: forbidden scope access
- `404`: unknown key/scope
- `409`: conflict (idempotency payload mismatch, lock conflict)
- `412`: precondition failed (`If-Match` mismatch)
- `429`: throttled
- `500`: internal error with stable error code

### 9.6 Blast-Radius Protection for Critical Safety Settings
1. Critical safety keys (e.g., overspeed, harsh-event thresholds) **MUST** support guarded update mode:
	- optional approval workflow flag
	- mandatory impact preview
	- optional scheduled `effectiveFrom`
2. Impact preview **MUST** include estimated counts of affected fleets, users, and dependent services.
3. For guarded keys, immediate apply **MAY** be blocked by policy requiring approval.

### 9.7 Configuration Snapshot, Export/Import, and Rollback
1. Snapshot export **MUST** produce a versioned, signed artifact containing scoped settings and metadata.
2. Import **MUST** support dry-run validation and conflict reporting.
3. Restore **MUST** be atomic at requested scope (tenant/fleet/user set) with rollback-on-failure behavior.
4. Snapshot operations **MUST** be fully audited.

---

## 10. Authorization, Tenant Isolation, and SaaS Boundary Controls
### 10.1 Role Matrix
- `platform_admin`
- `tenant_admin`
- `fleet_manager`
- `user`

### 10.2 Hard Isolation Requirements
1. Every request **MUST** carry authenticated tenant context from trusted identity claims.
2. Tenant IDs provided by clients are advisory and **MUST** be validated against claims.
3. Cross-tenant read/write attempts **MUST** be denied and audited.

### 10.3 IAM and Policy Controls
1. Lambda execution role **MUST** use least privilege, table- and key-prefix-scoped where practical.
2. Break-glass admin operations **MUST** require elevated role + explicit audit reason.

---

## 11. Runtime Consistency, Caching, and Invalidation
### 11.1 Consistency Requirements
1. Writes are strongly consistent per key via conditional updates.
2. Resolver reads **SHOULD** use strongly consistent reads for write-after-read sensitive flows.

### 11.2 Cache Layers
Allowed cache layers:
1. In-process Lambda cache (short TTL)
2. Optional distributed cache (e.g., ElastiCache) keyed by resolver context

### 11.3 Invalidation Strategy
1. Successful write **MUST** publish `SettingsChanged` event to EventBridge.
2. Consumers **MUST** invalidate cache by affected key/scope.
3. Resolver cache TTL **MUST** be bounded (default 30s, max 120s).
4. Invalidation failures **MUST** be observable and retried.

### 11.4 Propagation SLO and Invalidation Semantics
1. Settings propagation SLO **MUST** be:
	- 95% of subscribers refreshed in < 2 seconds
	- 99% of subscribers refreshed in < 5 seconds
2. `SettingsChanged` event payload **MUST** include:
	- `tenantId`, `scopeType`, `scopeId`
	- `changedKeys[]`
	- `newVersion`, `changedAt`, `requestId`
3. Subscribers **MUST** treat events as at-least-once delivery and implement idempotent refresh.
4. Stale event ordering **MUST** be handled by comparing version/timestamp and ignoring older updates.

### 11.5 Settings Change Propagation Flow (EventBridge)
```text
Settings API Write -> DynamoDB conditional update -> Audit append ->
EventBridge(SettingsChanged) -> Subscribers receive event ->
Subscriber cache refresh/invalidate -> New effective values active
```

---

## 12. Failure Modes and Degraded Operation
### 12.1 Resolver Failure Policy
1. If settings service is unavailable, consumers **MAY** use last-known-good cache for a bounded window.
2. Bounded stale window default: 5 minutes; after expiry, fail closed for safety-critical settings.

### 12.2 Failure Classification
- Validation failure
- Authorization failure
- Concurrency conflict
- Dependency timeout
- Event publication failure
- Cache invalidation lag

### 12.3 Mandatory Handling
1. Failures **MUST** return structured error codes.
2. Retryable failures **MUST** include retry guidance.
3. Poison invalidation events **MUST** route to DLQ with alarm.

---

## 13. Security, Privacy, and Compliance Controls
1. Encryption in transit (`TLS 1.2+`) and at rest (`KMS`) is mandatory.
2. `isSensitive=true` settings values **MUST** be masked in logs and restricted in read APIs.
3. Audit events **MUST** be append-only and tamper-evident (immutable write pattern).
4. Retention policy **MUST** define operational retention + legal hold behavior.
5. Compliance exports **MUST** include actor, scope, old/new values, request metadata, and trace IDs.
6. Audit data retention **MUST** support legal hold overrides with deletion guardrails.

---

## 14. Rate Limiting, Abuse Protection, and Cost Guardrails
1. API Gateway throttling **MUST** be configured per route and per API key/identity class.
2. WAF rules **SHOULD** protect against abuse patterns and payload anomalies.
3. Bulk operations **MUST** enforce max batch size and quota.
4. Resolver profile API **MUST** enforce max payload size and pagination where applicable.

---

## 15. Observability and Operational Telemetry
### 15.1 Required Metrics
1. `settings_write_success_count`
2. `settings_write_conflict_count`
3. `settings_resolve_latency_ms` (p50/p95/p99)
4. `settings_cache_hit_ratio`
5. `settings_invalidation_lag_ms`
6. `settings_authz_denied_count`
7. `settings_idempotency_replay_count`

### 15.2 Logging and Tracing
1. Structured JSON logs with tenant-safe redaction.
2. Correlation IDs and `requestId` propagated end-to-end.
3. Distributed tracing across API -> Lambda -> DynamoDB -> EventBridge.

### 15.3 Alarms (Minimum)
1. p95 resolver latency breach
2. elevated `5xx` rate
3. DLQ message count > threshold
4. cache invalidation lag breach

---

## 16. Non-Functional Requirements
- **Availability**: 99.9% for settings APIs
- **Latency**:
	- single-key resolve p95 < 120ms
	- profile resolve p95 < 300ms
- **Write Throughput**: sustain tenant policy rollout bursts without cross-tenant starvation
- **Durability**: audit and values persisted with DynamoDB durability guarantees

### 16.1 Cost & Scale Considerations
1. Primary cost driver **MUST** be modeled as resolver read volume, not write volume.
2. For new settings APIs, AWS HTTP API **SHOULD** be preferred over REST API where feature parity is acceptable, due to lower request cost and latency.
3. DynamoDB billing assumption **MUST** default to on-demand mode for elastic multi-tenant traffic.
4. DAX/Redis **MUST NOT** be required by default; use in-process cache first. External cache **MAY** be introduced later based on measured p95/p99 and cost data.

### 16.2 Critical Non-Functional Constraint — No Per-Event Resolver Calls
1. Telemetry processing services **MUST NOT** call resolver APIs per telemetry event.
2. Telematics processors **MUST** use:
   - in-memory micro-cache (recommended TTL: 60s)
   - and/or tenant/fleet policy snapshot
3. Telemetry pipelines **MUST** refresh settings on `SettingsChanged` EventBridge events and/or periodic refresh intervals.
4. Telemetry processors **MUST NOT** block event processing on live resolver calls; they **MUST** continue with last-known effective configuration.

### 16.3 Acceptable Resolver Call Paths
Resolver APIs are acceptable for:
1. UI and admin/API management flows
2. Policy management services
3. Scheduled batch jobs
4. Cache refresh workers and warmers

### 16.4 Explicit Anti-Pattern (Prohibited)
**Do not resolve per event** examples:
1. For each telemetry message, calling `GET /settings/resolved/profile` before classification.
2. For each GPS point, resolving overspeed threshold via network call.
3. For each trip-summary record, synchronous resolver lookup inside tight loops.

---

## 17. Integration Requirements
The following services **MUST** consume resolver outputs (not hardcoded constants):
1. telematics processor
2. trip summary builder
3. trip summary API
4. geofence evaluation
5. notification orchestration
6. UI rendering (effective-value + provenance)

Integration contracts **MUST** define fallback behavior when resolver is unavailable.

### 17.1 Telemetry Processing Integration Flow (Required)
```text
Telemetry Event -> Processor reads in-memory cached effective config ->
Classify/enrich event -> Persist/output ->
Background listener handles SettingsChanged and refreshes cache
```

### 17.2 Integration Constraint
1. Telemetry processor integration **MUST** remain asynchronous and non-blocking with respect to settings retrieval.
2. Resolver/network outages **MUST NOT** halt telemetry ingestion.

---

## 18. UI/UX Requirements
### 18.1 Pages
1. Tenant Settings
2. Fleet Settings
3. User Preferences
4. Settings Audit History

### 18.2 UX Semantics
1. Each value display **MUST** show source scope.
2. Lock badges **MUST** be explicit and actionable for authorized users.
3. “Reset to inherited” **MUST** map to override delete.
4. Policy updates **MUST** require reason text for auditable domains.

### 18.3 UI Mockups (Low-Fidelity Wireframes)
The following wireframes are normative UX references for implementation planning. Visual styling may vary, but information architecture and key controls **MUST** be preserved.

#### 18.3.1 Tenant Settings — Overview and Category Navigation
```text
+--------------------------------------------------------------------------------------------------+
| OnPoint Admin                                                                 [Tenant: Acme]     |
+--------------------------------------------------------------------------------------------------+
| Settings                                                                                         |
| ------------------------------------------------------------------------------------------------ |
| Scope: (●) Tenant   ( ) Fleet   ( ) User                                                         |
| Search setting key/name: [ overspeed________________________ ] [Filter: Safety v] [Export]      |
|                                                                                                  |
| Categories                          | Selected Category: Safety                                  |
| ----------------------------------- | ---------------------------------------------------------- |
| > Safety                            |  Key                          Effective   Source  Lock     |
| > Driver Scoring                    | ---------------------------------------------------------- |
| > Geofencing                        |  safety.overspeed.standard    65 mph      Tenant  [🔒]     |
| > Fuel/EV/Idling                    |  safety.overspeed.severe      80 mph      Tenant  [🔒]     |
| > Maintenance                       |  safety.harsh.braking.level   medium      System  [ ]      |
| > Notifications                     |  safety.harsh.cornering.level medium      Fleet   [ ]      |
| > Privacy                           |                                                          ... |
| > UX Preferences                    |                                                          ... |
|                                                                                                  |
| Legend: Source = System/Tenant/Fleet/User | Lock=locked at tenant                                |
+--------------------------------------------------------------------------------------------------+
```

#### 18.3.2 Settings Edit Drawer — Override with Concurrency and Audit Reason
```text
+----------------------------------------------------------------------------------------------+
| Edit Setting: safety.overspeed.standard                                                      |
|----------------------------------------------------------------------------------------------|
| Scope: Tenant (Acme)                                                                         |
| Data type: number   Unit: mph   Allowed range: 30..100                                       |
| Current effective value: 65 (source: Tenant, version: 14, etag: "v14-abc123")              |
|                                                                                              |
| New value: [ 70 ]                                                                             |
| Lock at tenant: [x] Prevent fleet/user overrides                                              |
| Effective from: [ immediate v ]                                                               |
| Change reason (required): [ Annual safety policy update ________________________________ ]    |
|                                                                                              |
| Impact Analysis                                                                               |
| - Fleets affected: 214   Users affected: 6,340   Services impacted: 4                        |
| - High-risk check: [PASS]  Threshold delta: +5 mph                                           |
|                                                                                              |
| Idempotency Key: [ auto-generated: 6f0f... ]                                                  |
| Concurrency: If-Match "v14-abc123"                                                            |
|                                                                                              |
| [Cancel]                                                          [Validate] [Save Change]    |
+----------------------------------------------------------------------------------------------+
```

#### 18.3.3 Fleet Settings — Inheritance and Override Visualization
```text
+------------------------------------------------------------------------------------------------+
| Fleet Settings                                                                        Fleet: F-21|
+------------------------------------------------------------------------------------------------+
| Key                               Inherited Value  Override Value  Effective  Source   Actions |
|------------------------------------------------------------------------------------------------|
| safety.overspeed.standard         70 mph           [ 72 ]          72 mph     Fleet    [Save]  |
| safety.overspeed.severe           80 mph           [ -- ]          80 mph     Tenant   [Reset] |
| fuel.idle.threshold.seconds       300              [ 240 ]         240        Fleet    [Save]  |
| notification.quietHours.start     22:00            [ -- ]          22:00      Tenant   [Reset] |
|                                                                                                  |
| Notes:                                                                                           |
| - Locked tenant keys are read-only at fleet scope.                                               |
| - "Reset" removes fleet override and reverts to inherited value.                                |
+------------------------------------------------------------------------------------------------+
```

#### 18.3.4 User Preferences — Personalization Boundaries
```text
+-----------------------------------------------------------------------------------------------+
| User Preferences                                                                 User: U-9081 |
+-----------------------------------------------------------------------------------------------+
| Key                                Tenant Policy   Fleet Policy   User Override   Effective   |
|-----------------------------------------------------------------------------------------------|
| ui.units                            imperial        imperial       [ metric ]      metric      |
| ui.timezone                         UTC             UTC            [ Asia/Kolkata] Asia/Kolkata|
| map.defaultZoom                     12              12             [ 10 ]          10          |
| safety.overspeed.standard           70 mph          72 mph         [ disabled ]    72 mph      |
|                                                                                               |
| Info: User may only override whitelisted keys (UI/notification personalization).              |
| [Discard]                                                                      [Save Changes]  |
+-----------------------------------------------------------------------------------------------+
```

#### 18.3.5 Resolver Inspector (Support / Debug View)
```text
+--------------------------------------------------------------------------------------------------+
| Resolver Inspector                                                                                |
+--------------------------------------------------------------------------------------------------+
| Query Context: tenantId=T-1001 fleetId=F-21 userId=U-9081                                        |
| Setting Key: safety.overspeed.standard                                                            |
|--------------------------------------------------------------------------------------------------|
| Resolution Path                                                                                   |
| 1. User   -> no override                                                                          |
| 2. Fleet  -> value=72 mph, version=7, updatedAt=2026-02-20T11:31:00Z                            |
| 3. Tenant -> value=70 mph (ignored due to higher scope override)                                 |
| 4. System -> value=65 mph (ignored)                                                               |
|--------------------------------------------------------------------------------------------------|
| Effective: 72 mph                                                                                 |
| Effective Scope: fleet                                                                            |
| Locked At Tenant: false                                                                           |
| Cache Status: HIT (age=8s)                                                                        |
+--------------------------------------------------------------------------------------------------+
```

#### 18.3.6 Audit Timeline Page
```text
+--------------------------------------------------------------------------------------------------+
| Settings Audit                                                                                    |
+--------------------------------------------------------------------------------------------------+
| Filters: [Tenant v] [Fleet v] [User v] [Setting Key __________] [Actor _______] [Date Range v] |
|--------------------------------------------------------------------------------------------------|
| Time (UTC)            Actor              Scope        Key                           Change       |
|--------------------------------------------------------------------------------------------------|
| 2026-02-22 09:14:11   tenant_admin_01    Tenant T-1   safety.overspeed.standard     65 -> 70    |
| Reason: Annual safety policy update | RequestId: req-12ab | Idempotency: idem-77aa                |
|--------------------------------------------------------------------------------------------------|
| 2026-02-22 09:16:05   fleet_mgr_22       Fleet F-21    safety.overspeed.standard     70 -> 72    |
| Reason: Regional traffic profile    | RequestId: req-98xy | If-Match: v6 -> v7                    |
|--------------------------------------------------------------------------------------------------|
| [Previous]                                                                       [Next]          |
+--------------------------------------------------------------------------------------------------+
```

#### 18.3.7 Scheduled Changes View
```text
+--------------------------------------------------------------------------------------------------+
| Scheduled Settings Changes                                                                       |
+--------------------------------------------------------------------------------------------------+
| Filters: [Scope v] [Category v] [Owner v] [Next 30 days v]                                      |
|--------------------------------------------------------------------------------------------------|
| Effective At (UTC)      Scope         Key                             New Value    Status        |
|--------------------------------------------------------------------------------------------------|
| 2026-03-01 00:00:00     Tenant T-1    safety.overspeed.standard       70 mph       Approved      |
| 2026-03-05 06:00:00     Fleet F-21    fuel.idle.threshold.seconds     240          Pending       |
| 2026-03-10 00:00:00     Tenant T-1    notification.quietHours.start   23:00        Approved      |
|--------------------------------------------------------------------------------------------------|
| [View Diff] [Cancel Schedule] [Export]                                                          |
+--------------------------------------------------------------------------------------------------+
```

#### 18.3.8 Cross-Setting Validation Error Rendering
```text
+----------------------------------------------------------------------------------------------+
| Validation Errors                                                                              |
|----------------------------------------------------------------------------------------------|
| Could not save changes. Resolve the following policy violations:                              |
| 1) Rule: safety.speed.threshold.order                                                          |
|    - safety.overspeed.standard = 82                                                            |
|    - safety.overspeed.severe   = 80                                                            |
|    - Requirement: standard < severe                                                            |
| 2) Rule: notification.quietHours.validRange                                                    |
|    - quietHours.start == quietHours.end                                                        |
|    - Requirement: start != end                                                                 |
|----------------------------------------------------------------------------------------------|
| [Back to Edit]                                                                                 |
+----------------------------------------------------------------------------------------------+
```

### 18.4 UX Acceptance Criteria for Mockup Fidelity
1. Implemented UI **MUST** expose scope context and source attribution for each effective value.
2. Edit flows **MUST** display concurrency token context (e.g., version/etag) when conflicts occur.
3. Locked settings **MUST** be visually read-only with explicit reason/tool-tip.
4. Audit page **MUST** expose `who/what/when/why/requestId` for every setting mutation.
5. Fleet/User screens **MUST** clearly differentiate inherited value vs override value.
6. Save flows for guarded keys **MUST** show impact analysis before submission.
7. Scheduled changes screen **MUST** expose upcoming `effectiveFrom` updates with status.
8. Cross-setting validation errors **MUST** render rule-level details tied to specific keys.

---

## 19. Backward Compatibility and Migration Strategy
### 19.1 Compatibility Guarantees
1. Existing services **MUST** continue operating with system defaults if no explicit setting exists.
2. Deprecated keys **MUST** support alias mapping for at least one release cycle.
3. Removal of keys **MUST** follow deprecation policy with release notes.

### 19.2 Migration Phases
1. Seed definitions and defaults.
2. Backfill tenant baseline from existing env constants.
3. Shadow resolver mode with parity comparison metrics.
4. Progressive consumer cutover behind feature flags.
5. Remove legacy hardcoded paths after parity success criteria.

### 19.3 Rollback
1. Feature flags **MUST** enable rapid rollback to legacy behavior.
2. Data schema changes **MUST** be backward-compatible (expand/contract).

### 19.4 Snapshot Restore Strategy
1. Restore operations **MUST** support point-in-time snapshot selection.
2. Restore **MUST** provide dry-run output listing creates/updates/deletes before execution.
3. Restore execution **MUST** be atomic per selected scope and reversible via prior snapshot.
4. Restore failures **MUST** emit structured audit events with failure reason and partial-work guarantees.

---

## 20. Deployment and Release Engineering Requirements
1. Infrastructure changes **MUST** be delivered via CloudFormation with reviewed templates.
2. Canary deployment for settings write path **SHOULD** be used before full rollout.
3. Production changes to critical safety settings **MUST** require change-control approval.
4. Runbooks **MUST** include resolver outage, cache drift, and conflict storm scenarios.
5. Critical safety setting rollout **SHOULD** support optional two-person approval in production environments.

---

## 21. Feature Flag Readiness
The implementation **MUST** support feature flags for:
1. Resolver read path enablement by service
2. Write API enablement by tenant cohort
3. Cache strategy toggles
4. Lock enforcement strict mode

Flag state changes **MUST** be auditable.

---

## 22. Testing and Verification Requirements
1. Resolver determinism tests across all scope combinations
2. Conflict and idempotency replay tests
3. Tenant isolation penetration tests
4. Contract tests for all APIs including error model
5. Load tests for high-cardinality tenant/fleet/user access patterns
6. Chaos tests for cache invalidation and EventBridge delay/failure

---

## 23. Acceptance Criteria
1. Deterministic resolver outputs verified by automated test suite.
2. Idempotent writes proven under retry and duplicate delivery scenarios.
3. Optimistic concurrency conflict handling validated (`412` and `409` paths).
4. No cross-tenant data leakage in any API, cache, log, or audit output.
5. Consumer services read settings from resolver in production path.
6. SLO and alarm baseline established with operational dashboards.

---

## 24. Implementation Deliverables
1. Finalized OpenAPI spec for settings management and resolver APIs
2. DynamoDB schema and access patterns documentation
3. Lambda service implementation with idempotency and concurrency controls
4. EventBridge invalidation events and consumer handlers
5. UI workflows and audit explorer
6. Migration tooling and backfill scripts
7. Operational dashboards, alarms, and SRE runbooks

---

## 25. Fixed v2 Decisions (Normative)
1. Precedence is fixed: `user > fleet > tenant > system`.
2. Inheritance and overrides are enabled.
3. Tenant lock semantics are enforced server-side.
4. Write APIs require idempotency support.
5. Optimistic concurrency is mandatory for mutating operations.
6. AWS serverless deployment model is the baseline architecture.
7. Multi-tenant hard isolation is mandatory.

---

## 26. Glossary
- **Effective Value**: final resolved setting after applying hierarchy.
- **Resolution Path**: ordered scopes evaluated for a setting key.
- **Idempotency Key**: client-generated key used to deduplicate writes.
- **ETag**: version token for optimistic concurrency control.
- **LKG**: last-known-good cached settings state used in bounded degraded mode.
