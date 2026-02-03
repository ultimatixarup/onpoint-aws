import { Component, OnInit,ViewChild } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { take, tap, catchError, pluck, shareReplay } from 'rxjs/operators';
import * as ExcelJS from "exceljs";
import * as FileSaver from "file-saver";
import * as XLSX from 'xlsx';
import moment from 'moment';
import { TimezoneService } from '../../../../timezone.service';
import { forkJoin } from 'rxjs';
import { RouteOptimzeService } from '../../../../route-optimize.service';
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
  selector: 'app-fleet-maintenance',
  templateUrl: './fleet-maintenance.component.html',
  styleUrls: ['./fleet-maintenance.component.scss']
})
export class FleetMaintenanceComponent implements OnInit {
  @ViewChild('nodatafound') nodatafound: any
   searchbyVinNumber:string = '';
   // selectedTimePeriodss: number = 6;
   searchbyAlerts: any = 'Active'
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
   filteredTableData: any[] = [];
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
   vinList: any;
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
  groupList: any;
  constructor(private timezoneService: TimezoneService,private spinner: NgxSpinnerService, private modalService: NgbModal,private toastr: ToastrService, private appService: AppService, public router: Router, public http: HttpClient,private dashboardservice: TaxonomyService, private routeOptimzeService:RouteOptimzeService) {
   }

  ngOnInit() {
    this.selectConsumers()
    // this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    // this.timezoneService.timezone$.subscribe((tz) => {
    //   this.selectedTimezone = tz;
    //   this.updateTime()
    // });
    this.fetchOilChangeAlerts();
    this.showRole();
    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }
    this.updateDasboard()
    this.filteredTableData = this.tableData
    .filter(item => item?.dtcStatus === 'Active' || item?.dtcStatus === 'Resolved')
    .slice(0, 10);

    // Fetch oil change alerts for service warnings after fleetId is set


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

  updateDasboard() {
    this.getTotalActivatedVehicle()
    this.getDriverScores()
    this.lowPressurePercentage()
    this.battery()
    this.vehicleMaintenances()
    this.dtcSummaryReportData();
    this.dtcTriggeredbyType();
    this.dtcTriggeredbyVehicle();
    this.dtcTriggeredCount();
    this.dtcEvent()
  }

  clearFleetSelection(){
    this.selectConsumers();
    this.updateDasboard();
    this.fetchOilChangeAlerts();
   }

   selectFleetId() {
    this.selectGroupId()
    this.getTotalActivatedVehicle()
    this.getDriverScoresFleet()
    this.lowPressurePercentageFleet()
    this.batteryFleet()
    this.vehicleMaintenances()
    this.dtcSummaryReportData();
    this.dtcTriggeredbyType();
    this.dtcTriggeredbyVehicle();
    this.dtcTriggeredCount();
    this.dtcEvent()
    this.fetchOilChangeAlerts();
  }


  groupIdData: any;
  selectGroupId() {
    if (!this.fleetIdData) return;

    this.subscription$.add(
      this.dashboardservice.getOrganizationSubGroups(this.fleetIdData).subscribe((res: any) => {
        const nestedGroups = res?.groups || [];

        // Flatten groups & subgroups into one list
        this.groupList = this.flattenGroups(nestedGroups);

        // Optionally preselect a default if needed
        // this.groupIdData = this.groupList[0]?.id; // optional
      }, err => {
        console.error('Error fetching sub-groups:', err);
      })
    );
  }

  // Flatten function to preserve hierarchy with indentation
  flattenGroups(groups: any[], level: number = 0): any[] {
    let flatList: any[] = [];

    for (const group of groups) {
      // Add current group with level info
      flatList.push({
        id: group.id,
        name: group.name, // Adds visual indentation
        parentGroupId: group.parentGroupId ?? 0,
        level: level
      });

      // Recursively flatten subgroups (if any)
      if (group.subgroups && group.subgroups.length > 0) {
        flatList = flatList.concat(this.flattenGroups(group.subgroups, level + 1));
      }
    }

    return flatList;
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
  this.getTotalActivatedVehicle()
  this.getDriverScoresFleet()
  this.lowPressurePercentageFleet()
  this.batteryFleet()
  this.vehicleMaintenances()
  this.dtcSummaryReportData();
  this.dtcTriggeredbyType();
  this.dtcTriggeredbyVehicle();
  this.dtcTriggeredCount();
  this.dtcEvent()
  this.fetchOilChangeAlerts();
}

    clearFleetId() {
    this.dtcSummaryReportData();
    this.dtcTriggeredbyType();
    this.dtcTriggeredbyVehicle();
    this.dtcTriggeredCount();
    this.dtcEvent()
      this.getDriverScoresFleet()
      this.lowPressurePercentageFleet()
      this.batteryFleet()
    }

    selectedTimePeriodss: number = 6;
    async onTimePeriodChanges(event: number) {
      this.selectedTimePeriodss = event;
      if (event === 1) {
        this.dtcTriggeredbyType();
        this.dtcTriggeredbyVehicle();
        this.dtcTriggeredCount1()
        this.dtcEvent1()
      }
      else {
        this.dtcTriggeredbyType();
      this.dtcTriggeredbyVehicle();
      this.dtcTriggeredCount();
      this.dtcEvent()
      }
    }

  onTimePeriodChangeData(selectedPeriod: string) {
    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedTimePeriod) {
      this.dtcSummaryReportData()
    }
  }


isAllSelected() {
  return this.searchByStatus.length === this.allOptions.length - 1;
}

toggleSelectAll(event: Event) {
  if ((event.target as HTMLInputElement).checked) {
      this.searchByStatus = this.allOptions.filter(option => option.id !== 'selectAll').map(option => option.id);
  } else {
      this.searchByStatus = [];
  }
  this.filterTableData();
}

updateTime(){
  this.filteredTableData.forEach(vehicle => {
    if (vehicle.dtcRaisedTime) {
      vehicle.formattedDate = moment.utc(vehicle.dtcRaisedTime)
        .tz(this.selectedTimezone)
        .format('MMM D, YYYY');

      vehicle.formattedTime = moment.utc(vehicle.dtcRaisedTime)
        .tz(this.selectedTimezone)
        .format('HH:mm');
    } else {
      vehicle.formattedDate = '--';
      vehicle.formattedTime = '--';
    }
  });
}

  showAll: boolean = false;
  dtcSummaryReportData() {
    this.subscription$.add(
      this.dashboardservice
        .maintenanceSummaryData(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriod)
        .pipe(take(1))
        .subscribe((res: any) => {
          this.detailData = res;
          this.updateTime()
          this.tableData = res?.dtcSummary || [];

          // Filter only 'Active' rows and show top 10 initially
          const activeData = this.tableData.filter(item => item?.dtcStatus === 'Active');
          this.filteredTableData = activeData.slice(0, 10);
         this.updateTime()
        })
    );
  }
  isLoading: boolean = false
  selectedFilter: string | null = null;
  toggleViewMore() {
    this.isLoading = true;
    setTimeout(() => {
        const currentCount = this.filteredTableData.length;

        let filteredRecords = this.tableData.filter(
            item => item.dtcStatus === 'Active' || item.dtcStatus === 'Resolved'
        );
        // Apply filtering for Active and Resolved based on searchbyAlerts
        if (this.searchbyAlerts === 'Active') {
            filteredRecords = filteredRecords.filter(item => item.dtcStatus === 'Active');
        } else if (this.searchbyAlerts === 'Resolved') {
            filteredRecords = filteredRecords.filter(item => item.dtcStatus === 'Resolved');
        }

        if (currentCount < filteredRecords.length) {
            this.filteredTableData = filteredRecords.slice(0, currentCount + 100);
        }
        this.isLoading = false; // Hide the spinner
    }, 300); // Simulating loading time
}

  get totalActiveResolvedCount(): number {
    return this.tableData?.filter(
      item => item?.dtcStatus === 'Active' || item?.dtcStatus === 'Resolved'
    ).length || 0; // Ensures it returns 0 if tableData is undefined
  }

  filterTableData() {
    this.isLoading = true;
    setTimeout(() => {
        let filteredRecords = this.tableData.filter(data =>
            (!this.searchbyVinNumber || data.alias?.toLowerCase().includes(this.searchbyVinNumber.toLowerCase())) &&
            (!this.searchbyAlerts || data.dtcStatus === this.searchbyAlerts) &&
            (!this.searchByStatus?.length || this.searchByStatus.includes(data.dtcType))

        );
        if (this.searchbyAlerts === 'Active' || this.searchbyAlerts === 'Resolved') {
            // Get only 10 Active and 10 Resolved records initially
            const activeRecords = filteredRecords.filter(item => item.dtcStatus === 'Active').slice(0, 10);
            const resolvedRecords = filteredRecords.filter(item => item.dtcStatus === 'Resolved').slice(0, 10);
            this.filteredTableData = [...activeRecords, ...resolvedRecords];
        } else {
            this.filteredTableData = filteredRecords;
        }

        if (this.filteredTableData.length === 0) {
            this.filteredTableData = [{ alias: 'No Data Found', dtc: '', dtcType: '', dtcStatus: '' }];
        }
        this.isLoading = false; // Hide loading indicator
    }, 0);
}

  dtcTriggeredCount() {
    this.subscription$.add(
      this.dashboardservice.dtceventCount(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
        if (!res || !res.dtcStatusCount || res.dtcStatusCount.length === 0) {
          console.warn("Empty or invalid response");
          return;
        }

        // Sort yearMonth in ascending order (oldest first)
        const sortedData = res.dtcStatusCount.sort((a: any, b: any) => a.yearMonth.localeCompare(b.yearMonth));

        // Format yearMonth as "MMM'YY" (e.g., "Oct'24")
        const formattedMonths = sortedData.map(item => {
          const [year, month] = item.yearMonth.split("-");
          return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" }) + "'" + year.slice(2);
        });

        // Extract Active and Resolved counts
        const activeCounts = sortedData.map(item => item.activeCount);
        const resolvedCounts = sortedData.map(item => item.resolvedCount);

        // Store formatted data
        this.dtcBtEventRate = {
          categories: formattedMonths,
          activeCounts,
          resolvedCounts
        };

        // Call dtcTrigger() with updated data
        this.dtcTrigger();
      })
    );
  }

  dtcTrigger() {
    if (!this.dtcBtEventRate || !this.dtcBtEventRate.activeCounts || !this.dtcBtEventRate.resolvedCounts) {
      console.warn("dtcBtEventRate data is not available yet.");
      return;
    }

    const activeCounts = this.dtcBtEventRate.activeCounts;
    const resolvedCounts = this.dtcBtEventRate.resolvedCounts;

    const maxValue = Math.max(...activeCounts, ...resolvedCounts); // Get highest value

    let yAxisMax = 60; // Default max value
    if (maxValue > 60) yAxisMax = 300;
    if (maxValue > 300) yAxisMax = 1200;
    if (maxValue > 1200) yAxisMax = 3000;
    if (maxValue > 3000) yAxisMax = 6000;
    this.dtcTriggerEvent = {
      series: [
        {
          name: "Active",
          data: activeCounts
        },
        {
          name: "Resolved",
          data: resolvedCounts
        }
      ],
      chart: {
        height: 270,
        type: "bar",
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 8,
          borderRadiusApplication: 'end',
          endingShape: 'rounded',
          columnWidth: "40%",
          barGap: 0.8,
          barGroupWidth: "70%",
          dataLabels: { position: "top" }
        }
      },
      colors: ["#e67777", "#95D3BF"],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.3,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        markers: {
          width: 10,
          height: 10,
          radius: 50
        }
      },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: {
        categories: this.dtcBtEventRate.categories,
        lines: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
        title: {
          offsetX: -5,
          offsetY: 0,
          text: "Month",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        },
        labels: {
          show: true,
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 },
          formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
        },
      },
      yaxis: {
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          show: true,
          style: { colors: "#727272", fontSize: "10px", fontWeight: 400, fontFamily: "Poppins" }
        },
        title: {
          offsetX: 0,
          offsetY: -13,
          text: "DTCs Triggered",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        }
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue = value
          const labels = ["Active","Resolved"];
          const colors = ["#e67777", "#95D3BF"];
          return `
            <div style="background-color:${colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${labels[seriesIndex]}: ${formattedValue}
            </div>
          `;
        }
      }
    };
  }
  dataUpdate: boolean = false;
  dtcTriggeredbyVehicle() {
    this.subscription$.add(
      this.dashboardservice.dtccountbyVehicleData(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss)
        .subscribe((res: any) => {
          if (!res || res.length === 0) {
            console.warn("Empty or invalid response");
            this.typeDtcVehicle = []; // Ensure it’s an empty array
            this.dataUpdate = true;  // Set flag to show "No data found"
            return;
          }
          this.typeDtcVehicle = res;
          this.dataUpdate = false; // Reset flag when data exists
          this.dtcTriggerByVehicle(); // Call after setting data
        })
    );
  }

  dtcTriggerByVehicle() {
    if (!this.typeDtcVehicle || this.typeDtcVehicle.length === 0) {
      console.warn("No data available for DTC Triggered Chart");

      return;
    }

    // Sort by totalDtcTriggered in descending order and get the top 10
    const top10Data = [...this.typeDtcVehicle]
      .sort((a, b) => b.totalDtcTriggered - a.totalDtcTriggered)
      .slice(0, 10);

    // Transform response to format x-axis categories dynamically
    const categories = top10Data.map(item =>
      item.alias.length === 17 ? `***${item.alias.slice(-4)}` : item.alias
    );

    const seriesData = top10Data.map(item => item.totalDtcTriggered);

    this.dtcTriggerByVehicles = {
      series: [{ name: "DTCs Triggered", data: seriesData }],
      chart: { height: 270, type: "bar", zoom: { enabled: false }, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          borderRadiusApplication: 'end',
          barHeight: "35%",
          distributed: true,
          dataLabels: { position: 'top' },
          colors: { backgroundBarRadius: 9, backgroundBarOpacity: 1 },
        },
      },
      colors: ["#e67777"],
      fill: {
        type: 'gradient',
        gradient: { shade: 'light', type: "vertical", shadeIntensity: 0.3, inverseColors: false, opacityFrom: 1, opacityTo: 1, stops: [0, 100] },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { strokeArray: 7, show: false },
      yaxis: {
        labels: { show: true, style: { colors: "#727272", fontSize: "10px", fontWeight: 600, fontFamily: "Poppins" } },
        title: {
          offsetX: 0, offsetY: -13, text: "Vehicle Name",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 },
        },
        axisBorder: { show: false }, axisTicks: { show: false },
      },
      xaxis: {
        categories: categories,
        axisBorder: { show: false }, axisTicks: { show: false },
        title: {
          offsetX: -5, offsetY: 0, text: "DTCs Triggered",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 },
        },
        labels: { show: true, style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 } },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue = value > 1000 ? (value / 1000).toFixed(0) : value;
          return `
            <div style="position: relative; background-color:#e67777; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              DTCs Triggered: ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }

  dtcTriggeredbyType() {
    this.subscription$.add(
      this.dashboardservice.dtcTypeData(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
        if (!res || res.length === 0) {
          console.warn("Empty or invalid response");
          this.typeDtcData = []; // Ensure it’s an empty array
          this.dataUpdate = true;  // Set flag to show "No data found"
          return;
        }
        this.typeDtcData = res;
        this.dataUpdate = false; // Reset flag when data exists
        this.dtcTriggerByType(); // Call after setting data
      })
    );
  }

  dtcTriggerByType() {
    if (!this.typeDtcData || this.typeDtcData.length === 0) {
      console.warn("No DTC data available for chart");
      return;
    }
    this.dtcTriggerByTypes = {
      series: [
        {
          name: "DTCs Triggered",
          data: this.typeDtcData.map((item: any) => item.count)
        }
      ],
      chart: {
        height: 200,
        type: "bar",
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          borderRadiusApplication: 'end',
          barHeight: "35%",
          distributed: true,
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: { position: 'top' },
          colors: { backgroundBarRadius: 9, backgroundBarOpacity: 1 }
        }
      },
      colors: ["#8BB0FF"],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.3,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      dataLabels: {
        enabled: false,
        style: { colors: ['#6C757E'], fontSize: '12', fontWeight: '100' },
        offsetY: -30,
        formatter: (val: any) => val
      },
      legend: { show: false },
      grid: { strokeArray: 7, show: false },
      yaxis: {
        labels: {
          show: true,
          style: { colors: "#727272", fontSize: "10px", fontWeight: 400, fontFamily: "Poppins" }
        },
        title: {
          offsetX: 0,
          offsetY: -13,
          text: "DTC Type",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        },
        lines: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      xaxis: {
        categories: this.typeDtcData.map((item: any) => item.dtcType),
        tickAmount:5,
        lines: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
        title: {
          offsetX: -5,
          offsetY: 0,
          text: "DTCs Triggered",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        },
        labels: {
          show: true,
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 },
          formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
        }
      },
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex }) => {
          const value = series[seriesIndex][dataPointIndex];
          return `
            <div style="position: relative; background-color:#8BB0FF; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                 DTCs Triggered: ${value}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        }
      }
    };
  }

  dtcEvent() {
    this.subscription$.add(
      this.dashboardservice.dtcEventRate(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
        if (res) {
          // Sort yearMonth in ascending order (oldest first)
          const sortedData = res.countMilesDrivenCountMonthWiseList.sort((a: any, b: any) => a.yearMonth.localeCompare(b.yearMonth));

          // Format yearMonth as "MMM'YY" (e.g., "Feb'25")
          const formattedMonths = sortedData.map(item => {
            const [year, month] = item.yearMonth.split("-");
            return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" }) + "'" + year.slice(2);
          });

          // Extract Miles Driven data
          const milesDrivenData = sortedData.map((item: any) => item.totalMilesDriven);

          // Ensure totalDtcData is also sorted according to the same yearMonth order
          const totalDtcData = sortedData.map((item: any) => {
            const matchingDtc = res.totalDTCCountMonthWises.find((dtc: any) => dtc.yearMonth === item.yearMonth);
            return matchingDtc ? matchingDtc.totalDtcCount : 0; // Handle missing values
          });

          // Call eventRate function with formatted data
          this.eventRate(formattedMonths, milesDrivenData, totalDtcData);
        }
      })
    );
  }

  eventRate(months: string[], milesDrivenData: number[], totalDtcData: number[]) {
    this.dtceventRate = {
      series: [
        {
          name: "Miles Driven",
          type: "column",
          data: milesDrivenData
        },
        {
          name: "DTCs Triggered",
          type: "column",
          data: totalDtcData,
          yAxisIndex: 1 // Assign this series to the second (opposite) y-axis
        }
      ],
      chart: {
        height: 300,
        type: "line",
        stacked: false,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      grid: { strokeArray: 7, show: false },
      dataLabels: { enabled: false },
      stroke: { width: [0, 0] },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 6,
          borderRadiusApplication: 'end',
          endingShape: 'rounded',
          columnWidth: "40%",
          barGap: 0.8,
          barGroupWidth: "70%"
        }
      },
      colors: ["#75A5E3", "#EB5252"],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.3,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      xaxis: {
        categories: months,
        axisBorder: { show: false },
        axisTicks: { show: false },
        title: {
          text: "Month",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        },
        labels: { style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 } }
      },
      yaxis: [
        {
          seriesName: "Miles Driven",
          tickAmount: 5,
          labels: {
            show: true,
            style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 },
            formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
          },
          title: {
            text: "Miles Driven",
            style: { color: "#75A5E3", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        {
          seriesName: "DTCs Triggered",
          opposite: true, // Places this y-axis on the opposite side
          tickAmount: 5,
          labels: {
            show: true,
            style: { color: "#EB5252", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 },
            formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
          },
          title: {
            text: "DTCs Triggered",
            style: { color: "#EB5252", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        }
      ],
      legend: {
        show: true,
        markers: {
          width: 10,
          height: 10,
          radius: 50
        }
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue = value > 1000 ? (value / 1000).toFixed(0) + "K" : value;
          const labels = ["Miles Driven", "DTCs Triggered"];
          const colors = ["#75A5E3", "#EB5252"];
          return `
            <div style="background-color:${colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${labels[seriesIndex]}: ${value.toFixed(2)}
            </div>
          `;
        }
      }
    };
  }
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
      if (  this.user ==='role_org_group') {
        const fleetId = sessionStorage.getItem('fleetUserId');
        this.fleetIdValueNew = fleetId;
        this.fleetIdData = fleetId;
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

  async getTotalActivatedVehicle() {
    try {
      const res: any = await this.dashboardservice.getTotalVehicles(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).toPromise();
      const totalActivatedVehicleCount = res.lastNMonthActiveVehicleCount || [];
      if (totalActivatedVehicleCount.length > 0) {
        const lastTripCount = totalActivatedVehicleCount[totalActivatedVehicleCount.length - 1].tripCount;
       this.lastTripCount = lastTripCount;
       } else {
        this.lastTripCount = 0; // Handle the case where the array is empty
      }
    } catch (err) {
    }
  }

  selectConsumers() {
    // Retrieve and parse the custom consumers from session storage
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.customConsumer).subscribe((res: any) => {
        this.fleetList = res;

        // Check if the customConsumer is "onwardfleet"
        if (this.customConsumer === 'Onwardfleet') {
          // Define disallowed fleet IDs
          const disallowedFleetIds = [100549, 100527, 100528, 100606];
          this.fleetList = this.fleetList.filter((fleet: any) =>
            !disallowedFleetIds.includes(fleet.id)
          );
        }

        if (this.customConsumer === 'EcoTrack') {
          // Define disallowed fleet IDs
          const disallowedFleetIds = [101061, 100867, 100865, 100878,100875 ];
          this.fleetList = this.fleetList.filter((fleet: any) =>
            !disallowedFleetIds.includes(fleet.id)
          );
        }
        // Sort the fleetList by id
        this.fleetList.sort((a, b) => a.id - b.id);

        // Update fleetIds if there are any fleets in the list
        if (this.fleetList && this.fleetList.length > 0) {
          this.fleetIds = this.fleetList.map((fleet: any) => fleet.id).join(', ');
        }

        // Reset fleetIdData
        this.fleetIdData = null;
      }, err => {
        // Handle error
        console.error('Error fetching fleet list:', err);
      })
    );
  }


  async getDriverScores() {
    this.spinner.show()
    this.tirePressure = []
    this.subscription$.add(
      await this.dashboardservice.tirePressure(this.customConsumer).subscribe((res: any) => {
        this.tirePressure.push(res.veryLowTPVinCount)
        this.tirePressure.push(res.lowTPVinCount + res.goodTPVinCount)
        // this.tirePressure.push(res.goodTPVinCount)
        this.tirePressure.push(res.highTPVinCount)
        this.lowPressureChart()
        setTimeout(() => {
          this.spinner.hide()
        }, 1000);
      }, err => {
        this.spinner.hide()
      })
      )
  }

  async getDriverScoresFleet() {
    this.spinner.show()
    this.tirePressure = []
    this.subscription$.add(
      await this.dashboardservice.tirePressureFleetNew(this.customConsumer,this.fleetIdData, this.groupIdData).subscribe((res: any) => {
        this.tirePressure.push(res.veryLowTPVinCount)
        this.tirePressure.push(res.lowTPVinCount)
        this.tirePressure.push(res.goodTPVinCount)
        this.tirePressure.push(res.highTPVinCount)
        this.lowPressureChart()
        setTimeout(() => {
          this.spinner.hide()
        }, 1000);
      }, err => {
        this.spinner.hide()
      })
      )
  }

  lowPressureChart(){
    const totalCount = this.tirePressure.reduce((acc, curr) => acc + curr, 0);
    this.tirePressureChart = {
      chart: {
        height: 260,
        type: 'donut',
      },
      series:  this.tirePressure,
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        floating: false,
        fontSize: '6px',
        offsetX: 4,
      },
      dataLabels: {
        enabled: true,
        dropShadow: {
          enabled: false,
        }
      },
      xaxis: {
        labels: {
          rotate: -45
        },
        categories: [],
        tickPlacement: "on"
      },
      labels: ['Low', 'Inline', 'High'],
      colors: ['#FF0000','#2CA77E', '#457FFC'],
      annotations: {
        // Add the total count as a custom annotation
        points: [{
          x: '50%', // Place at the center horizontally
          y: '50%', // Place at the center vertically
          marker: {
            size: 0
          },
          label: {
            text: totalCount.toString(),
            style: {
              fontSize: '24px',
              color: '#444',
              background: 'transparent'
            }
          }
        }]
      }
    }
  }

  getFormattedLabels(label: string): string {
    switch (label) {
      case 'Low':
        return 'Low (Below 28 PSI)';
      case 'Inline':
        return 'Inline (>28 PSI & <40 PSI)';
      case 'High':
        return 'High (>40 PSI)';
      default:
        return label;
    }
  }

  async lowPressurePercentage() {
    this.subscription$.add(
      await this.dashboardservice.getLowPressurePercentage(this.customConsumer).subscribe((res: any) => {
        let lowPressre = res
        this.avgDistanceTravlledLowPressure(lowPressre)
      }, err => {
      })
    )
  }

  async lowPressurePercentageFleet() {
    this.subscription$.add(
      await this.dashboardservice.getLowPressurefleetsNew(this.customConsumer,this.fleetIdData, this.groupIdData).subscribe((res: any) => {
        let lowPressre = res
        this.avgDistanceTravlledLowPressure(lowPressre)
      }, err => {
      })
    )
  }

  avgDistanceTravlledLowPressure(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelFuelCost = [];
    let lowPressureScore = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelFuelCost.push(formattedDate);
      if (item.lpDrivenPercentage !== null && item.lpDrivenPercentage !== undefined) {
        lowPressureScore.push(item.lpDrivenPercentage.toFixed(2));
      } else {
        lowPressureScore.push(null); // or any other placeholder value you want to use
      }
    });
    this.avgDistanceLowPressureChart = {
      series: [
        {
          name: "Average Distance travelled on Low Pressure(%)",
          data: lowPressureScore
        }
      ],
      chart: {
        height: 320,
        type: "line",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1
        }
      },
      stroke: {
        width: 1,
        curve: "straight",
        dashArray: [0, 0, 0]
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      legend: {
        show: false
      },
      xaxis: {
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "Month",
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
      },
      yaxis: {
        title: {
          offsetX: -10,
          offsetY: 0,
          text: "Distance on Low Pressure (%)",
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
      }
    }
  }

  async battery() {
    this.spinner.show()
    this.batteriesStatus = []
    this.subscription$.add(
      await this.dashboardservice.getLowbattery(this.customConsumer).subscribe((res: any) => {
        this.batteriesStatus.push(res.veryLowBatteryStatus)
        this.batteriesStatus.push(res.lowBatteryStatus)
        this.batteriesStatus.push(res.normalBatteryStatus)
        this.batteriesStatus.push(res.highBatteryStatus)
        this.batteryStatus()
        setTimeout(() => {
          this.spinner.hide()
        }, 1000);
      }, err => {
        this.spinner.hide()
      })
      )
  }

  async batteryFleet() {
    this.batteriesStatus = []
    this.subscription$.add(
      await this.dashboardservice.getLowBatteryFleet(this.customConsumer,this.fleetIdData, this.groupIdData).subscribe((res: any) => {
        this.batteriesStatus.push(res.veryLowBatteryStatus)
        this.batteriesStatus.push(res.lowBatteryStatus)
        this.batteriesStatus.push(res.normalBatteryStatus)
        this.batteriesStatus.push(res.highBatteryStatus)
        this.batteryStatus()
      }, err => {
      })
    )
  }

  batteryStatus(){
    this.batteryChart = {
      chart: {
        height: 260,
        type: 'donut',
      },
      series: this.batteriesStatus,
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        floating: false,
        fontSize: '6px',
        offsetX: 4,
      },
      dataLabels: {
        enabled: true,
        dropShadow: {
          enabled: false,
        }
      },
      xaxis: {
        labels: {
          rotate: -45
        },
        categories: [],
        tickPlacement: "on"
      },
      labels: ['Very Low', 'Low', 'Normal', 'High'],
      colors: ['#FF0000', '#F3721A', '#2CA77E', '#457FFC'],
    };
  }
  getFormattedLabel(label: string): string {
    switch (label) {
      case 'Very Low':
        return 'Very Low (Below 12.8V)';
      case 'Low':
        return 'Low (> 12.8V and < 13.2V)';
      case 'Normal':
        return 'Normal (> 13.2V and < 15V)';
      case 'High':
        return 'High (> 15V)';
      default:
        return label;
    }
  }

  async vehicleMaintenances() {
    this.spinner.show()
    await this.dashboardservice.vehicleMaintenance(this.customConsumer,this.fleetIdData, this.groupIdData, '').subscribe((res: any) => {
      this.vehicleMaintenanceData = res;
      this.loading = true
      setTimeout(() => {
        this.spinner.hide()
      }, 1000);
    }, err => {
      this.spinner.hide()
    })
  }
  downloadReport() {
    const defaultVin = '';
    this.dataDownloadOnVinChangeForRechargingCost(defaultVin, 'csv');
  }
  isValidNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && value !== null && value !== 'NaN';
  }

  dataDownloadOnVinChangeForRechargingCost(vin: string, format: 'csv' | 'excel') {
    this.subscription$.add(
      this.dashboardservice.DownloadmaintenanceVin(this.customConsumer, '', this.fleetIdData).subscribe(
        (res: any) => {
          if (res && Array.isArray(res) && res.length > 0) {
            this.rechargingCostVinDataforDowload = [].concat(...res.map(item => item));
            if (format === 'csv') {
              this.downloadRechargingCSV(this.rechargingCostVinDataforDowload);
            } else if (format === 'excel') {
              this.downloadRechargingExcel(this.rechargingCostVinDataforDowload);
            }
            this.vinListData = null;
          }
        },
        err => {
          console.error('Error fetching recharge data:', err);
        }
      )
    );
  }

  downloadRechargingCSV(data: any) {
    const csvData = this.convertToCSVforRechargingCostDownloadVinRecharging(data);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Maintenance-Report.csv');
    a.click();
  }

  convertToCSVforRechargingCostDownloadVinRecharging(objArray: any[]): string {
    if (!objArray || objArray.length === 0) {
      return '';
    }

    // Define the capitalized headers
    const csvHeader = 'Vehicle Name,Make,Model, Trim,FL Tire Pressure(PSI),FR Tire Pressure(PSI),RL Tire Pressure(PSI), RR Tire Pressure(PSI),Battery Level(Votls), End Odometer Reading (Miles), Monthly Engine Duration (HH:MM:SS), Alerts\r\n';
    let csvString = csvHeader;

    function convertSecondsToHoursAndMinutes(seconds: number): string {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      if (remainingSeconds === 0) {
          return `${padNumber(hours)}:${padNumber(minutes)}`;
      } else {
          return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(remainingSeconds)}`;
      }
  }

  function padNumber(num: number): string {
    return num < 10 ? '0' + num : num.toString();
}

    objArray.forEach(item => {
      const flTirePress = item.tyrePressureStatus?.fl_tirepress ? Math.round(parseFloat(item.tyrePressureStatus.fl_tirepress)) : 0;
      const frTirePress = item.tyrePressureStatus?.fr_tirepress ? Math.round(parseFloat(item.tyrePressureStatus.fr_tirepress)) : 0;
      const rlTirePress = item.tyrePressureStatus?.rl_tirepress ? Math.round(parseFloat(item.tyrePressureStatus.rl_tirepress)) : 0;
      const rrTirePress = item.tyrePressureStatus?.rr_tirepress ? Math.round(parseFloat(item.tyrePressureStatus.rr_tirepress)) : 0;
       const batteryLevel = item.batteryLevel === -1 ? 'NA' :  item.batteryLevel;
       const endOdometer = item.endOdometer === -1 ? 'NA' : item.endOdometer.toFixed(2);
      const engineDuration = item.engineDuration ? convertSecondsToHoursAndMinutes(item.engineDuration) : '';
      const alerts = item.alerts ?? '';
      csvString += `${(item.alias?.length === 17 && /^[A-Za-z0-9]+$/.test(item.alias))
        ? this.maskVins(item.alias)
        : item.alias},${item.make},${item.model},${item.trim},${flTirePress},${frTirePress},${rlTirePress},${rrTirePress},${batteryLevel},${endOdometer},${engineDuration},${alerts}\r\n`;
    });

    return csvString;
  }

  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    },10);
    // this.updateDasboard()
  }


  maskVins(vin: string): string {
    if (vin && vin.length >= 3) { // Add a null check for vin
      return '**************' + vin.slice(-3);
    } else {
      return vin;
    }
  }
  downloadRechargingExcel(data: any) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VIN Data');
    XLSX.writeFile(wb, 'vin_data.xlsx');
  }

  convertSecondsToHours(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  maskVinNumber(_vinNumber: any) {
    var mask = "";
    if (_vinNumber) {
      for (let i = 1; i <= _vinNumber.length - 4; i++) {
        mask += "*";
      }
      return mask + _vinNumber.slice(14, 22);
    }
    else {
      return null;
    }
  }

  viewMore(): void {
    if (this.customConsumer) {
      this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { consumer: this.customConsumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/fleetManageVehicles']);
    }
  }

  dtcTriggeredCount1() {
    this.subscription$.add(
      this.dashboardservice.dtceventCount(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
        if (!res || !res.dtcStatusCount || res.dtcStatusCount.length === 0) {
          console.warn("Empty or invalid response");
          return;
        }

        // Sort by weekEnd date in ascending order
        const sortedData = res.dtcStatusCount.sort((a: any, b: any) => new Date(a.weekEnd).getTime() - new Date(b.weekEnd).getTime());

        // Extract weekEnd date and format as YYYY-MM-DD
        const formattedWeeks = sortedData.map(item => new Date(item.weekEnd).toISOString().split("T")[0]);

        // Extract Active and Resolved counts
        const activeCounts = sortedData.map(item => item.activeCount);
        const resolvedCounts = sortedData.map(item => item.resolvedCount);

        // Store formatted data
        this.dtcBtEventRate = {
          categories: formattedWeeks,
          activeCounts,
          resolvedCounts
        };

        // Call dtcTrigger1() with updated data
        this.dtcTrigger1();
      })
    );
  }
  dtcTrigger1() {
    if (!this.dtcBtEventRate || !this.dtcBtEventRate.activeCounts || !this.dtcBtEventRate.resolvedCounts) {
      console.warn("dtcBtEventRate data is not available yet.");
      return;
    }

    const activeCounts = this.dtcBtEventRate.activeCounts;
    const resolvedCounts = this.dtcBtEventRate.resolvedCounts;

    const maxValue = Math.max(...activeCounts, ...resolvedCounts); // Get highest value

    let yAxisMax = 60; // Default max value
    if (maxValue > 60) yAxisMax = 300;
    if (maxValue > 300) yAxisMax = 1200;
    if (maxValue > 1200) yAxisMax = 3000;
    if (maxValue > 3000) yAxisMax = 6000;
    this.dtcTriggerEvent = {
      series: [
        {
          name: "Active",
          data: activeCounts
        },
        {
          name: "Resolved",
          data: resolvedCounts
        }
      ],
      chart: {
        height: 300,
        type: "bar",
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 8,
          borderRadiusApplication: 'end',
          endingShape: 'rounded',
          columnWidth: "40%",
          barGap: 0.8,
          barGroupWidth: "70%",
          dataLabels: { position: "top" }
        }
      },
      colors: ["#e67777", "#95D3BF"],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.3,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        markers: {
          width: 10,
          height: 10,
          radius: 50
        }
      },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      xaxis: {
        categories: this.dtcBtEventRate.categories,
        lines: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
        title: {
          offsetX: -5,
          offsetY: 0,
          text: "Week",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        },
        labels: {
          show: true,
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 },
          formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
        }
      },
      yaxis: {
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          show: true,
          style: { colors: "#727272", fontSize: "10px", fontWeight: 400, fontFamily: "Poppins" }
        },
        title: {
          offsetX: 0,
          offsetY: -13,
          text: "DTCs Triggered",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        }
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue = value
          const labels = ["Active","Resolved"];
          const colors = ["#e67777", "#95D3BF"];
          return `
            <div style="background-color:${colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${labels[seriesIndex]}: ${formattedValue}
            </div>
          `;
        }
      }
    };
  }
  dtcEvent1() {
    this.subscription$.add(
      this.dashboardservice.dtcEventRate(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
        if (res) {
          // Sort yearMonth in ascending order (oldest first)
          const sortedData = res.countMilesDrivenCountMonthWiseList.sort((a: any, b: any) => new Date(a.weekEnd).getTime() - new Date(b.weekEnd).getTime());

          // Extract weekEnd date and format as YYYY-MM-DD
          const formattedWeeks = sortedData.map(item => new Date(item.weekEnd).toISOString().split("T")[0]);
          // Extract data
          const milesDrivenData = sortedData.map((item: any) => item.totalMilesDriven);
          const totalDtcData = res.totalDTCCountMonthWises.map((item: any) => item.totalDtcCount);

          // Call eventRate function with formatted data
          this.eventRate1(formattedWeeks, milesDrivenData, totalDtcData);
        }
      })
    );
  }
  eventRate1(months: string[], milesDrivenData: number[], totalDtcData: number[]) {
    this.dtceventRate = {
      series: [
        {
          name: "Miles Driven",
          type: "column",
          data: milesDrivenData
        },
        {
          name: "Total DTCs Triggered",
          type: "column",
          data: totalDtcData,
          yAxisIndex: 1 // Assign this series to the second (opposite) y-axis
        }
      ],
      chart: {
        height: 300,
        type: "line",
        stacked: false,
        zoom: { enabled: false },
        toolbar: { show: false }
      },
      grid: { strokeArray: 7, show: false },
      dataLabels: { enabled: false },
      stroke: { width: [0, 0] },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 6,
          borderRadiusApplication: 'end',
          endingShape: 'rounded',
          columnWidth: "40%",
          barGap: 0.8,
          barGroupWidth: "70%"
        }
      },
      colors: ["#75A5E3", "#EB5252"],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.3,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      xaxis: {
        categories: months,
        axisBorder: { show: false },
        axisTicks: { show: false },
        title: {
          text: "Week",
          style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
        },
        labels: { style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 } }
      },
      yaxis: [
        {
          seriesName: "Miles Driven",
          tickAmount: 5,
          labels: {
            show: true,
            style: { color: "#AEAEAE", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 },
            formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
          },
          title: {
            text: "Miles Driven",
            style: { color: "#75A5E3", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        {
          seriesName: "Total DTCs Triggered",
          opposite: true, // Places this y-axis on the opposite side
          tickAmount: 5,
          labels: {
            show: true,
            style: { color: "#EB5252", fontSize: "11px", fontFamily: "Poppins", fontWeight: 400 },
            formatter: (value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()
          },
          title: {
            text: "Total DTCs Triggered",
            style: { color: "#EB5252", fontSize: "11px", fontFamily: "Poppins", fontWeight: 600 }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        }
      ],
      legend: {
        show: true,
        markers: {
          width: 10,
          height: 10,
          radius: 50
        }
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue = value > 1000 ? (value / 1000).toFixed(0) + "K" : value;
          const labels = ["Miles Driven", "Total DTCs Triggered"];
          const colors = ["#75A5E3", "#EB5252"];
          return `
            <div style="background-color:${colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${labels[seriesIndex]}: ${value.toFixed(2)}
            </div>
          `;
        }
      }
    };
  }
  StartDate: any;
  EndDate: any;
  fleetSumamryTotalData: any
  fleetSumamryTotalDataFleetLevel: any;
  driverSafetyReportAPI() {
      this.subscription$.add(
        this.dashboardservice
          .downloadDriverSafetyReportAlls(
            this.consumer,
            this.fleetIdData,
            this.groupIdData
          )
          .subscribe(
            (res: any) => {
              this.fleetSumamryTotalData = res.vinLevelStats;
              this.fleetSumamryTotalDataFleetLevel = res.fleetLevelStats;
              this.StartDate = res.startDate;
              this.EndDate = res.endDate;
              this.fleetSummaryReportDownload();
            },
            (err) => {
              const errorMessage = err?.apierror?.message || "Data not found";
              if (errorMessage === "Data not found") {
                // this.noDataFounds(this.nodatafound);
              }
            }
          )
      );

  }
    async fleetSummaryReportDownload() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Battery Health", {
          views: [{ showGridLines: false }],
        });
        worksheet.getColumn(1).width = 170 / 7.5;
        worksheet.getColumn(2).width = 190 / 7.5;
        worksheet.getColumn(4).width = 160 / 7.5;
        for (let col = 1; col <= 31; col++) {
          const cell = worksheet.getCell(1, col);
          cell.font = {
            name: "Tahoma",
            size: 11,
            color: { argb: "FFFFFFFF" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF25477B" },
          };
        }
        for (let col = 31; col <= 16384; col++) {
          worksheet.getColumn(col).hidden = true;
        }
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "Battery Health Report";
        titleCell.alignment.horizontal = "left";
        titleCell.font = {
          name: "Tahoma",
          size: 11,
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
        worksheet.getRow(1).height = 20;
        const azugaCell = worksheet.getCell("A2");
        if (this.consumer) {
          azugaCell.value = this.consumer;
        }
        if (this.customConsumer) {
          azugaCell.value = this.customConsumer;
        }
        azugaCell.font = {
          name: "Tahoma",
          size: 11,
          color: { argb: "FFFA751A" },
          bold: true,
        };
        azugaCell.alignment = { vertical: "middle" };
        const FleetIdCell = worksheet.getCell("A3");
        if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
          FleetIdCell.value = `FleetId: ${this.fleetIdData}`;
        } else if (this.fleetIds && this.fleetIds.length > 0) {
          FleetIdCell.value = `FleetId: ${this.fleetIds}`;
        } else {
          FleetIdCell.value = "FleetId: All";
        }
        FleetIdCell.font = {
          name: "Tahoma",
          size: 11,
          color: { argb: "FF25477B" },
          bold: true,
        };
        FleetIdCell.alignment = { vertical: "middle" };

        worksheet.getColumn(3).width = 80 / 7.5;
        for (let col = 5; col <= 11; col++) {
          worksheet.getColumn(col).width = 120 / 7.5;
        }
        // A5 - Time Period

        // A6 - Apr'24 - Aug'24
        const A6 = worksheet.getCell("A6");
        const currentDate = new Date();
        let formattedDate = "";
        A6.font = {
          name: "Tahoma",
          size: 11,
          bold: true,
          color: { argb: "FFFA751A" },
        };
        A6.alignment = { vertical: "middle", horizontal: "center" };
        A6.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };


        worksheet.mergeCells("E4:G4");
        // Data for A15 to I20
        const headers1 = [
          "Fleet Id",
          "Vehicle Name",
          "Battery (v)",
        ];
        headers1.forEach((header, index) => {
          const cell = worksheet.getCell(6, index + 1); // Row 15, Columns A to I
          cell.value = header;
          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
          };
        });
        if (
          Array.isArray(this.fleetSumamryTotalData) &&
          this.fleetSumamryTotalData.length > 0
        ) {
          this.fleetSumamryTotalData.forEach((item) => {
            const vinValue = (item.alias?.length === 17 && /^[A-Za-z0-9]+$/.test(item.alias))
        ? this.maskVinNumber(item.alias)  // Mask cxVin if alias is a 17-character VIN
        : item.alias;  // Otherwise, show cxVin directly
            const row = worksheet.addRow([
              item.fleetId,
            vinValue,
              item.batteryStatus,
            ]);
            // Set borders for each cell in the newly added row
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.border = {
                top: { style: "thin", color: { argb: "FF000000" } },
                left: { style: "thin", color: { argb: "FF000000" } },
                bottom: { style: "thin", color: { argb: "FF000000" } },
                right: { style: "thin", color: { argb: "FF000000" } },
              };
            });
          });
        } else {
        }
        const headerStyleLeft = {
          font: {
            name: "Tahoma",
            size: 11,
            bold: true,
            color: { argb: "FFFFFFFF" },
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF25477B" },
          },
          alignment: { vertical: "middle", horizontal: "left", wrapText: true },
          border: {
            top: { style: "thin", color: { argb: "FFD3D3D3" } },
            left: { style: "thin", color: { argb: "FFD3D3D3" } },
            bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
            right: { style: "thin", color: { argb: "FFD3D3D3" } },
          },
        };
        // Apply styles for headers
        const headers = [
          "A6",
          "B6",
          "C6",

        ];
        headers.forEach((cell) => {
          const headerCell = worksheet.getCell(cell);
          Object.assign(headerCell, headerStyleLeft);
        });
        headers.forEach((header) => {
          const columnLetter = header.match(/[A-Z]+/)[0]; // Extract the column letter
          const column = worksheet.getColumn(columnLetter);
          if (worksheet.getRow(7).getCell(columnLetter).address.includes("7")) {
            column.width = 25; // Set the width of each column to 20
          }
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        if (this.user === "admin") {
          FileSaver.saveAs(
            blob,
            `Battery_Health_Report_${this.consumer}_${formattedDate}.xlsx`
          );
        } else if (this.user != "admin") {
          FileSaver.saveAs(
            blob,
            `Battery_Health_Report_${this.customConsumer}_${formattedDate}.xlsx`
          );
        }
      }

    secondsToHHMM(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    }

    // this code is service warning expand row
    expandedRowIndex: number = -1;
  toggleExpand(index: number) {
    if (this.expandedRowIndex === index) {
      this.expandedRowIndex = -1;
    } else {
      this.expandedRowIndex = index;
    }
  }
  selectedVin: string;
  tripSummaryData:any=[];
  allTripSummaryData:any=[]; // Store all data for filtering

  filterByVin() {
    if (!this.selectedVin) {
      // Reset to show all data
      this.tripSummaryData = [...this.allTripSummaryData];
    } else {
      // Filter the data by selected VIN
      this.tripSummaryData = this.allTripSummaryData.filter(trip => trip.vin === this.selectedVin);
    }
  }

  fetchOilChangeAlerts() {
    this.spinner.show();

    // Reset VIN filter when fetching new data
    this.selectedVin = '';

    // Only pass fleetId if available, don't use customConsumer
    const fleetId = this.fleetIdData || undefined;

    console.log('Calling getOilChangeAlerts with fleetId:', fleetId);

    this.routeOptimzeService.getOilChangeAlerts(fleetId).subscribe({
      next: (res) => {
        console.log('Oil change alerts response:', res);
        this.allTripSummaryData = res?.data || [];
        this.tripSummaryData = [...this.allTripSummaryData]; // Make a copy for display

        // Extract unique VINs for the dropdown
        this.vinList = this.allTripSummaryData.map(trip => ({
          vin: trip.vin,
          alias: trip.alias || trip.vin
        }));

        const observables = [];

        for (let trip of this.allTripSummaryData) {
          // Convert current timestamp to local time if lat/lng/timestamp exist
          if (trip.current_latitude && trip.current_longitude && trip.current_timestamp) {
            const localTime$ = this.timezoneService
              .getLocalTimeFromUTC(trip.current_latitude, trip.current_longitude, trip.current_timestamp)
              .pipe(tap((localTime) => (trip.current_timestamp = localTime)));
            observables.push(localTime$);
          }

          // Get address from last oil change lat/lng
          if (trip.lastoilchange_latitude && trip.lastoilchange_longitude) {
            const address$ = this.timezoneService
              .getAddressFromLatLng(trip.lastoilchange_latitude, trip.lastoilchange_longitude)
              .pipe(tap((address) => (trip.oilChangeWhere = address)));
            observables.push(address$);
          } else {
            trip.oilChangeWhere = 'N/A';
          }
        }

        // Wait for all observables to complete
        if (observables.length > 0) {
          forkJoin(observables).subscribe({
            complete: () => {
              this.spinner.hide();
            },
            error: () => {
              this.spinner.hide();
            },
          });
        } else {
          this.spinner.hide(); // If no async needed
        }
      },
      error: (err) => {
        console.error('Failed to fetch oil change alerts:', err);
        this.toastr.error('Failed to fetch oil change alerts', 'Error');
        this.spinner.hide();
      }
    });
  }

}
