import { Component, OnInit,ViewChild } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';

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
  selector: 'app-geofence-report-details',
  templateUrl: './geofence-report-details.component.html',
  styleUrls: ['./geofence-report-details.component.scss']
})
export class GeofenceReportDetailsComponent implements OnInit {
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
   geofenceSummaryData = [
    {
      vin: '1FM5K8AB2PGB62045',
      vehicleName: 'SDH_Explorer_4',
      geofenceName: 'Main Office',
      address: 'Downtown Street',
      numberOfIn: 2,
      durationSpent: '1h: 23m: 30s',
      lastEntry: 'Oct 22, 2025, 4:10 AM (PDT)',
      lastExit: 'Oct 22, 2025, 11:15 AM (PDT)',
      details: [
        {
          date: 'Oct 21, 2025',
          timeIn: 'Oct 21, 2025, 9:30 AM (PDT)',
          timeOut: 'Oct 21, 2025, 10:15 AM (PDT)',
          duration: '45m: 00s',
        },
        {
          date: 'Oct 22, 2025',
          timeIn: 'Oct 22, 2025, 4:10 AM (PDT)',
          timeOut: 'Oct 22, 2025, 5:00 AM (PDT)',
          duration: '50m: 00s',
        },
      ],
    },
    {
      vin: '1FM5K8AB7PGB60162',
      vehicleName: 'SDH_Explorer_3',
      geofenceName: 'San Jose Project',
      address: 'San Jose',
      numberOfIn: 6,
      durationSpent: '50m: 00s',
      lastEntry: 'Oct 22, 2025, 10:00 AM (PDT)',
      lastExit: 'Oct 22, 2025, 10:45 AM (PDT)',
      details: [
        {
          date: 'Oct 22, 2025',
          timeIn: 'Oct 22, 2025, 10:00 AM (PDT)',
          timeOut: 'Oct 22, 2025, 10:45 AM (PDT)',
          duration: '45m: 00s',
        },
      ],
    },
    {
      vin: '1FT7W2B62NEF64592',
      vehicleName: 'SDH_F250_5',
      geofenceName: 'XYZ Depot',
      address: 'Industrial Area',
      numberOfIn: 8,
      durationSpent: '5h: 20m: 00s',
      lastEntry: 'Oct 22, 2025, 8:30 AM (PDT)',
      lastExit: 'Oct 22, 2025, 10:00 AM (PDT)',
      details: [
        {
          date: 'Oct 22, 2025',
          timeIn: 'Oct 22, 2025, 8:30 AM (PDT)',
          timeOut: 'Oct 22, 2025, 10:00 AM (PDT)',
          duration: '1h: 30m: 00s',
        },
      ],
    },
    {
      vin: '1FM5K8AB7PGB13200',
      vehicleName: 'SDH_Explorer_2.2',
      geofenceName: 'Construction Site',
      address: 'Bay Area',
      numberOfIn: 25,
      durationSpent: '2h: 30m: 00s',
      lastEntry: 'Oct 22, 2025, 2:15 PM (PDT)',
      lastExit: 'Oct 22, 2025, 3:15 PM (PDT)',
      details: [
        {
          date: 'Oct 22, 2025',
          timeIn: 'Oct 22, 2025, 2:15 PM (PDT)',
          timeOut: 'Oct 22, 2025, 3:15 PM (PDT)',
          duration: '1h: 00m: 00s',
        },
      ],
    },
  ];



  constructor(private spinner: NgxSpinnerService, private modalService: NgbModal,private toastr: ToastrService, private appService: AppService, public router: Router, public http: HttpClient,private dashboardservice: TaxonomyService,private routeOptimzeService:RouteOptimzeService,private timezoneService:TimezoneService) {
   }

  ngOnInit() {
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

   selectFleetId() {

  }

    clearFleetId() {

    }

    selectedTimePeriodss: number = 6;


  onTimePeriodChangeData(selectedPeriod: string) {
    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedTimePeriod) {
      //this.dtcSummaryReportData()
    }
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


  }
