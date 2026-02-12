You are working in the OnPoint repo. Implement Geofencing v1 (serverless, DynamoDB + Lambda + REST APIs) end-to-end, using these requirement files as the authoritative source of truth:
	•	onpoint-geofencing-requirements-detailed.md
	•	onpoint-multitenancy-requirements.md
	•	onpoint-fleet-tenancy-management-requirements.md
	•	vehicle-state-requirements.md

Constraints
	•	AWS native serverless only (DynamoDB, Lambda, API Gateway, EventBridge, SQS optional).
	•	Cost conscious: no OpenSearch, no complex GIS services, no expensive third-party geo APIs.
	•	Follow OnPoint late-binding tenancy: upstream has only VIN+tripId; tenant/fleet resolved internally via VIN registry.
	•	Keep changes non-invasive to existing stacks; add a new nested stack geofencing.yaml and wire it from cfn/root.yaml without breaking current deployments.
	•	Do not add GSIs unless explicitly needed; if needed, justify and keep to 1 max per table.
	•	All resources must use the existing naming convention ${ProjectName}-${Env}-... and KMS alias/aws/dynamodb.
	•	Provide unit tests + minimal integration test scripts (curl-based) for the new APIs.

⸻

Deliverables (create these files)

1) CloudFormation (Nested Stack)

Create:
	•	cfn/nested/geofencing.yaml
Update:
	•	cfn/root.yaml to include a new GeofencingStack nested stack (versioned path support if root uses TemplateVersion).

geofencing.yaml MUST create the following DynamoDB tables (PAY_PER_REQUEST):
	1.	GeofenceDefinitionsTable
	•	Purpose: store geofence definitions + versions + scheduling metadata
	•	PK/SK pattern:
	•	PK = TENANT#{tenantId}#GEOFENCE#{geofenceId}
	•	SK = VERSION#{version}#EFFECTIVE_FROM#{effectiveFromIso}
	•	Attributes: type, geometry, priority, schedule, status, createdBy, reason, tags, hash, etc.
	•	No TTL.
	2.	GeofenceAssignmentsTable
	•	Purpose: inheritance/overrides/exclusions binding geofences to tenant/customer/fleet/VIN
	•	PK/SK pattern:
	•	PK = TENANT#{tenantId}
	•	SK = SCOPE#{scopeType}#{scopeId}#GEOFENCE#{geofenceId}
	•	Attributes: include/exclude/override flags, priority overrides, effectiveFrom/To.
	•	No TTL.
	3.	GeofenceStateTable
	•	Purpose: latest per-vehicle per-geofence state for debounce/hysteresis/dwell tracking
	•	PK/SK:
	•	PK = VIN#{vin}
	•	SK = GEOFENCE#{geofenceId}
	•	Attributes: inside/outside, lastTransitionTime, dwellStartTime, lastLatLon, lastEventTime, lastEvalHash, etc.
	•	Optional TTL off for now.
	4.	GeofenceEventsTable
	•	Purpose: immutable event log (ENTER/EXIT/DWELL_START/DWELL_END/VIOLATION/TRANSIT/ROUTE_DEVIATION)
	•	PK/SK:
	•	PK = TENANT#{tenantId}#VIN#{vin}
	•	SK = TS#{eventTimeIso}#GEOFENCE#{geofenceId}#TYPE#{eventType}
	•	TTL enabled using expiresAt (epoch seconds) via parameter GeofenceEventsTtlDays default 30.

Also add optional:
	•	GeofenceDedupeTable (if needed for idempotent alerts) TTL enabled.
Only add if necessary.

Outputs from stack:
	•	Table names and ARNs
	•	(If APIs created here) API invoke URL(s)

⸻

2) Lambdas (Code + CFN)

Create Lambda code under repo structure:
	•	onpoint_lambdas/lambdas/geofence_processor/app.py
	•	onpoint_lambdas/lambdas/geofence_api/app.py
	•	onpoint_lambdas/lambdas/geofence_admin_api/app.py (optional if you want separation; otherwise merge into one API lambda)

And update cfn/nested/lambdas.yaml (or create cfn/nested/geofencing_lambdas.yaml if cleaner) to deploy these with:
	•	The common layer (onpoint_common_layer) attached
	•	Least-privilege IAM policies (DynamoDB tables + Kinesis read if used + EventBridge put if used)
	•	Environment variables for table names and key config
	•	Memory/timeouts tuned conservatively (e.g., 512MB, 10–20s)

2.1 Geofence Processor Lambda

Triggered by:
	•	Option A (preferred, non-invasive): DynamoDB Streams on TelemetryEventsTable for NEW_IMAGE events
OR
	•	Option B: SQS queue fed by telematics_processor (only if Streams isn’t available)

Pick Option A unless impossible.

Processor responsibilities:
	•	Resolve tenant/fleet/customer for VIN using VIN registry table (late-binding, effective time).
	•	Load applicable geofences using assignment rules (inheritance, overrides, exclusions, priority).
	•	Evaluate geometry:
	•	Circle: haversine distance <= radius
	•	Polygon: point-in-polygon (ray casting)
	•	Corridor: v1 can be “not supported” but keep stubs per requirement
	•	Apply accuracy/stability rules:
	•	debounce window
	•	hysteresis buffer
	•	dwell thresholds
	•	Emit events to:
	•	GeofenceEventsTable (immutable)
	•	Update GeofenceStateTable
	•	Optionally EventBridge for subscribers later

Must support multiple matches per telemetry point.

2.2 Geofence API Lambda (Front-end query)

Provide query endpoints for:
	•	List geofence events by VIN and time range
	•	List geofence events by tripId (optional)
	•	Get geofence state for a VIN (active geofences inside/outside + dwell)

Return shapes must be consistent and paginated with nextToken.

2.3 Geofence Admin API Lambda (CRUD)

Provide management endpoints (tenant-scoped + RBAC):
	•	Create geofence (new geofenceId + version 1)
	•	Update geofence (create new version)
	•	Activate/deactivate
	•	Soft delete
	•	Assign to scope (tenant/customer/fleet/VIN)
	•	Exclude inherited geofence at lower scope
	•	List geofences (with latest version only by default)
	•	Get geofence history (versions)

Enforce RBAC using existing model (PlatformAdmin vs TenantAdmin vs others).

⸻

3) API Gateway (REST API, API Key required)

Add a new nested template:
	•	cfn/nested/geofencing_api.yaml
Wire it in cfn/root.yaml.

Create a REST API named:
	•	${ProjectName}-${Env}-geofencing-api

Routes:
	•	GET /geofences (admin list)
	•	POST /geofences (admin create)
	•	PUT /geofences/{geofenceId} (admin update -> new version)
	•	POST /geofences/{geofenceId}:activate
	•	POST /geofences/{geofenceId}:deactivate
	•	DELETE /geofences/{geofenceId} (soft delete)
	•	POST /geofences/{geofenceId}/assignments (scope assignment)
	•	GET /geofences/{geofenceId}/versions
	•	GET /vehicles/{vin}/geofence-events?from=&to=&limit=&nextToken=
	•	GET /trips/{tripId}/geofence-events?from=&to=&limit=&nextToken=
	•	GET /vehicles/{vin}/geofence-state

All endpoints:
	•	Require API Key
	•	Pass through Authorization header (Cognito) if present
	•	Return CORS headers

Add the required AWS::Lambda::Permission resources.

⸻

Testing
	1.	Add unit tests (pytest) for:

	•	point-in-polygon
	•	circle distance/haversine
	•	inheritance + override/exclusion resolution
	•	debounce/dwell logic

	2.	Add integration test scripts:

	•	scripts/test_geofence_admin.sh
	•	scripts/test_geofence_events.sh
Using curl and API key, with sample geofence create → assign → inject synthetic telemetry event into TelemetryEventsTable → verify events emitted.

⸻

Final tasks
	•	Ensure pre-commit run -a passes.
	•	Ensure templates validate with aws cloudformation validate-template.
	•	Update docs:
	•	docs/geofencing/README.md describing architecture, tables, APIs, and how to test.
	•	Include Mermaid diagrams for event flow and table relationships.

Implement all of the above now.
