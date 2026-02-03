import { Component, OnInit,ViewChild } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { DashboardsService } from '../../../../dashboards.service';
import { catchError, pluck, shareReplay,finalize } from 'rxjs/operators';
import { TripReportService } from 'src/app/pages/dashboards/trip-report.service';
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
  selector: 'app-basic-telemetry-dashboard',
  templateUrl: './basic-telemetry-dashboard.component.html',
  styleUrls: ['./basic-telemetry-dashboard.component.scss']
})
export class BasicTelemetryDashboardComponent implements OnInit {
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
   timePeriods = [
    // { label: 'Till Date', value: 'tilldate' },
    { label: 'Today', value: 'today' },
    { label: 'Current Week', value: 'weekly' },
    { label: 'Current Month', value: 'monthly' },
    { label: 'Previous Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'customRange' },
  ];
  //selectedTimePeriod: string = '';
  isCardOpen = false;

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
   //this.loadFuelData();
    this.loadVehicleUsageSummary();
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
  selectedFleetDisplay: string = '';
 fuelEfficiencyData:any;
 // Fuel Consumed Data
//  fuelConsumedData = [
//   { vehicleName: 'SDH_Explorer_4', vin: '1FM5K8AB2PGB62045', fuelConsumed: 310.37, refuelAmount: 301.26, refuelCost: 948.88, averageMpg: 9.35 },
//   { vehicleName: 'SDH_Explorer_3', vin: '1FM5K8AB7PGB60162', fuelConsumed: 119.39, refuelAmount: 141.77, refuelCost: 446.52, averageMpg: 9.90 },
//   { vehicleName: 'SDH_F250_5', vin: '1FT7W2B62NEF64592', fuelConsumed: 75.16, refuelAmount: 97.55, refuelCost: 307.25, averageMpg: 9.99 },
//   { vehicleName: 'SDH_Explorer_2.2', vin: '1FM5K8AB7PGB13200', fuelConsumed: 168.82, refuelAmount: 71.48, refuelCost: 225.13, averageMpg: 9.33 }
// ];

// // Idling Data
// idlingData = [
//   { vehicleName: 'SDH_Explorer_4', vin: '1FM5K8AB2PGB62045', idlingHours: 97.9, totalDrivingHours: 287.28, idlingPercentage: 34.08, fuelWaste: 48.95, fuelWasteCost: 171.33 },
//   { vehicleName: 'SDH_Explorer_3', vin: '1FM5K8AB7PGB60162', idlingHours: 32.98, totalDrivingHours: 103.69, idlingPercentage: 31.81, fuelWaste: 16.49, fuelWasteCost: 57.72 },
//   { vehicleName: 'SDH_F250_5', vin: '1FT7W2B62NEF64592', idlingHours: 3.71, totalDrivingHours: 28.74, idlingPercentage: 12.92, fuelWaste: 1.86, fuelWasteCost: 6.50 },
//   { vehicleName: 'SDH_Explorer_2.2', vin: '1FM5K8AB7PGB13200', idlingHours: 45.11, totalDrivingHours: 135.68, idlingPercentage: 33.25, fuelWaste: 22.55, fuelWasteCost: 78.94 }
// ];

// // Refuel Data
// refuelData = [
//   { vehicleName: 'SDH_Explorer_4', vin: '1FM5K8AB2PGB62045', refuelEvents: 3, refuelAmount: 51.56, refuelCost: 237.18,
//   refuelDetails: [
//     { refuelTime: '2025-10-13T19:38:58', lastRefuelLocation: 'Morena Boulevard, Morena, San Diego, San Diego County, California, 92110, United States', fuelRefueled: 21.09 },
//     { refuelTime: '2025-10-05T20:37:43', lastRefuelLocation: '7-Eleven, Aero Drive, San Diego, San Diego County, California, 92123, United States', fuelRefueled: 16.22 },
//     { refuelTime: '2025-10-01T16:12:33', lastRefuelLocation: "Chevron, 1st Avenue, Cortez Hill, Banker's Hill, San Diego, San Diego County, California, 92101, United States", fuelRefueled: 14.25 }
//   ]
// },
//   { vehicleName: 'SDH_Explorer_2.2', vin: '1FM5K8AB7PGB13200', refuelEvents: 11, refuelAmount: 141.77, refuelCost: 446.52 },
//   { vehicleName: 'SDH_Explorer_3', vin: '1FM5K8AB7PGB60162', refuelEvents: 6, refuelAmount: 97.55, refuelCost: 307.25 },
//   { vehicleName: 'SDH_F250_5', vin: '1FT7W2B62NEF64592', refuelEvents: 3, refuelAmount: 71.48, refuelCost: 225.13 }
// ];

// Fuel Efficiency Data



  constructor(private spinner: NgxSpinnerService, private modalService: NgbModal,private toastr: ToastrService, private appService: AppService, public router: Router, public http: HttpClient,private dashboardservice: TaxonomyService,private routeOptimzeService:RouteOptimzeService,private timezoneService:TimezoneService,private dashboardsService:DashboardsService,private tripReportService:TripReportService) {
   }

  ngOnInit() {
    this.showRole();
    //this.loadFuelData();
    this.loadVehicleUsageSummary();
    this.loadVinList();
    this.selectConsumers()
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
   this.fleetIdData = '101218';
   }


    clearFleetId() {

    }

    selectedTimePeriodss: number = 6;


  onTimePeriodChangeData(selectedPeriod: string): void {

    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }
    //this.isCardOpen = selectedPeriod === 'customRange'; // When custom range is selected, show custom date input
     this.loadVehicleUsageSummary();
  }

  closeCard() {
    this.isCardOpen = false;
  }

  selectedOption: string = 'customRange';

  // Handles the selection of the time period and updates the displayed data accordingly
  handleOption(option: string): void {
    this.selectedOption = option;
    this.selectedPeriod = this.timePeriods.find(period => period.value === option)?.value || '';
    this.onTimePeriodChangeData(this.selectedPeriod);
  }

  // Handles the custom date range selection
  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
    this.selectedPeriod = 'customRange';
    this.loadVehicleUsageSummary();
  }


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

  fuelSummaryTotal: any = {};
  idlingSummaryTotal:any={};
  refuelSummaryTotal:any={};
  fuelConsumedData:any;
  idlingData:any;
  refuelData:any;

  loadFuelData(): void {
   // if (!this.fleetIdData) return;
   this.loading = true;
   const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);
   const selectedVin = this.selectedVin || ''; // Pass empty string if no VIN is selected
    forkJoin({
      fuel: this.dashboardsService.getFuelSummary(this.fleetIdData,this.selectedVin, startDate, endDate)
        .pipe(catchError(err => {
          console.error('Fuel Summary Error:', err);
          return of({ vehicles: [], summary: {} });
        })),
      idling: this.dashboardsService.getIdlingSummary(this.fleetIdData,this.selectedVin,  startDate,endDate)
        .pipe(catchError(err => {
          console.error('Idling Summary Error:', err);
          return of({ vehicles: [], summary: {} });
        })),
      refuel: this.dashboardsService.getRefuelSummary(this.fleetIdData,this.selectedVin,startDate,endDate)
        .pipe(catchError(err => {
          console.error('Refuel Summary Error:', err);
          return of({ vehicles: [], summary: {} });
        }))
    }).pipe(finalize(() => this.loading = false))
      .subscribe(result => {
        // Cast result as any to fix TS error
        const res = result as any;

        // Map Fuel Summary
        this.fuelConsumedData = res.fuel.vehicles.map((v: any) => ({
          vehicleName: v.vehicleName,
          vin: v.vin,
          fuelConsumed: v.fuelConsumedGallons,
          refuelAmount: v.refuelAmountGallons,
          refuelCost: v.refuelCostTotal,
          averageMpg: v.mpg
        }));
        this.fuelSummaryTotal = res.fuel.summary;

        // Map Idling Summary
        this.idlingData = res.idling.vehicles.map((v: any) => ({
          vehicleName: v.vehicleName,
          vin: v.vin,
          idlingHours: v.idlingHours,
          totalDrivingHours: v.totalDrivingHours,
          idlingPercentage: v.idlingPercentage,
          fuelWaste: v.approximateFuelWasteGallons,
          fuelWasteCost: v.approximateFuelWasteCost
        }));
        this.idlingSummaryTotal = res.idling.summary;

        // Map Refuel Summary
        this.refuelData = res.refuel.vehicles.map((v: any) => ({
          vehicleName: v.vehicleName,
          vin: v.vin,
          refuelEvents: v.refuelEvents,
          refuelAmount: v.refuelAmountGallons,
          refuelCost: v.refuelCost,
          refuelDetails: v.refuelDetails || []
        }));
        this.refuelSummaryTotal = res.refuel.summary;
        this.fuelEfficiencyData = this.filterFuelEfficiencyData(this.fleetIdData,this.selectedVin);
      });
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
  refuelDetails:any;
  selectedPeriod: any;

  getReFuelSummeryDetails(vin: string): void {
    this.refuelDetails = []; // should be an array
    const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);

    this.tripReportService.getReFuelTripSummary(vin, startDate, endDate).subscribe(
      (res: any) => {
        if (res && res.iceMetrics) {
          this.refuelDetails = res.iceMetrics;

          this.refuelDetails.forEach((trip: any, index: number) => {
            this.timezoneService
              .getLocalTimeFromUTC(trip.latitude, trip.longitude, trip.refuelTime)
              .subscribe((localTime: string) => {
                // Add or update refuelTime property in the same object
                this.refuelDetails[index].refuelTime = localTime;
              });
          });
        }
      },
      (error) => {
        console.error('Error fetching refuel summary:', error);
      }
    );
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
  //this.loadFuelData();
   this.loadVehicleUsageSummary();
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
filterFuelEfficiencyData(fleetId: string, vin: string) {
  // Static local dataset with fleetId included
  const allData = [
    {
      fleetId: '101218',
      vehicleName: 'SDH_Explorer_4',
      vin: '1FM5K8AB2PGB62045',
      idlingPercentage: 37,
      avgSpeed: 18.03,
      overSpeedingPercentage: 2,
      lowTyreDistancePercentage: 0,
      cityDriving: 6.76,
      highwayDriving: 15.65,
      averageMpg: 9.91,
      idealMpg: 11.74,
      fuelSavingOpportunities: 91.44,
      costSavingOpportunities: 320.04,
      fuelEfficiencyScore: 81
    },
    {
      fleetId: '101218',
      vehicleName: 'SDH_Explorer_3',
      vin: '1FM5K8AB7PGB60162',
      idlingPercentage: 33,
      avgSpeed: 18.16,
      overSpeedingPercentage: 12,
      lowTyreDistancePercentage: 100,
      cityDriving: 7.56,
      highwayDriving: 15.28,
      averageMpg: 10.07,
      idealMpg: 11.78,
      fuelSavingOpportunities: 43.52,
      costSavingOpportunities: 152.32,
      fuelEfficiencyScore: 82
    },
    {
      fleetId: '101218',
      vehicleName: 'SDH_Explorer_2.2',
      vin: '1FM5K8AB7PGB13200',
      idlingPercentage: 34,
      avgSpeed: 21.65,
      overSpeedingPercentage: 5,
      lowTyreDistancePercentage: 0,
      cityDriving: 7.59,
      highwayDriving: 16.51,
      averageMpg: 10.5,
      idealMpg: 11.69,
      fuelSavingOpportunities: 42.13,
      costSavingOpportunities: 147.455,
      fuelEfficiencyScore: 82
    },
    {
      fleetId: '101218',
      vehicleName: 'SDH_F250_5',
      vin: '1FT7W2B62NEF64592',
      idlingPercentage: 11,
      avgSpeed: 34.85,
      overSpeedingPercentage: 17,
      lowTyreDistancePercentage: 0,
      cityDriving: 6.82,
      highwayDriving: 13.23,
      averageMpg: 10.53,
      idealMpg: 13.31,
      fuelSavingOpportunities: 23.74,
      costSavingOpportunities: 83.09,
      fuelEfficiencyScore: 91
    }
  ];

  let filtered = allData;

  // ✅ Filter by Fleet ID
  if (fleetId) {
    filtered = filtered.filter(item => item.fleetId === fleetId);
  }

  // ✅ Filter by VIN (if selected)
  if (vin) {
    filtered = filtered.filter(item => item.vin === vin);
  }

  return filtered;
}
 staticResponse = {
    vehicles: [
      {
        vehicleName: 'SDH_Explorer_4',
        vin: '1FM5K8AB2PGB62045',
        milesDriven: 1438.47,
        engineHours: 152.61,
        tripCount: 81
      },
      {
        vehicleName: 'SDH_Explorer_2.2',
        vin: '1FM5K8AB7PGB13200',
        milesDriven: 1329.11,
        engineHours: 80.08,
        tripCount: 54
      },
      {
        vehicleName: 'SDH_Explorer_3',
        vin: '1FM5K8AB7PGB60162',
        milesDriven: 731.98,
        engineHours: 59.76,
        tripCount: 42
      },
      {
        vehicleName: 'SDH_F250_5',
        vin: '1FT7W2B62NEF64592',
        milesDriven: 531.89,
        engineHours: 14.51,
        tripCount: 50
      }
    ],
    pagination: {
      pageNumber: 0,
      pageSize: 50,
      totalElements: 4,
      totalPages: 1,
      first: true,
      last: true
    }
  };


basicTelemetryData: any[] = [];
  loadVehicleUsageSummary(): void {
    this.spinner.show();
   // this.basicTelemetryData = this.staticResponse.vehicles;
     const fleetId = this.fleetIdData || '101218';

    const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);
     const selectedVin = this.selectedVin || ''; // Pass empty string if no VIN is selected
    this.dashboardsService
      .getVehicleUsageSummary(fleetId, this.selectedVin, startDate, endDate)
      .subscribe({
        next: (res) => {
            this.basicTelemetryData = res?.vehicles || [];
            //this.basicTelemetryData = this.staticResponse.vehicles;
          this.spinner.hide();
        },
        error: (err) => {
          console.error('Error loading vehicle usage summary', err);
          this.spinner.hide();
        }
      });
    this.spinner.hide();
  }
   formatDuration(durationInSeconds) {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    let result = '';

    if (hours > 0) result += `${hours}h: `;
    if (minutes > 0 || hours > 0) result += `${minutes}m: `;
    result += `${seconds}s`;

    return result;
}
getTripSummeryDetails(vin: string): void {
  // Define your date range (you can adjust dynamically)
  const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);


  this.spinner.show();

  this.dashboardsService
    .getTripSummaryByDateRange(vin, startDate, endDate)
    .subscribe({
      next: (response: any) => {
        // Some APIs wrap data inside a property like `content` or `data`
        this.tripSummaryData = response?.content || [];
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching trip summary:', error);
        this.tripSummaryData = [];
        this.spinner.hide();
      }
    });
}

  }
