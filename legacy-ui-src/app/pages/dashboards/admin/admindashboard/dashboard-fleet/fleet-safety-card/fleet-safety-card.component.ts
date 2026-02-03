import { Component, OnInit, OnDestroy } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexStroke, ApexYAxis, ApexTitleSubtitle, ApexLegend, ApexResponsive } from "ng-apexcharts";
import { AppService } from 'src/app/app.service';
export type ChartOptions = { series: ApexAxisChartSeries; chart: ApexChart; stroke: ApexStroke; dataLabels: ApexDataLabels; yaxis: ApexYAxis; title: ApexTitleSubtitle; labels: string[]; legend: ApexLegend; subtitle: ApexTitleSubtitle; responsive: ApexResponsive[]; colors: string[]; };
@Component({
  selector: 'app-fleet-safety-card',
  templateUrl: './fleet-safety-card.component.html',
  styleUrls: ['./fleet-safety-card.component.scss']
})
export class FleetSafetyCardComponent implements OnInit, OnDestroy {
  subscription$: Subscription = new Subscription();
  isLoading: boolean = false;
  fleetIdData: any;
  harshBraking: any;
  consumerList: any
  harshCornering: any;
  nightDrive: any;
  overSpeeding: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  aggresiveDriver: any;
  monthData: any;
  customConsumer: any;
  fleetList: any;
  harshAcceleration: any;
  consumer: any = 'All'
  labelDatas: any;
  driver: any;
  fleetIdValueNew: any;
  top5HarshAcc: any;
  top5Harshbrak: any;
  top5HarshCorner: any;
  top5nightDrive: any;
  top5overSpeeding: any;
  cardsFlag = false;
  totalHarshAcc: any;
  totalHarshCorner: any;
  totalHarshBrake: any;
  totalnightdrive: any;
  totalSpeedDrive: any;
  totalnightdrive1: number;
  totalmiles: number;
  totalSpeedDrive1: number;
  totalfleetlevelData: any;
  fleetSumamryTotalData: any;
  months = [
    { value: '', name: 'Select a month' },
    { value: '1', name: "Jan' 25" },
    { value: '2', name: "Feb' 25" },
    { value: '3', name: "Mar' 25" },
    { value: '4', name: "Apr' 25" },
    { value: '5', name: "May' 25" },
    { value: '6', name: "June' 25" },
    { value: '7', name: "July' 25" },
    { value: '8', name: "Aug' 24" },
    { value: '9', name: "Sept' 24" },
    { value: '10', name: "Oct' 24" },
    { value: '11', name: "Nov' 24" },
    { value: '12', name: "Dec' 24" },

  ];
  selectedMonth: string = '7';
  startDate: Date | null = null;
  endDate: Date | null = null;
  dataShow: boolean = false;
  dataHide: boolean = true;
  driverScores: any = [];
  donutchart2: any;
  topFiveVins: string[] = [];
  threshold = 0;
  chartOptionsseatBelts: any;
  showLegendsAndValues: boolean = false;
  vehicleSplitDonut: any;
  isDataNotFound: boolean = false; // New flag to indicate "No Data Found" scenario
  selectedPeriod: any;
  avgFleetScore: string;
  totalDrivers: any;
  fleetIds: any;
  topLevelData: any
  totalDistanceTravelledData: any
  avgHarshAccelerationData: any;
  activeVehiclesCount: any;
  avgHarshBrakingData: any;
  avgHarshCorneringData: any
  avgOverSpeedingData: any;
  avgNightDrivingData: any;
  groupList: any;
  constructor(private appService: AppService, public router: Router, public http: HttpClient, private modalService: NgbModal, private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService) {

  }
  ngOnInit() {
    this.showRole();
    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }
    this.topLevelInfo()
    this.getAggresiveDrivers()
    this.getCardsData()
    this.getDriverScores()
    this.getSeatBelt()
    if (this.user != 'role_user_fleet' && this.user !='role_org_group') {
      this.selectConsumers()
    }
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
      this.consumerList = this.consumerList.filter(item => !excludedConsumers.has(item.name));
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

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
    }
    if (this.user ==='role_org_group') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
    }
    else if(this.user === 'role_Driver'){
      let fleetId = JSON.stringify(sessionStorage.getItem('fleet-Id'));
      this.fleetIdValueNew = JSON.parse(fleetId);
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

  selectFleetId() {
    this.selectGroupId()
    this.monthData = null
    this.topLevelInfo()
    this.getAggresiveDrivers()
    this.getCardsData()
    this.getDriverScoresFleets()
    this.getSeatBelt()
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.monthData = null
    this.topLevelInfo()
    this.getAggresiveDrivers()
    this.getCardsData()
    this.getDriverScoresFleets()
    this.getSeatBelt()
  }

  clearFleetSelection() {
    this.topLevelInfo()
    this.getAggresiveDrivers()
    this.getCardsData()
    this.getDriverScores()
    this.getSeatBelt()
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


  onMonthSelect(event: any) {
    const selectedValue = event; // ng-select provides the selected value directly
    const month = parseInt(selectedValue, 10);

    if (month) {
      const year = month > 7 ? 2024 : 2025; // Set the year based on the selected month
      this.startDate = new Date(year, month - 1, 1); // Start date is the 1st of the selected month and year
      this.endDate = new Date(year, month, 0); // End date is the last day of the selected month and year

      this.getCardsData();
    } else {
      this.startDate = null;
      this.endDate = null;
    }
  }

  clearSelection() {
    this.selectedMonth = '7'; // Reset to September
    this.onMonthSelect(this.selectedMonth); // Update dates for September
  }

  noDataFound: boolean = false;
// top level data
async topLevelInfo() {
  // Reset values to trigger loading states
  this.noDataFound = false;
  this.totalDistanceTravelledData = undefined;
  this.avgHarshAccelerationData = undefined;
  this.avgHarshBrakingData = undefined;
  this.avgHarshCorneringData = undefined;
  this.avgOverSpeedingData = undefined;
  this.avgNightDrivingData = undefined;
  this.activeVehiclesCount = undefined
  this.subscription$.add(
    this.dashboardservice.getSafetyTopLevel(this.customConsumer, this.fleetIdData, this.groupIdData).subscribe({
      next: (res: any) => {
        // Set data
        this.topLevelData = res;
        this.totalDistanceTravelledData = res?.totalDistanceTravelled;
        this.avgHarshAccelerationData = res?.avgHarshAcceleration;
        this.avgHarshBrakingData = res?.avgHarshBraking;
        this.avgHarshCorneringData = res?.avgHarshCornering;
        this.avgOverSpeedingData = res?.avgOverSpeeding;
        this.avgNightDrivingData = res?.avgNightDriving;
        this.activeVehiclesCount = res?.totalActiveVehicles
        this.noDataFound = false;
      },
      error: (err: any) => {
        const errorBody = err?.error?.apierror;

        if (errorBody?.message === 'Data Not Found') {
          this.noDataFound = true;
          this.totalDistanceTravelledData = null;
          this.avgHarshAccelerationData = null;
          this.avgHarshBrakingData = null;
          this.avgHarshCorneringData = null;
          this.avgOverSpeedingData = null;
          this.avgNightDrivingData = null;
          this.activeVehiclesCount = null
        } else {
          console.error('Unexpected error fetching safety data:', err);
        }
      }
    })
  );
}


  // Top 5 Risky Left side chart
  // Aggresive Driver Top 5 Risky Left Chart
  async getAggresiveDrivers() {
    this.spinner.show();
    this.dataHide = true;
    this.dataShow = false;
    await this.dashboardservice.getAggresiveDriverNew(this.customConsumer, this.fleetIdData, this.groupIdData).subscribe(
      (data: any) => {
        this.driver = data?.topFiveAggressiveDriverScorer;
        this.spinner.hide();
        this.topfiveAggresiveDriver(this.driver);
        setTimeout(() => {
          this.spinner.hide();
        }, 1000);
      },
      (err) => {
        this.spinner.hide();

        // Show data if needed (based on your logic)
        this.dataShow = true;
        this.dataHide = false;

      }
    );
  }

  maskVin(vin: string): string {
    if (vin && vin.length >= 3) {
      // Add a null check for vin
      return "**" + vin.slice(-3);
    } else {
      return vin;
    }
  }

  topfiveAggresiveDriver(data) {
    let labelDataAggressiveDriver = [];
    let seriesData1 = [];
    let seriesData2 = [];
    let seriesData3 = [];
    let seriesData4 = [];
    let seriesData5 = [];
    let avgDScoreData = [];
    let top5Data = [];

    // Finding top 5 rows
    for (let i = 0; i < data.length && i < 5; i++) {
      let item = data[i];
      top5Data.push(item);
      const maskedAlias = item.alias.length === 17 ? this.maskVin(item.alias) : item.alias;
      const scoreDisplay = item.driver_score
      ? `(${parseFloat(item.driver_score).toFixed(0)})`
      : "(0)";
      labelDataAggressiveDriver.push(`${scoreDisplay}${maskedAlias.slice(0, 2)}...${maskedAlias.slice(-5)}`);
      seriesData1.push(item.HA);
      seriesData3.push(item.HC);
      seriesData2.push(item.HB);
      seriesData4.push(item.os);
      seriesData5.push(item.NP_km);
      avgDScoreData.push({
        VIN: item.alias,
        score: item.score,
      });
    }
    this.aggresiveDriver = {
      series: [
        {
          name: "Harsh Acceleration",
          data: seriesData1,
          yaxis: 0, // Assign to primary y-axis (index 0)
        },
        {
          name: "Harsh Braking",
          data: seriesData2,
          yaxis: 0, // Assign to primary y-axis (index 0)
        },
        {
          name: "Harsh Cornering",
          data: seriesData3,
          yaxis: 0, // Assign to primary y-axis (index 0)
        },
        {
          name: "Night Driving",
          data: seriesData5,
          yaxis: 1, // Assign to secondary y-axis (index 1)
        },
        {
          name: "Over Speeding",
          data: seriesData4,
          yaxis: 1, // Assign to secondary y-axis (index 1)
        },
      ],
      legend: {
        show: false,
        position: "bottom",
        horizontalAlign: "left",
        verticalAlign: "middle",
        floating: false,
        fontSize: "14px",
        offsetX: 0,
        offsetY: 10,
        markers: {
          size: 7,
          shape: "rectangle",
        },
      },
      chart: {
        type: "bar",
        stacked: false,
        height: 460,
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
          columnWidth: data.length === 1 ? "10%" : "70%",
          borderRadiusApplication: "end",
          borderRadius: 6,
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
            return avgDScoreData[opt.dataPointIndex].score;
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
      colors: ["#6388DA", "#FFCBA7",  "#b3cbff","#B1B1B1", "#FF8D8D"],
      // colors: ["#6388DA","#FFD0AF","#B6CDFF",  "#ABABAA",  "#FF7878"],
      labels: [
        "Harsh Acceleration",
        "Harsh Braking",
        "Harsh Cornering",
        "Night Driving",
        "Over Speeding",
      ],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.3,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      label_title: ["HA", "HB", "HC", "ND", "OS"],
      labels2: [
        "(Count per 100 miles)",
        "(Count per 100 miles)",
        "(Count per 100 miles)",
        "(% of distance travelled)",
        "(% of distance travelled)",
      ],
      xaxis: {
        categories: labelDataAggressiveDriver,
        title: {
          offsetX: -30,
          offsetY: -20,
          text: "VIN",
        },
        tooltip: {
          enabled: true,
          formatter: function (val, opts) {
            const fullAlias = top5Data[opts.dataPointIndex]?.alias || '';
            const scoreDisplay = top5Data[opts.dataPointIndex]?.driver_score
              ? `(${parseFloat(top5Data[opts.dataPointIndex].driver_score).toFixed(0)})`
              : "(0)";
            return `${scoreDisplay}${fullAlias}`;
          }
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
            colors: "#000000",
            fontSize: "18px",
            fontWeight: 500,
            cssClass: "chart-label-y-big",
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
            formatter: (value) => {
              if (value === 0) return "0"; // Ensure 0 is displayed as "0" instead of "0k"
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
              if (value >= 0 ) return `${(value / 1000).toFixed(1)}k`;
              if (value >= 0 && value <= 1000) return `${value}`;
              return value.toFixed(0);
            },
          },
          title: {
            offsetX: 0,
            offsetY: 140,
            text: "Events", // Title for the primary y-axis
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
          // Get the value of the hovered bar
          const value = series[seriesIndex][dataPointIndex];
          let colors = ["#6388DA", "#FFCBA7", "#6E94E9", "#B1B1B1", "#FF8D8D"];

          // Hide x-axis labels in the tooltip by not including them in the custom tooltip
          const seriesLabel = w.config.labels[seriesIndex];

          // Initialize percentage display variable
          let percentageDisplay = '';
          if (seriesLabel === 'Night Driving' || seriesLabel === 'Over Speeding') {
            percentageDisplay = ' %'; // Add only the % sign
          }

          return `
            <div style="position: relative; background-color:${colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
              <div style="font-weight:500; font-family:'Poppins'"> ${seriesLabel}</div>
              ${value}${percentageDisplay} <!-- Add % sign for specified series -->
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

  calculatePercentage(part: number, total: number): string {
    if (total === 0) return "0%"; // Handle division by zero
    const percentage = (part / total) * 100;
    return `${percentage.toFixed(2)}%`;
  }

  // Top 5 Risky Driver Right Chart
  getCardsData() {
    this.isLoading = true;
    this.dataHide = true;
    this.dataShow = false;
    this.avgFleetScore = '0.00';
    if(this.selectedMonth == '7'){
    this.dashboardservice.getSafetyDataNewCurrentMonth(this.customConsumer, this.fleetIdData, this.groupIdData).subscribe((res: any) => {
          this.avgFleetScore = res?.fleetLevelStats?.totalDriverBehaviour?.toFixed(2) || '0.00';
          this.fleetSumamryTotalData = res?.fleetLevelStats?.totalActiveVehicles
          this.totalHarshAcc = this.getTotalByCategory(
            res.vinLevelStats,
            "harshAcc"
          )
          this.totalHarshCorner = (this.getTotalByCategory(
            res.vinLevelStats,
            "harshCornering"
          ));
          this.totalHarshBrake = (this.getTotalByCategory(
            res.vinLevelStats,
            "harshBrake"
          ));
          this.totalnightdrive1 = this.getTotalByCategory(
            res.vinLevelStats,
            "nightDistance"
          );
          this.totalmiles = this.getTotalByCategory(
            res.vinLevelStats,
            "avgMileage"
          );
          this.totalfleetlevelData = res.fleetLevelStats
          this.totalnightdrive = this.calculatePercentage(this.totalnightdrive1, this.totalmiles);
          this.totalSpeedDrive1 = this.getTotalByCategory(
            res.vinLevelStats,
            "overspeedingDistance"
          );
          this.totalSpeedDrive = this.calculatePercentage(this.totalSpeedDrive1, this.totalmiles);
          this.top5HarshAcc = this.getTop5By(res.vinLevelStats, "harshAcc");
          this.top5HarshCorner = this.getTop5By(res.vinLevelStats, "harshCornering");
          this.top5Harshbrak = this.getTop5By(res.vinLevelStats, "harshBrake");
          this.top5nightDrive = this.getTop5By(
            res.vinLevelStats,
            "nightDistance"
          );
          this.top5overSpeeding = this.getTop5By(
            res.vinLevelStats,
            "overspeedingDistance"
          );
          this.cardsFlag = true;
          this.isLoading = false;
          this.harshAcceleration = {
            series: [
              {
                name: "Harsh Acceleration",
                data: this.top5HarshAcc[1],
              },
            ],

            legend: {
              show: false,
              position: "bottom",
              horizontalAlign: "left",
              verticalAlign: "middle",
              floating: false,
              fontSize: "12px",
              offsetX: 0,
              offsetY: 10,
              markers: {
                size: 7,
                shape: "rectangle",
              },
            },
            chart: {
              type: "bar",
              stacked: false,
              height: 140,
              width: "100%",
              zoom: {
                show: false,
              },
              toolbar: {
                show: false,
              },
            },
            plotOptions: {
              bar: {
                horizontal: true,
                columnWidth: "70%",
                borderRadiusApplication: "end",
                borderRadius: 6,
                dataLabels: {
                  enabled: true,
                  position: "top",
                },
              },
            },
            dataLabels: {
              enabled: false,
            },
            stroke: {
              show: true,
              width: 0,
              colors: ["transparent"],
            },
            colors: ["#7EA6FE"],
            fill: {
              opacity: 1
            },
            labels: ["Harsh Acceleration"],

            xaxis: {
              categories: this.top5HarshAcc[0].map(category => this.formatCategory(category)),
              tickAmount: 4,
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
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
                formatter: function (value) {
                  return value >= 1000
                    ? (value / 1000).toFixed(1) + "k"
                    : value;
                },
              },
            },
            yaxis: {
              labels: {
                show: true,
                style: {
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
                formatter: function (value) {
                  return value >= 1000
                    ? (value / 1000).toFixed(1) + "k"
                    : value;
                },
              },
            },
            tooltip: {
              custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                // Get the value of the hovered bar
                const value = series[seriesIndex][dataPointIndex];
                let colors = [
                  "#7EA7FF",
                  "#B6CDFF",
                  "#BDBDBD",
                  "#FFD0AF",
                  "#55D3A9",
                ];

                // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                return `
                <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                  <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value}
                  <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                </div>
              `;
              },
              x: {
                show: false, // This hides the x-axis values in the tooltip
              },
            },
            grid: {
              show: true,
              borderColor: "#404040",
              strokeDashArray: 2,
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
              //   row: {
              //     colors:["#404040"],
              //     opacity: 0.8
              // },
            },
          };
          this.harshBraking = {
            series: [
              {
                name: "Harsh Braking",
                data: this.top5Harshbrak[1],
              },
            ],

            legend: {
              show: false,
              position: "bottom",
              horizontalAlign: "left",
              verticalAlign: "middle",
              floating: false,
              fontSize: "12px",
              offsetX: 0,
              offsetY: 10,
              markers: {
                size: 7,
                shape: "rectangle",
              },
            },
            chart: {
              type: "bar",
              stacked: false,
              height: 140,
              width: "100%",
              zoom: {
                show: false,
              },
              toolbar: {
                show: false,
              },
            },
            plotOptions: {
              bar: {
                horizontal: true,
                columnWidth: "70%",
                borderRadiusApplication: "end",
                borderRadius: 6,
                dataLabels: {
                  enabled: true,
                  position: "top",
                },
              },
            },
            dataLabels: {
              enabled: false,
            },
            stroke: {
              show: true,
              width: 0,
              colors: ["transparent"],
            },
            colors: ["#FFD0AF"],
            fill: {
              opacity: 1
            },
            labels: ["Harsh Braking"],

            xaxis: {
              categories: this.top5Harshbrak[0].map(category => this.formatCategory(category)),
              tickAmount: 4,
              // min: 0,
              // max: 100,
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
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
                formatter: function (value) {
                  return value >= 1000
                    ? (value / 1000).toFixed(1) + "k"
                    : value;
                },
              },
            },
            yaxis: {
              labels: {
                show: true,
                style: {
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
              },
            },
            tooltip: {
              custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                // Get the value of the hovered bar
                const value = series[seriesIndex][dataPointIndex];
                let colors = [
                  "#7EA7FF",
                  "#B6CDFF",
                  "#BDBDBD",
                  "#FFD0AF",
                  "#55D3A9",
                ];

                // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                return `
                <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                  <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value}
                  <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                </div>
              `;
              },
              x: {
                show: false, // This hides the x-axis values in the tooltip
              },
            },
            grid: {
              show: true,
              borderColor: "#404040",
              strokeDashArray: 2,
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
              //   row: {
              //     colors:["#404040"],
              //     opacity: 0.8
              // },
            },
          };
          this.harshCornering = {
            series: [
              {
                name: "Harsh Cornering",
                data: this.top5HarshCorner[1],
              },
            ],

            legend: {
              show: false,
              position: "bottom",
              horizontalAlign: "left",
              verticalAlign: "middle",
              floating: false,
              fontSize: "12px",
              offsetX: 0,
              offsetY: 10,
              markers: {
                size: 7,
                shape: "rectangle",
              },
            },
            chart: {
              type: "bar",
              stacked: false,
              height: 140,
              width: "100%",
              zoom: {
                show: false,
              },
              toolbar: {
                show: false,
              },
            },
            plotOptions: {
              bar: {
                horizontal: true,
                columnWidth: "70%",
                borderRadiusApplication: "end",
                borderRadius: 6,
                dataLabels: {
                  enabled: true,
                  position: "top",
                },
              },
            },
            dataLabels: {
              enabled: false,
            },
            stroke: {
              show: true,
              width: 0,
              colors: ["transparent"],
            },
            colors: ["#B3CBFF"],
            fill: {
              opacity: 1
            },
            labels: ["Harsh Cornering"],

            xaxis: {
              categories: this.top5HarshCorner[0].map(category => this.formatCategory(category)),
              tickAmount: 4,
              // min: 0,
              // max: 100,
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
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
                formatter: function (value) {
                  return value >= 1000
                    ? (value / 1000).toFixed(1) + "k"
                    : value;
                },
              },
            },
            yaxis: {
              labels: {
                show: true,
                style: {
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
              },
            },
            tooltip: {
              custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                // Get the value of the hovered bar
                const value = series[seriesIndex][dataPointIndex];
                let colors = [
                  "#7EA7FF",
                  "#B6CDFF",
                  "#BDBDBD",
                  "#FFD0AF",
                  "#55D3A9",
                ];

                // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                return `
                <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                  <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value}
                  <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                </div>
              `;
              },
              x: {
                show: false, // This hides the x-axis values in the tooltip
              },
            },
            grid: {
              show: true,
              borderColor: "#404040",
              strokeDashArray: 2,
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
              //   row: {
              //     colors:["#404040"],
              //     opacity: 0.8
              // },
            },
          };
          // Create an array to store data for rendering
          const barData = this.top5nightDrive[1].map((value, index) => ({
            value,
            category: this.top5nightDrive[0][index]
          }));

          // Separate data into categories with bars and without bars
          const bars = barData.filter(item => item.value <= 100);
          const noBars = barData.filter(item => item.value > 100);

          // Extract filtered values and categories
          const filteredValues = bars.map(item => item.value);
          const filteredCategories = bars.map(item => item.category);

          // Create a mapping for all categories with empty values for categories without bars
          const allCategories = this.top5nightDrive[0].map(category => this.formatCategory(category));
          const allValues = this.top5nightDrive[1].map((value) => (value <= 100 ? value : 0)) // Use null for values > 100

          this.nightDrive = {
            series: [
              {
                name: "Night Driving",
                data: allValues,
              },
            ],

            legend: {
              show: false,
              position: "bottom",
              horizontalAlign: "left",
              verticalAlign: "middle",
              floating: false,
              fontSize: "12px",
              offsetX: 0,
              offsetY: 10,
              markers: {
                size: 7,
                shape: "rectangle",
              },
            },
            chart: {
              type: "bar",
              stacked: false,
              height: 140,
              width: "100%",
              zoom: {
                show: false,
              },
              toolbar: {
                show: false,
              },
            },
            plotOptions: {
              bar: {
                horizontal: true,
                columnWidth: "70%",
                borderRadiusApplication: "end",
                borderRadius: 6,
                dataLabels: {
                  enabled: true,
                  position: "top",
                },
              },
            },
            dataLabels: {
              enabled: false,
            },
            stroke: {
              show: true,
              width: 0,
              colors: ["transparent"],
            },
            colors: ["#BDBDBD"],
            fill: {
              opacity: 1,
            },
            labels: ["Night Percentage"],

            xaxis: {
              categories: allCategories, // Show all categories (VINs)
              labels: {
                formatter: function (value) {
                  // Format the label to show as a percentage
                  return `${value}%`;
                },
                show: true,
                style: {
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
              },
              axisBorder: {
                show: false // Removes the x-axis border
              },
              axisTicks: {
                show: false // Removes the ticks on the x-axis
              },
              min: 0,   // Set minimum value for x-axis
              max: 100, // Set maximum value for x-axis
              tickAmount: 4, // Number of ticks on the x-axis
            },
            lines: {
              show: false, // Ensure no lines are shown
            },


            yaxis: {
              labels: {
                show: true,
                style: {
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
              },
            },
            tooltip: {
              custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                // Get the value of the hovered bar
                const value = series[seriesIndex][dataPointIndex];
                // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                return `
      <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
        <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value !== null ? value + ' %' : 'No Data'}
        <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
      </div>
    `;
              },
              x: {
                show: false,
              },
            },
            grid: {
              show: true,
              borderColor: "#404040",
              strokeDashArray: 2,
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
          };

          this.overSpeeding = {
            series: [
              {
                name: "Over Speeding",
                data: this.top5overSpeeding[1].map((value) => (value <= 100 ? value : 0)), // Set data to 0 if value is greater than 100
              },
            ],

            legend: {
              show: false,
              position: "bottom",
              horizontalAlign: "left",
              verticalAlign: "middle",
              floating: false,
              fontSize: "12px",
              offsetX: 0,
              offsetY: 10,
              markers: {
                size: 7,
                shape: "rectangle",
              },
            },
            chart: {
              type: "bar",
              stacked: false,
              height: 140,
              width: "100%",
              zoom: {
                show: false,
              },
              toolbar: {
                show: false,
              },
            },
            plotOptions: {
              bar: {
                horizontal: true,
                columnWidth: "70%",
                borderRadiusApplication: "end",
                borderRadius: 6,
                dataLabels: {
                  enabled: true,
                  position: "top",
                },
              },
            },
            dataLabels: {
              enabled: false,
            },
            stroke: {
              show: true,
              width: 0,
              colors: ["transparent"],
            },
            colors: ["#ff8f8f"],
            fill: {
              opacity: 1
            },
            labels: ["Over Speeding"],

            xaxis: {
              categories: this.top5overSpeeding[0].map(category => this.formatCategory(category)),
              labels: {
                formatter: function (value) {
                  // Assuming the value is a percentage. Adjust this if needed.
                  return `${value}%`;
                },
                show: true,
                style: {
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-x",
                },
              },
              axisBorder: {
                show: false // Removes the x-axis border
              },
              axisTicks: {
                show: false // Removes the ticks on the x-axis
              },
              tickAmount: 4,
              min: 0,
              max: 100,
              lines: {
                show: false,
              },
            },
            yaxis: {
              labels: {
                show: true,
                style: {
                  colors: "#000000",
                  fontSize: "12px",
                  fontWeight: 500,
                  cssClass: "chart-label-y",
                },
              },
            },
            tooltip: {
              custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                // Get the value of the hovered bar
                const value = series[seriesIndex][dataPointIndex];
                // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                return `
                <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                  <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value.toFixed(2) + ' %'}
                  <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                </div>
              `;
              },
            },
            grid: {
              show: true,
              borderColor: "#404040",
              strokeDashArray: 2,
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
              //   row: {
              //     colors:["#404040"],
              //     opacity: 0.8
              // },
            },
          };
        },
        (err) => {

          this.spinner.hide();
          if (err?.error?.apierror?.status === "UNPROCESSABLE_ENTITY") {
            this.appService.openSnackBar("Data not found for selected months.", "Error");
            this.NewData = true
          }
        }
      );
    }
    else{
      this.dashboardservice.getSafetyDataNew(this.customConsumer, this.fleetIdData, this.startDate, this.endDate).subscribe((res: any) => {
            this.avgFleetScore = res?.fleetLevelStats?.totalDriverBehaviour?.toFixed(2) || '0.00';
            this.fleetSumamryTotalData = res?.fleetLevelStats?.totalActiveVehicles
            this.totalHarshAcc = this.getTotalByCategory(
              res.vinLevelStats,
              "harshAcc"
            )
            this.totalHarshCorner = (this.getTotalByCategory(
              res.vinLevelStats,
              "harshCornering"
            ));
            this.totalHarshBrake = (this.getTotalByCategory(
              res.vinLevelStats,
              "harshBrake"
            ));
            this.totalnightdrive1 = this.getTotalByCategory(
              res.vinLevelStats,
              "nightDistance"
            );
            this.totalmiles = this.getTotalByCategory(
              res.vinLevelStats,
              "avgMileage"
            );
            this.totalfleetlevelData = res.fleetLevelStats
            this.totalnightdrive = this.calculatePercentage(this.totalnightdrive1, this.totalmiles);
            this.totalSpeedDrive1 = this.getTotalByCategory(
              res.vinLevelStats,
              "overspeedingDistance"
            );
            this.totalSpeedDrive = this.calculatePercentage(this.totalSpeedDrive1, this.totalmiles);
            this.top5HarshAcc = this.getTop5By(res.vinLevelStats, "harshAcc");
            this.top5HarshCorner = this.getTop5By(res.vinLevelStats, "harshCornering");
            this.top5Harshbrak = this.getTop5By(res.vinLevelStats, "harshBrake");
            this.top5nightDrive = this.getTop5By(
              res.vinLevelStats,
              "nightDistance"
            );
            this.top5overSpeeding = this.getTop5By(
              res.vinLevelStats,
              "overspeedingDistance"
            );
            this.cardsFlag = true;
            this.isLoading = false;
            this.harshAcceleration = {
              series: [
                {
                  name: "Harsh Acceleration",
                  data: this.top5HarshAcc[1].map(category => this.formatCategory(category)),
                },
              ],

              legend: {
                show: false,
                position: "bottom",
                horizontalAlign: "left",
                verticalAlign: "middle",
                floating: false,
                fontSize: "12px",
                offsetX: 0,
                offsetY: 10,
                markers: {
                  size: 7,
                  shape: "rectangle",
                },
              },
              chart: {
                type: "bar",
                stacked: false,
                height: 140,
                width: "100%",
                zoom: {
                  show: false,
                },
                toolbar: {
                  show: false,
                },
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  columnWidth: "70%",
                  borderRadiusApplication: "end",
                  borderRadius: 6,
                  dataLabels: {
                    enabled: true,
                    position: "top",
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                show: true,
                width: 0,
                colors: ["transparent"],
              },
              colors: ["#7EA6FE"],
              fill: {
                opacity: 1
              },
              labels: ["Harsh Acceleration"],

              xaxis: {
                categories: this.top5HarshAcc[0].map(category => this.formatCategory(category)),
                tickAmount: 4,
                // min: 0,
                // max: 100,
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
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                  formatter: function (value) {
                    return value >= 1000
                      ? (value / 1000).toFixed(1) + "k"
                      : value;
                  },
                },
              },
              yaxis: {
                labels: {
                  show: true,
                  style: {
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                  formatter: function (value) {
                    return value >= 1000
                      ? (value / 1000).toFixed(1) + "k"
                      : value;
                  },
                },
              },
              tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                  // Get the value of the hovered bar
                  const value = series[seriesIndex][dataPointIndex];
                  let colors = [
                    "#7EA7FF",
                    "#B6CDFF",
                    "#BDBDBD",
                    "#FFD0AF",
                    "#55D3A9",
                  ];

                  // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                  return `
                  <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                    <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value}
                    <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                  </div>
                `;
                },
                x: {
                  show: false, // This hides the x-axis values in the tooltip
                },
              },
              grid: {
                show: true,
                borderColor: "#404040",
                strokeDashArray: 2,
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
                //   row: {
                //     colors:["#404040"],
                //     opacity: 0.8
                // },
              },
            };
            this.harshBraking = {
              series: [
                {
                  name: "Harsh Braking",
                  data: this.top5Harshbrak[1].map(category => this.formatCategory(category)),
                },
              ],

              legend: {
                show: false,
                position: "bottom",
                horizontalAlign: "left",
                verticalAlign: "middle",
                floating: false,
                fontSize: "12px",
                offsetX: 0,
                offsetY: 10,
                markers: {
                  size: 7,
                  shape: "rectangle",
                },
              },
              chart: {
                type: "bar",
                stacked: false,
                height: 140,
                width: "100%",
                zoom: {
                  show: false,
                },
                toolbar: {
                  show: false,
                },
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  columnWidth: "70%",
                  borderRadiusApplication: "end",
                  borderRadius: 6,
                  dataLabels: {
                    enabled: true,
                    position: "top",
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                show: true,
                width: 0,
                colors: ["transparent"],
              },
              colors: ["#FFD0AF"],
              fill: {
                opacity: 1
              },
              labels: ["Harsh Braking"],

              xaxis: {
                categories: this.top5Harshbrak[0].map(category => this.formatCategory(category)),
                tickAmount: 4,
                // min: 0,
                // max: 100,
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
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                  formatter: function (value) {
                    return value >= 1000
                      ? (value / 1000).toFixed(1) + "k"
                      : value;
                  },
                },
              },
              yaxis: {
                labels: {
                  show: true,
                  style: {
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                },
              },
              tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                  // Get the value of the hovered bar
                  const value = series[seriesIndex][dataPointIndex];
                  let colors = [
                    "#7EA7FF",
                    "#B6CDFF",
                    "#BDBDBD",
                    "#FFD0AF",
                    "#55D3A9",
                  ];

                  // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                  return `
                  <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                    <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value}
                    <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                  </div>
                `;
                },
                x: {
                  show: false, // This hides the x-axis values in the tooltip
                },
              },
              grid: {
                show: true,
                borderColor: "#404040",
                strokeDashArray: 2,
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
                //   row: {
                //     colors:["#404040"],
                //     opacity: 0.8
                // },
              },
            };
            this.harshCornering = {
              series: [
                {
                  name: "Harsh Cornering",
                  data: this.top5HarshCorner[1].map(category => this.formatCategory(category)),
                },
              ],

              legend: {
                show: false,
                position: "bottom",
                horizontalAlign: "left",
                verticalAlign: "middle",
                floating: false,
                fontSize: "12px",
                offsetX: 0,
                offsetY: 10,
                markers: {
                  size: 7,
                  shape: "rectangle",
                },
              },
              chart: {
                type: "bar",
                stacked: false,
                height: 140,
                width: "100%",
                zoom: {
                  show: false,
                },
                toolbar: {
                  show: false,
                },
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  columnWidth: "70%",
                  borderRadiusApplication: "end",
                  borderRadius: 6,
                  dataLabels: {
                    enabled: true,
                    position: "top",
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                show: true,
                width: 0,
                colors: ["transparent"],
              },
              colors: ["#B3CBFF"],
              fill: {
                opacity: 1
              },
              labels: ["Harsh Cornering"],

              xaxis: {
                categories: this.top5HarshCorner[0].map(category => this.formatCategory(category)),
                tickAmount: 4,
                // min: 0,
                // max: 100,
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
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                  formatter: function (value) {
                    return value >= 1000
                      ? (value / 1000).toFixed(1) + "k"
                      : value;
                  },
                },
              },
              yaxis: {
                labels: {
                  show: true,
                  style: {
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                },
              },
              tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                  // Get the value of the hovered bar
                  const value = series[seriesIndex][dataPointIndex];
                  let colors = [
                    "#7EA7FF",
                    "#B6CDFF",
                    "#BDBDBD",
                    "#FFD0AF",
                    "#55D3A9",
                  ];

                  // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                  return `
                  <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                    <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value}
                    <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                  </div>
                `;
                },
                x: {
                  show: false, // This hides the x-axis values in the tooltip
                },
              },
              grid: {
                show: true,
                borderColor: "#404040",
                strokeDashArray: 2,
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
                //   row: {
                //     colors:["#404040"],
                //     opacity: 0.8
                // },
              },
            };
            // Create an array to store data for rendering
            const barData = this.top5nightDrive[1].map((value, index) => ({
              value,
              category: this.top5nightDrive[0][index]
            }));

            // Separate data into categories with bars and without bars
            const bars = barData.filter(item => item.value <= 100);
            const noBars = barData.filter(item => item.value > 100);

            // Extract filtered values and categories
            const filteredValues = bars.map(item => item.value);
            const filteredCategories = bars.map(item => item.category);

            // Create a mapping for all categories with empty values for categories without bars
            const allCategories = this.top5nightDrive[0].map(category => this.formatCategory(category));
            const allValues = this.top5nightDrive[1].map((value) => (value <= 100 ? value : 0)) // Use null for values > 100

            this.nightDrive = {
              series: [
                {
                  name: "Night Driving",
                  data: allValues,
                },
              ],

              legend: {
                show: false,
                position: "bottom",
                horizontalAlign: "left",
                verticalAlign: "middle",
                floating: false,
                fontSize: "12px",
                offsetX: 0,
                offsetY: 10,
                markers: {
                  size: 7,
                  shape: "rectangle",
                },
              },
              chart: {
                type: "bar",
                stacked: false,
                height: 140,
                width: "100%",
                zoom: {
                  show: false,
                },
                toolbar: {
                  show: false,
                },
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  columnWidth: "70%",
                  borderRadiusApplication: "end",
                  borderRadius: 6,
                  dataLabels: {
                    enabled: true,
                    position: "top",
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                show: true,
                width: 0,
                colors: ["transparent"],
              },
              colors: ["#BDBDBD"],
              fill: {
                opacity: 1,
              },
              labels: ["Night Percentage"],

              xaxis: {
                categories: allCategories, // Show all categories (VINs)
                labels: {
                  formatter: function (value) {
                    // Format the label to show as a percentage
                    return `${value}%`;
                  },
                  show: true,
                  style: {
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                },
                axisBorder: {
                  show: false // Removes the x-axis border
                },
                axisTicks: {
                  show: false // Removes the ticks on the x-axis
                },
                min: 0,   // Set minimum value for x-axis
                max: 100, // Set maximum value for x-axis
                tickAmount: 4, // Number of ticks on the x-axis
              },
              lines: {
                show: false, // Ensure no lines are shown
              },


              yaxis: {
                labels: {
                  show: true,
                  style: {
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                },
              },
              tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                  // Get the value of the hovered bar
                  const value = series[seriesIndex][dataPointIndex];
                  // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                  return `
        <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
          <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value !== null ? value + ' %' : 'No Data'}
          <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
        </div>
      `;
                },
                x: {
                  show: false,
                },
              },
              grid: {
                show: true,
                borderColor: "#404040",
                strokeDashArray: 2,
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
            };

            this.overSpeeding = {
              series: [
                {
                  name: "Over Speeding",
                  data: this.top5overSpeeding[1].map((value) => (value <= 100 ? value : 0)), // Set data to 0 if value is greater than 100
                },
              ],

              legend: {
                show: false,
                position: "bottom",
                horizontalAlign: "left",
                verticalAlign: "middle",
                floating: false,
                fontSize: "12px",
                offsetX: 0,
                offsetY: 10,
                markers: {
                  size: 7,
                  shape: "rectangle",
                },
              },
              chart: {
                type: "bar",
                stacked: false,
                height: 140,
                width: "100%",
                zoom: {
                  show: false,
                },
                toolbar: {
                  show: false,
                },
              },
              plotOptions: {
                bar: {
                  horizontal: true,
                  columnWidth: "70%",
                  borderRadiusApplication: "end",
                  borderRadius: 6,
                  dataLabels: {
                    enabled: true,
                    position: "top",
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              stroke: {
                show: true,
                width: 0,
                colors: ["transparent"],
              },
              colors: ["#ff8f8f"],
              fill: {
                opacity: 1
              },
              labels: ["Over Speeding"],

              xaxis: {
                categories: this.top5overSpeeding[0].map(category => this.formatCategory(category)),
                labels: {
                  formatter: function (value) {
                    // Assuming the value is a percentage. Adjust this if needed.
                    return `${value}%`;
                  },
                  show: true,
                  style: {
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-x",
                  },
                },
                axisBorder: {
                  show: false // Removes the x-axis border
                },
                axisTicks: {
                  show: false // Removes the ticks on the x-axis
                },
                tickAmount: 4,
                min: 0,
                max: 100,
                lines: {
                  show: false,
                },
              },
              yaxis: {
                labels: {
                  show: true,
                  style: {
                    colors: "#000000",
                    fontSize: "12px",
                    fontWeight: 500,
                    cssClass: "chart-label-y",
                  },
                },
              },
              tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                  // Get the value of the hovered bar
                  const value = series[seriesIndex][dataPointIndex];
                  // Hide x-axis labels in the tooltip by not including them in the custom tooltip
                  return `
                  <div style="position: relative; background-color:${w.config.colors[seriesIndex]}; color: #FFFFFF; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px; text-align:center;">
                    <div style="font-weight:500; font-family:'Poppins'"> ${w.config.labels[seriesIndex]}</div>${value.toFixed(2) + ' %'}
                    <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                  </div>
                `;
                },
              },
              grid: {
                show: true,
                borderColor: "#404040",
                strokeDashArray: 2,
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
                //   row: {
                //     colors:["#404040"],
                //     opacity: 0.8
                // },
              },
            };
          },
          (err) => {

            this.spinner.hide();
            if (err?.error?.apierror?.status === "UNPROCESSABLE_ENTITY") {
              this.appService.openSnackBar("Data not found for selected months.", "Error");
              this.NewData = true
            }
          }
        );
      }
  }
  NewData: boolean = false;
  getTop5By(data: any[], category: string): any[] {
    // Sort by the given category in descending order, ensuring alias can be null
    const sortedData = data
      .sort((a, b) => (b[category] ?? 0) - (a[category] ?? 0))
      .slice(0, 5); // Take top 5 values

    // Process alias values for display
    const cxVinArray = sortedData.map((item) =>
      item.alias === null
        ? null // Show null explicitly if alias is null
        : item.alias.length === 17 && /^[A-Za-z0-9]+$/.test(item.alias)
          ? `**${item.alias.slice(-3)}`  // Mask last 3 characters for 17-character VINs
          : item.alias
    );

    const categoryArray = sortedData.map((item) => String(item[category] ?? 0));
    const miles = sortedData.map((item) => String(item.avgMileage ?? 0));

    return [cxVinArray, categoryArray, miles];
  }
  getTotalByCategory(data: any[], category: string): number {
    return data.reduce((total, item) => total + item[category], 0);
  }
  // Top 5 Risky Driver Right Chart End
  // For Driver Behavior score
  async getDriverScores() {
    this.driverScores = []
    this.subscription$.add(
      await this.dashboardservice.totalDriverScoreAdmin(this.customConsumer).subscribe((res: any) => {
        this.driverScores.push(res.r0_20)
        this.driverScores.push(res.r20_40)
        this.driverScores.push(res.r40_60)
        this.driverScores.push(res.r60_80)
        this.driverScores.push(res.r80_100)
        this.driverScores.push(res.r_na)
        this.driverScoreChart()
      }, err => {
      }))
  }
  async getDriverScoresFleets() {
    this.driverScores = []
    this.subscription$.add(
      await this.dashboardservice.totalDriverScoreFleets(this.customConsumer,this.fleetIdData, this.groupIdData).subscribe((res: any) => {
        this.driverScores.push(res.r0_20)
        this.driverScores.push(res.r20_40)
        this.driverScores.push(res.r40_60)
        this.driverScores.push(res.r60_80)
        this.driverScores.push(res.r80_100)
        this.driverScores.push(res.r_na)
        this.driverScoreChart()
      }, err => {
      }))
  }
  driverScoreChart() {
    this.totalDrivers= this.driverScores.reduce((acc, curr) => acc + curr, 0);
    this.donutchart2 = {
      chart: {
        height: 300,
        type: 'donut',
      },
      series: this.driverScores,
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
      stroke: {
        show: true, // Show stroke for better definition
        width: 0,   // Adjust stroke width for rounding effect
        colors: ['#fff'], // Set stroke color to white for separation
      },
      xaxis: {
        labels: {
          rotate: -45
        },
        categories: [
          "Apples",
          "Oranges",
          "Strawberries",
          "Pineapples",
          "Mangoes",
          "dklshidofh"
        ],
        tickPlacement: "on"
      },
      labels: ['(0-20) Very Risky', '(21-40) Risky', '(41-60) Moderate', '(61-80) Good', '(81-100) Very Good', 'NA'],
      colors: ['#ff0000', '#FF4D4D', '#FA751F', '#95D3BF', '#2CA87F', '#DBDCDD'],
    };

    this.showLegendsAndValues = true;
  }

  // Seatbelt Violation
  getSeatBelt() {
    this.dataHide = true;
    this.dataShow = false;
    this.dashboardservice.getSeatBeltUsageSafety(this.customConsumer, this.fleetIdData, this.groupIdData,).subscribe((data: any) => {
      this.filterTopVins(data);

    }, err => {
      this.dataHide = true;
      this.dataShow = false;
    })
  }
  topfiveSearBelt(data) {
    let labelDataSearBelt = [];
    let seriesDataSeatBelt = [];
    data.map((item) => {
      labelDataSearBelt.push(item?.VIN);
      seriesDataSeatBelt.push(item.countDriver);
    });
    this.chartOptionsseatBelts = {
      series: [
        {
          name: "Seatbelt Violations",
          data: seriesDataSeatBelt
        }
      ],
      chart: {
        height: 350,
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
          // barHeight: '70%',
          borderRadius: 10,
          borderRadiusApplication: "end",
          columnWidth: data.length === 1 ? "10%" : "30%",
          distributed: true,
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
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: "vertical",
          shadeIntensity: 0.3,
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      colors: [
        "#FF8D8D",
        "#FF8D8D",
        "#FF8D8D",
        "#FF8D8D",
        "#FF8D8D",
      ],
      dataLabels: {
        enabled: true,
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
        strokeDashArray: 7,
      },
      xaxis: {
        categories: labelDataSearBelt.map(category => this.formatCategory(category)),
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "VIN"
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
      yaxis: {

        tickAmount:5,
        min:0,
        title: {
          offsetX: 0,
          offsetY: 0,
          text: "Count of Violation"
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: (value) => {
            if (value === 0) return "0"; // Ensure 0 is displayed as "0" instead of "0k"
            if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
            if (value >= 1000 ) return `${(value / 1000).toFixed(1)}k`;
            if (value >= 0 && value <= 1000) return `${value}`;
            if (value = 0.0 ) return `12`;
            return value.toFixed(0);
          },
        },
      }

    };
  }
  filterTopVins(data: any) {
    this.topFiveVins = data.topFiveSeatBeltViolation
      .filter(entry => entry.seatbelt_alert_count_driver > this.threshold)
      .slice(0, 5)
      .map(entry => ({
        VIN: entry.alias && entry.alias.length === 17 ? this.maskVin(entry.alias) : entry.alias,
        countDriver: entry.seatbelt_alert_count_driver
      }));
    this.topfiveSearBelt(this.topFiveVins)
  }


  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    },10);
    // this.updateDasboard()
  }
  formatCategory(category: string): string {
    const words = category.split(' ');
    if (words.length < 2) return category; // If there's only one word, return as is
    return `${words[0].slice(0, 2)}...${words[words.length - 1]}`;
  }

  ngOnDestroy(): void {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }
}
