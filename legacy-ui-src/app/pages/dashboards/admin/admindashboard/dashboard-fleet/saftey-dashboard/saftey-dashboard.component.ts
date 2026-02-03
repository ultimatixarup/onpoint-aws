import { Component, OnInit,ViewChild } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { DashboardsService } from '../../../../dashboards.service';
import { catchError, pluck, shareReplay,finalize } from 'rxjs/operators';

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
  selector: 'app-saftey-dashboard',
  templateUrl: './saftey-dashboard.component.html',
  styleUrls: ['./saftey-dashboard.component.scss']
})
export class SafteyDashboardComponent implements OnInit {
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
   this.loadSafetySummary();
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
  expandedRowOverspeedIndex: number = -1;
  toggleExpandOverspeed(index: number) {
    if (this.expandedRowOverspeedIndex === index) {
      this.expandedRowOverspeedIndex = -1;
    } else {
      this.expandedRowOverspeedIndex = index;
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
//   safetySummaryData = [
//     {
//       vehicleName: 'SDH_Explorer_4',
//       vin: '1FM5K8AB2PGB62045',
//       overSpeedingPercentage: 2.55,
//       over80MphPercentage: 0.04,
//       topSpeed: 76.3,
//       overSpeedingMiles: 73.94,
//       over80MphMiles: 1.24,
//       milesDriven: 2900.56,
//       tripDetails: [
//         {
//           vin: '1FM5K8AB2PGB62045',
//           tripId: 'FF_9475F9AA9C7211F0ADB212657196BBD1',
//           startTimestamp: '9/28/2025 13:53',
//           endTimestamp: '9/28/2025 19:27',
//           milesDriven: 104.16,
//           durationHours: 5.57,
//           hbCount: 30,
//           hcCount: 0,
//           haCount: 0,
//           seatbeltViolations: 0,
//           overSpeedMiles: 9,
//           over80MphMiles: 0,
//           videoClipUrl: null
//         }
//       ]
//     },
//     {
//       vehicleName: 'SDH_Explorer_3',
//       vin: '1FM5K8AB7PGB60162',
//       overSpeedingPercentage: 12.56,
//       over80MphPercentage: 0.58,
//       topSpeed: 77.17,
//       overSpeedingMiles: 148.51,
//       over80MphMiles: 6.84,
//       milesDriven: 1182.47,
//       tripDetails: [
//         {
//           vin: '1FM5K8AB7PGB60162',
//           tripId: 'FF_04C474D5999D11F09A0612657196BBD1',
//           startTimestamp: '9/24/2025 23:20',
//           endTimestamp: '9/25/2025 2:11',
//           milesDriven: 35.34,
//           durationHours: 2.86,
//           hbCount: 0,
//           hcCount: 0,
//           haCount: 0,
//           seatbeltViolations: 0,
//           overSpeedMiles: 9,
//           over80MphMiles: 0,
//           videoClipUrl: null
//         }
//       ]
//     },
//     {
//       vehicleName: 'SDH_F250_5',
//       vin: '1FT7W2B62NEF64592',
//       overSpeedingPercentage: 21.11,
//       over80MphPercentage: 0.0,
//       topSpeed: 76.3,
//       overSpeedingMiles: 158.45,
//       over80MphMiles: 0.0,
//       milesDriven: 750.62,
//       tripDetails: [
//         {
//           vin: '1FT7W2B62NEF64592',
//           tripId: 'FF_2E574EDB942311F09DFB12657196BBD1',
//           startTimestamp: '9/18/2025 0:05',
//           endTimestamp: '9/18/2025 2:02',
//           milesDriven: 67.58,
//           durationHours: 1.95,
//           hbCount: 0,
//           hcCount: 0,
//           haCount: 0,
//           seatbeltViolations: 0,
//           overSpeedMiles: 25,
//           over80MphMiles: 0,
//           videoClipUrl: null
//         }
//       ]
//     },
//     {
//       vehicleName: 'SDH_Explorer_2.2',
//       vin: '1FM5K8AB7PGB13200',
//       overSpeedingPercentage: 3.43,
//       over80MphPercentage: 0.04,
//       topSpeed: 75.25,
//       overSpeedingMiles: 54.06,
//       over80MphMiles: 0.62,
//       milesDriven: 1574.55,
//       tripDetails: [
//         {
//           vin: '1FM5K8AB7PGB13200',
//           tripId: 'FF_4DCB1D1B975811F0A22D12657196BBD1',
//           startTimestamp: '9/22/2025 2:02',
//           endTimestamp: '9/22/2025 3:14',
//           milesDriven: 31.62,
//           durationHours: 1.2,
//           hbCount: 0,
//           hcCount: 0,
//           haCount: 0,
//           seatbeltViolations: 0,
//           overSpeedMiles: 2,
//           over80MphMiles: 0,
//           videoClipUrl: null
//         }
//       ]
//     }
//   ];

// safetySummaryDataNew = [
//   {
//     vehicleName: 'SDH_Explorer_4',
//     vin: '1FM5K8AB2PGB62045',
//     haPer100Miles: 0.07,
//     hbPer100Miles: 5.03,
//     hcPer100Miles: 0.03,
//     seatbeltViolations: 22,
//     overSpeedingPercentage: 2.55,
//     over80MphPercentage: 0.04,
//     safetyScore: 51,
//     tripDetails: [
//       {
//         vin: '1FM5K8AB2PGB62045',
//         tripId: 'FF_0BEAB89682BE11F08B2412657196BBD1',
//         startTimestamp: '8/26/2025 20:48',
//         endTimestamp: '8/26/2025 22:43',
//         milesDriven: 22.94,
//         durationHours: 1.92,
//         hbCount: 0,
//         hcCount: 1,
//         haCount: 0,
//         seatbeltViolations: 0,
//         overSpeedMiles: 3.72,
//         over80MphMiles: 0,
//         videoClipUrl: null
//       },
//       {
//         vin: '1FM5K8AB2PGB62045',
//         tripId: 'FF_7112AF98760A11F0B8F112657196BBD1',
//         startTimestamp: '8/10/2025 16:52',
//         endTimestamp: '8/10/2025 17:00',
//         milesDriven: 2.48,
//         durationHours: 0.12,
//         hbCount: 0,
//         hcCount: 0,
//         haCount: 2,
//         seatbeltViolations: 0,
//         overSpeedMiles: 0,
//         over80MphMiles: 0,
//         videoClipUrl: null
//       }
//     ]
//   },
//   {
//     vehicleName: 'SDH_Explorer_3',
//     vin: '1FM5K8AB7PGB60162',
//     haPer100Miles: 0.08,
//     hbPer100Miles: 4.65,
//     hcPer100Miles: 0.0,
//     seatbeltViolations: 5,
//     overSpeedingPercentage: 12.56,
//     over80MphPercentage: 0.58,
//     safetyScore: 44,
//     tripDetails: [
//       {
//         vin: '1FM5K8AB7PGB60162',
//         tripId: 'FF_9E2B88717BCF11F0B13D12657196BBD1',
//         startTimestamp: '8/18/2025 1:05',
//         endTimestamp: '8/18/2025 1:54',
//         milesDriven: 9.92,
//         durationHours: 0.8,
//         hbCount: 2,
//         hcCount: 0,
//         haCount: 1,
//         seatbeltViolations: 0,
//         overSpeedMiles: 0,
//         over80MphMiles: 0,
//         videoClipUrl: null
//       }
//     ]
//   },
//   {
//     vehicleName: 'SDH_F250_5',
//     vin: '1FT7W2B62NEF64592',
//     haPer100Miles: 0.13,
//     hbPer100Miles: 2.8,
//     hcPer100Miles: 0.0,
//     seatbeltViolations: 3,
//     overSpeedingPercentage: 21.11,
//     over80MphPercentage: 0.0,
//     safetyScore: 50,
//     tripDetails: [
//       {
//         vin: '1FT7W2B62NEF64592',
//         tripId: 'FF_C857D7999D4D11F0A84412657196BBD1',
//         startTimestamp: '9/29/2025 16:02',
//         endTimestamp: '9/29/2025 16:09',
//         milesDriven: 1.86,
//         durationHours: 0.12,
//         hbCount: 0,
//         hcCount: 0,
//         haCount: 1,
//         seatbeltViolations: 0,
//         overSpeedMiles: 0,
//         over80MphMiles: 0,
//         videoClipUrl: null
//       }
//     ]
//   },
//   {
//     vehicleName: 'SDH_Explorer_2.2',
//     vin: '1FM5K8AB7PGB13200',
//     haPer100Miles: 0.0,
//     hbPer100Miles: 6.54,
//     hcPer100Miles: 0.0,
//     seatbeltViolations: 9,
//     overSpeedingPercentage: 3.43,
//     over80MphPercentage: 0.04,
//     safetyScore: 72,
//     tripDetails: []
//   }
// ];

  constructor(private spinner: NgxSpinnerService, private modalService: NgbModal,private toastr: ToastrService, private appService: AppService, public router: Router, public http: HttpClient,private dashboardservice: TaxonomyService,private routeOptimzeService:RouteOptimzeService,private timezoneService:TimezoneService,private dashboardsService:DashboardsService) {
   }

  ngOnInit() {
    this.showRole();
    this.loadSafetySummary();
    this.loadVinList();
    this.selectConsumers();
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
  overspeedingSummary:any;
  safetySummaryData:any;
  safetySummaryDataNew:any;
  loadSafetySummary(): void {
    this.spinner.show();
    this.loading = true;
   const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);
   const selectedVin = this.selectedVin || ''; // Pass empty string if no VIN is selected
    forkJoin({
      overspeeding: this.dashboardsService.getOverspeeding(this.fleetIdData,this.selectedVin, startDate, endDate),
      safety: this.dashboardsService.getSafetyEvents(this.fleetIdData, this.selectedVin,startDate, endDate)
    })
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (res) => {
          // ✅ Overspeeding data extraction
          this.safetySummaryData = res.overspeeding?.vehicles || [];
          this.overspeedingSummary = res.overspeeding?.summary || {};
          //this.extractVinList(this.safetySummaryData);

          // ✅ Safety data extraction
          this.safetySummaryDataNew = res.safety?.vehicles || [];

          console.log('Overspeeding Summary:', this.overspeedingSummary);
        },
        error: (err) => {
          console.error('Error fetching safety summary:', err);
          this.safetySummaryData = [];
          this.safetySummaryDataNew = [];
        }
      });
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
  selectedPeriod: any;
  searchByConsumer: any
selectFleetId() {
  this.loadVinList();
  this.loadSafetySummary();
  this.onTimePeriodChangeData(this.selectedPeriod);
  if (!this.searchByConsumer) {
    this.searchByConsumer = 'All';
  }
}
   onTimePeriodChangeData(selectedPeriod: string): void {

    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }
    //this.isCardOpen = selectedPeriod === 'customRange'; // When custom range is selected, show custom date input
    this.loadSafetySummary();
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
    this.loadSafetySummary();
  }
  tripDetails:any;
   getOverspeedSummeryDetails(vin: string): void {
    this.tripDetails = []; // should be an array
    const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);

    this.dashboardsService.getOverspeedTripSummary(this.fleetIdData,vin, startDate, endDate).subscribe(
      (res: any) => {
        if (res && res.trips) {
          this.tripDetails = res.trips;

        }
      },
      (error) => {
        console.error('Error fetching refuel summary:', error);
      }
    );
  }
  tripSafetyDetails:any=[];
  getSafetySummeryDetails(vin: string): void {
    this.tripSafetyDetails = []; // should be an array
    const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);

    this.dashboardsService.getSafetyTripSummary(this.fleetIdData,vin, startDate, endDate).subscribe(
      (res: any) => {
        if (res && res.trips) {
          this.tripSafetyDetails = res.trips;

        }
      },
      (error) => {
        console.error('Error fetching refuel summary:', error);
      }
    );
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
  monthData: any;
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
  }
