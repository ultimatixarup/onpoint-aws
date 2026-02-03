import { Component, OnInit,HostListener } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router,NavigationEnd  } from '@angular/router';

@Component({
  selector: 'app-commonsidebar-fleet',
  templateUrl: './commonsidebar-fleet.component.html',
  styleUrls: ['./commonsidebar-fleet.component.scss']
})
export class CommonsidebarFleetComponent implements OnInit {
  activeRoute: string = '';
  activeSection: string | null = null;
  subscription$: Subscription = new Subscription();
  selectedMenuItem: string | null = null;
  tirePressure: any
  tirePressureChart: any;
  avgDistanceLowPressureChart: any;
  alertsCharts: any;
  batteryChart: any;
  chartVehicleAlerts: any
  emissionChart: any
  radialBar: any
  topFiveVins: string[] = [];
  providerData: any;
  threshold = 0;
  time = new Date();
  sho: boolean = false;
  oem: any = 'All';
  last5month: boolean = true;
  last5week: boolean = false;
  last5monthconsumed: boolean = true;
  lastWeek: boolean = false;
  lastDays: boolean = false;
  fleetIdData: any;
  selectedMonth: string | null = null;
  chartOptions4: any;
  chartOptions5: any;
  donutchart2: any;
  loginUser: any;
  eventsCall: any
  user: any;
  multiRoles: any;
  consumerList: any;
  aggresiveDriver: any;
  showSpinner: boolean = true;
  totalIdlingDuration: string = '';
  customConsumer: any;
  fleetList: any;
  fleetDetails: any;
  buttonSelected1: number = 1;
  buttonSelected: number = 1;
  chartWithTrip: any
  showLegendsAndValues: boolean = false;
  chartOptionsFleetMileage: any
  percenTages: number;
  chartOptionsseatBelts: any;
  date: Date;
  activeVehicles: any;
  driverScores: any = [];
  showNoDataImage: boolean = false;
  tripDetail: any;
  driverScore: any;
  tripData: any;
  activeVehicless: any;
  consumer: any = 'All'
  selectMonths: any
  selectedEvent: any = null;
  selectMonth: any
  selectEvents: any
  percenTage: number;
  vehicleSplit: any;
  totalActivatedVehicleCount: any;
  driverScoreDonut: any;
  vehicleSplitDonut: any;
  vehicleSplitDonuts: any
  vehicleFuelDonut: any;
  chartOptionsFuelConsumed: any;
  vehicleBodyClass: any;
  datachart: any;
  bodyChart: any;
  dataNew: any;
  chartOptionsFuel: any
  totalMilesDrivenCount: any;
  chartOptions10: any
  chartWithNoTrip: any
  newData: any;
  tripsdataLess: any;
  milesVehicle: any;
  percenTagesMiles: number;
  milesDriven: any;
  activatte: any;
  chartOptions: any;
  labelDatas: any;
  chartOptionnew: any;
  openIcon: boolean = false;
  closeIcon: boolean = true;
  Alerts: any;
  driver: any;
  milesDrivenMonthsWise: any;
  legendDataLabel!: string[];
  vehiclewithTrip: {};
  vehicleWithNotrip: {};
  fleetIdValue: any;
  batteriesStatus: any
  zeroData: number;
  totalIdlingTime: any;
  eventsCallHA: string;
  eventsCallHB: string;
  eventsCallHC: string;
  eventCallOS1: string;
  eventnight: string;
  idlingChart: any;
  totalDrivingTime: any;
  montlyMileageData: any;
  totaltripDuration: any;
  filteredDriver: any;
  fuelCostinDollar: any;
  averageFuelCost: any;
  fuelmileageChartMonthly: any;
  monthData:any;
  overview: boolean = true;
  summary: boolean = false;
  chargingCost: any;
  energyUsed: any;
  numberofSession: any;
  basic: boolean = true;
  advance:boolean = false;
  premium:boolean = false;
  isMenuActive = false;

  constructor(public router: Router, public http: HttpClient, private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService) {
    }

  ngOnInit() {
    this.showRole();
    const currentUrl = window.location.pathname;

    if (currentUrl.includes('/safetyCollision/safetyCollsion') || currentUrl.includes('/fleet-safety-card')) {
      this.expandedSections['safety'] = true;
    }

    if (currentUrl.includes('/dashboardfleet/fuel') || currentUrl.includes('/dashboardfleet/ev')) {
      this.expandedSections['sustainability'] = true;
    }
    if(this.user !='role_user_fleet'){
      this.selectConsumers()
      }
  }

  expandedSections: { [key: string]: boolean } = {}; // Object to track expanded sections

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section]; // Toggle section state
  }

  isExpanded(section: string): boolean {
    return !!this.expandedSections[section]; // Return true if section is expanded
  }


  toggleMenu() {
    this.isMenuActive = !this.isMenuActive;
  }

  viewMore(): void {
    if(this.user !='role_user_fleet'){
    if (this.customConsumer) {
      this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { consumer: this.customConsumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/fleetManageVehicles']);
    }
  }
  else{
    if (this.customConsumer) {
      this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/fleetManageVehicles']);
    }
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

}
