# OnPoint Multi‑Tenancy Requirements (Fleet & Telematics)

## 1. Scope and Context
OnPoint is a multi‑tenant fleet and telematics platform serving enterprise and mid‑market fleet operators.
Upstream data providers (e.g., CerebrumX) **do NOT send tenant, customer, or fleet identifiers**.

**Authoritative identifiers from upstream:**
- `VIN`
- `tripId`

All tenancy, authorization, and isolation must therefore be derived internally using a **late‑binding tenancy model**.

---

## 2. Industry‑Standard Tenancy Model (Late Binding)

### 2.1 Authoritative Identity
- **VIN is the global vehicle identity**
- **tripId is scoped to VIN**
- Tenant, customer, and fleet are **derived attributes**, never trusted from upstream

### 2.2 VIN Registry (System of Record)
OnPoint SHALL maintain a VIN Registry that maps:
- VIN → Tenant
- VIN → Customer
- VIN → Fleet
- Effective date ranges (to support reassignment)

This registry is the **sole authority** for tenancy resolution.

---

## 3. Ingestion & Storage Model

### 3.1 Raw Event Ingestion (Immutable)
- Raw events MUST be stored exactly as received
- No tenant/fleet/customer fields may be injected at ingestion time
- Raw events are immutable and append‑only

**Primary Key Example**
```
PK = VEHICLE#{VIN}
SK = TS#{eventTime}#MSG#{messageId}
```

### 3.2 Normalized Events
- Normalized events MAY include derived tenant/fleet IDs
- Derived attributes MUST be recomputable
- No normalized data may override raw facts

---

## 4. Tenancy Resolution

### 4.1 Resolution Flow
1. Receive event with VIN + tripId
2. Persist raw event
3. Resolve VIN via VIN Registry
4. Attach derived tenant/fleet metadata
5. Emit normalized event

### 4.2 Late Binding Rules
- Tenancy is resolved **at read time or normalization time**
- Historical reprocessing MUST be supported if VIN ownership changes

---

## 5. Authorization & Access Control

### 5.1 Read Isolation
- APIs MUST enforce tenant isolation using resolved VIN ownership
- Access to a VIN outside tenant scope is forbidden

### 5.2 Write Isolation
- No client may write data for a VIN they do not own
- Admin workflows are required for VIN reassignment

---

## 6. VIN Reassignment & Lifecycle

### 6.1 Reassignment Support
- VINs MAY change tenant or fleet over time
- Registry MUST support effectiveFrom / effectiveTo timestamps

### 6.2 Historical Integrity
- Historical events remain unchanged
- Re‑querying with a new tenant context MUST respect effective dates

---

## 7. API Behavior

### 7.1 Trip & Event APIs
- APIs accept VIN and tripId only
- Tenant context is derived from caller identity + VIN registry
- Example:
```
GET /trips/{vin}/{tripId}/events
```

### 7.2 Authorization Enforcement
- Caller tenant MUST match VIN registry ownership
- Failure returns 403 (not 404)

---

## 8. Audit & Compliance

### 8.1 Audit Requirements
- All VIN → tenant mappings are auditable
- Reassignment actions require:
  - Who
  - When
  - Reason

### 8.2 Compliance
- Raw events must support legal hold
- Tenancy logic must be deterministic and replayable

---

## 9. Testing Requirements

### 9.1 Unit Tests
- VIN resolution logic
- Unauthorized VIN access
- Reassignment edge cases

### 9.2 Integration Tests
- Cross‑tenant isolation
- Historical replay after reassignment
- Trip/event APIs using VIN + tripId only

---

## 10. Non‑Goals
- Trusting upstream tenant or fleet identifiers
- Hard‑binding tenant at ingestion time
- Mutating raw event data

---

## 11. Summary (Authoritative Principles)
- **VIN is king**
- **Tenancy is derived, never ingested**
- **Raw data is immutable**
- **Late binding enables correctness, compliance, and scale**
