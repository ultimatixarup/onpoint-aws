// Common for Adminn and Conusmer Fleet Component
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardsRoutingModule } from './dashboards-routing.module';
import { NgbDatepickerModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminComponent } from './admin/admin.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SearchproviderPipe, SearchbarPipe, ZpexchartpipePipe, SearchvinPipe, OrderByPipe, SearchPipe, FilterByVinPipe } from './pipes/search.pipe';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AgmCoreModule } from '@agm/core';
import { SearchSummary, SearchIdPipe, TopPredictedPipe,FilterPipe, BottomPredictedPipe, VehicleSearchPipe, StatusSearchPipe } from './pipes/search.pipe';
import { VinHistoryComponent } from './admin/manage-vehicles/vin-history/vin-history.component';
//For Admin Component
import { TrackingComponent } from './admin/admindashboard/tracking/tracking.component';
import { FleetTrackingComponent } from './admin/admindashboard/dashboard-fleet/fleet-tracking/fleet-tracking.component';//
import { LiveTrackingComponent } from './admin/admindashboard/tracking/live-tracking/live-tracking.component';
import { TcosearchComponent } from './tcosearch/tcosearch.component';
import { TcoforvinComponent } from './tcosearch/tcoforvin/tcoforvin.component';
import { TcoforfleetComponent } from './tcosearch/tcoforfleet/tcoforfleet.component';
import { ComparetcoComponent } from './tcosearch/comparetco/comparetco.component';
import { FilterEmptyValuesPipe } from './pipes/filters.pipe';
import { GeofenceAlertComponent } from './admin/admindashboard/geofence/geofence-alert/geofence-alert.component';
// For Conumer Fleet Coponent

import { DashboardFleetComponent } from './admin/admindashboard/dashboard-fleet/dashboard-fleet.component';
import { FleetManageVehiclesComponent } from './admin/fleet-manage-vehicles/fleet-manage-vehicles.component';
import { FleetSafetyCardComponent } from './admin/admindashboard/dashboard-fleet/fleet-safety-card/fleet-safety-card.component';
import { FleetSustanibilityComponent } from './admin/admindashboard/dashboard-fleet/fleet-sustanibility/fleet-sustanibility.component';
import { FleetMaintenanceComponent } from './admin/admindashboard/dashboard-fleet/fleet-maintenance/fleet-maintenance.component';
import { LiveTrackingsComponent } from './admin/admindashboard/dashboard-fleet/fleet-tracking/live-trackings/live-trackings.component';
import { CurrentTripHistoryComponent } from './admin/admindashboard/tracking/live-tracking/current-trip-history/current-trip-history.component';
import { CurrentTripHistorysComponent } from './admin/admindashboard/dashboard-fleet/fleet-tracking/live-trackings/current-trip-historys/current-trip-historys.component';
import { VinSummaryComponent } from './admin/manage-vehicles/vin-summary/vin-summary.component';
import { CalendarComponent } from './admin/admindashboard/calendar/calendar.component';
import { CalendarModule } from 'primeng/calendar';
import { CommonsidebarComponent } from 'src/app/layouts/commonsidebar/commonsidebar.component';
import { CommonHeaderComponent } from 'src/app/layouts/common-header/common-header.component';
import { NodatafoundComponent } from 'src/app/layouts/nodatafound/nodatafound.component';
import { CommonsidebarFleetComponent } from 'src/app/layouts/commonsidebar-fleet/commonsidebar-fleet.component';
import { ReportsComponent } from './admin/admindashboard/reports/reports.component';
import { TcosearchfleetComponent } from './tcosearch/tcosearchfleet/tcosearchfleet.component';
import { FuelsustainabilityfleetComponent } from './admin/admindashboard/dashboard-fleet/fuelsustainabilityfleet/fuelsustainabilityfleet.component';
import { EvsustainabilityfleetComponent } from './admin/admindashboard/dashboard-fleet/evsustainabilityfleet/evsustainabilityfleet.component';
import { ManageGeofenceComponent } from './admin/admindashboard/geofence/manage-geofence/manage-geofence.component';
import { SetGeofenceComponent } from './admin/admindashboard/geofence/set-geofence/set-geofence.component';
import { GeofenceReportComponent } from './admin/admindashboard/geofence/geofence-report/geofence-report.component';
import { FordproConsentComponent } from './admin/vehicle-consent/fordpro-consent/fordpro-consent.component';
import { GmConsentComponent } from './admin/vehicle-consent/gm-consent/gm-consent.component';
import { ToyotaConsentComponent } from './admin/vehicle-consent/toyota-consent/toyota-consent.component';
import { StellantisComponent } from './admin/vehicle-consent/stellantis/stellantis.component';
import { DashCamComponent } from './admin/admindashboard/dashcam/dash-cam/dash-cam.component';
import { CommonConsumerComponent } from 'src/app/layouts/common-consumer/common-consumer.component';
import { DriverDashboardComponent } from './admin/admindashboard/manage-driver/dashboard/driver-dashboard/driver-dashboard.component';
import { AddDriverComponent } from './admin/admindashboard/manage-driver/add-driver/add-driver/add-driver.component';
import { DriverAddedComponent } from './admin/admindashboard/manage-driver/driver-added/driver-added/driver-added.component';
import { AssginDriverComponent } from './admin/admindashboard/manage-driver/assign-driver/assgin-driver/assgin-driver.component';
import { CalendarmComponent } from './admin/admindashboard/calendarm/calendarm.component';
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
import { AgmDrawingModule } from '@agm/drawing';
import { ManageUserComponent } from './admin/admindashboard/manage-user/manage-user.component';
import { ManageGroupComponent } from './admin/admindashboard/manage-user/manage-group/manage-group.component';
import { EditGeofenceComponent } from './admin/admindashboard/geo-fence-setup/edit-geofence/edit-geofence.component';

import { VinEligiblityComponent } from './admin/admindashboard/vin-eligiblity/vin-eligiblity.component';
import { NotificationComponent } from './admin/admindashboard/notification/notification.component';
import { BulkGeofenceComponent } from './admin/admindashboard/geo-fence-setup/bulk-geofence/bulk-geofence.component';
import { Geofence2Component } from './admin/admindashboard/geo-fence-setup/geofence2/geofence2.component';
import { GeofenceVinReportComponent } from './admin/admindashboard/geo-fence-setup/geofence-vin-report/geofence-vin-report.component';
import { GeofenceVinTimelineComponent } from './admin/admindashboard/geo-fence-setup/geofence-vin-timeline/geofence-vin-timeline.component';
import { TimeAgoPipe } from './admin/admindashboard/tracking/time-ago.pipe';
import { AssignBulkComponent } from './admin/admindashboard/manage-driver/assign-bulk/assign-bulk.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
/**
 * Code added by Vinod for SmartMobility
 * Start
 */
import { TripPlanningComponent } from './admin/trip-planning/trip-planning.component';
import { AddTripComponent } from './admin/trip-planning/add-trip/add-trip.component';
import { RouteOptimizationComponent } from './admin/trip-planning/route-optimization/route-optimization.component';
import { AssignTripDriverComponent } from './admin/trip-planning/assign-trip-driver/assign-trip-driver.component';
import { ViewTripComponent } from './admin/trip-planning/view-trip/view-trip.component';
import { EditTripComponent } from './admin/trip-planning/edit-trip/edit-trip.component';
import { UnoptimizedTripListComponent } from './admin/trip-planning/route-optimization/unoptimized-trip-list/unoptimized-trip-list.component';
import { TrackingLiveTripComponent } from './admin/trip-planning/tracking-live-trip/tracking-live-trip.component';
import { TripLiveComponent } from './admin/trip-planning/tracking-live-trip/trip-live/trip-live.component';
import { DvirComponent } from './admin/trip-planning/dvir/dvir.component';
/** end */
import { IceFuelComponent } from './admin/admindashboard/dashboard-fleet/fuel-management/ice-fuel/ice-fuel.component';
import { EvChargeComponent } from './admin/admindashboard/dashboard-fleet/fuel-management/ev-charge/ev-charge.component';
import { HybridFuelComponent } from './admin/admindashboard/dashboard-fleet/fuel-management/hybrid-fuel/hybrid-fuel.component';
import { SystemTripsComponent } from './admin/admindashboard/dashboard-fleet/trips/system-trips/system-trips.component';
import { ScheduleTripsComponent } from './admin/admindashboard/dashboard-fleet/trips/schedule-trips/schedule-trips.component';
import { EltTripsComponent } from './admin/admindashboard/dashboard-fleet/trips/elt-trips/elt-trips.component';
import { DriverVehicleSafetyComponent } from './admin/admindashboard/dashboard-fleet/driver-vehicle-safety/driver-vehicle-safety.component';
import { DriverSafetyScoreComponent } from './admin/admindashboard/dashboard-fleet/driver-safety-score/driver-safety-score.component';
// import { VehicleSafetyComponent } from './admin/dashboard-fleet/vehicle-safety/vehicle-safety.component';
//import { AssignDriverComponent } from './admin/manage-driver/assign-driver/assign-driver.component';
import { DriverSummaryComponent } from './admin/admindashboard/manage-driver/driver-summary/driver-summary.component';
import { DriverAlertsComponent } from './admin/admindashboard/dashboard-fleet/alerts/driver-alerts/driver-alerts.component';
import { VehicleAlertsComponent } from './admin/admindashboard/dashboard-fleet/alerts/vehicle-alerts/vehicle-alerts.component';
import { AiChatbotComponent } from './admin/admindashboard/dashboard-fleet/chatbot/ai-chatbot/ai-chatbot.component';
//import { VideoComponent } from './admin/dashboard-fleet/dash-cam/video/video.component';
import { SidebarComponent } from 'src/app/layouts/sidebar/sidebar.component';
//import { DashboardFleetComponent } from './admin/dashboard-fleet/dashboard-fleet.component';
import { SafteyDashboardComponent } from './admin/admindashboard/dashboard-fleet/saftey-dashboard/saftey-dashboard.component';
import { FuelDashboardComponent } from './admin/admindashboard/dashboard-fleet/fuel-dashboard/fuel-dashboard.component';
import { ServiceHistoryDashboardComponent } from './admin/admindashboard/dashboard-fleet/service-history-dashboard/service-history-dashboard.component';
import { UpcomingMaintenanceDashboardComponent } from './admin/admindashboard/dashboard-fleet/upcoming-maintenance-dashboard/upcoming-maintenance-dashboard.component';
import { GeofenceReportDetailsComponent } from './admin/admindashboard/dashboard-fleet/geofence-report-details/geofence-report-details.component';
import { BasicTelemetryDashboardComponent } from './admin/admindashboard/dashboard-fleet/basic-telemetry-dashboard/basic-telemetry-dashboard.component';
import { VehicleHealthComponent } from './admin/admindashboard/dashboard-fleet/vehicle-health/vehicle-health.component';
@NgModule({
  declarations: [
   // SidebarComponent,
    SafteyDashboardComponent,
    FuelDashboardComponent,
    ServiceHistoryDashboardComponent,
    UpcomingMaintenanceDashboardComponent,
    GeofenceReportDetailsComponent,
    BasicTelemetryDashboardComponent,
    GeofenceAlertComponent,
    CommonHeaderComponent,
    CommonsidebarComponent,
    CommonsidebarFleetComponent,
    CommonConsumerComponent,
    NodatafoundComponent,
    CalendarComponent,
    SearchSummary,
    SearchIdPipe,
    OrderByPipe,
    SearchPipe,
    StatusSearchPipe,
    AdminComponent,
    SearchproviderPipe,
    TcosearchComponent,
    TcoforvinComponent,
    TcoforfleetComponent,
    ComparetcoComponent,
    SearchbarPipe,
    CalendarmComponent,
    ZpexchartpipePipe,
    TopPredictedPipe,
    BottomPredictedPipe,
    FilterPipe,
    SearchvinPipe,
    VehicleSearchPipe,
    DashboardFleetComponent,
    FleetManageVehiclesComponent,
    TrackingComponent,
    FleetMaintenanceComponent,
    FleetSafetyCardComponent,
    FleetSustanibilityComponent,
    FleetTrackingComponent,
    LiveTrackingComponent,
    CurrentTripHistoryComponent,
    VinHistoryComponent,
     LiveTrackingsComponent,
     CurrentTripHistorysComponent,
    StatusSearchPipe, VinSummaryComponent,
    FilterEmptyValuesPipe,
   // ReportsComponent,
    TcosearchfleetComponent,
    FuelsustainabilityfleetComponent,
    EvsustainabilityfleetComponent,
    ManageGeofenceComponent,
    SetGeofenceComponent,
    // GeofenceReportComponent,GeoFenceSetupComponent,AddGeofenceComponent,FilterByVinPipe, FordproConsentComponent, GmConsentComponent, ToyotaConsentComponent, StellantisComponent, DashCamComponent, DriverDashboardComponent, AddDriverComponent, DriverAddedComponent, AssginDriverComponent, SafetyCollisionComponent, SafetyCollisionFleetComponent, FrequentlyAskedComponent, AdasDashboardComponent, ChatBotComponent, ServiceReminderComponent, AddServiceReminderComponent, ConfigurationComponent,ServiceReminderComponent, ServiceHistoryComponent, EditServiceReminderComponent, SafetyEventsComponent, LiveFeedComponent, ManageUserComponent, ManageGroupComponent, EditGeofenceComponent
     ManageGroupComponent, EditGeofenceComponent,GeofenceReportComponent,GeoFenceSetupComponent,AddGeofenceComponent,FilterByVinPipe, FordproConsentComponent, GmConsentComponent, ToyotaConsentComponent, StellantisComponent, DashCamComponent, DriverDashboardComponent, AddDriverComponent, DriverAddedComponent, AssginDriverComponent, FrequentlyAskedComponent, AdasDashboardComponent, ChatBotComponent, ServiceReminderComponent, AddServiceReminderComponent, ConfigurationComponent,ServiceReminderComponent, ServiceHistoryComponent, EditServiceReminderComponent, SafetyEventsComponent, LiveFeedComponent, ManageUserComponent, VinEligiblityComponent, NotificationComponent, BulkGeofenceComponent, Geofence2Component, GeofenceVinReportComponent, GeofenceVinTimelineComponent, TimeAgoPipe, AssignBulkComponent,
     TripPlanningComponent,
     AddTripComponent,
     RouteOptimizationComponent,
     AssignTripDriverComponent,
     ViewTripComponent,
     EditTripComponent,
     UnoptimizedTripListComponent,
     TripLiveComponent,
     DvirComponent,
     TcoforvinComponent,
    TcoforfleetComponent,
    TcosearchfleetComponent,
    IceFuelComponent,
    EvChargeComponent,
    HybridFuelComponent,
    SystemTripsComponent,
    ScheduleTripsComponent,
    EltTripsComponent,
    VehicleHealthComponent,
    DriverVehicleSafetyComponent,
    DriverSafetyScoreComponent,
    // VehicleSafetyComponent

    DriverDashboardComponent,
   // AssignDriverComponent,
    DriverAddedComponent,
    TrackingLiveTripComponent,
    TripLiveComponent,
    DriverSummaryComponent,
    SafetyCollisionFleetComponent,
    DriverAlertsComponent,
    VehicleAlertsComponent,
    AdasDashboardComponent,
    ManageGeofenceComponent,
    SetGeofenceComponent,
    GeofenceReportComponent,
    AiChatbotComponent,
    ServiceHistoryComponent,
    ServiceReminderComponent,
    //AddServiceReminderComponent,
    EditServiceReminderComponent,

    LiveFeedComponent,
    SafetyEventsComponent,
    //VideoComponent,
    ReportsComponent,
    AddDriverComponent,

  ],
  providers: [],
  imports: [
    CalendarModule,
    CommonModule,
    DashboardsRoutingModule,
    DragDropModule, // add by vinod for smartmobility
    NgbDatepickerModule,// add by vinod for smartmobility
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyDySexTXKB3Syxg_1eHOf7cuMljEnKb8us',
      libraries: ['places', 'drawing', 'geometry']
    }),

    AgmDrawingModule,
    NgbModule,
    FormsModule,
    NgApexchartsModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    NgSelectModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [VinHistoryComponent],
  exports: [
    //SidebarComponent,
    CommonsidebarComponent,
    CommonsidebarFleetComponent,
    CommonHeaderComponent,
    NodatafoundComponent,
    CommonConsumerComponent,

  ],
})
export class DashboardsModule { }
