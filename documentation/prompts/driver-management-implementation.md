Implement “Driver Management” per onpoint-driver-management-requirements-enhanced.md.

Scope
	•	Backend (AWS serverless): DynamoDB schema + CloudFormation updates, Lambdas, REST API (API Gateway), unit tests, minimal e2e smoke tests.
	•	UI (React): Driver Profile pages, Assignments UI, Driver Dashboard with KPI cards + drilldowns.
	•	Must follow existing repo patterns: nested CFN stacks, env files, shared onpoint_common layer, RBAC + tenant isolation, idempotency, audit logging.

Read requirements from
	•	onpoint-driver-management-requirements-enhanced.md
	•	Existing tenancy docs already in repo (multi-tenant late binding + VIN registry)

Deliverables
	1.	DynamoDB
	•	Create/extend tables needed for driver profiles, driver assignments, driver rollups (if needed), and driver audit.
	•	If adding GSI(s), use the repo’s staged-deploy pattern (avoid illegal GSI updates). Document the deploy sequence in README.
	2.	APIs
Implement REST endpoints (consistent with existing patterns):
	•	POST /tenants/{tenantId}/drivers
	•	GET /tenants/{tenantId}/drivers?fleetId=&status=&limit=&nextToken=
	•	GET /tenants/{tenantId}/drivers/{driverId}
	•	PATCH /tenants/{tenantId}/drivers/{driverId}
	•	POST /tenants/{tenantId}/drivers/{driverId}:deactivate and :activate
	•	POST /tenants/{tenantId}/drivers/{driverId}/assignments (effective-dated)
	•	GET /tenants/{tenantId}/drivers/{driverId}/assignments
	•	GET /tenants/{tenantId}/drivers/{driverId}/dashboard?from=&to=&fleetId=
	•	KPI drilldowns:
	•	GET /tenants/{tenantId}/drivers/{driverId}/dashboard/trips?from=&to=&limit=&nextToken=
	•	GET /tenants/{tenantId}/drivers/{driverId}/dashboard/events?from=&to=&type=&limit=&nextToken=
Requirements:
	•	Enforce RBAC (PlatformAdmin, TenantAdmin, FleetManager, Dispatcher, ReadOnly) and tenant isolation (403, never 404 for unauthorized).
	•	Use Idempotency-Key where needed (create driver, create assignment, transfers).
	•	Write audit log entries for all mutations.
	3.	Telemetry-based metrics
	•	Implement metric computation using existing tables:
	•	Use onpoint-dev-telemetry-events + driver assignments (effective dates) to attribute trip/events to a driver.
	•	Compute: total miles, driving time, night miles, avg speed, top speed, idling time, harsh events, collision, seatbelt violations, overspeed (standard/severe), safety score (reuse existing scoring rules where possible).
	•	Prefer reusing existing trip summaries when available; fall back to events scan when not.
	•	Add a lightweight caching/rollup strategy if needed (optional) but keep cost low.
	4.	Lambdas
	•	Add a new lambda driver_management_api (or extend existing fleet-tenancy api if already structured for drivers) following repo conventions.
	•	Update CFN nested templates to deploy it with correct env vars and IAM least privilege.
	•	Update scripts so deploy_lambda.sh works with env/dev/.json.
	5.	React UI
	•	Add routes/screens:
	•	Driver List
	•	Driver Create/Edit
	•	Driver Details (profile + assignments)
	•	Driver Dashboard (KPI tiles; click opens drilldown table)
	•	Keep existing theme/styles; use design-token strategy described in repo docs.
	•	Add tenant context switch UX (platform admin) and fleet filter UX (tenant admin/user).
	6.	Testing
	•	Unit tests for:
	•	RBAC enforcement
	•	tenant isolation
	•	idempotency behavior
	•	assignment overlap validation
	•	dashboard metric calculations with fixtures
	•	E2E smoke script(s) to:
	•	create tenant + driver
	•	assign driver to VIN
	•	call dashboard endpoints (assert expected shape)

Process
	•	First: scan the current repo structure (cfn/, lambdas/, env/, scripts/, onpoint_common/).
	•	Then: propose a concrete implementation plan in docs/driver-management-plan.md (short).
	•	Then: implement incrementally with commits:
	1.	CFN + tables
	2.	Lambda APIs
	3.	Metrics + drilldowns
	4.	React pages
	5.	Tests + docs

Constraints
	•	Keep costs low (PAY_PER_REQUEST, minimal GSIs).
	•	Do not break existing stacks; changes must be additive or staged.
	•	Follow existing naming conventions: onpoint-${Env}-...
	•	Keep raw telemetry immutable; derived data only.
	•	Use VIN + tripId as authoritative identifiers.

Proceed now: create the plan doc, then start implementing step-by-step.                                                                                                                                                                                                                                                                                                         