import { Component, OnInit } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, NavigationEnd } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  fleetDetails: any;
  showReports: boolean = false; // /*** add by smartmobiltry code by Vinod ***/
  showSmartMobilityMenu = false;
  showFuelManagementMenu = false;
  showDriverManagementMenu = false;
  showSafetyMenu: boolean = false;
  alertMenu:boolean= false;
  showdashcamMenu:boolean=false;
  showTripHistoryMenu: boolean = false;
  showMaintenanceMenu:boolean=false;
  showSettingsMenu: boolean = false;
  activeSubmenu = ''; // Stores active submenu item
  constructor(public router: Router, public http: HttpClient, private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkActiveSubmenu();
      }
    });
 }

  ngOnInit() {
    this.showRole();
  }

  viewMore(): void {
    if (this.customConsumer) {
      this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { consumer: this.customConsumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/fleetManageVehicles']);
    }
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }

  selectConsumers() {
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.customConsumer).subscribe((res: any) => {
        this.fleetList = res
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        this.fleetIdData = null
      }, err => { })
    )
  }
  toggleReports() {
    console.log(this.showReports);
    this.showReports = !this.showReports;
    console.log(this.showReports);
}


  // Function to toggle submenu on click
  toggleSubMenu() {

    this.showTripHistoryMenu = !this.showTripHistoryMenu;
  }
  toggleAlertMenu() {

    this.alertMenu = !this.alertMenu;
  }
  toggleDashcamMenu() {

    this.showdashcamMenu = !this.showdashcamMenu;
  }

  toggleSmartMobilityMenu(): void {

    this.showSmartMobilityMenu = !this.showSmartMobilityMenu;
  }

  toggleFuelManagementMenu(): void {

    this.showFuelManagementMenu = !this.showFuelManagementMenu;
  }
  toggleShowDriverManagementMenu(): void {

    this.showDriverManagementMenu = !this.showDriverManagementMenu;
  }
  toggleSafetyMenu() {

    this.showSafetyMenu = !this.showSafetyMenu;
  }
  toggleMaintenanceMenu(): void {

    this.showMaintenanceMenu = !this.showMaintenanceMenu;
  }

  toggleSettingsMenu(): void {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  checkActiveSubmenu(): void {
    const currentRoute = this.router.url;
    console.log("Current Route:", currentRoute);

    // Mapping routes to submenu keys
    const submenuMapping: { [key: string]: string } = {
      '/adlp/admin/admindashboard/trip-planning/planning': 'trip-planning',
      '/adlp/admin/admindashboard/trip-planning/pre-optimization-trips': 'route-optimization',
      '/adlp/admin/admindashboard/trip-planning/tracking-live-trip': 'tracking-live-trip',
      '/adlp/admin/admindashboard/geoFenceSetup/geofence': 'geofence',
      '/adlp/admin/admindashboard/geoFenceSetup/geofence2': 'geofence',
      '/adlp/admin/admindashboard/trip-planning/dvir': 'dvir',
      '/adlp/admin/admindashboard/dashboardfleet/driver-alerts': 'driver-alerts',
      '/adlp/admin/admindashboard/dashboardfleet/vehicle-alerts': 'vehicle-alerts',
      '/adlp/admin/admindashboard/safety-dashboard': 'safety-summary',
      '/adlp/admin/admindashboard/dashboardfleet/fleet-safety-card': 'fleet-safety',
      '/adlp/admin/admindashboard/dashboardfleet/driver-vehicle-safety': 'driver-behaviour',
      '/adlp/admin/admindashboard/dashboardfleet/safetyCollision/safetyCollsion': 'safety-collsion',
      '/adlp/admin/admindashboard/adasDashboard': 'adas',
      '/adlp/admin/admindashboard/dashboardfleet/trips/system-trips': 'system-trips',
      '/adlp/admin/admindashboard/dashboardfleet/trips/schedule-trips': 'schedule-trips',
      '/adlp/admin/admindashboard/fuel-dashboard': 'ice-fuel',
      '/adlp/admin/admindashboard/dashboardfleet/ev-charge': 'ev-charge',
      '/adlp/admin/admindashboard/manageDriver/viewDriver': 'manage-driver',
      '/adlp/admin/admindashboard/dashboardfleet/trips/elt-trips': 'driver-trip-summary',
      '/adlp/admin/admindashboard/dashboardfleet/fleet-maintenance': 'service-warnings',
      '/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders': 'service-reminders',
      '/adlp/admin/admindashboard/maintenance/serviceHistory': 'service-history',
      '/adlp/admin/admindashboard/safety-events': 'safety-events',
      '/adlp/admin/admindashboard/live-view': 'live-view',
      '/adlp/admin/admindashboard/video': 'video',
      '/adlp/eligibility/eligibilityCheck': 'vehicles',
      // '/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders-new': 'service-reminders-settings',
      '/adlp/admin/admindashboard/manage-user': 'people',
      '/adlp/admin/admindashboard/notification': 'notifications',
      '/adlp/admin/admindashboard/driver-safety-score': 'driver-safety-settings',

    };

    // Find the matching submenu key
    this.activeSubmenu = Object.keys(submenuMapping).find(route => currentRoute.startsWith(route))
                        ? submenuMapping[currentRoute]
                        : '';

    console.log("Active Submenu:", this.activeSubmenu);

    // Close all menus
    this.showSmartMobilityMenu = false;
    this.showFuelManagementMenu = false;
    this.showDriverManagementMenu = false;
    this.showSafetyMenu = false;
    this.alertMenu = false;
    this.showSettingsMenu = false;


    // Open only the relevant menu
    if (['trip-planning', 'route-optimization', 'tracking-live-trip','geofence','dvir'].includes(this.activeSubmenu)) {
      this.showSmartMobilityMenu = true;
    } else if (['safety-summary', 'fleet-safety', 'driver-behaviour','safety-collsion','adas'].includes(this.activeSubmenu)) {
      this.showSafetyMenu = true;
    } else if (['driver-alerts', 'vehicle-alerts'].includes(this.activeSubmenu)) {
      this.alertMenu = true;
    } else if (['system-trips', 'schedule-trips'].includes(this.activeSubmenu)) {
      this.showTripHistoryMenu = true;
    }else if (['ice-fuel', 'ev-charge'].includes(this.activeSubmenu)) {
      this.showFuelManagementMenu = true;
    } else if (['manage-driver', 'driver-trip-summary'].includes(this.activeSubmenu)) {
      this.showDriverManagementMenu = true;
    }else if (['service-warnings', 'service-reminders','service-history'].includes(this.activeSubmenu)) {
      this.showMaintenanceMenu = true;
    }else if (['safety-events', 'live-view','video'].includes(this.activeSubmenu)) {
      this.showdashcamMenu = true;
    }else if (['vehicles', 'people', 'notifications', 'driver-safety-settings'].includes(this.activeSubmenu)) {
      this.showSettingsMenu = true;
    }

  }
  // Close all other menus
// closeAllMenus(): void {
//   console.log("closeAll");
//   this.showSmartMobilityMenu = false;
//   this.showFuelManagementMenu = false;
//   this.showDriverManagementMenu = false;
//   this.showSafetyMenu = false;
//   this.alertMenu = false;
// }
}
