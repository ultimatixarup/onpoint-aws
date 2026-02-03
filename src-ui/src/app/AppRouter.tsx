import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../auth/LoginPage";
import { LogoutPage } from "../auth/LogoutPage";
import { PrivacyPolicyPage } from "../auth/PrivacyPolicyPage";
import { ResetPasswordEmailPage } from "../auth/ResetPasswordEmailPage";
import { ResetPasswordPage } from "../auth/ResetPasswordPage";
import { TermsPage } from "../auth/TermsPage";
import { RequireAuth } from "../context/AuthContext";
import { RequireTenant } from "../context/TenantContext";
import { ConfigurationPage } from "../features/config/ConfigurationPage";
import { FaqPage } from "../features/config/FaqPage";
import { NotificationsPage } from "../features/config/NotificationsPage";
import { FleetDashboard } from "../features/dashboard/FleetDashboard";
import { PlatformDashboard } from "../features/dashboard/PlatformDashboard";
import { TenantDashboard } from "../features/dashboard/TenantDashboard";
import { AddDriverPage } from "../features/drivers/AddDriverPage";
import { AssignDriverPage } from "../features/drivers/AssignDriverPage";
import { DriverDashboardPage } from "../features/drivers/DriverDashboardPage";
import { DriverSummaryPage } from "../features/drivers/DriverSummaryPage";
import { GeofenceAlertsPage } from "../features/geofence/GeofenceAlertsPage";
import { GeofenceReportPage } from "../features/geofence/GeofenceReportPage";
import { GeofenceSetupPage } from "../features/geofence/GeofenceSetupPage";
import { ManageGeofencePage } from "../features/geofence/ManageGeofencePage";
import { NotFoundPage } from "../features/NotFoundPage";
import { LiveFeedPage } from "../features/reports/LiveFeedPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SafetyEventsPage } from "../features/reports/SafetyEventsPage";
import { TelemetryNormalizedPage } from "../features/telemetry/TelemetryNormalizedPage";
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
        <Route path="/auth/reset-password-email" element={<ResetPasswordEmailPage />} />
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
          <Route path="/adlp" element={<Navigate to="/adlp/dashboard" replace />} />
          <Route path="/adlp/dashboard" element={<TenantDashboard />} />
          <Route path="/adlp/platform/dashboard" element={<PlatformDashboard />} />
          <Route path="/adlp/fleet/:fleetId/dashboard" element={<FleetDashboard />} />
          <Route path="/adlp/tracking/live" element={<LiveTrackingPage />} />
          <Route path="/adlp/tracking/trips" element={<TripHistoryPage />} />
          <Route path="/adlp/telemetry/raw" element={<TelemetryRawPage />} />
          <Route path="/adlp/telemetry/normalized" element={<TelemetryNormalizedPage />} />
          <Route path="/adlp/geofence/manage" element={<ManageGeofencePage />} />
          <Route path="/adlp/geofence/report" element={<GeofenceReportPage />} />
          <Route path="/adlp/geofence/alerts" element={<GeofenceAlertsPage />} />
          <Route path="/adlp/geofence/setup" element={<GeofenceSetupPage />} />
          <Route path="/adlp/vehicles/vin-summary" element={<VinSummaryPage />} />
          <Route path="/adlp/vehicles/vin-history" element={<VinHistoryPage />} />
          <Route path="/adlp/vehicles/consent" element={<VehicleConsentPage />} />
          <Route path="/adlp/drivers/dashboard" element={<DriverDashboardPage />} />
          <Route path="/adlp/drivers/add" element={<AddDriverPage />} />
          <Route path="/adlp/drivers/assign" element={<AssignDriverPage />} />
          <Route path="/adlp/drivers/summary" element={<DriverSummaryPage />} />
          <Route path="/adlp/trips/planning" element={<TripPlanningPage />} />
          <Route path="/adlp/trips/add" element={<AddTripPage />} />
          <Route path="/adlp/trips/optimize" element={<RouteOptimizationPage />} />
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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
