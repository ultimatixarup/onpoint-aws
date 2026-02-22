import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../auth/LoginPage";
import { LogoutPage } from "../auth/LogoutPage";
import { PrivacyPolicyPage } from "../auth/PrivacyPolicyPage";
import { ResetPasswordEmailPage } from "../auth/ResetPasswordEmailPage";
import { ResetPasswordPage } from "../auth/ResetPasswordPage";
import { TermsPage } from "../auth/TermsPage";
import { RequireAuth, RequirePlatformAdmin } from "../context/AuthContext";
import { RequireTenant } from "../context/TenantContext";
import { ConfigurationPage } from "../features/config/ConfigurationPage";
import { FaqPage } from "../features/config/FaqPage";
import { NotificationsPage } from "../features/config/NotificationsPage";
import { FleetDashboard } from "../features/dashboard/FleetDashboard";
import { PlatformDashboard } from "../features/dashboard/PlatformDashboard";
import { TenantDashboard } from "../features/dashboard/TenantDashboard";
import { AddDriverPage } from "../features/drivers/AddDriverPage";
import { AssignDriverPage } from "../features/drivers/AssignDriverPage";
import { DriverCompliancePage } from "../features/drivers/DriverCompliancePage";
import { DriverDashboardOverviewPage } from "../features/drivers/DriverDashboardOverviewPage";
import { DriverDashboardPage } from "../features/drivers/DriverDashboardPage";
import { DriverProfilePage } from "../features/drivers/DriverProfilePage";
import { DriverReportsPage } from "../features/drivers/DriverReportsPage";
import { DriverSafetyAnalyticsPage } from "../features/drivers/DriverSafetyAnalyticsPage";
import { DriverSummaryPage } from "../features/drivers/DriverSummaryPage";
import { TenantDriverAdminPage } from "../features/drivers/TenantDriverAdminPage";
import { GeofenceAlertsPage } from "../features/geofence/GeofenceAlertsPage";
import { GeofenceReportPage } from "../features/geofence/GeofenceReportPage";
import { GeofenceSetupPage } from "../features/geofence/GeofenceSetupPage";
import { ManageGeofencePage } from "../features/geofence/ManageGeofencePage";
import { NotFoundPage } from "../features/NotFoundPage";
import { PlatformCustomersPage } from "../features/platform/PlatformCustomersPage";
import { PlatformDriverAssignmentsPage } from "../features/platform/PlatformDriverAssignmentsPage";
import { PlatformDriversPage } from "../features/platform/PlatformDriversPage";
import { PlatformFleetsPage } from "../features/platform/PlatformFleetsPage";
import { PlatformTenantsPage } from "../features/platform/PlatformTenantsPage";
import { PlatformUsersPage } from "../features/platform/PlatformUsersPage";
import { PlatformVehicleAssignmentsPage } from "../features/platform/PlatformVehicleAssignmentsPage";
import { PlatformVehiclesPage } from "../features/platform/PlatformVehiclesPage";
import { LiveFeedPage } from "../features/reports/LiveFeedPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SafetyEventsPage } from "../features/reports/SafetyEventsPage";
import { TelemetryRawPage } from "../features/telemetry/TelemetryRawPage";
import { LiveTrackingPage } from "../features/tracking/LiveTrackingPage";
import { TripHistoryPage } from "../features/tracking/TripHistoryPage";
import { AddTripPage } from "../features/trips/AddTripPage";
import { DvirPage } from "../features/trips/DvirPage";
import { LiveTripPage } from "../features/trips/LiveTripPage";
import { RouteOptimizationPage } from "../features/trips/RouteOptimizationPage";
import { TripPlanningPage } from "../features/trips/TripPlanningPage";
import { ManageGroupsPage } from "../features/users/ManageGroupsPage";
import { ManageUsersPage } from "../features/users/ManageUsersPage";
import { TenantVehicleAdminPage } from "../features/vehicles/TenantVehicleAdminPage";
import { VehicleConsentPage } from "../features/vehicles/VehicleConsentPage";
import { VinHistoryPage } from "../features/vehicles/VinHistoryPage";
import { VinSummaryPage } from "../features/vehicles/VinSummaryPage";
import { AppShell } from "../layout/AppShell";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/adlp" replace />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/logout" element={<LogoutPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/auth/reset-password-email"
          element={<ResetPasswordEmailPage />}
        />
        <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />

        <Route
          element={
            <RequireAuth>
              <RequireTenant>
                <AppShell />
              </RequireTenant>
            </RequireAuth>
          }
        >
          <Route
            path="/adlp"
            element={<Navigate to="/adlp/dashboard" replace />}
          />
          <Route path="/adlp/dashboard" element={<TenantDashboard />} />
          <Route
            path="/adlp/platform/dashboard"
            element={
              <RequirePlatformAdmin>
                <PlatformDashboard />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/tenants"
            element={
              <RequirePlatformAdmin>
                <PlatformTenantsPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/customers"
            element={
              <RequirePlatformAdmin>
                <PlatformCustomersPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/fleets"
            element={
              <RequirePlatformAdmin>
                <PlatformFleetsPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/users"
            element={
              <RequirePlatformAdmin>
                <PlatformUsersPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/drivers"
            element={
              <RequirePlatformAdmin>
                <PlatformDriversPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/vehicles"
            element={
              <RequirePlatformAdmin>
                <PlatformVehiclesPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/vehicle-assignments"
            element={
              <RequirePlatformAdmin>
                <PlatformVehicleAssignmentsPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/platform/driver-assignments"
            element={
              <RequirePlatformAdmin>
                <PlatformDriverAssignmentsPage />
              </RequirePlatformAdmin>
            }
          />
          <Route
            path="/adlp/fleet/:fleetId/dashboard"
            element={<FleetDashboard />}
          />
          <Route path="/adlp/tracking/live" element={<LiveTrackingPage />} />
          <Route path="/adlp/tracking/trips" element={<TripHistoryPage />} />
          <Route path="/adlp/telemetry/raw" element={<TelemetryRawPage />} />
          <Route
            path="/adlp/telemetry/normalized"
            element={<Navigate to="/adlp/telemetry/raw" replace />}
          />
          <Route
            path="/adlp/geofence/manage"
            element={<ManageGeofencePage />}
          />
          <Route
            path="/adlp/geofence/report"
            element={<GeofenceReportPage />}
          />
          <Route
            path="/adlp/geofence/alerts"
            element={<GeofenceAlertsPage />}
          />
          <Route path="/adlp/geofence/setup" element={<GeofenceSetupPage />} />
          <Route
            path="/adlp/vehicles/vin-summary"
            element={<VinSummaryPage />}
          />
          <Route
            path="/adlp/vehicles/vin-history"
            element={<VinHistoryPage />}
          />
          <Route
            path="/adlp/vehicles/consent"
            element={<VehicleConsentPage />}
          />
          <Route
            path="/adlp/drivers/dashboard"
            element={<DriverDashboardOverviewPage />}
          />
          <Route
            path="/adlp/drivers"
            element={<Navigate to="/adlp/drivers/summary" replace />}
          />
          <Route path="/adlp/drivers/summary" element={<DriverSummaryPage />} />
          <Route path="/adlp/drivers/add" element={<AddDriverPage />} />
          <Route path="/adlp/drivers/assign" element={<AssignDriverPage />} />
          <Route
            path="/adlp/drivers/compliance"
            element={<DriverCompliancePage />}
          />
          <Route
            path="/adlp/drivers/safety"
            element={<DriverSafetyAnalyticsPage />}
          />
          <Route path="/adlp/drivers/reports" element={<DriverReportsPage />} />
          <Route
            path="/adlp/drivers/:driverId"
            element={<DriverProfilePage />}
          />
          <Route
            path="/adlp/drivers/:driverId/dashboard"
            element={<DriverDashboardPage />}
          />
          <Route path="/adlp/trips/planning" element={<TripPlanningPage />} />
          <Route path="/adlp/trips/add" element={<AddTripPage />} />
          <Route
            path="/adlp/trips/optimize"
            element={<RouteOptimizationPage />}
          />
          <Route path="/adlp/trips/live" element={<LiveTripPage />} />
          <Route path="/adlp/trips/dvir" element={<DvirPage />} />
          <Route path="/adlp/reports" element={<ReportsPage />} />
          <Route path="/adlp/safety-events" element={<SafetyEventsPage />} />
          <Route path="/adlp/live-feed" element={<LiveFeedPage />} />
          <Route path="/adlp/users" element={<ManageUsersPage />} />
          <Route path="/adlp/groups" element={<ManageGroupsPage />} />
          <Route path="/adlp/config" element={<ConfigurationPage />} />
          <Route path="/adlp/notifications" element={<NotificationsPage />} />
          <Route path="/adlp/faq" element={<FaqPage />} />
          <Route
            path="/adlp/tenant/drivers"
            element={<TenantDriverAdminPage />}
          />
          <Route
            path="/adlp/tenant/vehicles"
            element={<TenantVehicleAdminPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
