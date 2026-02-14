# OnPoint Driver Management

## Authoritative User Experience Specification

*(Industry-Grade Fleet Telematics Standard)*

------------------------------------------------------------------------

# 1. Design Principles

1.  Maintain current layout and visual identity.
2.  Sidebar-driven navigation.
3.  KPI card-first dashboard design.
4.  Clickable analytics (drilldown-first UX).
5.  Enterprise-grade clarity.
6.  Multi-tenant aware at every layer.
7.  Fast (\<2s perceived load time).
8.  Minimal modal clutter.
9.  Safe-by-default destructive actions.
10. Audit transparency.

------------------------------------------------------------------------

# 2. Navigation Structure (Sidebar)

Drivers ├── Driver Directory ├── Driver Dashboard ├── Assignments ├──
Compliance ├── Safety Analytics ├── Reports

### Role Visibility

  Role             Visibility
  ---------------- ---------------------------
  Platform Admin   All tenants + all drivers
  Tenant Admin     Own tenant only
  Fleet Manager    Fleet-scoped drivers
  Analyst          Read-only
  Read-only        View-only

------------------------------------------------------------------------

# 3. Driver Directory

## KPI Summary Cards

-   Total Drivers
-   Active
-   Inactive
-   Needs Attention
-   Assigned
-   Unassigned
-   Compliance Alerts
-   High Risk Drivers

All cards are clickable filters.

------------------------------------------------------------------------

# 4. Driver Dashboard (Analytics)

## Clickable KPI Metrics

-   Total Miles Driven
-   Total Driving Time
-   Night Miles
-   Average Speed
-   Top Speed
-   Idling Time
-   Collisions
-   Harsh Braking
-   Harsh Acceleration
-   Harsh Cornering
-   Seatbelt Violations
-   Overspeed (Standard + Severe)
-   Safety Score
-   Fuel Efficiency
-   Risk Score

------------------------------------------------------------------------

# 5. Assignment Management

-   Assignment timeline view
-   Assign / Transfer / End assignment
-   Overlap validation
-   Idempotent submission

------------------------------------------------------------------------

# 6. Compliance

-   License expiration tracking
-   Medical certificate tracking
-   HOS placeholder layout
-   DVIR logs

------------------------------------------------------------------------

# 7. Multi-Tenant UX

-   Tenant switcher (Platform Admin only)
-   Fleet-scoped enforcement
-   Secure tenant isolation

------------------------------------------------------------------------

# 8. Alerts & Notifications

-   Real-time alert badge
-   Alert drawer
-   Deduplicated events

------------------------------------------------------------------------

# 9. Security Requirements

-   Cognito authentication
-   RBAC enforcement
-   No cross-tenant UI leakage
-   No PII in logs

------------------------------------------------------------------------

# 10. Performance Targets

-   Dashboard load \<2 seconds
-   Lazy-loaded charts
-   Pagination support
-   Skeleton loaders

------------------------------------------------------------------------

# 11. Authoritative UX Principles

-   Safety first
-   Drilldown everywhere
-   Multi-tenant safe
-   Compliance visible
-   Audit everything
-   Enterprise clarity
