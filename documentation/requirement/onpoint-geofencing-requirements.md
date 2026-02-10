# OnPoint Geofencing Requirements (Authoritative)

## 1. Purpose
Geofencing in OnPoint is an event-driven, tenant-aware capability layered on top of telematics ingestion. It supports operational visibility, compliance, safety, and workflow automation. Geofencing is not a UI-only or visualization feature.

## 2. Tenancy & Ownership Model
- Every geofence is owned by a Tenant
- Optional scoping: Customer, Fleet
- Vehicle applicability is determined by VIN ownership via the VIN Registry (late binding)

## 3. Geofence Definition
Each geofence includes:
- geofenceId
- tenantId
- Optional customerId / fleetId
- Geometry: Circle or Polygon (GeoJSON)
- Rules: ENTER, EXIT, DWELL

## 4. Evaluation Model
- Server-side only
- Triggered by telemetry ingestion
- Deterministic and replayable

## 5. Geofence Events
Stored immutably with:
- vin, tripId, geofenceId
- eventType, eventTime
- tenantId, fleetId

## 6. APIs
- CRUD geofences
- List geofence events by VIN / trip / time

## 7. UI
- Admin management
- Fleet visualization
- Map is visualization only

## 8. Audit & Compliance
- All changes audited
- Supports legal hold

## 9. Non-Goals
- No frontend computation
- No upstream dependency

## 10. Principles
- VIN is authoritative
- Late binding
- Immutable events
