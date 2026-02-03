import { Component, OnInit,ViewChild } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexResponsive,
} from "ng-apexcharts";
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/app.service';
import { timeStamp } from 'console';
import { RouteOptimzeService } from '../../../../route-optimize.service';
import { TimezoneService } from '../../../../timezone.service';
import { DashboardsService } from '../../../../dashboards.service';
type ApexXAxis = {
  type?: "category" | "datetime" | "numeric";
  categories?: any;
  labels?: {
    style?: {
      colors?: string | string[];
      fontSize?: string;
    };
  };
};
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis | any;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  labels: string[];
  legend: ApexLegend;
  subtitle: ApexTitleSubtitle;
  responsive: ApexResponsive[];
  colors: string[];
};

@Component({
  selector: 'app-upcoming-maintenance-dashboard',
  templateUrl: './upcoming-maintenance-dashboard.component.html',
  styleUrls: ['./upcoming-maintenance-dashboard.component.scss']
})
export class UpcomingMaintenanceDashboardComponent implements OnInit {
  @ViewChild('nodatafound') nodatafound: any
   searchbyVinNumber:string = '';
   // selectedTimePeriodss: number = 6;
   searchbyAlerts: string | null = null;
   subscription$: Subscription = new Subscription();
   selectedMenuItem: string | null = null;
   fleetIdData: any;
   loginUser: any;
   user: any;
   multiRoles: any;
   consumerList: any;
   customConsumer: any;
   fleetList: any;
   consumer: any = 'All'
   currentDate: string = new Date().toISOString().split('T')[0];
   dataOfMonths = [
     { label: 'Last 30 Days', value: 1 },
     { label: 'Last 90 Days', value: 3 },
     { label: 'Last 6 Months', value: 6 },
     { label: 'Last 12 Months', value: 12 },
   ];
   allOptions = [
    { id: 'selectAll', name: 'Select All' },
    { id: 'Powertrain', name: 'Powertrain' },
    { id: 'Body', name: 'Body' },
    { id: 'Chassis', name: 'Chassis' },
    { id: 'Network', name: 'Network' }
];
   dtcTriggerByVehicles: any;
   dtcTriggerEvent: any;
   dtcTriggerByTypes: any;
   dtcTriggerEventx: any;
   dtceventRate: any;
   detailData: any;
   selectedTimePeriod: string = '1';
   filteredTableData: any[] = [
  ];
  /*  add demo purpose */
  selectedVin: string;
  vinList:any;
  tripSummaryData:any=[];
  filterByVin() {
   this.loadVehicleMaintenanceData();
    // Implement your filtering logic here
  }
  formatDurationSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  expandedRowIndex: number = -1;
  toggleExpand(index: number) {
    if (this.expandedRowIndex === index) {
      this.expandedRowIndex = -1;
    } else {
      this.expandedRowIndex = index;
    }
  }
  filteredTripData = []; // to store filtered results

  /*  end */
   tableData: any;
   typeDtcData: any;
   typeDtcVehicle: any;
   dtcbtEventRate: any;
   dtcBtEventRate: { categories: any; activeCounts: any; resolvedCounts: any; };
 tirePressure: any
   tirePressureChart: any;
   avgDistanceLowPressureChart: any;
   loading: boolean = false;
   batteryChart: any;
   Alerts: any;
   batteriesStatus: any
   serviceEventsData: any;
   vehicleMaintenanceData: any;
   validationVIN: boolean = true;
   vin: string
   fromDate: string;
   toDate: string;
   vinListData: any;
   //vinList: any;
   vinListDataForDownlaod: any;
   vinDownlaod: boolean = true;
   dateDownload: boolean = false;
   dateVinDownlaod: boolean = false;
   activeButton: string = '';
   rechargingCostVinDataforDowload: any[];
  fleetIdValueNew: any;
  fleetIds: any;
  lastTripCount: any;
  searchByStatus: string[] = [];
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  selectedPeriod: any;
  selectedFleetDisplay: string = '';


  constructor(private spinner: NgxSpinnerService, private modalService: NgbModal,private toastr: ToastrService, private appService: AppService, public router: Router, public http: HttpClient,private dashboardservice: TaxonomyService,private routeOptimzeService:RouteOptimzeService,private timezoneService:TimezoneService,private dashboardsService:DashboardsService) {
   }

  ngOnInit() {
    this.showRole();
    this.selectConsumers()
    this.loadVehicleMaintenanceData();
    this.loadVinList();
    this.filteredTableData = this.tableData
    .filter(item => item?.dtcStatus === 'Active' || item?.dtcStatus === 'Resolved')
    .slice(0, 10);

  }

  selectMenuItem(item: string) {
    this.selectedMenuItem = this.selectedMenuItem === item ? null : item;
  }

  async getAllConsumerss() {
    try {
      // Fetch all consumers
      const response = await this.dashboardservice
        .getAllConsumerss(this.customConsumer)
        .pipe(
          pluck("data"),
          catchError(() => of([])),  // Return an empty array on error
          shareReplay(1)
        )
        .toPromise();

      // Map and filter the consumer list
      this.consumerList = (response as Consumer[]).filter((item) => item.contract).map((item) => ({
        name: item.name,
        startDate: this.formatDatedForActive(item.contract.startDate)
      }));

      const excludedConsumers = new Set([
        "Slick", "OneStep", "Arvind_insurance", "HD Fleet LLC", "GEICO",
        "Forward thinking GPS", "Geo Toll", "Matrack",
        "Geico", "Test fleet", "Rockingham", "Axiom", "GeoToll",
      ]);

      // Remove excluded consumers
      this.consumerList = this.consumerList.filter(item => !excludedConsumers.has(item.name));

      // Filter consumers by the customConsumer name
      this.consumerList = this.consumerList.filter(item => item.name === this.customConsumer);
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error fetching consumers:", error);
    }
  }


  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }



  clearFleetSelection(){


   }

    clearFleetId() {

    }

    selectedTimePeriodss: number = 6;




isAllSelected() {
  return this.searchByStatus.length === this.allOptions.length - 1;
}



  showAll: boolean = false;

  isLoading: boolean = false
  selectedFilter: string | null = null;








  dataUpdate: boolean = false;









    // Old Code
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if(this.user === 'role_user_fleet'){
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew
      }
  }

  isVin(alias: string): boolean {
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/; // VIN is alphanumeric, excluding I, O, and Q
    return vinPattern.test(alias);
  }
  maskVin(vin: string): string {
    if (vin && vin.length >= 3) { // Add a null check for vin
      return '**************' + vin.slice(-3);
    } else {
      return vin;
    }
  }
    loadVinList(): void {
    const consumer = 'Smallboard'; // Example value (you can change it dynamically)
    const fleetId = this.fleetIdData; // Example fleetId
    const startDate = ''; // Pass empty to use default
    const endDate = ''; // Pass empty to use default

    this.dashboardservice.getManageListDownloadConsumers(consumer, fleetId, startDate, endDate)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.vinList = response.map((item) => ({
              vin: item.vin,
              alias: item.alias || item.vin // Use alias if available, else VIN
            }));
          }
        },
        error: (error) => {
          console.error('Error fetching VIN list:', error);
        }
      });
  }
searchByConsumer: any
selectFleetId() {
  this.loadVinList();
  this.loadVehicleMaintenanceData();
  this.onTimePeriodChangeData(this.selectedPeriod);
  if (!this.searchByConsumer) {
    this.searchByConsumer = 'All';
  }
}

monthData: any;
//dateRange: any
selectConsumers() {
  this.subscription$.add(
    this.dashboardservice.getFleetList(this.customConsumer).subscribe(
      (res: any) => {
        this.fleetList = res;
        this.fleetList = this.fleetList.sort((a, b) => {
          return a.id - b.id;
        });
        this.fleetIdData = null;
        this.monthData = null;
      },
      (err) => { }
    )
  );

}
 isCardOpen = false;
   onTimePeriodChangeData(selectedPeriod: string): void {

    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }
    //this.isCardOpen = selectedPeriod === 'customRange'; // When custom range is selected, show custom date input
    this.loadVehicleMaintenanceData();
  }
    private formatDateTime(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');

    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),  // Months are 0-based
      pad(date.getUTCDate())
    ].join('-') + 'T' + [
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds())
    ].join(':');
  }
  private calculateDateRange(period: string): { startDate: string, endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch(period) {
      case 'tilldate':
        startDate = new Date(Date.UTC(2000, 0, 1));
        break;
      case 'today':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        ));
        endDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23, 59, 59
        ));
        break;
      case 'weekly':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - now.getUTCDay()
        ));
        break;
      case 'monthly':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1
        ));
        endDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          0,
          23, 59, 59
        ));
        break;
      case 'lastmonth':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() - 1,
          1
        ));
        endDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          0,
          23, 59, 59
        ));
        break;
      case 'customRange':
          startDate = new Date(`${this.fromDate}T00:00:00`); // Convert to UTC

          endDate = new Date(`${this.toDate}T23:59:59`); // End of the selected da

        break;
      default:
        startDate = new Date(Date.UTC(2000, 0, 1));
        break;
    }

    return {
      startDate: this.formatDateTime(startDate),
      endDate: this.formatDateTime(endDate)
    };
  }
oilChangeData: any[] = [];
repairMaintenanceData: any[] = [];
tyreServiceData: any[] = [];
batteryServiceData: any[] = [];
brakeServiceData: any[] = []; // if you plan to add brake API later
noData = {
  oil: false,
  repair: false,
  tyre: false,
  battery: false,
  brake: false
};

loadVehicleMaintenanceData() {
  this.spinner.show();

  const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);
  const selectedVin = this.selectedVin || '';

  const requests = {
    oil: this.dashboardsService.getOilChange(this.fleetIdData, selectedVin, startDate, endDate),
    repair: this.dashboardsService.getRepairMaintenance(this.fleetIdData, selectedVin, startDate, endDate),
    tyre: this.dashboardsService.getTyreService(this.fleetIdData, selectedVin, startDate, endDate),
    battery: this.dashboardsService.getBatteryService(this.fleetIdData, selectedVin, startDate, endDate),
    // brake: this.dashboardsService.getBrakeService(this.fleetIdData, selectedVin, startDate, endDate) // future use
  };

  this.subscription$.add(
    forkJoin(requests).subscribe({
      next: (res: any) => {
        // ✅ safely handle undefined responses
        this.oilChangeData = res.oil?.vehicles || [];
        this.repairMaintenanceData = res.repair?.vehicles || [];
        this.tyreServiceData = res.tyre?.vehicles || [];
        this.batteryServiceData = res.battery?.vehicles || [];
        this.brakeServiceData = res.brake?.vehicles || [];

        // ✅ Only process address for oil change vehicles
        const validOilVehicles = this.oilChangeData.filter(
          (v: any) => v.latitude && v.longitude
        );

        if (validOilVehicles.length > 0) {
          const addressRequests = validOilVehicles.map((vehicle: any) =>
            this.timezoneService.getAddressFromLatLng(vehicle.latitude, vehicle.longitude)
          );

          forkJoin(addressRequests).subscribe({
            next: (addresses: string[]) => {
              validOilVehicles.forEach((v: any, i: number) => {
                v.address = addresses[i];
              });
            },
            error: (err) => {
              console.error('Address fetch failed:', err);
            },
            complete: () => {
              this.spinner.hide();
            }
          });
        } else {
          this.spinner.hide();
        }
      },
      error: (err) => {
        console.error('Maintenance data fetch error:', err);
        this.spinner.hide();
      }
    })
  );
}




  }
