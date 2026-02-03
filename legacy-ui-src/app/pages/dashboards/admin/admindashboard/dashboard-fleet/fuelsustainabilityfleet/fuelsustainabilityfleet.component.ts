import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { saveAs } from 'file-saver';
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription, of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { NgxSpinnerService } from "ngx-spinner";
import { catchError, pluck, shareReplay } from "rxjs/operators";
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import * as moment from 'moment-timezone';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexResponsive,
  ApexAnnotations,
} from "ng-apexcharts";
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}
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
  annotations: ApexAnnotations;
};
import { ChartComponent } from "ng-apexcharts";
import { color } from "html2canvas/dist/types/css/types/color";
import { setTextRise } from "pdf-lib";


@Component({
  selector: 'app-fuelsustainabilityfleet',
  templateUrl: './fuelsustainabilityfleet.component.html',
  styleUrls: ['./fuelsustainabilityfleet.component.scss']
})
export class FuelsustainabilityfleetComponent implements OnInit {
  dateRange: any;
  averageFuelCostPerMile: any;
  avgFuelCost: any;
  averageFuelCost: string;
  user: any;
  customConsumer: any;
  fleetIdValueNew: any;
  multiRoles: any;
  fleetIds: any;
  totalMileageData: any;
  totalMileageCity: any;
  groupList: any;
  isInvalidRefuelCost(refuelCost: any): boolean {
    return refuelCost == null || isNaN(refuelCost);
  }
  @ViewChild("chart") chart!: ChartComponent;
  @ViewChild("chartContainer")
  chartContainer!: ElementRef;

  @ViewChild("chartContainerExpensive")
  chartContainerExpensive!: ElementRef;
  public ChartOptions!: Partial<ChartOptions> | any;
  @ViewChild("chart") chartElement: ElementRef;
  isDataNotFound: boolean = false;
  fleetSumamryTotalData: any;
  fleetSumamryData:any;
  consumer: any = "All";
  subscription$: Subscription = new Subscription();
  fleetList: any;
  fleetIdData: any;
  monthData: string = 'monthly';
  consumerList: any;
  chartOptionsFuelConsumed: any;
  chartOptionsFleetMileage: any;
  chartOptionsFuelCost: any;
  chartOptionsFuelidling: any;
  totalIdlingTime: any;
  totalIdlingDuration: string = '';
  chartOptionsWrostMileage: any;
  totalMileage:any;
  wrostDriver: any;
  wrostDriverNull: any;
  refulingPoint: any;
  loading: boolean = false;
  vinList: any;
  vinListData: null;
  averageFuekCost: null;
  isLoading: boolean = false;
  selectedPeriod: any;
  searchByConsumer: any;
  totalFuelConsumedCost: any;
  totalFuelConsumed: any;
  totalIdlingDurationcard: any;
  totalIdlingCost: any;
  vinListDataForDownlaod: any;
  isloading2:boolean = false;
  totalTimePeriods: any;
  expensiveDriver: any
  riskyCoach: any;
  riskyCoachAll: any;
  risckyCoachNodata: any;
  expensiveDriverNoData: any;
  expensiveDriverNoDataNull: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  constructor(
    public router: Router,
    public http: HttpClient,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private dashboardservice: TaxonomyService,
    private timezoneService: TimezoneService,
  ) {}

  ngOnInit(): void {
    this.showRole()
    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }
    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime(); // Update vehicle data when timezone changes
    });
    if(this.user === 'role_consumer_fleet'){
     this.selectConsumers();
    }
    this.updateDasboard()
    // this.selectConsumers()
  }

    updateTime() {
          if (!this.refulingPoint || this.refulingPoint.length === 0) return;

          this.refulingPoint.forEach(vehicle => {
            // Handle Refuel SummaryDate & Time
            if (vehicle.dateTime) {
              vehicle.formattedDate = moment.utc(vehicle.dateTime)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY');

              vehicle.formattedTime = moment.utc(vehicle.dateTime)
                .tz(this.selectedTimezone)
                .format('HH:mm');
            } else {
              vehicle.formattedDate = '--';
              vehicle.formattedTime = '--';
            }

          });
        }

  clearFleetSelection() {
  }

  updateDasboard() {
    this.fuelTopData()
    this.vehicleBodyClass()
    this.cityHighwayFuel()
    this.efficiencyCoach()
    this.getMonthlyData();
    this.idlingTime();
    this.getavgFuelCostMonthly()
    this.getWrostDriver();
    this.monthlyRefuling();
    this.getavgFuelCostMonthly();
    this.fleetSummaryDownloadReport()
    this.cardsData();
    this.getexpensiveDrivers()
  }

  selectFleetId() {
    this.selectGroupId()
    this.fuelTopData()
    this.vehicleBodyClass()
    this.cityHighwayFuel()
    this.getMonthlyData()
    this.idlingTimeforFleet();
    this.getWrostDriver()
    this.refulingFleet();
    this.getavgFuelCostMonthlyFleet();
    this.fleetSummaryDownloadReport()
    this.cardsData();
    this.getexpensiveDriversFleet()
   this.efficiencyCoachFleet()
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.fuelTopData()
    this.vehicleBodyClass()
    this.cityHighwayFuel()
    this.getMonthlyData()
    this.getMonthlyFleetData();
    this.idlingTimeforFleet();
    this.getWrostDriver()
    this.refulingFleet();
    this.getavgFuelCostMonthlyFleet();
    this.fleetSummaryDownloadReport()
    this.cardsData();
    this.getexpensiveDriversFleet()
   this.efficiencyCoachFleet()
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



    // Fuel Top Level Summary
    topLevelData: any
    totalTimePeriodDataTop: any
    totalActivatedVehicles: any;
    totalFuelConsumedData: any;
    avgFuelCostData: any
    totalMileageDataNew: any;
    totalFuelConsumedCostData: any;
    noDataFound: boolean = false;
    async fuelTopData() {
      // Clear old data and flags first
      this.noDataFound = false;
      this.avgFuelCostData = undefined;
      this.totalActivatedVehicles = undefined;
      this.totalTimePeriodDataTop = undefined;
      this.totalFuelConsumedData = undefined;
      this.totalMileageDataNew = undefined;
      this.totalFuelConsumedCostData = undefined;

      try {
        const res: any = await this.dashboardservice
          .getFuelTopSummary(this.customConsumer, this.fleetIdData, this.groupIdData)
          .toPromise();

          this.topLevelData = res;
          this.totalActivatedVehicles = res?.totalActivatedVehicles;
          this.totalTimePeriodDataTop = this.convertSecondsToDaysHhMm(res?.totalDuration);
          this.totalFuelConsumedData = res?.totalFuelConsumed;
          this.totalMileageDataNew = res?.avgMileage;
          this.avgFuelCostData = res?.avgCostPerMile;
          this.totalFuelConsumedCostData = res?.fuelCost;

      } catch (err: any) {
        const errorBody = err?.error?.apierror;

        if (errorBody?.message === 'Data Not Found') {
          this.noDataFound = true;
          this.avgFuelCostData = null;
        } else {
          console.error('Unexpected error fetching fuel data:', err);
        }
      }
    }



  convertSecondsToHhMm(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${formattedMinutes}`;
  }

  cardsData(){
    this.totalFuelConsumed='';
    this.totalFuelConsumedCost='';
    this.totalMileage='';
    this.totalIdlingDurationcard=null;
    this.totalIdlingCost=null;
    this.totalTimePeriods = '';
    this.avgFuelCost = '';
    this.isloading2 = true;

    this.subscription$.add(
      this.dashboardservice
        .downloadDriverSafetyReportAll(
          this.customConsumer,
          this.fleetIdData,
          this.groupIdData,
          this.selectedPeriod
        )
        .subscribe(
          (res: any) => {
            this.fleetSumamryData = res.vinLevelStats;
            this.averageFuelCostPerMile = res.fleetLevelStats?.totalDistanceTravelled
            const totalDurationSum = this.fleetSumamryData.reduce((sum: number, vehicle: any) => {
              return sum + vehicle.totalDuration;
            }, 0);
            this.totalTimePeriods = this.convertSecondsToDaysHhMm(totalDurationSum)
        const totalTripDistance = this.fleetSumamryData?.reduce(
          (total, item) => {
            const tripDistance = Number(item.tripDistance) || 0; // Convert to number and handle non-numeric values
            return total + tripDistance;
          },
          0
        );
        this.totalFuelConsumed = this.fleetSumamryData?.reduce(
          (total, item) => {
            const fuelConsumed = Number(item.fuelConsumed) || 0; // Convert to number and handle non-numeric values
            return total + fuelConsumed;
          },
          0
        );
        const  totalfuelcons  = this.totalFuelConsumed
        this.totalFuelConsumed = Math.round(this.totalFuelConsumed).toLocaleString() ;


        this.totalFuelConsumedCost = this.fleetSumamryData?.reduce(
          (total, item) => {
            const fuelConsumed = Number(item.fuelConsumedCost) || 0; // Convert to number and handle non-numeric values
            return total + fuelConsumed;
          },
          0
        );
        this.totalFuelConsumedCost = Math.round(this.totalFuelConsumedCost)
       this.avgFuelCost = this.totalFuelConsumedCost/this.averageFuelCostPerMile
        this.totalMileage = ((totalTripDistance / totalfuelcons).toFixed(2));
        const idlingDuration = this.fleetSumamryData?.reduce(
          (total, item) => {
            const idling = Number(item.idlingDuration) || 0; // Convert to number and handle non-numeric values
            return total + idling;
          },
          0
        );
        this.totalIdlingDurationcard = Math.round(idlingDuration/3600).toLocaleString();

        this.totalIdlingCost = Math.round((Math.round(idlingDuration/3600)) * 0.5).toLocaleString();

        this.isloading2 = false;
      }
        )
    );
  }

  convertSecondsToDaysHhMm(seconds: number): string {
    const days = Math.floor(seconds / (24 * 3600)); // Calculate the number of days
    const hours = Math.floor((seconds % (24 * 3600)) / 3600); // Calculate the number of hours
    const minutes = Math.floor((seconds % 3600) / 60); // Calculate the number of minutes

    return `${days}:${this.padWithZero(hours)}:${this.padWithZero(minutes)}`;
  }

  private padWithZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  clearMonthSelection() {
    this.idlingTime();
    this.getMonthlyData()
    this.getavgFuelCostMonthly()
    this.getWrostDriver()
    this.getexpensiveDrivers()
    this.efficiencyCoach()
  }

  onTimePeriodChange(event: any) {
    if (event === 'monthly') {
      this.idlingTime();
      this.getMonthlyData()
      this.getavgFuelCostMonthly()
      this.getWrostDriver()
      this.getexpensiveDrivers()
      this.efficiencyCoach()
    }
    if (event === 'weekly') {
      this.getFuelMileageWeekly()
      this.getavgFuelCostWeekly()
      this.idlingTimeforWeekly()
      this.getWrostDriverweek()
      this.getexpensiveDriversWeek()
      this.efficiencyCoachweek()
    }
    if (event === 'daily') {
      this.getFuelMileageDaily()
      this.getavgFuelCostdaily()
      this.idlingTimeforDaily()
      this.getWrostDriverday()
      this.getexpensiveDriversDay()
      this.efficiencyCoachday()
    }
  }


    // Efficiency Coach

    async efficiencyCoach() {
      this.dashboardservice.getEfficiencyCoach(this.customConsumer, this.fleetIdData, this.groupIdData,"",).subscribe((data: any) => {
        this.riskyCoach = data.slice(0, 6);
        this.riskyCoachAll = data
        this.risckyCoachNodata = data[0].vin
      }, (err) => {
      });
    }

    async efficiencyCoachweek() {
      this.dashboardservice.getEfficiencyweekData(this.customConsumer, this.fleetIdData, this.groupIdData,'').subscribe((data: any) => {
        this.riskyCoach = data.slice(0, 6);
        this.riskyCoachAll = data
        this.risckyCoachNodata = data[0].vin
      }, (err) => {
      });
    }

    async efficiencyCoachday() {
      this.dashboardservice.getEfficiencyDayData(this.customConsumer, this.fleetIdData, this.groupIdData,'').subscribe((data: any) => {
        this.riskyCoach = data.slice(0, 6);
        this.riskyCoachAll = data
        this.risckyCoachNodata = data[0].vin
      }, (err) => {
      });
    }



    async efficiencyCoachFleet() {
      this.dashboardservice.getefficinecyVinMonthly(this.customConsumer,this.fleetIdData,this.groupIdData).subscribe((data: any) => {
        this.riskyCoach = data.slice(0, 5);
        this.riskyCoachAll = data
      }, (err) => {
      });
    }

    largeModal3(driverriskCoaching: any) {
      this.modalService.open(driverriskCoaching, { size: 'xl', centered: true });
    }

  fleetSummaryDownloadReport() {
    this.fleetSumamryTotalData='';
    this.isLoading = true; // Set loading state to true at the start
    this.subscription$.add(
      this.dashboardservice
        .downloadReportFleetSummary(this.selectedPeriod,this.consumer, this.fleetIdData, this.groupIdData)
        .subscribe(
          (res: any) => {
            this.isLoading = false; // Remove loading state when API call completes
            this.isDataNotFound = res?.status === 'UNPROCESSABLE_ENTITY' && res?.message === 'Data Not Found';

            if (this.isDataNotFound) {
              // Set all fields to 0 when no data is found
              this.fleetSumamryTotalData = {
                totalActiveVehicles: 0,
                totalDistanceTravelled: 0,
                totalTripsTaken: 0,
                totalFuelConsumed: 0,
              };
            } else {
              // Set fields based on the response, or default to 0 if not present
              this.fleetSumamryTotalData = {
                totalActiveVehicles: res.fleetLevelStats?.totalActiveVehicles || 0,
                totalDistanceTravelled: res.fleetLevelStats?.totalDistanceTravelled || 0,
                totalTripsTaken: res.fleetLevelStats?.totalTripsTaken || 0,
                totalFuelConsumed: res.fleetLevelStats?.totalFuelConsumed || 0,
              };
            }
          },
          (error) => {
            this.isLoading = false; // Remove loading state on error
            console.error('Error fetching data:', error);
            this.isDataNotFound = true;
            // Set all fields to 0 on error
            this.fleetSumamryTotalData = {
              totalActiveVehicles: 0,
              totalDistanceTravelled: 0,
              totalTripsTaken: 0,
              totalFuelConsumed: 0,
            };
          }
        )
    );
  }
  async monthlyRefuling() {
    this.subscription$.add(
      await this.dashboardservice.getRefulings(this.customConsumer).subscribe((res: any) => {
          this.refulingPoint = res;
          this.updateTime()

        })
    );
  }
  async refulingFleet() {
    await this.dashboardservice.getRefulingleetAll(this.customConsumer,this.fleetIdData, this.groupIdData).subscribe((res: any) => {
      this.refulingPoint = res;
      this.updateTime()
    }, err => {
      ;
    })
  }
  maskVin(vin: string): string {
    if (vin && vin.length >= 3) { // Add a null check for vin
      return '**' + vin.slice(-3);
    } else {
      return vin;
    }
  }

  topfiveWrostMileage(data) {
    let topFiveData;
    let topFiveVINs;
    let topFiveAvgMileageMPG;

    if (data.length === 0) {
      // No data found, use default values
      topFiveData = Array(5).fill({ VIN: "N/A", avgMileageMPG: 0 });
      topFiveVINs = ["N/A", "N/A", "N/A", "N/A", "N/A"];
      topFiveAvgMileageMPG = [0, 0, 0, 0, 0];
    } else {
      // Sort and get top 5 data
      data.sort((a, b) => a.avgMileageMPG - b.avgMileageMPG);
      topFiveData = data.slice(0, 5);
      topFiveVINs = topFiveData.map(item =>
        item?.alias?.length === 17 ? this.maskVin(item.alias) : item.alias
      );
      topFiveAvgMileageMPG = topFiveData.map(item => item.avgMileageMPG);
    }
    this.chartOptionsWrostMileage = {
      series: [
        {
          name: "Worst Mileage (mpg)",
          data: topFiveAvgMileageMPG
        }
      ],
      chart: {
        height: 250,
        type: "bar",

        zoom: {
          enabled: false,
        },
        toolbar:
        {
          show: !1
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 13,
          borderRadiusApplication: 'end',
          barHeight: topFiveAvgMileageMPG.length === 1 ? "15%" : "70%", // Dynamically set bar width for horizontal bars
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
          border: '1px solid red',
        },
      },
      colors: [
        "#FF5050",
        "#FF5050",
        "#FF5050",
        "#FF5050",
        "#FF5050",
      ],
      dataLabels: {
        enabled: false,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: -30,
        formatter: function (val: any, opt: any) {
          return val;
        },
      },
      legend: {
        show: false
      },
      grid: {
        strokeArray: 7,
      },
      yaxis: {

        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
        title: {
          offsetX: 0,
          offsetY: -13,
          text: "VIN",
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
      },
      xaxis: {
        categories: topFiveVINs,
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },

        axisTicks: {
          show: false,
        },
        title: {
          offsetX: -5,
          offsetY: 0,
          text: "Worst Mileage (mpg)",
          style: {
            color: "#AEAEAE",
            fontSize: "11px",
            fontFamily: "Poppins",
            fontWeight: 400,
          },
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
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k mpg" : value + " mpg";
          let color = "#ff0000";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },

    };
  }




  pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  // Idling Chart
  async idlingTime() {
    this.subscription$.add(
      await this.dashboardservice.getIdlingTimes(this.customConsumer, this.fleetIdData, this.groupIdData,'').subscribe((res: any) => {
        this.totalIdlingTime = res;
        let totalSeconds = 0;
        this.totalIdlingTime.forEach(item => {
          if (typeof item.totalIdlingDuration === 'number') {
            totalSeconds += item.totalIdlingDuration;
          }
        });
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        this.totalIdlingDuration = `${this.pad(totalHours)}:${this.pad(totalMinutes)}`;
        this.fuelIdlingMonthlyChart(this.totalIdlingTime);
      }, err => {
      })
    );
  }
  async idlingTimeforFleet() {
    await this.dashboardservice.getIdlingTimefleetAll(this.customConsumer,this.fleetIdData, this.groupIdData).subscribe((res: any) => {
      this.totalIdlingTime = res;
      let totalSeconds = 0; // Initialize totalSeconds outside forEach loop
      this.totalIdlingTime.forEach(item => {
        if (typeof item.totalIdlingDuration === 'number') {
          totalSeconds += item.totalIdlingDuration;
        }
      });
      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      this.totalIdlingDuration = `${this.pad(totalHours)}:${this.pad(totalMinutes)}`; // Convert total seconds to HH:MM format
      this.fuelIdlingMonthlyChart(this.totalIdlingTime);
      ;
    }, err => {
      ;
    })
  }
  async idlingTimeforWeekly() {
    await this.dashboardservice.getIdlingTimeWeek(this.customConsumer, this.fleetIdData,this.groupIdData,'').subscribe((res: any) => {
      this.totalIdlingTime = res;
      let totalSeconds = 0; // Initialize totalSeconds outside forEach loop
      this.totalIdlingTime.forEach(item => {
        if (typeof item.totalIdlingDuration === 'number') {
          totalSeconds += item.totalIdlingDuration;
        }
      });
      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      this.totalIdlingDuration = `${this.pad(totalHours)}:${this.pad(totalMinutes)}`; // Convert total seconds to HH:MM format
      this.idlingTimeChartWeekly(this.totalIdlingTime);
      ;
    }, err => {
      ;
    })
  }
  async idlingTimeforDaily() {
    await this.dashboardservice.getIdlingTimeDay(this.customConsumer, this.fleetIdData,this.groupIdData,'').subscribe((res: any) => {
      this.totalIdlingTime = res;
      let totalSeconds = 0; // Initialize totalSeconds outside forEach loop
      this.totalIdlingTime.forEach(item => {
        if (typeof item.totalIdlingDuration === 'number') {
          totalSeconds += item.totalIdlingDuration;
        }
      });
      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      this.totalIdlingDuration = `${this.pad(totalHours)}:${this.pad(totalMinutes)}`; // Convert total seconds to HH:MM format
      this.idlingTimeChartdaily(this.totalIdlingTime);
      ;
    }, err => {
      ;
    })
  }
  fuelIdlingMonthlyChart(data) {
    // data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    data = data.slice(-5);
    let labelData = [];
    let seriesData = [];
    let seriesDatas = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelData.push(formattedDate);
      const durationInSeconds = item.totalIdlingDuration;
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = durationInSeconds % 60;
      const formattedDuration = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
      seriesData.push(formattedDuration);
      const durationInSecond = (item.totalIdlingDuration / item.totalDuration) * 100;
      const formattedDurations = durationInSecond.toFixed(2);
      seriesDatas.push(formattedDurations);
    });



    this.chartOptionsFuelidling = {
      series: [
        {
          name: "Idling Duration (Hours)",
          type: "bar",
          data: seriesData,
        },
        {
          name: "Idling Trip Duration (%)",
          type: "line",
          data: seriesDatas,
        }
      ],
      chart: {
        height: 250,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
        colors: ['#FF7878', '#9F1D2C', ],
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
        formatter: function (val, opt) {
          if (val > 0) {
            return val;
          } else if (val === 0) {
            return {
              text: ".",
              style: {
                fontSize: '30px',
                fontWeight: 'bold',
              }
            };
          }
        },
      },
      stroke: {
        width: [0, 3],
        curve: "smooth",
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 10,
          columnWidth: 20,
          borderRadiusApplication: 'end',
          distributed: false,
          startingShape: "rounded",
          endingShape:'flat',

          borderWidth: 0,


          dataLabels: {
            position: 'top',
          },

        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "back",
        xaxis: {
          lines: {
            show:false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },

        categories: labelData,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },

      },
      yaxis: [
        {
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) : value;
            }
          },
          title: {
            offsetX: 0,
            offsetY: 70,
            text: "Idling hrs",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return val; // Show the actual value received from the API
              }
            }
          },
        },
        {
          seriesName: "",
          opposite: true,
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },

          labels: {
            show:true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",

            },
            formatter: function (value) {
              return Math.round(value);
            }
          },
          title: {
          offsetX: 0,
          offsetY: 45,
          text: "Idling Percentage",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          }
        },
        },
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {

          var formattedValue =''
          var color = ''
          if(seriesIndex == 0){
            const value = series[seriesIndex][dataPointIndex];
          formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + " hrs" : value + " hrs";
          color = "#FFA0A0";
          }
          else{
            const value = series[seriesIndex][dataPointIndex];
            formattedValue =
              value > 100 ? (value / 100).toFixed(0) + " %" : value + " %";
            color = "#9F1D2C";
          }


          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
      legend: {
        show: false
      },
    };
  }
  idlingTimeChartWeekly(data) {
    let labelFuelCost = [];
    let seriesData = [];
    let seriesDatas = [];

    data.sort((a, b) => {
  // Handle cases where weekStartDate might be undefined or null
  if (!a.weekStartDate) return 1;
  if (!b.weekStartDate) return -1;
  return a.weekStartDate.localeCompare(b.weekStartDate);
});

    data.map((item) => {
      labelFuelCost.push(this.formatDate(item.weekStartDate));
      const durationInSeconds = item.totalIdlingDuration;
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = durationInSeconds % 60;
      const formattedDuration = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
      seriesData.push(formattedDuration);
      const durationInSecond = (item.totalIdlingDuration / item.totalDuration) * 100;
      const formattedDurations = durationInSecond.toFixed(2);
      seriesDatas.push(formattedDurations);
    });
    this.chartOptionsFuelidling = {
      series: [
        {
          name: "Idling Duration (Hours)",
          type: "bar",
          data: seriesData,
        },
        {
          name: "Idling Trip Duration (%)",
          type: "line",
          data: seriesDatas,
        }
      ],
      chart: {
        height: 250,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
        colors: ['#FF7878', '#9F1D2C', ],
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
        formatter: function (val, opt) {
          if (val > 0) {
            return val;
          } else if (val === 0) {
            return {
              text: ".",
              style: {
                fontSize: '30px',
                fontWeight: 'bold',
              }
            };
          }
        },
      },
      stroke: {
        width: [0, 3],
        curve: "smooth",
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 10,
          columnWidth: 20,
          borderRadiusApplication: 'end',
          distributed: false,
          startingShape: "rounded",
          endingShape:'flat',

          borderWidth: 0,


          dataLabels: {
            position: 'top',
          },

        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "back",
        xaxis: {
          lines: {
            show:false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },

        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },

      },
      yaxis: [
        {
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) : value;
            }
          },
          title: {
            offsetX: 0,
            offsetY: 70,
            text: "Idling hrs ",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return val; // Show the actual value received from the API
              }
            }
          },
        },
        {
          seriesName: "",
          opposite: true,
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },

          labels: {
            show:true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",

            },
            formatter: function (value) {
              return Math.round(value);
            }
          },
          title: {
          offsetX: 0,
          offsetY: 45,
          text: "Idling Percentage",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          }
        },
        },
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {

          var formattedValue =''
          var color = ''
          if(seriesIndex == 0){
            const value = series[seriesIndex][dataPointIndex];
          formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + " hrs" : value + " hrs";
          color = "#FFA0A0";
          }
          else{
            const value = series[seriesIndex][dataPointIndex];
            formattedValue =
              value > 100 ? (value / 100).toFixed(0) + " %" : value + " %";
            color = "#9F1D2C";
          }


          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
      legend: {
        show: false
      },
    };
  }
  idlingTimeChartdaily(data) {
    let labelData = [];
    let seriesData = [];
    let seriesDatas = [];
    data.sort((a, b) => a.localDate.localeCompare(b.localDate));
    data.map((item) => {
      labelData.push(item.localDate);
      const durationInSeconds = item.totalIdlingDuration;
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = durationInSeconds % 60;
      const formattedDuration = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
      seriesData.push(formattedDuration);
      const durationInSecond = (item.totalIdlingDuration / item.totalDuration) * 100;
      const formattedDurations = durationInSecond.toFixed(2);
      seriesDatas.push(formattedDurations);
    });

    this.chartOptionsFuelidling = {
      series: [
        {
          name: "Idling Duration (Hours)",
          type: "bar",
          data: seriesData,
        },
        {
          name: "Idling Trip Duration (%)",
          type: "line",
          data: seriesDatas,
        }
      ],
      chart: {
        height: 250,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
        colors: ['#FF7878', '#9F1D2C', ],
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
        formatter: function (val, opt) {
          if (val > 0) {
            return val;
          } else if (val === 0) {
            return {
              text: ".",
              style: {
                fontSize: '30px',
                fontWeight: 'bold',
              }
            };
          }
        },
      },
      stroke: {
        width: [0, 3],
        curve: "smooth",
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 10,
          columnWidth: 20,
          borderRadiusApplication: 'end',
          distributed: false,
          startingShape: "rounded",
          endingShape:'flat',

          borderWidth: 0,


          dataLabels: {
            position: 'top',
          },

        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "back",
        xaxis: {
          lines: {
            show:false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },

        categories: labelData,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },

      },
      yaxis: [
        {
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) : value;
            }
          },
          title: {
            offsetX: 0,
            offsetY: 70,
            text: "Idling hrs",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return val; // Show the actual value received from the API
              }
            }
          },
        },
        {
          seriesName: "",
          opposite: true,
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },

          labels: {
            show:true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",

            },
            formatter: function (value) {
              return Math.round(value);
            }
          },
          title: {
          offsetX: 0,
          offsetY: 45,
          text: "Idling Percentage",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          }
        },
        },
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {

          var formattedValue =''
          var color = ''
          if(seriesIndex == 0){
            const value = series[seriesIndex][dataPointIndex];
          formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + " hrs" : value + " hrs";
          color = "#FFA0A0";
          }
          else{
            const value = series[seriesIndex][dataPointIndex];
            formattedValue =
              value > 100 ? (value / 100).toFixed(0) + " %" : value + " %";
            color = "#9F1D2C";
          }


          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
      legend: {
        show: false
      },
    };
  }
  // Fuel Cost Chart
  async getavgFuelCostMonthly() {
    this.subscription$.add(
      await this.dashboardservice.getAvgFuelCostFleet(this.customConsumer, this.fleetIdData,this.groupIdData,'').subscribe((res: any) => {
        let avgFuelCost = res
        this.fuelcostMonthlyChart(avgFuelCost);
      }, err => {
      })
    )
  }
  async getavgFuelCostMonthlyFleet() {
    this.subscription$.add(
      await this.dashboardservice.getAvgFuelCostFleet(this.customConsumer, this.fleetIdData,this.groupIdData,'').subscribe((res: any) => {
        let avgFuelCost = res
        this.fuelcostMonthlyChart(avgFuelCost);
        // this.averageFuekCost(avgFuelCost)
      }, err => {
      })
    )
  }
  async getavgFuelCostWeekly() {
    this.subscription$.add(
      await this.dashboardservice.getMonthAvgCost(this.customConsumer, this.fleetIdData,this.groupIdData, "",).subscribe((res: any) => {
        let avgFuelCost = res
        this.averageFuelCostWeekly(avgFuelCost)
      }, err => {
      })
    )
  }
  async getavgFuelCostdaily() {
    this.subscription$.add(
      await this.dashboardservice.getdailyAvgCost(this.customConsumer,  this.fleetIdData,this.groupIdData,"",).subscribe((res: any) => {
        let avgFuelCost = res
        this.averageFuelCostdaily(avgFuelCost)
      }, err => {
      })
    )
  }
  fuelcostMonthlyChart(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    data = data.slice(-5);
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    let seriesDataavgCost = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate =
        new Date(year, month - 1, 1).toLocaleString("default", {
          month: "short",
        }) +
        " '" +
        year.slice(2);
      labelFuelCost.push(formattedDate);
        seriesDataFuelCost.push(item.fuelConsumedCost.toFixed(2));
        seriesDataavgCost.push(item.avgFuelCostPerMiles.toFixed(2));
    });
    const maxFuelCost = Math.max(...seriesDataFuelCost);

let yAxisMax;
if (maxFuelCost <= 10000) {
  yAxisMax = 10000;
} else if (maxFuelCost > 10000 && maxFuelCost <= 20000) {
  yAxisMax = 20000;
} else if (maxFuelCost > 20000 && maxFuelCost <= 30000) {
  yAxisMax = 30000;
} else if (maxFuelCost > 30000 && maxFuelCost <= 40000) {
  yAxisMax = 40000;
}else if (maxFuelCost > 40000 && maxFuelCost <= 50000) {
  yAxisMax = 50000;
}else if (maxFuelCost > 50000 && maxFuelCost <= 60000) {
  yAxisMax = 60000;
}else if (maxFuelCost > 60000 && maxFuelCost <= 70000) {
  yAxisMax = 70000;
}
else if (maxFuelCost > 70000 && maxFuelCost <= 80000) {
  yAxisMax = 80000;
}
else if (maxFuelCost > 80000 && maxFuelCost <= 90000) {
  yAxisMax = 90000;
}
else if (maxFuelCost > 90000 && maxFuelCost <= 100000) {
  yAxisMax = 100000;
}
 else if (maxFuelCost > 100000 && maxFuelCost <= 130000) {
  yAxisMax = 130000;
} else {
  yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
}
    this.chartOptionsFuelCost = {
      series: [
        {
          name: "Fuel Consumed cost",
          type: "bar",
          data: seriesDataFuelCost,
        },
        {
          name: "Avg Fuel Cost per miles",
          type: "line",
          data: seriesDataavgCost,
        }
      ],
      chart: {
        height: 250,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
        colors: ['#65EBBE', '#2CA87F', ],
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
        formatter: function (val, opt) {
          if (val > 0) {
            return val;
          } else if (val === 0) {
            return {
              text: "",
              style: {
                fontSize: '30px',
                fontWeight: 'bold',
              }
            };
          }
        },
      },
      stroke: {
        width: [0, 3],
        curve: "smooth",
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 10,
          columnWidth: 20,
          borderRadiusApplication: 'end',
          distributed: false,
          startingShape: "rounded",
          endingShape:'flat',

          borderWidth: 0,


          dataLabels: {
            position: 'top',
          },

        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "back",
        xaxis: {
          lines: {
            show:false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },

      },
      yaxis: [
        {
          axisTicks: {
            show: false
          },
          min:0,
          max:yAxisMax,
          tickAmount:6,
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
            }
          },
          title: {
            offsetX: 0,
            offsetY: 60,
            text: "Fuel cost ($)",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return val; // Show the actual value received from the API
              }
            }
          },
        },
        {
          seriesName: "",
          opposite: true,
          title: {
            offsetX: 0,
            offsetY: 45,
            text: "Fuel Cost Per Miles ($)",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show:true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",

            },
            // formatter: function (value) {
            //   return Math.round(value);
            // }
          },
        },
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {

          var formattedValue =''
          var color = ''
          if(seriesIndex == 0){
            const value = series[seriesIndex][dataPointIndex];
          formattedValue =
            value > 1000 ? '$' + (value / 1000).toFixed(0) + "k" : '$' + value + "";
          color = "#87E0C3";
          }
          else{
            const value = series[seriesIndex][dataPointIndex];
            formattedValue =
              value > 1000 ? '$' + (value / 1000).toFixed(0) + "k" : '$' + value + "";
            color = "#2CA87F";
          }


          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
        position: 'top',
      },
    };
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-indexed month, so add 1
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}-${day}-${year}`;
  }
  averageFuelCostWeekly(data) {
    data.sort((a, b) => {
  // Handle cases where weekStartDate might be undefined or null
  if (!a.weekStartDate) return 1;
  if (!b.weekStartDate) return -1;
  return a.weekStartDate.localeCompare(b.weekStartDate);
});
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    let seriesDataavgCost = []
    data.map((item) => {
      labelFuelCost.push(this.formatDate(item.weekStartDate));
      seriesDataFuelCost.push(item.fuelConsumedCost.toFixed(2));
      seriesDataavgCost.push(item.avgFuelCostPerMiles.toFixed(2));
    });
    const maxFuelCost = Math.max(...seriesDataFuelCost);
    let yAxisMax;
    if (maxFuelCost <= 6) {
      yAxisMax = 12;
    }
    else if (maxFuelCost > 12 && maxFuelCost <= 72) {
      yAxisMax = 72;
    }
    else if (maxFuelCost > 72 && maxFuelCost <= 144) {
      yAxisMax = 144;
    }
    else if (maxFuelCost > 144 && maxFuelCost <= 288) {
      yAxisMax = 288;
    }
    else if (maxFuelCost > 288 && maxFuelCost <= 576) {
      yAxisMax = 576;
    }
    else if (maxFuelCost > 576 && maxFuelCost <= 1152) {
      yAxisMax = 1152;
    }
    else if (maxFuelCost > 1152 && maxFuelCost <= 10000) {
      yAxisMax = 10000;
    }else if (maxFuelCost > 10000 && maxFuelCost <= 60000) {
      yAxisMax = 60000;
    }else if (maxFuelCost > 500000 && maxFuelCost <= 1000000) {
      yAxisMax = 1000000;
    }else {
      yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
    }
    this.chartOptionsFuelCost = {
      series: [
        {
          name: "Fuel Consumed cost",
          type: "bar",
          data: seriesDataFuelCost,
        },
        {
          name: "Avg Fuel Cost per miles",
          type: "line",
          data: seriesDataavgCost,
        }
      ],
      chart: {
        height: 250,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
        colors: ['#65EBBE', '#2CA87F', ],
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
        formatter: function (val, opt) {
          if (val > 0) {
            return val;
          } else if (val === 0) {
            return {
              text: "",
              style: {
                fontSize: '30px',
                fontWeight: 'bold',
              }
            };
          }
        },
      },
      stroke: {
        width: [0, 3],
        curve: "smooth",
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 10,
          columnWidth: 20,
          borderRadiusApplication: 'end',
          distributed: false,
          startingShape: "rounded",
          endingShape:'flat',

          borderWidth: 0,


          dataLabels: {
            position: 'top',
          },

        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "back",
        xaxis: {
          lines: {
            show:false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },

      },
      yaxis: [
        {
          axisTicks: {
            show: false
          },
          min:0,
          max:yAxisMax,
          tickAmount:6,
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
            }
          },
          title: {
            offsetX: 0,
            offsetY: 60,
            text: "Fuel cost ($)",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return val; // Show the actual value received from the API
              }
            }
          },
        },
        {
          seriesName: "",
          opposite: true,
          min:0,
          max:0.60,
          tickAmount:6,
          title: {
            offsetX: 0,
            offsetY: 45,
            text: "Fuel Cost Per Miles ($)",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show:true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",

            },
            // formatter: function (value) {
            //   return Math.round(value);
            // }
          },
        },
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {

          var formattedValue =''
          var color = ''
          if(seriesIndex == 0){
            const value = series[seriesIndex][dataPointIndex];
          formattedValue =
            value > 1000 ? '$' + (value / 1000).toFixed(0) + "k" : '$' + value + "";
          color = "#87E0C3";
          }
          else{
            const value = series[seriesIndex][dataPointIndex];
            formattedValue =
              value > 1000 ? '$' + (value / 1000).toFixed(0) + "k" : '$' + value + "";
            color = "#2CA87F";
          }


          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
        position: 'top',
      },
    };
  }
  averageFuelCostdaily(data) {
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    let seriesDataavgCost = []
    data.sort((a, b) => a.localDate.localeCompare(b.localDate));
    data.map((item) => {
      labelFuelCost.push(item.localDate);
      seriesDataFuelCost.push(item.fuelConsumedCost.toFixed(2));
      seriesDataavgCost.push(item.avgFuelCostPerMiles.toFixed(2));
    });
    const maxFuelCost = Math.max(...seriesDataFuelCost);

    let yAxisMax;
    if (maxFuelCost <= 6) {
      yAxisMax = 12;
    }
    else if (maxFuelCost > 12 && maxFuelCost <= 72) {
      yAxisMax = 72;
    }
    else if (maxFuelCost > 72 && maxFuelCost <= 144) {
      yAxisMax = 144;
    }
    else if (maxFuelCost > 144 && maxFuelCost <= 288) {
      yAxisMax = 288;
    }
    else if (maxFuelCost > 288 && maxFuelCost <= 576) {
      yAxisMax = 576;
    }
    else if (maxFuelCost > 576 && maxFuelCost <= 1152) {
      yAxisMax = 1152;
    }
    else if (maxFuelCost > 1152 && maxFuelCost <= 10000) {
      yAxisMax = 10000;
    }
    else if (maxFuelCost > 10000 && maxFuelCost <= 60000) {
      yAxisMax = 100000;
    }else if (maxFuelCost > 100000 && maxFuelCost <= 500000) {
      yAxisMax = 500000;
    }else if (maxFuelCost > 500000 && maxFuelCost <= 1000000) {
      yAxisMax = 1000000;
    }else {
      yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
    }
    yAxisMax = parseFloat(yAxisMax.toFixed(0));
    this.chartOptionsFuelCost = {
      series: [
        {
          name: "Fuel Consumed cost",
          type: "bar",
          data: seriesDataFuelCost,
        },
        {
          name: "Avg Fuel Cost per miles",
          type: "line",
          data: seriesDataavgCost,
        }
      ],
      chart: {
        height: 250,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
        colors: ['#65EBBE', '#2CA87F', ],
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
        formatter: function (val, opt) {
          if (val > 0) {
            return val;
          } else if (val === 0) {
            return {
              text: "",
              style: {
                fontSize: '30px',
                fontWeight: 'bold',
              }
            };
          }
        },
      },
      stroke: {
        width: [0, 3],
        curve: "smooth",
      },
      markers: {
        size: 3,
        hover: {
          size: 3
        }
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 10,
          columnWidth: 20,
          borderRadiusApplication: 'end',
          distributed: false,
          startingShape: "rounded",
          endingShape:'flat',

          borderWidth: 0,


          dataLabels: {
            position: 'top',
          },

        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "back",
        xaxis: {
          lines: {
            show:false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },

      },
      yaxis: [
        {
          axisTicks: {
            show: false
          },
          min:0,
          max:yAxisMax,
          tickAmount:6,
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
            }
          },
          title: {
            offsetX: 0,
            offsetY: 60,
            text: "Fuel cost ($)",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          tooltip: {
            y: {
              formatter: function (val) {
                return val; // Show the actual value received from the API
              }
            }
          },
        },
        {
          seriesName: "",
          opposite: true,
          min:0,
          max:0.60,
          tickAmount:6,
          axisTicks: {
            show: false
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          title: {
            offsetX: 0,
            offsetY: 45,
            text: "Fuel Cost Per Miles ($)",
            style: {
              color: "#AEAEAE",
              fontSize: "12px",
              fontFamily: "Poppins",
              fontWeight: 600,
            }
          },
          labels: {
            show:true,
            style: {
              colors: "#727272",
              fontSize: "10px",
              fontWeight: 400,
              fontFamily: "Poppins",

            },
            // formatter: function (value) {
            //   return Math.round(value);
            // }
          },
        },
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {

          var formattedValue =''
          var color = ''
          if(seriesIndex == 0){
            const value = series[seriesIndex][dataPointIndex];
          formattedValue =
            value > 1000 ? '$' + (value / 1000).toFixed(0) + "k" : '$' + value + "";
          color = "#87E0C3";
          }
          else{
            const value = series[seriesIndex][dataPointIndex];
            formattedValue =
              value > 1000 ? '$' + (value / 1000).toFixed(0) + "k" : '$' + value + "";
            color = "#2CA87F";
          }


          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
        position: 'top',
      },
    };
  }

  // Fuel Consumed and Mileage chart
  async getMonthlyData() {
    this.subscription$.add(
      await this.dashboardservice.getFuelCostPerMonth(this.customConsumer, this.fleetIdData,this.groupIdData, '').subscribe(
        (res: any) => {
          let fuelMileageMonth = res;
          this.fuelConsumedMontylyChart(fuelMileageMonth);
          this.fuelMileageMontylyChart(fuelMileageMonth);

          // this.fuelIdlingMonthlyChart(fuelMileageMonth);
        },
        (err) => {}
      )
    );
  }
  async getMonthlyFleetData() {
    this.subscription$.add(
      await this.dashboardservice
        .getFuelConsumedMonthlys(this.customConsumer, this.fleetIdData)
        .subscribe(
          (res: any) => {
            let fuelMileageMonth = res;

            this.fuelConsumedMontylyChart(fuelMileageMonth);
            this.fuelMileageMontylyChart(fuelMileageMonth);

            // this.fuelIdlingMonthlyChart(fuelMileageMonth);
          },
          (err) => {}
        )
    );
  }
  async getFuelMileageWeekly() {
    this.subscription$.add(
      await this.dashboardservice.getFuelMileagandConsumedWeeks(this.customConsumer, this.fleetIdData,'').subscribe(
        (res: any) => {
          let fuelMileageWeek = res;
          this.fuelConsumedWeeklyChart(fuelMileageWeek);
          this.fuelMileageWeeklyChart(fuelMileageWeek);
        },
        err => {
        }
      )
    );
  }
  async getFuelMileageDaily() {
    this.subscription$.add(
      await this.dashboardservice.getFuelMileagandConsumedDays(this.customConsumer, this.fleetIdData,'').subscribe(
        (res: any) => {
          let fuelMileageDaily = res;
          this.fuelConsumedDailyChart(fuelMileageDaily);
          this.fuelMileageDailyChart(fuelMileageDaily);
        },
        err => {
        }
      )
    );
  }
  fuelConsumedMontylyChart(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    data = data.slice(-5);
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate =
        new Date(year, month - 1, 1).toLocaleString("default", {
          month: "short",
        }) +
        " '" +
        year.slice(2);
      labelFuelCost.push(formattedDate);
      if (
        item.totalFuelConsumed !== null &&
        item.totalFuelConsumed !== undefined
      ) {
        seriesDataFuelCost.push(item.totalFuelConsumed.toFixed(2));
      } else {
        seriesDataFuelCost.push(null); // or any other placeholder value you want to use
      }
    });
    // seriesDataFuelCost  = seriesDataFuelCost.slice(-3)
    // labelFuelCost = labe;
    const maxFuelCost = Math.max(...seriesDataFuelCost);

    let yAxisMax;
    if (maxFuelCost <= 90) {
      yAxisMax = 90;
    }  else if (maxFuelCost > 90 && maxFuelCost <= 180) {
      yAxisMax = 180;
    } else if (maxFuelCost > 180 && maxFuelCost <= 540) {
      yAxisMax = 540;
    }else if (maxFuelCost > 540 && maxFuelCost <= 1000) {
      yAxisMax = 1000;
    }else if (maxFuelCost > 1000 && maxFuelCost <= 6000) {
      yAxisMax = 6000;
    }else if (maxFuelCost > 6000 && maxFuelCost <= 12000) {
      yAxisMax = 12000;
    }else if (maxFuelCost > 12000 && maxFuelCost <= 25000) {
      yAxisMax = 25000;
    } else if (maxFuelCost > 25000 && maxFuelCost <= 50000) {
      yAxisMax = 50000;
    } else if (maxFuelCost > 50000 && maxFuelCost <= 75000) {
      yAxisMax = 75000;
    } else if (maxFuelCost > 75000 && maxFuelCost <= 100000) {
      yAxisMax = 100000;
    }else if (maxFuelCost > 10000 && maxFuelCost <= 125000) {
      yAxisMax = 125000;
    }else if (maxFuelCost > 125000 && maxFuelCost <= 150000) {
      yAxisMax = 150000;
    }else if (maxFuelCost > 150000 && maxFuelCost <= 175000) {
      yAxisMax = 175000;
    }
    else if (maxFuelCost > 175000 && maxFuelCost <= 200000) {
      yAxisMax = 200000;
    } else {
      yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
    }
    this.chartOptionsFuelConsumed = {
      series: [
        {
          name: "Fuel Consumed (gal)",
          data: seriesDataFuelCost,
        },
      ],
      chart: {
        height: 290,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: 20,
          distributed: true,
          startingShape: "rounded",
          borderRadiusApplication: 'end',
          dataLabels: {
            position: "top",
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: ["#6489DB"],
      dataLabels: {
        enabled: false,
        style: {
          colors: ["#6C757E"],
          fontSize: "12",
          fontWeight: "100",
        },
        offsetY: -30,
      },
      legend: {
        show: false,
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "front",
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
      },
      yaxis: {
        min:0,
        max:yAxisMax,
        tickAmount:6,
        lines: {
          show: true,
        },
        title: {
          offsetX: 0,
          offsetY: 35,
          text: "Fuel Consumed (gal)",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          },
        },
        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + "k" : value;
          },
        },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k gal" : value + " gal";
          let color = "#8BB0FF";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }
  fuelMileageMontylyChart(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    data = data.slice(-5);
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate =
        new Date(year, month - 1, 1).toLocaleString("default", {
          month: "short",
        }) +
        " '" +
        year.slice(2);
      labelFuelCost.push(formattedDate);
      if (
        item.averageMileageMPG !== null &&
        item.averageMileageMPG !== undefined
      ) {
        seriesDataFuelCost.push(item.averageMileageMPG.toFixed(2));
      } else {
        seriesDataFuelCost.push(null); // or any other placeholder value you want to use
      }
    });

    this.chartOptionsFleetMileage = {
      series: [
        {
          name: "Distance driven in mile",
          data: seriesDataFuelCost,
        },
      ],
      chart: {
        height: 290,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: 20,
          distributed: true,
          startingShape: "rounded",
          borderRadiusApplication: 'end',
          dataLabels: {
            position: "top",
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: ["#FA751A"],
      dataLabels: {
        enabled: false,
        style: {
          colors: ["#6C757E"],
          fontSize: "12",
          fontWeight: "100",
        },
        offsetY: -30,
      },
      legend: {
        show: false,
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "front",
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
        title: {
          offsetX: 0,
          offsetY: 55,
          text: "Mileage (mpg)",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          },
        },
        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + "k" : value;
          },
        },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k mpg" : value + " mpg";
          let color = "#FFA263";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }
  fuelConsumedWeeklyChart(data) {
    data.sort((a, b) => {
      // Handle cases where weekStartDate might be undefined or null
      if (!a.weekStartDate) return 1;
      if (!b.weekStartDate) return -1;
      return a.weekStartDate.localeCompare(b.weekStartDate);
    });
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    data.map((item) => {
      labelFuelCost.push(this.formatDate(item.weekStartDate));
      if (item.totalFuelConsumed !== null && item.totalFuelConsumed !== undefined) {
        seriesDataFuelCost.push(item.totalFuelConsumed.toFixed(2));
      } else {
        seriesDataFuelCost.push(null); // or any other placeholder value you want to use
      }
    });
    const maxFuelCost = Math.max(...seriesDataFuelCost);

    let yAxisMax;
    if (maxFuelCost <= 6000) {
      yAxisMax = 6000;
    }  else if (maxFuelCost > 6000 && maxFuelCost <= 25000) {
      yAxisMax = 25000;
    } else if (maxFuelCost > 25000 && maxFuelCost <= 50000) {
      yAxisMax = 50000;
    } else if (maxFuelCost > 50000 && maxFuelCost <= 75000) {
      yAxisMax = 75000;
    } else if (maxFuelCost > 75000 && maxFuelCost <= 100000) {
      yAxisMax = 100000;
    }else if (maxFuelCost > 10000 && maxFuelCost <= 125000) {
      yAxisMax = 125000;
    }else if (maxFuelCost > 125000 && maxFuelCost <= 150000) {
      yAxisMax = 150000;
    }else if (maxFuelCost > 150000 && maxFuelCost <= 175000) {
      yAxisMax = 175000;
    }
    else if (maxFuelCost > 175000 && maxFuelCost <= 200000) {
      yAxisMax = 200000;
    } else {
      yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
    }
    this.chartOptionsFuelConsumed = {
      series: [
        {
          name: "Fuel Consumed (gal)",
          data: seriesDataFuelCost,
        },
      ],
      chart: {
        height: 290,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: 20,
          distributed: true,
          startingShape: "rounded",
          borderRadiusApplication: 'end',
          dataLabels: {
            position: "top",
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: ["#6489DB"],
      dataLabels: {
        enabled: false,
        style: {
          colors: ["#6C757E"],
          fontSize: "12",
          fontWeight: "100",
        },
        offsetY: -30,
      },
      legend: {
        show: false,
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "front",
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
      },
      yaxis: {
        min:0,
        max:yAxisMax,
        tickAmount:6,
        lines: {
          show: true,
        },
        title: {
          offsetX: 0,
          offsetY: 35,
          text: "Fuel Consumed (gal)",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          },
        },
        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + "k" : value;
          },
        },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k gal" : value + " gal";
          let color = "#8BB0FF";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }
  fuelMileageWeeklyChart(data) {
    data.sort((a, b) => {
      // Handle cases where weekStartDate might be undefined or null
      if (!a.weekStartDate) return 1;
      if (!b.weekStartDate) return -1;
      return a.weekStartDate.localeCompare(b.weekStartDate);
    });
    let labelFuelCost = [];
    let seriesDataFuelCost = [];

    data.map((item) => {
      labelFuelCost.push(this.formatDate(item.weekStartDate));
     if (item.averageMileageMPG !== null && item.averageMileageMPG !== undefined) {
        seriesDataFuelCost.push(item.averageMileageMPG.toFixed(2));
      }
      else {
        seriesDataFuelCost.push(null); // or any other placeholder value you want to use
      }
    });
    const maxFuelCost = Math.max(...seriesDataFuelCost);

    let yAxisMax;
    if (maxFuelCost <= 6) {
      yAxisMax = 6;
    }  else if (maxFuelCost > 6 && maxFuelCost <= 10) {
      yAxisMax = 10;
    } else if (maxFuelCost > 10 && maxFuelCost <= 16) {
      yAxisMax = 16;
    } else if (maxFuelCost > 16 && maxFuelCost <= 30) {
      yAxisMax = 30;
    }else {
      yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
    }
    this.chartOptionsFleetMileage = {
      series: [
        {
          name: "Distance driven in mile",
          data: seriesDataFuelCost,
        },
      ],
      chart: {
        height: 290,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: 20,
          distributed: true,
          startingShape: "rounded",
          borderRadiusApplication: 'end',
          dataLabels: {
            position: "top",
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: ["#FA751A"],
      dataLabels: {
        enabled: false,
        style: {
          colors: ["#6C757E"],
          fontSize: "12",
          fontWeight: "100",
        },
        offsetY: -30,
      },
      legend: {
        show: false,
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "front",
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
        min:0,
        max:yAxisMax,
        tickAmount:6,
        title: {
          offsetX: 0,
          offsetY: 55,
          text: "Mileage (mpg)",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          },
        },
        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + "k" : value;
          },
        },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k mpg" : value + " mpg";
          let color = "#FFA263";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }
  fuelConsumedDailyChart(data) {
    // data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    data.sort((a, b) => a.date.localeCompare(b.date));
    data.map((item) => {
      labelFuelCost.push(item.date);
      if (item.totalFuelConsumed !== null && item.totalFuelConsumed !== undefined) {
        seriesDataFuelCost.push(item.totalFuelConsumed.toFixed(2));
      } else {
        seriesDataFuelCost.push(null); // or any other placeholder value you want to use
      }
    });
    const maxFuelCost = Math.max(...seriesDataFuelCost);

    let yAxisMax;
    if (maxFuelCost <= 6000) {
      yAxisMax = 6000;
    }  else if (maxFuelCost > 6000 && maxFuelCost <= 25000) {
      yAxisMax = 25000;
    } else if (maxFuelCost > 25000 && maxFuelCost <= 50000) {
      yAxisMax = 50000;
    } else if (maxFuelCost > 50000 && maxFuelCost <= 75000) {
      yAxisMax = 75000;
    } else if (maxFuelCost > 75000 && maxFuelCost <= 100000) {
      yAxisMax = 100000;
    }else if (maxFuelCost > 10000 && maxFuelCost <= 125000) {
      yAxisMax = 125000;
    }else if (maxFuelCost > 125000 && maxFuelCost <= 150000) {
      yAxisMax = 150000;
    }else if (maxFuelCost > 150000 && maxFuelCost <= 175000) {
      yAxisMax = 175000;
    }
    else if (maxFuelCost > 175000 && maxFuelCost <= 200000) {
      yAxisMax = 200000;
    } else {
      yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
    }
    this.chartOptionsFuelConsumed = {
      series: [
        {
          name: "Fuel Consumed (gal)",
          data: seriesDataFuelCost,
        },
      ],
      chart: {
        height: 290,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: 20,
          distributed: true,
          startingShape: "rounded",
          borderRadiusApplication: 'end',
          dataLabels: {
            position: "top",
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: ["#6489DB"],
      dataLabels: {
        enabled: false,
        style: {
          colors: ["#6C757E"],
          fontSize: "12",
          fontWeight: "100",
        },
        offsetY: -30,
      },
      legend: {
        show: false,
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "front",
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
      },
      yaxis: {
        min:0,
        max:yAxisMax,
        tickAmount:6,
        lines: {
          show: true,
        },
        title: {
          offsetX: 0,
          offsetY: 35,
          text: "Fuel Consumed (gal)",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          },
        },
        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + "k" : value;
          },
        },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k gal" : value + " gal";
          let color = "#8BB0FF";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }
  fuelMileageDailyChart(data) {
    let labelFuelCost = [];
    let seriesDataFuelCost = [];
    let SeriesidelMileage = []
    data.sort((a, b) => a.date.localeCompare(b.date));
    data.map((item) => {
      labelFuelCost.push(item.date);
      if (item.averageMileageMPG !== null && item.averageMileageMPG !== undefined) {
        seriesDataFuelCost.push(item.averageMileageMPG.toFixed(2));
      }
    });
    const maxFuelCost = Math.max(...seriesDataFuelCost);

    let yAxisMax;
    if (maxFuelCost <= 6) {
      yAxisMax = 6;
    }  else if (maxFuelCost > 6 && maxFuelCost <= 10) {
      yAxisMax = 10;
    } else if (maxFuelCost > 10 && maxFuelCost <= 16) {
      yAxisMax = 16;
    } else if (maxFuelCost > 16 && maxFuelCost <= 30) {
      yAxisMax = 30;
    }else {
      yAxisMax = maxFuelCost;  // Use the actual maximum if none of the above conditions apply
    }
    this.chartOptionsFleetMileage = {
      series: [
        {
          name: "Distance driven in mile",
          data: seriesDataFuelCost,
        },
      ],
      chart: {
        height: 290,
        type: "bar",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: !1,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: 20,
          distributed: true,
          startingShape: "rounded",
          borderRadiusApplication: 'end',
          dataLabels: {
            position: "top",
          },
          colors: {
            backgroundBarRadius: 9,
            backgroundBarOpacity: 1,
          },
        },
      },
      colors: ["#FA751A"],
      dataLabels: {
        enabled: false,
        style: {
          colors: ["#6C757E"],
          fontSize: "12",
          fontWeight: "100",
        },
        offsetY: -30,
      },
      legend: {
        show: false,
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 0,
            borderColor: "#C4C4C4",
            fillColor: "#c2c2c2",
            opacity: 0.8,
            offsetX: 0,
            offsetY: -237,
          },
        ],
      },
      grid: {
        show: true,
        borderColor: "#C3C3C3",
        strokeDashArray: 0,
        position: "front",
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
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
        },
        axisTicks: {
          show: false,
        },
        categories: labelFuelCost,
        labels: {
          show: true,
          style: {
            colors: "#989696",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
        min:0,
        max:yAxisMax,
        tickAmount:6,
        title: {
          offsetX: 0,
          offsetY: 55,
          text: "Mileage (mpg)",
          style: {
            color: "#AEAEAE",
            fontSize: "12px",
            fontFamily: "Poppins",
            fontWeight: 600,
          },
        },
        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + "k" : value;
          },
        },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k mpg" : value + " mpg";
          let color = "#FFA263";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }
  selectedConsumerName: string = '';
  selectedConsumer: any;
  contractStartDate: string | null = null;

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
        "Forward thinking GPS", "Geo Toll", "Matrack",
        "Geico", "Test fleet", "Rockingham", "Axiom", "GeoToll",
      ]);

      this.consumerList = this.consumerList.filter(item => !excludedConsumers.has(item.name));

      // Sort consumer names
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
    }
  }

  async selectConsumer() {
    await this.selectConsumers();
    await this.updateDasboard();
    await this.getavgFuelCostMonthly();
    if (this.customConsumer) {
      const normalizedConsumer = this.consumer.trim().toLowerCase();
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
  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
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
  vinwiseReportDownload(vinWiseRefuling){
    this.selectVinList()
    const modalRef = this.modalService.open(vinWiseRefuling, {
      size: 'sm',
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

  selectVinList() {
         this.subscription$.add(
        this.dashboardservice.getAllVinList( this.customConsumer,this.fleetIdData).subscribe((res: any) => {
          this.vinList = res?.vinAliasList
        }))
  }
  dataDownloadOnVinChange(format: 'csv' | 'excel') {
    //   const startDate = moment(this.fromDate).format('YYYY-MM-DD');
    // const endDate = moment(this.toDate).format('YYYY-MM-DD');
    // startDate, endDate

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
    const vinDigits = this.getLastThreeDigitsOfVin(data);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `FuelRefuelingCost-${vinDigits}.csv`);
    a.click();
}
convertToCSVforDownloadVinRefuling(objArray: any): string {
  const csvHeader = 'VIN, Vehicle Name,Time of Refueling (Start Time),Refueling Location, Odometer, Refueling Amount (gal), Cost Per Mile ($),Refueling Cost ($)\r\n';
  let csvString = csvHeader;
  objArray.forEach(item => {
    const dateTimeUTC = moment.utc(item.dateTime);
       const formattedDate = dateTimeUTC.tz(this.selectedTimezone).format('MMM D, YYYY');
       const formattedTime = dateTimeUTC.tz(this.selectedTimezone).format('HH:mm');
       const timeOfRefueling = `${formattedDate} ${formattedTime}`;
       const row = [
         item.vin,
         item.alias,
         `"${timeOfRefueling}"`,
      `"${item.address.replace(/"/g, '""')}"`,
      item.odometer,
      item.amtFuelRefuelled.toFixed(2),
      item.costPerMile.toFixed(2),
      item.refuelCost.toFixed(2)
    ].join(',');
    csvString += row + '\r\n';
  });
  return csvString;
}

maskVins(vin: string): string {
  if (vin && vin.length >= 3) { // Add a null check for vin
    return '***' + vin.slice(-3);
  } else {
    return vin;
  }
}
downloadExcel(data: any) {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VIN Data');
    XLSX.writeFile(wb, 'vin_data.xlsx');
}
  // Worst Five Mileage Driver
  async getWrostDriver() {
    await this.dashboardservice.getWrostMileage(this.customConsumer,this.fleetIdData,this.groupIdData,"",).subscribe((data: any) => {
      this.wrostDriver = data
      this.wrostDriverNull = data.length > 0 ? data[0].vin : null;
      this.topfiveWrostMileage(this.wrostDriver)
    }, err => {
    })
  }
  async getWrostDriverweek() {
    await this.dashboardservice.getwrostMileageFleetDay(this.customConsumer,this.fleetIdData,this.groupIdData,).subscribe((data: any) => {
      this.wrostDriver = data
      this.wrostDriverNull = data.length > 0 ? data[0].vin : null;
      this.topfiveWrostMileage(this.wrostDriver)
    }, err => {
    })
  }
  async getWrostDriverday() {
    await this.dashboardservice.getwrostMileageFleetDays(this.customConsumer,this.fleetIdData).subscribe((data: any) => {
      this.wrostDriver = data
      this.wrostDriverNull = data.length > 0 ? data[0].vin : null;
      this.topfiveWrostMileage(this.wrostDriver)
    }, err => {
    })
  }
  getWrostDriverFleet() {
    this.dashboardservice.getWrostMileageFleetNews(this.customConsumer, this.fleetIdData)
      .subscribe((data: any) => {
        this.wrostDriver = data;
        this.wrostDriverNull = data.length > 0 ? data[0].vin : null;
        this.topfiveWrostMileage(this.wrostDriver);
      }, err => {
        console.error('Error fetching worst driver fleet:', err);
      });
  }
  async getWrostDriverDownlaod() {
    await this.dashboardservice.getWrostMileage(this.customConsumer,this.fleetIdData,this.groupIdData,"",).subscribe((data: any) => {
      this.wrostDriver = data
      // this.convertToCSVAndDownloadWorst(this.wrostDriver)
    }, err => {
    })
  }
  getCurrentDate(): string {
    const date = new Date();
    return `Updated on ${date.getDate()} ${this.getMonthName(date.getMonth())}`;
  }
  getMonthName(monthIndex: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthIndex];
  }
  convertToCSVAndDownloadWorst(data: any[]) {
    const csvData = this.convertToCSVWorst(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'Worst_Drivers_Reports.csv');
  }

  convertToCSVWorst(data: any[]): string {
    const selectedColumns = ['vin', 'avgMileageMPG'];

    // Define desired column names
    const columnNames = {
      'vin': 'VIN',
      'avgMileageMPG': 'Mileage (mpg)',
    };

    // Capitalize the headings and use desired column names
    const header = selectedColumns.map(heading => columnNames[heading]).join(',') + '\n';

    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    return header + csv;
  }

  // Expensive Driver
  async getexpensiveDrivers() {
    await this.dashboardservice.getespensiceDriver(this.customConsumer, this.fleetIdData,this.groupIdData,'').subscribe((data: any) => {
      this.expensiveDriver = data
      this.topfivegetexpensiveDrivers(this.expensiveDriver)
    }, err => {
    })
  }

  async getexpensiveDriversWeek() {
    await this.dashboardservice.getespensiceDriverWeeks(this.customConsumer,this.fleetIdData,this.groupIdData,).subscribe((data: any) => {
      this.expensiveDriver = data
      this.topfivegetexpensiveDrivers(this.expensiveDriver)
    }, err => {
    })
  }

  async getexpensiveDriversDay() {
    await this.dashboardservice.getespensiceDriversDays(this.customConsumer,"",this.fleetIdData,this.groupIdData,).subscribe((data: any) => {
      this.expensiveDriver = data
      this.topfivegetexpensiveDrivers(this.expensiveDriver)
    }, err => {
    })
  }

  getexpensiveDriversFleet() {
    this.dashboardservice.getespensiceDriverFleetNews(this.customConsumer, this.fleetIdData, this.groupIdData)
        .subscribe((data) => {
            this.expensiveDriver = data;
            this.topfivegetexpensiveDrivers(this.expensiveDriver);
        }, err => {
            console.error('Error fetching expensive drivers fleet:', err);
        });
}


  async getexpensiveDriversDownlaod() {
    await this.dashboardservice.getespensiceDriver(this.customConsumer, this.fleetIdData,this.groupIdData,'').subscribe((data: any) => {
      this.expensiveDriver = data
      this.convertToCSVAndDownload(this.expensiveDriver);
    }, err => {
    })
  }

  convertToCSVAndDownload(data: any[]) {
    const csvData = this.convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'Expensive_Drivers_Reports.csv');
  }

  convertToCSV(data: any[]): string {
  // Select only the desired columns
const selectedColumns = ['vin', 'fuelCost', 'totalFuelCost',];

// Define desired column names
const columnNames = {
  'vin': 'VIN',
  'fuelCost': 'Fuel Cost Per Mile ($)',
  'totalFuelCost': 'Total Fuel Cost ($)',
};

// Capitalize the headings and use desired column names
const header = selectedColumns.map(heading => columnNames[heading]).join(',') + '\n';

// Map each row to include only selected column values
const csv = data.map(row => selectedColumns.map(col => row[col]).join(',')).join('\n');

return header + csv;
}
chartOptionsexpensiveCase: any
capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

topfivegetexpensiveDrivers(data) {
 data.sort((a, b) => b.totalFuelCost.toFixed(2) - a.totalFuelCost.toFixed(2));
 const topFiveData = data.slice(0, 5);
 const topFiveVINs = topFiveData.map(item =>
  item?.alias?.length === 17 ? this.maskVin(item.alias) : item.alias
);
 const topfivegetexpensiveCost = topFiveData.map(item => item.totalFuelCost.toFixed(2));
    this.chartOptionsexpensiveCase = {
      series: [
        {
          name: "Fuel Cost Per Mile ($)",
          data: topfivegetexpensiveCost
        }
      ],
      chart: {
        height: 250,
        type: "bar",

        zoom: {
          enabled: false,
        },
        toolbar:
        {
          show: !1
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 13,
          borderRadiusApplication: 'end',
          barHeight: topfivegetexpensiveCost.length === 1 ? "15%" : "70%", // Dynamically set bar width for horizontal bars
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
          border: '1px solid red',
        },
      },
      colors: [
        "#FF5050",
        "#FF5050",
        "#FF5050",
        "#FF5050",
        "#FF5050",
      ],
      dataLabels: {
        enabled: false,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: -30,
        formatter: function (val: any, opt: any) {
          return val;
        },
      },
      legend: {
        show: false
      },
      grid: {
        strokeArray: 7,
      },
      yaxis: {

        labels: {
          show: true,
          style: {
            colors: "#727272",
            fontSize: "10px",
            fontWeight: 400,
            fontFamily: "Poppins",
          },
        },
        title: {
          offsetX: 0,
          offsetY: -13,
          text: "VIN",
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
      },
      xaxis: {
        categories: topFiveVINs,
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },

        axisTicks: {
          show: false,
        },
        title: {
          offsetX: -5,
          offsetY: 0,
          text: "Fuel Cost Per Miles ($)",
          style: {
            color: "#AEAEAE",
            fontSize: "11px",
            fontFamily: "Poppins",
            fontWeight: 400,
          },
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
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const value = series[seriesIndex][dataPointIndex];
          const formattedValue =
            value > 1000 ? (value / 1000).toFixed(0) + "k $" : value + " $";
          let color = "#ff0000";

          return `
            <div style="position: relative; background-color:${color}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              ${formattedValue}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
      },
    };
  }
  vehicleclass: any;
  cityHighway: any;
  noDataMessage: string;
  noDataMessageNew: string;
  showChart: boolean = false;
  async vehicleBodyClass() {
    await this.dashboardservice.getBodyClassMileage(this.customConsumer, this.fleetIdData, this.groupIdData,'').subscribe(
      (res: any) => {
        this.totalMileageData = res;

        if (!this.totalMileageData || this.totalMileageData.length === 0) {
          this.noDataMessage = 'No Data Found';
          this.showChart = false; // Hide chart when no data
        } else {
          this.noDataMessage = ''; // Clear any previous message
          this.showChart = true; // Show chart when data exists
          this.getByVehicleClass(); // Call the chart rendering function
        }
      },
      (error: any) => {
        this.noDataMessage = `Error: ${error.status} - ${error.message || 'Internal Server Error'}`;
        this.showChart = false; // Hide chart in case of error
      }
    );
  }


  getByVehicleClass() {
    const colorMapping: { [key: string]: string } = {
      'Sedan': "#a5dac9",
      'Pickup': '#979A9E',
      'Hatchback': "#F0CE9C",
      'Van': "#FF8080",
      'Truck': "#C6ABB8",
      'SUV': "#2CA87F",
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
      item.mileageByBodyClass.forEach((mileageData: any) => {
        // Transform "Suv" to "SUV" and capitalize other body classes
        let bodyClass = mileageData.bodyClass
          ? mileageData.bodyClass === 'suv' ? 'SUV' : mileageData.bodyClass.charAt(0).toUpperCase() + mileageData.bodyClass.slice(1).toLowerCase()
          : 'Others';

        if (!seriesData[bodyClass]) {
          seriesData[bodyClass] = new Array(categories.length).fill(0); // Fill with zeros for alignment
        }

        const index = categories.indexOf(formattedYearMonth);
        if (index !== -1) {
          seriesData[bodyClass][index] = parseFloat(mileageData.mileage.toFixed(2)) || 0;
        }
      });
    });

    // Reorder the keys to ensure 'Others' comes last
    const orderedKeys = Object.keys(seriesData).filter(key => key !== 'Others');
    orderedKeys.push('Others'); // Make sure 'Others' is last

    // Prepare series with the correct order
    const orderedSeriesData = orderedKeys.map((bodyClass) => ({
      name: bodyClass,
      data: seriesData[bodyClass],
      color: colorMapping[bodyClass] || colorMapping['Others'],
    }));

    this.vehicleclass = {
      series: orderedSeriesData,
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
          height: '2.5px',
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
          columnWidth: this.totalMileageData.length > 1 ? '70%' : '30%',
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
          },
          title: {
            offsetX: 0,
            offsetY: 0,
            text: "Mileage (mpg)", // Title for the primary y-axis
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
              ${value} mpg
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
    // Mileage Trends City v/s Highway
    async cityHighwayFuel() {
      await this.dashboardservice.getCityHighwayFuel(this.customConsumer, this.fleetIdData,this.groupIdData, '').subscribe((res: any) => {
        this.totalMileageCity = res;

        // Check if the response is empty or null
        if (!this.totalMileageCity || this.totalMileageCity.length === 0) {
          this.showChart = false; // Show "No Data Found"
          return;
        }

        // Ensure we access the nested 'cityVsHighwayBodyClassDtos' array
        const cityVsHighwayData = res.map((item: any) => item.cityVsHighwayBodyClassDtos).flat();

        // Sort data by 'yearMonth'
        cityVsHighwayData.sort((a: any, b: any) => {
          const dateA = new Date(a.yearMonth);
          const dateB = new Date(b.yearMonth);
          return dateA.getTime() - dateB.getTime();
        });

        // Map categories
        const categories: string[] = cityVsHighwayData.map((item: any) => {
          const [year, month] = item.yearMonth.split('-');
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return `${monthNames[parseInt(month) - 1]}'${year.slice(2)}`;
        });

        // Map mileage data
        const cityMileageData = cityVsHighwayData.map((item: any) =>
          parseFloat((item.cityMileage || 0).toFixed(2))
        );
        const highwayMileageData = cityVsHighwayData.map((item: any) =>
          parseFloat((item.highwayMileage || 0).toFixed(2))
        );

        // Pass the processed data to the chart configuration
        this.getbyCityVsHighway(cityMileageData, highwayMileageData, categories);

        // Set showChart to true since we have data to display
        this.showChart = true;
      });
    }

    getbyCityVsHighway(cityMileageData: number[], highwayMileageData: number[], categories: string[]) {
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
            columnWidth: '50%',
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
