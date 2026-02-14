
# OnPoint Driver Management — Industry-Grade Requirements (Enhanced)

## 1. Scope

This document expands the Driver Management capability for OnPoint to align with industry-standard fleet telematics platforms (e.g., Geotab, Samsara, Fleetio, Michelin Connected Fleet).

The feature set covers:

- Driver profile lifecycle
- Driver ↔ Vehicle assignment management
- Driver Dashboard with KPI drilldowns
- Real-time behavior monitoring
- Regulatory compliance (ELD/HOS/DVIR readiness)
- Operational efficiency insights
- System integration and security requirements

This specification assumes:
- Multi-tenant architecture (late binding tenancy model)
- AWS serverless backend
- VIN + tripId are authoritative upstream identifiers
- Cognito-based identity management

---

# 2. Driver Profile Management

## 2.1 Core Attributes

Each driver must support:

- driverId (system-generated UUID)
- tenantId
- status (ACTIVE, INACTIVE, SUSPENDED)
- displayName
- email
- phone
- employeeId / externalRef
- fleetId (optional primary)
- metadata (custom JSON)
- createdAt / updatedAt

## 2.2 Compliance Attributes

Optional but recommended for regulatory fleets:

- License:
  - number
  - state
  - class
  - expirationDate
- Medical certification expiration
- Endorsements
- Risk category
- CDL indicator
- DQ (Driver Qualification) status

## 2.3 Lifecycle Operations

- Create
- Update
- Activate / Deactivate
- Archive (soft delete)
- Audit history tracking

All write operations must generate immutable audit logs.

---

# 3. Driver Assignment Management

Drivers must support effective-dated assignments to vehicles:

- Assign driver to VIN
- Transfer driver between vehicles
- Historical assignment view
- Overlap validation (no conflicting assignments)
- Primary / Secondary / Temporary assignment types

Assignment rules:

- Must validate VIN ownership via VIN Registry
- Must enforce tenant isolation
- Must support historical replay and audit

---

# 4. Driver Dashboard (Advanced KPIs)

The Driver Dashboard must support date range filtering and fleet filtering.

## 4.1 Core Safety KPIs (Clickable)

- Total Miles Driven
- Total Driving Time
- Night Miles Driven
- Average Speed
- Top Speed
- Idling Time
- Collision Count
- Harsh Braking
- Harsh Cornering
- Harsh Acceleration
- Seat Belt Violations
- Overspeed (Standard & Severe)
- Safety Score (weighted average for now. properietry algorithm will be provided later to update)
- Driver Fuel Effciency (properietry algorithm will be provided later on)

Each KPI must support drilldown into:
- Trip list
- Event list
- Raw telemetry reference

---

# 5. Real-Time Behavior Monitoring

## 5.1 Required Monitoring

System must detect:

- Harsh braking
- Rapid acceleration
- Sharp cornering
- Overspeed (standard & severe thresholds)
- Seatbelt violations
- Collision detection
- Idle duration beyond threshold

## 5.2 Real-Time Alerts

Must support:

- Real-time manager notifications
- Driver in-cab coaching (future)
- Configurable thresholds per tenant/fleet
- Debounce logic to prevent duplicate alerts

## 5.3 AI Video Telematics (Future-Ready)

Architecture must support integration for:

- Distracted driving detection
- Drowsiness detection
- Phone usage detection
- Driver-facing camera events

---

# 6. Regulatory Compliance (ELD / HOS Ready)

System must be extensible to support:

## 6.1 ELD & Hours of Service

- Drive time tracking
- On-duty / off-duty tracking
- Sleeper berth tracking
- HOS violation detection
- Fatigue alerts

## 6.2 Driver Qualification (DQ) File Management

- License expiration tracking
- Medical certificate expiration tracking
- Compliance flags
- Automated renewal alerts

## 6.3 DVIR Support

- Pre-trip inspection logs
- Post-trip inspection logs
- Defect reporting
- Maintenance routing integration

---

# 7. Operational Efficiency Metrics

## 7.1 Fuel Optimization

- Excessive idling tracking
- Fuel consumption per driver
- Fuel efficiency trends
- Idle % vs driving %

## 7.2 Asset & Dispatch Intelligence

- Real-time GPS tracking
- Driver-to-vehicle correlation
- Last known location
- Fleet utilization ranking

## 7.3 Maintenance Correlation

- Fault code tracking per driver session
- Driver impact on vehicle wear
- Maintenance event correlation

---

# 8. System Integration Requirements

The system must integrate with:

- HR systems (driver provisioning)
- Payroll systems (hours export)
- Fuel card systems
- Maintenance systems
- Insurance telematics APIs

Integration must support:

- REST APIs
- Webhooks
- EventBridge publishing
- Secure token-based authentication

---

# 9. Data Security & Compliance

Must enforce:

- Tenant isolation
- RBAC enforcement
- Field-level security
- Encryption at rest (KMS)
- Encryption in transit (TLS 1.2+)
- Immutable audit logging
- Configurable data retention policies
- GDPR-ready deletion flows (where applicable)

---

# 10. Performance & SLA Targets

| Metric | Target |
|--------|--------|
| Dashboard latency | < 2 seconds |
| Event processing latency | < 1 second |
| Availability | 99.9%+ |
| Data loss | 0 |
| False positives (alerts) | < 1% |

---

# 11. Non-Functional Requirements

- Idempotent APIs
- Backfill & replay support
- Horizontal scalability
- Pagination everywhere
- Deterministic calculations
- Observability (CloudWatch metrics + traces)

---

# 12. Future Extensions

- Driver risk scoring AI
- Gamification leaderboard
- Coaching recommendations
- Insurance scoring export
- Driver mobile companion app
- Behavioral trend ML modeling

---

# 13. Authoritative Principles

- VIN is authoritative upstream identity
- Driver attribution is derived from assignments + trip time overlap
- Raw telemetry is immutable
- All compliance and safety metrics must be reproducible
- Multi-tenant isolation is mandatory

---

End of Document
