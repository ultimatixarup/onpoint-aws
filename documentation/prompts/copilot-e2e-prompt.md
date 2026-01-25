# Copilot Prompt --- OnPoint E2E Functional Test Suite

## Copilot Prompt

Implement the fully automated end-to-end functional test suite for
OnPoint using pytest.

Authoritative assumptions (do NOT infer alternatives):

1.  Use a single base URL for all APIs:

    -   Read from env var `ONPOINT_BASE_URL`
    -   Example:
        `https://i4mtx1tqw4.execute-api.us-east-1.amazonaws.com/dev`

2.  Authentication:

    -   API Key only via header `x-api-key` (env var `ONPOINT_API_KEY`)
    -   No bearer tokens
    -   No x-tenant-id
    -   No x-role
    -   Tenant isolation is enforced internally via VIN Registry.

3.  Test runner:

    python -m pytest tests/e2e -v

4.  Health endpoint: Implement and test `GET /health`

5.  APIs already exist and must be exercised:

    -   Tenants / Customers / Fleets / Vehicles / Drivers
    -   VIN assignment + transfer
    -   Trip summary: GET /trips/{vin}/{tripId}
    -   Trip events: GET /trips/{vin}/{tripId}/events
    -   Fleet trips
    -   Vehicle latest state

6.  Tenancy model:

    -   VIN + tripId are the only upstream identifiers.
    -   Tenant/fleet/customer are resolved internally via VIN Registry
        (late binding).
    -   Unauthorized VIN access must return HTTP 403.
    -   Raw events are immutable.

7.  Requirements are defined in committed markdown files:

    -   onpoint-multitenancy-requirements.md
    -   onpoint-fleet-tenancy-management-requirements.md

Copilot MUST treat these markdown files as authoritative product
requirements.

## Implementation expectations

-   Create tests/e2e structure.
-   Use pytest + requests.
-   Provide fixtures for base_url, api_key, headers.
-   Seed VIN/TRIP_ID via env.

Write E2E tests covering:

Health: - GET /health returns 200.

Tenancy: - VIN assignment - VIN transfer - Unauthorized VIN access
returns 403.

Fleet lifecycle: - Create tenant/customer/fleet - Assign vehicle -
Assign driver

Trips: - Fetch trip summary by VIN + tripId - Fetch trip events
including raw payload - Pagination via nextToken

Vehicle: - Latest vehicle state.

Negative cases: - Wrong VIN - Cross-tenant VIN - Missing API key

Assertions: - Schema correctness - Required fields present - Raw event
included - Deterministic ordering - Pagination works.

Structure: - Deterministic tests - No hardcoded IDs - Env driven
VIN/TRIP_ID

Deliverables: - pytest suite under tests/e2e - README with run
instructions - requirements.txt if needed

Proceed directly to implementation.
