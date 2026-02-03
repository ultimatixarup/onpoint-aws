import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { VinHistoryComponent } from './admin/manage-vehicles/vin-history/vin-history.component';
import { GmConsentComponent } from './admin/vehicle-consent/gm-consent/gm-consent.component';
import { ToyotaConsentComponent } from './admin/vehicle-consent/toyota-consent/toyota-consent.component';
import { StellantisComponent } from './admin/vehicle-consent/stellantis/stellantis.component';
import { FordproConsentComponent } from './admin/vehicle-consent/fordpro-consent/fordpro-consent.component';
// For Admin Component
import { TrackingComponent } from './admin/admindashboard/tracking/tracking.component';
import { LiveTrackingComponent } from './admin/admindashboard/tracking/live-tracking/live-tracking.component';
import { CurrentTripHistoryComponent } from './admin/admindashboard/tracking/live-tracking/current-trip-history/current-trip-history.component';
import { VinSummaryComponent } from './admin/manage-vehicles/vin-summary/vin-summary.component';
import { TcosearchComponent } from './tcosearch/tcosearch.component';
import { TcoforvinComponent } from './tcosearch/tcoforvin/tcoforvin.component';
import { TcoforfleetComponent } from './tcosearch/tcoforfleet/tcoforfleet.component';
import { ComparetcoComponent } from './tcosearch/comparetco/comparetco.component';
import { ManageGeofenceComponent } from './admin/admindashboard/geofence/manage-geofence/manage-geofence.component';
import { SetGeofenceComponent } from "./admin/admindashboard/geofence/set-geofence/set-geofence.component";
import { GeofenceReportComponent } from "./admin/admindashboard/geofence/geofence-report/geofence-report.component";
import { GeofenceAlertComponent } from './admin/admindashboard/geofence/geofence-alert/geofence-alert.component';
// For Conumer Fleet Coponent
import { DashboardFleetComponent } from './admin/admindashboard/dashboard-fleet/dashboard-fleet.component';
import { FleetManageVehiclesComponent } from './admin/fleet-manage-vehicles/fleet-manage-vehicles.component';
 import { FleetSafetyCardComponent } from './admin/admindashboard/dashboard-fleet/fleet-safety-card/fleet-safety-card.component';
import { FleetSustanibilityComponent } from './admin/admindashboard/dashboard-fleet/fleet-sustanibility/fleet-sustanibility.component';
import { FleetMaintenanceComponent } from './admin/admindashboard/dashboard-fleet/fleet-maintenance/fleet-maintenance.component';
import { FleetTrackingComponent } from './admin/admindashboard/dashboard-fleet/fleet-tracking/fleet-tracking.component';
 import { LiveTrackingsComponent } from './admin/admindashboard/dashboard-fleet/fleet-tracking/live-trackings/live-trackings.component';
 import { CurrentTripHistorysComponent } from './admin/admindashboard/dashboard-fleet/fleet-tracking/live-trackings/current-trip-historys/current-trip-historys.component';
import { ReportsComponent } from './admin/admindashboard/reports/reports.component';
import { TcosearchfleetComponent } from './tcosearch/tcosearchfleet/tcosearchfleet.component';
 import { FuelsustainabilityfleetComponent } from './admin/admindashboard/dashboard-fleet/fuelsustainabilityfleet/fuelsustainabilityfleet.component';
 import { EvsustainabilityfleetComponent } from './admin/admindashboard/dashboard-fleet/evsustainabilityfleet/evsustainabilityfleet.component';
import { DashCamComponent } from './admin/admindashboard/dashcam/dash-cam/dash-cam.component';
import { DriverDashboardComponent } from './admin/admindashboard/manage-driver/dashboard/driver-dashboard/driver-dashboard.component';
import { AddDriverComponent } from './admin/admindashboard/manage-driver/add-driver/add-driver/add-driver.component';
import { DriverAddedComponent } from './admin/admindashboard/manage-driver/driver-added/driver-added/driver-added.component';
import { AssginDriverComponent } from './admin/admindashboard/manage-driver/assign-driver/assgin-driver/assgin-driver.component';
import { SafetyCollisionFleetComponent } from './admin/admindashboard/dashboard-fleet/safety-collision-fleet/safety-collision-fleet.component';
import { FrequentlyAskedComponent } from './admin/frequently-asked/frequently-asked.component';
import { AdasDashboardComponent } from './admin/admindashboard/adas-dashboard/adas-dashboard.component';
import { TemplatePortalComponent } from './admin/admindashboard/template-portal/template-portal.component';
import { ChatBotComponent } from './admin/admindashboard/chat-bot/chat-bot.component';
import { ConfigurationComponent } from './admin/admindashboard/configuration/configuration.component';
import { ServiceReminderComponent } from './admin/admindashboard/maintenance/service-reminder/service-reminder.component';
import { AddServiceReminderComponent } from './admin/admindashboard/maintenance/service-reminder/add-service-reminder/add-service-reminder.component';
import { ServiceHistoryComponent } from './admin/admindashboard/maintenance/service-history/service-history.component';
import { EditServiceReminderComponent } from './admin/admindashboard/maintenance/service-reminder/edit-service-reminder/edit-service-reminder.component';
import { SafetyEventsComponent } from './admin/admindashboard/safety-events/safety-events.component';
import { LiveFeedComponent } from './admin/admindashboard/live-feed/live-feed.component';
import { GeoFenceSetupComponent } from './admin/admindashboard/geo-fence-setup/geo-fence-setup.component';
import { AddGeofenceComponent } from './admin/admindashboard/geo-fence-setup/add-geofence/add-geofence.component';
import { ManageUserComponent } from './admin/admindashboard/manage-user/manage-user.component';
import { ManageGroupComponent } from './admin/admindashboard/manage-user/manage-group/manage-group.component';
import { EditGeofenceComponent } from './admin/admindashboard/geo-fence-setup/edit-geofence/edit-geofence.component';
import { VinEligiblityComponent } from './admin/admindashboard/vin-eligiblity/vin-eligiblity.component';
import { NotificationComponent } from './admin/admindashboard/notification/notification.component';
import { BulkGeofenceComponent } from './admin/admindashboard/geo-fence-setup/bulk-geofence/bulk-geofence.component';
import { Geofence2Component } from './admin/admindashboard/geo-fence-setup/geofence2/geofence2.component';
import { GeofenceVinReportComponent } from './admin/admindashboard/geo-fence-setup/geofence-vin-report/geofence-vin-report.component';
import { GeofenceVinTimelineComponent } from './admin/admindashboard/geo-fence-setup/geofence-vin-timeline/geofence-vin-timeline.component';
import { AssignBulkComponent } from './admin/admindashboard/manage-driver/assign-bulk/assign-bulk.component';
import { TripPlanningComponent } from './admin/trip-planning/trip-planning.component';
import { AddTripComponent } from './admin/trip-planning/add-trip/add-trip.component';
import { RouteOptimizationComponent } from './admin/trip-planning/route-optimization/route-optimization.component';
import { AssignTripDriverComponent } from './admin/trip-planning/assign-trip-driver/assign-trip-driver.component';
import { ViewTripComponent } from './admin/trip-planning/view-trip/view-trip.component';
import { EditTripComponent } from './admin/trip-planning/edit-trip/edit-trip.component';
import { UnoptimizedTripListComponent } from './admin/trip-planning/route-optimization/unoptimized-trip-list/unoptimized-trip-list.component';
import { IceFuelComponent } from './admin/admindashboard/dashboard-fleet/fuel-management/ice-fuel/ice-fuel.component';
import { EvChargeComponent } from './admin/admindashboard/dashboard-fleet/fuel-management/ev-charge/ev-charge.component';
import { TrackingLiveTripComponent } from './admin/trip-planning/tracking-live-trip/tracking-live-trip.component';
import { TripLiveComponent } from './admin/trip-planning/tracking-live-trip/trip-live/trip-live.component';
import { DvirComponent } from './admin/trip-planning/dvir/dvir.component';
import { HybridFuelComponent } from './admin/admindashboard/dashboard-fleet/fuel-management/hybrid-fuel/hybrid-fuel.component';
import { SystemTripsComponent } from './admin/admindashboard/dashboard-fleet/trips/system-trips/system-trips.component';
import { ScheduleTripsComponent } from './admin/admindashboard/dashboard-fleet/trips/schedule-trips/schedule-trips.component';
import { EltTripsComponent } from './admin/admindashboard/dashboard-fleet/trips/elt-trips/elt-trips.component';
import { DriverSummaryComponent } from './admin/admindashboard/manage-driver/driver-summary/driver-summary.component';
import { VehicleAlertsComponent } from './admin/admindashboard/dashboard-fleet/alerts/vehicle-alerts/vehicle-alerts.component';
import { DriverAlertsComponent } from './admin/admindashboard/dashboard-fleet/alerts/driver-alerts/driver-alerts.component';
import { SafteyDashboardComponent } from './admin/admindashboard/dashboard-fleet/saftey-dashboard/saftey-dashboard.component';
import { FuelDashboardComponent } from './admin/admindashboard/dashboard-fleet/fuel-dashboard/fuel-dashboard.component';
//import { FleetTrackingComponent } from './admin/admindashboard/fleet-tracking/fleet-tracking.component';
//import { LiveTrackingsComponent } from './admin/admindashboard/fleet-tracking/live-trackings/live-trackings.component';
import { UpcomingMaintenanceDashboardComponent } from './admin/admindashboard/dashboard-fleet/upcoming-maintenance-dashboard/upcoming-maintenance-dashboard.component';
import { BasicTelemetryDashboardComponent } from './admin/admindashboard/dashboard-fleet/basic-telemetry-dashboard/basic-telemetry-dashboard.component';
import { GeofenceReportDetailsComponent } from './admin/admindashboard/dashboard-fleet/geofence-report-details/geofence-report-details.component';
import { DriverVehicleSafetyComponent } from './admin/admindashboard/dashboard-fleet/driver-vehicle-safety/driver-vehicle-safety.component';
import { DriverSafetyScoreComponent } from './admin/admindashboard/dashboard-fleet/driver-safety-score/driver-safety-score.component';
import { ServiceHistoryDashboardComponent } from './admin/admindashboard/dashboard-fleet/service-history-dashboard/service-history-dashboard.component';
import { VehicleHealthComponent } from './admin/admindashboard/dashboard-fleet/vehicle-health/vehicle-health.component';
/** end */
const routes: Routes = [
    // For Admin Component Rounting
    {
        path: 'admin/admindashboard/maintenance/serviceReminder/serviceReminders',
        component: ServiceReminderComponent
    },
    {
        path: 'admin/admindashboard/maintenance/serviceReminder/serviceReminders/addSrviceReminder',
        component: AddServiceReminderComponent
    },
    {
        path: 'admin/admindashboard/maintenance/serviceReminder/serviceReminders/editSrviceReminder',
        component: EditServiceReminderComponent
    },
    {
        path: 'admin/admindashboard/maintenance/serviceHistory',
        component: ServiceHistoryComponent
    },
    {
        path: 'admin/admindashboard/tracking',
        component: TrackingComponent
    },
    {
        path: 'admin/admindashboard/livetracking',
        component: LiveTrackingComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/currentTripHistory',
        component: CurrentTripHistoryComponent
    },
    {
        path: 'admin/manageVehicle/vinSummary',
        component: VinSummaryComponent
    },
    {
        path: 'dashboards/tcosearch',
        component: TcosearchComponent
    },
    {
        path: 'dashboards/tcosearchfleet',
        component: TcosearchfleetComponent,
    },
    {
        path: 'dashboards/tcosearch/tcoforvin',
        component: TcoforvinComponent
    },
    {
        path: 'dashboards/tcosearch/tcoforfleet',
        component: TcoforfleetComponent
    },
    {
        path: 'dashboards/compareTco',
        component: ComparetcoComponent
    },

    {
        path: 'admin/admindashboard/report',
        component: ReportsComponent
    },
    {
        path: 'admin/admindashboard/custom',
        component: ReportsComponent
    },
    {
        path: "admin/admindashboard/geofence/manage-geofence",
        component: ManageGeofenceComponent,
    },
    {
        path: "admin/admindashboard/geofence/edit-geofence",
        component: EditGeofenceComponent,
    },
    {
        path: "admin/admindashboard/geofence/set-geofence",
        component: SetGeofenceComponent,
    },
    {
        path: "admin/admindashboard/geofence/geofence-report",
        component: GeofenceReportComponent,
    },
    {
        path: "admin/admindashboard/geofence/geofence-alert",
        component: GeofenceAlertComponent,
    },
    {
        path: 'admin/admindashboard/dashCam',
        component: DashCamComponent,
    },
    {
        path: 'admin/admindashboard/manageDriver/dashboardDriver',
        component: DriverDashboardComponent,
    },
    {
        path: 'admin/admindashboard/manageDriver/addDriver',
        component: AddDriverComponent,
    },
     {
        path: 'admin/admindashboard/manageDriver/editDriver/:id',
        component: AddDriverComponent,
     },
    {
        path: 'admin/admindashboard/manageDriver/viewDriver',
        component: DriverAddedComponent,
    },
    {
        path: 'admin/admindashboard/manageDriver/assignDriver',
        component: AssginDriverComponent,
    },
    {
        path: 'admin/admindashboard/manageDriver/assign-bulk',
        component: AssignBulkComponent,
    },
    {
        path: 'admin/admindashboard/adasDashboard',
        component: AdasDashboardComponent,
    },
    {
        path: 'admin/admindashboard/chatBot',
        component: ChatBotComponent
    },
    {
        path: 'admin/admindashboard/geoFenceSetup/geofence',
        component: GeoFenceSetupComponent
    },

    {
        path: 'admin/admindashboard/geoFenceSetup/addGeofence',
        component: AddGeofenceComponent
    },
    {
        path: 'admin/admindashboard/geoFenceSetup/bulk-geofence',
        component: BulkGeofenceComponent
    },
    {
        path: 'admin/admindashboard/geoFenceSetup/geofence2',
        component: Geofence2Component
    },
    {
        path: 'admin/admindashboard/geoFenceSetup/geofence-vin-report',
        component: GeofenceVinReportComponent
    },
    {
        path: 'admin/admindashboard/geoFenceSetup/geofence-vin-timeline',
        component: GeofenceVinTimelineComponent
    },
    // For Conumer Fleet Component
    {
        path: 'admin/admindashboard/dashboardfleet',
        component: DashboardFleetComponent
    },
    {
        path: 'admin/fleetManageVehicles',
        component: FleetManageVehiclesComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/fleet-safety-card',
        component: FleetSafetyCardComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/fleet-sustainibility',
        component: FleetSustanibilityComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/fleet-maintenance',
        component: FleetMaintenanceComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/fuel',
        component: FuelsustainabilityfleetComponent
    },
     {
        path: 'admin/admindashboard/dashboardfleet/ev',
        component: EvsustainabilityfleetComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/fleet-tracking',
        component: FleetTrackingComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/fleet-tracking/liveTracking',
        component: LiveTrackingsComponent
    },

    {
        path: 'admin/admindashboard/dashboardfleet/fleet-tracking/currentriphistory',
        component: CurrentTripHistorysComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/safetyCollision/safetyCollsion',
        component: SafetyCollisionFleetComponent
    },
    {
        path: 'admin/manageVehicle/vinHistory',
        component: VinHistoryComponent
    },
    {
        path: 'admin/vehicleConsent/gmConsent',
        component: GmConsentComponent
    },
    {
        path: 'admin/vehicleConsent/fordConsent',
        component: FordproConsentComponent
    }, {
        path: 'admin/vehicleConsent/toyotaConsent',
        component: ToyotaConsentComponent
    },
    {
        path: 'admin/vehicleConsent/stellantisConsent',
        component: StellantisComponent
    },
    {
        path: 'admin/frequentlyAsked/frequentlyAsked',
        component: FrequentlyAskedComponent
    },
    {
        path:'admin/admindashboard/template-portal',
        component: TemplatePortalComponent
    },

    {
        path:'admin/admindashboard/configuration',
        component: ConfigurationComponent
    },
    {
        path:'admin/admindashboard/safety-events',
        component: SafetyEventsComponent
    },
    {
        path:'admin/admindashboard/live-view',
        component: LiveFeedComponent
    },
    {
        path:'admin/admindashboard/manage-group',
        component: ManageGroupComponent
    },
    {
        path:'admin/admindashboard/manage-user',
        component: ManageUserComponent
    },
    {
        path:'admin/admindashboard/vin-eligibility',
        component: VinEligiblityComponent
    },
    {
        path:'admin/admindashboard/notification',
        component: NotificationComponent
    },
     /** add by vinod */
     {
        path:'admin/admindashboard/trip-planning/planning',
        component: TripPlanningComponent
    },
    {
        path:'admin/admindashboard/trip-planning/pre-optimization-trips',
        component: UnoptimizedTripListComponent
    },
    {
        path:'admin/admindashboard/trip-planning/create-trip',
        component: AddTripComponent
    },
    {
        path: 'admin/admindashboard/trip-planning/route-optimization/:tripDetailId',
        component: RouteOptimizationComponent
    },

    {
        path:'admin/admindashboard/trip-planning/assign-vehicle-to-trip/:tripDetailId',
        component: AssignTripDriverComponent
    },
    {
        path:'admin/admindashboard/trip-planning/view/:tripDetailId',
        component: ViewTripComponent
    },
    {
        path:'admin/admindashboard/trip-planning/edit/:tripDetailId',
        component: EditTripComponent
    }
    ,
    {
        path:'admin/admindashboard/trip-planning/delete',
        component: EditTripComponent
    },
    {
        path:'admin/admindashboard/trip-planning/tracking-live-trip',
        component: TrackingLiveTripComponent
    },
    {
        path: 'admin/admindashboard/trip-planning/tracking-live-trip/:tripDetailId',
        component: TripLiveComponent
    },
    {
        path:'admin/admindashboard/trip-planning/dvir',
        component: DvirComponent
    },
    {
        path:'admin/admindashboard/dashboardfleet/ice-fuel',
        component: IceFuelComponent
    },
    {
        path:'admin/admindashboard/dashboardfleet/ev-charge',
        component: EvChargeComponent
    },
    {
        path:'admin/admindashboard/dashboardfleet/hybird-fuel',
        component: HybridFuelComponent
    },
    {
        path:'admin/admindashboard/dashboardfleet/trips/system-trips',
        component: SystemTripsComponent
    },
    {
        path:'admin/admindashboard/dashboardfleet/trips/schedule-trips',
        component: ScheduleTripsComponent
    },
    {
        path:'admin/admindashboard/dashboardfleet/trips/elt-trips',
        component: EltTripsComponent
    },
    {
        path:'admin/admindashboard/dashboardfleet/vehicle-health',
        component: VehicleHealthComponent
    },
    {
        path: 'admin/admindashboard/manageDriver/driverSummary/:driverId',
        component: DriverSummaryComponent,
     },
      {
        path: 'admin/admindashboard/dashboardfleet/driver-vehicle-safety',
        component: DriverVehicleSafetyComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/driver-safety-score',
        component: DriverSafetyScoreComponent
    },
     {
        path: 'admin/admindashboard/dashboardfleet/vehicle-alerts',
        component: VehicleAlertsComponent
    },
    {
        path: 'admin/admindashboard/dashboardfleet/driver-alerts',
        component: DriverAlertsComponent
    },
     {
        path:'admin/admindashboard/safety-dashboard',
        component: SafteyDashboardComponent
    },
    {
        path:'admin/admindashboard/fuel-dashboard',
        component: FuelDashboardComponent
    },
    {
        path:'admin/admindashboard/maintenance/service-history-dashboard',
        component: ServiceHistoryDashboardComponent
    },
     {
        path:'admin/admindashboard/maintenance/upcoming-maintenance-dashboard',
        component: UpcomingMaintenanceDashboardComponent
    },
    {
        path:'admin/admindashboard/geofence-report-details',
        component: GeofenceReportDetailsComponent
    },
    {
        path:'admin/admindashboard/basic-telemetry-details',
        component: BasicTelemetryDashboardComponent
    },
    /* END **/
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DashboardsRoutingModule { }
