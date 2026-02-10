# OnPoint Geofencing Requirements (Fleet & Telematics – Industry Standard)

## 1. Purpose & Scope
This document defines the **authoritative geofencing requirements** for the OnPoint fleet and telematics platform.
It reflects **industry‑standard expectations** for commercial fleet management systems (logistics, delivery, rental, EV, construction, utilities).

The requirements are designed to:
- Support **large, multi‑tenant fleets**
- Operate under **late‑binding tenancy** (VIN‑centric)
- Work in **real‑time and historical contexts**
- Scale to **thousands of vehicles and geofences**

---

## 2. Core Principles

### 2.1 Authoritative Identifiers
- **VIN** is the only authoritative vehicle identifier
- **tripId** is optional but used for trip‑scoped enrichment
- Tenant, customer, and fleet are **derived internally**
- Upstream providers do **not** supply tenant or fleet identity

### 2.2 Tenancy Model
- All geofences are **tenant‑scoped**
- Optional scoping:
  - Tenant
  - Customer
  - Fleet
  - Vehicle (VIN‑specific)
- **Late binding**: geofence evaluation resolves tenant/fleet using the VIN Registry at evaluation time

---

## 3. Geofence Types

The system MUST support the following geofence types:

| Type | Description |
|----|----|
| CIRCLE | Center + radius |
| POLYGON | Arbitrary polygon |
| MULTI_POLYGON | Complex regions |
| CORRIDOR | Route‑based buffer |
| POINT | Zero‑radius landmark |
| DYNAMIC | Geometry derived from rules or routes |

---

## 4. Hierarchy, Inheritance & Conflict Resolution

### 4.1 Hierarchy Levels
Geofences may be defined at:
1. Tenant level
2. Customer level
3. Fleet level
4. Vehicle (VIN) level

### 4.2 Inheritance Rules
- Lower levels **inherit** higher‑level geofences
- Lower levels may:
  - Override geometry
  - Override rules
  - Exclude inherited geofences

### 4.3 Conflict Resolution
When multiple geofences apply:
1. **Specificity** (Vehicle > Fleet > Customer > Tenant)
2. **Priority** (explicit numeric priority)
3. **Version recency**
4. **Geofence type precedence** (e.g., corridor over polygon)

---

## 5. Geofence Lifecycle Management

Each geofence MUST support:

- Create
- Update
- Activate / Deactivate
- Soft delete
- Schedule (start/end time)
- Recurrence (daily/weekly windows)
- Versioning
- Full audit history

### 5.1 Versioning
Each version MUST capture:
- Geometry
- Effective time range
- Priority
- Detection rules
- Metadata:
  - createdBy
  - reason
  - tags
  - changeType

---

## 6. Event Model

### 6.1 Event Types

| Event Type | Description |
|-----------|-------------|
| ENTER | Vehicle crosses into geofence |
| EXIT | Vehicle leaves geofence |
| DWELL_START | Vehicle remains beyond threshold |
| DWELL_END | Vehicle exits after dwell |
| VIOLATION | Policy breach |
| TRANSIT | Pass‑through |
| ROUTE_DEVIATION | Leaves corridor |
| OVERRIDE | Manual or rule‑based override |

### 6.2 Event Attributes
Each event MUST include:

- geofenceId
- geofenceVersion
- geofenceType
- VIN
- tripId (if available)
- tenantId (derived)
- fleetId (derived)
- timestamp (UTC)
- lat / lon
- speed
- heading
- confidenceScore
- detectionMethod (GPS / map‑matched)
- telemetryRef (raw event pointer)

---

## 7. Detection Accuracy & Stability

The system MUST implement:

- GPS accuracy filtering (HDOP / confidence)
- Entry/exit hysteresis buffer
- Debounce window (configurable)
- Minimum dwell thresholds
- False‑positive suppression
- Overlapping geofence arbitration
- Speed‑aware filtering (e.g., ignore jitter at 0 mph)

---

## 8. Real‑Time Processing Requirements

- Geofence evaluation per telemetry event
- Target latency: **< 1 second**
- Multiple geofence matches per event
- Scale:
  - 10k+ vehicles
  - 100k+ geofences
- Support:
  - Streaming ingestion
  - Batch replay
  - Backfill

---

## 9. Trip & Historical Enrichment

Trips MUST be enriched with:
- First entry / last exit per geofence
- Total dwell duration
- Violation counts
- Route compliance
- Distance and fuel attribution per geofence

Historical queries MUST support:
- Time range filtering
- VIN / tripId lookup
- Tenant‑isolated access

---

## 10. Alerting & Notifications

The system MUST support:

- Configurable alert rules per geofence
- Severity levels
- Time‑of‑day and day‑of‑week constraints
- Deduplication and idempotency

### 10.1 Delivery Channels
- Email
- SMS
- Push notifications
- Webhooks
- Enterprise integrations

---

## 11. APIs

### 11.1 Management APIs
- POST /geofences
- PUT /geofences/{id}
- GET /geofences
- DELETE /geofences/{id}

### 11.2 Query APIs
- GET /vehicles/{vin}/geofence-events
- GET /trips/{tripId}/geofence-events
- GET /geofences/{id}/metrics

APIs MUST support:
- Pagination
- Time filtering
- RBAC
- Tenant isolation

---

## 12. Security & Compliance

The system MUST enforce:
- Tenant isolation
- RBAC / ABAC
- Encryption at rest and in transit
- Immutable audit logs
- Data retention policies
- PII redaction

---

## 13. Performance & SLA

| Metric | Target |
|------|------|
| Event latency | < 1 second |
| Availability | ≥ 99.9% |
| Event loss | 0 |
| False positives | < 1% |

---

## 14. Non‑Functional Requirements

- Idempotent processing
- Replayability
- Schema versioning
- Horizontal scalability
- Observability (logs, metrics, traces)
- Backward‑compatible APIs

---

## 15. Out of Scope (Current Version)

- Indoor positioning
- Sub‑meter guarantees
- Camera‑based geofencing

---

## 16. Acceptance Criteria

- Single ENTER per crossing
- Correct dwell timing
- Accurate trip enrichment
- Exactly‑once alerts
- Consistent API responses

---

**End of Document**
