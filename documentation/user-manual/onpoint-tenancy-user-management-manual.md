# OnPoint User Manual --- Tenancy & User Management

## Version

1.0

## Audience

This manual is intended for OnPoint administrators, tenant admins, fleet
managers, and system integrators.

------------------------------------------------------------------------

# 1. Overview

OnPoint is a multi-tenant fleet and telematics platform built on AWS
serverless services.\
It supports strict tenant isolation, late-binding vehicle ownership, and
role-based user access.

Key principles: - VIN is the authoritative vehicle identity - Tenancy is
derived internally - Raw telemetry is immutable - Access is enforced by
tenant context

------------------------------------------------------------------------

# 2. Core Concepts

## 2.1 Tenant

A Tenant represents a company or enterprise customer using OnPoint.

Examples: - Logistics company - Rental fleet operator - Delivery
provider

Each tenant is fully isolated.

------------------------------------------------------------------------

## 2.2 Customer

A Customer is an optional subdivision under a Tenant (business unit,
region, subsidiary).

Tenant → Customers → Fleets

------------------------------------------------------------------------

## 2.3 Fleet

A Fleet is a logical group of vehicles under a customer.

Used for: - Reporting - Geofencing - Policies - Driver assignment

------------------------------------------------------------------------

## 2.4 Vehicle (VIN)

Vehicles are identified globally by VIN.

Upstream systems only provide: - VIN - tripId

OnPoint maps VINs internally to: - Tenant - Customer - Fleet

via the VIN Registry.

------------------------------------------------------------------------

## 2.5 Driver

Drivers may be assigned to vehicles and fleets.

Driver assignments are time-bound and auditable.

------------------------------------------------------------------------

# 3. Identity & User Management

OnPoint uses AWS-native identity services for cost-efficient
scalability.

Primary components: - Amazon Cognito (User Pools) - IAM - API Gateway
authorizers

------------------------------------------------------------------------

## 3.1 User Types

### Platform Admin

-   Global access
-   Tenant provisioning
-   VIN reassignment

### Tenant Admin

-   Manage users
-   Manage customers/fleets
-   Assign vehicles

### Fleet Manager

-   Fleet operations
-   Driver assignment
-   Reporting

### Operator / Viewer

-   Read-only access

------------------------------------------------------------------------

## 3.2 User Creation

Users are created via:

-   Admin Console
-   Cognito Hosted UI
-   Admin APIs

Process: 1. Tenant Admin creates user 2. Cognito sends invitation email
3. User sets password 4. MFA enforced (optional)

------------------------------------------------------------------------

## 3.3 Authentication

Authentication uses:

-   Username/password
-   Optional MFA
-   JWT tokens

Tokens are passed to APIs via:

Authorization: Bearer `<token>`{=html}

------------------------------------------------------------------------

## 3.4 Password Management

Handled by Cognito: - Password reset - Expiry policies - Complexity
rules - Account lockout

No passwords are stored in OnPoint services.

------------------------------------------------------------------------

## 3.5 Role Management

Roles are implemented via Cognito groups:

-   platform-admin
-   tenant-admin
-   fleet-manager
-   viewer

JWT claims carry role and tenant context.

------------------------------------------------------------------------

# 4. Tenancy Management

## 4.1 Tenant Creation

Platform Admin creates Tenant:

-   TenantId
-   Name
-   Status

Tenant record stored in Tenants table.

------------------------------------------------------------------------

## 4.2 Customer Management

Tenant Admin can: - Create customers - Assign fleets

------------------------------------------------------------------------

## 4.3 Fleet Management

Fleet operations: - Create fleet - Assign vehicles - Configure
geofences - Assign drivers

------------------------------------------------------------------------

## 4.4 VIN Registry

VIN Registry maps:

VIN → Tenant → Customer → Fleet

Supports: - effectiveFrom - effectiveTo

Allows reassignment without data mutation.

------------------------------------------------------------------------

# 5. Vehicle Lifecycle

## 5.1 VIN Assignment

Process: 1. Admin assigns VIN to fleet 2. Registry updated 3. Future
telemetry resolves to new owner

Historical data remains unchanged.

------------------------------------------------------------------------

## 5.2 VIN Transfer

Transfers require: - Admin role - Reason - Audit record

------------------------------------------------------------------------

# 6. Driver Management

Driver features: - Create driver - Assign to fleet - Assign to vehicle -
Time-bound assignments

------------------------------------------------------------------------

# 7. API Authorization Model

APIs enforce:

-   Tenant isolation
-   VIN ownership
-   Role permissions

Unauthorized access returns HTTP 403.

------------------------------------------------------------------------

# 8. Audit & Compliance

All actions logged: - User creation - VIN reassignment - Fleet changes

Audit log includes: - Actor - Timestamp - Action - Payload

------------------------------------------------------------------------

# 9. Operational APIs (High Level)

Tenants: - POST /tenants - GET /tenants

Customers: - POST /customers - GET /customers

Fleets: - POST /fleets - GET /fleets

Vehicles: - POST /vehicles/assign - POST /vehicles/transfer

Drivers: - POST /drivers - POST /drivers/assign

Trips: - GET /trips/{vin}/{tripId}

Events: - GET /trips/{vin}/{tripId}/events

------------------------------------------------------------------------

# 10. Security Model

-   IAM + Cognito
-   Per-tenant isolation
-   No cross-tenant queries
-   Encrypted at rest
-   TLS in transit

------------------------------------------------------------------------

# 11. Cost Optimization (AWS Native)

Used services: - Lambda - DynamoDB (on-demand) - API Gateway - Cognito

No servers. Pay-per-use.

------------------------------------------------------------------------

# 12. Summary

-   VIN is authoritative
-   Tenancy is late-bound
-   Users managed via Cognito
-   Roles enforced via JWT
-   All changes audited
-   Fully serverless
