Rules:
- Lower levels inherit higher-level geofences
- Overrides and exclusions must be supported
- Conflict resolution via priority and specificity

---

## 4. Geofence Lifecycle Management

Each geofence MUST support:

- Create
- Update
- Activate / Deactivate
- Schedule (start/end time, recurrence)
- Versioning
- Soft delete
- Full audit history

Each version MUST capture:
- Geometry
- Effective time range
- Priority
- Metadata (createdBy, reason, tags)

---

## 5. Event Model

### 5.1 Event Types

The system MUST generate the following events:

| Event Type | Description |
|-----------|-------------|
| ENTER | Vehicle crosses into geofence |
| EXIT | Vehicle leaves geofence |
| DWELL_START | Vehicle remains inside beyond threshold |
| DWELL_END | Vehicle leaves after dwell |
| VIOLATION | Policy breach inside geofence |
| TRANSIT | Vehicle passes through corridor |
| ROUTE_DEVIATION | Vehicle leaves route corridor |

---

### 5.2 Event Attributes

Each event MUST include:

- geofenceId
- geofenceType
- vehicleId (VIN)
- tripId (if applicable)
- timestamp (UTC)
- lat / lon
- speed
- confidenceScore
- detectionMethod (GPS / map-matched)
- metadata (raw telemetry reference)

---

## 6. Detection Accuracy & Stability

The system MUST implement:

- GPS accuracy filtering (HDOP / confidence)
- Entry/exit hysteresis buffer
- Debounce window (e.g., 5–30 seconds)
- Minimum dwell thresholds
- False-positive suppression
- Overlapping geofence resolution rules

---

## 7. Real-Time Processing Requirements

- Geofence evaluation MUST occur per telemetry event
- Target latency: **< 1 second**
- Support **multiple geofence matches per event**
- Scale to **10k+ concurrent vehicles**
- Support streaming and batch ingestion

---

## 8. Trip & Historical Enrichment

Trips MUST be enriched with:

- First entry / last exit timestamps per geofence
- Total dwell duration
- Violation counts
- Route compliance metrics
- Geofence-specific distance and fuel attribution

Geofence events MUST be queryable historically.

---

## 9. Alerting & Notifications

The system MUST support:

- Configurable alert rules per geofence
- Severity levels
- Time-of-day / day-of-week constraints
- Delivery channels:
  - Email
  - SMS
  - Push
  - Webhooks
  - Enterprise integrations

Alerts MUST be idempotent and deduplicated.

---

## 10. APIs

### 10.1 Management APIs

- `POST /geofences`
- `PUT /geofences/{id}`
- `GET /geofences`
- `DELETE /geofences/{id}`

### 10.2 Query APIs

- `GET /vehicles/{vin}/geofence-events`
- `GET /trips/{tripId}/geofence-events`
- `GET /geofences/{id}/metrics`

APIs MUST support:
- Pagination
- Time filtering
- Tenant isolation
- RBAC enforcement

---

## 11. Security & Compliance

The system MUST enforce:

- Tenant isolation
- RBAC / ABAC
- Encryption in transit and at rest
- Immutable audit logs
- Configurable data retention
- PII redaction where applicable

---

## 12. Performance & SLA

| Metric | Target |
|------|--------|
| Event latency | < 1 second |
| Availability | ≥ 99.9% |
| Event loss | 0 |
| False positives | < 1% |

---

## 13. Non-Functional Requirements

- Idempotent processing
- Replay and backfill support
- Schema versioning
- Horizontal scalability
- Observability (logs, metrics, traces)
- Backward-compatible API evolution

---

## 14. Out of Scope (for this version)

- Indoor positioning
- Sub-meter precision guarantees
- Camera-based geofencing

---

## 15. Acceptance Criteria (High-Level)

- A vehicle entering a geofence produces a single ENTER event
- Dwell events respect configured thresholds
- Trips show accurate geofence enrichment
- Alerts fire exactly once per rule
- APIs return consistent results across retries

---

**End of Document**
