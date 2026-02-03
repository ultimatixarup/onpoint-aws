import { Component, OnInit, ViewChild,Injectable} from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, firstValueFrom,of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import moment from 'moment';
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import {
  NgbDateParserFormatter,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}
@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {

  parse(value: string): NgbDateStruct | null {
    if (value) {
      const dateParts = value.trim().split('/');
      if (dateParts.length === 3) {
        return {
          month: Number(dateParts[0]),
          day: Number(dateParts[1]),
          year: Number(dateParts[2])
        };
      }
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    return date ?
    `${this.padNumber(date.month)}/${this.padNumber(date.day)}/${date.year}` : '';
  }

  private padNumber(value: number | null): string {
    if (!isNaN(value) && value !== null) {
      return `0${value}`.slice(-2);
    }
    return '';
  }
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
import { saveAs } from 'file-saver';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
  selector: 'app-evsustainabilityfleet',
  templateUrl: './evsustainabilityfleet.component.html',
  styleUrls: ['./evsustainabilityfleet.component.scss'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class EvsustainabilityfleetComponent implements OnInit {
  @ViewChild('nodatafound') nodatafound: any
  subscription$: Subscription = new Subscription();
  chartOptionsWrostMileage: any;
  vinListData: any;
  rechargingCostVinDataforDowload: any [];
  rechargeEvent: any;
  idlingChart: any
  selectedButton: string = '';
  model2: string;
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;
  currentDate: string = new Date().toISOString().split('T')[0];
  emissionsData: any;
  chargingCost: any;
  vehicleBodyClass: any;
  totalCount: any;
  energyUsed: any;
  breakDown: any;
  bev: any;
  hev: any;
  phev: any;
  numberofSession: any;
  emissionChart: any
  selectedMenuItem: string | null = null;
  totalIdlingTime: any;
  fleetIdData: any;
  activeButton: string = '';
  bevPercentage: string;
  vinDownlaod: boolean = true;
  dateDownload: boolean  = false;
  dateVinDownlaod: boolean  = false;
  hevPercentage: string;
  phevPercentage: string;
  overview: boolean = true;
  summary: boolean = false;
  loginUser: any;
  evDistanceData: any;
  user: any;
  multiRoles: any;
  customConsumer: any;
  fleetList: any;
  showRow: boolean = true;
  iceShow: boolean = true;
  newShow: boolean = true;
  chartOptionsFleetMileage: any
  chartOptionsFuelConsumed: any;
  totalIdlingDuration: string;
  fuelCostinDollar: any;
  monthData:any;
  averageFuelCost:any
  riskyCoach: any;
  riskyCoachAll: any;
  risckyCoachNodata: any;
  wrostDriver: any;
  wrostDriverNull: any;
  vinListDataForDownlaod: any;
  expensiveDriver: any;
  chartOptionsexpensiveCase: any;
  refulingPoint: any;
  vinList: any;
  fleetIdValueNew: any;
  fleetIds: any;
  errorMessage: string;
  totalEVRangeCity: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  groupList: any;
  constructor(  private timezoneService: TimezoneService,public router : Router,public http: HttpClient,private modalService: NgbModal, private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService) { }
  dateRange: any
  ngOnInit() {
    this.showRole();
    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }
    this.vehicleBodyClassForEVTrends()
    this.cityHighwayFuel()
    this.getBreakdownMonths()
    this.getEmissionData()
    this.evDistance()
    this.rechargeEvents()
    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime(); // Update vehicle data when timezone changes
    });
    if(this.user != 'role_user_fleet' && this.user !='role_org_group'){
    this.selectConsumers()
  }
    if (this.customConsumer) {
      const normalizedConsumer = this.customConsumer.trim().toLowerCase();
      const selected = this.consumerList.find((item) =>
          item.name.trim().toLowerCase() === normalizedConsumer
      );
      if (selected) {
        this.dateRange = this.formatDatedForActive(selected.startDate); // Update the dateRange with the selected consumer's start date
      }
      else {
        this.dateRange = null; // Reset dateRange as no consumer is found
      }
    }

  }
  consumerList: any;
    updateTime() {
          if (!this.rechargeEvent || this.rechargeEvent.length === 0) return;

          this.rechargeEvent.forEach(vehicle => {
            // Handle Refuel SummaryDate & Time
            if (vehicle.timestamp) {
              vehicle.formattedDate = moment.utc(vehicle.timestamp)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY');

              vehicle.formattedTime = moment.utc(vehicle.timestamp)
                .tz(this.selectedTimezone)
                .format('HH:mm');
            } else {
              vehicle.formattedDate = '--';
              vehicle.formattedTime = '--';
            }
          });
        }
  async getAllConsumerss() {
    try {
      // Fetch all consumers
      const response = await this.dashboardservice
        .getAllConsumers()
        .pipe(
          pluck("data"),
          catchError(() => of([])),  // Return an empty array on error
          shareReplay(1)
        )
        .toPromise();

      this.consumerList = (response as Consumer[]).filter((item) => item.contract).map((item) => ({
        name: item.name,
        startDate: item.contract.startDate // Include the start date
      }));
      const excludedConsumers = new Set([
        "Slick", "OneStep", "Arvind_insurance", "HD Fleet LLC", "GEICO",
        "Forward thinking GPS", "Geo Toll","Matrack",
        "Geico", "Test fleet", "Rockingham", "Axiom", "GeoToll",
      ]);

      this.consumerList = this.consumerList.filter(item => !excludedConsumers.has(item.name));

      // Sort consumer names
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
    }
  }


  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }


  selectMenuItem(item: string) {
    this.selectedMenuItem = this.selectedMenuItem === item ? null : item;
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

  isVin(alias: string): boolean {
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/; // VIN is alphanumeric, excluding I, O, and Q
    return vinPattern.test(alias);
  }

  clearMonthSelection(){
   this.evDistance()
  }

  selectFleetId() {
    this.selectGroupId()
    this.monthData = null
    this.vehicleBodyClassForEVTrends()
    this.cityHighwayFuel()
    this.evDistance()
   this.rechargeEventFleet()
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.monthData = null
    this.vehicleBodyClassForEVTrends()
    this.cityHighwayFuel()
    this.evDistance()
   this.rechargeEventFleet()
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


  clearFleetId() {
    this.fleetIdData = '';
  }

  clearFleetSelection() {
    this.selectConsumers()
    this.selectFleetId()
    this.evDistance()
  }

  onTimePeriodChange(event: any) {
    if (event === 'monthly') {
      this.evDistance()
    }
    if (event === 'weekly') {
     this.evDistanceWeek()
    }
    if (event === 'daily') {
    this.evDistanceWeek()
    }
  }

    selectVinList() {
      this.subscription$.add(
        this.dashboardservice.vinBasedOnConsumer(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
          this.vinList =  res.vinAliasList || [];
          this.vinList = this.vinList
          this.vinListData = null
        }, err => { })
      )
    }

    dataDownloadOnVinChange(format: 'csv' | 'excel') {
      this.subscription$.add(
          this.dashboardservice.downloadRefulingReport(this.vinListData).subscribe(
              (res: any) => {
                  this.vinListDataForDownlaod = res;

                  if (format === 'csv') {
                      this.downloadCSV(this.vinListDataForDownlaod);
                  } else if (format === 'excel') {
                      this.downloadExcel(this.vinListDataForDownlaod);
                  }

                  this.vinListData = null; // Clear the selection if needed
              },
              err => {
                  console.error(err); // Handle error
              }
          )
      );
  }


getLastThreeDigitsOfVin(data: any): string {
  if (data && data.length > 0 && data[0].vin) {
      const vin = data[0].vin;
      return vin.substring(vin.length - 3);
  }
  return '';
}


  downloadCSV(data: any) {
      const csvData = this.convertToCSVforDownloadVinRefuling(data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const vinDigits = this.getLastThreeDigitsOfVin(data);
      a.setAttribute('href', url);
      a.setAttribute('download', `FuelRefuelingCost-${vinDigits}.csv`);
      a.click();
  }

  convertToCSVforDownloadVinRefuling(objArray: any): string {
    const csvHeader = 'VIN,Time of Refueling (Start Time),Refueling Location,Refueling Amount (gal),Refueling Cost ($)\r\n';
    let csvString = csvHeader;

    objArray.forEach(item => {
      // Ensure the fields match the header order and casing
      const row = [
        item.vin,
        item.dateTime,
        `"${item.address.replace(/"/g, '""')}"`,
        (item.amtFuelRefuelled * 0.26417205),
        item.fuelConsumedCost
      ].join(',');

      csvString += row + '\r\n';
    });

    return csvString;
  }

  downloadExcel(data: any) {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'VIN Data');
      XLSX.writeFile(wb, 'vin_data.xlsx');
  }

   vinwiseReportDownload(vinWiseRefuling){
    this.modalService.open(vinWiseRefuling, { size: 'sm', centered: true });
    this.selectVinList()
  }

  async evDistance(){
    await this.dashboardservice.distanceKwn(this.customConsumer, this.fleetIdData, this.groupIdData,'').subscribe((data: any) => {
      this.evDistanceData = data
      this.getChargingCosttrends(this.evDistanceData)
    }, err => {
    })
  }

  async evDistanceWeek(){
    await this.dashboardservice.distanceKwnWeek(this.customConsumer, this.fleetIdData, this.groupIdData,'').subscribe((data: any) => {
      this.evDistanceData = data
      this.getChargingCosttrendsWeek(this.evDistanceData)
    }, err => {
    })
  }

  async evDistanceday(){
    await this.dashboardservice.distanceKwnDay(this.customConsumer, this.fleetIdData, this.groupIdData,'').subscribe((data: any) => {
      this.evDistanceData = data
      this.getChargingCosttrendsDay(this.evDistanceData)
    }, err => {
    })
  }

  getChargingCosttrends(data){
    let labelFuelCost = []
    let distanceEv = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelFuelCost.push(formattedDate);
        distanceEv.push(parseFloat(item.avgDistancePerKWH).toFixed(2));
    });

    this.chargingCost = {
      series: [
        {
          name: "EV Range per Kwh",
          data: distanceEv
        }
      ],
      chart: {
        height: 320,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth:20,
          distributed: true,
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: [
        "#2CA87F",
        "#95d3bf",
        "#FA751A",
        "#fcba8c",
        "#4680ff",
        "#c7d9ff"
      ],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: -30,
      },
      legend: {
        show: false
      },
      grid: {
        strokeDashArray: 7,
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
          text: "EV Distance(miles) per kwh ",
        },
        min: 0,
        max: 10,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: function (val) {
            return val.toFixed(2);
          }
        },
      }
    }
  }

  getChargingCosttrendsWeek(data){
    let distanceEv = [];
    let labelFuelCost = []
    // Assuming data is already sorted by date in descending order
    for (let i = 0; i < 5; i++) {
     const currentDate = new Date(); // Use the latest date here
     const weekStartDate = new Date(currentDate);
     weekStartDate.setDate(currentDate.getDate() - (i * 7)); // Subtracting multiples of 7 to go back in weeks

     // Format the date as YYYY-MM-DD
     const year = weekStartDate.getFullYear();
     const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
     const day = String(weekStartDate.getDate()).padStart(2, '0');
     const formattedDate = `${year}-${month}-${day}`;
     labelFuelCost.unshift(formattedDate); // Add to the beginning of the array to maintain order
 }
    data.map((item) => {
    distanceEv.push(item.avgDistancePerKWH);
    });
    this.chargingCost = {
      series: [
        {
          name: "Distance per kwh",
          data: distanceEv
        }
      ],
      chart: {
        height: 320,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth:20,
          distributed: true,
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: [
        "#2CA87F",
        "#95d3bf",
        "#FA751A",
        "#fcba8c",
        "#4680ff",
        "#c7d9ff"
      ],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: -30,
      },
      legend: {
        show: false
      },
      grid: {
        strokeDashArray: 7,
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
          text: "Week",
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
          text: "EV Distance(miles) per kwh ",
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

  getChargingCosttrendsDay(data){
    let labelFuelCost = []
    let distanceEv = [];
    data.sort((a, b) => a.localDate.localeCompare(b.localDate));
    data.map((item) => {
      labelFuelCost.push(item.localDate);
        distanceEv.push(item.avgDistancePerKWH);
    });

    this.chargingCost = {
      series: [
        {
          name: "Distance per kwh",
          data: distanceEv
        }
      ],
      chart: {
        height: 320,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth:20,
          distributed: true,
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: [
        "#2CA87F",
        "#95d3bf",
        "#FA751A",
        "#fcba8c",
        "#4680ff",
        "#c7d9ff"
      ],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: -30,
      },
      legend: {
        show: false
      },
      grid: {
        strokeDashArray: 7,
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
          text: "Day",
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
          text: "EV Distance(miles) per kwh ",
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


  async getEmissionData() {
    this.spinner.show()
    await this.dashboardservice.emissionMonth(this.customConsumer,this.fleetIdData,this.groupIdData,'').subscribe((data: any) => {
      this.emissionsData = data
      this.spinner.hide()
      this.getEmissionChart(this.emissionsData)
    }, err => {
    })
  }

  async getEmissionWeekData() {
    await this.dashboardservice.emissionWeek(this.customConsumer,"",this.fleetIdData,this.groupIdData,).subscribe((data: any) => {
      this.emissionsData = data
      this.getEmissionChartWeek(this.emissionsData)
    }, err => {
    })
  }

  async getEmissionDayData() {
    await this.dashboardservice.emissionDay(this.customConsumer,this.fleetIdData, this.groupIdData,"").subscribe((data: any) => {
      this.emissionsData = data
      this.getEmissionChartDay(this.emissionsData)
    }, err => {
    })
  }

  async getEmissionfleetData() {
    await this.dashboardservice.emissionMonth(this.customConsumer, this.fleetIdData,this.groupIdData,'').subscribe((data: any) => {
      this.emissionsData = data
      this.getEmissionChart(this.emissionsData)
    }, err => {
    })
  }

  getEmissionChart(data) {
    // Initialize data arrays for each category
    let emissionData = []
    let gasolineData = [];
    let dieselData = [];
    let phevData = [];
    let hevData = [];
    let bevData = [];
    let labelFuelCost = []

    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelFuelCost.push(formattedDate);
        // emissionData.push(parseFloat(item.emission).toFixed(0));
        gasolineData.push(parseFloat(item.emissGasoline).toFixed(0));
        dieselData.push(parseFloat(item.emissDiesel).toFixed(0));
        phevData.push(parseFloat(item.emissGasPHEV).toFixed(0));
        hevData.push(parseFloat(item.emissGasHEV).toFixed(0));
        bevData.push(parseFloat(item.emissGasBEV).toFixed(0));
    });

    // Assign data to emissionChart
    this.emissionChart = {
        series: [
            // {
            //   name:"Emission",
            //   data: emissionData
            // },
            { name: "Gasoline", data: gasolineData },
            { name: "Diesel", data: dieselData },
            { name: "PHEV", data: phevData },
            { name: "HEV", data: hevData },
            { name: "BEV", data: bevData }
        ],
        chart: {
          height: 360,
          type: "line",
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        dataLabels: {
          enabled: false
        },
        legend: {
          show: true,
          position: 'bottom',
          onItemClick: {
            toggleDataSeries: true
          },
          itemMargin: {
            vertical: 5
          }
        },
        colors:["#95D3BF","#FF0000", "#FA751A","#4680FF", "#2CA87F", "#000000"],
        stroke: {
          width: 2,
          curve: "straight",
          dashArray: [0, 0, 0]
        },
        markers: {
          size: 3,
          hover: {
            size: 3
          }
        },
        xaxis: {
          categories:labelFuelCost,
          title: {
            offsetX: -10,
            offsetY: -13,
            text: "Month"
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
          labels: {
            show: true,
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
          },
        },
        yaxis: {
          title: {
            text: "Emissions per mile"
          },
          labels: {
            show: true,
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
          },
        },
        grid: {
          borderColor: "#f1f1f1"
        }
    };
}
getEmissionChartWeek(data) {
  // Initialize data arrays for each category
  let emissionData = []
  let gasolineData = [];
  let dieselData = [];
  let phevData = [];
  let hevData = [];
  let bevData = [];
  let labelFuelCost = []
     // Assuming data is already sorted by date in descending order
     for (let i = 0; i < 5; i++) {
      const currentDate = new Date(); // Use the latest date here
      const weekStartDate = new Date(currentDate);
      weekStartDate.setDate(currentDate.getDate() - (i * 7)); // Subtracting multiples of 7 to go back in weeks

      // Format the date as YYYY-MM-DD
      const year = weekStartDate.getFullYear();
      const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
      const day = String(weekStartDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      labelFuelCost.unshift(formattedDate); // Add to the beginning of the array to maintain order
  }
  data.map((item) => {
   /// emissionData.push(parseFloat(item.emission).toFixed(0));
      gasolineData.push(parseFloat(item.emissGasoline).toFixed(0));
      dieselData.push(parseFloat(item.emissDiesel).toFixed(0));
      phevData.push(parseFloat(item.emissGasPHEV).toFixed(0));
      hevData.push(parseFloat(item.emissGasHEV).toFixed(0));
      bevData.push(parseFloat(item.emissGasBEV).toFixed(0));
  });
  // Assign data to emissionChart
  this.emissionChart = {
      series: [
          // {
          //   name:"Emission",
          //   data: emissionData
          // },
          { name: "Gasoline", data: gasolineData },
          { name: "Diesel", data: dieselData },
          { name: "PHEV", data: phevData },
          { name: "HEV", data: hevData },
          { name: "BEV", data: bevData }
      ],
      chart: {
        height: 360,
        type: "line",
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: true,
        position: 'bottom',
        onItemClick: {
          toggleDataSeries: true
        },
        itemMargin: {
          vertical: 5
        }
      },
      colors:["#95D3BF","#FF0000", "#FA751A","#4680FF", "#2CA87F", "#000000"],
      stroke: {
        width: 2,
        curve: "straight",
        dashArray: [0, 0, 0]
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      xaxis: {
        categories:labelFuelCost,
        title: {
          offsetX: -10,
          offsetY: -13,
          text: "Month"
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
      },
      yaxis: {
        title: {
          text: "Emissions per mile"
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
      },
      grid: {
        borderColor: "#f1f1f1"
      }
  };
}
getEmissionChartDay(data) {
  // Initialize data arrays for each category
  let emissionData = []
  let gasolineData = [];
  let dieselData = [];
  let phevData = [];
  let hevData = [];
  let bevData = [];
  let labelFuelCost = []

  data.sort((a, b) => a.localDate.localeCompare(b.localDate));
  data.map((item) => {
    labelFuelCost.push(item.localDate);
      // emissionData.push(parseFloat(item.emission).toFixed(0));
      gasolineData.push(parseFloat(item.emissGasoline).toFixed(0));
      dieselData.push(parseFloat(item.emissDiesel).toFixed(0));
      phevData.push(parseFloat(item.emissGasPHEV).toFixed(0));
      hevData.push(parseFloat(item.emissGasHEV).toFixed(0));
      bevData.push(parseFloat(item.emissGasBEV).toFixed(0));
  });

  // Assign data to emissionChart
  this.emissionChart = {
      series: [
          { name: "Gasoline", data: gasolineData },
          { name: "Diesel", data: dieselData },
          { name: "PHEV", data: phevData },
          { name: "HEV", data: hevData },
          { name: "BEV", data: bevData }
      ],
      chart: {
        height: 360,
        type: "line",
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: true,
        position: 'bottom',
        onItemClick: {
          toggleDataSeries: true
        },
        itemMargin: {
          vertical: 5
        }
      },
      colors:["#95D3BF","#FF0000", "#FA751A","#4680FF", "#2CA87F", "#000000"],
      stroke: {
        width: 2,
        curve: "straight",
        dashArray: [0, 0, 0]
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      xaxis: {
        categories:labelFuelCost,
        title: {
          offsetX: -10,
          offsetY: -13,
          text: "Month"
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
      },
      yaxis: {
        title: {
          text: "Emissions per mile"
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
      },
      grid: {
        borderColor: "#f1f1f1"
      }
  };
}

overviewEV(){
  this.overview = true;
  this.summary = false;
}

summaryEV(){
  this.overview = false;
  this.summary = true;
  this.evDistance()
}

evFunc(){

}

async rechargeEventsConsumerAll() {
  this.subscription$.add(
    await this.dashboardservice.allRechargeEvetnConsumer(this.customConsumer).subscribe((res: any) => {
        let rechargeEvents = [];
        if (res) {
            rechargeEvents = res.map(event => event.rechargeLocations).flat();
        }
        this.rechargeEvent = rechargeEvents;
      })
  );
}

async rechargeEvents() {
  this.subscription$.add(
    await this.dashboardservice.allRechargeEvetnConsumer(this.customConsumer).subscribe((res: any) => {
      let rechargeEvents = [];
      if (res) {
          rechargeEvents = res.map(event => event.rechargeLocations).flat();
      }
      this.rechargeEvent = rechargeEvents;
      })
  );
}

async rechargeEventFleet() {
  this.subscription$.add(
    await this.dashboardservice.allRechargeEvetnFleet(this.customConsumer,this.fleetIdData, this.groupIdData, '').subscribe((res: any) => {
      let rechargeEvents = [];
      if (res) {
          rechargeEvents = res.map(event => event.rechargeLocations).flat();
      }
      this.rechargeEvent = rechargeEvents;
      })
  );
}

async getBreakdownMonths() {
  try {
    this.dashboardservice.breakDownMonth(this.customConsumer, this.fleetIdData,  this.groupIdData,'').subscribe((data: any) => {
      this.breakDown = data;
      this.chartEV(this.breakDown);

      // Initialize counts to 0
      this.bev = 0;
      this.hev = 0;
      this.phev = 0;

      if (this.breakDown.length === 0) {
        // If breakDown is empty, set bev and hev to 0
        this.bev = 0;
        this.hev = 0;
        this.phev = 0;
        this.totalCount = 0;
      } else {
        // Calculate counts if breakDown is not empty
        this.breakDown.forEach(item => {
          if (item.primaryFuelType === 'BEV') {
            this.bev += item.count;
          } else if (item.primaryFuelType === 'HEV') {
            this.hev += item.count;
          } else if (item.primaryFuelType === 'PHEV') {
            this.phev += item.count;
          }
        });
        // Calculate total count
        this.totalCount = this.bev + this.hev + this.phev;
      }
      this.bevPercentage = this.totalCount > 0 ? ((this.bev / this.totalCount) * 100).toFixed(1) : "0.0";
      this.hevPercentage = this.totalCount > 0 ? ((this.hev / this.totalCount) * 100).toFixed(1) : "0.0";
      this.phevPercentage = this.totalCount > 0 ? ((this.phev / this.totalCount) * 100).toFixed(1) : "0.0";
    }, err => {
    });
  } catch (err) {
  }
}

getTotalCount(data: any[]): { [fuelType: string]: number } {
  const totalCount = {};

  // Iterate over the data and sum up counts for each fuel type
  data.forEach(item => {
    const { count, primaryFuelType } = item;
    totalCount[primaryFuelType] = (totalCount[primaryFuelType] || 0) + count;
  });

  return totalCount;
}

maskVin(vin: string): string {
  if (vin.length >= 3) {
    return '**' + vin.slice(-3);} else {return vin}
}
convertToCDT(dateTime: string): string {
  if (!dateTime) return '';
  const utcDateTime = new Date(dateTime);
  const cdtOffset = -6 * 60;
  const cdtDateTime = new Date(utcDateTime.getTime() + (cdtOffset * 60 * 1000));
  cdtDateTime.setMinutes(cdtDateTime.getMinutes());
  const cdtYear = cdtDateTime.getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const cdtMonth = monthNames[cdtDateTime.getMonth()];
  const cdtDay = cdtDateTime.getDate().toString().padStart(2, '0');
  const cdtHours = cdtDateTime.getHours().toString().padStart(2, '0');
  const cdtMinutes = cdtDateTime.getMinutes().toString().padStart(2, '0');
  const cdtSeconds = cdtDateTime.getSeconds().toString().padStart(2, '0');
  return `${cdtMonth} ${cdtDay},${cdtYear} ${cdtHours}:${cdtMinutes}`;
}
iceFunc(){
  this.showRow = true;
}

chartEV(data: any) {
  // Initialize series data and labels arrays
  let seriesData: number[] = [];
  let labels: string[] = [];
  let colors: string[] = [];

  // Iterate over the JSON response data
  data.forEach((item: any) => {
    seriesData.push(item.count);
    const fuelTypeLabel = this.getFuelTypeLabel(item.primaryFuelType);
    labels.push(fuelTypeLabel);

    // Assign colors based on fuel type
    switch (fuelTypeLabel) {
      case 'Hybrid Electric Vehicles':
        colors.push('#4680FF'); // Color for Hybrid Electric Vehicles
        break;
      case 'Battery Electric Vehicles':
        colors.push('#2CA77E'); // Color for Battery Electric Vehicles
        break;
        case 'Plug-in Hybrid Electric Vehicles':
        colors.push('#F6731A'); // Default color for other vehicle types
        break;
    }
  });

  // Set chart options
  this.vehicleBodyClass = {
    chart: {
      height: 300,
      width: '100%',
      type: 'donut',
      redrawOnWindowResize: true,
    },
    series: seriesData,
    legend: {
      show: false,
      position: 'bottom',
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      floating: false,
      fontSize: '14px',
      offsetX: 0,
      offsetY: -10,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) => {
        return opts.w.config.series[opts.seriesIndex]; // Display the actual value
      },
      dropShadow: {
        enabled: false,
      },
    },
    labels: labels,
    colors: colors, // Use dynamically assigned colors based on fuel type
    tooltip: {
      y: {
        formatter: (val: number) => val.toString(), // Display the actual value in the tooltip
      },
    },
  };
}

getFuelTypeLabel(primaryFuelType: string): string {
  switch (primaryFuelType) {
    case "BEV":
      return "Battery Electric Vehicles";
    case "HEV":
      return "Hybrid Electric Vehicles";
    case "PHEV":
      return "Plug-in Hybrid Electric Vehicles";
    default:
      return "";
  }
}

vinwiseRechargingCostReportDownload(vinWiseRechargingCostDownload) {
  const modalRef = this.modalService.open(vinWiseRechargingCostDownload, {
    size: 'xl',
    centered: true,
    keyboard: false,
    backdrop: 'static'
  });

  // Disable scrolling
  document.body.style.overflow = 'hidden';

  // Re-enable scrolling when modal closes or dismisses
  modalRef.result.finally(() => {
    document.body.style.overflow = '';
  });
}

dataDownloadOnVinChangeForRechargingCost(vin: string, format: 'csv' | 'excel') {
  this.selectedButton = 'vin';
  this.subscription$.add(
    this.dashboardservice.DownloadallRechargeEvetnConsumerAll(vin).subscribe(
      (res: any) => {
        if (res && Array.isArray(res) && res.length > 0) {
          // Flatten the nested arrays
          this.rechargingCostVinDataforDowload = [].concat(...res.map(item => item.rechargeLocations));

          if (format === 'csv') {
            this.downloadRechargingCSV(this.rechargingCostVinDataforDowload);
          } else if (format === 'excel') {
            this.downloadRechargingExcel(this.rechargingCostVinDataforDowload);
          }
          this.vinListData = null; // Clear the selection if needed
        } else {
          this.noDataFounds(this.nodatafound)
        }
      },
      err => {
        console.error('Error fetching recharge data:', err); // Handle error
        // Handle error scenario
      }
    )
  );
}


downloadVin(){
  this.vinDownlaod = true;
  this.dateDownload = false;
  this.dateVinDownlaod = false;
  this.activeButton = 'vin';
}

downloadDateRange(){
  this.vinDownlaod = false;
  this.dateDownload = true;
  this.dateVinDownlaod = false;
  this.activeButton = 'dateRange';
}

downloadVinDateRange(){
  this.vinDownlaod = false;
  this.dateDownload = false;
  this.activeButton = 'vinDateRange';
  this.dateVinDownlaod = true;
}
dataDownloadOnVinChangeForRechargingCostDateRange(vin: string, format: 'csv' | 'excel') {
  const startDate = this.fromDate ? this.convertNgbDateToMoment(this.fromDate).format('YYYY-MM-DD') : null;
    const endDate = this.toDate ? this.convertNgbDateToMoment(this.toDate).format('YYYY-MM-DD') : null;
  this.subscription$.add(
    this.dashboardservice.DownloadallRechargeEvetnConsumerAllDate(startDate, endDate ).subscribe(
      (res: any) => {
        if (res && Array.isArray(res) && res.length > 0) {
          // Flatten the nested arrays
          this.rechargingCostVinDataforDowload = [].concat(...res.map(item => item.rechargeLocations));

          if (format === 'csv') {
            this.downloadRechargingCSV(this.rechargingCostVinDataforDowload);
          } else if (format === 'excel') {
            this.downloadRechargingExcel(this.rechargingCostVinDataforDowload);
          }

          this.vinListData = null; // Clear the selection if needed
        } else {
          this.noDataFounds(this.nodatafound)
        }
      },
      err => {
        console.error('Error fetching recharge data:', err); // Handle error
      }
    )
  );
}

noDataFounds(nodatafound) {
  this.modalService.open(nodatafound, { centered: true})
}

convertNgbDateToMoment(date: NgbDateStruct): moment.Moment {
  return moment([date.year, date.month - 1, date.day]);
}

dataDownloadOnVinChangeForRechargingCostVINDate(vin: string, format: 'csv' | 'excel') {
  const startDate = this.fromDate ? this.convertNgbDateToMoment(this.fromDate).format('YYYY-MM-DD') : null;
    const endDate = this.toDate ? this.convertNgbDateToMoment(this.toDate).format('YYYY-MM-DD') : null;
  this.selectedButton = 'vinDateRange';
  this.subscription$.add(
    this.dashboardservice.DownloadallRechargeEvetnConsumerAllVINDate(this.vinListData, startDate, endDate ).subscribe(
      (res: any) => {

        if (res && Array.isArray(res) && res.length > 0) {
          // Flatten the nested arrays
          this.rechargingCostVinDataforDowload = [].concat(...res.map(item => item.rechargeLocations));

          if (format === 'csv') {
            this.downloadRechargingCSV(this.rechargingCostVinDataforDowload);
          } else if (format === 'excel') {
            this.downloadRechargingExcel(this.rechargingCostVinDataforDowload);
          }

          this.vinListData = null; // Clear the selection if needed
        } else {
          this.noDataFounds(this.nodatafound)
        }
      },
      err => {
        console.error('Error fetching recharge data:', err); // Handle error
      }
    )
  );
}

downloadReport() {
  if (this.vinListData) {
      this.dataDownloadOnVinChangeForRechargingCost(this.vinListData, 'csv');
      this.vinListData = '';
  } else {
      console.error('Please select a VIN before downloading.');
  }
}
downloadReportDateNewDownload() {
      this.dataDownloadOnVinChangeForRechargingCostDateRange(this.vinListData,'csv');
      this.fromDate = null;
      this.toDate = null

}
downloadReportVinDate() {
  if (this.vinListData) {
      this.dataDownloadOnVinChangeForRechargingCostVINDate(this.vinListData, 'csv');
      this.vinListData = '';
      this.fromDate = null;
      this.toDate = null
  } else {
      console.error('Please select a VIN before downloading.');
  }
}

downloadRechargingCSV(data: any) {
  const csvData = this.convertToCSVforRechargingCostDownloadVinRecharging(data);
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const vinDigits = this.getLastThreeDigitsOfVin(data);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `RechargingCost-${vinDigits}.csv`);
  a.click();
}

convertToCSVforRechargingCostDownloadVinRecharging(objArray: any[]): string {
  if (!objArray || objArray.length === 0) {
    return '';
  }

  // Define the capitalized headers
  const csvHeader = 'VIN,Time of Charging,Longitude,Latitude,Charge Amt KWH,Recharge Cost ($),Charging Speed,Charging Location Type\r\n';
  let csvString = csvHeader;

 objArray.forEach(item => {
      const dateTimeUTC = moment.utc(item.timestamp);
      const formattedDate = dateTimeUTC.tz(this.selectedTimezone).format('MMM D, YYYY');
      const formattedTime = dateTimeUTC.tz(this.selectedTimezone).format('HH:mm');
      const timeOfRefueling = `${formattedDate} ${formattedTime}`;

      csvString += `${item.vin},"${timeOfRefueling}",${item.longitude},${item.latitude},${item.chargeAmtKWH},${item.rechargeCost},${item.chargingSpeed},${item.chargingLocationType}\r\n`;

       });


  return csvString;
}


downloadRechargingExcel(data: any) {
  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'VIN Data');
  XLSX.writeFile(wb, 'vin_data.xlsx');
}

  ngOnDestroy(): void {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }


  formatDated(dateString: string | Date): string {
    const date = new Date(dateString);

    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${mm}-${dd}-${yyyy} ${hours}:${minutes}`;
  }

  noDataMessageNew: string = ''; // Message to display when no data is found or in case of an error
  totalMileageData: any[] = []; // Initialize as an empty array
  vehicleclass: any; // Assuming t
  cityHighway: any;
  noDataMessage:boolean = false;

  async vehicleBodyClassForEVTrends() {
    try {
      const response: any = await this.dashboardservice.getBodyClassEV(this.customConsumer, this.fleetIdData, this.groupIdData, '').toPromise();
      if (response && response.length > 0) {
        this.totalMileageData = response;
        this.noDataMessageNew = ''; // Clear the error message
        this.getByVehicleClass(); // Proceed with next steps
      }
      else {
        this.totalMileageData = [];
        this.noDataMessageNew = 'No Data Found';
      }
    }
    catch(error) {
      console.error('Error fetching data:', error);
      this.totalMileageData = [];
      this.noDataMessageNew = 'Error fetching data. Please try again.';
    }
  }
  getByVehicleClass() {
    const colorMapping: { [key: string]: string } = {
      'Sedan': "#a5dac9",
      'Pickup': '#979A9E',
      'Hatchback': "#F0CE9C",
      'Van': "#FF8080",
      'Truck': "#C6ABB8",
      'Suv': "#2CA87F",
      'Others': "#808080", // Default color for unspecified classes
    };

    if (!this.totalMileageData || !this.totalMileageData.length) {
      return;
    }

    // Ensure proper sorting by `yearMonth` (assuming it's in "YYYY-MM" format)
    this.totalMileageData.sort((a: any, b: any) => a.yearMonth.localeCompare(b.yearMonth));

    const categories: string[] = [];
    const seriesData: { [key: string]: number[] } = {};

    this.totalMileageData.forEach((item: any) => {
      // Format `yearMonth` to match x-axis labels
      const formattedYearMonth = new Date(item.yearMonth + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }).replace(" ", "'");

      if (!categories.includes(formattedYearMonth)) {
        categories.push(formattedYearMonth);
      }

      // Prepare mileage data by bodyClass
      item.distancePerKwhByBodyClass.forEach((mileageData: any) => {
        const bodyClass = mileageData.bodyClass
          ? mileageData.bodyClass.charAt(0).toUpperCase() + mileageData.bodyClass.slice(1).toLowerCase()
          : 'Others';

        if (!seriesData[bodyClass]) {
          seriesData[bodyClass] = new Array(categories.length).fill(0); // Fill with zeros for alignment
        }

        const index = categories.indexOf(formattedYearMonth);
        if (index !== -1) {
          const distancePerKWH = mileageData?.distancePerKWH;
          seriesData[bodyClass][index] = distancePerKWH != null
              ? parseFloat(distancePerKWH.toFixed(2))
              : 0;
      }
      });
    });

    const series = Object.keys(seriesData).map((bodyClass) => ({
      name: bodyClass,
      data: seriesData[bodyClass],
      color: colorMapping[bodyClass] || colorMapping['Others'],
    }));
    this.vehicleclass = {
      series: series,
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        verticalAlign: "middle",
        floating: false,
        fontSize: "12px",
        offsetX: 0,
        offsetY: 10,
        markers: {
          height:'2.5px',
          size: 7,
          shape: "rectangle",
          offsetY: -3.5,
        },
      },
      chart: {
        type: "bar",
        stacked: false,
        height: 300,
        zoom: {
          show: false,
        },
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: this.totalMileageData.length === 1 ? "80%" : "20%",
          borderRadiusApplication: "end",
          borderRadius: 5,
          dataLabels: {
            enabled: true,
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: false,
        style: {
          colors: ["#6C757E"],
          fontSize: "12",
          fontWeight: "100",
        },
        offsetY: 0,
        formatter: function (val, opt) {
          if (opt.seriesIndex && opt.dataPointIndex) {
            return opt.dataPointIndex;
          } else {
            return "";
          }
        },
      },
      stroke: {
        show: true,
        width: 0,
        colors: ["transparent"],
      },
      colors: Object.values(colorMapping),
      labels: Object.keys(seriesData),
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.1,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      label_title: Object.keys(seriesData),  // Dynamic labels based on bodyClass,
      labels2: [
        "(Count per 100 miles)",
        "(Count per 100 miles)",
        "(Count per 100 miles)",
        "(% of distance travelled)",
        "(% of distance travelled)",
      ],
      xaxis: {
        categories: categories,
        title: {
          offsetX: -20,
          offsetY: 0,
          text: "Month",
          style: {
            color: "#AEAEAE",
            fontSize: "11px",
            fontFamily: "Poppins",
            fontWeight: 400,
          },
        },
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: true,
          style: {
            color: "#AEAEAE",
            fontSize: "11px",
            fontFamily: "Poppins",
            fontWeight: 400,
          },
        },
      },
      yaxis: [
        {
          labels: {
            show: true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed() + "k" : value; // Format large values as 'k'
            },
          },
          title: {
            offsetX: 0,
            offsetY: 0,
            text: "EV Range (miles/kwh)",
            style: {
              color: "#AEADAD",
              fontSize: "11px",
              fontFamily: "Poppins",
              fontWeight: 400,
            },
          },
        },

      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const seriesLabel = w.config.labels[seriesIndex];
          const backgroundColor = colorMapping[seriesLabel] || '#FFFFFF';

          return `
            <div style="position: relative; background-color:${backgroundColor}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              <div style="font-weight:500; font-family:'Poppins'"> ${seriesLabel}</div>
              ${value} miles/kwh
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        }
      },
      grid: {
        show: true,
        borderColor: "#DEDEDE",
        strokeDashArray: 2,
        xaxis: {
          lines: {
            show: true,
          },
        },
      },
    };
  }
  async cityHighwayFuel() {
    try {
      this.errorMessage = ''; // Clear previous error messages

      const response = await firstValueFrom(
        this.dashboardservice.getCityHighwayEV(this.customConsumer, this.fleetIdData,  this.groupIdData, '').pipe(
          catchError((error: any) => {
            this.errorMessage = `Error: ${error.status} - ${error.message || 'Internal Server Error'}`;
            return of(null); // Return null observable so await returns null
          })
        )
      );

      if (Array.isArray(response) && response.length > 0) {
        const cityVsHighwayData = response
        .map((item: any) => item.cityVsHighwayDistancePerKwhDtos || [])
        .reduce((acc: any[], val: any[]) => acc.concat(val), [])
        .filter(Boolean);

        if (cityVsHighwayData.length > 0) {
          cityVsHighwayData.sort((a: any, b: any) => {
            const dateA = new Date(a.yearMonth);
            const dateB = new Date(b.yearMonth);
            return dateA.getTime() - dateB.getTime();
          });

          const categories: string[] = cityVsHighwayData.map((item: any) => {
            const [year, month] = item.yearMonth.split('-');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${monthNames[parseInt(month) - 1]}'${year.slice(2)}`;
          });

          const cityMileageData = cityVsHighwayData.map((item: any) =>
            parseFloat((item.cityDistancePerKWH || 0).toFixed(2))
          );
          const highwayMileageData = cityVsHighwayData.map((item: any) =>
            parseFloat((item.highwayDistancePerKWH || 0).toFixed(2))
          );

          this.getbyCityVsHighway(cityMileageData, highwayMileageData, categories);
        } else {
          this.errorMessage = 'No Data Found';
        }
      } else {
        this.errorMessage = 'No Data Found';
      }
    } catch (error: any) {
      this.errorMessage = `An error occurred: ${error.message || 'Internal Server Error'}`;
    }
  }

  getbyCityVsHighway(cityMileageData: number[], highwayMileageData: number[], categories: string[]) {
    const columnWidth = cityMileageData.length > 1 || highwayMileageData.length > 1 ? '50%' : '20%';
    this.cityHighway = {
      series: [
        {
          name: "City",
          data: cityMileageData, // Dynamic City series data
          yaxis: 0,
        },
        {
          name: "Highway",
          data: highwayMileageData, // Dynamic Highway series data
          yaxis: 1,
        },
      ],
      legend: {
        show: true,
        position: "bottom",
        horizontalAlign: "center",
        floating: false,
        fontSize: "12px",
        offsetX: 0,
        offsetY: 10,
        markers: {
          height: 2.5,
          size: 7,
          shape: "rectangle",
          offsetY: -3.5,
        },
      },
      chart: {
        type: "bar",
        stacked: false,
        height: 300,
        zoom: { enabled: false },
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: columnWidth,
          borderRadiusApplication: "end",
          borderRadius: 11,
          dataLabels: { enabled: true, position: "top" },
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 0,
        colors: ["transparent"],
      },
      colors: ["#fa751a", "#6489db"],
      xaxis: {
        categories, // Dynamic categories for x-axis
        title: {
          text: "Month",
          style: {
            color: "#AEAEAE",
            fontSize: "11px",
            fontFamily: "Poppins",
            fontWeight: 400,
          },
        },
        labels: {
          style: {
            color: "#AEAEAE",
            fontSize: "11px",
            fontFamily: "Poppins",
            fontWeight: 400,
          },
        },
      },
      yaxis: [
        {
          labels: {
            formatter: (value) => (value >= 1000 ? (value / 1000).toFixed() + "k" : value),
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
          },
          title: {
            text: "Mileage (mpg)",
            style: {
              color: "#AEADAD",
              fontSize: "11px",
              fontFamily: "Poppins",
              fontWeight: 400,
            },
          },
        },
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex }) {
          const value = series[seriesIndex][dataPointIndex];
          const colors = ["#fa751a", "#6489db"];
          const labels = ['City', 'Highway'];

          return `
            <div style="background-color:${colors[seriesIndex]}; color: #FFFFFF; padding: 6px; border-radius: 5px; text-align:center;">
              <div>${labels[seriesIndex]}</div>
              ${value} mpg
            </div>`;
        },
      },
      grid: {
        borderColor: "#DEDEDE",
        strokeDashArray: 2,
        xaxis: { lines: { show: true } },
      },
    };
  }

  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    },10);
    // this.updateDasboard()
  }



}
