import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { TaxonomyService } from "../../../taxonomy.service";
import { Subscription } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}
interface AdasWarningLatestData {
  categories: any[];
  fwAudioWarningCountPerMile: any[];
  absCountPerMiles: any[]; // Add this line to the type definition
  tractionBrakeWarningCountPerMile: any[];
  blindSpotWarningCountPerMile: any[];
  collisionMitigationBrakeSignalCountPerMile: any[];
}

@Component({
  selector: 'app-adas-dashboard',
  templateUrl: './adas-dashboard.component.html',
  styleUrls: ['./adas-dashboard.component.scss']
})
export class AdasDashboardComponent implements OnInit {
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;
  searchByStatus: any
  searchbyAlerts: any;
  searchbyLatestEvents: any;
  subscription$: Subscription = new Subscription();
  dataOfMonths = [
    { label: 'Last 30 Days', value: 1 },
    { label: 'Last 90 Days', value: 3 },
    { label: 'Last 6 Months', value: 6 },
    { label: 'Last 12 Months', value: 12 },
  ];
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  consumer: any = "All";
  monthData: any;
  dateRange: any
  // selectedPeriod: any;
  hoveredEventType: string = '';
  selectedTimePeriod: string = '';
  detailData: any = {};
  detailDataReport: any;
  tableData: any;
  chartOptions: any;
  dataShow: boolean = false;
  downloadReport: any;
  dataForTable: any;
  eventTripSnapshot: any;
  result: any;
  selectedPeriod: any = '6';
  adasWarning: any;
  adasWarningLatestData: any;
  dataSharing: any;
  chartOptionsPerMile: any;
  isSidebarHidden = false;
  selectedTimePeriodss: number = 6;
  dataResponse: any;
  fleetIdValueNew: any;
  groupList: any;
  constructor(public toaster: ToastrService, public http: HttpClient, private dashboardservice: TaxonomyService) { }

  ngOnInit() {
    this.showRole();
    this.selectConsumers()
    this.updateDasboard();
  }
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem("userRole"));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem("multiRole"));
    let customConsumers = JSON.stringify(
      sessionStorage.getItem("custom-consumer")
    );
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

  closeMonthFilter(){
    this.fetchWarningSummary()
    this.adasDetailsTopData()
    this.adasWarningMonth()
    this.adasWarningMonthPerMile()
  }
  async onTimePeriodChanges(event: number) {
    this.selectedTimePeriodss = event;
    if (event === 1) {
      this.adasDetailsTopData()
      this.adasWarningWeek()
      this.adasWarningWeekPerMile()
      this.fetchWarningSummary()
    }
    else {
      this.adasDetailsTopData()
      this.adasWarningMonth()
      this.adasWarningMonthPerMile()
      this.fetchWarningSummary()
    }
  }
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
  async selectConsumer(consumer: string) {
    this.consumer = consumer;
    this.adasDetailsTopData()
    this.adasWarningMonth()
    this.adasWarningMonthPerMile()
    this.fetchWarningSummary()
    this.selectConsumers();
    if (this.consumer && this.consumerList) { // ✅ Ensure consumerList is defined
      const normalizedConsumer = this.consumer.trim().toLowerCase();
      const selected = this.consumerList.find((item) =>
        item?.name?.trim().toLowerCase() === normalizedConsumer
      );

      if (selected) {
        this.dateRange = this.formatDatedForActive(selected.startDate);
      } else {
        this.dateRange = null;
      }
    } else {
      console.warn("Consumer list is not available or is empty");
      this.dateRange = null; // Reset dateRange if consumerList is unavailable
    }
  }
  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }
  clearFleetSelection() {

  }

  groupIdData: any;
  selectGroupId() {
    if (!this.fleetIdData) return;

    this.subscription$.add(
      this.dashboardservice.getOrganizationSubGroups(this.fleetIdData, this.consumer).subscribe((res: any) => {
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


  selectFleetId() {
    this.selectGroupId()
    this.adasDetailsTopData()
    this.adasWarningMonth()
    this.adasWarningMonthPerMile()
    this.fetchWarningSummary()
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.adasDetailsTopData()
    this.adasWarningMonth()
    this.adasWarningMonthPerMile()
    this.fetchWarningSummary()
  }
  clearFleetId() {
    this.updateDasboard()
  }
  updateDasboard() {
    this.fetchWarningSummary()
    this.adasDetailsTopData()
    this.adasWarningMonth()
    this.adasWarningMonthPerMile()

  }
  maskVinNumberr(vin: string): string {
    if (vin && vin.length >= 3) { // Add a null check for vin
      return '***' + vin.slice(-3);
    } else {
      return vin;
    }
  }
  loading: boolean = true
  // Top 3 box data
  adasDetailsTopData() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this.dashboardservice.adasDetailCount(this.consumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss)
          .subscribe({
            next: (res: any) => {
              this.detailData = res;
            },
            error: (error) => {
              this.handleApiError(error);
              this.detailData = null;
            }
          })
      )
    }
    else if (this.user != 'admin') {
      this.subscription$.add(
        this.dashboardservice.adasDetailCount(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss)
          .subscribe({
            next: (res: any) => {
              this.detailData = res;
            },
            error: (error) => {
              this.handleApiError(error);
              this.detailData = null; // Reset or handle the UI accordingly
            }
          })
      )
    }
  }
  // For ADAS warning filter of months
  adasWarningMonth() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarning(this.consumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          // Sort yearMonth in ascending order (oldest first)
          const sortedData = res.totalCountADASMonthWeekWiseList.sort((a: any, b: any) => a.yearMonth.localeCompare(b.yearMonth));

          // Format yearMonth as "MMM'YY" (e.g., "Oct'24")
          const formattedMonths = sortedData.map(item => {
            const [year, month] = item.yearMonth.split("-");
            return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" }) + "'" + year.slice(2);
          });

          // Extract Active and Resolved counts
          const fwAudioWarningCount = sortedData.map(item => item.fwAudioWarningCount);
          const absCount = sortedData.map(item => item.absCount);
          const tractionBrakeWarningCount = sortedData.map(item => item.tractionBrakeWarningCount);
          const blindSpotWarningCount = sortedData.map(item => item.blindSpotWarningCount);
          const collisionMitigationbrakesignalCount = sortedData.map(item => item.collisionMitigationbrakesignalCount);

          this.adasWarning = {
            categories: formattedMonths,
            fwAudioWarningCount,
            absCount,
            tractionBrakeWarningCount,
            blindSpotWarningCount,
            collisionMitigationbrakesignalCount
          };
          this.highLowChart();
        }, error => {
          console.error("Error fetching DTC data:", error);
          // this.loadData = false; // Stop loading on error
        })
      )
    }
    else if (this.user != 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarning(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          // Sort yearMonth in ascending order (oldest first)
          const sortedData = res.totalCountADASMonthWeekWiseList.sort((a: any, b: any) => a.yearMonth.localeCompare(b.yearMonth));

          // Format yearMonth as "MMM'YY" (e.g., "Oct'24")
          const formattedMonths = sortedData.map(item => {
            const [year, month] = item.yearMonth.split("-");
            return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" }) + "'" + year.slice(2);
          });

          // Extract Active and Resolved counts
          const fwAudioWarningCount = sortedData.map(item => item.fwAudioWarningCount);
          const absCount = sortedData.map(item => item.absCount);
          const tractionBrakeWarningCount = sortedData.map(item => item.tractionBrakeWarningCount);
          const blindSpotWarningCount = sortedData.map(item => item.blindSpotWarningCount);
          const collisionMitigationbrakesignalCount = sortedData.map(item => item.collisionMitigationbrakesignalCount);

          this.adasWarning = {
            categories: formattedMonths,
            fwAudioWarningCount,
            absCount,
            tractionBrakeWarningCount,
            blindSpotWarningCount,
            collisionMitigationbrakesignalCount
          };
          this.highLowChart();
        }, error => {
          console.error("Error fetching DTC data:", error);
          // this.loadData = false; // Stop loading on error
        })
      )
    }
  }
  highLowChart() {
    const fwAudioWarningCount = this.adasWarning.fwAudioWarningCount;
    const absCount = this.adasWarning.absCount;
    const tractionBrakeWarningCount = this.adasWarning.tractionBrakeWarningCount;
    const blindSpotWarningCount = this.adasWarning.blindSpotWarningCount;
    const collisionMitigationbrakesignalCount = this.adasWarning.collisionMitigationbrakesignalCount;

    const allData = [fwAudioWarningCount, absCount, tractionBrakeWarningCount, blindSpotWarningCount, collisionMitigationbrakesignalCount];
    let yAxisMax = Math.max(...allData.reduce((acc, val) => acc.concat(val), [])); // Get max value

    this.chartOptions = {
      series: [
        { name: 'Forward Collision', data: fwAudioWarningCount },
        { name: 'ABS', data: absCount },
        { name: 'Traction Brake Control', data: tractionBrakeWarningCount },
        { name: 'Blind Spot', data: blindSpotWarningCount },
        { name: 'Collision Mitigation', data: collisionMitigationbrakesignalCount }
      ],
      colors: ["#0000FF", '#ff0000', '#2CA87F', '#FA751A', '#000'],
      chart: {
        height: 300,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        events: {
          legendClick: (chartContext, seriesIndex, config) => {
            setTimeout(() => {
              const visibleSeries = config.globals.series
                .map((s, i) => (config.globals.collapsedSeriesIndices.includes(i) ? [] : s))
                .reduce((acc, val) => acc.concat(val), []);

              const newYAxisMax = visibleSeries.length > 0 ? Math.max(...visibleSeries) : 10;

              chartContext.updateOptions({
                yaxis: {
                  min: 0, // Ensures Y-axis starts from 0
                  max: newYAxisMax,
                  tickAmount:5,
                  labels: {
                    style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
                    formatter: (value) => {
                      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
                      return value.toString();
                    }
                  }
                }
              });
            }, 50);
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: 'smooth' },
      grid: { show: false },
      xaxis: {
        categories: this.adasWarning.categories,
        title: { text: "Month", offsetX: -10, offsetY: -13 },
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" } }
      },
      yaxis: {
        title: { text: "ADAS Warnings", offsetX: -8 },
        min: 0, // Ensures Y-axis always starts from 0
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
          formatter: (value) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
            return value.toString();
          }
        }
      },
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex];
          const seriesName = w.globals.seriesNames[seriesIndex];
          const backgroundColor = w.globals.colors[seriesIndex];

          return `
            <div style="background-color: ${backgroundColor}; color: white; font-family: 'Poppins'; font-size: 12px; padding: 8px 12px; border-radius: 8px;">
              <strong> ${seriesName} :</strong> ${value.toLocaleString()}
            </div>
          `;
        }
      }
    };
  }

  // For filter of months end
  // For ADAS warning filter of weeks
  adasWarningWeek() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarning(this.consumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          const sortedData = res.totalCountADASMonthWeekWiseList.sort((a: any, b: any) => new Date(a.weekEnd).getTime() - new Date(b.weekEnd).getTime());
          const formattedWeeks = sortedData.map(item => new Date(item.weekEnd).toISOString().split("T")[0]);
          // Extract Active and Resolved counts
          const fwAudioWarningCount = sortedData.map(item => item.fwAudioWarningCount);
          const absCount = sortedData.map(item => item.absCount);
          const tractionBrakeWarningCount = sortedData.map(item => item.tractionBrakeWarningCount);
          const blindSpotWarningCount = sortedData.map(item => item.blindSpotWarningCount);
          const collisionMitigationbrakesignalCount = sortedData.map(item => item.collisionMitigationbrakesignalCount);

          this.adasWarning = {
            categories: formattedWeeks,
            fwAudioWarningCount,
            absCount,
            tractionBrakeWarningCount,
            blindSpotWarningCount,
            collisionMitigationbrakesignalCount
          };
          this.highLowChartWeek();
        }, error => {
          console.error("Error fetching DTC data:", error);
          // this.loadData = false; // Stop loading on error
        })
      )
    }
    else if (this.user != 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarning(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          const sortedData = res.totalCountADASMonthWeekWiseList.sort((a: any, b: any) => new Date(a.weekEnd).getTime() - new Date(b.weekEnd).getTime());
          const formattedWeeks = sortedData.map(item => new Date(item.weekEnd).toISOString().split("T")[0]);
          const fwAudioWarningCount = sortedData.map(item => item.fwAudioWarningCount);
          const absCount = sortedData.map(item => item.absCount);
          const tractionBrakeWarningCount = sortedData.map(item => item.tractionBrakeWarningCount);
          const blindSpotWarningCount = sortedData.map(item => item.blindSpotWarningCount);
          const collisionMitigationbrakesignalCount = sortedData.map(item => item.collisionMitigationbrakesignalCount);

          this.adasWarning = {
            categories: formattedWeeks,
            fwAudioWarningCount,
            absCount,
            tractionBrakeWarningCount,
            blindSpotWarningCount,
            collisionMitigationbrakesignalCount
          };
          this.highLowChartWeek();
        }, error => {
          console.error("Error fetching DTC data:", error);
          // this.loadData = false; // Stop loading on error
        })
      )
    }
  }
  highLowChartWeek() {
    const fwAudioWarningCount = this.adasWarning.fwAudioWarningCount;
    const absCount = this.adasWarning.absCount;
    const tractionBrakeWarningCount = this.adasWarning.tractionBrakeWarningCount;
    const blindSpotWarningCount = this.adasWarning.blindSpotWarningCount;
    const collisionMitigationbrakesignalCount = this.adasWarning.collisionMitigationbrakesignalCount;

    const allData = [fwAudioWarningCount, absCount, tractionBrakeWarningCount, blindSpotWarningCount, collisionMitigationbrakesignalCount];
    let yAxisMax = Math.max(...allData.reduce((acc, val) => acc.concat(val), [])); // Get max value

    this.chartOptions = {
      series: [
        { name: 'Forward Collision', data: fwAudioWarningCount },
        { name: 'ABS', data: absCount },
        { name: 'Traction Brake Control', data: tractionBrakeWarningCount },
        { name: 'Blind Spot', data: blindSpotWarningCount },
        { name: 'Collision Mitigation', data: collisionMitigationbrakesignalCount }
      ],
      colors: ["#0000FF", '#ff0000', '#2CA87F', '#FA751A', '#000'],
      chart: {
        height: 300,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        events: {
          legendClick: (chartContext, seriesIndex, config) => {
            setTimeout(() => {
              const visibleSeries = config.globals.series
                .map((s, i) => (config.globals.collapsedSeriesIndices.includes(i) ? [] : s))
                .reduce((acc, val) => acc.concat(val), []);

              const newYAxisMax = visibleSeries.length > 0 ? Math.max(...visibleSeries) : 10;

              chartContext.updateOptions({
                yaxis: {
                  min: 0, // Ensures Y-axis starts from 0
                  max: newYAxisMax,
                  tickAmount:5,
                  labels: {
                    style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
                    formatter: (value) => {
                      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                      if (value >= 1_000) return `${Math.round(value / 1_000)}k`; // Rounded without decimal
                      return value.toFixed(0); // Whole number for values < 1,000
                    }
                  }
                }
              });
            }, 50);
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: 'smooth' },
      grid: { show: false },
      xaxis: {
        categories: this.adasWarning.categories,
        title: { text: "Week", offsetX: -10, offsetY: -13 },
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" } }
      },
      yaxis: {
        title: { text: "ADAS Warnings", offsetX: -8 },
        min: 0, // Ensures Y-axis always starts from 0
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
          formatter: (value) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
            return value.toString();
          }
        }
      },
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex];
          const seriesName = w.globals.seriesNames[seriesIndex];
          const backgroundColor = w.globals.colors[seriesIndex];

          return `
            <div style="background-color: ${backgroundColor}; color: white; font-family: 'Poppins'; font-size: 12px; padding: 8px 12px; border-radius: 8px;">
              <strong> ${seriesName} :</strong> ${value.toLocaleString()}
            </div>
          `;
        }
      }
    };
  }
  getFormattedNumber(value: number) {
    return value?.toLocaleString('en-US');
  }
  // For filter of weeks end
  // For ADAS warning by miles filter of months
  adasWarningMonthPerMile() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarningPerMile(this.consumer, this.fleetIdData,this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          // Sort yearMonth in ascending order (oldest first)
          const sortedData = res.totalADASMilesPerMonthWises.sort((a: any, b: any) => a.yearMonth.localeCompare(b.yearMonth));

          // Format yearMonth as "MMM'YY" (e.g., "Oct'24")
          const formattedMonths = sortedData.map(item => {
            const [year, month] = item.yearMonth.split("-");
            return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" }) + "'" + year.slice(2);
          });

          // Extract Active and Resolved counts
          const fwAudioWarningCountPerMile = sortedData.map(item => item.fwAudioWarningCountPerMile);
          const absCountPerMile = sortedData.map(item => item.absCountPerMile);
          const tractionBrakeWarningCountPerMile = sortedData.map(item => item.tractionBrakeWarningCountPerMile);
          const blindSpotWarningCountPerMile = sortedData.map(item => item.blindSpotWarningCountPerMile);
          const collisionMitigationBrakeSignalCountPerMile = sortedData.map(item => item.collisionMitigationBrakeSignalCountPerMile);

          this.dataSharing = {
            categories: formattedMonths,
            fwAudioWarningCountPerMile,
            absCountPerMile,
            tractionBrakeWarningCountPerMile,
            blindSpotWarningCountPerMile,
            collisionMitigationBrakeSignalCountPerMile
          };
          this.adasWarningMonthPerMileChart();
        }, error => {
          console.error("Error fetching DTC data:", error);
        })
      )
    }
    else if (this.user != 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarningPerMile(this.customConsumer, this.fleetIdData,this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          // Sort yearMonth in ascending order (oldest first)
          const sortedData = res.totalADASMilesPerMonthWises.sort((a: any, b: any) => a.yearMonth.localeCompare(b.yearMonth));

          // Format yearMonth as "MMM'YY" (e.g., "Oct'24")
          const formattedMonths = sortedData.map(item => {
            const [year, month] = item.yearMonth.split("-");
            return new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" }) + "'" + year.slice(2);
          });

          // Extract Active and Resolved counts
          const fwAudioWarningCountPerMile = sortedData.map(item => item.fwAudioWarningCountPerMile);
          const absCountPerMile = sortedData.map(item => item.absCountPerMile);
          const tractionBrakeWarningCountPerMile = sortedData.map(item => item.tractionBrakeWarningCountPerMile);
          const blindSpotWarningCountPerMile = sortedData.map(item => item.blindSpotWarningCountPerMile);
          const collisionMitigationBrakeSignalCountPerMile = sortedData.map(item => item.collisionMitigationBrakeSignalCountPerMile);

          this.dataSharing = {
            categories: formattedMonths,
            fwAudioWarningCountPerMile,
            absCountPerMile,
            tractionBrakeWarningCountPerMile,
            blindSpotWarningCountPerMile,
            collisionMitigationBrakeSignalCountPerMile
          };
          this.adasWarningMonthPerMileChart();
        }, error => {
          console.error("Error fetching DTC data:", error);
        })
      )
    }
  }
  adasWarningMonthPerMileChart() {
    const fwAudioWarningCountPerMile = this.dataSharing.fwAudioWarningCountPerMile;
    const absCountPerMile = this.dataSharing.absCountPerMile;
    const tractionBrakeWarningCountPerMile = this.dataSharing.tractionBrakeWarningCountPerMile;
    const blindSpotWarningCountPerMile = this.dataSharing.blindSpotWarningCountPerMile;
    const collisionMitigationBrakeSignalCountPerMile = this.dataSharing.collisionMitigationBrakeSignalCountPerMile;
    const allData = [fwAudioWarningCountPerMile, absCountPerMile, tractionBrakeWarningCountPerMile, blindSpotWarningCountPerMile,collisionMitigationBrakeSignalCountPerMile];
    let yAxisMax = Math.max(...allData.reduce((acc, val) => acc.concat(val), [])); // Get max value


    this.chartOptionsPerMile = {
      series: [
        { name: 'Forward Collision', data: fwAudioWarningCountPerMile },
        { name: 'ABS', data: absCountPerMile },
        { name: 'Traction Brake Control', data: tractionBrakeWarningCountPerMile },
        { name: 'Blind Spot', data: blindSpotWarningCountPerMile },
        { name: 'Collision Mitigation', data: collisionMitigationBrakeSignalCountPerMile }
      ],
      colors: ["#0000FF", '#ff0000', '#2CA87F', '#FA751A', '#000'],
      chart: {
        height: 300,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        events: {
          legendClick: (chartContext, seriesIndex, config) => {
            setTimeout(() => {
              const visibleSeries = config.globals.series
                .map((s, i) => (config.globals.collapsedSeriesIndices.includes(i) ? [] : s))
                .reduce((acc, val) => acc.concat(val), []);

              const newYAxisMax = visibleSeries.length > 0 ? Math.max(...visibleSeries) : 10;

              chartContext.updateOptions({
                yaxis: {
                  min: 0, // Ensures Y-axis starts from 0
                  max: newYAxisMax,
                  tickAmount:5,
                  labels: {
                    style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
                    formatter: (value) => {
                      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
                      return value.toString();
                    }
                  }
                }
              });
            }, 50);
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: 'smooth' },
      grid: { show: false },
      xaxis: {
        categories: this.dataSharing.categories,
        title: { text: "Month", offsetX: -10, offsetY: -13 },
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" } }
      },
      yaxis: {
        title: { text: "ADAS Warnings Per Mile", offsetX: 0 },
        min: 0, // Ensures Y-axis always starts from 0
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
          formatter: (value) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
            return value.toString();
          }
        }
      },
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex];
          const seriesName = w.globals.seriesNames[seriesIndex];
          const backgroundColor = w.globals.colors[seriesIndex];

          return `
            <div style="background-color: ${backgroundColor}; color: white; font-family: 'Poppins'; font-size: 12px; padding: 8px 12px; border-radius: 8px;">
              <strong> ${seriesName} :</strong> ${value.toLocaleString()}
            </div>
          `;
        }
      }
    };
  }

  // For ADAS warning by miles filter of months end
  // For ADAS warning by miles filter of week
  adasWarningWeekPerMile() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarningPerMile(this.consumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          const sortedData = res.totalADASMilesPerMonthWises.sort((a: any, b: any) => new Date(a.weekEnd).getTime() - new Date(b.weekEnd).getTime());
          const formattedWeeks = sortedData.map(item => new Date(item.weekEnd).toISOString().split("T")[0]);
          // Extract Active and Resolved counts
          const fwAudioWarningCountPerMile = sortedData.map(item => item.fwAudioWarningCountPerMile);
          const absCountPerMile = sortedData.map(item => item.absCountPerMile);
          const tractionBrakeWarningCountPerMile = sortedData.map(item => item.tractionBrakeWarningCountPerMile);
          const blindSpotWarningCountPerMile = sortedData.map(item => item.blindSpotWarningCountPerMile);
          const collisionMitigationBrakeSignalCountPerMile = sortedData.map(item => item.collisionMitigationBrakeSignalCountPerMile);

          this.dataSharing = {
            categories: formattedWeeks,
            fwAudioWarningCountPerMile,
            absCountPerMile,
            tractionBrakeWarningCountPerMile,
            blindSpotWarningCountPerMile,
            collisionMitigationBrakeSignalCountPerMile
          };
          this.adasWarningWeekPerMileChart()
        }, error => {
          console.error("Error fetching DTC data:", error);
        })
      )
    }
    else if (this.user != 'admin') {
      this.subscription$.add(
        this.dashboardservice.monthlyTrendsForAdasWarningPerMile(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss).subscribe((res: any) => {
          if (!res) {
            console.warn("Empty or invalid response");
            this.loading = false;
            return;
          }
          this.result = res;
          const sortedData = res.totalADASMilesPerMonthWises.sort((a: any, b: any) => new Date(a.weekEnd).getTime() - new Date(b.weekEnd).getTime());
          const formattedWeeks = sortedData.map(item => new Date(item.weekEnd).toISOString().split("T")[0]);
          // Extract Active and Resolved counts
          const fwAudioWarningCountPerMile = sortedData.map(item => item.fwAudioWarningCountPerMile.toFixed(2));
          const absCountPerMile = sortedData.map(item => item.absCountPerMile.toFixed(2));
          const tractionBrakeWarningCountPerMile = sortedData.map(item => item.tractionBrakeWarningCountPerMile.toFixed(2));
          const blindSpotWarningCountPerMile = sortedData.map(item => item.blindSpotWarningCountPerMile.toFixed(2));
          const collisionMitigationBrakeSignalCountPerMile = sortedData.map(item => item.collisionMitigationBrakeSignalCountPerMile.toFixed(2));

          this.dataSharing = {
            categories: formattedWeeks,
            fwAudioWarningCountPerMile,
            absCountPerMile,
            tractionBrakeWarningCountPerMile,
            blindSpotWarningCountPerMile,
            collisionMitigationBrakeSignalCountPerMile
          };
          this.adasWarningWeekPerMileChart()
        }, error => {
          console.error("Error fetching DTC data:", error);
        })
      )
    }
  }
  adasWarningWeekPerMileChart() {
    const fwAudioWarningCountPerMile = this.dataSharing.fwAudioWarningCountPerMile;
    const absCountPerMile = this.dataSharing.absCountPerMile;
    const tractionBrakeWarningCountPerMile = this.dataSharing.tractionBrakeWarningCountPerMile;
    const blindSpotWarningCountPerMile = this.dataSharing.blindSpotWarningCountPerMile;
    const collisionMitigationBrakeSignalCountPerMile = this.dataSharing.collisionMitigationBrakeSignalCountPerMile
    const maxValue = Math.max(...fwAudioWarningCountPerMile, ...absCountPerMile, ...tractionBrakeWarningCountPerMile, ...blindSpotWarningCountPerMile, ...collisionMitigationBrakeSignalCountPerMile); // Get highest value
    let yAxisMax = maxValue;
    this.chartOptionsPerMile = {
      series: [
        {
          name: 'Forward Collision',
          data: fwAudioWarningCountPerMile
        },
        {
          name: 'ABS',
          data: absCountPerMile
        },
        {
          name: 'Traction Brake Control',
          data: tractionBrakeWarningCountPerMile
        },
        {
          name: 'Blind Spot',
          data: blindSpotWarningCountPerMile
        },
        {
          name: 'Collision Mitigation',
          data: collisionMitigationBrakeSignalCountPerMile
        }
      ],
      colors: ["#0000FF", '#ff0000', '#2CA87F', '#FA751A', '#000'],
      chart: {
        height: 300,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: 'smooth' },
      grid: { show: false },
      xaxis: {
        categories: this.dataSharing.categories,
        title: { text: "Month", offsetX: -10, offsetY: -13 },
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
        },
      },
      yaxis: {
        title: { text: "ADAS Warnings Per Mile", offsetX: 0 },
        min: 0,
        max: 5,
        tickAmount: 5,
        labels: {
          style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
          formatter: (value) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 100_000) return `${(value / 100_000).toFixed(0)}L`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
            return value.toString();
          },
        },
      },
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const value = series[seriesIndex][dataPointIndex]; // Get value for the current point
          const seriesName = w.globals.seriesNames[seriesIndex]; // Get the name of the series
          const backgroundColor = w.globals.colors[seriesIndex]; // Get the color associated with the series

          return `
              <div style="background-color: ${backgroundColor}; color: white; font-family: 'Poppins'; font-size: 12px; padding: 8px 12px; border-radius: 8px;">
                <strong> ${seriesName} :</strong> ${value.toLocaleString()}
              </div>
            `;
        },
      },

    };
  }
  // For ADAS warning by miles filter of months end
  // table data
  detailDataNew: boolean = false
  filteredTableData: any[] = [];
  searchbyVinNumber: any;
  totalRecords: number = 20; // Set your total number of records
  pageNumber: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  pages: any[] = [];

  fetchWarningSummary() {
    const currentPage = this.pageNumber - 1; // Convert to zero-based index

    const fetchData = (consumer: any) => {
      this.subscription$.add(
        this.dashboardservice.getWarningSummary(consumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss, currentPage, this.pageSize)
          .subscribe({
            next: (res: any) => {
              if (res?.adasWarningsSummaries && res?.adasWarningsSummaries.length > 0) {
                this.dataResponse = res.adasWarningsSummaries || [];
                this.filteredTableData = [...this.dataResponse];
                this.totalPages = Math.ceil(res.totalRecords / this.pageSize) || 1;
                this.detailDataNew = false;
              } else {
                this.dataResponse = [];
                this.detailDataNew = true;
              }
            },
            error: (error) => {
              if (error?.error?.apierror?.message === "No active VIN found for the consumer and fleet Id") {
                this.dataResponse = [];
                this.filteredTableData = [];
                this.detailDataNew = true;
              } else {
                this.dataResponse = [];
                this.detailDataNew = true;
              }
            }
          })
      );
    };

    if (this.user === 'admin') {
      fetchData(this.consumer);
    } else {
      fetchData(this.customConsumer);
    }
  }

calculatePages() {
  this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  this.pages = this.generatePagination(this.pageNumber, this.totalPages);
}

generatePagination(current: number, total: number): any[] {
  let pages: any[] = [];
  if (total <= 7) {
    pages = Array.from({ length: total }, (_, i) => i + 1);
  } else {
    if (current <= 4) {
      pages = [1, 2, 3, 4, 5, "...", total];
    } else if (current >= total - 3) {
      pages = [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    } else {
      pages = [1, "...", current - 1, current, current + 1, "...", total];
    }
  }
  return pages;
}
selectPage(page: number) {
  if (page < 1 || page > this.totalPages) return;
  this.pageNumber = page;
  this.calculatePages();
}

updatePageSize(size: number) {
  this.pageSize = Number(size);
  this.pageNumber = 1; // Reset to first page on page size change
  this.calculatePages();
}
  sortDirection: 'asc' | 'desc' = 'asc'; // Default sorting is ascending
  sortColumn: string
  filterTableData() {
    const searchTerm = this.searchbyVinNumber?.toLowerCase() || '';

    // Filter by VIN or Vehicle Name (alias)
    this.filteredTableData = this.dataResponse.filter(data =>
      data.vin?.toLowerCase().includes(searchTerm) ||
      data.alias?.toLowerCase().includes(searchTerm)
    );

    // Optional: sort if sortColumn is set
    if (this.sortColumn) {
      this.filteredTableData.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];

        // Sort handling both string and number values
        if (typeof valA === 'string' && typeof valB === 'string') {
          return this.sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return this.sortDirection === 'asc'
            ? (valA ?? 0) - (valB ?? 0)
            : (valB ?? 0) - (valA ?? 0);
        }
      });
    }
  }


  toggleSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc'; // Reset to ascending when changing column
    }
    this.filterTableData(); // Apply sorting
  }
  handleApiError(error: any) {
    const errorMessage = error?.error?.apierror?.message|| "An unexpected error occurred";
    this.toaster.error(errorMessage);
  }
  // table data
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    }, 10);
    // this.updateDasboard()
  }

  ngOnDestroy(): void {
    if (this.subscription$) this.subscription$.unsubscribe();
  }
}
