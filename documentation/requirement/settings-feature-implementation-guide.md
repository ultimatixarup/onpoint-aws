# OnPoint Settings Feature — Implementation Guide (Aligned to Enterprise Spec v2.1)

## 1. Document Purpose
This guide translates the requirements in settings-feature-requirements.md (v2.1) into an implementation-ready engineering blueprint for backend, UI, data, DevOps, and operations teams.

## 2. Implementation Principles
1. Single authoritative resolver behavior shared across services.
2. Hard multi-tenant isolation in every layer (API, data, cache, logs).
3. No per-telemetry-event resolver calls.
4. Safe writes by default (idempotency + optimistic concurrency).
5. Append-only audit and complete change traceability.
6. Progressive rollout with feature flags and rollback paths.

## 3. Target Architecture (AWS Serverless)
### 3.1 Core Components
1. API Gateway (HTTP API preferred)
2. Lambda: Settings Management API
3. Lambda: Settings Resolver API
4. DynamoDB tables:
   - onpoint-settings-definitions
   - onpoint-settings-values
   - onpoint-settings-audit
   - onpoint-settings-idempotency
5. EventBridge bus + rule(s): `SettingsChanged`
6. Consumer refresh handlers (existing lambdas/services)
7. CloudWatch metrics, alarms, dashboards

### 3.2 Optional (Phase 2+)
1. External distributed cache (Redis) only if p95/p99 and cost justify it.
2. Hash-chain verifier job for audit integrity evidence.

## 4. Work Breakdown Structure
### Phase A — Foundation
1. Create schema and table contracts.
2. Implement shared settings SDK/library used by all lambdas:
   - resolver logic
   - validation engine
   - idempotency helper
   - concurrency helper
3. Implement API authz middleware with tenant-boundary checks.

### Phase B — APIs and Resolver
1. Management API CRUD/bulk/snapshot/impact-analysis.
2. Resolver API (single-key + profile).
3. Cross-setting validation rules engine.
4. Dependency graph service (cycle detection + dependent recompute ordering).

### Phase C — Propagation and Integrations
1. Publish `SettingsChanged` event on successful writes.
2. Add cache refresh listeners in telemetry/trip/geofence/notification services.
3. Add non-blocking local micro-cache to telemetry path.

### Phase D — UI and UX
1. Tenant/Fleet/User settings pages.
2. Audit page, Scheduled changes page, Resolver inspector.
3. Impact analysis and cross-setting error rendering.

### Phase E — Rollout and Hardening
1. Shadow mode comparisons.
2. Canary and cohort rollout.
3. SLO validation and alarms.

## 5. Data Model Implementation Details
## 5.1 Table: onpoint-settings-definitions
### Access pattern
1. List all definitions by category.
2. Get definition by key.

### Suggested keys
- PK: `SETTING#{settingKey}`
- SK: `META#{version}`

### Required attributes
- settingKey, category, dataType, validationSchema, systemDefaultValue
- supportsLock, supportsFutureEffectiveFrom, deprecationState
- dependsOn[], affects[], introducedVersion, defaultVersion

## 5.2 Table: onpoint-settings-values
### Access pattern
1. Get specific key at scope.
2. List scope settings.
3. Batch get candidate scope chain for resolver.

### Suggested keys
- PK: `TENANT#{tenantId}#SCOPE#{scopeType}#{scopeId}`
- SK: `SETTING#{settingKey}`

### Required attributes
- tenantId, scopeType, scopeId, settingKey
- value, valueType, version, etag
- lockedAtTenant, effectiveFrom
- updatedAt, updatedBy, changeReason

### Write semantics
- Conditional write on `etag/version`.
- Reject stale writes with `412`.

## 5.3 Table: onpoint-settings-audit
### Access pattern
1. Query by tenant + key.
2. Query by tenant + time range.
3. Export by scope/date.

### Suggested keys
- PK: `TENANT#{tenantId}#SETTING#{settingKey}#BUCKET#{yyyyMM}`
- SK: `TS#{iso8601}#REQ#{requestId}`

### Required attributes
- eventId, tenantId, scopeType/scopeId, settingKey
- oldValue/newValue, changedBy, changedAt, requestId
- idempotencyKey, etagBefore/etagAfter, reason
- optional previousHash/entryHash

## 5.4 Table: onpoint-settings-idempotency
### Access pattern
1. Resolve repeated write request.

### Suggested keys
- PK: `TENANT#{tenantId}#IDEMPOTENCY#{idempotencyKey}`
- SK: `OP#{operationType}#{resourceHash}`

### Required attributes
- requestHash, statusCode, responsePayload, createdAt, expiresAt

## 6. Resolver Algorithm (Reference)
1. Validate tenant/fleet/user relationship.
2. Load definitions and active rule metadata.
3. Fetch values in precedence order (`user`, `fleet`, `tenant`, `system default`).
4. Apply lock semantics.
5. Apply effectiveFrom filter (current view time).
6. Build deterministic output with:
   - effectiveValue
   - effectiveScope
   - resolutionPath
   - sourceVersion
   - resolvedAt
7. Cache result with short TTL.

## 7. Dependency Graph and Validation Engine
## 7.1 Dependency Graph
1. Store `dependsOn` edges in definitions.
2. On definition change:
   - run cycle detection (DFS/Kahn)
   - reject cycles with structured `400` details
3. On value change:
   - compute dependent keys in topological order
   - revalidate dependents before finalize

## 7.2 Cross-Setting Validation
1. Rules are declarative and versioned.
2. Validation runs against post-change candidate state.
3. Validation response contract:
- `errorCode`: `CROSS_SETTING_VALIDATION_FAILED`
- `violations[]` with ruleId, keys, expected, actual

## 8. API Implementation Details
## 8.1 Required Headers
1. `Authorization`
2. `x-tenant-id` (validated against claims)
3. `Idempotency-Key` for writes
4. `If-Match` for guarded updates/deletes

## 8.2 Management Endpoints
1. Definitions
   - GET `/settings/definitions`
2. Scoped settings
   - GET `/settings/{scopeType}/{scopeId}`
   - PUT `/settings/{scopeType}/{scopeId}/{settingKey}`
   - DELETE `/settings/{scopeType}/{scopeId}/{settingKey}`
3. Bulk
   - POST `/settings/bulk`
4. Audit
   - GET `/settings/audit`
5. Snapshot
   - POST `/settings/snapshots/export`
   - POST `/settings/snapshots/import`
   - POST `/settings/snapshots/restore`
6. Impact
   - POST `/settings/impact-analysis`

## 8.3 Resolver Endpoints
1. GET `/settings/resolved/{settingKey}`
2. GET `/settings/resolved/profile`

## 8.4 Blast-Radius Protected Writes
For critical safety keys:
1. Require impact-analysis generation token.
2. Optionally require approval status.
3. Allow scheduled effectiveFrom only when valid.

## 9. Caching and Invalidation Implementation
## 9.1 Local Service Cache
1. In-memory micro-cache per lambda/container.
2. TTL default:
   - 30s for resolver-facing APIs
   - 60s for telemetry processors

## 9.2 Event-Driven Invalidation
1. Successful write emits EventBridge event:
   - eventType: `SettingsChanged`
   - tenant/scope/key metadata
2. Subscribers invalidate relevant keys and refresh lazily or eagerly.
3. Idempotent handling required (at-least-once delivery).

## 9.3 Propagation SLO Monitoring
1. Record `changedAt` on publisher.
2. Record `appliedAt` on subscribers.
3. Emit lag metric = `appliedAt - changedAt`.
4. Alert if:
   - p95 >= 2s
   - p99 >= 5s

## 10. Telemetry Pipeline Constraint (Critical)
## 10.1 Required Pattern
1. Telemetry processor reads effective config from local micro-cache/snapshot.
2. Refresh triggers:
   - `SettingsChanged` event
   - periodic refresh timer
3. If resolver unavailable, use LKG config.

## 10.2 Prohibited Pattern
1. No resolver API call inside per-event hot path.
2. No synchronous network lookup for each GPS sample/event.

## 11. Snapshot, Export/Import, and Restore
## 11.1 Export
1. Produce signed artifact with metadata:
   - tenant/scope
   - schema version
   - creation time
   - checksum/signature

## 11.2 Import
1. Validate schema and signature.
2. Perform dry-run diff and rule validation.
3. Return conflict report.

## 11.3 Restore
1. Execute as atomic scoped transaction pattern (logical atomicity with rollback orchestration).
2. On failure, revert applied subset and log failure audit event.

## 12. Security and Compliance Implementation
1. Encrypt all sensitive values at rest with KMS.
2. Enforce masked read responses for sensitive keys except authorized roles.
3. Redact sensitive values from logs and traces.
4. Preserve audit immutability and retention/legal hold controls.

## 13. Cost and Scale Guidance
1. Resolver reads dominate cost; optimize read amplification first.
2. Prefer HTTP API over REST API unless missing required features.
3. Keep DynamoDB in on-demand mode initially.
4. Do not provision Redis/DAX initially.
5. Revisit distributed cache only when measured p95/p99 or cost indicates ROI.

## 14. Feature Flags and Release Controls
1. `settings.resolver.enabled.<service>`
2. `settings.write.enabled.<tenantCohort>`
3. `settings.cache.strategy`
4. `settings.lock.strict`
5. `settings.blastRadius.approval.required`

All flag changes must be auditable.

## 15. UI Implementation Mapping
## 15.1 Core Views
1. Tenant settings
2. Fleet override grid
3. User preferences
4. Audit timeline
5. Scheduled changes
6. Resolver inspector

## 15.2 Critical UI Behaviors
1. Show inherited source and effective value simultaneously.
2. Show lock state and reason.
3. Display cross-setting validation violations with rule IDs.
4. Display impact analysis before guarded saves.
5. Show scheduled effective changes and statuses.

## 16. Testing Strategy
## 16.1 Unit
1. Resolver precedence and lock rules.
2. Dependency cycle detection.
3. Cross-setting validation rule enforcement.
4. Idempotency replay behavior.

## 16.2 Integration
1. API + DynamoDB conditional writes.
2. EventBridge propagation and subscriber refresh.
3. Telemetry service LKG behavior during resolver outage.

## 16.3 Performance
1. Resolver p95/p99 latency.
2. Propagation lag SLO.
3. Bulk update throughput with tenant fairness.

## 16.4 Security/Isolation
1. Cross-tenant access denial tests.
2. Sensitive-field redaction tests.
3. Audit immutability verification.

## 17. Rollout Plan (Implementation)
1. Build + deploy settings APIs and tables in disabled mode.
2. Seed definitions + defaults.
3. Shadow-read resolver in select services.
4. Compare parity metrics.
5. Enable writes for pilot tenant cohort.
6. Enable propagation and telemetry cache refreshers.
7. Expand to all tenants.
8. Remove hardcoded config paths.

## 18. Operational Runbooks (Minimum)
1. Resolver outage handling.
2. Propagation lag breach response.
3. Conflict storm mitigation (`412`/`409` spikes).
4. Snapshot restore emergency execution.
5. Tenant-isolation incident response.

## 19. Engineering Deliverables Checklist
1. OpenAPI spec
2. CloudFormation resources
3. Shared resolver SDK
4. Validation rules registry
5. EventBridge contracts
6. UI workflows
7. Dashboard + alarms
8. Migration scripts
9. Runbooks and playbooks

## 20. Definition of Done
1. All acceptance criteria from v2.1 spec are met.
2. Telemetry path verified to avoid per-event resolver calls.
3. Propagation SLO achieved in staging load test.
4. Security and isolation test gates pass.
5. Rollback and restore drills executed successfully.
