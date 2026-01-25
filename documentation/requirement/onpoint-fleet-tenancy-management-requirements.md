Below is a comprehensive requirements + necessary APIs set for Tenant, Customer, Fleet, Vehicle (VIN), Driver management for a fleet/telematics product like OnPoint (with your constraint: upstream only provides VIN + tripId).

⸻

1) Core domain requirements

Tenant

Purpose: security + data isolation boundary.

Requirements
	•	Tenant is the hard boundary for access control, configuration, reporting, and data segregation.
	•	Tenant lifecycle: ACTIVE, SUSPENDED, DELETED (soft delete).
	•	Tenant-level config:
	•	retention policies
	•	geofence policies
	•	alert thresholds
	•	feature flags
	•	integration settings (API keys, webhooks)

APIs
	•	POST /tenants
	•	GET /tenants/{tenantId}
	•	PATCH /tenants/{tenantId}
	•	POST /tenants/{tenantId}:suspend
	•	POST /tenants/{tenantId}:activate
	•	GET /tenants (admin only)

⸻

Customer (Business / Billing Entity)

Purpose: contracts, invoicing, legal entity. Not always the isolation boundary.

Requirements
	•	Customer belongs to a tenant (common SaaS) OR can span multiple tenants (MSP/reseller model).
	•	Customer stores billing profile, contract metadata, contacts, service tier.
	•	Customer may own multiple fleets.

APIs
	•	POST /customers
	•	GET /customers/{customerId}
	•	PATCH /customers/{customerId}
	•	GET /customers?tenantId=...
	•	POST /customers/{customerId}:deactivate

⸻

Fleet (Logical grouping under a tenant)

Purpose: operational grouping (region/business unit/policies).

Requirements
	•	Fleet belongs to tenant and usually a customer.
	•	Fleet has policies:
	•	geofences
	•	alert rules
	•	speed limits
	•	reporting cadence
	•	Vehicles belong to fleets (derived via VIN registry).

APIs
	•	POST /fleets
	•	GET /fleets/{fleetId}
	•	PATCH /fleets/{fleetId}
	•	GET /fleets?tenantId=...&customerId=...
	•	POST /fleets/{fleetId}:archive

⸻

Vehicle (VIN) + VIN Registry (Authoritative ownership mapping)

Purpose: OnPoint must late-bind tenancy because upstream sends only VIN + tripId.

Requirements
	•	VIN is global unique vehicle identity.
	•	VIN Registry is the system of record:
	•	VIN → tenant/customer/fleet mapping with effectiveFrom/effectiveTo
	•	status: ACTIVE, INACTIVE, TRANSFERRED
	•	audit trail: who/when/why
	•	VIN ownership must be non-overlapping in time.
	•	VIN transfer requires admin workflow and is auditable.
	•	VIN metadata (make/model/year/asset tags) stored separately from mapping.

APIs
Vehicle master
	•	POST /vehicles (create vehicle record)
	•	GET /vehicles/{vin}
	•	PATCH /vehicles/{vin}
	•	GET /vehicles?tenantId=...&fleetId=...&status=...

VIN registry / assignment
	•	POST /vin-registry/assign
Body: { vin, tenantId, customerId?, fleetId?, effectiveFrom, reason }
	•	POST /vin-registry/transfer
Body: { vin, fromTenantId, toTenantId, toFleetId?, effectiveFrom, reason, approvalRef }
	•	GET /vin-registry/{vin} (history)
	•	GET /vin-registry?tenantId=...&active=true

⸻

Driver

Purpose: driver identity, assignment to vehicles, compliance.

Requirements
	•	Driver belongs to a tenant (and optionally customer/fleet).
	•	Driver can be assigned:
	•	to a vehicle for a time window
	•	to multiple vehicles in a day (shift model)
	•	Maintain driver assignment history (effectiveFrom/effectiveTo).
	•	Drivers can be soft-deactivated (retention/compliance).
	•	(Optional) integrate with HR/IdP.

APIs
Driver
	•	POST /drivers
	•	GET /drivers/{driverId}
	•	PATCH /drivers/{driverId}
	•	GET /drivers?tenantId=...&fleetId=...
	•	POST /drivers/{driverId}:deactivate

Driver ↔ Vehicle assignment
	•	POST /drivers/{driverId}/assignments
Body: { vin, effectiveFrom, effectiveTo?, assignmentType }
	•	GET /drivers/{driverId}/assignments
	•	GET /vehicles/{vin}/driver-assignments

⸻

2) Operational + governance requirements (must-have)

RBAC/ABAC model
	•	Tenant admin vs fleet manager vs analyst vs read-only.
	•	ABAC filters enforced on every query:
	•	tenantId mandatory
	•	fleet scope optional (role dependent)

Audit and evidence
	•	Every create/update/transfer/assign action logs:
	•	actor, time, before/after, reason, correlationId
	•	Exportable evidence pack for compliance.

Idempotency
	•	All write APIs accept Idempotency-Key header.
	•	Transfer/assign endpoints must be idempotent.

⸻

3) Telematics API surface (separate from management)

These are the read APIs users actually call:
	•	GET /trips/{vin}
	•	GET /trips/{vin}/{tripId}
	•	GET /trips/{vin}/{tripId}/events?limit=...&nextToken=...
	•	GET /vehicles/{vin}/latest-state
	•	GET /fleets/{fleetId}/trips?from=...&to=...

Hard rule: tenancy derived from VIN registry + caller identity; upstream never trusted.
