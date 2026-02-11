# OnPoint User Manual

Last updated: 10 February 2026

**Sources used (requirements and manuals):**
- [documentation/requirement/onpoint-geofencing-requirements-detailed.md](../../documentation/requirement/onpoint-geofencing-requirements-detailed.md)
- [documentation/requirement/onpoint-multitenancy-requirements.md](../../documentation/requirement/onpoint-multitenancy-requirements.md)
- [documentation/requirement/onpoint-user-tenant-fleet-requirements.md](../../documentation/requirement/onpoint-user-tenant-fleet-requirements.md)
- [documentation/requirement/onpoint-fleet-tenancy-management-requirements.md](../../documentation/requirement/onpoint-fleet-tenancy-management-requirements.md)
- [documentation/requirement/onpoint-vehicle-state-requirements.md](../../documentation/requirement/onpoint-vehicle-state-requirements.md)
- [documentation/user-manual/onpoint-tenancy-user-management-manual.md](../../documentation/user-manual/onpoint-tenancy-user-management-manual.md)

> **Note:** This manual reflects the current React UI implementation. Items that exist in requirements but are not implemented in the UI are marked as **Planned / Not Yet Available**.

---

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Navigation & UI Walkthrough](#navigation--ui-walkthrough)
4. [Tenancy & Access Control](#tenancy--access-control)
5. [Tenant / Customer / Fleet / Vehicle / Driver Management](#tenant--customer--fleet--vehicle--driver-management)
6. [Telematics & Trips](#telematics--trips)
7. [Geofencing](#geofencing)
8. [Overspeed / PSL](#overspeed--psl)
9. [Troubleshooting](#troubleshooting)
10. [Appendix](#appendix)

---

## Overview
OnPoint is a multi-tenant fleet and telematics platform built on AWS serverless services. It emphasizes strict tenant isolation, late-bound vehicle ownership (VIN registry), and role-based access control.

### Supported Personas
- **Platform Admin**: Global administration across all tenants.
- **Tenant Admin**: Manages tenant users, fleets, and vehicles within a tenant.
- **Tenant User / Fleet Manager / Dispatcher / ReadOnly**: Operational access scoped to assigned tenant and fleets.

### Glossary
- **Tenant**: The primary security and data isolation boundary.
- **Customer**: Optional subdivision under a tenant (e.g., business unit).
- **Fleet**: Operational grouping of vehicles (often tied to a customer).
- **Vehicle (VIN)**: Global vehicle identity. VIN is the authoritative identifier.
- **Driver**: Driver identity that can be assigned to vehicles.
- **Trip**: A journey linked to a VIN and tripId.
- **Telemetry Event**: Raw or normalized telematics message.
- **Geofence**: A defined geographic boundary with alert rules.
- **Overspeed**: Driving above a posted speed limit or policy threshold.
- **Alerts**: Notifications triggered by rules (geofence events, overspeed, etc.).

---

## Getting Started
### Accessing the UI
- The UI is a single-page React application.
- For local development, the app runs on http://localhost:5173/.

### Login / Authentication Model (Cognito)
- The UI uses Amazon Cognito User Pools for authentication.
- JWT tokens are used for API access.
- The UI relies on environment variables for Cognito configuration.

> **Note:** If Cognito configuration is missing, the UI shows an “Auth UserPool not configured” message.

### Required API Keys (if applicable)
The UI can use API keys for API Gateway. Configure in environment variables:
- VITE_ONPOINT_API_KEY
- VITE_TRIP_SUMMARY_API_KEY
- VITE_VEHICLE_STATE_API_KEY

### Environment Selection (dev/prod)
- **Local / dev**: .env or .env.local
- **Production**: .env.production
- Runtime base URLs can point to API Gateway endpoints or a proxy.

---

## Navigation & UI Walkthrough
The navigation is driven by React Router and the sidebar. Platform Admin-only pages appear in a separate section.

### Global Layout
- **Topbar**: Tenant and fleet selectors (hidden on platform admin routes). Shows current user and sign-out.
- **Sidebar**: Primary navigation.
- **Footer**: OnPoint © 2026.

### Routes Overview
- **Tenant routes** (available to authenticated users):
  - /adlp/dashboard
  - /adlp/tracking/live
  - /adlp/tracking/trips
  - /adlp/telemetry/raw
  - /adlp/telemetry/normalized
  - /adlp/geofence/manage
  - /adlp/geofence/report
  - /adlp/geofence/alerts
  - /adlp/geofence/setup
  - /adlp/vehicles/vin-summary
  - /adlp/vehicles/vin-history
  - /adlp/vehicles/consent
  - /adlp/drivers/dashboard
  - /adlp/drivers/add
  - /adlp/drivers/assign
  - /adlp/drivers/summary
  - /adlp/trips/planning
  - /adlp/trips/add
  - /adlp/trips/optimize
  - /adlp/trips/live
  - /adlp/trips/dvir
  - /adlp/reports
  - /adlp/safety-events
  - /adlp/live-feed
  - /adlp/users
  - /adlp/groups
  - /adlp/config
  - /adlp/notifications
  - /adlp/faq

- **Platform Admin routes** (Platform Admin only):
  - /adlp/platform/dashboard
  - /adlp/platform/tenants
  - /adlp/platform/customers
  - /adlp/platform/fleets
  - /adlp/platform/users
  - /adlp/platform/drivers
  - /adlp/platform/vehicles
  - /adlp/platform/vehicle-assignments
  - /adlp/platform/driver-assignments

> **Planned / Not Yet Available:** Several routes contain placeholders (see page sections below).

---

### Tenant Dashboard
**Route:** /adlp/dashboard

**Purpose**: Tenant-level overview of fleets, vehicles, drivers, users, and recent trips.

**Inputs / Filters**
- Uses tenant context (Topbar selector). No local filters.

**Tables / Fields**
- **Fleet Breakdown**: Fleet, Status, Vehicles.
- **Recent Trips**: Trip, Vehicle, Ended, Miles, Safety, Status.

**Actions**
- None on this page.

**Empty / Error States**
- “No fleets available” and “No trips available” messages.
- Warning banner if any data source fails.

**Permissions**
- Requires authenticated user with tenant context.

**Screenshot**
- ![Tenant Dashboard](images/tenant-dashboard.png)

---

### Fleet Dashboard
**Route:** /adlp/fleet/:fleetId/dashboard

**Purpose**: Fleet KPIs (Fuel, Maintenance, Safety).

**Status**: **Planned / Not Yet Available** (placeholder content).

**Screenshot**
- ![Fleet Dashboard](images/fleet-dashboard.png)

---

### Live Tracking
**Route:** /adlp/tracking/live

**Purpose**: Real-time vehicle locations on a map and a live vehicle feed.

**Inputs / Filters**
- Fleet selector
- Vehicle (VIN) selector

**Tables / Fields**
- VIN, Last Event, Latitude, Longitude, Speed (mph)

**Actions**
- Select a vehicle to focus map and highlight row.

**Empty / Error States**
- “No vehicle locations available.”

**Permissions**
- Tenant users with access to selected fleet.

**Screenshot**
- ![Live Tracking](images/live-tracking.png)

---

### Trip History
**Route:** /adlp/tracking/trips

**Purpose**: Historical trip list with map replay and trip events.

**Inputs / Filters**
- Date range (today, last 7/30/90, custom)
- From/To (custom)
- VIN selector
- Status (All/Completed/In Progress/Canceled)
- Search (trip ID or driver)

**Tables / Fields**
- Trip ID
- VIN
- Start / End
- Miles
- Duration
- Status
- Alerts (overspeed count)

**Actions**
- Export (placeholder)
- Refresh
- Select a trip to see map and event details

**Empty / Error States**
- “Select a fleet or VIN to load trips”
- Loading / error messages on fetch failure

**Permissions**
- Tenant users with access to VINs.

**Screenshot**
- ![Trip History](images/trip-history.png)

---

### Telemetry (Raw)
**Route:** /adlp/telemetry/raw

**Purpose**: Inspect raw telemetry payloads (sample data in UI).

**Inputs / Filters**
- Provider, VIN, Trip ID, Level, Search summary

**Tables / Fields**
- Stream list with event metadata (VIN, provider, timestamp, size, status)
- Event inspector (overview, payload, headers)

**Actions**
- Refresh stream (UI action only)
- Pause (UI action only)

**Empty / Error States**
- “No matching events” for filter results

**Permissions**
- Authenticated tenant users.

**Screenshot**
- ![Telemetry Raw](images/telemetry-raw.png)

---

### Telemetry (Normalized)
**Route:** /adlp/telemetry/normalized

**Status**: **Planned / Not Yet Available** (placeholder).

**Screenshot**
- ![Telemetry Normalized](images/telemetry-normalized.png)

---

### Geofence – Manage
**Route:** /adlp/geofence/manage

**Purpose**: Review and manage geofence library.

**Inputs / Filters**
- Search (name/description)
- Status (All/Active/Inactive)
- Type (Circle/Polygon/Rectangle/Point)
- Fleet (optional)

**Tables / Fields**
- Name, Type, Status, Fleet, Updated

**Actions**
- Activate / Deactivate
- Delete
- Select a geofence to preview on map

**Empty / Error States**
- “No geofences yet” state

**Permissions**
- Tenant users with access to geofence tenant.

**Screenshot**
- ![Geofence Manage](images/geofence-manage.png)

---

### Geofence – Setup
**Route:** /adlp/geofence/setup

**Purpose**: Draw and save geofences.

**Inputs**
- Name, Description, Fleet scope, Status
- Map draw tools (circle, rectangle, polygon, marker)

**Actions**
- Draw geometry
- Save geofence
- Clear map

**Notes**
- Geofences are stored locally (per tenant) in browser storage in the current UI implementation.

**Screenshot**
- ![Geofence Setup](images/geofence-setup.png)

---

### Geofence – Alerts
**Route:** /adlp/geofence/alerts

**Purpose**: Configure alert rules per geofence.

**Inputs**
- Search geofence
- Alert toggles: Enter, Exit, Dwell
- Channel toggles: Email, SMS, Webhook

**Actions**
- Toggle alert and channel settings

**Status**
- Rules are saved in local storage only (not yet connected to backend).

**Screenshot**
- ![Geofence Alerts](images/geofence-alerts.png)

---

### Geofence – Report
**Route:** /adlp/geofence/report

**Purpose**: Summary of geofence inventory.

**Tables / Fields**
- Totals (Active/Inactive)
- By Type
- Geofence Details (Name, Type, Status, Fleet, Updated)

**Screenshot**
- ![Geofence Report](images/geofence-report.png)

---

### Vehicles – VIN Summary
**Route:** /adlp/vehicles/vin-summary

**Purpose**: View vehicles for selected tenant and fleet.

**Inputs / Filters**
- Tenant (topbar)
- Fleet (topbar)

**Fields**
- VIN, Status, Fleet, Make/Model/Year

**Empty / Error States**
- Requires tenant + fleet selection

**Screenshot**
- ![VIN Summary](images/vin-summary.png)

---

### Vehicles – VIN History
**Route:** /adlp/vehicles/vin-history

**Status**: **Planned / Not Yet Available**

**Screenshot**
- ![VIN History](images/vin-history.png)

---

### Vehicles – Consent
**Route:** /adlp/vehicles/consent

**Status**: **Planned / Not Yet Available**

**Screenshot**
- ![Vehicle Consent](images/vehicle-consent.png)

---

### Drivers – Dashboard / Summary
**Routes:**
- /adlp/drivers/dashboard
- /adlp/drivers/summary

**Purpose**: View drivers by tenant and fleet.

**Inputs**
- Tenant (topbar)
- Fleet (topbar)

**Fields**
- Driver ID, Name, Status, Fleet ID, Email, Phone

**Status**
- Both pages show the same driver list currently.

**Screenshot**
- ![Driver Summary](images/driver-summary.png)

---

### Drivers – Add / Assign
**Routes:**
- /adlp/drivers/add
- /adlp/drivers/assign

**Status**: **Planned / Not Yet Available** (placeholders).

**Screenshot**
- ![Driver Add](images/driver-add.png)
- ![Driver Assign](images/driver-assign.png)

---

### Trips (Planning / Add / Live / Optimize / DVIR)
**Routes:**
- /adlp/trips/planning
- /adlp/trips/add
- /adlp/trips/live
- /adlp/trips/optimize
- /adlp/trips/dvir

**Status**: **Planned / Not Yet Available** (placeholders).

**Screenshot**
- ![Trip Planning](images/trip-planning.png)
- ![Add Trip](images/trip-add.png)
- ![Live Trip](images/trip-live.png)
- ![Route Optimization](images/route-optimization.png)
- ![DVIR](images/dvir.png)

---

### Reports / Live Feed / Safety Events
**Routes:**
- /adlp/reports
- /adlp/live-feed
- /adlp/safety-events

**Status**: **Planned / Not Yet Available** (placeholders).

**Screenshot**
- ![Reports](images/reports.png)
- ![Live Feed](images/live-feed.png)
- ![Safety Events](images/safety-events.png)

---

### Users / Groups / Configuration / Notifications / FAQ
**Routes:**
- /adlp/users
- /adlp/groups
- /adlp/config
- /adlp/notifications
- /adlp/faq

**Status**: **Planned / Not Yet Available** (placeholders).

**Screenshot**
- ![Manage Users](images/manage-users.png)
- ![Manage Groups](images/manage-groups.png)
- ![Configuration](images/configuration.png)
- ![Notifications](images/notifications.png)
- ![FAQ](images/faq.png)

---

## Platform Admin UI Walkthrough
Platform Admin routes require the Platform Admin role. These pages manage global tenancy and domain entities.

### Platform Dashboard
**Route:** /adlp/platform/dashboard

**Purpose**: Global counts and tenant health.

**Tables / Fields**
- Tenant, Status, Fleets, Vehicles, Drivers, Users, Health

**Screenshot**
- ![Platform Dashboard](images/platform-dashboard.png)

---

### Tenants
**Route:** /adlp/platform/tenants

**Purpose**: Create and update tenants; view tenant configuration and status.

**Inputs**
- Search by name/ID
- Create Tenant modal (Name, Tenant ID, Retention days, Config JSON, Reason)

**Tables / Fields**
- Tenant Name, Tenant ID, Status, Created

**Actions**
- Create Tenant
- Update tenant details, retention, status

**Screenshot**
- ![Tenants](images/tenant-list.png)

---

### Customers
**Route:** /adlp/platform/customers

**Purpose**: Create and manage customers scoped to a tenant.

**Inputs**
- Tenant selector
- Search by customer name/ID
- Create Customer modal (ID, Name, Reason)

**Tables / Fields**
- Customer Name, Customer ID, Status

**Screenshot**
- ![Customers](images/customer-list.png)

---

### Fleets
**Route:** /adlp/platform/fleets

**Purpose**: Create fleets, associate customers, and update policies.

**Inputs**
- Tenant selector
- Search by fleet name/ID/customer
- Create Fleet modal (Fleet ID, Customer ID, Name, Reason)

**Tables / Fields**
- Name, Fleet ID, Customer, Status

**Actions**
- Update policies JSON and reason

**Screenshot**
- ![Fleets](images/fleet-list.png)

---

### Users
**Route:** /adlp/platform/users

**Purpose**: Provision tenant users and manage roles/status.

**Inputs**
- Tenant selector
- Search by name/email/ID
- Create User modal (email, name, roles or Create Admin)

**Tables / Fields**
- Email, Name, Roles, Status

**Actions**
- Update roles
- Enable/Disable user

**Screenshot**
- ![Platform Users](images/platform-users.png)

---

### Drivers
**Route:** /adlp/platform/drivers

**Purpose**: Create and update driver records.

**Inputs**
- Tenant selector
- Fleet filter
- Create Driver modal (Driver ID, Customer ID, Metadata JSON, Reason)

**Tables / Fields**
- Name, Driver ID, Fleet ID, Customer ID, Status

**Screenshot**
- ![Platform Drivers](images/platform-drivers.png)

---

### Vehicles
**Route:** /adlp/platform/vehicles

**Purpose**: Register vehicles and update metadata/status.

**Inputs**
- Tenant selector
- Fleet selector
- Search by VIN/make/model/fleet
- Create Vehicle modal (VIN, make, model, year, status)

**Tables / Fields**
- VIN, Make, Model, Year, Status (resizable columns)

**Actions**
- Update status, asset tags, metadata
- Optional VIN assignment after create (requires reason)

**Screenshot**
- ![Platform Vehicles](images/platform-vehicles.png)

---

### Vehicle Assignments
**Route:** /adlp/platform/vehicle-assignments

**Purpose**: Assign VINs to tenant/fleet and review assignment history.

**Inputs**
- Tenant, Fleet, VIN
- Customer ID (optional)
- Effective From/To (ISO)
- Reason

**Tables / Fields**
- Tenant, Fleet, Customer, Effective From, Effective To

**Screenshot**
- ![Vehicle Assignments](images/vehicle-assignments.png)

---

### Driver Assignments
**Route:** /adlp/platform/driver-assignments

**Purpose**: Assign drivers to VINs and review assignment history.

**Inputs**
- Tenant, Fleet, VIN, Driver
- Effective From/To (ISO)
- Assignment type, Reason

**Tables / Fields**
- Tenant, VIN, Type, Effective From, Effective To

**Screenshot**
- ![Driver Assignments](images/driver-assignments.png)

---

## Tenancy & Access Control
### Tenant Isolation (Late Binding)
- Tenant, customer, and fleet are derived from VIN Registry at read time.
- Upstream VIN + tripId are authoritative; tenant headers are not trusted.

### Role Matrix (UI + API expectations)
| Action | Platform Admin | Tenant Admin | Fleet Manager | Dispatcher | ReadOnly |
|---|---|---|---|---|---|
| View platform dashboards | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage customers/fleets (platform pages) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage tenant users | ✅ | ✅ | ❌ | ❌ | ❌ |
| View fleet tracking | ✅ | ✅ | ✅ | ✅ | ✅ |
| View trip history | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/assign vehicles | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create/assign drivers | ✅ | ✅ | ✅ | ✅ | ❌ |
| Geofence setup/manage | ✅ | ✅ | ✅ | ✅ | ✅ (read-only) |

> **Note:** The UI enforces Platform Admin access to platform routes. Additional role enforcement is expected server-side (403 on unauthorized access).

### 403 vs 404
- Authorization failures must return **403**, not 404.
- UI expects tenant isolation to be enforced by APIs.

### VIN Ownership & Visibility
- VIN access is determined by the VIN Registry and effective time windows.
- Reassignment does not mutate historical telemetry; access uses effectiveFrom/effectiveTo rules.

---

## Tenant / Customer / Fleet / Vehicle / Driver Management
This section combines requirements and current UI.

### Create Tenant (Platform Admin)
**UI:** Platform Admin – Tenants

**Required fields**
- Tenant name
- Tenant ID (auto-suggested from name or custom)
- Retention days

**Validation**
- Retention days must be a positive number
- JSON config must be valid if provided

**Steps**
1. Open Tenants page.
2. Click Create Tenant.
3. Provide name, retention policy, optional config JSON, reason.
4. Save.

**Planned / Not Yet Available**
- Audit log viewing (tab present but not connected).

---

### Create Customer (Platform Admin)
**UI:** Platform Admin – Customers

**Required fields**
- Tenant
- Customer name

**Steps**
1. Select tenant.
2. Click Create Customer.
3. Provide name and optional ID/reason.

---

### Create Fleet (Platform Admin)
**UI:** Platform Admin – Fleets

**Required fields**
- Tenant
- Fleet name or ID

**Steps**
1. Select tenant.
2. Click Create Fleet.
3. Provide fleet ID, customer ID (optional), name, reason.

**Policies**
- Policies are JSON fields stored with fleet and editable in UI.

---

### Register Vehicle Metadata (Platform Admin)
**UI:** Platform Admin – Vehicles

**Required fields**
- VIN
- Status (default Active)

**Optional fields**
- Make, Model, Year
- Asset tags
- Metadata JSON

**Steps**
1. Select tenant and (optional) fleet.
2. Create vehicle with VIN and metadata.
3. Optionally assign VIN immediately with a reason.

---

### VIN Assignment / Transfer
**UI:** Platform Admin – Vehicle Assignments

**Required fields**
- VIN
- Tenant
- Effective From (ISO8601)
- Reason

**Optional fields**
- Fleet
- Customer
- Effective To

**Behavior / Requirements**
- Assignment is time-bound with effectiveFrom/effectiveTo.
- Assignments are idempotent (idempotency-key header).
- Reassignments should preserve historical integrity.

---

### Create Drivers
**UI:** Platform Admin – Drivers

**Required fields**
- Tenant

**Optional fields**
- Driver ID
- Customer ID
- Fleet ID
- Metadata JSON
- Reason

---

### Driver Assignment
**UI:** Platform Admin – Driver Assignments

**Required fields**
- Driver
- VIN
- Tenant
- Effective From

**Optional fields**
- Effective To
- Assignment Type
- Reason

---

## Telematics & Trips
### Trip List & Details
- Trip list is displayed in **Trip History** using trip summary API.
- Trip details include map path and event list derived from trip events.

**Trip events endpoint behavior (Requirement)**
- /trips/{vin}/{tripId}/events should include normalized + raw payload fields.
- UI currently extracts latitude/longitude to draw a path.

### Vehicle State View
- **Live Tracking** shows vehicle state updates.
- Fields shown: VIN, lastEventTime, speed_mph, vehicleState.

**Update behavior**
- Live Tracking refetches every 30 seconds.

---

## Geofencing
### Supported Types (Requirements)
- Circle, Polygon, Multi-Polygon, Corridor, Point, Dynamic

### Current UI Support
- **Implemented:** Circle, Polygon, Rectangle, Point
- **Planned / Not Yet Available:** Multi-Polygon, Corridor, Dynamic, Schedules, Recurrence, Versioning, Inheritance/Overrides

### Geofence Lifecycle
- UI supports create, update (status), delete.
- Backend lifecycle (schedule, audit, versions) is not yet wired in UI.

### Event Types (Requirements)
- ENTER, EXIT, DWELL_START, DWELL_END, VIOLATION, TRANSIT, ROUTE_DEVIATION, OVERRIDE

### Alerts & Notifications
- UI supports toggles for Enter/Exit/Dwell and channels (Email/SMS/Webhook).
- These are stored locally and not yet sent to backend notifications.

---

## Overspeed / PSL
### Overspeed Definition (Requirements)
- Overspeed events are policy-based and can be standard or severe.

### PSL (Posted Speed Limit)
- Determination and accuracy depend on map data and provider capabilities.
- PSL limitations apply where map coverage is incomplete.

### UI Coverage
- **Trip History** displays overspeed event counts per trip.
- **Telemetry (Raw)** includes sample overspeed payload fields.
- **Planned / Not Yet Available:** Dedicated overspeed report and PSL configuration UI.

---

## Troubleshooting
### Common Errors
- **Missing Authentication Token**: Cognito tokens missing or expired.
- **403 Forbidden**: Role or tenant mismatch.
- **500 Error**: Backend exception or invalid payload.

### CORS Basics
- Ensure the API gateway allows the UI origin.
- Check browser console for CORS errors.

### Collecting Request IDs
- Capture request ID from API responses or browser network panel.
- Provide request ID to support for log correlation.

### Logs & Monitoring
- Backend logs are in **Amazon CloudWatch**.

---

## Appendix
### API Endpoints (Used by UI)
**Base URLs**
- Primary API: VITE_ONPOINT_BASE_URL
- Trip Summary API: VITE_TRIP_SUMMARY_BASE_URL
- Vehicle State API: VITE_VEHICLE_STATE_BASE_URL

**Endpoints**
- GET /tenants
- GET /tenants/{tenantId}
- POST /tenants
- PATCH /tenants/{tenantId}
- GET /customers?tenantId=...
- POST /customers
- PATCH /customers/{customerId}
- GET /fleets?tenantId=...
- POST /fleets
- PATCH /fleets/{fleetId}
- GET /vehicles?tenantId=...&fleetId=...
- POST /vehicles
- PATCH /vehicles/{vin}
- GET /drivers?tenantId=...&fleetId=...
- POST /drivers
- PATCH /drivers/{driverId}
- GET /tenants/{tenantId}/users
- POST /tenants/{tenantId}/users
- POST /platform/tenants/{tenantId}/admins
- PUT /tenants/{tenantId}/users/{userId}/roles
- POST /tenants/{tenantId}/users/{userId}/enable
- POST /tenants/{tenantId}/users/{userId}/disable
- POST /vin-registry/assign
- POST /drivers/{driverId}/assignments
- GET /drivers/{driverId}/assignments
- GET /vehicles/{vin}/driver-assignments
- GET /fleets/{fleetId}/vehicles/state
- GET /fleets/{fleetId}/trips
- GET /trips
- GET /trips/{vin}/{tripId}/events

### Environment Variables (UI)
Required and optional environment variables (values should be set per environment):
- VITE_COGNITO_USER_POOL_ID
- VITE_COGNITO_CLIENT_ID
- VITE_COGNITO_IDENTITY_POOL_ID (optional)
- VITE_ONPOINT_BASE_URL
- VITE_ONPOINT_API_KEY
- VITE_TRIP_SUMMARY_BASE_URL
- VITE_TRIP_SUMMARY_API_KEY
- VITE_VEHICLE_STATE_BASE_URL
- VITE_VEHICLE_STATE_API_KEY
- VITE_ONPOINT_ROLE_OVERRIDE (optional)
- ONPOINT_PROXY_TARGET (dev proxy)
- ONPOINT_TRIP_SUMMARY_PROXY_TARGET (dev proxy)
- ONPOINT_VEHICLE_STATE_PROXY_TARGET (dev proxy)

### Data Retention / TTL Notes
- Tenant retention policies are configurable (default: 90 days in UI config).
- Raw telemetry data is immutable and stored for compliance; retention is enforced by backend policy.

---

## Planned / Not Yet Available Summary
- Telemetry Normalized view
- Reports / Live Feed / Safety Events pages
- Trip Planning / Add / Live / Optimize / DVIR pages
- VIN History and Vehicle Consent pages
- Geofence advanced types, inheritance, schedules, and versioning
- Audit tabs (tenants, customers, fleets, users, drivers)
