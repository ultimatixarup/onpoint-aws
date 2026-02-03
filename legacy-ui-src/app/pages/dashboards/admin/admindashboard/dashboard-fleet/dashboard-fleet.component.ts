import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef} from '@angular/core';
import { TaxonomyService } from '../../../taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { ChartComponent } from 'ng-apexcharts';
import { take } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as FileSaver from 'file-saver';
import * as ExcelJS from 'exceljs';
import { PrimeNGConfig } from 'primeng/api';
import { DatePipe } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApexAxisChartSeries,ApexChart,ApexDataLabels,ApexStroke,ApexYAxis,ApexTitleSubtitle,ApexLegend,ApexResponsive,ApexPlotOptions,ApexTooltip} from "ng-apexcharts";
import { Width } from 'ngx-owl-carousel-o/lib/services/carousel.service';
import { DashboardsService } from '../../../dashboards.service';

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
export type ChartOptions = {series: ApexAxisChartSeries;chart: ApexChart;xaxis: ApexXAxis | any; stroke: ApexStroke;
  dataLabels: ApexDataLabels;yaxis: ApexYAxis;title: ApexTitleSubtitle;labels: string[];legend: ApexLegend;subtitle: ApexTitleSubtitle;
  responsive: ApexResponsive[];colors: string[];};

@Component({
  selector: 'app-dashboard-fleet',
  templateUrl: './dashboard-fleet.component.html',
  styleUrls: ['./dashboard-fleet.component.scss']
})
export class DashboardFleetComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  @ViewChild('chartContainer')
  chartContainer!: ElementRef;
  public ChartOptions!: Partial<ChartOptions> | any;
  @ViewChild('chart') chartElement: ElementRef;
  chartData = {
    vehicleEnrolledData: {
      chartType: 'app-bar-category-chart',
      data: [],
      labels: ['Pending', 'Active', 'Failed', 'Un-enrolled'],
      colors: ['#739FFF', '#2CA67E', '#FF7D7D', '#FAD691'],
    },
    totalVehiclesData: {
      data: [], // Initially empty, to be filled with data from vinCountData
      height: 200,
      colors: ['#739FFF', '#2CA67E', '#FF7D7D', '#FAD691'],
      categories: ['Pending', 'Active', 'Failed', 'Un-Enrolled'],
      // label: 300,
      formatter: 'Vehicles Enrolled',
      style: {
        fontSize: '10px', // Set font size for the formatter
        fontWeight: 'normal',
        fontFamily: 'Poppins', // Set the desired font-family if needed
        color: '#000000', // Optional: set text color
      },
      legend: true,
      shadow: true,
    }
  };
  groupIdData: any;
  isloading2:boolean = false;
  activeTab = 0;
  selectedOption: string = 'customRange';
  fromDate: string = '';
  toDate: string = '';
  subscription$: Subscription = new Subscription();
  topFiveVins: string[] = [];
  providerData: any;
  idlingChart: any
  threshold = 0;
  lastDays: boolean = false;
  chartVehicleAlerts: any
  selectedMenuItem: string | null = null;
  time = new Date();
  totalIdlingTime: any;
  oem: any = 'All';
  fleetIdData: any;
  chartOptions4: any;
  chartOptions5: any;
  donutchart2: any;
  loginUser: any;
  user: any;
  showNoDataImage: boolean = false;
  multiRoles: any;
  consumerList: any;
  openIcon: boolean = false;
  closeIcon: boolean = true;
  aggresiveDriver: any;
  customConsumer: any;
  fleetList: any;
  fleetDetails: any;
  chartWithTrip: any
  showLegendsAndValues: boolean = false;
  chartOptionsFleetMileage: any
  percenTages: number;
  chartOptionsseatBelts: any;
  date: Date;
  activeVehicles: any;
  driverScores: any = [];
  tripDetail: any;
  driverScore: any;
  tripData: any;
  activeVehicless: any;
  consumer: any = 'All'
  percenTage: number;
  vehicleSplit: any;
  totalActivatedVehicleCount: any;
  driverScoreDonut: any;
  vehicleSplitDonut: any;
  selectMonths: any = ''
  selectMonth: any = ''
  vehicleFuelDonut: any;
  chartOptionsFuelConsumed: any;
  selectedMonth: string | null = null;
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
  Alerts: any;
  driver: any;
  milesDrivenMonthsWise: any;
  zeroData: number;
  totalIdlingDuration: string;
  monthYear = [
    { yearMonth: 'July, 2024', value: "2024-07" },{ yearMonth: 'June, 2024', value: "2024-06" },{ yearMonth: 'May, 2024', value: "2024-05" },
    { yearMonth: 'Apr, 2024', value: "2024-04" },{ yearMonth: 'Mar, 2024', value: "2024-03" }]
  monthYears = [
    { yearMonth: 'July, 2024', value: "2024-07" },{ yearMonth: 'June, 2024', value: "2024-06" },{ yearMonth: 'May, 2024', value: "2024-05" },
    { yearMonth: 'Apr, 2024', value: "2024-04" },{ yearMonth: 'Mar, 2024', value: "2024-03" }]
    timePeriods = [
      // { label: 'Till Date', value: 'tilldate' },

      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },

    ];
    vinCountoemWise: any;
    vinCountOemUnenrolled: any;
    vinCountOemActive: any;
    vinCountOemFailed: any;
    vinCountOemPending: any;
    selectedOemData: any;
    enrollmentVehicleStatusnew: any;
    vinData: any;
    StartDate: any;
    EndDate: any;
    startDates: string = '';
    endDates: string = '';
    showCalendar: boolean = false;
    currentMonth: number = new Date().getMonth();
    currentYear: number = new Date().getFullYear();
    startMonthName: string;
    endMonthName: string;
    startYear: number;
    endYear: number;
    days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    startDateed: number[] = [];
    endDateed: number[] = [];
    fleetIds: any;
    totalDrivingTime: any;
    monthData: any;
    rangeDates: Date[] | undefined;
    submitClicked: boolean = false;
    maxDate: Date;
    vinCountReport: any;
    totalUnenrolled: any;
    updatedDate: string;
    selectedTimePeriod: string = '';
    buttons = ['FordPro', 'GM', 'Stellantis', 'Tesla', 'Toyota'];
    selectedButton: string = 'FordPro';
    selectedPeriod: any;
    startDate: string;
    endDate: string;
    displayDate: string;
    last5month: boolean = true;
    last5week: boolean = true;
    last5monthconsumed: boolean = false;
    lastWeek: boolean = false;
    showMenu: boolean = false;
    vinCount: any;
    vinCountcountpaused: any;
    vinCountcountactive: any;
    vinCountcountfailed: any;
    vinCountcountpending: any;
    enrollmentfailed: any;
    vinCountcountunenrolled: any;
    vinCountcountunerollpending: any;
    vinCountcountunerollcompleted: any;
    enrollmentVehicleStatus: any;
  fleetIdValueNew: any;
  selectedFleetDisplay: string = '';
  private defaultFleetInitialized = false;
    constructor(private modalService: NgbModal,
      private primengConfig: PrimeNGConfig,
      private datePipe: DatePipe,
      private cdr: ChangeDetectorRef,private router: Router,public http: HttpClient, private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService, private dashboardsService:DashboardsService) {
      this.updatedDate = '';
      this.vinCount = [];
      this.startMonthName = this.getMonthName(this.currentMonth);
      this.endMonthName = this.getMonthName(this.currentMonth);
      this.startYear = this.currentYear;
      this.endYear = this.currentYear;
      this.generateDates();


     }

  ngOnInit() {
    this.selectedPeriod = 'monthly';
    this.showRole();
    this.selectConsumers()
    // Removed duplicate method calls - they are now only called via selectFleetId()
    // this.getTotalActivatedVehicle()
    // this.idlingTime();
    // this.getfuelConsumed()
    // this.getDriverScores()
    // this.getSeatBelt()
    // this.getAggresiveDrivers()
    // this.getTotalOem()
    // this.getTotalFuelType()
    // this.getBodyClass()
    this.fleetSumamryCharT()
    this.selectFirstAvailableOEM();

    this.updatedDate = this.getCurrentDate();
   // this.onTimePeriodChangeData(this.selectedPeriod);
    this.primengConfig.setTranslation({
      firstDayOfWeek: 1, // Start week on Monday
      dayNames: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      dayNamesShort: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      dayNamesMin: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      monthNames: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      monthNamesShort: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      today: 'Today',
      weekHeader: 'Wk',


    });

    //call graph method start
    // this.loadTelemetryData();
    // this.loadFleetHealth();
    // this.loadDriverSafety();
    // this.loadFuelAnalytics();
    // this.loadDashboardSummaryData();


    //end

  }

  selectTab(index: number) {
    this.activeTab = index;
  }

  onSubmit() {
    this.submitClicked = true; // Set the flag to true when the submit button is clicked
  }
  driverSafetySeries: any[] = [];
driverSafetyChart: any = {
  chart: { type: 'bar', height: 300, stacked: false, toolbar: { show: false } },
  plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
  dataLabels: { enabled: false, formatter: (val: number) => val.toString() },
  xaxis: { categories: [] },
  colors: ['#3B77AE', '#ED8735', '#FF4560'], // HB+HC, Overspeed, Collisions
  tooltip: { y: { formatter: (val: number, opts: any) => `${opts.seriesName}: ${val}` } },
  legend: { position: 'top' }
};

worstDriversSeriesNew: any[] = [];
worstDriversChartNew: any = {
  chart: { type: 'bar', height: 300, stacked: false, toolbar: { show: false } },
  plotOptions: { bar: { horizontal: false, columnWidth: '50%', endingShape: 'rounded' } },
  dataLabels: { enabled: false },
  xaxis: { categories: [] },
  yaxis: { title: { text: 'Score (%)' }, min: 0, max: 100 },
  colors: ['#DC2626', '#F59E0B'], // Red for Safety, Yellow for Efficiency
  legend: { position: 'top' },
  grid: { borderColor: '#f1f1f1' },
  tooltip: { y: { formatter: (val: number, opts: any) => `${val}%` } }
};
loadDriverSafety() {
  const fleetId = '100224';
  const periods = 4;
  const timePeriod = this.selectedPeriod;

  this.dashboardsService.getDriverSafety(this.fleetIdData, periods, timePeriod).subscribe(res => {
    const safetyData = res.safetyEvents || [];
    const driversData = res.driversNeedAttention || [];
    const scorecard = res.driverSafetyScorecard || {};

    // -------------------------------
    // Driver Safety Events Chart
    // -------------------------------
    this.driverSafetyChart.xaxis = {
      categories: safetyData.map(d => d.period) // 👉 Use "Week 1", "Week 2", etc.
    };

    this.driverSafetySeries = [
      {
        name: 'Harsh Events',
        data: safetyData.map(d => {
          const hb = d.harshBrakingCount ?? 0;
          const hc = d.harshCorneringCount ?? 0;
          const ha = d.harshAccelerationCount ?? 0;
          return hb + hc + ha;
        })
      },
      {
        name: 'Overspeed Miles',
        data: safetyData.map(d => +(d.overspeedingMiles?.toFixed(2) ?? 0))
      },
      {
        name: 'Collisions',
        data: safetyData.map(d => d.collisionCount ?? 0)
      }
    ];

    // Custom tooltip to show breakdown HB, HC, HA
    this.driverSafetyChart.tooltip = {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number, opts: any) => {
          if (opts.seriesIndex === 0) {
            const d = safetyData[opts.dataPointIndex];
            const hb = d.harshBrakingCount ?? 0;
            const hc = d.harshCorneringCount ?? 0;
            const ha = d.harshAccelerationCount ?? 0;
            return `HB(${hb}) + HC(${hc}) + HA(${ha})`;
          }
          if (opts.seriesIndex === 1) {
            return `${val} miles`;
          }
          if (opts.seriesIndex === 2) {
            return `${val} collisions`;
          }
          return val;
        }
      }
    };

    // 👉 Total Safety Events (summary)
    // this.totalSafetyEvents = safetyData.reduce((sum, d) => {
    //   const hb = d.harshBrakingCount ?? 0;
    //   const hc = d.harshCorneringCount ?? 0;
    //   const ha = d.harshBrakingAndCorneringCount ?? 0;
    //   return sum + hb + hc + ha;
    // }, 0);

    // -------------------------------
    // Worst Drivers Chart
    // -------------------------------
    this.worstDriversChartNew.xaxis = {
      categories: driversData.map(d => d.period) // 👉 Use "Week 1", "Week 2"
    };

    this.worstDriversSeriesNew = [
      {
        name: 'Safety',
        data: driversData.map(d => d.safetyScorePercentage ?? 0)
      },
      {
        name: 'Efficiency',
        data: driversData.map(d => d.efficiencyScorePercentage ?? 0)
      }
    ];

    // -------------------------------
    // Driver Safety Scorecard Donut
    // -------------------------------
    this.driverScores = [
      scorecard.scoreRange0To20Percentage ?? 0,
      scorecard.scoreRange21To40Percentage ?? 0,
      scorecard.scoreRange41To60Percentage ?? 0,
      scorecard.scoreRange61To80Percentage ?? 0,
      scorecard.scoreRange81To100Percentage ?? 0,
    ];

    this.driverScoreChart(); // Build donut chart
  });
}



  private highlightDates(): void {
    // Clear previous highlights
    const existingHighlights = document.querySelectorAll(
      '.p-datepicker table td > span'
    );
    existingHighlights.forEach((el: Element) => {
      (el as HTMLElement).style.background = ''; // Reset previous highlights
      (el as HTMLElement).style.color = ''; // Reset previous text color
      (el as HTMLElement).style.borderRadius = '';
    });

    // Get the new highlights
    const highlights = document.querySelectorAll('.p-highlight');

    if (highlights.length > 0) {
      // Highlight the first element
      (highlights[0] as HTMLElement).style.background = '#FA751A';
      (highlights[0] as HTMLElement).style.color = 'white'; // Text color for better visibility
      (highlights[0] as HTMLElement).style.borderRadius = '6px 0px 0px 6px';
      // Highlight the last element if there are more than one
      if (highlights.length > 1) {
        (highlights[highlights.length - 1] as HTMLElement).style.background =
          '#FA751A';
        (highlights[highlights.length - 1] as HTMLElement).style.color =
          'white'; // Text color for better visibility
        (highlights[highlights.length - 1] as HTMLElement).style.borderRadius =
          '0px 6px 6px 0px';
      }
      for (let i = 1; i < highlights.length - 1; i++) {
        (highlights[i] as HTMLElement).style.backgroundColor = '#fa741a4e';
        (highlights[i] as HTMLElement).style.color = 'black'; // Text color for better visibility
      }
    }
  }

  selectButton(button: string) {
    if (this.oemDataAvailable(button)) {
      this.selectedButton = button;

      if (this.selectedTimePeriod === 'customRange') {
        this.vinCountDataBasedonData();
      } else if (this.selectedTimePeriod === 'tilldate') {
        this.vinCountDatatillDate();
      } else {
        this.vinCountData();
      }
    }
  }

  selectFirstAvailableOEM() {
    const prioritizedButtons = ['FordPro', 'GM', 'Stellantis','Tesla', 'Toyota'];

    const firstAvailableOEM = this.buttons.find(button =>
      prioritizedButtons.includes(button) && this.oemDataAvailable(button)
    );

    if (firstAvailableOEM) {
      this.selectButton(firstAvailableOEM);
    }
  }

  selectMenuItem(item: string) {
    this.selectedMenuItem = this.selectedMenuItem === item ? null : item;
  }

  showRole() {
    this.user = sessionStorage.getItem('userRole');
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    this.customConsumer = sessionStorage.getItem('custom-consumer');

    if(this.user === 'role_user_fleet'){
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId ? parseInt(fleetId, 10) : null;
      // Set fleetIdData immediately for user login to ensure data loads
      if (this.fleetIdValueNew) {
        this.fleetIdData = this.fleetIdValueNew;
      }
    }
  }

  selectConsumers() {
    this.customConsumer = sessionStorage.getItem('custom-consumer');
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.customConsumer).subscribe((res: any) => {
        this.fleetList = Array.isArray(res) ? [...res] : [];
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id });

        if (this.fleetList && this.fleetList.length > 0) {
          this.fleetIds = this.fleetList.map((fleet: any) => fleet.id).join(', ');

          const hasExistingSelection = this.fleetList.some((fleet: any) => `${fleet.id}` === `${this.fleetIdData}`);
          let selectionChanged = false;

          // If no valid selection exists, set default
          if (!hasExistingSelection || !this.fleetIdData) {
            const defaultFleetId = this.user === 'role_user_fleet' && this.fleetIdValueNew
              ? this.fleetIdValueNew
              : this.fleetList[0].id;
            const defaultFleet = this.fleetList.find((fleet: any) => `${fleet.id}` === `${defaultFleetId}`);

            if (`${this.fleetIdData}` !== `${defaultFleetId}`) {
              this.fleetIdData = defaultFleetId;
              if (defaultFleet?.name) {
                try {
                  sessionStorage.setItem('fleetUserName', JSON.stringify(defaultFleet.name));
                } catch {
                  sessionStorage.setItem('fleetUserName', `${defaultFleet.name}`);
                }
              }
              selectionChanged = true;
              this.updateSelectedFleetDisplay();
            }
          }

          // Load data on first initialization or when selection changed
          // For role_user_fleet, always load data on first initialization
          const shouldLoadData = (selectionChanged || !this.defaultFleetInitialized) &&
                                 (this.fleetIdData !== null && this.fleetIdData !== undefined);

          if (shouldLoadData) {
            this.defaultFleetInitialized = true;
            this.selectFleetId();
          }
        } else {
          // If no fleet list, but user has fleetIdData (for role_user_fleet), still try to load data
          if (this.user === 'role_user_fleet' && this.fleetIdData && !this.defaultFleetInitialized) {
            this.defaultFleetInitialized = true;
            this.selectFleetId();
          } else {
            this.fleetIdData = null;
          }
        }
        this.updateSelectedFleetDisplay();
      }, err => {
        // On error, if user has fleetIdData, still try to load data
        if (this.user === 'role_user_fleet' && this.fleetIdData && !this.defaultFleetInitialized) {
          this.defaultFleetInitialized = true;
          this.selectFleetId();
        }
      })
    )
  }

  private updateSelectedFleetDisplay(): void {
    if (!Array.isArray(this.fleetList) || this.fleetList.length === 0) {
      this.selectedFleetDisplay = '';
      return;
    }

    const currentFleetId = this.fleetIdData ?? (this.user === 'role_user_fleet' ? this.fleetIdValueNew : null);

    if (currentFleetId === null || currentFleetId === undefined || currentFleetId === '') {
      this.selectedFleetDisplay = '';
      return;
    }

    const matchedFleet = this.fleetList.find((fleet: any) => `${fleet.id}` === `${currentFleetId}`);
    const resolvedName = matchedFleet?.name ?? this.getFallbackFleetName();

    this.selectedFleetDisplay = resolvedName
      ? `${currentFleetId} - [${resolvedName}]`
      : `${currentFleetId}`;
  }

  private getFallbackFleetName(): string {
    if (this.user === 'role_user_fleet') {
      const storedName = sessionStorage.getItem('fleetUserName');
      if (storedName) {
        try {
          const parsedName = JSON.parse(storedName);
          if (parsedName) {
            return parsedName;
          }
        } catch {
          return storedName;
        }
      }
    }
    return '';
  }

   groupList: any;
    selectGroupId() {
    if (!this.fleetIdData) return;

    this.subscription$.add(
      this.dashboardservice.getOrganizationSubGroups(this.fleetIdData).subscribe((res: any) => {
        const nestedGroups = res?.groups || [];
        console.log(nestedGroups)
        // Flatten groups & subgroups into one list
        this.groupList = this.flattenGroups(nestedGroups);
        console.log(this.groupList)
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
  cleartMonthSelection() {
    this.getfuelConsumed();
  }

  cleartMonthSelections() {
    this.getfuelConsumed();
  }


  isClearable(): boolean {
    return !!this.selectMonth;
  }

  isClearables(): boolean {
    return !!this.selectMonths;
  }


  // Method to handle provider selection
  selectProvider(provider: string) {
    this.selectedButton = provider;
    if (this.selectedTimePeriod === 'tilldate') {
      this.vinCountDatatillDate();
    }
    else {
      this.vinCountData()
    }
  }

   onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.getTotalActivatedVehicle()
   // this.getTripsCount()
   // this.getMileDriven()
   // this.vehicleWithTripReocrdeded()
    this.idlingTime()
    // this.getFuelMileage()
    // this.dtcTriggeredbyType()
    // this.dtcTriggeredCount()
    this.getDriverScores()
    this.getSeatBelt()
    this.getAggresiveDrivers()
    this.getTotalOem()
    this.getTotalFuelType()
    this.getBodyClass()
    this.vinCountDatatillDate();
    this.fleetSummaryDataDownloadbasedonDatetill();
    this.vinDataDownload()
    this.fleetSummaryDataDownloadReport()
    this.selectMonths = '';
    this.selectMonth = '';
  }
  vinCountData() {
    this.subscription$.add(
      this.dashboardservice.fleetSummaryData(this.customConsumer, this.fleetIdData,this.groupIdData, this.selectedTimePeriod).subscribe((res: any) => {
        if (!res?.providerCount || !Array.isArray(res.providerCount)) {
          this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
          this.fleetSumamryCharT();
          return;
        }

        this.vinCountoemWise = res.providerCount;

        if (this.vinCountoemWise.length === 0) {
          // If vinCountoemWise is an empty array, set enrollmentVehicleStatus to 0
          this.enrollmentVehicleStatus = 0;
          this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
          this.fleetSumamryCharT();
          return;
        }

        let selectedButtonUpper = this.selectedButton?.toUpperCase();
        this.selectedOemData = this.vinCountoemWise.find((provider: any) => provider.provider.toUpperCase() === selectedButtonUpper);

        if (!this.selectedOemData) {
          // Select the first provider with data by default if the selected button's provider is not available
          this.selectedOemData = this.vinCountoemWise.find((provider: any) => provider.activeCount > 0 || provider.pendingCount > 0 || provider.failedCount > 0 || provider.unenrollCount > 0);
          if (this.selectedOemData) {
            this.selectedButton = this.selectedOemData.provider; // Set the first available provider as the selected button
          }
        }

        if (this.selectedOemData) {
          this.vinCountOemUnenrolled = this.selectedOemData.unenrollCount || 0;
          this.vinCountOemActive = this.selectedOemData.activeCount || 0;
          this.vinCountOemFailed = this.selectedOemData.failedCount || 0;
          this.vinCountOemPending = this.selectedOemData.pendingCount || 0;
          this.enrollmentVehicleStatus = this.vinCountOemActive + this.vinCountOemPending + this.vinCountOemUnenrolled + this.vinCountOemFailed;
          this.chartData.totalVehiclesData.data = [
            this.vinCountOemPending,
            this.vinCountOemActive,
            this.vinCountOemFailed,
            this.vinCountOemUnenrolled,
          ];
        } else {
          // Default to [0, 0, 0, 0] if no data for the selected OEM or any available provider
          this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
          this.enrollmentVehicleStatus = 0; // Set enrollmentVehicleStatus to 0 if no data
        }
        this.fleetSumamryCharT();
      }, err => {
        this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
        this.enrollmentVehicleStatus = 0; // Set enrollmentVehicleStatus to 0 on error
        this.fleetSumamryCharT();
      })
    );
  }

  vinCountDatatillDate() {
    this.subscription$.add(
      this.dashboardservice.fleetSummaryDatatillDate(this.customConsumer, this.fleetIdData,this.groupIdData).subscribe((res: any) => {
        this.vinCountoemWise = res.providerCount;
        if (this.vinCountoemWise.length === 0) {
          this.enrollmentVehicleStatus = 0;
          this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
          this.fleetSumamryCharT();
          return;
        }

        let selectedButtonUpper = this.selectedButton?.toUpperCase();
        this.selectedOemData = this.vinCountoemWise.find((provider: any) => provider.provider.toUpperCase() === selectedButtonUpper);

        if (!this.selectedOemData) {
          // Select the first provider with data by default if the selected button's provider is not available
          this.selectedOemData = this.vinCountoemWise.find((provider: any) => provider.activeCount > 0 || provider.pendingCount > 0 || provider.failedCount > 0 || provider.unenrollCount > 0);
          if (this.selectedOemData) {
            this.selectedButton = this.selectedOemData.provider; // Set the first available provider as the selected button
          }
        }

        if (this.selectedOemData) {
          this.vinCountOemUnenrolled = this.selectedOemData.unenrollCount || 0;
          this.vinCountOemActive = this.selectedOemData.activeCount || 0;
          this.vinCountOemFailed = this.selectedOemData.failedCount || 0;
          this.vinCountOemPending = this.selectedOemData.pendingCount || 0;
          this.enrollmentVehicleStatus = this.vinCountOemActive + this.vinCountOemPending + this.vinCountOemUnenrolled + this.vinCountOemFailed;
          this.chartData.totalVehiclesData.data = [
            this.vinCountOemPending,
            this.vinCountOemActive,
            this.vinCountOemFailed,
            this.vinCountOemUnenrolled,
          ];
        } else {
          // Default to [0, 0, 0, 0] if no data for the selected OEM or any available provider
          this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
          this.enrollmentVehicleStatus = 0; // Set enrollmentVehicleStatus to 0 if no data
        }
        this.fleetSumamryCharT();
      }, err => {
        this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
        this.enrollmentVehicleStatus = 0; // Set enrollmentVehicleStatus to 0 on error
        this.fleetSumamryCharT();
      })
    );
  }

  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }) {
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
    this.vinDataDownload()
    this.fleetSummaryDataDownloadReport()
    this.fleetSummaryDataDownloadbasedonDate()
    this.vinCountDataBasedonData()
  }

  vinCountDataBasedonData() {
    this.subscription$.add(
      this.dashboardservice.fleetSummaryDataDateWise(this.customConsumer, this.fleetIdData, this.fromDate, this.toDate).subscribe((res: any) => {
        if (!res?.providerCount || !Array.isArray(res.providerCount)) {
          this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
          this.fleetSumamryCharT();
          return;
        }

        this.vinCountoemWise = res.providerCount;
        let selectedButtonUpper = this.selectedButton?.toUpperCase();
        this.selectedOemData = this.vinCountoemWise.find((provider: any) => provider.provider.toUpperCase() === selectedButtonUpper);

        if (!this.selectedOemData) {
          this.selectedOemData = this.vinCountoemWise.find((provider: any) => provider.activeCount > 0 || provider.pendingCount > 0 || provider.failedCount > 0 || provider.unenrollCount > 0);
          if (this.selectedOemData) {
            this.selectedButton = this.selectedOemData.provider;
          }
        }

        if (this.selectedOemData) {
          this.vinCountOemUnenrolled = this.selectedOemData.unenrollCount || 0;
          this.vinCountOemActive = this.selectedOemData.activeCount || 0;
          this.vinCountOemFailed = this.selectedOemData.failedCount || 0;
          this.vinCountOemPending = this.selectedOemData.pendingCount || 0;
          this.enrollmentVehicleStatus = this.vinCountOemActive + this.vinCountOemPending + this.vinCountOemUnenrolled + this.vinCountOemFailed;
          this.chartData.totalVehiclesData.data = [
            this.vinCountOemPending,
            this.vinCountOemActive,
            this.vinCountOemFailed,
            this.vinCountOemUnenrolled,
          ];
        } else {
          this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
          this.enrollmentVehicleStatus = 0;
        }

        this.fleetSumamryCharT();
      }, err => {
        this.chartData.totalVehiclesData.data = [0, 0, 0, 0];
        this.enrollmentVehicleStatus = 0;
        this.fleetSumamryCharT();
      })
    )
  }

  fleetSummaryDataDownloadbasedonDatetill() {
    this.subscription$.add(
      this.dashboardservice.fleetSummaryDatatillDate(this.customConsumer, this.fleetIdData,this.groupIdData).subscribe((res: any) => {
        this.vinCount = res
        this.vinCountcountpaused = res.unenrollCount
        this.vinCountcountactive = res.activeCount
        this.vinCountcountfailed = res.failedCount
        this.vinCountcountpending = res.pendingCount
        this.StartDate = res.startDate
        this.EndDate = res.endDate
        this.enrollmentVehicleStatusnew = this.vinCountcountpaused + this.vinCountcountactive + this.vinCountcountfailed + this.vinCountcountpending
        this.chartData.vehicleEnrolledData.data = [
          this.vinCountcountpending,
          this.vinCountcountactive,
          this.vinCountcountfailed,
          this.vinCountcountpaused,
        ]
        // this.chartData.vehicleEnrolledData.data = [
        //   this.vinCountcountpending,
        //   this.vinCountcountactive,
        //   this.vinCountcountunerollcompleted,
        //   this.vinCountcountfailed,
        // ]
        // this.fleetSumamryCharT();
      }, err => { })
    )
  }

  fleetSummaryDataDownloadbasedonDate() {
    this.subscription$.add(
      this.dashboardservice.fleetSummaryDataDateWise(this.customConsumer, this.fleetIdData, this.fromDate, this.toDate).subscribe((res: any) => {
        this.vinCount = res
        this.vinCountcountpaused = res.unenrollCount
        this.vinCountcountactive = res.activeCount
        this.vinCountcountfailed = res.failedCount
        this.vinCountcountpending = res.pendingCount
        this.StartDate = res.startDate
        this.EndDate = res.endDate
        this.enrollmentVehicleStatusnew = this.vinCountcountpaused + this.vinCountcountactive + this.vinCountcountfailed + this.vinCountcountpending
        this.chartData.vehicleEnrolledData.data = [
          this.vinCountcountpending,
          this.vinCountcountactive,
          this.vinCountcountfailed,
          this.vinCountcountpaused,
        ]
        // this.chartData.vehicleEnrolledData.data = [
        //   this.vinCountcountpending,
        //   this.vinCountcountactive,
        //   this.vinCountcountunerollcompleted,
        //   this.vinCountcountfailed,
        // ]
        // this.fleetSumamryCharT();
      }, err => { })
    )
  }

  vinDataDownload() {
    this.vinData = null;
    if (this.selectedTimePeriod === 'tilldate' && this.customConsumer && this.fleetIdData) {
      // If 'tilldate', consumer, and fleetIdData are all provided
      this.subscription$.add(
        this.dashboardservice.getManageListDownloadConsumerFleet(this.customConsumer, this.fleetIdData,this.groupIdData, this.fromDate, this.toDate).subscribe((res: any) => {
          this.vinData = res;
        })
      );
    }
    else if (this.selectedTimePeriod === 'tilldate' && this.customConsumer) {
      // If 'tilldate' and consumer are provided but not fleetIdData
      this.subscription$.add(
        this.dashboardservice.getManageListDownloadConsumer(this.customConsumer, this.fromDate, this.toDate,).subscribe((res: any) => {
          this.vinData = res;
        })
      );
    }
    else if (this.selectedTimePeriod === 'tilldate') {
      // If only 'tilldate' is provided
      this.subscription$.add(
        this.dashboardservice.getManageListDownload(this.fromDate, this.toDate).subscribe((res: any) => {
          this.vinData = res;
        })
      );
    }
    else if (this.selectedTimePeriod === 'customRange') {
      // If only 'tilldate' is provided
      this.subscription$.add(
        this.dashboardservice.getManageListDownloadConsumer(this.customConsumer, this.fromDate, this.toDate,).subscribe((res: any) => {
          this.vinData = res;
        })
      );
    }
    else {
      // For all other cases
      this.subscription$.add(
        this.dashboardservice.getManageListDownloadS(this.customConsumer, this.fleetIdData,this.groupIdData, this.selectedTimePeriod).subscribe((res: any) => {
          this.vinData = res;
        })
      );
    }
  }

  fleetSummaryDataDownloadReport() {
    this.vinCountReport = null;
    if (this.selectedTimePeriod === 'tilldate' && this.customConsumer && this.fleetIdData) {
      // If 'tilldate', consumer, and fleetIdData are all provided
      this.subscription$.add(
        this.dashboardservice.gerHustoryAll(this.customConsumer, this.fleetIdData,this.groupIdData, this.fromDate, this.toDate).subscribe((res: any) => {
          this.vinCountReport = res;
        })
      );
    }
    else if (this.selectedTimePeriod === 'tilldate' && this.customConsumer) {
      // If 'tilldate' and consumer are provided but not fleetIdData
      this.subscription$.add(
        this.dashboardservice.getHistoryConsumer(this.customConsumer, this.fromDate, this.toDate,).subscribe((res: any) => {
          this.vinCountReport = res;
        })
      );
    }
    else if (this.selectedTimePeriod === 'tilldate') {
      // If only 'tilldate' is provided
      this.subscription$.add(
        this.dashboardservice.getHistoryAllDate(this.fromDate, this.toDate).subscribe((res: any) => {
          this.vinCountReport = res;
        })
      );
    }

    else if (this.selectedTimePeriod === 'customRange') {
      // If only 'tilldate' is provided
      this.subscription$.add(
        this.dashboardservice.gerHustoryAll(this.customConsumer, this.fleetIdData,this.groupIdData, this.fromDate, this.toDate).subscribe((res: any) => {
          this.vinCountReport = res;
        })
      );
    }
    else {
      // For all other cases
      this.subscription$.add(
        this.dashboardservice.getHistoryDownlaod(this.customConsumer, this.fleetIdData,this.groupIdData, this.selectedTimePeriod).subscribe((res: any) => {
          this.vinCountReport = res;
        })
      );
    }
  }

  oemDataAvailable(oem: string): boolean {
    return this.vinCountoemWise?.some((provider: any) => provider.provider.toUpperCase() === oem.toUpperCase());
  }

  updateData() {
    this.updatedDate = this.getCurrentDate(); // Update the date
    // this.vinCount = this.vinCountData(); // Refresh the data
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

  fleetSumamryCharT() {
    // Check if enrollmentVehicleStatus is 0
    const dataAvailable = this.enrollmentVehicleStatus !== 0;
    this.ChartOptions = {
      series: dataAvailable ? this.chartData.totalVehiclesData.data : [0],
      chart: {
        height: this.chartData.totalVehiclesData.height || 300,
        type: 'donut',
      },
      stroke: {
        width: 0,
      },
      labels: dataAvailable ? this.chartData.totalVehiclesData.categories : ['No Data'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: '90%',
            },
            legend: {
              show: this.chartData.totalVehiclesData.legend || false,
              position: 'bottom',
            },
          },
        },
      ],
      colors: dataAvailable ? this.chartData.totalVehiclesData.colors : ['#ddd'],
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: 'Poppins',
                offsetY: 18,
                color: '#000',
              },
              value: {
                show: true,
                fontSize: '17px',
                fontWeight: 600,
                fontFamily: 'Poppins',
                offsetY: -15,
                color: '#000',
              },
              total: {
                show: true,
                label: this.enrollmentVehicleStatus === 1 || this.enrollmentVehicleStatus === 0 ? 'Vehicle Enrolled' : 'Vehicles Enrolled',
                color: '#000',
                fontSize: '10px',
                fontWeight: 500,
                fontFamily: 'Poppins',
                offsetY: -15,
                formatter: () => dataAvailable ? this.enrollmentVehicleStatus : 0,
              },
            },
            stroke: {
              width: 0
            },
            size: '75%',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontFamily: 'Poppins',
        markers: {
          size: 4,
          offsetX: 20,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 13,
        },
        formatter: function (val: any, opt: any) {
          return (
            '<span style="font-size:12px">' +
            val +
            '</span>' +
            '</br>' +
            '<b style="font-size:12px; ">' +
            opt.w.config.series[opt.seriesIndex] +
            '</b>'
          );
        },
      },
    };

    setTimeout(() => {
      const totalLabel = document.querySelector('.apexcharts-donut-label');
      if (totalLabel) {
        totalLabel.setAttribute('style', 'font-size: 12px; font-family: Poppins; color: #000;');
      }
    }, 100);
  }

  calculateWidth(value: number): number {
    const total = this.chartData.vehicleEnrolledData.data.reduce((acc: number, curr: number) => acc + curr, 0);
    return total ? (value / total) * 100 : 0;
  }

  customCalander(nodatafound: any) {
    this.modalService.open(nodatafound, { size: 'xl', centered: true });
  }

  onDropdownChange() {
    if (this.selectedPeriod === 'customRange') {
      this.showMenu = true;
    } else {
      this.showMenu = false;
    }
  }

  calculateWeekRange(today: Date) {
    const startOfWeek = new Date(today);
    const endOfWeek = new Date(today);
    const dayOfMonth = today.getDate();

    if (dayOfMonth <= 7) {
      startOfWeek.setDate(1);
      endOfWeek.setDate(7);
    } else if (dayOfMonth <= 14) {
      startOfWeek.setDate(8);
      endOfWeek.setDate(14);
    } else if (dayOfMonth <= 21) {
      startOfWeek.setDate(15);
      endOfWeek.setDate(21);
    } else {
      startOfWeek.setDate(22);
      endOfWeek.setDate(28);
    }

    this.startDate = this.formatDate(startOfWeek);
    this.endDate = this.formatDate(endOfWeek);
    this.displayDate = `${this.startDate} - ${this.endDate}`;
  }

  onTimePeriodChangeData(selectedPeriod: string) {
    this.selectedTimePeriod = selectedPeriod; // Set the selected period

    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }

    if (this.selectedTimePeriod === 'tilldate') {
      this.vinCountDatatillDate();
      this.fleetSummaryDataDownloadbasedonDatetill();
      this.vinDataDownload()
      this.fleetSummaryDataDownloadReport()
    } else {
      this.vinCountData();
      this.fleetSummaryDataDownload();
    }

    // Reload all dashboard graphs with the new time period
    this.loadTelemetryData();
    this.loadFleetHealth();
    this.loadDriverSafety();
    this.loadFuelAnalytics();
    this.loadDashboardSummaryData();
  }

  fleetSummaryDataDownload() {
    this.subscription$.add(
      this.dashboardservice.fleetSummaryData(this.customConsumer, this.fleetIdData,this.groupIdData, this.selectedTimePeriod).subscribe((res: any) => {
        this.vinCount = res
        this.vinCountcountpaused = res.unenrollCount
        this.vinCountcountactive = res.activeCount
        this.vinCountcountfailed = res.failedCount
        this.vinCountcountpending = res.pendingCount
        this.StartDate = res.startDate
        this.EndDate = res.endDate
        this.enrollmentVehicleStatusnew = this.vinCountcountpaused + this.vinCountcountactive + this.vinCountcountfailed + this.vinCountcountpending
        this.chartData.vehicleEnrolledData.data = [
          this.vinCountcountpending,
          this.vinCountcountactive,
          this.vinCountcountfailed,
          this.vinCountcountpaused,
        ];

        // this.chartData.vehicleEnrolledData.data = [
        //   this.vinCountcountpending,
        //   this.vinCountcountactive,
        //   this.vinCountcountunerollcompleted,
        //   this.vinCountcountfailed,
        // ]
        // this.fleetSumamryCharT();
      }, err => { })
    )
  }

  formatTimestamp(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${month}-${day}-${year}`;
  }

  info_icon_base_64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMTSURBVHgB7VZNTttQEJ55jk1Du0h3FBZ1T0A4QZIjcAJyAyJBq+4SdpUAKblBcwJ6A8IJcE+AuyggdZNFRURiv+nMsyOZxH9AJLrgk8x7vIznfW/eeOYDeMULAx9jPDvcaIJSDSJq8psuELrmB8IxoPYQwSMKhs7xH6+sz1IEZGNC7LJ5E0qBRkh0ZJ/cjooscwlQp1YLnLddPnEnXhrz6pA0jHRIXrV/68vipLPhQgVcBdhGBY15ZBCpX5lOjrA/Hj+agDi1bHXG07psTAQDJ7jr5zmb4/5ws8fX0Y3/9cKZ3p2TLUVATj6z18/N5kh+qKhV/ZbuIPMAX/kAGs/jaHj27K6VRl6lvSxhf87mAnlH3hUf4itwqt00u6UIRAmn5PQQWvpT3uZie4/h+F1O1ptIBNYlE6mFpFvVhcRcikCU7TwSHOVtTh23JkQdsC/lyrLsxAcBDWRuxb4zCUw7W3XzqXHY1k6ue5AD7Ptj0DgggB9FiekETt/UCvY9kVqSRQAsaJuRcAQl4Jz+7qwdX+8W2RmyBMNoQ9XMJqD0tgx8V0Mogb+ft+qmBpQAgR4ZMkiN5HrloZWSzIc3hFdQAg7QGdhK7v99ka22ybNCyXl0k+sPI8CZaobTm19QDi4/tTKGiYR2swm8ABYiAL4MdPDhI6wYUg/i6TibAJmqBVMr3IEVoxLEoSfyMgkQ4YWMSFYTVgwuWntmgvAzk4COPxW22surbk9EU/5MIfieSSCq08QP1KaV9U6Rx0gJRdeWh9mXTSnBrKBotNg3lr6CkJWMjNzP94uKTFgJd6akciuh+OC+0jP2EPlOIlUPTA+2+qBon6c+i4lWlpgoQixqpLO6HK6Bc3yzFNXUOmCHdo8HCZVxULbcZm8ugmTSS7NLJSDNg7XAboLEVXyPhTBqim2tCmuAeHPxldUxC0SpW5tZs158HQKfH1a8ehgE4CdFqe1gnVtzg7Rqz0u6hF1O/iRRmoT0cAtYTGBJWc7ZLglXfa4sX4S0Xwd0m3vrNpMRtTw/qc9rrHzwQmpJmY1f8d/gH862cyeLh5m5AAAAAElFTkSuQmCC';
async exportToExcel() {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(this.chartContainer.nativeElement);
      const imageData = canvas.toDataURL('image/png');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Summary_snapshot', {
        views: [{ showGridLines: false }],
      });

      const widthInPixels = 220 / 7.5;
      for (let col = 1; col <= 4; col++) {
        worksheet.getColumn(col).width = widthInPixels;
      }

      for (let col = 1; col <= 26; col++) {
        const cell = worksheet.getCell(1, col);
        cell.font = {
          name: 'Tahoma',
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF25477B' },
        };
      }

      for (let col = 27; col <= 16384; col++) {
        worksheet.getColumn(col).hidden = true;
      }

      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'VIN Enrollment Summary';
      titleCell.alignment.horizontal = 'left';

      const azugaCell = worksheet.getCell('A2');
      azugaCell.value = this.customConsumer;
      azugaCell.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FFFA751A' },
      };
      azugaCell.alignment = { vertical: 'middle' };
      const FleetIdCell = worksheet.getCell('A3');
      if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
        FleetIdCell.value = `FleetId: ${this.fleetIdData}`;
      } else {
        FleetIdCell.value = `FleetIds: ${this.fleetIds}`;
      }
      FleetIdCell.font = {
        name: 'Tahoma',
        size: 10,
        color: { argb: 'FF25477B' },
      };


      const dateCell = worksheet.getCell('D1');
      dateCell.value = this.formatDate(new Date());

      const totalVehicles = worksheet.getCell('D5');
      totalVehicles.value = 'Total Enrolled Vehicles';
      totalVehicles.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      };
      totalVehicles.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FF000000' },
        bold: true,
      };
      totalVehicles.alignment = { vertical: 'middle', horizontal: 'center' };
      totalVehicles.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };

      const enrolledVehicles = worksheet.getCell('D6');
      enrolledVehicles.value = this.enrollmentVehicleStatusnew;
      enrolledVehicles.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      };
      enrolledVehicles.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FFFA751A' },
        bold: true,
      };
      enrolledVehicles.alignment = { vertical: 'middle', horizontal: 'center' };
      enrolledVehicles.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };

      const timePeriod = worksheet.getCell('F5');
      timePeriod.value = 'Time Period';
      timePeriod.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      };
      timePeriod.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FF000000' },
        bold: true,
      };
      timePeriod.alignment = { vertical: 'middle', horizontal: 'center' };
      timePeriod.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      const timePeriodValue = worksheet.getCell('F6');
      if (this.selectedTimePeriod === 'tilldate') {
        timePeriodValue.value = `Till ${this.formatTimestamp(this.EndDate)}`;
      }

      else if (this.selectedTimePeriod === 'lastmonth') {
        timePeriodValue.value = `${this.formatTimestamp(this.StartDate)} To ${this.formatTimestamp(this.EndDate)}`;
      }


      else if (this.selectedTimePeriod === 'today') {
        timePeriodValue.value = `${this.formatTimestamp(this.StartDate)}`;
      }

      else if (this.selectedTimePeriod === 'yesterday') {
        timePeriodValue.value = `${this.formatTimestamp(this.StartDate)}`;
      }

      else if (this.selectedTimePeriod === 'weekly') {
        timePeriodValue.value = `${this.formatTimestamp(this.StartDate)} To ${this.formatTimestamp(this.EndDate)}`;
      }

      else if (this.selectedTimePeriod === 'monthly') {
        timePeriodValue.value = `${this.formatTimestamp(this.StartDate)} To ${this.formatTimestamp(this.EndDate)}`;
      }

      else if (this.selectedTimePeriod === 'customRange') {
        timePeriodValue.value = `${this.formatTimestamp(this.fromDate)} To ${this.formatTimestamp(this.toDate)}`;
      }
      timePeriodValue.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
      };
      timePeriodValue.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FFFA751A' },
        bold: true,
      };
      timePeriodValue.alignment = { vertical: 'middle', horizontal: 'center' };
      timePeriodValue.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };

      const headers = [
        'OEM-wise',
        'FordPro',      // Updated header
        'GM',
        'Stellantis',
        'Tesla',
        'Toyota',
      ];

      // Set header row
      for (let i = 0; i < headers.length; i++) {
        const cell = worksheet.getCell(8, 4 + i);
        cell.value = headers[i];
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' }, // White background for headers
        };
        cell.font = {
          name: 'Tahoma',
          size: 12,
          color: { argb: 'FF000000' },
          bold: true,
        };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Define status colors
      const statusColors: { [key: string]: string } = {
        'Pending': '739FFF',
        'Active': '2CA67E',
        'Failed': 'FF7D7D',
        'UnEnroll': 'FAD691'
      };
      const vehicleEnrolledData = this.chartData.totalVehiclesData;
      const statuses = ['Pending', 'Active', 'Failed', 'UnEnroll'];
      let rowNum = 9;
      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const labelCell = worksheet.getCell(rowNum, 4);
        labelCell.value = status;
        labelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: statusColors[status] || 'FFFFFFFF' }, // Apply status color
        };
        labelCell.font = {
          name: 'Tahoma',
          size: 12,
          color: { argb: 'FF000000' },
        };
        labelCell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'medium', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'medium', color: { argb: 'FF000000' } },
        };
        labelCell.alignment = { vertical: 'middle', horizontal: 'center' };
        for (let j = 1; j < headers.length; j++) {
          const cell = worksheet.getCell(rowNum, 4 + j);
          const oemData = this.vinCountoemWise.find(
            (provider: any) => provider.provider.toUpperCase() === (headers[j] === 'FordPro' ? 'FORDPRO' : headers[j]).toUpperCase()
          );

          cell.value = oemData ? oemData[`${status.toLowerCase()}Count`] : 0;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: statusColors[status] || 'FFFFFFFF' }, // Apply status color
          };
          cell.font = {
            name: 'Tahoma',
            size: 12,
            color: { argb: 'FF000000' },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'medium', color: { argb: 'FF000000' } },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        rowNum++; // Move to the next row
      }




      for (let row = 9; row <= 12; row++) {
        const cell = worksheet.getCell(row, 4);
        cell.font = {
          name: 'Tahoma',
          size: 12,
          color: { argb: 'FF000000' },
          bold: true, // Make text bold
        };
      }

      worksheet.getColumn(3).width = 100 / 7.5;
      for (let col = 5; col <= 11; col++) {
        worksheet.getColumn(col).width = 100 / 7.5;
      }

      worksheet.mergeCells('F5:H5');
      worksheet.mergeCells('F6:H6');

      const imageId = workbook.addImage({
        base64: imageData,
        extension: 'png',
      });

      const height = canvas.height * 0.6;
      const width = (height / canvas.height) * canvas.width;

      worksheet.addImage(imageId, {
        tl: { col: 0, row: 4 },
        ext: { width, height },
      });

      worksheet.mergeCells('K8:L11');

      const mergedCellRange = worksheet.getCell('K8');
      mergedCellRange.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEEADD' },
      };

      const imageId1 = workbook.addImage({
        base64: this.info_icon_base_64,
        extension: 'png',
      })

      worksheet.addImage(imageId1, {
        tl: { col: 10, row: 7 },
        ext: { width: 30, height: 30 },
      });

      // Add text to the merged cells
      const mergedTextCell = worksheet.getCell('K8');
      mergedTextCell.value =
        '       See the Description tab for more information.';
      mergedTextCell.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FF000000' },
      };
      mergedTextCell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      };

      for (let col = 1; col <= 13; col++) {
        const cell = worksheet.getCell(15, col);
        cell.font = {
          name: 'Tahoma',
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF25477B' },
        };
      }
      const headers15 = [
        'Fleet Id',
        'Consumer',
        'OEM',
        'VIN',
        'Enrollment Date',
        'Current Status',
      ];
      this.vinData.forEach((item: any) => {
        worksheet.addRow([
          item.fleetId,
          item.consumer,
          item.provider,
          item.vin,
          new Date(item.creationDate).toLocaleDateString(),
          item.enrollRequestType
        ]);
      });
      for (let i = 0; i < headers15.length; i++) {
        const cell = worksheet.getCell(15, 1 + i);
        cell.value = headers15[i];
      }

      for (let row = 16; row <= worksheet.rowCount; row++) {
        for (let col = 1; col <= 7; col++) {
          const cell = worksheet.getCell(row, col);
          cell.font = {
            name: 'Tahoma',
            size: 10,
            color: { argb: 'FF000000' },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      }


      // Create the "Description" sheet
      const descriptionSheet = workbook.addWorksheet('Description', { views: [{ showGridLines: false }] });
      for (let col = 1; col <= 26; col++) {
        const cell = descriptionSheet.getCell(1, col);
        cell.font = {
          name: 'Tahoma',
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF25477B' },
        };
      }
      for (let col = 27; col <= 16384; col++) {
        descriptionSheet.getColumn(col).hidden = true;
      }

      const titleCells = descriptionSheet.getCell('A1');
      titleCells.value = 'VIN Enrollment Summary';
      titleCells.alignment.horizontal = 'left';

      const azugaCell_desc = descriptionSheet.getCell('A2');
      azugaCell_desc.value = this.customConsumer;;
      azugaCell_desc.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FFFA751A' },
      };
      azugaCell_desc.alignment = { vertical: 'middle' };

      const FleetIdCells = descriptionSheet.getCell('A3');
      if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
        FleetIdCells.value = `FleetId: ${this.fleetIdData}`;
      } else {
        // If no specific fleet ID is selected, print all fleet IDs
        FleetIdCells.value = `FleetIds: ${this.fleetIds}`;
      }
      FleetIdCells.font = {
        name: 'Tahoma',
        size: 10,
        color: { argb: 'FF25477B' },
      };
      FleetIdCells.alignment = { vertical: 'middle' };

      // const FleetIdCellsValue = descriptionSheet.getCell('B3');
      // FleetIdCellsValue.value = this.fleetIdData
      // FleetIdCellsValue.font = {
      //   name: 'Tohama',
      //   size: 10,
      //   color: { argb: '000000' },
      // };
      // FleetIdCellsValue.alignment = { vertical: 'middle' };

      const dateCells = descriptionSheet.getCell('D1');
      dateCells.value = this.formatDate(new Date());

      // Alerts
      const reportDescriptions = descriptionSheet.getCell('C5');
      reportDescriptions.value = 'Report Description';
      reportDescriptions.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffffff' },
      };
      reportDescriptions.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FA751A' },
        bold: true
      };
      reportDescriptions.alignment = { vertical: 'middle', horizontal: 'left' };
      reportDescriptions.border = {
        top: { style: 'medium', color: { argb: 'ffffff' } },
        left: { style: 'medium', color: { argb: 'ffffff' } },
        bottom: { style: 'medium', color: { argb: 'ffffff' } },
        right: { style: 'medium', color: { argb: 'ffffff' } },
      };
      descriptionSheet.getColumn(3).width = 100;
      const reportDescriptionsValues = descriptionSheet.getCell('C6');
      reportDescriptionsValues.value = 'The Fleet Summary report can be downloaded from CerebrumX Workspace dashboard, and provides the status of each vehicle enrolled by the fleet manager to a fleet ID. The status for a vehicle can be PENDING, ACTIVE, FAILED, or UNENROLLED, as described below:';
      reportDescriptionsValues.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ffffff' },
      };
      reportDescriptionsValues.font = {
        name: 'Tahoma',
        size: 11,
        color: { argb: '131313' },
      };
      reportDescriptionsValues.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
      reportDescriptionsValues.border = {
        top: { style: 'medium', color: { argb: 'ffffff' } },
        left: { style: 'medium', color: { argb: 'ffffff' } },
        bottom: { style: 'medium', color: { argb: 'ffffff' } },
        right: { style: 'medium', color: { argb: 'ffffff' } },
      };
      descriptionSheet.getRow(6).height = 60;
      // Pending
      const timePeriods = descriptionSheet.getCell('C10');
      timePeriods.value = 'Pending';
      timePeriods.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '739fff' },
      };
      timePeriods.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: '000000' },
        bold: true
      };
      timePeriods.alignment = { vertical: 'middle', horizontal: 'left' };
      timePeriods.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getColumn(3).width = 80;
      const timePeriodValues = descriptionSheet.getCell('C11');
      timePeriodValues.value = 'If a VIN is listed as PENDING, the vehicle is currently under inspection.This could mean verifying eligibility, consent, or other criteria. The time required for the VIN to transition from PENDING to ACTIVE or FAILED stage may vary across different OEMs.';
      timePeriodValues.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'a8bdea' },
      };
      timePeriodValues.font = {
        name: 'Tahoma',
        size: 11,
        color: { argb: '131313' },
      };
      timePeriodValues.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
      timePeriodValues.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getRow(11).height = 60;
      // Failed
      const failedDetails = descriptionSheet.getCell('C12');
      failedDetails.value = 'Failed';
      failedDetails.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ff7d7d' },
      };
      failedDetails.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: '000000' },
        bold: true
      };
      failedDetails.alignment = { vertical: 'middle', horizontal: 'left' };
      failedDetails.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getColumn(3).width = 80;
      const failedDetailsParagraph = descriptionSheet.getCell('C13');
      failedDetailsParagraph.value = 'The attempt to enroll this VIN was unsuccessful. Reasons for failure can vary by OEM. Please attempt re-enrollment again.';
      failedDetailsParagraph.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f3b6b6' },
      };
      failedDetailsParagraph.font = {
        name: 'Tahoma',
        size: 11,
        color: { argb: '131313' },
      };
      failedDetailsParagraph.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
      failedDetailsParagraph.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getRow(13).height = 60;
      // Active
      const activeDetails = descriptionSheet.getCell('C14');
      activeDetails.value = 'Active';
      activeDetails.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2ca67e' },
      };
      activeDetails.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: '000000' },
        bold: true
      };
      activeDetails.alignment = { vertical: 'middle', horizontal: 'left' };
      activeDetails.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getColumn(3).width = 80;
      const activeDetailsParagraph = descriptionSheet.getCell('C15');
      activeDetailsParagraph.value = 'The VIN has been successfully enrolled and is now actively transmitting data. Fleet manager now has access to Fleet Summary, Tracking, Safety, Maintenance, and Fuel data for that VIN on CerebrumX Workspace. Please note: the fleet manager can unenroll an Active VIN at any time, which will stop all data transmission.';
      activeDetailsParagraph.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '95D3BF' },
      };
      activeDetailsParagraph.font = {
        name: 'Tahoma',
        size: 11,
        color: { argb: '131313' },
      };
      activeDetailsParagraph.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
      activeDetailsParagraph.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getRow(15).height = 60;
      // Un Enrolled
      // Active
      const unenrolledDetails = descriptionSheet.getCell('C16');
      unenrolledDetails.value = 'Un-enrolled';
      unenrolledDetails.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'fad691' },
      };
      unenrolledDetails.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: '000000' },
        bold: true
      };
      unenrolledDetails.alignment = { vertical: 'middle', horizontal: 'left' };
      unenrolledDetails.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getColumn(3).width = 80;
      const unenrolledDetailsParagraph = descriptionSheet.getCell('C17');
      unenrolledDetailsParagraph.value = 'The VIN has been unenrolled from the system at request by the fleet manager. The vehicle is no longer active or transmitting data. To resume data transmission from this VIN, please re-enroll it and wait for its status to change to ACTIVE.';
      unenrolledDetailsParagraph.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f3dfb8' },
      };
      unenrolledDetailsParagraph.font = {
        name: 'Tahoma',
        size: 11,
        color: { argb: '131313' },
      };
      unenrolledDetailsParagraph.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
      unenrolledDetailsParagraph.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'medium', color: { argb: 'FF000000' } },
      };
      descriptionSheet.getRow(17).height = 60;

      // Create the "Data" sheet and copy the first row from "Report" sheet
      const dataSheet = workbook.addWorksheet('Data', { views: [{ showGridLines: false }] });
      for (let col = 1; col <= 26; col++) {
        const cell = dataSheet.getCell(1, col);
        cell.font = {
          name: 'Tahoma',
          size: 12,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF25477B' },
        };
      }

      for (let col = 27; col <= 16384; col++) {
        dataSheet.getColumn(col).hidden = true;
      }

      const titleCellsData = dataSheet.getCell('A1');
      titleCellsData.value = 'VIN Enrollment Summary';
      titleCells.alignment.horizontal = 'left';

      const azugaCell_descdata = dataSheet.getCell('A2');
      azugaCell_descdata.value = this.customConsumer;;
      azugaCell_descdata.font = {
        name: 'Tahoma',
        size: 12,
        color: { argb: 'FFFA751A' },
      };
      azugaCell_desc.alignment = { vertical: 'middle' };

      const FleetIdCellsdata = dataSheet.getCell('A3');
      // Check if a specific fleet ID is selected
      if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
        FleetIdCellsdata.value = `FleetId: ${this.fleetIdData}`;
      } else {
        // If no specific fleet ID is selected, print all fleet IDs
        FleetIdCellsdata.value = `FleetIds: ${this.fleetIds}`;
      }
      FleetIdCellsdata.font = {
        name: 'Tahoma',
        size: 10,
        color: { argb: 'FF25477B' },
      };
      FleetIdCells.alignment = { vertical: 'middle' };

      // const FleetIdCellsValuedata = dataSheet.getCell('B3');
      // FleetIdCellsValuedata.value = this.fleetIdData
      // FleetIdCellsValuedata.font = {
      //   name: 'Tohama',
      //   size: 10,
      //   color: { argb: '000000' },
      // };
      // FleetIdCellsValuedata.alignment = { vertical: 'middle' };

      for (let col = 1; col <= 13; col++) {
        const cell = dataSheet.getCell(5, col);
        cell.font = {
          name: 'Tahoma',
          size: 10,
          color: { argb: '00000000' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'BFBFBF' },
        };
      }
      const headers5 = [
        'Fleet Id',
        'OEM',
        'VIN',
        'Enrollment Date',
        'Enrolled By',
        'Pending Status',
        'Active Date',
        'Failed Date',
        'Unenrolled Date',
        'Active Days',
        'Unenrolled By',
      ];
      // Set column widths to 10%
      headers5.forEach((header, index) => {
        dataSheet.getColumn(index + 1).width = dataSheet.columnCount * 0.8;
      });
      this.vinCountReport.forEach((item: any) => {
        dataSheet.addRow([
          item.fleetId,
          item.provider,
          item.vin,
          formatDate(item.enrollDate),
          item.enrollBy,
          item.pendingStatus,
          formatDate(item.activeDate),
          formatDate(item.failedDate),
          formatDate(item.unEnrollDate),
          item.activeDays,
          item.unEnrollBy,
        ]);
      });


      function formatDate(dateString: string | null): string {
        if (!dateString) {
          return '';
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return ''; // Return an empty string for invalid dates
        }

        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }

      for (let i = 0; i < headers5.length; i++) {
        const cell = dataSheet.getCell(5, 1 + i);
        cell.value = headers5[i];
      }
      for (let row = 6; row <= dataSheet.rowCount; row++) {
        for (let col = 1; col <= 12; col++) {
          const cell = dataSheet.getCell(row, col);
          cell.font = {
            name: 'Tahoma',
            size: 8,
            color: { argb: '#000000' },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }
      this.fleetSummaryDataDownloadReport()
      this.vinDataDownload()
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(blob, `VIN_enrollment_Summary_${this.customConsumer}_${this.date.getDate()} ${this.getMonthName(this.date.getMonth())}.xlsx`);
    } catch (error) {
    }
  }

  private formatDate(date: Date): string {
    const options = { year: 'numeric', month: 'short', day: '2-digit' } as const;
    return date.toLocaleDateString('en-US', options);
  }
  getMonthNames(month: number): string {
    return new Date(0, month).toLocaleString('en-US', { month: 'long' });
  }

  generateDates() {
    this.startDateed = this.generateMonthDates(this.startYear, this.currentMonth);
    this.endDateed = this.generateMonthDates(this.endYear, this.currentMonth);
  }

  generateMonthDates(year: number, month: number): number[] {
    let dates: number[] = [];
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      dates.push(0);
    }

    for (let i = 1; i <= lastDate; i++) {
      dates.push(i);
    }

    return dates;
  }

  changeMonth(direction: number) {
    this.currentMonth += direction;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.startMonthName = this.getMonthNames(this.currentMonth);
    this.endMonthName = this.getMonthNames(this.currentMonth);
    this.startYear = this.currentYear;
    this.endYear = this.currentYear;
  this.generateDates();

     }
  selectDate(type: 'start' | 'end', date: number) {
    if (date === 0) return;
    const selectedDate = `${this.currentYear}-${this.currentMonth + 1}-${date}`;
    if (type === 'start') {
      this.startDate = selectedDate;
    } else {
      this.endDate = selectedDate;
    }
  }

  isStartDate(date: number): boolean {
    return this.startDate === `${this.currentYear}-${this.currentMonth + 1}-${date}`;
  }

  isEndDate(date: number): boolean {
    return this.endDate === `${this.currentYear}-${this.currentMonth + 1}-${date}`;
  }

  isCardOpen = false;

  openCard() {
    this.isCardOpen = true;
  }

  closeCard() {
    this.isCardOpen = false;
  }

  handleOption(option: string) {
    this.selectedOption = option;
    this.selectedPeriod = this.timePeriods.find(period => period.value === option)?.value || '';
    this.onTimePeriodChangeData(this.selectedPeriod);
  }



  selectFleetId() {
    this.getTotalActivatedVehicle()
   // this.getTripsCount()
   // this.getMileDriven()
    //this.vehicleWithTripReocrdeded()
    this.idlingTime()
    this.getfuelConsumed()
    // this.getFuelMileage()
    this.getDriverScores()
    this.getSeatBelt()
    this.getAggresiveDrivers()
    this.getTotalOem()
    this.getTotalFuelType()
    this.getBodyClass()
    this.vinCountDatatillDate();
    this.fleetSummaryDataDownloadbasedonDatetill();
    this.vinDataDownload()
    this.  fleetSummaryDataDownloadReport()
    this.selectMonths = '';
    this.selectMonth = '';
        //call graph method start
    this.loadTelemetryData();
    this.loadFleetHealth();
    this.loadDriverSafety();
    this.loadFuelAnalytics();
    this.loadDashboardSummaryData();
    this.updateSelectedFleetDisplay();

  }

  onTimePeriodChange(event: any) {
    if (event === 'monthly') {
      this.idlingTime();
      if(this.user !='role_user_fleet'){
        this.selectConsumers();
        }
      this.getTotalActivatedVehicle();
     // this.getTripsCount();
      //this.getMileDriven();
      //this.vehicleWithTripReocrdeded();
      this.getfuelConsumed();
      this.getDriverScores();
      this.getSeatBelt();
      this.getAggresiveDrivers();
      this.getTotalOem();
      this.getTotalFuelType();
      this.getBodyClass();
    }
    if (event === 'weekly') {
      this.getTotalActivatedVehicleWeek()
      this.getTripsCountweek()
      this.getMileDrivenWeek()
      this.vehicleWithTripReocrdededWeek()
      this.idlingTimeWeek()
      this.getfuelConsumedWeek()
      this.getfuelConsumednewWeek()
      // this.getDriverScoresWeek()
      // this.getSeatBeltWeek()
      // this.getAggresiveDriversWeek()
      // if (this.customConsumer) {
      //   this.getTotalVehicleWeekConsumer()
      // }
    }
    if (event === 'daily') {
      this.getTotalActivatedVehicleDay()
      this.getTripsCountday()
      this.getMileDrivenDay()
      this.vehicleWithTripReocrdededDay()
      this.idlingTimeDay()
      this.getfuelConsumedDay()
      this.getfuelConsumednewDay()
      // this.getDriverScoresDay()
      // this.getSeatBeltDay()
      // this.getAggresiveDriversDay()
      // if (this.customConsumer) {
      //   this.getTotalActivatedVehicleDayConsumer()
      // }

    }
  }

  clearMonthSelection() {
    this.getTotalActivatedVehicle()
    //this.getTripsCount()
    //this.getMileDriven()
   // this.vehicleWithTripReocrdeded()
    this.idlingTime()
    this.getfuelConsumed()
    // this.getfuelConsumednew()
    this.getDriverScores()
    this.getSeatBelt()
  }

  clearFleetId() {
    this.fleetIdData = '';
    this.selectMonths = ''
    this.selectMonth = '';
    this.updateSelectedFleetDisplay();
  }

  // Activated Vehicle
  getTotalActivatedVehicle() {
    this.subscription$.add(
      this.dashboardservice.getTotalVehicles(this.customConsumer,this.fleetIdData,this.groupIdData,'').subscribe((res: any) => {
        this.totalActivatedVehicleCount = res.lastNMonthActiveVehicleCount;
        this.activeVehicless = this.totalActivatedVehicleCount[4].tripCount
        this.activatte = this.totalActivatedVehicleCount[3].tripCount
        if (this.totalActivatedVehicleCount[3].tripCount === 0) {
          this.percenTages = +100;
        } else {
          this.percenTages = (this.totalActivatedVehicleCount[4].tripCount - this.totalActivatedVehicleCount[3].tripCount) / this.totalActivatedVehicleCount[3].tripCount * 100;
        }
        this.activatedVehicleChartConsumer(this.totalActivatedVehicleCount)
      }, err => {
      })
    )
  }
  async getTotalActivatedVehicleWeek() {
    await this.subscription$.add(
      this.dashboardservice.getTotalVehicleWeekFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let totalActivatedVehicleCount = res.lastNWeeksActiveVehicleCount;
        if (totalActivatedVehicleCount.length > 0) {
          this.openIcon = false;
          this.closeIcon = true;
        }
        else {
          this.openIcon = true;
          this.closeIcon = false;
        }
        if (totalActivatedVehicleCount.length === 0) {
          this.activeVehicless = 0;
          this.percenTages = 0;
        } else {
          this.activeVehicless = totalActivatedVehicleCount[4].activeCount;
        }
        this.activatte = totalActivatedVehicleCount[3].activeCount
        if (totalActivatedVehicleCount[3].activeCount === 0) {
          this.percenTages = +100;
        } else {
          this.percenTages = (totalActivatedVehicleCount[4].activeCount - totalActivatedVehicleCount[3].activeCount) / totalActivatedVehicleCount[3].activeCount * 100;
        }
        this.activatedVehicleChartConsumerweek(totalActivatedVehicleCount)
      }, err => {
      })
    )
  }
  async getTotalActivatedVehicleDay() {
    await this.subscription$.add(
      this.dashboardservice.getTotalVehicleDayFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let totalActivatedVehicleCount = res.lastNDayActiveVehicleCount;
        if (totalActivatedVehicleCount.length > 0) {
          this.openIcon = false;
          this.closeIcon = true;
        }
        else {
          this.openIcon = true;
          this.closeIcon = false;
        }
        if (totalActivatedVehicleCount.length === 0) {
          this.activeVehicless = 0;
          this.percenTages = 0;
        } else {
          this.activeVehicless = totalActivatedVehicleCount[4].activeCount;
        }
        this.activatte = totalActivatedVehicleCount[3].activeCount
        if (totalActivatedVehicleCount[3].activeCount === 0) {
          this.percenTages = +100;
        } else {
          this.percenTages = (totalActivatedVehicleCount[4].activeCount - totalActivatedVehicleCount[3].activeCount) / totalActivatedVehicleCount[3].activeCount * 100;
        }
        this.activatedVehicleChartConsumerday(totalActivatedVehicleCount)
      }, err => {
      })
    )
  }

  activatedVehicleChartConsumer(data) {
    let labelData = [];
    let seriesData = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelData.push(formattedDate);
      seriesData.push(item.tripCount.toLocaleString());
    });
    const maxTripCount = Math.max(...seriesData);
    function determineYAxisMax(maxTripCount: number) {
      if (maxTripCount <= 20) {
        return 20;
      } else if (maxTripCount > 20 && maxTripCount <= 100) {
        return 100;
      } else if (maxTripCount > 100 && maxTripCount <= 500) {
        return 500;
      } else if (maxTripCount > 500 && maxTripCount < 1000) {
        return 1000;
      } else if (maxTripCount >= 1000 && maxTripCount <= 2000) {
        return 2000;
      } else {
        return 2000; // Default to 2000 if above the defined range
      }
    }
    const yAxisMax = this.customConsumer === 'smallboard' ? 20 : determineYAxisMax(maxTripCount);
    this.chartOptions4 = {
      chart: {
        toolbar: {
          show: false,
        },
        height: 300,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: '2',
        curve: 'smooth',
      },
      series: [{
        name: "Total Activated Vehicles",
        data: seriesData,
      }],
      colors: ['#2CA87F'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      labels: labelData,
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        categories: labelData,
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
          text: "Vehicles"
        },
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
          }
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val; // Show the actual value received from the API
            }
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.9,
            stops: [0, 100],
            colorStops: [
              {
                offset: 0,
                color: '#FF0000',
              },
              {
                offset: 100,
                color: '#FF0000',
              },
            ],
          },
        },
      },

    }
    this.vehicleSplitDonut = this.chartOptions4.series.every(element => element === 0);
    setInterval(() => {
      this.date = new Date()
    }, 1000)
  }
  async activatedVehicleChartConsumerweek(data) {
    let labelData = [];
    let seriesData = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelData.push(formattedDate);
      seriesData.push(item.activeCount);
    });
    const maxTripCount = Math.max(...seriesData);
    const yAxisMax = Math.ceil(maxTripCount / 10) * 10;

    this.chartOptions4 = {
      chart: {
        toolbar: {
          show: false,
        },
        height: 300,
        // width: 410,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: '2',
        curve: 'smooth',
      },
      series: [{
        name: "Total Activated Vehicles",
        data: seriesData,
      }],
      colors: ['#2CA87F'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      labels: labelData,
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5",],
        title: {
          offsetX: -10,
          offsetY: -13,
          text: "Week"
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
          offsetX: -8,
          offsetY: 0,
          text: "Vehicles"
        },
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
          }
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val; // Show the actual value received from the API
          }
        }
      },
    }


    this.vehicleSplitDonut = this.chartOptions4.series.every(element => element === 0);
    const tripCount = parseInt(seriesData[seriesData.length - 1]);
    setInterval(() => {
      this.date = new Date()
    }, 1000)
  }
  async activatedVehicleChartConsumerday(data) {
    let labelData = [];
    let seriesData = [];
    data.map((item) => {
      labelData.push(item.localDate);
      seriesData.push(item.activeCount);
    });
    const maxTripCount = Math.max(...seriesData);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    this.chartOptions4 = {
      chart: {
        toolbar: {
          show: false,
        },
        height: 300,
        // width: 410,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: '2',
        curve: 'smooth',
      },
      series: [{
        name: "Total Activated Vehicles",
        data: seriesData,
      }],
      colors: ['#2CA87F'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      labels: labelData,
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        categories: labelData,
        title: {
          offsetX: -10,
          offsetY: -13,
          text: "Day"
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
          offsetX: -8,
          offsetY: 0,
          text: "Vehicles"
        },
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
          }
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val; // Show the actual value received from the API
          }
        }
      },
    }

    this.vehicleSplitDonut = this.chartOptions4.series.every(element => element === 0);
    const tripCount = parseInt(seriesData[seriesData.length - 1]);

    setInterval(() => {
      this.date = new Date()
    }, 1000)
  }

  // Total Trips
  // getTripsCount() {
  //   this.spinner.show()
  //   this.subscription$.add(
  //     this.dashboardservice.getTotalTripCount(this.customConsumer, this.fleetIdData, '').subscribe((res: any) => {
  //       let tripResult = res.lastNMonthTripCount;
  //       this.tripData = tripResult[4].tripCount + tripResult[3].tripCount + tripResult[2].tripCount + tripResult[1].tripCount + tripResult[0].tripCount
  //       this.tripDetails(tripResult)
  //       setTimeout(() => {
  //         this.spinner.hide()
  //       }, 0);
  //     }, err => {
  //       this.spinner.hide()
  //     })
  //   )
  // }
  async getTripsCountweek() {
    this.subscription$.add(
      await this.dashboardservice.getTotalTripCountWeekFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let tripResult = res.lastNWeekTripCount;
        this.tripData = tripResult[4].tripCount + tripResult[3].tripCount + tripResult[2].tripCount + tripResult[1].tripCount + tripResult[0].tripCount
        // this.tripsdataLess = tripResult[3].tripCount
        this.zeroData = tripResult[4].tripCount
        if (tripResult[3].tripCount === 0) {
          this.percenTage = +100;
        } else {
          this.percenTage = (tripResult[4].tripCount - tripResult[3].tripCount) / tripResult[3].tripCount * 100
        }
        this.tripDetailsweek(tripResult)
      }, err => {
      })
    )
  }
  async getTripsCountday() {
    this.subscription$.add(
      await this.dashboardservice.getTotalTripCountDayFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let tripResult = res.lastNDayTripCount;
        this.tripData = tripResult[4].tripCount + tripResult[3].tripCount + tripResult[2].tripCount + tripResult[1].tripCount + tripResult[0].tripCount
        // this.tripsdataLess = tripResult[3].tripCount
        this.zeroData = tripResult[4].tripCount
        if (tripResult[3].tripCount === 0) {
          this.percenTage = +100;
        } else {
          this.percenTage = (tripResult[4].tripCount - tripResult[3].tripCount) / tripResult[3].tripCount * 100
        }
        this.tripDetailsday(tripResult)
      }, err => {
      })
    )
  }
  tripDetails(data) {
    let labelDatas: string[] = [];
    let seriesDatas: number[] = [];
    data.sort((a, b) => {
      const [yearA, monthA] = a.yearMonth.split("-").map(Number);
      const [yearB, monthB] = b.yearMonth.split("-").map(Number);
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return monthA - monthB;
    });
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);
      labelDatas.push(formattedDate);
      seriesDatas.push(item.tripCount);
    });
    const maxTripCount = Math.max(...seriesDatas);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    this.chartOptions5 = {
      series: [
        {
          name: 'Total Trips',
          data: seriesDatas,
        },
      ],
      colors: ['#FA751A'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      chart: {
        toolbar: {
          show: false,
        },
        height: 300,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        offsetX: 0,
        categories: labelDatas,
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
          text: "Trips"
        },
        min: 0,
        max: yAxisMax,
        tickAmount: 5,

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
    };
    setInterval(() => {
      this.date = new Date()
    }, 1000)
  }
  tripDetailsday(data) {
    let labelDatas = [];
    let seriesDatas = [];
    data.map((item) => {
      labelDatas.push(item.localDate);
      seriesDatas.push(item.tripCount);
    });
    const maxTripCount = Math.max(...seriesDatas);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;

    if (data.every(item => item.tripCount === 0)) {
      this.chartOptions5 = {
        series: [],
        chart: {
          height: 0,
          width: 0,
          type: 'area',
        },
      };
    } else {
      this.chartOptions5 = {
        series: [
          {
            name: 'Total Trips',
            data: seriesDatas,
          },
        ],
        colors: ['#FA751A'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.2,
            opacityTo: 0.4,
            stops: [0, 90, 100],
          },
        },
        chart: {
          height: 300,
          // width: 410,
          type: 'area',
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: '2',
          curve: 'smooth',
        },
        grid: {
          show: false,
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis:
        {
          offsetX: 0,
          categories: labelDatas,
          title: {
            offsetX: -10,
            offsetY: -13,
            text: "Day"
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
            offsetX: -8,
            offsetY: 0,
            text: "Trips"
          },
          min: 0,
          max: yAxisMax,
          tickAmount: 5,

          labels: {
            show: true,
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
            }
          },
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val; // Show the actual value received from the API
            }
          }
        },
      };
    }
  }
  tripDetailsweek(data) {
    let labelDatas: string[] = [];
    let seriesDatas: number[] = [];
    data.sort((a, b) => {
      const [yearA, monthA] = a.yearMonth.split("-").map(Number);
      const [yearB, monthB] = b.yearMonth.split("-").map(Number);
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return monthA - monthB;
    });
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);
      labelDatas.push(formattedDate);
      seriesDatas.push(item.tripCount);
    });

    const maxTripCount = Math.max(...seriesDatas);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    if (data.every(item => item.tripCount === 0)) {
      this.chartOptions5 = {
        series: [],
        chart: {
          height: 0,
          width: 0,
          type: 'area',
        },
      };
    } else {
      this.chartOptions5 = {
        series: [
          {
            name: 'Total Trips',
            data: seriesDatas,
          },
        ],
        colors: ['#FA751A'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.2,
            opacityTo: 0.4,
            stops: [0, 90, 100],
          },
        },
        chart: {
          height: 300,
          // width: 410,
          type: 'area',
          toolbar: {
            show: false,
          },
          zoom: {
            enabled: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: '2',
          curve: 'smooth',
        },
        grid: {
          show: false,
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis:
        {
          offsetX: 0,
          categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
          title: {
            offsetX: -10,
            offsetY: -13,
            text: "Week"
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
            offsetX: -8,
            offsetY: 0,
            text: "Trips"
          },
          min: 0,
          max: yAxisMax,
          tickAmount: 5,

          labels: {
            show: true,
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
            }
          },
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val; // Show the actual value received from the API
            }
          }
        },
      };

    }
  }


  // Miles Dribven
  // getMileDriven() {
  //   this.subscription$.add(
  //     this.dashboardservice.getMilesDriven(this.customConsumer, this.fleetIdData, '').subscribe((res: any) => {
  //         this.totalMilesDrivenCount = res.milesDriven;
  //         this.milesDrivenMonthsWise = this.totalMilesDrivenCount[4].milesDriven + this.totalMilesDrivenCount[3].milesDriven + this.totalMilesDrivenCount[2].milesDriven + this.totalMilesDrivenCount[1].milesDriven + this.totalMilesDrivenCount[0].milesDriven
  //         this.milsDrivenData(this.totalMilesDrivenCount);
  //       }, err => {

  //       })
  //   );
  // }
  async getMileDrivenWeek() {
    this.subscription$.add(
      await this.dashboardservice.getMilesDrivenWeekFleet(this.customConsumer, this.fleetIdData)
        .pipe(take(1))
        .subscribe((res: any) => {
          this.totalMilesDrivenCount = res.milesDriven;
          this.milesDrivenMonthsWise = this.totalMilesDrivenCount[4].milesDriven + this.totalMilesDrivenCount[3].milesDriven + this.totalMilesDrivenCount[2].milesDriven + this.totalMilesDrivenCount[1].milesDriven + this.totalMilesDrivenCount[0].milesDriven
          if (this.totalMilesDrivenCount[3].milesDriven === 0) {
            this.percenTagesMiles = +100;
          } else {
            this.percenTagesMiles = (this.totalMilesDrivenCount[4].milesDriven - this.totalMilesDrivenCount[3].milesDriven) / this.totalMilesDrivenCount[3].milesDriven * 100;
          } this.milsDrivenDataWeek(this.totalMilesDrivenCount);
        }, err => {
        })
    );
  }
  async getMileDrivenDay() {
    this.subscription$.add(
      await this.dashboardservice.getMilesDrivenDayFleet(this.customConsumer, this.fleetIdData)
        .pipe(take(1))
        .subscribe((res: any) => {
          this.totalMilesDrivenCount = res.milesDriven;
          this.milesDrivenMonthsWise = this.totalMilesDrivenCount[4].milesDriven + this.totalMilesDrivenCount[3].milesDriven + this.totalMilesDrivenCount[2].milesDriven + this.totalMilesDrivenCount[1].milesDriven + this.totalMilesDrivenCount[0].milesDriven
          if (this.totalMilesDrivenCount[3].milesDriven === 0) {
            this.percenTagesMiles = +100;
          } else {
            this.percenTagesMiles = (this.totalMilesDrivenCount[4].milesDriven - this.totalMilesDrivenCount[3].milesDriven) / this.totalMilesDrivenCount[3].milesDriven * 100;
          } this.milsDrivenDataDay(this.totalMilesDrivenCount);
        }, err => {
        })
    );
  }
  milsDrivenData(data) {
    let labelDatas: string[] = [];
    let seriesDatas: number[] = [];
    data.sort((a, b) => {
      const [yearA, monthA] = a.yearMonth.split("-").map(Number);
      const [yearB, monthB] = b.yearMonth.split("-").map(Number);
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return monthA - monthB;
    });
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);
      labelDatas.push(formattedDate);
      seriesDatas.push(item.milesDriven.toFixed(0));
    });
    const maxTripCount = Math.max(...seriesDatas);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    this.chartOptions10 = {
      chart: {
        toolbar: {
          show: false,
        },
        height: 300,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      series: [{
        name: "Total Miles Driven",
        data: seriesDatas
      }],

      colors: ['#4680FF'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      labels: labelDatas,
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        categories: labelDatas,
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
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
      },
      yaxis: {
        title: {
          offsetX: 0,
          offsetY: -15,
          text: "Miles"
        },
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
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
    }
    setInterval(() => {
      this.date = new Date()
    }, 1000)
  }
  milsDrivenDataWeek(data) {
    let labelDatas: string[] = [];
    let seriesDatas: number[] = [];
    data.sort((a, b) => {
      const [yearA, monthA] = a.yearMonth.split("-").map(Number);
      const [yearB, monthB] = b.yearMonth.split("-").map(Number);
      if (yearA !== yearB) {
        return yearA - yearB;
      }
      return monthA - monthB;
    });
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);
      labelDatas.push(formattedDate);
      seriesDatas.push(item.milesDriven.toFixed(0));
    });
    const maxTripCount = Math.max(...seriesDatas);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    if (data.every(item => item.milesDriven === 0)) {
      this.chartOptions10 = {
        series: [],
        chart: {
          height: 0,
          width: 0,
          type: 'area',
        },
      };
    } else {
      this.chartOptions10 = {
        chart: {
          toolbar: {
            show: false,
          },
          height: 300,
          // width: 430,
          type: 'area',
          zoom: {
            enabled: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: '2',
          curve: 'smooth',
        },
        series: [{
          name: "Total Miles Driven",
          data: seriesDatas
        }],

        colors: ['#4680FF'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.2,
            opacityTo: 0.4,
            stops: [0, 90, 100],
          },
        },
        labels: labelDatas,
        grid: {
          show: false,
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis: {
          categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
          title: {
            offsetX: -10,
            offsetY: -13,
            text: "Week"
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
            offsetX: 0,
            offsetY: 0,
            text: "Miles"
          },
          min: 0,
          max: yAxisMax,
          tickAmount: 5,
          labels: {
            show: true,
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
            }
          },
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val; // Show the actual value received from the API
            }
          }
        },
      }
    }
  }
  milsDrivenDataDay(data) {
    let labelDatas: string[] = [];
    let seriesDatas: number[] = [];
    data.map((item) => {
      labelDatas.push(item.localDate);
      seriesDatas.push(item.milesDriven);
    });
    const maxTripCount = Math.max(...seriesDatas);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    if (data.every(item => item.milesDriven === 0)) {
      this.chartOptions10 = {
        series: [],
        chart: {
          height: 0,
          width: 0,
          type: 'area',
        },
      };
    } else {
      this.chartOptions10 = {
        chart: {
          toolbar: {
            show: false,
          },
          height: 300,
          // width: 430,
          type: 'area',
          zoom: {
            enabled: false,
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: '2',
          curve: 'smooth',
        },
        series: [{
          name: "Total Miles Driven",
          data: seriesDatas
        }],

        colors: ['#4680FF'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.2,
            opacityTo: 0.4,
            stops: [0, 90, 100],
          },
        },
        labels: labelDatas,
        grid: {
          show: false,
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: false,
            },
          },
        },
        xaxis: {
          categories: labelDatas,
          title: {
            offsetX: -10,
            offsetY: -13,
            text: "Day"
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
            offsetX: 0,
            offsetY: 0,
            text: "Miles"
          },
          min: 0,
          max: yAxisMax,
          tickAmount: 5,
          labels: {
            show: true,
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
            }
          },
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val; // Show the actual value received from the API
            }
          }
        },
      }
    }
  }


  // Trip Summary
  // async vehicleWithTripReocrdeded() {
  //   this.subscription$.add(
  //     await this.dashboardservice.tripSummaryFound(this.customConsumer, this.fleetIdData, '').subscribe((res: any) => {
  //       let data = res
  //       this.vehicleWithTripReocrded(data);
  //     }, err => {
  //     })
  //   );
  // }
  vehicleWithTripReocrded(data) {
    let labelDatas = []
    let totalTrips =[]
    let nototalTrips = []
    data.noTripsFoundVin.forEach((item, index) => {
      const [year, month] = item.yearMonth.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);
      labelDatas.push(formattedDate);
      if (data.tripsFoundVin[index]) {
        nototalTrips.push(data.noTripsFoundVin[index].count);
        totalTrips.push(data.tripsFoundVin[index].count);
      } else {
        nototalTrips.push(0);
        totalTrips.push(0);
      }
    });
    const maxTotalTrips = Math.max(...totalTrips);
    this.chartWithNoTrip = {
      series: [
        {
          name: 'Vehicles with trips recorded',
          data: totalTrips,
        },
        {
          name: 'Vehicles with no trips recorded',
          data: nototalTrips
        }
      ],
      chart: {
        height: 350,
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
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: 'around',
          columnWidth: '45%',
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
        },
      },
      colors: ['#4680FF', '#FA751A'],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: 1,
        offsetX: 25,
        formatter: function (val: any, opt: any) {
          if (val > 0) {
            return val;
          }
        },
      },
      stroke: {
        colors: ["transparent"],
        width: 3
      },
      legend: {
        show: true,
        itemWrap: true,
        position: 'top',
        horizontalAlign: 'right',
      },
      grid: {
        strokeDashArray: 7,
      },
      xaxis: {
        categories: labelDatas,
        title: {
          offsetX: 20,
          offsetY: 10,
          text: "Vehicles"
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
          offsetX: 20,
          offsetY: 0,
          text: "Month"
        },
        min: 0,
        max: maxTotalTrips + 50,
        tickAmount: 6,
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
    };
  }
  vehicleWithTripReocrdedWeek(data) {
    let labelDatas = []
    let totalTrips = []
    let nototalTrips = []
    data.noTripsFoundVin.forEach((item, index) => {
      const [year, month] = item.yearMonth.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);
      labelDatas.push(formattedDate);
      if (data.tripsFoundVin[index]) {
        nototalTrips.push(data.noTripsFoundVin[index].count);
        totalTrips.push(data.tripsFoundVin[index].count);
      } else {
        nototalTrips.push(0);
        totalTrips.push(0);
      }
    });
    const maxTotalTrips = Math.max(...totalTrips);
    this.chartWithNoTrip = {
      series: [
        {
          name: 'Vehicles with trips recorded',
          data: totalTrips,
        },
        {
          name: 'Vehicles with no trips recorded',
          data: nototalTrips
        }
      ],
      chart: {
        height: 350,
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
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: 'around',
          columnWidth: '45%',
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
        },
      },
      colors: ['#4680FF', '#FA751A'],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: 1,
        offsetX: 25,
        formatter: function (val: any, opt: any) {
          if (val > 0) {
            return val;
          }
        },
      },
      stroke: {
        colors: ["transparent"],
        width: 3
      },
      legend: {
        show: true,
        itemWrap: true,
        position: 'top',
        horizontalAlign: 'right',
      },
      grid: {
        strokeDashArray: 7,
      },
      xaxis: {
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        title: {
          offsetX: 20,
          offsetY: 10,
          text: "Vehicles"
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
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
          }
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val; // Show the actual value received from the API
          }
        }
      },
      yaxis: {
        title: {
          offsetX: 20,
          offsetY: 0,
          text: "Week"
        },
        min: 0,
        max: maxTotalTrips + 50,
        tickAmount: 6,
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
    };
  }
  vehicleWithTripReocrdedDay(data) {
    let labelDatas = []
    let totalTrips = []
    let nototalTrips = []
    data.noTripsFoundVin.forEach((item, index) => {
      // const [year, month] = item.yearMonth.split("-").map(Number);
      // const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);
      labelDatas.push(data.noTripsFoundVin[index].localDate);
      if (data.tripsFoundVin[index]) {
        nototalTrips.push(data.noTripsFoundVin[index].count);
        totalTrips.push(data.tripsFoundVin[index].count);
      } else {
        nototalTrips.push(0);
        totalTrips.push(0);
      }
    });
    const maxTotalTrips = Math.max(...totalTrips);
    this.chartWithNoTrip = {
      series: [
        {
          name: 'Vehicles with trips recorded',
          data: totalTrips,
        },
        {
          name: 'Vehicles with no trips recorded',
          data: nototalTrips
        }
      ],
      chart: {
        height: 350,
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
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: 'around',
          columnWidth: '45%',
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },
        },
      },
      colors: ['#4680FF', '#FA751A'],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: 1,
        offsetX: 25,
        formatter: function (val: any, opt: any) {
          if (val > 0) {
            return val;
          }
        },
      },
      stroke: {
        colors: ["transparent"],
        width: 3
      },
      legend: {
        show: true,
        itemWrap: true,
        position: 'top',
        horizontalAlign: 'right',
      },
      grid: {
        strokeDashArray: 7,
      },
      xaxis: {
        categories: labelDatas,
        title: {
          offsetX: 20,
          offsetY: 10,
          text: "Vehicles"
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
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
          }
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val; // Show the actual value received from the API
          }
        }
      },
      yaxis: {
        title: {
          offsetX: 20,
          offsetY: 0,
          text: "Day"
        },
        min: 0,
        max: maxTotalTrips + 80,
        tickAmount: 6,
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
    };
  }
  async vehicleWithTripReocrdededWeek() {
    this.subscription$.add(
      await this.dashboardservice.TripFoundorNofoundWeekFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let data = res
        this.vehicleWithTripReocrdedWeek(data);
      }, err => {
      })
    );
  }
  async vehicleWithTripReocrdededDay() {
    this.subscription$.add(
      await this.dashboardservice.TripFoundorNofoundDayFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let data = res
        this.vehicleWithTripReocrdedDay(data);
      }, err => {
      })
    );
  }

  //Idling
  async idlingTime() {
    this.subscription$.add(
      await this.dashboardservice.getIdlingTime(this.customConsumer, this.fleetIdData, '').subscribe((res: any) => {
        this.totalIdlingTime = res;
        let totalSeconds = 0;
        this.totalIdlingTime.forEach(item => {
          if (typeof item.totalIdlingDuration === 'number') {
            totalSeconds += item.totalIdlingDuration;
          }});
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
        this.totalIdlingDuration = `${this.pad(totalHours)}:${this.pad(totalMinutes)}`;
        this.idlingTimeChart(this.totalIdlingTime);
      }, err => {}));
  }
  async idlingTimeWeek() {
    this.subscription$.add(
      await this.dashboardservice.getIdlingTimeWeeksFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
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
        this.idlingTimeChartWeek(this.totalIdlingTime);
      }, err => {
      })
    );
  }
  async idlingTimeDay() {
    this.subscription$.add(
      await this.dashboardservice.getIdlingTimeDayFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
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
        this.idlingTimeChartDay(this.totalIdlingTime);
      }, err => {
      })
    );
  }

  idlingTimeChartWeek(data) {
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
    if (data.every(item => item.totalIdlingDuration === 0 && item.totalDuration === null)) {
      this.showNoDataImage = true;
    } else {
      this.showNoDataImage = false;
    }
    this.idlingChart = {
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
        height: 300,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
      },
      stroke: {
        width: [0, 2],
        curve: 'smooth',
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 6,
          borderRadiusApplication: 'around',
          columnWidth: data.length === 1 ? "10%" : "45%",
          distributed: false,
          borderWidth: 0,
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },

        },
      },
      colors: ["#4680ff", "#2ca87f"],
      xaxis: {
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "Week"
        },
      },
      yaxis: [
        {
          axisTicks: {
            show: true
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
            },
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
          },
          title: {
            offsetX: -10,
            offsetY: 0,
            text: "Idling Duration(Hours)"
          },
          tooltip: {
            enabled: false
          }
        },
        {
          seriesName: "Idling Trip Duration (%)",
          opposite: true,
          axisTicks: {
            show: true
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            style: {
              colors: "#000000",
              fontSize: '18px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
          },
          title: {
            offsetX: 10,
            offsetY: 0,
            text: "Idling Trip Duration(%)"
          },
        },
      ],
      tooltip: {
        shared: true,
        //   custom: [
        //     function({ seriesIndex, dataPointIndex, w }) {
        //       // Custom tooltip for candlestick series
        //       const candlestickData = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        //       const candlestickData1 = w.globals.initialSeries[1].data[dataPointIndex];


        //       return `
        //   <div class="custom-tooltip">
        //     <div class="tooltip-header">${candlestickData}</div>
        //     <div class="tooltip-body">${candlestickData1}</div>
        //   </div>
        // `;
        // return '<div class="arrow_box">' +
        // '<span>' + candlestickData + '</span>' +
        // '<span>' + candlestickData1 + '</span>' +
        // '</div>'
        //   }

        // ]
      },
      legend: {
        show: false
      },
    };
  }
  idlingTimeChartDay(data) {
    let labelData = [];
    let seriesData = [];
    let seriesDatas = [];
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
    if (data.every(item => item.totalIdlingDuration === 0 && item.totalDuration === null)) {
      this.showNoDataImage = true;
    } else {
      this.showNoDataImage = false;
    }
    this.idlingChart = {
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
        height: 300,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false,
        offsetY: 1,
        offsetX: 20,
      },
      stroke: {
        width: [0, 2],
        curve: 'smooth',
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 6,
          borderRadiusApplication: 'around',
          columnWidth: data.length === 1 ? "10%" : "45%",
          distributed: false,
          borderWidth: 0,
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },

        },
      },
      colors: ["#4680ff", "#2ca87f"],
      xaxis: {
        categories: labelData,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "Day"
        },
      },
      yaxis: [
        {
          axisTicks: {
            show: true
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            show: true,
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
            },
            style: {
              colors: "#000000",
              fontSize: '16px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
          },
          title: {
            offsetX: -10,
            offsetY: 0,
            text: "Idling Duration(Hours)"
          },
          tooltip: {
            enabled: false
          }
        },
        {
          seriesName: "Idling Trip Duration (%)",
          opposite: true,
          axisTicks: {
            show: true
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            style: {
              colors: "#000000",
              fontSize: '18px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
          },
          title: {
            offsetX: 10,
            offsetY: 0,
            text: "Idling Trip Duration(%)"
          },
        },
      ],
      tooltip: {
        shared: true,
        //   custom: [
        //     function({ seriesIndex, dataPointIndex, w }) {
        //       // Custom tooltip for candlestick series
        //       const candlestickData = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        //       const candlestickData1 = w.globals.initialSeries[1].data[dataPointIndex];


        //       return `
        //   <div class="custom-tooltip">
        //     <div class="tooltip-header">${candlestickData}</div>
        //     <div class="tooltip-body">${candlestickData1}</div>
        //   </div>
        // `;
        // return '<div class="arrow_box">' +
        // '<span>' + candlestickData + '</span>' +
        // '<span>' + candlestickData1 + '</span>' +
        // '</div>'
        //   }

        // ]
      },
      legend: {
        show: false
      },
    };
  }
  idlingTimeChart(data) {
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
    this.idlingChart = {
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
        height: 320,
        Width:460,
        type: "line",
        stacked: false,
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false
        }
      },
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
        width: [0, 2],
        curve: 'smooth',
      },
      plotOptions: {
        bar: {
          // barHeight: '70%',
          borderRadius: 6,
          borderRadiusApplication: 'around',
          columnWidth: data.length === 1 ? "10%" : "35%",
          distributed: false,
          borderWidth: 0,
          startingShape: 'rounded',
          endingShape: 'rounded',
          dataLabels: {
            position: 'top',
          },

        },
      },
      xaxis: {
        categories: labelData,
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
          text: "Month"
        },
      },
      yaxis: [
        {
          axisTicks: {
            show: true
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
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
          title: {
            offsetX: -10,
            offsetY: 0,
            text: "Idling Duration(Hours)"
          },
          tooltip: {
            enabled: false
          }
        },
        {
          seriesName: "Income",
          opposite: true,
          axisTicks: {
            show: true
          },
          axisBorder: {
            show: false,
            color: "#ffffff"
          },
          labels: {
            style: {
              colors: "#000000",
              fontSize: '18px',
              fontWeight: 500,
              cssClass: "chart-label-x"
            },
          },
          title: {
            offsetX: 10,
            offsetY: 0,
            text: "Idling Trip Duration(%)"
          },
        },
      ],
      tooltip: {
        fixed: {
          enabled: false,
          position: "topLeft", // topRight, topLeft, bottomRight, bottomLeft
          offsetY: 30,
          offsetX: 60
        }
      },
      legend: {
        show: false
      },
    };
  }
  calculateTotalIdlingTime(items: any[]): string {
    let totalSeconds = 0;
    items.forEach(item => {
      if (typeof item.totalIdlingDuration === 'string' && item.totalIdlingDuration !== '00:00:00') {
        const durationParts = item.totalIdlingDuration.split(':');
        const hours = parseInt(durationParts[0]);
        const minutes = parseInt(durationParts[1]);
        const seconds = parseInt(durationParts[2]);
        totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
      }
    });
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    return `${this.pad(totalHours)}:${this.pad(totalMinutes)}`;
  }
  pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  getfuelConsumed() {
    this.subscription$.add(
      this.dashboardservice.getFuelConsume(this.customConsumer).subscribe((res: any) => {
        let fuelConsumed = res
        let fuelMileage = res;
        this.tripFleetConsumed(fuelConsumed)
        this.tripFleetMileage(fuelMileage)

      }, err => {

      })
    )
  }
  getfuelConsumedFleet() {
    this.subscription$.add(
      this.dashboardservice.getFuelConsumeFleetsMain(this.customConsumer, this.fleetIdData).subscribe(
        (res: any) => {
          let fuelConsumed = res;
          let fuelMileage = res;
          this.tripFleetConsumed(fuelConsumed);
          this.tripFleetMileage(fuelMileage);
        },
        err => {
          console.error('Error fetching fuel consumed fleet data', err);
        }
      )
    );
  }
  async getfuelConsumedWeek() {
    this.subscription$.add(
      await this.dashboardservice.getFuelConsumeWeekFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let fuelConsumed = res
        // let fuelMileage = res;
        this.tripFleetConsumedWeek(fuelConsumed)
        // this.tripFleetMileage(fuelMileage)
      }, err => {
      })
    )
  }
  async getfuelConsumedDay() {
    this.subscription$.add(
      await this.dashboardservice.getFuelConsumeDayFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        let fuelConsumed = res
        // let fuelMileage = res;
        this.tripFleetConsumedDay(fuelConsumed)
        // this.tripFleetMileage(fuelMileage)
      }, err => {
      })
    )
  }
  async getfuelConsumednew() {
    this.subscription$.add(
      await this.dashboardservice.getFuelConsume(this.customConsumer).subscribe((res: any) => {
        // let fuelConsumed = res
        let fuelMileage = res;
        // this.tripFleetConsumed(fuelConsumed)
        this.tripFleetMileage(fuelMileage)
      }, err => {
      })
    )
  }
  async getfuelConsumednewWeek() {
    this.subscription$.add(
      await this.dashboardservice.getFuelConsumeWeekFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        // let fuelConsumed = res
        let fuelMileage = res;
        // this.tripFleetConsumed(fuelConsumed)
        this.tripFleetMileageWeek(fuelMileage)
      }, err => {
      })
    )
  }
  async getfuelConsumednewDay() {
    this.subscription$.add(
      await this.dashboardservice.getFuelConsumeDayFleet(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
        // let fuelConsumed = res
        let fuelMileage = res;
        // this.tripFleetConsumed(fuelConsumed)
        this.tripFleetMileageDay(fuelMileage)
      }, err => {
      })
    )
  }
  tripFleetConsumedWeek(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDataFuel = [];
    let seriesDataFuel = [];
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelDataFuel.push(formattedDate);
      seriesDataFuel.push(item.totalFuelConsumed.toFixed(0));
    });
    console.log(seriesDataFuel,'changesss');

    this.chartOptionsFuelConsumed = {
      series: [
        {
          name: "Fuel Consumed (gal)",
          data: seriesDataFuel
        }
      ],
      chart: {
        height: 260,
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
          columnWidth: data.length < 2 ? '15%' : '25%',
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
        formatter: function (val, opt) {
          if (val > 0) {
            return val.toLocaleString();
          }
        },
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
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
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
          text: "Fuel Consumed (gal)",
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
          }
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val; // Show the actual value received from the API
          }
        }
      },
    }
  }
  tripFleetConsumedDay(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDataFuel = [];
    let seriesDataFuel = [];
    data.forEach((item) => {
      labelDataFuel.push(item.date);
      seriesDataFuel.push(item.totalFuelConsumed.toFixed(0));
    });

    this.chartOptionsFuelConsumed = {
      series: [
        {
          name: "Fuel Consumed (gal)",
          data: seriesDataFuel
        }
      ],
      chart: {
        height: 260,
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
          columnWidth: data.length < 2 ? '15%' : '25%',
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
        formatter: function (val, opt) {
          if (val > 0) {
            return val.toLocaleString();
          }
        },
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
        categories: labelDataFuel,
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
          text: "Fuel Consumed (gal)",
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: function (value) {
            return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
          }
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val; // Show the actual value received from the API
          }
        }
      },
    }
  }
  tripFleetMileage(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDatamMileage = [];
    let seriesDataMileage = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelDatamMileage.push(formattedDate);
      if (item.averageMileageMPG !== null && item.averageMileageMPG !== undefined) {
        seriesDataMileage.push(item.averageMileageMPG.toFixed(2));
      } else {
        seriesDataMileage.push(null); // or any other placeholder value you want to use
      }
    });

    this.chartOptionsFleetMileage = {
      series: [
        {
          name: 'Fuel Mileage (mpg)',
          data: seriesDataMileage,
          type: 'area',
          color: '#4680FF',
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.2,
              opacityTo: 0.4,
              stops: [0, 90, 100],
            },
          },
        },
      ],
      colors: ['#4680FF'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      chart: {
        toolbar: {
          show: false,
        },
        height: 260,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: '2',
        curve: 'smooth',
      },
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        offsetX: 0,
        categories: labelDatamMileage,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "Month"
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
        min: 0,
        max: 70,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
        title: {
          offsetX: -10,
          offsetY: 0,
          text: "Fuel Mileage (mpg)"
        },
      },
    };
  }
  tripFleetMileageWeek(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDatamMileage = [];
    let seriesDataMileage = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelDatamMileage.push(formattedDate);
      if (item.averageMileageMPG !== null && item.averageMileageMPG !== undefined) {
        seriesDataMileage.push(item.averageMileageMPG.toFixed(2));
      } else {
        seriesDataMileage.push(null); // or any other placeholder value you want to use
      }
    });

    this.chartOptionsFleetMileage = {
      series: [
        {
          name: 'Fuel Mileage (mpg)',
          data: seriesDataMileage,
          type: 'area',
          color: '#4680FF',
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.2,
              opacityTo: 0.4,
              stops: [0, 90, 100],
            },
          },
        },
      ],
      colors: ['#4680FF'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      chart: {
        toolbar: {
          show: false,
        },
        height: 260,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: '2',
        curve: 'smooth',
      },
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        offsetX: 0,
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "Week"
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
        min: 0,
        max: 35,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
        title: {
          offsetX: -10,
          offsetY: 0,
          text: "Fuel Mileage (mpg)"
        },
      },
    };
  }
  tripFleetMileageDay(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDatamMileage = [];
    let seriesDataMileage = [];
    data.map((item) => {
      labelDatamMileage.push(item.date);
      if (item.averageMileageMPG !== null && item.averageMileageMPG !== undefined) {
        seriesDataMileage.push(item.averageMileageMPG.toFixed(2));
      } else {
        seriesDataMileage.push(null); // or any other placeholder value you want to use
      }
    });

    this.chartOptionsFleetMileage = {
      series: [
        {
          name: 'Fuel Mileage (mpg)',
          data: seriesDataMileage,
          type: 'area',
          color: '#4680FF',
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.2,
              opacityTo: 0.4,
              stops: [0, 90, 100],
            },
          },
        },
      ],
      colors: ['#4680FF'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      chart: {
        toolbar: {
          show: false,
        },
        height: 260,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: '2',
        curve: 'smooth',
      },
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      xaxis: {
        offsetX: 0,
        categories: labelDatamMileage,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "Month"
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
        min: 0,
        max: 35,
        tickAmount: 5,
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '16px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
        },
        title: {
          offsetX: -10,
          offsetY: 0,
          text: "Fuel Mileage (mpg)"
        },
      },
    };
  }
  tripFleetConsumed(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDataFuel = [];
    let seriesDataFuel = [];
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelDataFuel.push(formattedDate);
      seriesDataFuel.push(item.totalFuelConsumed.toFixed(0));
    });
    console.log(seriesDataFuel,'changesss');

    this.chartOptionsFuelConsumed = {
      series: [
        {
          name: "Fuel Consumed (gal)",
          data: seriesDataFuel
        }
      ],
      chart: {
        height: 260,
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
          columnWidth: data.length < 2 ? '15%' : '20%',
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
        formatter: function (val, opt) {
          if (val > 0) {
            return val.toLocaleString();
          }
        },
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
        categories: labelDataFuel,
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
          text: "Fuel Consumed (gal)",
        },
        labels: {
          show: true,
          style: {
            colors: "#000000",
            fontSize: '18px',
            fontWeight: 500,
            cssClass: "chart-label-x"
          },
          formatter: function (val) {
            return Math.round(val).toString();
          }
        },
      }
    }
  }
  async changeMonthFuleMileage() {
    const selectedMonthValue = this.selectMonths;
    const selectedMonth = this.monthYear.find(item => item.value === selectedMonthValue);
    this.subscription$.add(
      await this.dashboardservice.getmonthFuelMileage(this.customConsumer, selectedMonthValue, this.fleetIdData).subscribe(
        (res: any) => {
          let montlyMileageData = res;
          this.tripFuelMileageMonth(montlyMileageData)
        },
        err => {
        }
      )
    );
  }
  async changeMonthFuleConsumed() {
    const selectedMonthValue = this.selectMonth;
    const selectedMonth = this.monthYear.find(item => item.value === selectedMonthValue);
    this.subscription$.add(
      await this.dashboardservice.getmonthFuelMileage(this.customConsumer, selectedMonthValue, this.fleetIdData).subscribe(
        (res: any) => {
          let monthlyConsumedData = res;
          this.tripFleetConsumedMonth(monthlyConsumedData)
        },
        err => {
        }
      )
    );


  }
  tripFuelMileageMonth(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDatamMileage = [];
    let seriesDataMileage = [];
    data.map((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelDatamMileage.push(formattedDate);
      seriesDataMileage.push(item.mileageMPG.toFixed(2));
    });
    this.chartOptionsFleetMileage = {
      series: [
        {
          name: 'Fuel Mileage (mpg)',
          data: seriesDataMileage,
          type: 'area',
          color: '#4680FF',
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.2,
              opacityTo: 0.4,
              stops: [0, 90, 100],
            },
          },
        },
      ],
      colors: ['#4680FF'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.4,
          stops: [0, 90, 100],
        },
      },
      chart: {
        toolbar: {
          show: false,
        },
        height: 280,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: '2',
        curve: 'smooth',
      },
      grid: {
        show: false,
        xaxis: {
          lines: {
            show: false,
          },

        },
        yaxis: {
          lines: {
            show: false,
          },

        },
      },
      xaxis: {
        offsetX: 0,
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        title: {
          offsetX: -20,
          offsetY: -13,
          text: "Month"
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
      },
      yaxis: {
        min: 0,
        max: 35,
        tickAmount: 5,
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
          offsetX: -10,
          offsetY: 0,
          text: "Fuel Mileage (mpg)"
        },

      },
    };
  }
  tripFleetConsumedMonth(data) {
    data.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    let labelDataFuel = [];
    let seriesDataFuel = [];
    let allZeros = true;
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-");
      const formattedDate = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' }) + " '" + year.slice(2);
      labelDataFuel.push(formattedDate);
      seriesDataFuel.push(item.fuelConsumed.toFixed(2));
      if (item.totalFuelConsumed !== 0) {
        allZeros = false;
      }
    });
    if (allZeros) {
      return;
    }
    console.log(seriesDataFuel,'changesss');

    this.chartOptionsFuelConsumed = {
      series: [
        {
          name: "Fuel Consumed (gal)",
          data: seriesDataFuel
        }
      ],
      chart: {
        height: 280,
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
          columnWidth: data.length < 2 ? '15%' : '20%',
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
        formatter: function (val, opt) {
          if (val > 0) {
            return val.toLocaleString();
          }
        },
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
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
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
          text: "Fuel Consumed (gal)",
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

  // Driver Behaviour
  getDriverScores() {
    this.driverScores = []
    this.subscription$.add(
      this.dashboardservice.totalDriverScores(this.customConsumer,this.fleetIdData,this.groupIdData, '').subscribe((res: any) => {
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
    this.donutchart2 = {
      chart: {
        height: 300,
        type: 'donut',
        events: {
          dataPointMouseEnter: (event, chartContext, config) => {
              this.updateCenterCircle(config.series[config.dataPointIndex]); // Pass the hovered series value
          },
          mounted: () => {
              this.updateCenterCircle(); // Initial total display
          },

      },
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

  updateCenterCircle(hoveredValue = null) {
    // Calculate the total score
    const totalScore = this.driverScores.reduce((acc, score) => acc + score, 0);
    const centerCircleDiv = document.querySelector('.center-circle-1');

    // Display either the hovered value or the total score
    const displayValue = hoveredValue !== null ? hoveredValue : totalScore;

    // Update the center circle with the selected value and number of categories
    if (centerCircleDiv) {
        centerCircleDiv.innerHTML = `
          <div style="text-align: center;">
                <div style="text-align: center;font-family: 'Poppins';font-size: 14px;font-weight: 500;padding-top: 45px;">
                <img src="../../../../../assets/images/icon/driver.svg"  class="icon"><br>
                          <span>Driver Score</span>
            </div>
        `;
    }
  }


  // Seatbelt Violation
  getSeatBelt() {
    this.dashboardservice.getSeatBeltUsage(this.customConsumer, this.fleetIdData,this.groupIdData, '').subscribe((data: any) => {
      this.filterTopVins(data);
    }, err => {
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
        height: 300,
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
          borderRadius: 10,
          borderRadiusApplication: 'around',
          columnWidth: data.length === 1 ? "10%" : "30%",
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
      colors: ["#FF0000"],
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
        categories: labelDataSearBelt,
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
        title: {
          offsetX: -10,
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
        },
      }
    };
  }
  filterTopVins(data: any) {
    this.topFiveVins = data.topFiveSeatBeltViolation
      .filter(entry => entry.seatbelt_alert_count_driver > this.threshold)
      .slice(0, 5).map(entry => ({ VIN: this.maskVin(entry.VIN), countDriver: entry.seatbelt_alert_count_driver }));
    this.topfiveSearBelt(this.topFiveVins)
  }

  //Aggresive Drivers
  async getAggresiveDrivers() {
    await this.dashboardservice.getAggresiveDriver(this.customConsumer, this.fleetIdData,this.groupIdData, '').subscribe((data: any) => {
      this.driver = data?.topFiveAggressiveDriverScorer
      this.topfiveAggresiveDriver(this.driver)}, err => {})
  }
  maskVin(vin: string): string {
    if (vin.length >= 3) {
      return '**' + vin.slice(-3);} else {return vin}
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
    for (let i = 0; i < data.length && i < 5; i++) {
        let item = data[i];
        top5Data.push(item);
        labelDataAggressiveDriver.push(this.maskVin(item.VIN));
        seriesData1.push((item.HA * 100).toFixed(0));
        seriesData2.push((item.HB * 100).toFixed(0));
        seriesData3.push((item.HC * 100).toFixed(0));
        seriesData4.push((item.OS1_km * 100).toFixed(0));
        seriesData5.push((item.NP_km * 100).toFixed(0));
        avgDScoreData.push({
            VIN: item.VIN,
            score: item.score
        });
    }
    this.aggresiveDriver = {
      series: [
        {
          name: "Harsh Acceleration",
          data: seriesData1,
        },
        {
          name: "Harsh Braking",
          data: seriesData2,
        },
        {
          name: "Harsh Cornering",
          data: seriesData3,
        },
        {
          name: "Over Speeding",
          data: seriesData4,
        },
        {
          name: "Night Percent",
          data: seriesData5,
        }
      ],
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'left',
        verticalAlign: 'middle',
        floating: false,
        fontSize: '14px',
        offsetX: 0,
        offsetY: 10,
      },
      chart: {
        type: "bar",
        stacked: true,
        height: 300,
        zoom: {
          show: false
        },
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: data.length === 1 ? "10%" : "55%",
          endingShape: 'rounded',
          borderRadius: 4,
          dataLabels: {
            enabled: true,
            position: 'top'
          }
        },
      },
      dataLabels: {
        enabled: false,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: -30,
        formatter: function (val, opt) {
          if (opt.seriesIndex && opt.dataPointIndex) {
            return avgDScoreData[opt.dataPointIndex].score;
          } else {
            return '';
          }
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"]
      },
      colors: ['#4680FF','#79a3ff','#FA751A','#FCBA8C','#2CA87F'],
      labels: ["Harsh Acceleration", "Harsh Braking", "Harsh Cornering", "Overspeeding", "Night Percantage"],
      xaxis: {
        categories: labelDataAggressiveDriver,
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
          offsetX: -10,
          offsetY: 0,
          text: "Count of Harsh Events (* 100)"
        },
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val;
          }
        }
      },
    };
  }

    // By OEM
  getTotalOem() {
    this.subscription$.add(
      this.dashboardservice.getTotalOem(this.customConsumer, this.fleetIdData,this.groupIdData, '').subscribe((res: any) => {
        this.vehicelSplitChart(res)}))
  }
  getColorForOEM(oem: string): string {
    // Add logic here to map each OEM to a specific color
    switch (oem) {
      case 'FORDPRO':
        return '#616177';
      case 'FORD':
        return '#616177';
      case 'STELLANTIS':
        return '#BEB5B5';
        case 'TOYOTA':
          return '#ff7d7d';
        case 'GM':
          return '#4c91f8';
      case 'TESLA':
        return '#000000';
      case 'OTHERS':
        return '#6C757E';// Default color if no match is found
    }
  }
  vehicelSplitChart(data: any[]) {
    const mergedDataMap = new Map<string, number>();
    data.forEach(entry => {
      const oem = entry.oem.toUpperCase();
      const totalCount = entry.totalCount;
      if (oem === 'FORD' || oem === 'FORDPRO') {
        const existingCount = mergedDataMap.get('FORD') || 0;
        mergedDataMap.set('FORD', existingCount + totalCount);
      } else {
        const existingCount = mergedDataMap.get(oem) || 0;
        mergedDataMap.set(oem, existingCount + totalCount);
      }
    });
    const mergedData = Array.from(mergedDataMap).map(([oem, totalCount]) => ({
      oem,
      totalCount,
    }));
    const oemColors = mergedData.map(item => this.getColorForOEM(item.oem));
    this.vehicleSplit = {
      chart: {
        height: 300,
        type: 'donut',
      },
      series: mergedData.map((item) => item.totalCount),
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        floating: false,
        fontSize: '14px',
        offsetX: 0,
      },
      dataLabels: {
        enabled: true,
        dropShadow: {
          enabled: false,
        },
      },
      labels: [...new Set(mergedData.map((item) => item.oem))],
      fill: {
        type: "gradient",
      },
      colors: oemColors,
    };
  }

  // By Fuel
  getTotalFuelType() {
    this.subscription$.add(
      this.dashboardservice.getTotalFuelType(this.customConsumer, this.fleetIdData,this.groupIdData, '').subscribe((res: any) => {
        this.vehicelFuelTypeChart([
          { count: 1, primaryFuelType: 'Electric' },
          { count: 5, primaryFuelType: 'Gasoline' },
          { count: 2, primaryFuelType: 'Hybrid' }
        ]);
       // this.vehicelFuelTypeChart(res)
      }))
  }
  vehicelFuelTypeChart(chartData) {
    chartData = chartData.filter(item => item.primaryFuelType !== 'Not Available');
    const fuelTypeCounts: { [key: string]: number } = {};
    chartData.forEach(item => {
      item.count = item.count || 0;
      switch (item.primaryFuelType) {
        case 'Compressed Natural Gas (CNG)':
        case 'Flexible Fuel Vehicle (FFV)':
        case '':
        case 'Liquefied Petroleum Gas (propane or LPG)':
          fuelTypeCounts['Others'] = (fuelTypeCounts['Others'] || 0) + item.count;
          break;
        case 'Electric':
          fuelTypeCounts['EV'] = (fuelTypeCounts['EV'] || 0) + item.count;
          break;
        default:
          fuelTypeCounts[item.primaryFuelType] = (fuelTypeCounts[item.primaryFuelType] || 0) + item.count;
           switch (item.primaryFuelType) {
            case 'Gasoline':
              item.color = '#FCBA8C'; // Set Gasoline color
              break;
            case 'Diesel':
              item.color = '#ff0000'; // Set Diesel color
              break;
            case 'Electric':
              item.primaryFuelType = 'EV'; // Rename Electric to EV
              item.color = '#4bb592'; // Set EV color
              break;
              case 'Flexible Fuel Vehicle (FFV)':
                item.primaryFuelType = 'FFV'; // Rename Electric to EV
                item.color = '#FA751A'; // Set EV color
                break;
            default:
                return '#6293ff';
          }
          break;
      }
    });
    const newData = Object.entries(fuelTypeCounts).map(([primaryFuelType, count]) => ({
      primaryFuelType,
      count,
      color: getColorByFuelType(primaryFuelType),
    }));
    chartData = newData;
    const totalCounts = Object.values(fuelTypeCounts).reduce((total, count) => total + count, 0);
    if (chartData.length === 1) {
      chartData.push({
        primaryFuelType: null,
        count: 0,
        color: '#fff',
        dataLabels: {
          enabled: true,
          style: {
            colors: ['#fff'],
            fontSize: '12',
            fontWeight: '100',
          },
        },
      });
    }
    chartData.sort((a, b) => b.count - a.count);
    this.chartOptionsFuel = {
      series: [
        {
          name: 'Number of Vehicles',
          data: (this.dataNew = chartData.map(item => item.count)),
        },
      ],
      chart: {
        height: 280,
        type: 'bar',
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
          borderRadiusApplication: 'around',
          columnWidth: chartData.length === 1 ? "10%" : "70%",
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
      colors: chartData.map(item => item.color || '#dbdcdd'), // Use the assigned colors or default color
      dataLabels: {
        enabled: chartData.length > 1,
        style: {
          colors: ['#6C757E'],
          fontSize: '12',
          fontWeight: '100',
        },
        offsetY: -30,
        formatter: function (val: any, opt: any) {
          if (val > 0) {
            return val;
          }
        },
      },
      legend: {
        show: false,
      },
      grid: {
        show: false,
        borderColor: 'black',
        strokeDashArray: 3,
        position: 'front',
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      yaxis: {
        min: 0,
        max: totalCounts + 4,
        tickAmount: 5,
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
      xaxis: {

        show: false,
        labels: {
          show: false,
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
      labels: chartData.map(item => item.primaryFuelType),
    };
     function getColorByFuelType(fuelType) {
      switch (fuelType) {
        case 'Gasoline':
          return '#FCBA8C';
        case 'Diesel':
          return '#ff0000';
        case 'EV':
          return '#4bb592';
          case 'Electric':
            return '#4bb592';
        default:
          return '#6293ff';
      }
    }
  }

  // By Body Class
  getBodyClass() {
    this.subscription$.add(
      this.dashboardservice.getBodyClass(this.customConsumer, this.fleetIdData,this.groupIdData, '').subscribe((res: any) => {
        let countData = 0
        res.filter((item: any, i) => {
          if (!item.bodyClass || item.bodyClass == '') {
            countData += res[i].count
          }
        })
        res.filter((item: any) => {
          if (!item.bodyClass || item.bodyClass == '') {
            item.bodyClass = 'Not Available'
            item.count = countData
          }})
        this.vehicelBodyClassChart(res)
      }))
  }
  vehicelBodyClassChart(chartData) {
    const filteredData = chartData.filter(item => item?.bodyClass !== 'Not Available');
    const groupedData = filteredData.map(item => {
      let bodyClass = item?.bodyClass || 'Not Available';
      if (bodyClass.includes('Incomplete - Chassis Cab') || bodyClass.includes('Incomplete') || bodyClass.includes('Incomplete-Cutaway')) {
        bodyClass = 'Pickup';
      } else if (bodyClass.includes('Hatchback/Liftback/Notchback')) {
        bodyClass = 'Hatchback';
      } else if (bodyClass.includes('Convertible/Cabriolet')) {
        bodyClass = 'Convertible';
      } else if (bodyClass.includes('Sedan/Saloon')) {
        bodyClass = 'Sedan';
      } else if (bodyClass.includes('Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)')) {
        bodyClass = 'SUV/MUV';
      } else if (['Minivan', 'Wagon', 'Coupe', 'Cargo Van'].includes(bodyClass)) {
        bodyClass = 'Van';
      } else if (bodyClass === 'Truck-Tractor') {
        bodyClass = 'Truck';
      }
      return { ...item, bodyClass };
    });
    const uniqueArray = groupedData.filter((v, i, a) => a.findIndex(v2 => v2.bodyClass === v.bodyClass) === i);
    const bodyClassColorMap: { [key: string]: string } = {
      'Pickup': '#979A9E',
      'Hatchback': '#F0CE9C',
      'Convertible': '#6C757E',
      'Sedan': '#a5dac9',
      'SUV/MUV': '#2CA87F',
      'Van': '#FF8080',
      'Truck': '#C6ABB8',
      'Not Available': '#808080',
    };
    const colors = uniqueArray.map(item => bodyClassColorMap[item.bodyClass]);
    this.vehicleBodyClass = {
      chart: {
        height: 300,
        width: '100%',
        type: 'donut',
      },
      series: uniqueArray.map(item => (item?.count === '' || !item.count ? 0 : item.count)),
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
        dropShadow: {
          enabled: false,
        }
      },
      labels: uniqueArray.map(item => (item?.bodyClass === '' || !item.bodyClass ? 'Not Available' : item.bodyClass)),
      colors: colors,
    };
  }

  ngOnDestroy(): void {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }
  // -------- Chart 1: Miles vs Driving Time --------
  // milesEngineSeries: ApexAxisChartSeries = [
  //   {
  //     name: 'Miles Driven',
  //     type: 'column',
  //     data: [1200, 1500, 1100, 1800] // week 1-4
  //   },
  //   {
  //     name: 'Engine Hours',
  //     type: 'line',
  //     data: [30, 40, 35, 50] // week 1-4
  //   }
  // ];

  // milesEngineChart: {
  //   chart: ApexChart;
  //   xaxis: ApexXAxis;
  //   yaxis: ApexYAxis | ApexYAxis[];
  //   stroke: ApexStroke;
  //   dataLabels: ApexDataLabels;
  //   tooltip: ApexTooltip;
  //   colors: string[];
  // } = {
  //   chart: { height: 300, type: 'line', stacked: false,
  //   toolbar: {
  //     show: false   // 🔥 disables zoom, pan, export, download buttons
  //   },
  // },
  //   xaxis: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
  //   yaxis: [
  //     {
  //       title: { text: 'Miles Driven' }
  //     },
  //     {
  //       opposite: true,
  //       title: { text: 'Engine Hours' }
  //     }
  //   ],
  //   stroke: { width: [0, 3] },
  //   dataLabels: { enabled: false },
  //   tooltip: { shared: true, intersect: false },
  //   colors: ['#97CCE5', '#3B77AE']
  // };
  milesEngineSeries: ApexAxisChartSeries = [
    { name: 'Miles Driven', type: 'column', data: [] },
    { name: 'Engine Hours', type: 'line', data: [] }
  ];

  milesEngineChart: {
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis | ApexYAxis[];
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    tooltip: ApexTooltip;
    colors: string[];
  } = {
    chart: {
      height: 300,
      type: 'line',
      stacked: false,
      toolbar: { show: false }
    },
    xaxis: { categories: [] },
    yaxis: [
      { title: { text: 'Miles Driven' } },
      { opposite: true, title: { text: 'Engine Hours' } }
    ],
    stroke: { width: [0, 3] },
    dataLabels: { enabled: false },
    tooltip: { shared: true, intersect: false },
    colors: ['#97CCE5', '#3B77AE']
  };
  // -------- Chart 2: Vehicle Utilization --------
  vehicleUtilizationSeries: ApexAxisChartSeries = [
    {
      name: 'Utilization Hours',
      data: [160, 140, 100, 80, 50] // example last 4 week total hours
    }
  ];

  vehicleUtilizationChart = {
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: false, // vertical bars
        columnWidth: '50%',
        endingShape: 'rounded'
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: [
        'SDH_Explorer_2.2',
        'SDH_F250_5',
        'SDH_Explorer_3',
        'SDH_Explorer_4',
        'Amit MBZ-1007'
      ]
    },
    colors: ['#1E90FF', '#FF6347']
  };
  fuelChart = {
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        endingShape: 'rounded'
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: [
        'Week 1',
        'Week 2',
        'Week 3',
        'Week 4'
      ]
    },
    yaxis: {
      title: {
        text: 'Liters'
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + ' L';
        }
      }
    },
    colors: ['#1E90FF', '#FF6347'] // Fuel Consumed vs Refuel
  };

  fuelSeries = [
    {
      name: 'Fuel Consumed',
      data: [520, 480, 600, 550] // 🔹 replace with real weekly totals
    },
    {
      name: 'Refuel',
      data: [500, 450, 580, 530] // 🔹 replace with real weekly totals
    }
  ];
  // mpgChart = {
  //   chart: {
  //     type: 'line',
  //     height: 350,
  //     zoom: { enabled: false }
  //   },
  //   dataLabels: {
  //     enabled: true
  //   },
  //   stroke: {
  //     curve: 'smooth',
  //     width: 3
  //   },
  //   markers: {
  //     size: 5
  //   },
  //   xaxis: {
  //     categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] // 🔹 Replace with real week ranges if available
  //   },
  //   yaxis: {
  //     title: {
  //       text: 'MPG'
  //     },
  //     min: 0
  //   },
  //   tooltip: {
  //     y: {
  //       formatter: function (val: number) {
  //         return val.toFixed(2) + ' MPG';
  //       }
  //     }
  //   },
  //   colors: ['#28a745']
  // };

  // mpgSeries = [
  //   {
  //     name: 'Miles per Gallon',
  //     data: [12.5, 14.2, 13.8, 15.0] // 🔹 Replace with real MPG values
  //   }
  // ];
  fuelEfficiencySeries: any = [
    { name: 'MPG', type: 'line', data: [14, 16, 18, 15] },
    { name: 'Idling (hrs)', type: 'column', data: [12, 9, 7, 11] },
    { name: 'Avg Speed (mph)', type: 'line', data: [48, 52, 55, 50] },
  ];

  // Chart Config
  fuelEfficiencyChart: any = {
    chart: {
      height: 350,
      type: 'line',
      stacked: false,
      toolbar: { show: false },   // 🚫 hides zoom, pan, download icons
      zoom: { enabled: false },   // 🚫 disables zoom selection
    },
    stroke: { width: [3, 0, 3] },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '40%' } },
    xaxis: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
    yaxis: [
      { title: { text: 'MPG' } },
      { opposite: true, title: { text: 'Idling (hrs)' } },
    ],
    tooltip: { shared: true, intersect: false },
    legend: { position: 'top' },
    markers: { size: 4 },
    colors: ['#008FFB', '#FEB019', '#00E396'],
  };



  worstDriversSeries = [{
    name: 'Driver Score',
    data: [40, 45, 50, 52, 55] // Example scores
  }];

  worstDriversChart = {
    chart: { type: 'bar', height: 300 },
    plotOptions: { bar: { horizontal: false } },
    dataLabels: { enabled: true },
    xaxis: {
      categories: ['Driver A', 'Driver B', 'Driver C', 'Driver D', 'Driver E']
    },
    colors: ['#FF4560']
  };
  driverEfficiencySeries = [78]; // % efficiency
  driverEfficiencyChart = {
    chart: { type: 'radialBar', height: 300 },
    plotOptions: {
      radialBar: {
        hollow: { size: '70%' },
        dataLabels: {
          value: { show: true, fontSize: '20px' }
        }
      }
    },
    colors: ['#00E396']
  };

topDriversSeries = [{
  name: 'Driver Score',
  data: [88, 85, 83, 82, 80] // Top scores
}];

topDriversChart = {
  chart: { type: 'bar', height: 300 },
  plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
  dataLabels: { enabled: true },
  xaxis: {
    categories: ['Driver X', 'Driver Y', 'Driver Z', 'Driver M', 'Driver N']
  },
  colors: ['#008FFB']
};
// Past Events
// fleetHealthPastSeries = [
//   {
//     name: 'Tire Service',
//     data: [5, 7, 4, 6] // Week1, Week2, Week3, Week4
//   },
//   {
//     name: 'DTC And Maintenance',
//     data: [8, 6, 9, 7]
//   },
//   {
//     name: 'Oil Change',
//     data: [4, 5, 6, 8]
//   }
// ];

// fleetHealthPastChart = {
//   chart: {
//     type: 'bar',
//     height: 300,
//     stacked: false,
//     toolbar: {
//       show: false   // 🔥 disables zoom, pan, export, download buttons
//     },
//   },
//   plotOptions: {
//     bar: {
//       horizontal: false,
//       columnWidth: '50%',
//        borderRadius: 6
//     }
//   },
//   dataLabels: {
//     enabled: true
//   },
//   xaxis: {
//     categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
//   },
//   colors: ['#95d3bf', '#ff7878d9', '#9CA3AF'], // Blue, Red, Silver
//   legend: {
//     position: 'top'
//   },
//   grid: {
//     borderColor: '#f1f1f1'
//   },
//   yaxis: {
//     title: {
//       text: 'Number of Events'
//     }
//   }
// };

// Future Events
// fleetHealthFutureSeries = [
//   {
//     name: 'Tire Service',
//     data: [5, 4, 8, 6]
//   },

//   {
//     name: 'Vehicles Due For Maintenance',
//     data: [7, 5, 6, 9]
//   },
//   {
//     name: 'Oil Change',
//     data: [7, 5, 6, 9]
//   },

// ];

// fleetHealthFutureChart = {
//   chart: {
//     type: 'bar',
//     height: 300,
//     stacked: false,
//     toolbar: {
//       show: false   // 🔥 disables zoom, pan, export, download buttons
//     },
//   },
//   plotOptions: {
//     bar: {
//       horizontal: false,
//       columnWidth: '50%',
//       borderRadius: 6
//     }
//   },
//   dataLabels: {
//     enabled: true
//   },
//   xaxis: {
//     categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
//   },
//   colors: ['#95d3bf', '#ff7878d9', '#9CA3AF'], // Blue, Red, Silver
//   legend: {
//     position: 'top'
//   },
//   grid: {
//     borderColor: '#f1f1f1'
//   },
//   yaxis: {
//     title: {
//       text: 'Number of Events'
//     }
//   }
// };
driverScoreSeries = [
  {
    name: 'Safety Score',
    data: [82, 74, 90, 68] // scores aligned with driver names
  },
  {
    name: 'Efficiency Score',
    data: [78, 80, 85, 72]
  }
];

// worstDriversSeriesNew = [
//   {
//     name: 'Safety',
//     data: [45, 50, 40, 48] // lowest safety scores per week
//   },
//   {
//     name: 'Efficiency',
//     data: [42, 38, 35, 40] // lowest efficiency scores per week
//   }
// ];

// worstDriversChartNew = {
//   chart: {
//     type: 'bar',
//     height: 300,
//     stacked: false,
//     toolbar: {
//       show: false   // 🔥 disables zoom, pan, export, download buttons
//     },
//   },
//   plotOptions: {
//     bar: {
//       horizontal: false,
//       columnWidth: '50%',
//       endingShape: 'rounded'
//     }
//   },
//   dataLabels: {
//     enabled: true
//   },
//   xaxis: {
//     categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
//   },
//   yaxis: {
//     title: { text: 'Score (%)' },
//     min: 0,
//     max: 100
//   },
//   colors: ['#DC2626', '#F59E0B'], // Red for Safety, Yellow for Efficiency
//   legend: { position: 'top' },
//   grid: { borderColor: '#f1f1f1' },
//   tooltip: {
//     y: {
//       formatter: function (val: number, opts: any) {
//         // Here you can show driver names dynamically
//         const driverNames = [
//           ['Driver A', 'Driver B'], // Week 1
//           ['Driver C', 'Driver D'], // Week 2
//           ['Driver E', 'Driver F'], // Week 3
//           ['Driver G', 'Driver H']  // Week 4
//         ];
//         return driverNames[opts.dataPointIndex][opts.seriesIndex] + ': ' + val + '%';
//       }
//     }
//   }
// };


driverScoreChart1 = {
  chart: {
    height: 350,
    type: 'scatter',
    zoom: {
      enabled: true,
      type: 'xy'
    }
  },
  xaxis: {
    title: { text: 'Efficiency Score (%)' },
    min: 0,
    max: 100
  },
  yaxis: {
    title: { text: 'Safety Score (%)' },
    min: 0,
    max: 100
  },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
      return opts.w.config.series[opts.seriesIndex].data[opts.dataPointIndex].name;
    }
  },
  colors: ['#1E3A8A'],
  grid: { borderColor: '#f1f1f1' }
};

// fuelSeriesNew = [
//   {
//     name: 'Fuel Consumed (Gallons)',
//     type: 'column',
//     data: [225, 244, 210, 285] // computed from per-vehicle consumption
//   },
//   {
//     name: 'Refuel (Gallons)',
//     type: 'column',
//     data: [215, 250, 207, 280] // computed from per-vehicle refuels
//   },
//   {
//     name: 'Cost of Refuel ($)',
//     type: 'line',
//     data: [817, 950, 787, 1064] // refuel_gallons * 3.8
//   }
// ];

// fuelChartNew = {

//   chart: { type: 'line',
//   height: 300,
//   stacked: false,
//   toolbar: {
//     show: false   // 🔥 disables zoom, pan, export, download buttons
//   },

// },
//   stroke: { width: [0, 0, 3] },
//   plotOptions: { bar: { columnWidth: '50%' } },
//   dataLabels: {
//     enabled: true,
//     enabledOnSeries: [2], // show labels only for cost line
//     formatter: (val: number, opts: any) => {
//       // show $ on cost labels and gallons for others
//       return opts.seriesIndex === 2 ? `$${Math.round(val)}` : `${val} gal`;
//     }
//   },
//   xaxis: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
//   yaxis: [
//     { title: { text: 'Gallons' }, labels: { formatter: (v: number) => `${v} gal` } },
//     { opposite: true, title: { text: 'Cost ($)' }, labels: { formatter: (v: number) => `$${v}` } }
//   ],
//   tooltip: {
//     y: {
//       formatter: (val: number, { seriesIndex }) => {
//         return seriesIndex === 2 ? `$${val}` : `${val} gal`;
//       }
//     }
//   },
//   colors: ['#ED8735', '#3B77AE', '#FF4560']
// };





// vehicleUtilizationSeriesNew = [
//   {
//     name: 'Top Vehicle Utilization',
//     data: [42, 50, 46, 55]
//   },
//   {
//     name: 'Low Vehicle Utilization',
//     data: [10, 12, 15, 14]
//   }
// ];
vehicleNamesPerWeek: string[][] = [];

// vehicleUtilizationChartNew = {
//   chart: {
//     type: 'bar',
//     height: 300,
//     stacked: false,
//     toolbar: {
//       show: false   // 🔥 disables zoom, pan, export, download buttons
//     },
//   },
//   plotOptions: {
//     bar: {
//       horizontal: false,
//       columnWidth: '45%',
//       borderRadius: 4
//     }
//   },
//   dataLabels: {
//     enabled: false,
//     formatter: (val: number) => `${val} hrs` // only hours on bar
//   },
//   tooltip: {
//     y: {
//       formatter: (val: number, opts: any) => {
//         const vehicles = [
//           ['SDH_Explorer_2.2', 'SDH_F250_5'],    // Week 1
//           ['SDH_Explorer_3', 'SDH_Explorer_4'],  // Week 2
//           ['Amit MBZ-1007', 'SDH_Explorer_2.2'], // Week 3
//           ['SDH_F250_5', 'SDH_Explorer_3']       // Week 4
//         ];
//         const weekIndex = opts.dataPointIndex;
//         const seriesIndex = opts.seriesIndex;
//         return `${val} hrs (${vehicles[weekIndex][seriesIndex]})`;
//       }
//     }
//   },
//   xaxis: {
//     categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
//   },
//   yaxis: {
//     title: { text: 'Utilization (Hours)' },
//     labels: {
//       formatter: (val: number) => `${val} hrs`
//     }
//   },
//   colors: ['#ED8735', '#3B77AE'] // Green = Top, Red = Bottom
// };
  // Vehicle Utilization chart
  vehicleUtilizationSeriesNew: ApexAxisChartSeries = [
    { name: 'Top Vehicle Utilization', data: [] },
    { name: 'Low Vehicle Utilization', data: [] }
  ];

  vehicleUtilizationChartNew: any = {
    chart: { type: 'bar', stacked: false, height: 300, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    tooltip: {
      y: {
        formatter: (val: number, opts: any) => {
          const weekIndex = opts.dataPointIndex;
          const seriesIndex = opts.seriesIndex;
          return `${val} hrs (${this.vehicleNamesPerWeek[weekIndex][seriesIndex]})`;
        }
      }
    },
    xaxis: { categories: [] },
    yaxis: { title: { text: 'Utilization (Hours)' }, labels: { formatter: (val: number) => `${val} hrs` } },
    colors: ['#ED8735', '#3B77AE']
  };

// driverSafetySeries = [
//   { name: 'HB,HC,HA', data: [5, 3, 8, 2] },
//   { name: 'Overspeed Miles', data: [12, 15, 10, 11] },
//   { name: 'Collisions', data: [0, 0, 0, 0] }
// ];

// driverSafetyChart = {
//   chart: {
//     type: 'bar',
//     height: 300,
//     stacked: false,
//     toolbar: {
//       show: false   // 🔥 disables zoom, pan, export, download buttons
//     },
//   },
//   plotOptions: {
//     bar: {
//       horizontal: false,
//       columnWidth: '50%',
//       borderRadius: 4
//     }
//   },
//   dataLabels: {
//     enabled: true,
//     formatter: (val: number) => val.toString()
//   },
//   xaxis: {
//     categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
//   },
//   colors: ['#3B77AE', '#ED8735', '#FF4560'], // HB+HC, Overspeed, Collisions
//   tooltip: {
//     y: {
//       formatter: (val: number, opts: any) => {
//         return `${opts.seriesName}: ${val}`;
//       }
//     }
//   },
//   legend: {
//     position: 'top'
//   }
// };

// fleet-dashboard-fleet.component.ts


fuelVsIdlingSeries:any
fuelVsIdling = {
  chart: {
    type: 'line',
    height: 300,
    stacked: false,
    toolbar: {
      show: false   // 🔥 disables zoom, pan, export, download buttons
    },
  },
  stroke: {
    width: [0, 0, 3]
  },
  plotOptions: {
    bar: {
      columnWidth: '50%'
    }
  },
  dataLabels: {
    enabled: true,
    enabledOnSeries: [2], // only show on cost line
    formatter: (val: number, opts: any) => {
      // show $ on cost labels and gallons for others
      return opts.seriesIndex === 2 ? `$${Math.round(val)}` : `${val} gal`;
    }
  },
  xaxis: {
    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
  },
  yaxis: [
    {
      title: {
        text: 'Hours / Gallons'
      },
      labels: {
        formatter: (val: number) => `${val} gal`
      }
    },
    {
      opposite: true,
      title: {
        text: 'Cost ($)'
      },
      labels: {
        formatter: (val: number) => `$${val}`
      }
    }
  ],
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (val: number, opts: any) => {
        if (opts.seriesIndex === 0) return `${val} hrs`;
        if (opts.seriesIndex === 1) return `${val} gal`;
        if (opts.seriesIndex === 2) return  `$${val}` ;
        return val;
      }
    }
  },
  colors: ['#ED8735', '#3B77AE', '#FF4560']
};
totalMilesDriven:any;
loadTelemetryData(): void {
  this.dashboardsService.getBasicTelemetry(this.fleetIdData, 4, this.selectedPeriod)
    .subscribe((data: any) => {

      // ----- Use only month names -----
      //const labels = data.milesVsDrivingTime.map((item: any) => item.month); // "September", "August", etc.

      // ----- Miles vs Engine Hours -----
      const milesData = data.milesVsDrivingTime.map((item: any) => item.milesDriven);
      const engineHoursData = data.milesVsDrivingTime.map((item: any) => item.engineHours);

      this.milesEngineSeries = [
        { name: 'Miles Driven', type: 'column', data: milesData },
        { name: 'Engine Hours', type: 'line', data: engineHoursData }
      ];
      this.milesEngineChart.xaxis = {
        categories: data.milesVsDrivingTime.map((item: any) => item.period)
      };

      // 👉 Total miles driven (sum of all months)
      this.totalMilesDriven = milesData.reduce((sum: number, miles: number) => sum + miles, 0);

      // ----- Vehicle Utilization -----
      const topData = data.vehicleUtilization.map((item: any) => item.mostUtilizedVehicle.utilizationPercentage);
      const bottomData = data.vehicleUtilization.map((item: any) => item.leastUtilizedVehicle.utilizationPercentage);

      this.vehicleUtilizationSeriesNew = [
        { name: 'Top Vehicle Utilization', data: topData },
        { name: 'Low Vehicle Utilization', data: bottomData }
      ];

      this.vehicleNamesPerWeek = data.vehicleUtilization.map((item: any) => [
        item.mostUtilizedVehicle.vehicleName,
        item.leastUtilizedVehicle.vehicleName
      ]);
      this.vehicleUtilizationChartNew.xaxis = {
        categories: data.vehicleUtilization.map((item: any) => item.period)
      };
     // this.vehicleUtilizationChartNew.xaxis.categories = labels;
    });
}


// Initialize series and charts
fleetHealthPastSeries: any[] = [];
fleetHealthFutureSeries: any[] = [];

fleetHealthPastChart: any = {
  chart: { type: 'bar', height: 300, stacked: false, toolbar: { show: false } },
  plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 6 } },
  dataLabels: { enabled: true },
  xaxis: { categories: [] },
  colors: ['#95d3bf', '#ff7878d9', '#9CA3AF'],
  legend: { position: 'top' },
  grid: { borderColor: '#f1f1f1' },
  yaxis: { title: { text: 'Number of Events' } }
};

fleetHealthFutureChart: any = {
  chart: { type: 'bar', height: 300, stacked: false, toolbar: { show: false } },
  plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 6 } },
  dataLabels: { enabled: true },
  xaxis: { categories: [] },
  colors: ['#95d3bf', '#ff7878d9', '#9CA3AF'],
  legend: { position: 'top' },
  grid: { borderColor: '#f1f1f1' },
  yaxis: { title: { text: 'Number of Events' } }
};

loadFleetHealth() {
  //const fleetId = '100224';
  const periods = 4;
  const timePeriod = this.selectedPeriod;

  this.dashboardsService.getFleetHealth(this.fleetIdData, periods, timePeriod).subscribe(res => {
    // ✅ Past Maintenance
    const past = res?.pastEvents || [];
    this.fleetHealthPastChart = {
      ...this.fleetHealthPastChart,
      xaxis: { categories: past.map(p => p.period) }
    };
    this.fleetHealthPastSeries = [
      { name: 'Tire Service', data: past.map(p => p.flatTireEvents) },
      { name: 'DTC And Maintenance', data: past.map(p => p.dtcMaintenanceIssues) },
      { name: 'Oil Change', data: past.map(p => p.oilChangeEvents) }
    ];

    // ✅ Future Maintenance
    const future = res?.predictedMaintenance || [];
    this.fleetHealthFutureChart = {
      ...this.fleetHealthFutureChart,
      xaxis: { categories: future.map(f => f.period) }
    };
    // this.fleetHealthFutureSeries = [
    //   { name: 'Tire Service', data: future.map(f => f.upcomingTireRotation) },
    //   { name: 'Vehicles Due For Maintenance', data: future.map(f => f.vehicleDueForMaintenance) },
    //   { name: 'Oil Change', data: future.map(f => f.oilChangeWarnings) }
    // ];
    this.fleetHealthFutureSeries = [
  { name: 'Tire Service', data: [0, 0, 0, 0] },
  { name: 'Vehicles Due For Maintenance', data: [0, 0, 0, 0] },
  { name: 'Oil Change', data: [0, 0, 0, 0] }
];
  });
}
fuelSeriesNew: any[] = [];
fuelChartNew: any = {};

mpgSeries: any[] = [];
mpgChart: any = {};

// fuelVsIdlingSeries: any[] = [];
// fuelVsIdling: any = {};
// fuelVsIdling: any = {};
loadFuelAnalytics() {
  //const fleetId = '100224';
  const periods = 4;
  const timePeriod = this.selectedPeriod;

  this.dashboardsService.getFuelAnalytics(this.fleetIdData, periods, timePeriod).subscribe(res => {
    const fuelData = res.fuelConsumedVsRefuelCost;
    const mpgData = res.timeMpg;
    const idlingData = res.idlingHoursVsFuelWaste;

    // Fuel Consumed vs Refuel & Cost
    this.fuelSeriesNew = [
      { name: 'Fuel Consumed (Gallons)', type: 'column', data: fuelData.map(d => d.fuelConsumedGallons) },
      { name: 'Refuel (Gallons)', type: 'column', data: fuelData.map(d => d.refuelGallons) },
      { name: 'Cost of Refuel ($)', type: 'line', data: fuelData.map(d => d.refuelCost) }
    ];

    this.fuelChartNew = {
      chart: { type: 'line', height: 300, stacked: false, toolbar: { show: false } },
      stroke: { width: [0, 0, 3] },
      plotOptions: { bar: { columnWidth: '50%' } },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [2],
        formatter: (val: number, opts: any) =>
          opts.seriesIndex === 2 ? `$${Math.round(val)}` : `${val}`
      },
      xaxis: { categories: fuelData.map(d => d.period) },
      yaxis: [
        {
          title: { text: 'Gallons' },
          labels: { formatter: (v: number) => `${Math.round(v)} gal` }
        },
        {
          ...{ show: false },
          title: { text: 'Gallons' },
          labels: { formatter: (v: number) => `${Math.round(v)} gal` },
          min: function(min) { return min; },
          max: function(max) { return max; }
        } as any,
        {
          opposite: true,
          title: { text: 'Cost ($)' },
          labels: { formatter: (v: number) => `$${Math.round(v)}` }
        }
      ],
      tooltip: {
        y: {
          formatter: (val: number, { seriesIndex }: any) =>
            seriesIndex === 2 ? `$${val}` : `${val} gal`
        }
      },
      colors: ['#ED8735', '#3B77AE', '#FF4560']
    };

    // Weekly MPG
    this.mpgSeries = [{ name: 'Miles per Gallon', data: mpgData.map(d => d.mpg) }];
    this.mpgChart = {
      chart: { type: 'line', height: 300, zoom: { enabled: false } },
      dataLabels: { enabled: true },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 5 },
      xaxis: { categories: mpgData.map(d => d.period) },
      yaxis: { title: { text: 'MPG' }, min: 0 },
      tooltip: { y: { formatter: val => val.toFixed(2) + ' MPG' } },
      colors: ['#28a745']
    };

    // Idling Hours vs Fuel Waste (use API data instead of hardcoding)
    this.fuelVsIdlingSeries = [
      { name: 'Idling Hours', type: 'column', data: idlingData.map(d => d.idlingHours) },
      { name: 'Fuel Waste (Gallons)', type: 'column', data: idlingData.map(d => d.fuelWasteGallons) },
      { name: 'Fuel Waste Cost ($)', type: 'line', data: idlingData.map(d => d.fuelWasteCost) }
    ];

    this.fuelVsIdling = {
      chart: { type: 'line', height: 300, stacked: false, toolbar: { show: false } },
      stroke: { width: [0, 0, 3] },
      plotOptions: { bar: { columnWidth: '50%' } },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [2], // only show on cost line
        formatter: (val: number, opts: any): string => {
          if (opts.seriesIndex === 0) return `${val.toFixed(1)} hrs`;
          if (opts.seriesIndex === 1) return `${val.toFixed(1)} gal`;
          if (opts.seriesIndex === 2) return `$${Math.round(val)}`;
          return val.toString();  // ensure string is returned
        }
      },
      xaxis: { categories: idlingData.map(d => d.period) },
      yaxis: [
        {
          title: { text: 'Hours / Gallons' },
          labels: { formatter: (val: number) => val.toFixed(0) }
        },
        {
          ...{ show: false },
          title: { text: 'Hours / Gallons' },
          labels: { formatter: (val: number) => val.toFixed(0) },
          min: function(min) { return min; },
          max: function(max) { return max; }
        } as any,
        {
          opposite: true,
          title: { text: 'Cost ($)' },
          labels: { formatter: (val: number) => `$${Math.round(val)}` }
        }
      ],
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number, opts: any) => {
            if (opts.seriesIndex === 0) return `${val} hrs`;
            if (opts.seriesIndex === 1) return `${val} gal`;
            if (opts.seriesIndex === 2) return `$${val}`;
            return val;
          }
        }
      },
      colors: ['#ED8735', '#3B77AE', '#FF4560']
    };
  });
}



immediateAttentionRequired: any = {};
previousDayStats: any = {};
loadDashboardSummaryData(): void {
  this.dashboardsService.getDashboardSummary(this.fleetIdData, 4, this.selectedPeriod)
    .subscribe({
      next: (res) => {
        this.immediateAttentionRequired = res?.immediateAttentionRequired || {};
        this.previousDayStats = res?.previousDayStats || {};
      },
      error: (err) => {
        console.error('Error fetching dashboard summary:', err);
      }
    });
}
goToExternalLink(path: string) {
  const baseUrl = `${window.location.origin}`; // dynamically picks from URL bar
  const fullUrl = `${baseUrl}${path}`;
  window.open(fullUrl, '_blank'); // open in new tab
}

goToServiceHistory() {
  const baseUrl = `${window.location.origin}`;
  const fullUrl = `${baseUrl}/adlp/admin/admindashboard/maintenance/service-history-dashboard`;
  window.open(fullUrl, '_blank');
}

goToSafetyDashboard() {
  const baseUrl = `${window.location.origin}`;
  const fullUrl = `${baseUrl}/adlp/admin/admindashboard/safety-dashboard`;
  window.open(fullUrl, '_blank');
}

goToFuelDashboard() {
  const baseUrl = `${window.location.origin}`;
  const fullUrl = `${baseUrl}/adlp/admin/admindashboard/fuel-dashboard`;
  window.open(fullUrl, '_blank');
}
goToUpcomingMaintenanceDashboard() {
  const baseUrl = `${window.location.origin}`;
  const fullUrl = `${baseUrl}/adlp/admin/admindashboard/maintenance/upcoming-maintenance-dashboard`;
  window.open(fullUrl, '_blank');
}
goToBasicTelemetryDashboard() {
  const baseUrl = `${window.location.origin}`;
  const fullUrl = `${baseUrl}/adlp/admin/admindashboard/basic-telemetry-details`;
  window.open(fullUrl, '_blank');
}
};
