import { Component, OnInit, ElementRef, HostListener, Renderer2, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { formatDate } from "@angular/common";
import * as ExcelJS from "exceljs";
import * as FileSaver from "file-saver";
import { TaxonomyService } from "../../../taxonomy.service";
import { Subscription, of } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { NgxSpinnerService } from "ngx-spinner";
import { DatePipe } from "@angular/common";
import { AppService } from "src/app/app.service";
import { forkJoin } from "rxjs";
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import * as moment from 'moment-timezone';
import { ToastrService } from "ngx-toastr";
import { ItemsList } from "@ng-select/ng-select/lib/items-list";
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}
@Component({
  selector: "app-reports",
  templateUrl: "./reports.component.html",
  styleUrls: ["./reports.component.scss"],
})
export class ReportsComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  fromDate: string;
  toDate: string;
  currentDate: string = new Date().toISOString().split("T")[0];
  time = new Date();
  fleetIdData: any;
  vinListData: any;
  showRow: boolean = true;
  loginUser: any;
  eventsCall: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  chartOptionsseatBelts: any;
  date: Date;
  consumer: any = "All";
  fleetIds: any;
  fleetSumamryTotalData: any;
  fleetSumamryTotalDataFleetLevel: any;
  @ViewChild("nodatafound") nodatafound: any;
  fleetSumamryTotalDataFleetLevelConsumer: any;
  selectedPeriod: any = "TILL_NOW";
  totalDriverBehaviourScore: any;
  totalDriverScore: any;
  timePeriod = [
    { label: "Till Date", value: "tilldate" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "weekly" },
    { label: "Current Month", value: "monthly" },
    { label: "Previous Month", value: "lastmonth" },
  ];
  selectedReport: string = "custom";
  updatedDate: string;
  selectedTimePeriod: string = "TILL_NOW";
  startDate: string;
  endDate: string;
  displayDate: string;
  vinData: any;
  vinCountReport: any;
  StartDate: any;
  EndDate: any;
  vinCountcountpaused: any;
  vinCountcountactive: any;
  vinCountcountfailed: any;
  vinCountcountpending: any;
  enrollmentfailed: any;
  vinCountcountunenrolled: any;
  vinCountcountunerollpending: any;
  vinCountcountunerollcompleted: any;
  enrollmentVehicleStatus: any;
  totalUnenrolled: any;
  fleetIdValueNew: any;
  refuelDetailsData: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  reportName: any;
  driverEventsForVIN = [
    {
      heading: "Driver Behaviour",
      items: [
        { id: 1, name: "Harsh Acceleration (HA)", value: "harshAcc", selected: false },
        { id: 2, name: "Harsh Braking (HB)", value: "harshBrake", selected: false },
        { id: 3, name: "Harsh Cornering (HC)", value: "harshCornering", selected: false },
        { id: 4, name: "Over Speeding (OS)", value: "overspeedingDistance", selected: false },
        { id: 5, name: "Night Distance (ND)", value: "nightDistance", selected: false },
        { id: 7, name: "Safety Score", value: "driverBehaviourScore", selected: false },
        { id: 8, name: "Risk Rating", value: "driverBehaviourScore", selected: false },
        { id: 9, name: "Seat Belt", value: "seatbeltAlertCountDriver", selected: false },
      ]
    },
    // {
    //   heading: "ADAS",
    //   items: [
    //     { id: 9, name: "Forward Collision", value: "forwardCollision", selected: false },
    //     { id: 10, name: "ABS", value: "laneDeparture", selected: false },
    //     { id: 11, name: "Traction Control Brake", value: "tractiuonControlBrake", selected: false },
    //     { id: 12, name: "Blind Spot", value: "blindSpot", selected: false },
    //     { id: 13, name: "Collision Mitigation", value: "collisionMitigation", selected: false }
    //   ]
    // },
    // {
    //   heading: "Collision",
    //   items: [
    //     { id: 14, name: "Event", value: "event", selected: false },
    //     { id: 15, name: "Warning", value: "warning", selected: false }
    //   ]
    // }
  ];


  distanceTravelledForVIN = [
    { id: 1, name: "Total Distance", value: "tripDistance", selected: false },
    { id: 2, name: "Total Duration", value: "totalDuration", selected: false },
    { id: 5, name: "Average Trip Distance", value: "averageDistance", selected: false },
    { id: 6, name: "Average Trip Duration", value: "averageTime", selected: false },
    { id: 7, name: "Average Speed", value: "avgVehicleSpeed", selected: false },
    { id: 8, name: "Top Speed", value: "maxSpeed", selected: false },
    { id: 14, name: "Odometer", value: "odometer", selected: false },
    {
      id: 9,
      name: "% Distance Driven on Front Left Low Tire Pressure",
      value: "flDistance",
      selected: false,
    },
    {
      id: 10,
      name: "% Distance Driven on Front Right Low Tire ressure",
      value: "frDistance",
      selected: false,
    },
    {
      id: 11,
      name: "% Distance Driven on Rear Left Low Tire Pressure",
      value: "rlDistance",
      selected: false,
    },
    {
      id: 12,
      name: "% Distance Driven on Rear Right Low Tire Pressure",
      value: "rrDistance",
      selected: false,
    },
  ];
  mileageForVin = [
    {
      id: 2,
      name: "Total Fuel Consumed",
      value: "fuelConsumed",
      selected: false,
    },
    { id: 1, name: "Mileage", value: "mileageMPG", selected: false },
    {
      id: 3,
      name: "Total Fuel Cost",
      value: "fuelConsumedCost",
      selected: false,
    },
    {
      id: 4,
      name: "Fuel Cost Per Mile",
      value: "averageCostPerMile",
      selected: false,
    },
    {
      id: 5,
      name: "Total Idling Duration",
      value: "idlingDuration",
      selected: false,
    },
    {
      id: 6,
      name: "Idling Percentage",
      value: "idlingPercentage",
      selected: false,
    },
  ];
  driverScoreFilterForVin = [];
  vinDetails = [
    { id: 1, name: "Battery Voltage", value: "batteryStatus", selected: false },
    {
      id: 2,
      name: "Front Left Tire Pressure",
      value: "flTirepress",
      selected: false,
    },
    {
      id: 3,
      name: "Front Right Tire Pressure",
      value: "frTirepress",
      selected: false,
    },
    {
      id: 4,
      name: "Rear Left Tire Pressure",
      value: "rlTirepress",
      selected: false,
    },
    {
      id: 5,
      name: "Rear Right Tire Pressure",
      value: "rrTirepress",
      selected: false,
    },
  ];
  oemData: any;
  timePeriods = [
    { label: "Till Date", value: "TILL_NOW" },
    { label: "Today", value: "TODAY" },
    { label: "Yesterday", value: "YESTERDAY" },
    { label: "Current Week", value: "CURRENT_WEEK" },
    { label: "Current Month", value: "CURRENT_MONTH" },
    { label: "Previous Month", value: "PREVIOUS_MONTH" },
    { label: "Custom Range", value: "CUSTOM_RANGE" },
  ];

  vinList: {
    vin: string; name: string; selected: boolean
  }[] = [];
  // for Custom Report
  provderList: any[];
  fleetSummary: any = [];
  details: boolean = false;
  isTcoForVinActive: boolean = false;
  fleets: any;
  VINsummary: any;
  providerData1: any;
  isOpen: boolean = false;
  isOpens: boolean = false;
  modelData: any = [];
  modelData1: any = [];
  yearData: any = [];
  yearData1: any = [];
  defaultConsumer: string | null = null;
  searchTco: boolean = false;
  realFleetData: boolean = true;
  previousUrl: any;
  byMakeData: boolean = false;
  byModelData: boolean = false;
  byYearData: boolean = false;
  consumerDetails: any;
  providerList: string[] = [];
  makeList: { make: string; totalCount: number }[] = [];
  modelList: { model: string; totalCount: number }[] = [];
  fuelList: { fuel: string; totalCount: number }[] = [];
  yearList: { year: string; totalCount: number }[] = [];
  stateList: Array<{ state: string }> = [];
  stateIdData: string = "";
  makeCount?: number;
  modelCount?: number;
  yearCount?: number;
  companyIdData: string = "";
  modelIdData: string = "";
  yearIdData: string = "";
  fuelIdData: string = "";
  selectedProvider: string;
  selectedMake: string;
  selectedModel: string;
  selectedYear: string;
  fuelTypeList: { fuelType: string; totalCount: number }[] = [];
  primaryFuelTypeIdData: string = "";
  makeIdData: string; // Initialize as needed
  makeCounts: [string, number][];
  dataReport: any;
  fleetLevelData: any;
  vinLevelDataforCustom: any;
  selectAll: boolean = true;
  isCalendarOpen = false;
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth();
  months: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  selectedAttributes: any;
  selectedOption: string = "customRange";
  customData: any;
  customDataEnrollmentList: any;
  vinStatusHistory: any;
  fleetSummaryData: any;
  totalActiveCount: any;
  dateStart: string;
  dateEnd: string;
  totalOemBasedCount: any;
  rechargData: any;
  vehicleData: any;
  // create report
  today: string = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  selectedDate: string = this.today;
  showCalendar: boolean = false;
  hoveredDate: any = null;
  displayRange = '';
  dayNames: string[] = [ 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT','SUN',];
  timeSlots: string[] = [];
  dates: any[] = [];
  selectedTime: string = '';
  timeIntervalUnit: string = '';
  showEmailInput: boolean = false;
  newEmail: string = '';
  emails: string[] = [];
  reportList: any
  reportId: any;
  dateData: any;
  selectedDayName: string;
  isEditFilter: boolean=false;
  editData: any;
  selectedReportId: string;
  selectedReportName: string;
  scheduleTime: any;
  scheduleDate: string;
  occurrenceUnit: string;
  groupList: any;
  constructor(
    private appService: AppService,
    private datePipe: DatePipe,
    private elRef: ElementRef,
    private renderer: Renderer2,
    public router: Router,
    public http: HttpClient,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private dashboardservice: TaxonomyService,
    private timezoneService: TimezoneService,
    private toastr: ToastrService,
  ) {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.getUrl()
  }

  getUrl() {
    let url = this.router.url
    if(url == '/adlp/admin/admindashboard/custom') {
      this.selectedReport = 'custom'
    }
  }
  // For Monthly Report Download Toggle Calander Harshita code
  toggleCalendar() {
    this.isCalendarOpen = !this.isCalendarOpen;
  }
  previousYear() {
    this.currentYear--;
  }

  selectedVins: any=null

  nextYear() {
    this.currentYear++;
  }

  isMonthDisabled(index: number): boolean {
    return (
      this.currentYear === new Date().getFullYear() && index > this.currentMonth
    );
  }
  isNextYearDisabled(): boolean {
    return this.currentYear >= new Date().getFullYear();
  }
  getStartAndEndDate(monthIndex: number): {
    startDate: string;
    endDate: string;
  } {
    const startDate = new Date(this.currentYear, monthIndex, 1);
    let endDate: Date;
    if (
      this.currentYear === new Date().getFullYear() &&
      monthIndex === this.currentMonth
    ) {
      endDate = new Date();
    } else {
      endDate = new Date(this.currentYear, monthIndex + 1, 0);
    }
    return {
      startDate: this.formatDate1(startDate),
      endDate: this.formatDate1(endDate),
    };
  }
  formatDate1(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }
  // For Monthly Report Download Toggle Calander end Harshita Code
  ngOnInit(): void {
    this.showRole();
    this.selectGroupId()
    this.getReport()
    this.selectVinList();
    if(this.user == 'role_consumer_fleet'){
      this.fleetListData()

    }
 this.refuelDetailData();

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based
    const day = today.getDate();
    this.generateTimeSlots()
    // Format YYYY-MM-DD
    const selectedMonth = (month + 1).toString().padStart(2, '0');
    const selectedDay = day.toString().padStart(2, '0');
    this.selectedDate = `${year}-${selectedMonth}-${selectedDay}`;

    // Format display date (e.g., May 6, 2025)
    // this.displayDate = this.formatDisplayDate(year, month, day);
    // this.rechargingCostReportAPI()
    // this.refuelDetailData();


    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime(); // Update vehicle data when timezone changes
    });
    this.showRow = true;

  }
  showPopup: boolean = false
  vehicleList: any[] = [];
  getBehaviorScoreLabel(score: number): string {
    if (score >= 81) {
      return "Very Good";
    } else if (score >= 61) {
      return "Good";
    } else if (score >= 41) {
      return "Moderate";
    } else if (score >= 21) {
      return "Risky";
    } else {
      return "Very Risky";
    }
  }
  // View Report Section
  getFleetSummary(fleetSummaryView: any) {
    this.showPopup = true
    this.modalService.open(fleetSummaryView, { size: "xl", centered: true });
    if (this.user == "role_consumer_fleet") {
      this.subscription$.add(
        this.dashboardservice
          .downloadDriverSafetyReportAll(
            this.customConsumer,
            this.fleetIdData,
            this.groupIdData,
            this.selectedTimePeriod
          )
          .subscribe(
            (res: any) => {
              this.vehicleList = res.vinLevelStats;  // Store the entire list of vehicles
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // if (errorMessage === "Data not found") {
              //   // this.noDataFounds(this.nodatafound);
              // }
            }
          )
      );
    }
  }

  get selectedVinCount(): number {
    return this.vinList.filter(vin => vin.selected).length;
  }
  getFleetSummarySafety(fleetSafetyView: any) {
    this.showPopup = true
    this.modalService.open(fleetSafetyView, { size: "xl", centered: true });
    if (this.user == "role_consumer_fleet") {
      this.subscription$.add(
        this.dashboardservice
          .downloadDriverSafetyReportAll(
            this.customConsumer,
            this.fleetIdData,
            this.groupIdData,
            this.selectedTimePeriod
          )
          .subscribe(
            (res: any) => {
              this.vehicleList = res.vinLevelStats;  // Store the entire list of vehicles
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // if (errorMessage === "Data not found") {
              //   // this.noDataFounds(this.nodatafound);
              // }
            }
          )
      );
    }
  }
  getIdling(idlingView: any) {
    this.showPopup = true
    this.modalService.open(idlingView, { size: "xl", centered: true });
    if (this.user == "role_consumer_fleet") {
      this.subscription$.add(
        this.dashboardservice
          .downloadDriverSafetyReportAll(
            this.customConsumer,
            this.fleetIdData,
            this.groupIdData,
            this.selectedTimePeriod
          )
          .subscribe(
            (res: any) => {
              this.vehicleList = res.vinLevelStats;  // Store the entire list of vehicles
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // if (errorMessage === "Data not found") {
              //   // this.noDataFounds(this.nodatafound);
              // }
            }
          )
      );
    }
  }
  vehiclemileageView(mileage: any) {
    this.showPopup = true
    this.modalService.open(mileage, { size: "xl", centered: true });
    if (this.user == "role_consumer_fleet") {
      this.subscription$.add(
        this.dashboardservice
          .downloadDriverSafetyReportAll(
            this.customConsumer,
            this.fleetIdData,
            this.groupIdData,
            this.selectedTimePeriod
          )
          .subscribe(
            (res: any) => {
              this.vehicleList = res.vinLevelStats;  // Store the entire list of vehicles
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // if (errorMessage === "Data not found") {
              //   // this.noDataFounds(this.nodatafound);
              // }
            }
          )
      );
    }
  }
  fuelSumamryView(fuelSumamry: any) {
    this.showPopup = true
    this.modalService.open(fuelSumamry, { size: "xl", centered: true });
    if (this.selectedTimePeriod == 'TILL_NOW') {
      this.selectedTimePeriod = undefined
    }
    if (this.user != "admin") {
      this.subscription$.add(
        this.dashboardservice
          .getVinSummaryRefuelDetails(
            this.customConsumer,
            this.fleetIdData,
            this.groupIdData,
            this.fromDate
          )
          .subscribe(
            (res: any) => {
              this.refuelDetailsData = res;
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // this.appService.openSnackBar(errorMessage, "Error");
            }
          )
      );
    } else {
      this.subscription$.add(
        this.dashboardservice
          .getVinSummaryRefuelDetails(
            this.consumer,
            this.fleetIdData,
            this.groupIdData,
            this.selectedTimePeriod
          )
          .subscribe(
            (res: any) => {
              this.refuelDetailsData = res;
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // this.appService.openSnackBar(errorMessage, "Error");
            }
          )
      );
    }
  }
  evSummary(evSumamryData) {
    this.showPopup = true
    this.modalService.open(evSumamryData, { size: "xl", centered: true });
    if (this.user == "role_consumer_fleet") {
      this.subscription$.add(
        this.dashboardservice
          .reChargingCostReport(
            this.customConsumer,
            this.fleetIdData,
          )
          .subscribe(
            (res: any) => {
              this.rechargData = res.flatMap((item: any) => item.rechargeLocations);
            },

            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // if (errorMessage === "Data not found") {
              //   // this.noDataFounds(this.nodatafound);
              // }

            }
          )
      );
    }
  }
  // View Report Section End
  openFleetSummaryPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  updateTime() {
    if (!this.refuelDetailsData || this.refuelDetailsData.length === 0) return;

    this.refuelDetailsData.forEach(vehicle => {
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


  openCalendar() {
    this.isCalendarOpen = true;
  }

  closeCalendar() {
    this.isCalendarOpen = false;
  }
  groupIdData: any;
  selectMonth(index: number) {
    if (!this.isMonthDisabled(index)) {
      const { startDate, endDate } = this.getStartAndEndDate(index);
      this.isCalendarOpen = false; // Close calendar after selection
      this.monthlyReport(startDate, endDate);
      this.dateStart = startDate;
      this.dateEnd = endDate;
    }
  }
  // MONTHLY REPORT FOR ENROLLMENT

  async monthlyReport(startDate: string, endDate: string) {
    const manageListDownload$ =
      this.dashboardservice.getManageListDownloadConsumerFleet(
        this.consumer,
        this.fleetIdData,
        this.groupIdData,
        startDate,
        endDate
      );
    const vinStatusReport$ = this.dashboardservice.getManageListDownloadReort(
      this.consumer,
      this.fleetIdData,
      startDate,
      endDate
    );
    const safetyDataNewReport$ = this.dashboardservice.getSafetyDataNewReport(
      this.consumer,
      this.fleetIdData,
      startDate,
      endDate
    );

    this.subscription$.add(
      forkJoin([
        manageListDownload$,
        vinStatusReport$,
        safetyDataNewReport$,
      ]).subscribe(
        (results: any[]) => {
          // Assign responses to respective variables
          this.customDataEnrollmentList = results[0];
          this.vinStatusHistory = results[1];
          this.totalActiveCount =
            results[1]?.activeCount +
            results[1]?.failedCount +
            results[1]?.pendingCount +
            results[1]?.unenrollCount;
          this.totalOemBasedCount = results[1]?.providerCount;
          this.fleetSummaryData = results[2];
          this.fleetSumamryTotalDataFleetLevel = results[2]?.fleetLevelStats;
          this.fleetSumamryTotalData = results[2]?.vinLevelStats;
          this.exportToExcel();
        },
        (err) => {
          console.error(err); // Handle errors
        }
      )
    );
  }

  formatTimestamp(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");
    return `${month}-${day}-${year}`;
  }

  async exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("VIN_Summary_snapshot", {
      views: [{ showGridLines: false }],
    });

    const widthInPixels = 220 / 7.5;
    for (let col = 1; col <= 4; col++) {
      worksheet.getColumn(col).width = widthInPixels;
    }

    for (let col = 1; col <= 26; col++) {
      const cell = worksheet.getCell(1, col);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF25477B" },
      };
    }

    for (let col = 27; col <= 16384; col++) {
      worksheet.getColumn(col).hidden = true;
    }

    const titleCell = worksheet.getCell("A1");
    titleCell.value = "VIN Enrollment Summary";
    titleCell.alignment.horizontal = "left";

    const azugaCell = worksheet.getCell("A2");
    azugaCell.value = this.consumer;
    azugaCell.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
    };
    azugaCell.alignment = { vertical: "middle" };
    const FleetIdCell = worksheet.getCell("A3");
    if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
      FleetIdCell.value = `FleetId: ${this.fleetIdData}`;
    } else {
      FleetIdCell.value = `FleetIds: ${this.fleetIds}`;
    }
    FleetIdCell.font = {
      name: "Tahoma",
      size: 10,
      color: { argb: "FF25477B" },
    };

    // Total Enrolled
    const dateCell = worksheet.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    // Pending Vehicle
    const totalPendingVehicles = worksheet.getCell("A8");
    totalPendingVehicles.value = "Total Pendig Vehicles";
    totalPendingVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    totalPendingVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FF000000" },
      bold: true,
    };
    totalPendingVehicles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    totalPendingVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const countoftotalPendingVehicles = worksheet.getCell("A9");
    countoftotalPendingVehicles.value = this.vinStatusHistory?.pendingCount;
    countoftotalPendingVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    countoftotalPendingVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
      bold: true,
    };
    countoftotalPendingVehicles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    countoftotalPendingVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    // Active Vehicles
    const totalActiveVehicles = worksheet.getCell("B8");
    totalActiveVehicles.value = "Total Active Vehicles";
    totalActiveVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    totalActiveVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FF000000" },
      bold: true,
    };
    totalActiveVehicles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    totalActiveVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const countofTotalActiveVehicles = worksheet.getCell("B9");
    countofTotalActiveVehicles.value = this.vinStatusHistory?.activeCount;
    countofTotalActiveVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    countofTotalActiveVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
      bold: true,
    };
    countofTotalActiveVehicles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    countofTotalActiveVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    // Failed Vehicles
    const totalFailedVehciles = worksheet.getCell("A11");
    totalFailedVehciles.value = "Total Failed Vehicles";
    totalFailedVehciles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    totalFailedVehciles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FF000000" },
      bold: true,
    };
    totalFailedVehciles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    totalFailedVehciles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const countofTotalFailedVehicles = worksheet.getCell("A12");
    countofTotalFailedVehicles.value = this.vinStatusHistory?.failedCount;
    countofTotalFailedVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    countofTotalFailedVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
      bold: true,
    };
    countofTotalFailedVehicles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    countofTotalFailedVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    // Unenroll Vehicles
    const totalUnenrollVehicles = worksheet.getCell("B11");
    totalUnenrollVehicles.value = "Total UnEnroll Vehicles";
    totalUnenrollVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    totalUnenrollVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FF000000" },
      bold: true,
    };
    totalUnenrollVehicles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    totalUnenrollVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const countofTotalUnenrolledVehicles = worksheet.getCell("B12");
    countofTotalUnenrolledVehicles.value = this.vinStatusHistory?.unenrollCount;
    countofTotalUnenrolledVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    countofTotalUnenrolledVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
      bold: true,
    };
    countofTotalUnenrolledVehicles.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    countofTotalUnenrolledVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    // Enrolled Vehicles
    const totalVehicles = worksheet.getCell("A5");
    totalVehicles.value = "Total Enrolled Vehicles";
    totalVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    totalVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FF000000" },
      bold: true,
    };
    totalVehicles.alignment = { vertical: "middle", horizontal: "center" };
    totalVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const enrolledVehicles = worksheet.getCell("A6");
    enrolledVehicles.value = this.totalActiveCount;
    enrolledVehicles.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    enrolledVehicles.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
      bold: true,
    };
    enrolledVehicles.alignment = { vertical: "middle", horizontal: "center" };
    enrolledVehicles.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const timePeriod = worksheet.getCell("B5");
    timePeriod.value = "Time Period";
    timePeriod.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    timePeriod.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FF000000" },
      bold: true,
    };
    timePeriod.alignment = { vertical: "middle", horizontal: "center" };
    timePeriod.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const timePeriodValue = worksheet.getCell("B6");
    timePeriodValue.value = `${this.formatTimestamp(
      this.dateStart
    )} to ${this.formatTimestamp(this.dateEnd)}`;

    timePeriodValue.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    timePeriodValue.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
      bold: true,
    };
    timePeriodValue.alignment = { vertical: "middle", horizontal: "center" };
    timePeriodValue.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    const headers = [
      "OEM-wise",
      "FordPro", // Updated header
      "GM",
      "Stellantis",
      "Tesla",
      "Toyota",
    ];

    // Set header row
    for (let i = 0; i < headers.length; i++) {
      const cell = worksheet.getCell(8, 4 + i);
      cell.value = headers[i];
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }, // White background for headers
      };
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true,
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF000000" } },
        left: { style: "medium", color: { argb: "FF000000" } },
        bottom: { style: "medium", color: { argb: "FF000000" } },
        right: { style: "medium", color: { argb: "FF000000" } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    }

    // Define status colors
    const statusColors: { [key: string]: string } = {
      Pending: "739FFF",
      Active: "2CA67E",
      Failed: "FF7D7D",
      UnEnroll: "FAD691",
    };
    // const vehicleEnrolledData = this.chartData.totalVehiclesData;
    const statuses = ["Pending", "Active", "Failed", "UnEnroll"];
    let rowNum = 9;
    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      const labelCell = worksheet.getCell(rowNum, 4);
      labelCell.value = status;
      labelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: statusColors[status] || "FFFFFFFF" }, // Apply status color
      };
      labelCell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
      };
      labelCell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "medium", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "medium", color: { argb: "FF000000" } },
      };
      labelCell.alignment = { vertical: "middle", horizontal: "center" };
      for (let j = 1; j < headers.length; j++) {
        const cell = worksheet.getCell(rowNum, 4 + j);
        // Find the data for the current OEM
        const oemData = this.totalOemBasedCount.find(
          (provider: any) =>
            provider.provider.toUpperCase() ===
            (headers[j] === "FordPro" ? "FORDPRO" : headers[j].toUpperCase())
        );

        // Assign the value based on the status
        if (oemData) {
          const statusKey = `${status.toLowerCase()}Count`;
          cell.value =
            oemData[statusKey] !== undefined ? oemData[statusKey] : 0;
        } else {
          cell.value = 0; // If no data found, default to 0
        }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: statusColors[status] || "FFFFFFFF" }, // Apply status color
        };
        cell.font = {
          name: "Tahoma",
          size: 12,
          color: { argb: "FF000000" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "medium", color: { argb: "FF000000" } },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      rowNum++; // Move to the next row
    }
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }

    worksheet.getColumn(3).width = 100 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet.getColumn(col).width = 100 / 7.5;
    }
    worksheet.mergeCells("K8:L11");

    const mergedCellRange = worksheet.getCell("K8");
    mergedCellRange.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFEEADD" },
    };

    // Add text to the merged cells
    const mergedTextCell = worksheet.getCell("K8");
    mergedTextCell.value =
      "       See the Description tab for more information.";
    mergedTextCell.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FF000000" },
    };
    mergedTextCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    };

    for (let col = 1; col <= 13; col++) {
      const cell = worksheet.getCell(16, col);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF25477B" },
      };
    }
    const headers15 = [
      "Fleet Id",
      "Consumer",
      "OEM",
      "VIN",
      "Enrollment Date",
      "Current Status",
    ];
    this.customDataEnrollmentList.forEach((item: any) => {
      worksheet.addRow([
        item.fleetId,
        item.consumer,
        item.provider,
        item.vin,
        new Date(item.creationDate).toLocaleDateString(),
        item.enrollRequestType,
      ]);
    });
    for (let i = 0; i < headers15.length; i++) {
      const cell = worksheet.getCell(16, 1 + i);
      cell.value = headers15[i];
    }

    for (let row = 17; row <= worksheet.rowCount; row++) {
      for (let col = 1; col <= 7; col++) {
        const cell = worksheet.getCell(row, col);
        cell.font = {
          name: "Tahoma",
          size: 10,
          color: { argb: "FF000000" },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    }
    // Fleet Summary
    const worksheetFleetSummary = workbook.addWorksheet(
      "Fleet_Summary_snapshot",
      {
        views: [{ showGridLines: false }],
      }
    );
    worksheetFleetSummary.getColumn(1).width = 170 / 7.5;
    worksheetFleetSummary.getColumn(2).width = 190 / 7.5;
    worksheetFleetSummary.getColumn(4).width = 160 / 7.5;
    for (let col = 1; col <= 31; col++) {
      const cell = worksheetFleetSummary.getCell(1, col);
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
      worksheetFleetSummary.getColumn(col).hidden = true;
    }
    worksheetFleetSummary.getRow(1).height = 20;

    worksheetFleetSummary.getColumn(3).width = 80 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheetFleetSummary.getColumn(col).width = 120 / 7.5;
    }
    // A5 - Time Period
    const A5 = worksheetFleetSummary.getCell("A5");
    A5.value = "Time Period";
    A5.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A5.alignment = { vertical: "middle", horizontal: "center" };
    A5.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A6 - Apr'24 - Aug'24
    const A6 = worksheetFleetSummary.getCell("A6");
    const today = new Date();
    const formattedDate = this.datePipe.transform(today, "MMMM d, y");
    A6.value = `${this.formatTimestamp(
      this.dateStart
    )} to ${this.formatTimestamp(this.dateEnd)}`;
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
    // A9 - Total no. of vehicles (count)
    worksheetFleetSummary.mergeCells("A9:A10");
    const A9 = worksheetFleetSummary.getCell("A9");
    A9.value = "Total no. of vehicles\n(count)";
    A9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    A9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B9 - Total distance travelled (miles)
    worksheetFleetSummary.mergeCells("B9:B10");
    const B9 = worksheetFleetSummary.getCell("B9");
    B9.value = "Total distance travelled\n(miles)";
    B9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    B9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    B9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheetFleetSummary.mergeCells("C9:C10");
    const C9 = worksheetFleetSummary.getCell("C9");
    C9.value = "Total Trips Taken\n(count)";
    C9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    C9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    C9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    C9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheetFleetSummary.getColumn("C").width = 20;
    worksheetFleetSummary.mergeCells("D9:D10");
    const D9 = worksheetFleetSummary.getCell("D9");
    D9.value = "Total Fuel Consumed\n(gallons)";
    D9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    D9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    D9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    D9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheetFleetSummary.getColumn("D").width = 30;
    // A10 - 5
    const A10 = worksheetFleetSummary.getCell("A11");
    A10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalActiveVehicles}`;
    A10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    A10.alignment = { vertical: "middle", horizontal: "center" };
    A10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };

    // B10 - 4729.97
    const B10 = worksheetFleetSummary.getCell("B11");
    B10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalDistanceTravelled?.toFixed(
      2
    )}`;
    B10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    B10.alignment = { vertical: "middle", horizontal: "center" };
    B10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B10 - 4729.97
    const C10 = worksheetFleetSummary.getCell("C11");
    C10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalTripsTaken}`;
    C10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    C10.alignment = { vertical: "middle", horizontal: "center" };
    C10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B10 - 4729.97
    const D10 = worksheetFleetSummary.getCell("D11");
    D10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalFuelConsumed?.toFixed(
      0
    )}`;
    D10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    D10.alignment = { vertical: "middle", horizontal: "center" };
    D10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheetFleetSummary.mergeCells("E4:G4");
    // Data for A15 to I20
    const headers1 = [
      "Fleet Id",
      "VIN",
      "Vehicle Name",
      "Make",
      "Model",
      "Year",
      "Fuel Type",
      "Tire Pressure FL (psi)",
      "Tire Pressure FR (psi)",
      "Tire Pressure RL (psi)",
      "Tire Pressure RR (psi)",
      "Battery (v)",
      "Total Trips (count)",
      "Distance travelled (miles)",
      "Maximum Distance Covered (miles)",
      "Maximum Duration (hrs:min)",
      "Average Trip Distance (miles)",
      "Average Trip Duration (hrs:min)",
      "Average Speed (mph)",
      "Top Speed (mph)",
      "Harsh Acceleration (count)",
      "Harsh Cornering (count)",
      "Harsh Braking (count)",
      "Overspeeding Distance (%)",
      "Night driving(%)",
      "Safety Score",
      "Total Idling Duration (hrs:mm)",
      "Idling Percentage (%)",
      "Total Fuel Consumed (gal)",
      "Average Fuel Mileage (mpg)",
      "Average Fuel Cost Per Mile ($)",
    ];
    headers1.forEach((header, index) => {
      const cell = worksheetFleetSummary.getCell(15, index + 1); // Row 15, Columns A to I
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
        const row = worksheetFleetSummary.addRow([
          item.fleetId,
          item.cxVin,
          vinValue,
          item.make,
          item.model,
          item.year,
          item.fuelType,
          item.flTirepress != null && typeof item.flTirepress === "number"
            ? item.flTirepress.toFixed(0)
            : "N/A",
          item.frTirepress != null && typeof item.frTirepress === "number"
            ? item.frTirepress.toFixed(0)
            : "N/A",
          item.rlTirepress != null && typeof item.rlTirepress === "number"
            ? item.rlTirepress.toFixed(0)
            : "N/A",
          item.rrTirepress != null && typeof item.rrTirepress === "number"
            ? item.rrTirepress.toFixed(0)
            : "N/A",
          item.batteryStatus,
          item.tripCount,
          item.tripDistance,
          typeof item.maxDistance === "number"
            ? item.maxDistance.toFixed(2)
            : "N/A",
          this.secondsToHHMM(item.maxDuration),
          typeof item.averageDistance === "number"
            ? item.averageDistance.toFixed(0)
            : "N/A",
          this.secondsToHHMM(item.averageTime),
          typeof item.avgVehicleSpeed === "number"
            ? item.avgVehicleSpeed.toFixed(1)
            : "N/A",
          item.maxSpeed != null ? Number(item.maxSpeed).toFixed(1) : "0.0",
          item.odometer != null ? Number(item.odometer).toFixed(0) : "0.0",
          typeof item.harshAcc === "number" ? item.harshAcc.toFixed(2) : "N/A",
          typeof item.harshBrake === "number"
            ? item.harshBrake.toFixed(2)
            : "N/A",
          typeof item.harshCornering === "number"
            ? item.harshCornering.toFixed(2)
            : "N/A",
          typeof item.overspeedingDistance === "number"
            ? item.overspeedingDistance.toFixed(1)
            : "N/A",
          item.nightDistance,
          typeof item.driverBehaviourScore === "number"
            ? item.driverBehaviourScore.toFixed(1)
            : "N/A",
          this.secondsToHHMM(item.idlingDuration),
          typeof item.idlingPercentage === "number"
            ? item.idlingPercentage.toFixed(1)
            : "N/A",
          item.fuelConsumed != null ? item.fuelConsumed.toFixed(2) : "0.00",
          item.avgMileage != null ? item.avgMileage.toFixed(2) : "0.00",
          Number(item.averageCostPerMile).toFixed(2),
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
    const headerss = [
      "A15",
      "B15",
      "C15",
      "D15",
      "E15",
      "F15",
      "G15",
      "H15",
      "I15",
      "J15",
      "K15",
      "L15",
      "M15",
      "N15",
      "O15",
      "P15",
      "Q15",
      "R15",
      "S15",
      "T15",
      "U15",
      "V15",
      "W15",
      "X15",
      "Y15",
      "Z15",
      "AA15",
      "AB15",
      "AC15",
      "AD15",
    ];
    headerss.forEach((cell) => {
      const headerCell = worksheetFleetSummary.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });
    headerss.forEach((header) => {
      const columnLetter = header.match(/[A-Z]+/)[0]; // Extract the column letter
      const column = worksheetFleetSummary.getColumn(columnLetter);
      if (
        worksheetFleetSummary
          .getRow(15)
          .getCell(columnLetter)
          .address.includes("15")
      ) {
        column.width = 25; // Set the width of each column to 20
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    FileSaver.saveAs(blob, `VIN_enrollment_Summary_${this.consumer}}.xlsx`);
  }

  // select option productivity or custom
  selectReport(report: string) {
    this.selectedReport = report;
  }
  isCardOpen = false;
  // Custom calander
  openCard() {
    this.isCardOpen = true;
  }
  closeCard() {
    this.isCardOpen = false;
  }
  selectOption(option: string, dropdownId: string) {
    const dropdown = this.elRef.nativeElement.querySelector(
      `#${dropdownId}`
    ) as HTMLElement;
    dropdown.style.display = "none";
  }
  @HostListener("document:click", ["$event"])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdowns =
      this.elRef.nativeElement.querySelectorAll(".downloadModal");
    dropdowns.forEach((dropdown: HTMLElement) => {
      if (
        !dropdown.contains(target) &&
        !dropdown.previousElementSibling?.contains(target)
      ) {
        this.renderer.setStyle(dropdown, "display", "none");
      }
    });
  }
  // Show role condition
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem("userRole"));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem("multiRole"));
    let customConsumers = JSON.stringify(
      sessionStorage.getItem("custom-consumer")
    );
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === "role_user_fleet" ) {
      let fleetId = JSON.stringify(sessionStorage.getItem("fleetUserId"));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;
    }
    if (  this.user ==='role_org_group') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
      }
  }
  // Time period filter for custom report
  onTimePeriodChangeData(selectedPeriod: string) {

    this.selectedTimePeriod = selectedPeriod;
    this.driverSafetyReportAPI('');
    if (this.selectedPeriod === "CUSTOM_RANGE") {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }
  }
  // Fleet List for admin
  async fleetListDataAdmin() {
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
      this.subscription$.add(
        await this.dashboardservice.getFleetList(this.customConsumer).subscribe(
          (res: any) => {
            this.fleetList = res;
            // Sort the fleetList by id
            this.fleetList.sort((a, b) => a.id - b.id);
            this.fleetIdData = null;
          },
          (err) => {
            console.error('Error fetching fleet list:', err);
          }
        ))

  }

  dateRange: any
  selectConsumer(consumer: string) {
    this.consumer = consumer
    this.fleetIdData = null;
    this.disableAllcheckBoxes();
    this.selectVinList();
    this.adminDataList()
    this.refuelDetailData();
    if (this.consumer) {
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

  async adminDataList() {
    this.subscription$.add(
      await this.dashboardservice.getFleetList(this.consumer).subscribe(
        (res: any) => {
          this.fleetList = res;
          this.fleetList = this.fleetList.sort((a, b) => {
            return a.id - b.id;
          });
          if (this.fleetList && this.fleetList.length > 0) {
            this.fleetIds = this.fleetList
              .map((fleet: any) => fleet.id)
              .join(", ");
            this.fleetIdData = this.fleetIds;
          } else {
            this.fleetIds = "All";
            this.fleetIdData = null;
          }

          this.fleetIdData = null;
        },
        (err) => { }
      )
    )
  }

  // Fleet Id List for customer
  async fleetListData() {
    this.subscription$.add(
      await this.dashboardservice.getFleetList(this.customConsumer).subscribe(
        (res: any) => {
          this.fleetList = res;

          // Sort the fleetList by id
          this.fleetList.sort((a, b) => a.id - b.id);
          this.fleetIdData = null;
          this.selectGroupId()
        },
        (err) => {
          console.error('Error fetching fleet list:', err);
        }
      )
    );
  }

  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }
  disableAllcheckBoxes() {
    if (this.selectedPeriod != 'TILL_NOW') {
      this.selectedPeriod = 'TILL_NOW'
      this.onTimePeriodChangeData(this.selectedPeriod);
    }

    this.distanceTravelledForVIN = this.distanceTravelledForVIN.map((item) => ({
      ...item,
      selected: false,
    }));
    this.driverEventsForVIN = this.driverEventsForVIN.map((item) => ({
      ...item,
      selected: false,
    }));
    this.mileageForVin = this.mileageForVin.map((item) => ({
      ...item,
      selected: false,
    }));
    this.vinDetails = this.vinDetails.map((item) => ({
      ...item,
      selected: false,
    }));
  }
  // select fleet Id function api call
  selectFleetId() {
    this.selectGroupId()
    this.disableAllcheckBoxes();
    this.selectVinList();
    this.refuelDetailData();
    this.driverSafetyReportAPI("");
    // Display error only if user is admin and consumer is not selected
    if (this.user === 'admin' && (!this.consumer || this.consumer === '')) {
      const errorMessage = 'Please select consumer';
      this.appService.openSnackBar(errorMessage, 'Error');
    } else {

    }
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.disableAllcheckBoxes();
    this.selectVinList();
    this.refuelDetailData();
    this.driverSafetyReportAPI("");
    // Display error only if user is admin and consumer is not selected
    if (this.user === 'admin' && (!this.consumer || this.consumer === '')) {
      const errorMessage = 'Please select consumer';
      this.appService.openSnackBar(errorMessage, 'Error');
    } else {

    }
  }

  selectGroupId() {
    if (!this.fleetIdData) return;
    console.log('123')
    if(this.user != 'role_user_fleet'){
    this.subscription$.add(
      this.dashboardservice.getOrganizationSubGroups(this.fleetIdData,this.consumer).subscribe((res: any) => {
        const nestedGroups = res?.groups || [];
        this.groupList = this.flattenGroups(nestedGroups);
      }, err => {
        console.error('Error fetching sub-groups:', err);
      })
    );
  }
    else if(this.user === 'role_user_fleet'){
      console.log('213')
      this.subscription$.add(
        this.dashboardservice.getOrganizationSubGroups(this.fleetIdData,this.customConsumer).subscribe((res: any) => {
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

  // if click on corss button in fleet id dropdown so bydefault show selected consumer all fleet data
  clearFleetSelection() { }
  // VIN Masking for admin and customer
  maskVinNumber(_vinNumber) {
    if (_vinNumber && _vinNumber.length === 17) {
      // Mask the first 14 characters and keep the last 3 characters visible
      const mask = "*".repeat(14); // Create a mask with 14 asterisks
      const visiblePart = _vinNumber.slice(-3); // Extract the last 3 characters
      return mask + visiblePart; // Combine mask with visible part
    } else {
      return null; // Return null if input is invalid or length is not 17
    }
  }
  // format data in mm-dd-yyyy for productivity report
  private formatDate(date: Date): string {
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
    } as const;
    return date.toLocaleDateString("en-US", options);
  }
  // timstamp convert to HH:MM without any zone
  secondsToHHMM(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }
  // custom date range selection
  onDateRangeSelected(dateRange: { fromDate: string; toDate: string }) {
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
    // this.driverSafetyReportAPI()
  }
  // calculate week range for print in report (Week day count)
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
  // Select period for custom range
  handleOption(option: string) {
    this.selectedOption = option;
    this.selectedPeriod =
      this.timePeriods.find((period) => period.value === option)?.value || "";
    this.onTimePeriodChangeData(this.selectedPeriod);
  }
  driverSafetyReportAPI(report) {
    if (this.user == "role_consumer_fleet") {
      this.subscription$.add(
        this.dashboardservice
          .downloadDriverSafetyReportAll(
            this.customConsumer,
            this.fleetIdData,
            this.groupIdData,
            this.selectedTimePeriod
          )
          .subscribe(
            (res: any) => {
              this.fleetSumamryTotalData = res?.vinLevelStats;
              this.fleetSumamryTotalDataFleetLevel = res?.fleetLevelStats;
              this.StartDate = res?.startDate;
              this.EndDate = res?.endDate;
              if (report == "idling") {
                this.IdlingReportDownload();
              }
              if (report == "safety") {
                this.fleetSafetyReportDownload();
              }
              if (report == "summary") {
                this.fleetSummaryReportDownload();
              }
              if (report == "mileage") {
                this.vehicleMileageReportDownload();
              }
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // if (errorMessage === "Data not found") {
              //   // this.noDataFounds(this.nodatafound);
              // }
            }
          )
      );
    }
  }

  rechargingCostReportAPI() {
    if (this.user == "role_consumer_fleet") {
      this.subscription$.add(
        this.dashboardservice
          .reChargingCostReport(
            this.customConsumer,
            this.fleetIdData,
          )
          .subscribe(
            (res: any) => {
              this.rechargData = res.flatMap((item: any) => item.rechargeLocations);
            },

            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // if (errorMessage === "Data not found") {
              //   // this.noDataFounds(this.nodatafound);
              // }

            }
          )
      );
    }
  }
  downloadEVvehicleReportSection() {
    if (
      !this.rechargData ||
      this.rechargData.length === 0
    ) {
      this.rechargingCostReportAPI();
    } else {
      this.vehicleEVReportDownload();
    }
  }


  async vehicleEVReportDownload() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Summary_snapshot", {
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
    titleCell.value = "EV Summary Report";
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
    const dateCell = worksheet.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }
    worksheet.getColumn(3).width = 80 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet.getColumn(col).width = 120 / 7.5;
    }
    // A5 - Time Period
    const A5 = worksheet.getCell("A5");
    A5.value = "Time Period";
    A5.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A5.alignment = { vertical: "middle", horizontal: "center" };
    A5.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A6 - Apr'24 - Aug'24
    const A6 = worksheet.getCell("A6");
    const today = new Date();
    const formattedDate = this.datePipe.transform(today, "MMMM d, y");
    A6.value = `Till ${formattedDate}`;
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
    // A9 - Total no. of vehicles (count)
    worksheet.mergeCells("A9:A10");
    const A9 = worksheet.getCell("A9");
    A9.value = "Energy Consumed\n(kwh)";
    A9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    A9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const totalEnergyConsumed = this.rechargData?.reduce(
      (total, item) => {
        const eneryConsumed = item.chargeAmtKWH || 0; // Convert to number and handle non-numeric values
        return total + eneryConsumed;
      },
      0
    );
    // A10 - 5
    const A10 = worksheet.getCell("A11");
    A10.value = `${(totalEnergyConsumed).toFixed(2)}`;
    A10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    A10.alignment = { vertical: "middle", horizontal: "center" };
    A10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheet.mergeCells("E4:G4");
    // Data for A15 to I20
    const headers1 = [
      "VIN",
      "Vehicle Name",
      "Group Name",
      "Date & Time",
      "Location",
      "Type",
      "Energy Consumed (kwh)",
      "Cost ($)",
    ];
    headers1.forEach((header, index) => {
      const cell = worksheet.getCell(15, index + 1); // Row 15, Columns A to I
      cell.value = header;
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    if (this.rechargData && this.rechargData.length) {
      this.rechargData.forEach((item) => {
        const dateTimeUTC = moment.utc(item.timestamp);
        const formattedDate = dateTimeUTC.tz(this.selectedTimezone).format('MMM D, YYYY');
        const formattedTime = dateTimeUTC.tz(this.selectedTimezone).format('HH:mm');
        const timeOfRefueling = `${formattedDate} ${formattedTime}`;

        const row = worksheet.addRow([
          item.vin,
          item.alias,
          item.groupName || '--',
          `${timeOfRefueling}`,
          item.address, // Handle undefined values safely
          item.chargingLocationType,
          item.chargeAmtKWH,
          item.rechargeCost
        ]);
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
      "A15",
      "B15",
      "C15",
      "D15",
      "E15",
      "F15",
      "G15",
      "H15",
      "I15",
      "J15",
      "K15",
      "L15",
      "M15",
      "N15",
      "O15",
      "P15",
      "Q15",
      "R15",
      "S15",
      "T15",
      "U15",
      "V15",
      "W15",
      "X15",
      "Y15",
      "Z15",
      "AA15",
      "AB15",
      "AC15",
      "AD15",
    ];
    headers.forEach((cell) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });
    headers.forEach((header) => {
      const columnLetter = header.match(/[A-Z]+/)[0]; // Extract the column letter
      const column = worksheet.getColumn(columnLetter);
      if (worksheet.getRow(15).getCell(columnLetter).address.includes("15")) {
        column.width = 25; // Set the width of each column to 20
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    FileSaver.saveAs(
      blob,
      `EV_Summary_Report${this.consumer}_${formattedDate}.xlsx`
    );
  }

  // For Fuel summary using this api function
  refuelDetailData() {
    if (this.selectedTimePeriod == 'TILL_NOW') {
      this.selectedTimePeriod = undefined
    }
    if (this.user != "admin") {
      this.subscription$.add(
        this.dashboardservice
          .getVinSummaryRefuelDetails(
            this.customConsumer,
            this.fleetIdData,
            this.groupIdData,
            this.fromDate
          )
          .subscribe(
            (res: any) => {
              this.refuelDetailsData = res;
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // this.appService.openSnackBar(errorMessage, "Error");
            }
          )
      );
    }
    else {
      this.subscription$.add(
        this.dashboardservice
          .getVinSummaryRefuelDetails(
            this.consumer,
            this.fleetIdData,
            this.groupIdData,
            this.selectedTimePeriod
          )
          .subscribe(
            (res: any) => {
              this.refuelDetailsData = res;
            },
            (err) => {
              // const errorMessage = err?.apierror?.message || "Data not found";
              // this.appService.openSnackBar(errorMessage, "Error");
            }
          )
      );
    }
  }
  // Fleet Summary Download Function
  downloadFleetReportSection() {
    if (
      !this.fleetSumamryTotalData ||
      this.fleetSumamryTotalData.length === 0
    ) {
      this.driverSafetyReportAPI("summary");
    } else {
      this.fleetSummaryReportDownload();
    }
  }
  downloadFleetReportSectionview() {
    if (
      !this.fleetSumamryTotalData ||
      this.fleetSumamryTotalData.length === 0
    ) {
      this.driverSafetyReportAPI("summary");
    } else {
      this.fleetSummaryReportDownloadView()
    }
  }

  async fleetSummaryReportDownload() {
    const workbook = new ExcelJS.Workbook();
    const descriptionSheet = workbook.addWorksheet("Description", {
      views: [{ showGridLines: false }],
    });
    for (let col = 1; col <= 26; col++) {
      const cell = descriptionSheet.getCell(1, col);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF25477B" },
      };
    }
    for (let col = 27; col <= 16384; col++) {
      descriptionSheet.getColumn(col).hidden = true;
    }

    const titleCells = descriptionSheet.getCell("A1");
    titleCells.value = "Fleet Summary";
    titleCells.alignment.horizontal = "left";

    const azugaCell_desc = descriptionSheet.getCell("A2");
    azugaCell_desc.value = this.consumer;
    azugaCell_desc.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
    };
    azugaCell_desc.alignment = { vertical: "middle" };

    const FleetIdCells = descriptionSheet.getCell("A3");
    if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
      FleetIdCells.value = `FleetId: ${this.fleetIdData}`;
    } else {
      // If no specific fleet ID is selected, print all fleet IDs
      FleetIdCells.value = `FleetIds: ${this.fleetIds}`;
    }
    FleetIdCells.font = {
      name: "Tahoma",
      size: 10,
      color: { argb: "FF25477B" },
    };
    FleetIdCells.alignment = { vertical: "middle" };
    const dateCells = descriptionSheet.getCell("D1");
    dateCells.value = this.formatDate(new Date());

    // Alerts
    const reportDescriptions = descriptionSheet.getCell("C5");
    reportDescriptions.value = "Report Description";
    reportDescriptions.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptions.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FA751A" },
      bold: true,
    };
    reportDescriptions.alignment = { vertical: "middle", horizontal: "left" };
    reportDescriptions.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getColumn(3).width = 100;
    const reportDescriptionsValues = descriptionSheet.getCell("C6");
    reportDescriptionsValues.value =
      "The Fleet Summary report can be downloaded from CerebrumX Workspace dashboard, and provides the status of each vehicle enrolled by the fleet manager to a fleet ID. The status for a vehicle can be PENDING, ACTIVE, FAILED, or UNENROLLED, as described below:";
    reportDescriptionsValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptionsValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    reportDescriptionsValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    reportDescriptionsValues.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getRow(6).height = 60;
    // Pending
    const timePeriods = descriptionSheet.getCell("C10");
    timePeriods.value = "Harsh Acceleration (HA)";
    timePeriods.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "3366FF" },
    };
    timePeriods.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    timePeriods.alignment = { vertical: "middle", horizontal: "left" };
    timePeriods.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const timePeriodValues = descriptionSheet.getCell("C11");
    timePeriodValues.value =
      "Harsh acceleration occurs when a driver speeds up quickly (above 2.74 m/s2) from a stop or standstill, often using more power than necessary. Harsh acceleration can be a sign of aggressive driving and can lead to increased fuel consumption as well as wear on the vehicle. Measured in count per 100 miles.";
    timePeriodValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "a8bdea" },
    };
    timePeriodValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    timePeriodValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    timePeriodValues.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(11).height = 60;
    // Failed
    const failedDetails = descriptionSheet.getCell("C12");
    failedDetails.value = "Harsh Braking (HB)";
    failedDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ff7d7d" },
    };
    failedDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    failedDetails.alignment = { vertical: "middle", horizontal: "left" };
    failedDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const failedDetailsParagraph = descriptionSheet.getCell("C13");
    failedDetailsParagraph.value =
      "Harsh braking refers to sudden or forceful braking (acceleration below -3.04 m/s2), leading the vehicle to a stop or standstill. Harsh braking can be a sign of distracted driving and may result in undue maintenance issues or even collisions. Measured in count per 100 miles.";
    failedDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "f3b6b6" },
    };
    failedDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    failedDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    failedDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(13).height = 60;
    // Active
    const activeDetails = descriptionSheet.getCell("C14");
    activeDetails.value = "Harsh Cornering (HC)";
    activeDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2ca67e" },
    };
    activeDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    activeDetails.alignment = { vertical: "middle", horizontal: "left" };
    activeDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const activeDetailsParagraph = descriptionSheet.getCell("C15");
    activeDetailsParagraph.value =
      "Harsh cornering is a result of quick or sharp turns, or going into a bend too fast (lateral acceleration greater than 3.92 m/s2 or less than -3.92 m/s2). Harsh cornering can cause loss of stability and control of the vehicle, while increasing the risk of excessive wear and tear. Measured in count per 100 miles.";
    activeDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95D3BF" },
    };
    activeDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    activeDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    activeDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(15).height = 60;
    // Un Enrolled
    // Active
    const unenrolledDetails = descriptionSheet.getCell("C16");
    unenrolledDetails.value = "Over Speeding (OS)";
    unenrolledDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "fad691" },
    };
    unenrolledDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    unenrolledDetails.alignment = { vertical: "middle", horizontal: "left" };
    unenrolledDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const overSpeedingParagraph = descriptionSheet.getCell("C17");
    overSpeedingParagraph.value =
      "Over speeding refers to the proportion of distance travelled above the authorized speed limit (above 75 mph) as compared to the total distance travelled. Over speeding may hamper the driver’s ability to react to hazards, leading to increased risks of accidents and legal penalties. Measured in percentage (%) of distance travelled (miles).";
    overSpeedingParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "f3dfb8" },
    };
    overSpeedingParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    overSpeedingParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    overSpeedingParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;

    const overSpeedingDetails = descriptionSheet.getCell("C18");
    overSpeedingDetails.value = "Night Driving (ND)";
    overSpeedingDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "808080" },
    };
    overSpeedingDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    overSpeedingDetails.alignment = { vertical: "middle", horizontal: "left" };
    overSpeedingDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const unenrolledDetailsParagraph = descriptionSheet.getCell("C19");
    unenrolledDetailsParagraph.value =
      "Night driving highlights the proportion of distance travelled between nighttime hours (20:00-06:00 UTC) as compared to the total distance travelled. Ideally, night driving should be kept at a minimum as it could be more hazardous due to reduced visibility and increased fatigue. Measured in percentage (%) of distance travelled (miles).";
    unenrolledDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "BFBFBF" },
    };
    unenrolledDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    unenrolledDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    unenrolledDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;
    const safetyScoreHeading = descriptionSheet.getCell("C20");
    safetyScoreHeading.value = "Safety Score";
    safetyScoreHeading.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "29BB15" },
    };
    safetyScoreHeading.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    safetyScoreHeading.alignment = { vertical: "middle", horizontal: "left" };
    safetyScoreHeading.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const safetyScoreParagraph = descriptionSheet.getCell("C21");
    safetyScoreParagraph.value =
      "Driver score is an AI-generated indicator of how safely the driver drives, on a scale of 0 to 100 (100 being the safest). It is a consolidated result giving a holistic safety assessment for the driver, calculated across key driver behavior metrics like: Harsh Acceleration, Harsh Braking, Harsh Cornering, Over Speeding and Night Driving Percentage, using machine learning algorithms over a period of time.";
    safetyScoreParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "72D000" },
    };
    safetyScoreParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    safetyScoreParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    safetyScoreParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;

    const worksheet = workbook.addWorksheet("Summary_snapshot", {
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
    titleCell.value = "Fleet Summary Report";
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
    const dateCell = worksheet.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }
    worksheet.getColumn(3).width = 80 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet.getColumn(col).width = 120 / 7.5;
    }
    // A5 - Time Period
    const A5 = worksheet.getCell("A5");
    A5.value = "Time Period";
    A5.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A5.alignment = { vertical: "middle", horizontal: "center" };
    A5.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A6 - Apr'24 - Aug'24
    const A6 = worksheet.getCell("A6");
    const currentDate = new Date();
    let formattedDate = "";
    // selected period time period
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        // Format today's date for 'TILL_NOW'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `Till ${formattedDate}`;
        break;
      }

      case "TODAY": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "YESTERDAY": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        // Define the custom week ranges
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }

        // Format the first and last date of the week
        formattedDate = `${formatDate(
          firstDayOfWeek,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_MONTH": {
        // Format the first day of the current month and current date for 'CURRENT_MONTH'
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        formattedDate = `${formatDate(
          firstDayOfMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        // Calculate the first and last day of the previous month
        const firstDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        formattedDate = `${formatDate(
          firstDayOfPreviousMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }
      case "CUSTOM_RANGE": {
        const formattedStartDate = formatDate(
          this.fromDate,
          "MM-dd-yyyy",
          "en-US"
        );
        const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");

        // Assign formatted dates to component properties
        this.startDate = formattedStartDate; // Use the formatted start date
        this.endDate = formattedEndDate; // Use the formatted end date

        // Create the formatted date range (optional)
        const formattedDate = `${formattedStartDate} to ${formattedEndDate}`;

        // Set A6.value to the formatted date range (if needed)
        A6.value = formattedDate;

        break;
      }

      default: {
        A6.value = "Invalid selection";
        break;
      }
    }
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
    // A9 - Total no. of vehicles (count)
    worksheet.mergeCells("A9:A10");
    const A9 = worksheet.getCell("A9");
    A9.value = "Total no. of vehicles\n(count)";
    A9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    A9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B9 - Total distance travelled (miles)
    worksheet.mergeCells("B9:B10");
    const B9 = worksheet.getCell("B9");
    B9.value = "Total distance travelled\n(miles)";
    B9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    B9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    B9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheet.mergeCells("C9:C10");
    const C9 = worksheet.getCell("C9");
    C9.value = "Total Trips Taken\n(count)";
    C9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    C9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    C9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    C9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheet.getColumn("C").width = 20;
    worksheet.mergeCells("D9:D10");
    const D9 = worksheet.getCell("D9");
    D9.value = "Total Fuel Consumed\n(gallons)";
    D9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    D9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    D9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    D9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheet.getColumn("D").width = 30;
    // A10 - 5
    const A10 = worksheet.getCell("A11");
    A10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalActiveVehicles}`;
    A10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    A10.alignment = { vertical: "middle", horizontal: "center" };
    A10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };

    // B10 - 4729.97
    const B10 = worksheet.getCell("B11");
    B10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalDistanceTravelled?.toFixed(
      2
    )}`;
    B10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    B10.alignment = { vertical: "middle", horizontal: "center" };
    B10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B10 - 4729.97
    const C10 = worksheet.getCell("C11");
    C10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalTripsTaken}`;
    C10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    C10.alignment = { vertical: "middle", horizontal: "center" };
    C10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B10 - 4729.97
    const D10 = worksheet.getCell("D11");
    D10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalFuelConsumed?.toFixed(
      0
    )}`;
    D10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    D10.alignment = { vertical: "middle", horizontal: "center" };
    D10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheet.mergeCells("E4:G4");
    // Data for A15 to I20
    const headers1 = [
      "Fleet Id",
      "Fleet Name",
      "Group Name",
      "VIN",
      "Vehicle Name",
      "Make",
      "Model",
      "Year",
      "Class",
      "Fuel Type",
      "Tire Pressure FL (psi)",
      "Tire Pressure FR (psi)",
      "Tire Pressure RL (psi)",
      "Tire Pressure RR (psi)",
      "Battery (v)",
      "Total Trips (count)",
      "Distance travelled (miles)",
      "Maximum Distance Covered (miles)",
      "Maximum Duration (hrs:min)",
      "Average Trip Distance (miles)",
      "Average Trip Duration (hrs:min)",
      "Average Speed (mph)",
      "Odometer (mi)",
      "Top Speed (mph)",
      "HA (count per 100 miles)",
      "HB (count per 100 miles)",
      "HC (count per 100 miles)",
      "OS (% distance travelled)",
      "ND (% distance travelled)",
      "Safety Score",
      "Total Idling Duration (hrs:mm)",
      "Idling Percentage (%)",
      "Total Fuel Consumed (gal)",
      "Average Fuel Mileage (mpg)",
      "Average Fuel Cost Per Mile ($)",
    ];
    headers1.forEach((header, index) => {
      const cell = worksheet.getCell(15, index + 1); // Row 15, Columns A to I
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
          item.fleetName || '--',
          item.groupName || '--',
          item.cxVin,
          vinValue,
          item.make,
          item.model,
          item.year,
          item.bodyClass,
          item.fuelType,
          item.flTirepress != null ? item.flTirepress.toFixed(0) : "N/A",
          item.frTirepress != null ? item.frTirepress.toFixed(0) : "N/A",
          item.rlTirepress != null ? item.rlTirepress.toFixed(0) : "N/A",
          item.rrTirepress != null ? item.rrTirepress.toFixed(0) : "N/A",
          item.batteryStatus,
          item.tripCount,
          item.tripDistance,
          typeof item.maxDistance === "number"
            ? item.maxDistance.toFixed(2)
            : "N/A",
          this.secondsToHHMM(item.maxDuration),
          typeof item.averageDistance === "number"
            ? item.averageDistance.toFixed(0)
            : "N/A",
          this.secondsToHHMM(item.averageTime),
          typeof item.avgVehicleSpeed === "number"
            ? item.avgVehicleSpeed.toFixed(1)
            : "N/A",
            item.odometer != null ? Number(item.odometer).toFixed(0) : "0",
          item.maxSpeed != null ? Number(item.maxSpeed).toFixed(1) : "0.0",
          item.odometer != null ? Number(item.odometer).toFixed(0) : "0.0",
          typeof item.harshAcc === "number" ? item.harshAcc.toFixed(2) : "N/A",
          typeof item.harshBrake === "number"
            ? item.harshBrake.toFixed(2)
            : "N/A",
          typeof item.harshCornering === "number"
            ? item.harshCornering.toFixed(2)
            : "N/A",
          typeof item.overspeedingDistance === "number"
            ? item.overspeedingDistance.toFixed(1)
            : "N/A",
          item.nightDistance,
          typeof item.driverBehaviourScore === "number"
            ? item.driverBehaviourScore.toFixed(1)
            : "N/A",
          this.secondsToHHMM(item.idlingDuration),
          typeof item.idlingPercentage === "number"
            ? item.idlingPercentage.toFixed(1)
            : "N/A",
          item.fuelConsumed != null ? item.fuelConsumed.toFixed(2) : "0.00",
          item.avgMileage != null ? item.avgMileage.toFixed(2) : "0.00",
          Number(item.averageCostPerMile).toFixed(2),
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
      "A15",
      "B15",
      "C15",
      "D15",
      "E15",
      "F15",
      "G15",
      "H15",
      "I15",
      "J15",
      "K15",
      "L15",
      "M15",
      "N15",
      "O15",
      "P15",
      "Q15",
      "R15",
      "S15",
      "T15",
      "U15",
      "V15",
      "W15",
      "X15",
      "Y15",
      "Z15",
      "AA15",
      "AB15",
      "AC15",
      "AD15",
    ];
    headers.forEach((cell) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });
    headers.forEach((header) => {
      const columnLetter = header.match(/[A-Z]+/)[0]; // Extract the column letter
      const column = worksheet.getColumn(columnLetter);
      if (worksheet.getRow(15).getCell(columnLetter).address.includes("15")) {
        column.width = 25; // Set the width of each column to 20
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
   if (this.user != "admin") {
      FileSaver.saveAs(
        blob,
        `Fleet_Summary_Report_${this.customConsumer}_${formattedDate}.xlsx`
      );
    }
  }
  // Fleet safety report download function
  downloadFleetSaeftyReportSection() {
    if (
      !this.fleetSumamryTotalData ||
      this.fleetSumamryTotalData.length === 0
    ) {
      this.driverSafetyReportAPI("safety");
    } else {
      this.fleetSafetyReportDownload()
    }
  }

  async fleetSummaryReportDownloadView() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Summary_snapshot", {
      views: [{ showGridLines: false }],
    });
    worksheet.getColumn(1).width = 170 / 7.5;
    worksheet.getColumn(2).width = 190 / 7.5;
    worksheet.getColumn(4).width = 160 / 7.5;
    for (let col = 1; col <= 26; col++) {
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
    for (let col = 27; col <= 16384; col++) {
      worksheet.getColumn(col).hidden = true;
    }
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Fleet Safety Report";
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
    // For Fleet Id
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
    const dateCell = worksheet.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }
    worksheet.getColumn(3).width = 80 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet.getColumn(col).width = 120 / 7.5;
    }
    // A5 - Time Period
    const A5 = worksheet.getCell("A5");
    A5.value = "Time Period";
    A5.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A5.alignment = { vertical: "middle", horizontal: "center" };
    A5.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A6 - Apr'24 - Aug'24
    const A6 = worksheet.getCell("A6");
    const currentDate = new Date();
    let formattedDate = "";
    // selected period time period
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        // Format today's date for 'TILL_NOW'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `Till ${formattedDate}`;
        break;
      }

      case "TODAY": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "YESTERDAY": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        // Define the custom week ranges
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }

        // Format the first and last date of the week
        formattedDate = `${formatDate(
          firstDayOfWeek,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_MONTH": {
        // Format the first day of the current month and current date for 'CURRENT_MONTH'
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        formattedDate = `${formatDate(
          firstDayOfMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        // Calculate the first and last day of the previous month
        const firstDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        formattedDate = `${formatDate(
          firstDayOfPreviousMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }
      case "CUSTOM_RANGE": {
        const formattedStartDate = formatDate(
          this.fromDate,
          "MM-dd-yyyy",
          "en-US"
        );
        const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");

        // Assign formatted dates to component properties
        this.startDate = formattedStartDate; // Use the formatted start date
        this.endDate = formattedEndDate; // Use the formatted end date

        // Create the formatted date range (optional)
        const formattedDate = `${formattedStartDate} to ${formattedEndDate}`;

        // Set A6.value to the formatted date range (if needed)
        A6.value = formattedDate;

        break;
      }

      default: {
        A6.value = "Invalid selection";
        break;
      }
    }
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
    // A9 - Total no. of vehicles (count)
    worksheet.mergeCells("A9:A10");
    const A9 = worksheet.getCell("A9");
    A9.value = "Total no. of vehicles\n(count)";
    A9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    A9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B9 - Total distance travelled (miles)
    worksheet.mergeCells("B9:B10");
    const B9 = worksheet.getCell("B9");
    B9.value = "Total distance travelled\n(miles)";
    B9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    B9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    B9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A10 - 5
    const A10 = worksheet.getCell("A11");
    A10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalActiveVehicles}`;
    A10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    A10.alignment = { vertical: "middle", horizontal: "center" };
    A10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B10 - 4729.97
    const B10 = worksheet.getCell("B11");
    B10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalDistanceTravelled?.toFixed(
      2
    )}`;
    B10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    B10.alignment = { vertical: "middle", horizontal: "center" };
    B10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const D4 = worksheet.getCell("D4");
    D4.value = "Fleet score";
    D4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    worksheet.mergeCells("D6:D8");
    const D6 = worksheet.getCell("D6");
    D6.value = `${this.fleetSumamryTotalDataFleetLevel?.totalDriverBehaviour.toFixed(
      2
    )}`;
    D6.font = {
      name: "Tahoma",
      size: 36,
      bold: false,
    };
    D6.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.mergeCells("E4:G4");
    const E4 = worksheet.getCell("E4");
    E4.value = "Fleet average per mile";
    E4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    E4.alignment = { horizontal: "center", vertical: "middle" };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      left: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      right: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
    };
    // E6 and F6 merged, G6 styling
    worksheet.mergeCells("E6:F6");
    const E6 = worksheet.getCell("E6");
    E6.value = "Harsh Acceleration (HA)";
    E6.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E6.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    E6.alignment = { vertical: "middle", horizontal: "center" };
    E6.border = borderStyle;
    const G6 = worksheet.getCell("G6");
    G6.value = "HA";
    G6.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G6.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    G6.alignment = { vertical: "middle", horizontal: "center" };
    G6.border = borderStyle;
    // E7 and F7 merged, G7 styling
    worksheet.mergeCells("E7:F7");
    const E7 = worksheet.getCell("E7");
    E7.value = "Harsh Braking (HB)";
    E7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    E7.alignment = { vertical: "middle", horizontal: "center" };
    E7.border = borderStyle;
    const G7 = worksheet.getCell("G7");
    G7.value = "HB";
    G7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    G7.alignment = { vertical: "middle", horizontal: "center" };
    G7.border = borderStyle;
    // E8 and F8 merged, G8 styling
    worksheet.mergeCells("E8:F8");
    const E8 = worksheet.getCell("E8");
    E8.value = "Harsh Cornering (HC) ";
    E8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    E8.alignment = { vertical: "middle", horizontal: "center" };
    E8.border = borderStyle;
    const G8 = worksheet.getCell("G8");
    G8.value = "HC";
    G8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    G8.alignment = { vertical: "middle", horizontal: "center" };
    G8.border = borderStyle;
    // E9 and F9 merged, G9 styling
    worksheet.mergeCells("E9:F9");
    const E9 = worksheet.getCell("E9");
    E9.value = "Over Speeding (OS)";
    E9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFCBA8C" },
    };
    E9.alignment = { vertical: "middle", horizontal: "center" };
    E9.border = borderStyle;
    const G9 = worksheet.getCell("G9");
    G9.value = "OS";
    G9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFCBA8C" },
    };
    G9.alignment = { vertical: "middle", horizontal: "center" };
    G9.border = borderStyle;
    // E10 and F10 merged, G10 styling
    worksheet.mergeCells("E10:F10");
    const E10 = worksheet.getCell("E10");
    E10.value = "Night Driving (ND)";
    E10.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E10.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF808080" },
    };
    E10.alignment = { vertical: "middle", horizontal: "center" };
    E10.border = borderStyle;
    const G10 = worksheet.getCell("G10");
    G10.value = "ND";
    G10.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G10.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF808080" },
    };
    G10.alignment = { vertical: "middle", horizontal: "center" };
    G10.border = borderStyle;
    // Merge cells I4 and J4, set value, and font
    worksheet.mergeCells("I4:J4");
    const I4 = worksheet.getCell("I4");
    I4.value = "Safety Score Rating";
    I4.font = { name: "Tahoma", size: 11, bold: true };
    I4.alignment = { vertical: "middle", horizontal: "center" };
    // Merge cells I5 and J5, set value, background color, text color, and border
    worksheet.mergeCells("I5:J5");
    const I5 = worksheet.getCell("I5");
    I5.value = "Score Classification";
    I5.font = { name: "Tahoma", size: 11, color: { argb: "FFFFFFFF" } };
    I5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF25477B" },
    };
    I5.alignment = { vertical: "middle", horizontal: "center" };
    I5.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
    // Set data for I6-J10 cells
    const data = [
      { row: 6, label: "Very Good", range: "81-100", bgColor: "FF2CA87F" },
      { row: 7, label: "Good", range: "61-80", bgColor: "FF95D3BF" },
      { row: 8, label: "Moderate", range: "41-60", bgColor: "FFFA751F" },
      { row: 9, label: "Risky", range: "21-40", bgColor: "FFFF4D4D" },
      { row: 10, label: "Very Risky", range: "1-20", bgColor: "FFFF0000" },
    ];
    data.forEach(({ row, label, range, bgColor }) => {
      const ICell = worksheet.getCell(`I${row}`);
      const JCell = worksheet.getCell(`J${row}`);
      // Set values and styles for column I cells
      ICell.value = label;
      ICell.font = { name: "Tahoma", size: 11 };
      ICell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      ICell.alignment = { vertical: "middle", horizontal: "center" };
      ICell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      // Set values and styles for column J cells
      JCell.value = range;
      JCell.font = { name: "Tohama", size: 11 };
      JCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      JCell.alignment = { vertical: "middle", horizontal: "center" };
      JCell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    function getBehaviorScoreLabelAndColor(score: number) {
      if (score >= 81) {
        return { label: "Very Good", color: "FF2CA87F" }; // Green
      } else if (score >= 61) {
        return { label: "Good", color: "FF95D3BF" }; // Light Green
      } else if (score >= 41) {
        return { label: "Moderate", color: "FFFA751F" }; // Yellow
      } else if (score >= 21) {
        return { label: "Risky", color: "FFFF4D4D" }; // Light Red
      } else {
        return { label: "Very Risky", color: "FFFF0000" }; // Red
      }
    }
    // Data for A15 to I20
    const headers1 = [
      "VIN",
      "Vehicle Name",
      "Distance travelled (miles)",
      "Safety Score",
      "Score Classification",
      "HA",
      "HB",
      "HC",
      "OS",
      "ND",
    ];
    headers1.forEach((header, index) => {
      const cell = worksheet.getCell(15, index + 1); // Row 15, Columns A to I
      cell.value = header;
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    // Background colors for specific columns
    const columnColors = [
      { bgColor: "FF4680FF" },
      { bgColor: "FF79A3FF" },
      { bgColor: "FFFA751A" },
      { bgColor: "FFFCBA8C" },
      { bgColor: "FF808080" },
    ];
    this.fleetSumamryTotalData.forEach((item: any, rowIndex: number) => {
      const vinValue = (item.alias?.length === 17 && /^[A-Za-z0-9]+$/.test(item.alias))
        ? this.maskVinNumber(item.alias)  // Mask cxVin if alias is a 17-character VIN
        : item.alias;  // Otherwise, show cxVin directly
      const score = item.driverBehaviourScore;
      const { label, color } = getBehaviorScoreLabelAndColor(score);
      const row = worksheet.addRow([
        item.cxVin,
        vinValue,
        // this.maskVinNumber(item.cxVin),
        typeof item.tripDistance === "number"
          ? item.tripDistance.toFixed(2)
          : "N/A",
        item.driverBehaviourScore.toFixed(1),
        label,
        typeof item.harshAcc === "number" ? item.harshAcc.toFixed(2) : "N/A",
        typeof item.harshBrake === "number"
          ? item.harshBrake.toFixed(2)
          : "N/A",
        typeof item.harshCornering === "number"
          ? item.harshCornering.toFixed(2)
          : "N/A",
        typeof item.overspeedingDistance === "number"
          ? item.overspeedingDistance.toFixed(0)
          : "N/A",
        item.nightDistance,
      ]);
      row.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: color },
      };
      // Apply background colors starting from row 16 to all rows in columns E to I
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber >= 16) {
          // Apply colors only from row 16 onward
          for (let colIndex = 5; colIndex <= 9; colIndex++) {
            // Columns E to I (indices 5 to 9)
            const cell = row.getCell(colIndex);
            const colorIndex = colIndex - 5; // Get color index from array
            if (columnColors[colorIndex]) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: columnColors[colorIndex].bgColor },
              };
            }
          }
        }
      });
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    });
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
      alignment: { vertical: "middle", horizontal: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    };
    // Styles for the headers (E15 to I15)
    const headerStyleRight = [
      { bgColor: "FF4680FF" },
      { bgColor: "FF79A3FF" },
      { bgColor: "FFFA751A" },
      { bgColor: "FFFCBA8C" },
      { bgColor: "FF808080" },
    ].map((style) => ({
      font: {
        name: "Tahoma",
        size: 11,
        bold: true,
        color: { argb: "FF000000" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: style.bgColor },
      },
      alignment: { vertical: "middle", horizontal: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    }));
    // colunm joint for Count per mile E 14 TO G 14
    worksheet.mergeCells("E14:G14");
    const E14 = worksheet.getCell("E14");
    E14.value = "Count per 100 miles";
    E14.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "FF000000" },
      bold: true,
    };
    E14.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    // For distance travelled column joint H14 TO I 14
    worksheet.mergeCells("H14:I14");
    const H14 = worksheet.getCell("H14");
    H14.value = "% of distance travelled in miles";
    H14.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "FF000000" },
      bold: true,
    };
    H14.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    // Apply styles for headers
    const headers = ["A15", "B15", "C15", "D15"];
    headers.forEach((cell) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });
    ["E15", "F15", "G15", "H15", "I15"].forEach((cell, index) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleRight[index]);
    });
    // this.driverSafetyReportAPI()
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    document.body.appendChild(iframe);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Fleet_Summary_Report.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);

  }
  async fleetSafetyReportDownload() {
    const workbook = new ExcelJS.Workbook();
    const descriptionSheet = workbook.addWorksheet("Description", {
      views: [{ showGridLines: false }],
    });
    for (let col = 1; col <= 26; col++) {
      const cell = descriptionSheet.getCell(1, col);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF25477B" },
      };
    }
    for (let col = 27; col <= 16384; col++) {
      descriptionSheet.getColumn(col).hidden = true;
    }

    const titleCells = descriptionSheet.getCell("A1");
    titleCells.value = "Fleet Safety";
    titleCells.alignment.horizontal = "left";

    const azugaCell_desc = descriptionSheet.getCell("A2");
    azugaCell_desc.value = this.consumer;
    azugaCell_desc.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
    };
    azugaCell_desc.alignment = { vertical: "middle" };

    const FleetIdCells = descriptionSheet.getCell("A3");
    if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
      FleetIdCells.value = `FleetId: ${this.fleetIdData}`;
    } else {
      // If no specific fleet ID is selected, print all fleet IDs
      FleetIdCells.value = `FleetIds: ${this.fleetIds}`;
    }
    FleetIdCells.font = {
      name: "Tahoma",
      size: 10,
      color: { argb: "FF25477B" },
    };
    FleetIdCells.alignment = { vertical: "middle" };
    const dateCells = descriptionSheet.getCell("D1");
    dateCells.value = this.formatDate(new Date());

    // Alerts
    const reportDescriptions = descriptionSheet.getCell("C5");
    reportDescriptions.value = "Report Description";
    reportDescriptions.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptions.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FA751A" },
      bold: true,
    };
    reportDescriptions.alignment = { vertical: "middle", horizontal: "left" };
    reportDescriptions.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getColumn(3).width = 100;
    const reportDescriptionsValues = descriptionSheet.getCell("C6");
    reportDescriptionsValues.value =
      "The Fleet Summary report can be downloaded from CerebrumX Workspace dashboard, and provides the status of each vehicle enrolled by the fleet manager to a fleet ID. The status for a vehicle can be PENDING, ACTIVE, FAILED, or UNENROLLED, as described below:";
    reportDescriptionsValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptionsValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    reportDescriptionsValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    reportDescriptionsValues.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getRow(6).height = 60;
    // Pending
    const timePeriods = descriptionSheet.getCell("C10");
    timePeriods.value = "Harsh Acceleration (HA)";
    timePeriods.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "3366FF" },
    };
    timePeriods.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    timePeriods.alignment = { vertical: "middle", horizontal: "left" };
    timePeriods.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const timePeriodValues = descriptionSheet.getCell("C11");
    timePeriodValues.value =
      "Harsh acceleration occurs when a driver speeds up quickly (above 2.74 m/s2) from a stop or standstill, often using more power than necessary. Harsh acceleration can be a sign of aggressive driving and can lead to increased fuel consumption as well as wear on the vehicle. Measured in count per 100 miles.";
    timePeriodValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "a8bdea" },
    };
    timePeriodValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    timePeriodValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    timePeriodValues.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(11).height = 60;
    // Failed
    const failedDetails = descriptionSheet.getCell("C12");
    failedDetails.value = "Harsh Braking (HB)";
    failedDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ff7d7d" },
    };
    failedDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    failedDetails.alignment = { vertical: "middle", horizontal: "left" };
    failedDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const failedDetailsParagraph = descriptionSheet.getCell("C13");
    failedDetailsParagraph.value =
      "Harsh braking refers to sudden or forceful braking (acceleration below -3.04 m/s2), leading the vehicle to a stop or standstill. Harsh braking can be a sign of distracted driving and may result in undue maintenance issues or even collisions. Measured in count per 100 miles.";
    failedDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "f3b6b6" },
    };
    failedDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    failedDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    failedDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(13).height = 60;
    // Active
    const activeDetails = descriptionSheet.getCell("C14");
    activeDetails.value = "Harsh Cornering (HC)";
    activeDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2ca67e" },
    };
    activeDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    activeDetails.alignment = { vertical: "middle", horizontal: "left" };
    activeDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const activeDetailsParagraph = descriptionSheet.getCell("C15");
    activeDetailsParagraph.value =
      "Harsh cornering is a result of quick or sharp turns, or going into a bend too fast (lateral acceleration greater than 3.92 m/s2 or less than -3.92 m/s2). Harsh cornering can cause loss of stability and control of the vehicle, while increasing the risk of excessive wear and tear. Measured in count per 100 miles.";
    activeDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95D3BF" },
    };
    activeDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    activeDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    activeDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(15).height = 60;
    // Un Enrolled
    // Active
    const unenrolledDetails = descriptionSheet.getCell("C16");
    unenrolledDetails.value = "Over Speeding (OS)";
    unenrolledDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "fad691" },
    };
    unenrolledDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    unenrolledDetails.alignment = { vertical: "middle", horizontal: "left" };
    unenrolledDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const overSpeedingParagraph = descriptionSheet.getCell("C17");
    overSpeedingParagraph.value =
      "Over speeding refers to the proportion of distance travelled above the authorized speed limit (above 75 mph) as compared to the total distance travelled. Over speeding may hamper the driver’s ability to react to hazards, leading to increased risks of accidents and legal penalties. Measured in percentage (%) of distance travelled (miles).";
    overSpeedingParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "f3dfb8" },
    };
    overSpeedingParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    overSpeedingParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    overSpeedingParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;

    const overSpeedingDetails = descriptionSheet.getCell("C18");
    overSpeedingDetails.value = "Night Driving (ND)";
    overSpeedingDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "808080" },
    };
    overSpeedingDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    overSpeedingDetails.alignment = { vertical: "middle", horizontal: "left" };
    overSpeedingDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const unenrolledDetailsParagraph = descriptionSheet.getCell("C19");
    unenrolledDetailsParagraph.value =
      "Night driving highlights the proportion of distance travelled between nighttime hours (20:00-06:00 UTC) as compared to the total distance travelled. Ideally, night driving should be kept at a minimum as it could be more hazardous due to reduced visibility and increased fatigue. Measured in percentage (%) of distance travelled (miles).";
    unenrolledDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "BFBFBF" },
    };
    unenrolledDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    unenrolledDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    unenrolledDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;
    const safetyScoreHeading = descriptionSheet.getCell("C20");
    safetyScoreHeading.value = "Safety Score";
    safetyScoreHeading.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "29BB15" },
    };
    safetyScoreHeading.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    safetyScoreHeading.alignment = { vertical: "middle", horizontal: "left" };
    safetyScoreHeading.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const safetyScoreParagraph = descriptionSheet.getCell("C21");
    safetyScoreParagraph.value =
      "Driver score is an AI-generated indicator of how safely the driver drives, on a scale of 0 to 100 (100 being the safest). It is a consolidated result giving a holistic safety assessment for the driver, calculated across key driver behavior metrics like: Harsh Acceleration, Harsh Braking, Harsh Cornering, Over Speeding and Night Driving Percentage, using machine learning algorithms over a period of time.";
    safetyScoreParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "72D000" },
    };
    safetyScoreParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    safetyScoreParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    safetyScoreParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;

    const worksheet = workbook.addWorksheet("Summary_snapshot", {
      views: [{ showGridLines: false }],
    });
    worksheet.getColumn(1).width = 170 / 7.5;
    worksheet.getColumn(2).width = 190 / 7.5;
    worksheet.getColumn(4).width = 160 / 7.5;
    for (let col = 1; col <= 26; col++) {
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
    for (let col = 27; col <= 16384; col++) {
      worksheet.getColumn(col).hidden = true;
    }
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Fleet Safety Report";
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
    // For Fleet Id
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
    const dateCell = worksheet.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }
    worksheet.getColumn(3).width = 80 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet.getColumn(col).width = 120 / 7.5;
    }
    // A5 - Time Period
    const A5 = worksheet.getCell("A5");
    A5.value = "Time Period";
    A5.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A5.alignment = { vertical: "middle", horizontal: "center" };
    A5.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A6 - Apr'24 - Aug'24
    const A6 = worksheet.getCell("A6");
    const currentDate = new Date();
    let formattedDate = "";
    // selected period time period
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        // Format today's date for 'TILL_NOW'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `Till ${formattedDate}`;
        break;
      }

      case "TODAY": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "YESTERDAY": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        // Define the custom week ranges
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }

        // Format the first and last date of the week
        formattedDate = `${formatDate(
          firstDayOfWeek,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_MONTH": {
        // Format the first day of the current month and current date for 'CURRENT_MONTH'
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        formattedDate = `${formatDate(
          firstDayOfMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        // Calculate the first and last day of the previous month
        const firstDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        formattedDate = `${formatDate(
          firstDayOfPreviousMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }
      case "CUSTOM_RANGE": {
        const formattedStartDate = formatDate(
          this.fromDate,
          "MM-dd-yyyy",
          "en-US"
        );
        const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");

        // Assign formatted dates to component properties
        this.startDate = formattedStartDate; // Use the formatted start date
        this.endDate = formattedEndDate; // Use the formatted end date

        // Create the formatted date range (optional)
        const formattedDate = `${formattedStartDate} to ${formattedEndDate}`;

        // Set A6.value to the formatted date range (if needed)
        A6.value = formattedDate;

        break;
      }

      default: {
        A6.value = "Invalid selection";
        break;
      }
    }
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
    // A9 - Total no. of vehicles (count)
    worksheet.mergeCells("A9:A10");
    const A9 = worksheet.getCell("A9");
    A9.value = "Total no. of vehicles\n(count)";
    A9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    A9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B9 - Total distance travelled (miles)
    worksheet.mergeCells("B9:B10");
    const B9 = worksheet.getCell("B9");
    B9.value = "Total distance travelled\n(miles)";
    B9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    B9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    B9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A10 - 5
    const A10 = worksheet.getCell("A11");
    A10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalActiveVehicles}`;
    A10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    A10.alignment = { vertical: "middle", horizontal: "center" };
    A10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // B10 - 4729.97
    const B10 = worksheet.getCell("B11");
    B10.value = `${this.fleetSumamryTotalDataFleetLevel?.totalDistanceTravelled?.toFixed(
      2
    )}`;
    B10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    B10.alignment = { vertical: "middle", horizontal: "center" };
    B10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const D4 = worksheet.getCell("D4");
    D4.value = "Fleet score";
    D4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    worksheet.mergeCells("D6:D8");
    const D6 = worksheet.getCell("D6");
    D6.value = `${this.fleetSumamryTotalDataFleetLevel?.totalDriverBehaviour.toFixed(
      2
    )}`;
    D6.font = {
      name: "Tahoma",
      size: 36,
      bold: false,
    };
    D6.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.mergeCells("E4:G4");
    const E4 = worksheet.getCell("E4");
    E4.value = "Fleet average per mile";
    E4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    E4.alignment = { horizontal: "center", vertical: "middle" };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      left: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      right: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
    };
    // E6 and F6 merged, G6 styling
    worksheet.mergeCells("E6:F6");
    const E6 = worksheet.getCell("E6");
    E6.value = "Harsh Acceleration (HA)";
    E6.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E6.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    E6.alignment = { vertical: "middle", horizontal: "center" };
    E6.border = borderStyle;
    const G6 = worksheet.getCell("G6");
    G6.value = "HA";
    G6.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G6.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    G6.alignment = { vertical: "middle", horizontal: "center" };
    G6.border = borderStyle;
    // E7 and F7 merged, G7 styling
    worksheet.mergeCells("E7:F7");
    const E7 = worksheet.getCell("E7");
    E7.value = "Harsh Braking (HB)";
    E7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    E7.alignment = { vertical: "middle", horizontal: "center" };
    E7.border = borderStyle;
    const G7 = worksheet.getCell("G7");
    G7.value = "HB";
    G7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    G7.alignment = { vertical: "middle", horizontal: "center" };
    G7.border = borderStyle;
    // E8 and F8 merged, G8 styling
    worksheet.mergeCells("E8:F8");
    const E8 = worksheet.getCell("E8");
    E8.value = "Harsh Cornering (HC) ";
    E8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    E8.alignment = { vertical: "middle", horizontal: "center" };
    E8.border = borderStyle;
    const G8 = worksheet.getCell("G8");
    G8.value = "HC";
    G8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    G8.alignment = { vertical: "middle", horizontal: "center" };
    G8.border = borderStyle;
    // E9 and F9 merged, G9 styling
    worksheet.mergeCells("E9:F9");
    const E9 = worksheet.getCell("E9");
    E9.value = "Over Speeding (OS)";
    E9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFCBA8C" },
    };
    E9.alignment = { vertical: "middle", horizontal: "center" };
    E9.border = borderStyle;
    const G9 = worksheet.getCell("G9");
    G9.value = "OS";
    G9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFCBA8C" },
    };
    G9.alignment = { vertical: "middle", horizontal: "center" };
    G9.border = borderStyle;
    // E10 and F10 merged, G10 styling
    worksheet.mergeCells("E10:F10");
    const E10 = worksheet.getCell("E10");
    E10.value = "Night Driving (ND)";
    E10.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    E10.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF808080" },
    };
    E10.alignment = { vertical: "middle", horizontal: "center" };
    E10.border = borderStyle;
    const G10 = worksheet.getCell("G10");
    G10.value = "ND";
    G10.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    G10.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF808080" },
    };
    G10.alignment = { vertical: "middle", horizontal: "center" };
    G10.border = borderStyle;
    // Merge cells I4 and J4, set value, and font
    worksheet.mergeCells("I4:J4");
    const I4 = worksheet.getCell("I4");
    I4.value = "Safety Score Rating";
    I4.font = { name: "Tahoma", size: 11, bold: true };
    I4.alignment = { vertical: "middle", horizontal: "center" };
    // Merge cells I5 and J5, set value, background color, text color, and border
    worksheet.mergeCells("I5:J5");
    const I5 = worksheet.getCell("I5");
    I5.value = "Score Classification";
    I5.font = { name: "Tahoma", size: 11, color: { argb: "FFFFFFFF" } };
    I5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF25477B" },
    };
    I5.alignment = { vertical: "middle", horizontal: "center" };
    I5.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
    // Set data for I6-J10 cells
    const data = [
      { row: 6, label: "Very Good", range: "81-100", bgColor: "FF2CA87F" },
      { row: 7, label: "Good", range: "61-80", bgColor: "FF95D3BF" },
      { row: 8, label: "Moderate", range: "41-60", bgColor: "FFFA751F" },
      { row: 9, label: "Risky", range: "21-40", bgColor: "FFFF4D4D" },
      { row: 10, label: "Very Risky", range: "1-20", bgColor: "FFFF0000" },
    ];
    data.forEach(({ row, label, range, bgColor }) => {
      const ICell = worksheet.getCell(`I${row}`);
      const JCell = worksheet.getCell(`J${row}`);
      // Set values and styles for column I cells
      ICell.value = label;
      ICell.font = { name: "Tahoma", size: 11 };
      ICell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      ICell.alignment = { vertical: "middle", horizontal: "center" };
      ICell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      // Set values and styles for column J cells
      JCell.value = range;
      JCell.font = { name: "Tohama", size: 11 };
      JCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      JCell.alignment = { vertical: "middle", horizontal: "center" };
      JCell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    function getBehaviorScoreLabelAndColor(score: number) {
      if (score >= 81) {
        return { label: "Very Good", color: "FF2CA87F" }; // Green
      } else if (score >= 61) {
        return { label: "Good", color: "FF95D3BF" }; // Light Green
      } else if (score >= 41) {
        return { label: "Moderate", color: "FFFA751F" }; // Yellow
      } else if (score >= 21) {
        return { label: "Risky", color: "FFFF4D4D" }; // Light Red
      } else {
        return { label: "Very Risky", color: "FFFF0000" }; // Red
      }
    }
    // Data for A15 to I20
    const headers1 = [
      "Fleet Id",
      "Fleet Name",
      "Group Name",
      "VIN",
      "Vehicle Name",
      "Distance travelled (miles)",
      "Safety Score",
      "Score Classification",
      "HA",
      "HB",
      "HC",
      "OS",
      "ND",
    ];
    headers1.forEach((header, index) => {
      const cell = worksheet.getCell(15, index + 1); // Row 15, Columns A to I
      cell.value = header;
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    // Background colors for specific columns
    const columnColors = [
      { bgColor: "FF4680FF" },
      { bgColor: "FF79A3FF" },
      { bgColor: "FFFA751A" },
      { bgColor: "FFFCBA8C" },
      { bgColor: "FF808080" },
    ];
    this.fleetSumamryTotalData.forEach((item: any, rowIndex: number) => {
      const vinValue = (item.alias?.length === 17 && /^[A-Za-z0-9]+$/.test(item.alias))
        ? this.maskVinNumber(item.alias)  // Mask cxVin if alias is a 17-character VIN
        : item.alias;  // Otherwise, show cxVin directly
      const score = item.driverBehaviourScore;
      const { label, color } = getBehaviorScoreLabelAndColor(score);
      const row = worksheet.addRow([
        item.fleetId,
        item.fleetName || '--',
        item.groupName || '--',
        item.cxVin,
        vinValue,
        // this.maskVinNumber(item.cxVin),
        typeof item.tripDistance === "number"
          ? item.tripDistance.toFixed(2)
          : "N/A",
        item.driverBehaviourScore.toFixed(1),
        label,
        typeof item.harshAcc === "number" ? item.harshAcc.toFixed(2) : "N/A",
        typeof item.harshBrake === "number"
          ? item.harshBrake.toFixed(2)
          : "N/A",
        typeof item.harshCornering === "number"
          ? item.harshCornering.toFixed(2)
          : "N/A",
        typeof item.overspeedingDistance === "number"
          ? item.overspeedingDistance.toFixed(0)
          : "N/A",
        item.nightDistance,
      ]);
      row.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: color },
      };
      // Apply background colors starting from row 16 to all rows in columns E to I
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber >= 16) {
          // Apply colors only from row 16 onward
          for (let colIndex = 5; colIndex <= 9; colIndex++) {
            // Columns E to I (indices 5 to 9)
            const cell = row.getCell(colIndex);
            const colorIndex = colIndex - 5; // Get color index from array
            if (columnColors[colorIndex]) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: columnColors[colorIndex].bgColor },
              };
            }
          }
        }
      });
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    });
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
      alignment: { vertical: "middle", horizontal: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    };
    // Styles for the headers (E15 to I15)
    const headerStyleRight = [
      { bgColor: "FF4680FF" },
      { bgColor: "FF79A3FF" },
      { bgColor: "FFFA751A" },
      { bgColor: "FFFCBA8C" },
      { bgColor: "FF808080" },
    ].map((style) => ({
      font: {
        name: "Tahoma",
        size: 11,
        bold: true,
        color: { argb: "FF000000" },
      },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: style.bgColor },
      },
      alignment: { vertical: "middle", horizontal: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    }));
    // colunm joint for Count per mile E 14 TO G 14
    worksheet.mergeCells("E14:G14");
    const E14 = worksheet.getCell("E14");
    E14.value = "Count per 100 miles";
    E14.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "FF000000" },
      bold: true,
    };
    E14.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    // For distance travelled column joint H14 TO I 14
    worksheet.mergeCells("H14:I14");
    const H14 = worksheet.getCell("H14");
    H14.value = "% of distance travelled in miles";
    H14.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "FF000000" },
      bold: true,
    };
    H14.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    // Apply styles for headers
    const headers = ["A15", "B15", "C15", "D15"];
    headers.forEach((cell) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });
    ["E15", "F15", "G15", "H15", "I15"].forEach((cell, index) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleRight[index]);
    });
    // this.driverSafetyReportAPI()
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
 if (this.user != "admin") {
      FileSaver.saveAs(
        blob,
        `Fleet_Safety_Report_${this.customConsumer}_${formattedDate}.xlsx`
      );
    }
  }
  downloadIdlingReportSection() {
    if (
      !this.fleetSumamryTotalData ||
      this.fleetSumamryTotalData.length === 0
    ) {
      this.driverSafetyReportAPI("idling");
    } else {
      this.IdlingReportDownload();
    }
  }
  async IdlingReportDownload() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Summary_snapshot", {
      views: [{ showGridLines: false }],
    });
    worksheet.getColumn(1).width = 170 / 7.5;
    worksheet.getColumn(2).width = 190 / 7.5;
    worksheet.getColumn(4).width = 160 / 7.5;
    for (let col = 1; col <= 26; col++) {
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
    for (let col = 27; col <= 16384; col++) {
      worksheet.getColumn(col).hidden = true;
    }
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Idling Report";
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
    // For fleet Id
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
    const dateCell = worksheet.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    worksheet.getColumn(3).width = 80 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet.getColumn(col).width = 120 / 7.5;
    }
    // A5 - Time Period
    const A5 = worksheet.getCell("A5");
    A5.value = "Time Period";
    A5.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A5.alignment = { vertical: "middle", horizontal: "center" };
    A5.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A6 - For date
    const A6 = worksheet.getCell("A6");
    const currentDate = new Date();
    let formattedDate = "";
    // selected period time period
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        // Format today's date for 'TILL_NOW'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `Till ${formattedDate}`;
        break;
      }

      case "TODAY": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "YESTERDAY": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        // Define the custom week ranges
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }

        // Format the first and last date of the week
        formattedDate = `${formatDate(
          firstDayOfWeek,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_MONTH": {
        // Format the first day of the current month and current date for 'CURRENT_MONTH'
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        formattedDate = `${formatDate(
          firstDayOfMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        // Calculate the first and last day of the previous month
        const firstDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        formattedDate = `${formatDate(
          firstDayOfPreviousMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }
      case "CUSTOM_RANGE": {
        const formattedStartDate = formatDate(
          this.fromDate,
          "MM-dd-yyyy",
          "en-US"
        );
        const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");

        // Assign formatted dates to component properties
        this.startDate = formattedStartDate; // Use the formatted start date
        this.endDate = formattedEndDate; // Use the formatted end date

        // Create the formatted date range (optional)
        const formattedDate = `${formattedStartDate} to ${formattedEndDate}`;

        // Set A6.value to the formatted date range (if needed)
        A6.value = formattedDate;

        break;
      }

      default: {
        A6.value = "Invalid selection";
        break;
      }
    }
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
    // Data for A15 to I20
    const headers1 = [
      "Fleet Id",
      "Fleet Name",
      "Group Name",
      "VIN",
      "Vehicle Name",
      "Group Name",
      "Total Idling Duration (hrs:mm)",
      "Idling Percentage (%)",
    ];
    headers1.forEach((header, index) => {
      const cell = worksheet.getCell(8, index + 1); // Row 15, Columns A to I
      cell.value = header;
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      worksheet.getColumn(index + 1).width = 30;
    });
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
      alignment: { vertical: "middle", horizontal: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    };
    // Apply styles for headers
    const headers = ["A8", "B8", "C8"];
    headers.forEach((cell) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });
    if (
      Array.isArray(this.fleetSumamryTotalData) &&
      this.fleetSumamryTotalData.length > 0
    ) {
      this.fleetSumamryTotalData.forEach((item) => {
        const vinToDisplay = item.alias && item.alias.length === 17
          ? this.maskVinNumber(item.alias)
          : item.alias;

        const row = worksheet.addRow([
          item.fleetId,
          item.fleetName || '--',
          item.groupName || '--',
          item.cxVin,
          vinToDisplay,
          item.groupName || '--',
          this.secondsToHHMM(item.idlingDuration),
          item.idlingPercentage != null
            ? item.idlingPercentage.toFixed(1)
            : "N/A",
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
      console.error("fleetSumamryTotalData is either undefined or empty.");
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
 if (this.user != "admin") {
      FileSaver.saveAs(
        blob,
        `Idling_Report_${this.customConsumer}_${formattedDate}.xlsx`
      );
    }
  }

  // Vehicle milegae report download function
  downloadVehicleMileageReportSection() {
    if (
      !this.fleetSumamryTotalData ||
      this.fleetSumamryTotalData.length === 0
    ) {
      this.driverSafetyReportAPI("mileage");
    } else {
      this.vehicleMileageReportDownload();
    }
  }
  async vehicleMileageReportDownload() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Summary_snapshot", {
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
    titleCell.value = "Vehicle Mileage Report";
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
    const dateCell = worksheet.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }
    worksheet.getColumn(3).width = 80 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet.getColumn(col).width = 120 / 7.5;
    }
    // A5 - Time Period
    const A5 = worksheet.getCell("A5");
    A5.value = "Time Period";
    A5.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A5.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A5.alignment = { vertical: "middle", horizontal: "center" };
    A5.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // A6 - Apr'24 - Aug'24
    const A6 = worksheet.getCell("A6");
    const currentDate = new Date();
    let formattedDate = "";
    // selected period time period
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        // Format today's date for 'TILL_NOW'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `Till ${formattedDate}`;
        break;
      }

      case "TODAY": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "YESTERDAY": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        // Define the custom week ranges
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }

        // Format the first and last date of the week
        formattedDate = `${formatDate(
          firstDayOfWeek,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_MONTH": {
        // Format the first day of the current month and current date for 'CURRENT_MONTH'
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        formattedDate = `${formatDate(
          firstDayOfMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        // Calculate the first and last day of the previous month
        const firstDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        formattedDate = `${formatDate(
          firstDayOfPreviousMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        A6.value = `${formattedDate}`;
        break;
      }
      case "CUSTOM_RANGE": {
        const formattedStartDate = formatDate(
          this.fromDate,
          "MM-dd-yyyy",
          "en-US"
        );
        const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");

        // Assign formatted dates to component properties
        this.startDate = formattedStartDate; // Use the formatted start date
        this.endDate = formattedEndDate; // Use the formatted end date

        // Create the formatted date range (optional)
        const formattedDate = `${formattedStartDate} to ${formattedEndDate}`;

        // Set A6.value to the formatted date range (if needed)
        A6.value = formattedDate;

        break;
      }

      default: {
        A6.value = "Invalid selection";
        break;
      }
    }
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
    // A9 - Total no. of vehicles (count)
    worksheet.mergeCells("A9:A10");
    const A9 = worksheet.getCell("A9");
    A9.value = "Fleet Mileage\n(mpg)";
    A9.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    A9.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    A9.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const totalTripDistance = this.fleetSumamryTotalData?.reduce(
      (total, item) => {
        const tripDistance = Number(item.tripDistance) || 0; // Convert to number and handle non-numeric values
        return total + tripDistance;
      },
      0
    );
    const totalFuelConsumed = this.fleetSumamryTotalData?.reduce(
      (total, item) => {
        const fuelConsumed = Number(item.fuelConsumed) || 0; // Convert to number and handle non-numeric values
        return total + fuelConsumed;
      },
      0
    );
    // A10 - 5
    const A10 = worksheet.getCell("A11");
    A10.value = `${(totalTripDistance / totalFuelConsumed).toFixed(2)}`;
    A10.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    A10.alignment = { vertical: "middle", horizontal: "center" };
    A10.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    worksheet.mergeCells("E4:G4");
    // Data for A15 to I20
    const headers1 = [
      "Fleet Id",
      "Fleet Name",
      "Group Name",
      "VIN",
      "Vehicle Name",
      "Fuel Type",
      "Total Distance travelled (miles)",
      "Total Fuel Consumed (gal)",
      "Average Mileage (mpg)",
      "Total Fuel Cost ($)",
      "Average Fuel Cost Per Mile ($)",
    ];
    headers1.forEach((header, index) => {
      const cell = worksheet.getCell(15, index + 1); // Row 15, Columns A to I
      cell.value = header;
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    if (this.fleetSumamryTotalData && this.fleetSumamryTotalData.length) {
      this.fleetSumamryTotalData.forEach((item) => {
        const vinToDisplay = item.alias && item.alias.length === 17
          ? this.maskVinNumber(item.alias)
          : item.alias;
        const row = worksheet.addRow([
          item.fleetId,
          item.fleetName || '--',
          item.groupName,
          item.cxVin,
          vinToDisplay,
          item.fuelType,
          item.tripDistance?.toFixed(2) || "0.00", // Handle undefined values safely
          item.fuelConsumed != null ? item.fuelConsumed.toFixed(2) : "0.00",
          item.avgMileage?.toFixed(2) || "0.00",
          Number(item.averageCostPerMile * item.tripDistance).toFixed(2),
          Number(item.averageCostPerMile).toFixed(2),
        ]);
      });
    } else {
      console.error("fleetSumamryTotalData is undefined or empty");
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
      "A15",
      "B15",
      "C15",
      "D15",
      "E15",
      "F15",
      "G15",
      "H15",
      "I15",
      "J15",
      "K15",
      "L15",
      "M15",
      "N15",
      "O15",
      "P15",
      "Q15",
      "R15",
      "S15",
      "T15",
      "U15",
      "V15",
      "W15",
      "X15",
      "Y15",
      "Z15",
      "AA15",
      "AB15",
      "AC15",
      "AD15",
    ];
    headers.forEach((cell) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });
    headers.forEach((header) => {
      const columnLetter = header.match(/[A-Z]+/)[0]; // Extract the column letter
      const column = worksheet.getColumn(columnLetter);
      if (worksheet.getRow(15).getCell(columnLetter).address.includes("15")) {
        column.width = 25; // Set the width of each column to 20
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    FileSaver.saveAs(
      blob,
      `Vehicle_Mileage_Report_${this.consumer}_${formattedDate}.xlsx`
    );
  }
  // Fuel summary report download function
  async fuelSummaryDownloadReport() {
    try {
      if (!this.refuelDetailsData || this.refuelDetailsData.length === 0) {
        await this.refuelDetailData(); // Ensure this method fetches data and returns a Promise
      }
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Summary_snapshot", {
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
      titleCell.value = "Fuel Summary Report";
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
      const dateCell = worksheet.getCell("D1");
      dateCell.value = this.formatDate(new Date());
      for (let row = 9; row <= 12; row++) {
        const cell = worksheet.getCell(row, 4);
        cell.font = {
          name: "Tahoma",
          size: 12,
          color: { argb: "FF000000" },
          bold: true, // Make text bold
        };
      }
      worksheet.getColumn(3).width = 80 / 7.5;
      for (let col = 5; col <= 11; col++) {
        worksheet.getColumn(col).width = 120 / 7.5;
      }
      // A5 - Time Period
      const A5 = worksheet.getCell("A5");
      A5.value = "Time Period";
      A5.font = {
        name: "Tahoma",
        size: 11,
        bold: true,
      };
      A5.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F2F2F2" },
      };
      A5.alignment = { vertical: "middle", horizontal: "center" };
      A5.border = {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      };
      // A6 - Apr'24 - Aug'24
      const A6 = worksheet.getCell("A6");
      const today = new Date();
      const formattedDate = this.datePipe.transform(today, "MMMM d, y");
      A6.value = `Till ${formattedDate}`;
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
      // Data for A15 to I20
      const headers1 = [
        "VIN",
        "Vehicle Name",
        "Group Name",
        "Date/Time",
        "Refuel Location",
        "Amount (gal)",
        "Cost($)",
      ];
      headers1.forEach((header, index) => {
        const cell = worksheet.getCell(8, index + 1); // Row 15, Columns A to I
        cell.value = header;
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
      let currentRow = 9; // Start from row 9
      this.refuelDetailsData.forEach((item: any) => {
        const dateTimeUTC = moment.utc(item.dateTime);
        const formattedDate = dateTimeUTC.tz(this.selectedTimezone).format('MMM D, YYYY');
        const formattedTime = dateTimeUTC.tz(this.selectedTimezone).format('HH:mm');
        const timeOfRefueling = `${formattedDate} ${formattedTime}`;
        const vinToDisplay = item.alias.length === 17 ? this.maskVinNumber(item.alias) : item.alias;
        const row = worksheet.getRow(currentRow); // Get the row object for row 9, 10, etc.
        row.values = [
          item.vin,
          vinToDisplay,
          item.groupName || '--',
          `${timeOfRefueling}`,
          item.address,
          item.amtFuelRefuelled.toFixed(2),
          item.refuelCost === "" ||
            isNaN(Number(item.refuelCost)) ||
            Number(item.refuelCost) == 0
            ? "0.00"
            : Number(item.refuelCost).toFixed(2),
        ];

        // Set borders for each cell in the newly added row
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
          };
        });
        currentRow++;
      });
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
      const headers = ["A8", "B8", "C8", "D8", "E8"];
      headers.forEach((cell) => {
        const headerCell = worksheet.getCell(cell);
        Object.assign(headerCell, headerStyleLeft);
      });
      headers.forEach((header) => {
        const columnLetter = header.match(/[A-Z]+/)[0]; // Extract the column letter
        const column = worksheet.getColumn(columnLetter);
        // Set width only if the column is part of the table starting from row 15
        if (worksheet.getRow(8).getCell(columnLetter).address.includes("8")) {
          column.width = 40; // Set the width of each column to 20
        }
      });
      this.refuelDetailData();
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(
        blob,
        `Fuel_Summary_Report${this.consumer}_${formattedDate}.xlsx`
      );
    } catch (error) {
      console.error("Error generating image:", error);
    }
  }
  // Show timestamp in  mm-dd-yyyy hh:mm for fuel summary download report
  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // Month is zero-based
    const day = ("0" + date.getDate()).slice(-2);
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of the year
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  }
  //  No data found handler pop up
  noDataFounds(nodatafound) {
    this.modalService.open(nodatafound, { size: "sm", centered: true });
  }
  // custom report function start
  // VIN List for custom report for admin and customer
  selectVinList() {
 this.subscription$.add(
        this.dashboardservice
          .getVINlistReportSection(this.customConsumer, this.fleetIdData, this.groupIdData)
          .subscribe(
            (res: any) => {
              const vinAliasList = res.vinAliasList || [];

              // Safely map VINs and aliases, with fallback keys
              this.vinList = vinAliasList.map((item: any) => ({
                vin: item.VIN || item.vin || '',  // fallback for key mismatch
                name: item.Alias || item.alias || '',
                selected: false
              }));

              this.vinListData = null;

              // Optional: clear or set defaults if list is empty
              if (!this.vinList.length) {
                console.warn('VIN list is empty');
              }

              this.onSelectAllChange();  // Handle default selection state
            },
            (err) => {
              console.error('Error fetching VIN list:', err);
              // Optionally show toastr or other UI error
            }
          )
      );


  }

  onSelectAllChange() {
    this.vinList.forEach((vin) => (vin.selected = this.selectAll));
    this.individualSelection();
  }
  individualSelection() {
    this.selectedVins = this.vinList
      .filter((vin) => vin.selected)
      .map((vin) => vin.vin);
  }
  onIndividualSelectChange() {
    this.individualSelection();
  }
  isReportDownloadEnabled(): boolean {
    return !!this.fleetIdData && !!this.selectedPeriod;
  }
  // Download report based on selected attributes
  downloadReport() {
    // Flatten and filter selected items from grouped driverEventsForVIN
    const selecteddriverEventsForVIN = this.driverEventsForVIN
      .map(group => group.items) // returns array of arrays
      .reduce((acc, items) => acc.concat(items), []) // flatten
      .filter(item => item.selected)
      .map(item => `${item.value}`);

    const selecteddistanceTravelledForVIN = this.distanceTravelledForVIN
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    const selectedmileageForVin = this.mileageForVin
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    const selecteddriverScoreFilterForVin = this.driverScoreFilterForVin
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    const selectedvinDetails = this.vinDetails
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    this.selectedAttributes = [
      ...selecteddriverEventsForVIN,
      ...selecteddistanceTravelledForVIN,
      ...selectedmileageForVin,
      ...selecteddriverScoreFilterForVin,
      ...selectedvinDetails,
    ];

    const requestPayload = {
      consumer: this.customConsumer,
      fleetId: this.fleetIdData,
      cadence: this.selectedPeriod,
      attributeSet: this.selectedAttributes,
      vinSet: this.selectedVins,
      startDate: this.fromDate,
      endDate: this.toDate,
    };

    this.dashboardservice.generateReport(requestPayload).subscribe(
      (response) => {
        this.dataReport = response;
        this.fleetLevelData = this.dataReport?.fleetLevelStats;
        this.vinLevelDataforCustom = this.dataReport?.vinLevelStats;
        this.customReport();
      },
      (err) => {
        if (err?.status === 404) {
          // handle not found
        } else if (err?.error?.message) {
          // handle API error
        }
      }
    );
  }

  downloadCustomReport() {
    if(this.selectedVins?.length == 0) return this.toastr.warning('Please select VIN')
    this.downloadReport();
  }
  async customReport() {
    const workbook = new ExcelJS.Workbook();
    const descriptionSheet = workbook.addWorksheet("Description", {
      views: [{ showGridLines: false }],
    });
    for (let col = 1; col <= 26; col++) {
      const cell = descriptionSheet.getCell(1, col);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF25477B" },
      };
    }
    for (let col = 27; col <= 16384; col++) {
      descriptionSheet.getColumn(col).hidden = true;
    }

    const titleCells = descriptionSheet.getCell("A1");
    titleCells.value = "Custom Report Summary";
    titleCells.alignment.horizontal = "left";

    const azugaCell_desc = descriptionSheet.getCell("A2");
    azugaCell_desc.value = this.consumer;
    azugaCell_desc.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
    };
    azugaCell_desc.alignment = { vertical: "middle" };

    const FleetIdCells = descriptionSheet.getCell("A3");
    if (this.fleetIdData && this.fleetIdData !== this.fleetIds) {
      FleetIdCells.value = `FleetId: ${this.fleetIdData}`;
    } else {
      // If no specific fleet ID is selected, print all fleet IDs
      FleetIdCells.value = `FleetIds: ${this.fleetIds}`;
    }
    FleetIdCells.font = {
      name: "Tahoma",
      size: 10,
      color: { argb: "FF25477B" },
    };
    FleetIdCells.alignment = { vertical: "middle" };
    const dateCells = descriptionSheet.getCell("D1");
    dateCells.value = this.formatDate(new Date());

    // Alerts
    const reportDescriptions = descriptionSheet.getCell("C5");
    reportDescriptions.value = "Report Description";
    reportDescriptions.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptions.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FA751A" },
      bold: true,
    };
    reportDescriptions.alignment = { vertical: "middle", horizontal: "left" };
    reportDescriptions.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getColumn(3).width = 100;
    const reportDescriptionsValues = descriptionSheet.getCell("C6");
    reportDescriptionsValues.value =
      "Custom reports by CerebrumX are tailored to meet the specific needs of your fleet. Choose critical data parameters that matters to you, enabling quick assessments of performance and proactive decision-making";
    reportDescriptionsValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptionsValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    reportDescriptionsValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    reportDescriptionsValues.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getRow(6).height = 60;
    // Pending
    const timePeriods = descriptionSheet.getCell("C10");
    timePeriods.value = "Harsh Acceleration (HA)";
    timePeriods.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "7ea6fe" },
    };
    timePeriods.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    timePeriods.alignment = { vertical: "middle", horizontal: "left" };
    timePeriods.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const timePeriodValues = descriptionSheet.getCell("C11");
    timePeriodValues.value =
      "Harsh acceleration occurs when a driver speeds up quickly (above 2.74 m/s2) from a stop or standstill, often using more power than necessary. Harsh acceleration can be a sign of aggressive driving and can lead to increased fuel consumption as well as wear on the vehicle. Measured in count per 100 miles.";
    timePeriodValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "a7bef2" },
    };
    timePeriodValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    timePeriodValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    timePeriodValues.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(11).height = 60;
    // Failed
    const failedDetails = descriptionSheet.getCell("C12");
    failedDetails.value = "Harsh Braking (HB)";
    failedDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffd0af" },
    };
    failedDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    failedDetails.alignment = { vertical: "middle", horizontal: "left" };
    failedDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const failedDetailsParagraph = descriptionSheet.getCell("C13");
    failedDetailsParagraph.value =
      "Harsh braking refers to sudden or forceful braking (acceleration below -3.04 m/s2), leading the vehicle to a stop or standstill. Harsh braking can be a sign of distracted driving and may result in undue maintenance issues or even collisions. Measured in count per 100 miles.";
    failedDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "fbe5d6" },
    };
    failedDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    failedDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    failedDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(13).height = 60;
    // Active
    const activeDetails = descriptionSheet.getCell("C14");
    activeDetails.value = "Harsh Cornering (HC)";
    activeDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "b3cbff" },
    };
    activeDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    activeDetails.alignment = { vertical: "middle", horizontal: "left" };
    activeDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const activeDetailsParagraph = descriptionSheet.getCell("C15");
    activeDetailsParagraph.value =
      "Harsh cornering is a result of quick or sharp turns, or going into a bend too fast (lateral acceleration greater than 3.92 m/s2 or less than -3.92 m/s2). Harsh cornering can cause loss of stability and control of the vehicle, while increasing the risk of excessive wear and tear. Measured in count per 100 miles.";
    activeDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "c4d4f5" },
    };
    activeDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    activeDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    activeDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(15).height = 60;
    // Un Enrolled
    // Active
    const unenrolledDetails = descriptionSheet.getCell("C16");
    unenrolledDetails.value = "Over Speeding (OS)";
    unenrolledDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "bdbdbd" },
    };
    unenrolledDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    unenrolledDetails.alignment = { vertical: "middle", horizontal: "left" };
    unenrolledDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const overSpeedingParagraph = descriptionSheet.getCell("C17");
    overSpeedingParagraph.value =
      "Over speeding refers to the proportion of distance travelled above the authorized speed limit (above 75 mph) as compared to the total distance travelled. Over speeding may hamper the driver’s ability to react to hazards, leading to increased risks of accidents and legal penalties. Measured in percentage (%) of distance travelled (miles).";
    overSpeedingParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "e2e0e0" },
    };
    overSpeedingParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    overSpeedingParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    overSpeedingParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;

    const overSpeedingDetails = descriptionSheet.getCell("C18");
    overSpeedingDetails.value = "Night Driving (ND)";
    overSpeedingDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ff8f8f" },
    };
    overSpeedingDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    overSpeedingDetails.alignment = { vertical: "middle", horizontal: "left" };
    overSpeedingDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const unenrolledDetailsParagraph = descriptionSheet.getCell("C19");
    unenrolledDetailsParagraph.value =
      "Night driving highlights the proportion of distance travelled between nighttime hours (20:00-06:00 UTC) as compared to the total distance travelled. Ideally, night driving should be kept at a minimum as it could be more hazardous due to reduced visibility and increased fatigue. Measured in percentage (%) of distance travelled (miles).";
    unenrolledDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "f9bfbf" },
    };
    unenrolledDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    unenrolledDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    unenrolledDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;
    const safetyScoreHeading = descriptionSheet.getCell("C20");
    safetyScoreHeading.value = "Safety Score";
    safetyScoreHeading.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2ca87f" },
    };
    safetyScoreHeading.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    safetyScoreHeading.alignment = { vertical: "middle", horizontal: "left" };
    safetyScoreHeading.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const safetyScoreParagraph = descriptionSheet.getCell("C21");
    safetyScoreParagraph.value =
      "Driver score is an AI-generated indicator of how safely the driver drives, on a scale of 0 to 100 (100 being the safest). It is a consolidated result giving a holistic safety assessment for the driver, calculated across key driver behavior metrics like: Harsh Acceleration, Harsh Braking, Harsh Cornering, Over Speeding and Night Driving Percentage, using machine learning algorithms over a period of time.";
    safetyScoreParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95d3bf" },
    };
    safetyScoreParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    safetyScoreParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    safetyScoreParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;
    // Merge cells I4 and J4, set value, and font
    descriptionSheet.mergeCells("E3:F3");
    const E3 = descriptionSheet.getCell("E3");
    E3.value = "Safety Score Rating";
    E3.font = { name: "Tahoma", size: 11, bold: true };
    E3.alignment = { vertical: "middle", horizontal: "center" };
    // Set data for I6-J10 cells
    const data = [
      { row: 4, label: "Very Good", range: "81-100", bgColor: "FF2CA87F" },
      { row: 5, label: "Good", range: "61-80", bgColor: "FF95D3BF" },
      { row: 6, label: "Moderate", range: "41-60", bgColor: "FFFA751F" },
      { row: 7, label: "Risky", range: "21-40", bgColor: "FFFF4D4D" },
      { row: 8, label: "Very Risky", range: "1-20", bgColor: "FFFF0000" },
    ];
    data.forEach(({ row, label, range, bgColor }) => {
      const ECell = descriptionSheet.getCell(`E${row}`);
      const FCell = descriptionSheet.getCell(`F${row}`);
      // Set values and styles for column I cells
      ECell.value = label;
      ECell.font = { name: "Tahoma", size: 11 };
      ECell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      ECell.alignment = { vertical: "middle", horizontal: "center" };
      ECell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };

      // Set values and styles for column J cells
      FCell.value = range;
      FCell.font = { name: "Tohama", size: 11 };
      FCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      FCell.alignment = { vertical: "middle", horizontal: "center" };
      FCell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    const worksheet2 = workbook.addWorksheet("Summary_snapshot", {
      views: [{ showGridLines: false }],
    });
    worksheet2.state = "veryHidden";
    const columnWidth = 230 / 7.5;
    for (let i = 1; i <= 33; i++) {
      worksheet2.getColumn(i).width = columnWidth;
    }
    // For column font
    for (let col = 1; col <= 35; col++) {
      const cell = worksheet2.getCell(1, col);
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
    // For show blank sheet not column
    for (let col = 35; col <= 16384; col++) {
      worksheet2.getColumn(col).hidden = true;
    }
    // Title of the report
    const titleCell = worksheet2.getCell("A1");
    titleCell.value = "Custom Report";
    titleCell.alignment.horizontal = "left";
    titleCell.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "FFFFFFFF" },
      bold: true,
    };
    worksheet2.getRow(1).height = 20;
    // Consumer Name in Row 2
    const azugaCell = worksheet2.getCell("A2");
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
    // Fleet Id in Row 3
    const FleetIdCell = worksheet2.getCell("A3");
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
    // Date show in Row 1 Center
    const dateCell = worksheet2.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet2.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }
    worksheet2.getColumn(3).width = 220 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet2.getColumn(col).width = 220 / 7.5;
    }
    // A5 - Time Period
    const B3 = worksheet2.getCell("B3");
    B3.value = "Time Period";
    B3.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B3.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    B3.alignment = { vertical: "middle", horizontal: "center" };
    B3.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const B4 = worksheet2.getCell("B4");
    const currentDate = new Date();
    let formattedDate = "";
    // selected period time period
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        // Format today's date for 'TILL_NOW'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        B4.value = `Till ${formattedDate}`;
        break;
      }

      case "TODAY": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        B4.value = `${formattedDate}`;
        break;
      }

      case "YESTERDAY": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        B4.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        // Define the custom week ranges
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }

        // Format the first and last date of the week
        formattedDate = `${formatDate(
          firstDayOfWeek,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        B4.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_MONTH": {
        // Format the first day of the current month and current date for 'CURRENT_MONTH'
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        formattedDate = `${formatDate(
          firstDayOfMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        B4.value = `${formattedDate}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        // Calculate the first and last day of the previous month
        const firstDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        formattedDate = `${formatDate(
          firstDayOfPreviousMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        B4.value = `${formattedDate}`;
        break;
      }
      case "CUSTOM_RANGE": {
        const formattedStartDate = formatDate(
          this.fromDate,
          "MM-dd-yyyy",
          "en-US"
        );
        const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");

        // Assign formatted dates to component properties
        this.startDate = formattedStartDate; // Use the formatted start date
        this.endDate = formattedEndDate; // Use the formatted end date

        // Create the formatted date range (optional)
        const formattedDate = `${formattedStartDate} to ${formattedEndDate}`;

        // Set B4.value to the formatted date range (if needed)
        B4.value = formattedDate;

        break;
      }

      default: {
        B4.value = "Invalid selection";
        break;
      }
    }
    // Apply font formatting to cell B4 time period
    B4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" }, // Orange color as per your request
    };
    B4.alignment = { vertical: "middle", horizontal: "center" };
    B4.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // Number of Days
    // C3 - Time Period
    const C3 = worksheet2.getCell("C3");
    C3.value = "No. of Days";
    C3.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    C3.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    C3.alignment = { vertical: "middle", horizontal: "center" };
    C3.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const C4 = worksheet2.getCell("C4");
    let totalDays = 0;
    // Number of days count based on time period selection
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        B4.value = `Till ${formattedDate}`;
        break;
      }
      case "TODAY": {
        const totalDays = 1; // Total days for today is always 1
        C4.value = `${totalDays}`;
        break;
      }
      case "YESTERDAY": {
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        const totalDays = 1; // Total days for yesterday is always 1
        C4.value = `${totalDays}`;
        break;
      }
      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month
        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }
        totalDays =
          Math.ceil(
            (lastDayOfWeek.getTime() - firstDayOfWeek.getTime()) /
            (1000 * 60 * 60 * 24)
          ) + 1; // +1 to include the last day
        C4.value = `${totalDays}`;
        break;
      }
      case "CURRENT_MONTH": {
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const totalDays = firstDayOfMonth.getDate();
        C4.value = `${totalDays}`;
        break;
      }
      case "PREVIOUS_MONTH": {
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        C4.value = `${totalDays}`;
        break;
      }
      case "CUSTOM_RANGE": {
        // Calculate the total number of days between the two formatted dates
        const startDateObj = new Date(this.fromDate); // Convert to Date object
        const endDateObj = new Date(this.toDate); // Convert to Date object

        // Calculate the difference in time and convert to days
        const totalDaysBetween = Math.ceil(
          (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)
        );

        // Assign the total days between to a variable or value
        const totalDays = totalDaysBetween;

        C4.value = `${totalDays}`;
        break;
      }
      default: {
        C4.value = "Invalid selection";
        break;
      }
    }
    C4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    C4.alignment = { vertical: "middle", horizontal: "center" };
    C4.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // Define headers with corresponding value keys for fleet data
    const headers = [
      { title: "Total Distance", attribute: "tripDistance" },
      { title: "Total Duration", attribute: "totalDuration" },
      { title: "Total Fuel Consumed", attribute: "fuelConsumed" },
      { title: "Total Fuel Cost", attribute: "fuelConsumedCost" },
      { title: "Mileage", attribute: "avgMileage" },
      { title: "Total Idling Duration", attribute: "idlingDuration" },
    ];
    // Starting column index (A = 1, B = 2, ..., Z = 26)
    let startingColumn = 1;
    // header map with attributed
    const dataMappings = headers.map((header) => ({
      title: header.title,
      attribute: header.attribute,
      value: undefined,
    }));
    // Assign values based on the fleetLevelData
    dataMappings.forEach((data) => {
      switch (data.attribute) {
        case "tripDistance":
          data.value =
            !this.fleetLevelData?.tripDistance ||
              this.fleetLevelData.tripDistance === "NA" ||
              this.fleetLevelData.tripDistance === 0 ||
              this.fleetLevelData.tripDistance === ""
              ? "--"
              : Number(this.fleetLevelData.tripDistance).toFixed(2) + " miles";
          break;
        case "totalDuration":
          data.value =
            !this.fleetLevelData?.totalDuration ||
              this.fleetLevelData.totalDuration === "NA" ||
              this.fleetLevelData.totalDuration === 0 ||
              this.fleetLevelData.totalDuration === ""
              ? "--"
              : this.convertSecondsToHhMm(this.fleetLevelData.totalDuration) +
              " hh:mm";
          break;
        // case 'averageDistance':
        //   data.value = !this.fleetLevelData?.averageDistance || this.fleetLevelData.averageDistance === 'NA' || this.fleetLevelData.averageDistance === ''
        //     ? '--'
        //     : Number(this.fleetLevelData.averageDistance).toFixed(2) + ' miles';
        //   break;
        // case 'averageTime':
        //   data.value = !this.fleetLevelData?.averageTime || this.fleetLevelData.averageTime === 'NA' || this.fleetLevelData.averageTime === ''
        //     ? '--'
        //     : this.convertSecondsToHhMm(this.fleetLevelData.averageTime) + ' hh:mm';
        //   break;
        case "fuelConsumed":
          data.value =
            !this.fleetLevelData?.fuelConsumed ||
              this.fleetLevelData.fuelConsumed === "NA" ||
              this.fleetLevelData.fuelConsumed === ""
              ? "--"
              : Number(this.fleetLevelData.fuelConsumed).toFixed(2) + " gal";
          break;
        case "fuelConsumedCost":
          data.value =
            this.fleetLevelData?.fuelConsumedCost === 0
              ? "0.00 $"
              : !this.fleetLevelData?.fuelConsumedCost ||
                this.fleetLevelData.fuelConsumedCost === "NA" ||
                this.fleetLevelData.fuelConsumedCost === ""
                ? "--"
                : this.fleetLevelData.fuelConsumedCost.toFixed(2) + " $";
          break;
        case "avgMileage":
          data.value =
            !this.fleetLevelData?.mileageMPG ||
              this.fleetLevelData.mileageMPG === "NA" ||
              this.fleetLevelData.mileageMPG === ""
              ? "--"
              : Number(this.fleetLevelData.mileageMPG).toFixed(2) + " mpg";
          break;
        case "idlingDuration":
          data.value =
            !this.fleetLevelData?.idlingDuration ||
              this.fleetLevelData.idlingDuration === "NA" ||
              this.fleetLevelData.idlingDuration === ""
              ? "--"
              : this.convertSecondsToHhMm(this.fleetLevelData.idlingDuration) +
              " hh:mm";
          break;
        // case 'avgIdlingDurationPerVin':
        //   data.value = !this.fleetLevelData?.avgIdlingDurationPerVin || this.fleetLevelData.avgIdlingDurationPerVin === 'NA' || this.fleetLevelData.avgIdlingDurationPerVin === ''
        //     ? '--'
        //     : this.convertSecondsToHhMm(this.fleetLevelData.avgIdlingDurationPerVin) + ' hh:mm';
        //   break;
        default:
          data.value = "--";
          break;
      }
    });
    // Generate headers and data cells based on selected attributes for fleet
    dataMappings.forEach((data) => {
      if (this.selectedAttributes.includes(data.attribute)) {
        // Check if the attribute is selected
        const position = String.fromCharCode(64 + startingColumn); // Calculate the column letter
        const headerCellPosition = position + "11"; // Header position
        const dataCellPosition = position + "12"; // Data position

        // Set the header cell
        const headerCell = worksheet2.getCell(headerCellPosition);
        headerCell.value = data.title;
        headerCell.font = {
          name: "Tahoma",
          size: 11,
          bold: true,
        };
        headerCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F2F2F2" },
        };
        headerCell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        headerCell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };

        // Set the data cell
        const dataCell = worksheet2.getCell(dataCellPosition);
        dataCell.value = data.value;
        dataCell.font = {
          name: "Tahoma",
          size: 11,
          bold: true,
          color: { argb: "FFFA751A" },
        };
        dataCell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        dataCell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };

        startingColumn++; // Move to the next column for the next data cell
      }
    });
    worksheet2.getRow(11).height = 30;
    worksheet2.getRow(12).height = 30;
    const row13 = worksheet2.getRow(13);
    row13.values = [];
    row13.height = 15;
    // A6 For fleet score
    const A6 = worksheet2.getCell("A6");
    A6.value = "Fleet score";
    A6.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A6.alignment = { vertical: "middle", horizontal: "center" };
    worksheet2.mergeCells("A7:A9");
    const A7 = worksheet2.getCell("A7");
    A7.value = `${!this.fleetLevelData?.driverBehaviourScore ||
      this.fleetLevelData?.driverBehaviourScore === "NA" ||
      this.fleetLevelData?.driverBehaviourScore === 0 ||
      this.fleetLevelData?.driverBehaviourScore === ""
      ? "--"
      : Number(this.fleetLevelData?.driverBehaviourScore).toFixed(2)
      }`;
    A7.font = {
      name: "Tahoma",
      size: 36,
      bold: false,
    };
    A7.alignment = { vertical: "middle", horizontal: "center" };
    worksheet2.mergeCells("B6:C6");
    const B6 = worksheet2.getCell("B6");
    B6.value = "Avg. Count per 100 miles";
    B6.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B6.alignment = { horizontal: "center", vertical: "middle" };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      left: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      right: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
    };
    // Events count
    worksheet2.mergeCells("B7");
    const B7 = worksheet2.getCell("B7");
    B7.value = "Avg. Harsh Acceleration (HA)";
    B7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    B7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    B7.alignment = { vertical: "middle", horizontal: "center" };
    B7.border = borderStyle;
    const C7 = worksheet2.getCell("C7");
    C7.value = `${this.fleetLevelData?.harshAcc === 0
      ? "0"
      : !this.fleetLevelData?.harshAcc ||
        this.fleetLevelData?.harshAcc === "NA" ||
        this.fleetLevelData?.harshAcc === ""
        ? "--"
        : (this.fleetLevelData?.harshAcc).toFixed(2)
      }`;
    C7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    C7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    C7.alignment = { vertical: "middle", horizontal: "center" };
    C7.border = borderStyle;
    // E7 and F7 merged, G7 styling
    worksheet2.mergeCells("B8");
    const B8 = worksheet2.getCell("B8");
    B8.value = "Avg. Harsh Braking (HB)";
    B8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    B8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    B8.alignment = { vertical: "middle", horizontal: "center" };
    B8.border = borderStyle;
    const C8 = worksheet2.getCell("C8");
    C8.value = `${this.fleetLevelData?.harshBrake === 0
      ? "0"
      : !this.fleetLevelData?.harshBrake ||
        this.fleetLevelData?.harshBrake === "NA" ||
        this.fleetLevelData?.harshBrake === ""
        ? "--"
        : (this.fleetLevelData?.harshBrake).toFixed(2)
      }`;
    C8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    C8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    C8.alignment = { vertical: "middle", horizontal: "center" };
    C8.border = borderStyle;
    // E8 and F8 merged, G8 styling
    worksheet2.mergeCells("B9");
    const B9 = worksheet2.getCell("B9");
    B9.value = "Avg. Harsh Cornering (HC) ";
    B9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    B9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    B9.alignment = { vertical: "middle", horizontal: "center" };
    B9.border = borderStyle;
    const C9 = worksheet2.getCell("C9");
    C9.value = `${this.fleetLevelData?.harshCornering === 0
      ? "0"
      : !this.fleetLevelData?.harshCornering ||
        this.fleetLevelData?.harshCornering === "NA" ||
        this.fleetLevelData?.harshCornering === ""
        ? "--"
        : (this.fleetLevelData?.harshCornering).toFixed(2)
      }`;
    C9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    C9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    C9.alignment = { vertical: "middle", horizontal: "center" };
    C9.border = borderStyle;

    // Data for A15 to I20
    const worksheet3 = workbook.addWorksheet("Data", {
      views: [{ showGridLines: false }],
    });
    const columnWidths = 230 / 7.5;
    for (let i = 1; i <= 33; i++) {
      worksheet3.getColumn(i).width = columnWidths;
    }
    worksheet3.addRow([`Number of Selected Vehicles: ${this.vinLevelDataforCustom.length}`]);
    worksheet3.addRow([]);
    // For column font
    const headers1 = [
      { name: "VIN", value: "cxVin" },
      { name: "Group Name", value:"groupName"},
      { name: "Vehicle Name", value: "vinAlias" },
      { name: "Total Distance (miles)", value: "tripDistance" },
      { name: "Total Duration (hh:mm)", value: "totalDuration" },
      { name: "Maximum Distance in Single Trip (miles)", value: "maxDistance" },
      { name: "Maximum Duration of Single Trip (hh:mm)", value: "maxDuration" },
      { name: "Average Trip Distance (miles)", value: "averageDistance" },
      { name: "Average Trip Time (hh:mm)", value: "averageTime" },
      { name: "Average Speed (mph)", value: "avgVehicleSpeed" },
      { name: "Top Speed (mph)", value: "maxSpeed" },
      {name: "Odometer (mi)", value: 'odometer'},
      {
        name: "% Distance driven on Front Left low tire pressure",
        value: "flDistance",
      },
      {
        name: "% Distance driven on Front Right low tire pressure",
        value: "frDistance",
      },
      {
        name: "% Distance driven on Rear Left low tire pressure",
        value: "rlDistance",
      },
      {
        name: "% Distance driven on Rear Right low tire pressure",
        value: "rrDistance",
      },
      { name: "Safety Score", value: "driverBehaviourScore" },
      { name: "Score Classification", value: "scoreClassification" },
      { name: "HA (count per 100 miles)", value: "harshAcc" },
      { name: "HB (count per 100 miles)", value: "harshBrake" },
      { name: "HC (count per 100 miles)", value: "harshCornering" },
      { name: "OS (% distance travelled)", value: "overspeedingDistance" },
      { name: "ND (% distance travelled)", value: "nightDistance" },
      { name: "Seatbelt Violation (count)", value: "seatbeltAlertCountDriver" },
      { name: "Mileage (mpg)", value: "mileageMPG" },
      { name: "Total Fuel Consumed (gal)", value: "fuelConsumed" },
      { name: "Total Fuel Cost ($)", value: "fuelConsumedCost" },
      { name: "Total Fuel Cost Per Mile ($)", value: "averageCostPerMile" },
      { name: "Total Idling Duration (hh:mm)", value: "idlingDuration" },
      { name: "Idling Percentage (%)", value: "idlingPercentage" },
      { name: "Battery Voltage (v)", value: "batteryStatus" },
      { name: "Front Left Tire Pressure (psi)", value: "flTirepress" },
      { name: "Front Right Tire Pressure (psi)", value: "frTirepress" },
      { name: "Rear Left Tire Pressure (psi)", value: "rlTirepress" },
      { name: "Rear Right Tire Pressure (psi)", value: "rrTirepress" },
    ];
    const selectedHeaders = headers1.filter((header) =>
      this.selectedAttributes.includes(header.value)
    );
    // Define the header style first
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
      alignment: {
        vertical: "middle",
        horizontal: "center", // Ensure this is a valid string literal type
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    };
    const vinHeader = { name: "VIN", value: "cxVin" };
    const vinName = vinHeader.name;
    const vinIndex = selectedHeaders.findIndex(
      (header) => header.value === "cxVin"
    );
    if (vinIndex > -1) {
      selectedHeaders.splice(vinIndex, 1);
    }
    selectedHeaders.unshift(vinHeader);
    if (
      this.vinLevelDataforCustom &&
      Array.isArray(this.vinLevelDataforCustom) &&
      this.vinLevelDataforCustom.length > 0
    ) {
      const headerRow = [vinName, "Vehicle Name", "Fleet Name", "Group Name"];
      selectedHeaders.forEach((header) => {
        if (header.value !== "cxVin") {
          headerRow.push(header.name);
        }
      });
      const headerRowExcel = worksheet3.addRow(headerRow);
      headerRowExcel.eachCell((cell) => {
        const cellRef = cell.address;
        const headerCell = worksheet3.getCell(cellRef);
        Object.assign(headerCell.style, headerStyleLeft);
      });
      // Main table data VIN Wise
      this.vinLevelDataforCustom.forEach((item: any) => {
        const maskedVin = item.cxVin || "--";
        const vinAlias = item.alias|| "--";;
        const fleetIdName = item.fleetName || "--";
        const fleetName = item.groupName|| "--";
        const rowData = [maskedVin, vinAlias,fleetIdName,fleetName];
        selectedHeaders.forEach((header) => {
          if (header.value !== "cxVin") {
            let value = item[header.value];
            if (
              [
                "totalDuration",
                "maxDuration",
                "averageTime",
                "idlingDuration",
              ].includes(header.value)
            ) {
              const convertedValue = this.convertSecondsToHhMm(value) || "N/A";
              rowData.push(convertedValue);
            } else {
              const formattedValue =
                typeof value === "number" ? value.toFixed(2) : value || "N/A";
              rowData.push(formattedValue);
            }
          }
        });
        worksheet3.addRow(rowData);
      });
    } else {
    }
    const buffer = await workbook.xlsx.writeBuffer();
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        break;
      }

      case "TODAY": {
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        break;
      }

      case "YESTERDAY": {
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1);
          lastDayOfWeek = new Date(currentYear, currentMonth, 7);
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8);
          lastDayOfWeek = new Date(currentYear, currentMonth, 14);
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15);
          lastDayOfWeek = new Date(currentYear, currentMonth, 21);
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22);
          lastDayOfWeek = new Date(currentYear, currentMonth, 28);
        } else {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28);
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth);
        }

        formattedDate = `${formatDate(firstDayOfWeek, "MM-dd-yyyy", "en-US")} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        break;
      }

      case "CURRENT_MONTH": {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        formattedDate = `${formatDate(firstDayOfMonth, "MM-dd-yyyy", "en-US")} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        const firstDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        formattedDate = `${formatDate(firstDayOfPreviousMonth, "MM-dd-yyyy", "en-US")} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        break;
      }

      case "CUSTOM_RANGE": {
        if (this.fromDate && this.toDate) {
          const formattedStartDate = formatDate(this.fromDate, "MM-dd-yyyy", "en-US");
          const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");
          formattedDate = `${formattedStartDate} to ${formattedEndDate}`;
        } else {
          console.error("CUSTOM_RANGE requires both fromDate and toDate.");
        }
        break;
      }

      default: {
        formattedDate = "Invalid_Selection";
        console.error("Invalid Period Selected");
        break;
      }
    }
    const blob = new Blob([buffer], { type: "application/octet-stream" });
 if (this.user != "admin") {
      const fileName = `Custom_Report_${this.customConsumer}_${formattedDate}.xlsx`;
      FileSaver.saveAs(blob, fileName);
    }
  }
  // Download custom report time stamp format
  convertSecondsToHhMm(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${hours}:${formattedMinutes}`;
  }
  // Custom report function end
  vinListDataPops(VinListPopup: any) {
    this.modalService.open(VinListPopup, { size: "sm", centered: true });
  }

  ngOnDestroy() {
    if (this.subscription$) {
      this.subscription$.unsubscribe();
    }
    !this.searchTco ? sessionStorage.removeItem("tcoDetails") : true;
  }
  /// create filter popup and function
  createFilterPopup(createFilter: any) {
    if(this.selectedVins?.length == 0) return this.toastr.warning('Please select VIN')

    this.modalService.open(createFilter, { size: "sl", centered: true });
  }

  // calander generation
  toggleCalendars() {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      this.generateCalendar();
    }
  }

  isFutureDate(date: any): boolean {
    if (!date || date.day === null) return false;

    const today = new Date();
    const dateObj = new Date(date.year, date.month, date.day);
    return dateObj <= today;
  }

  generateCalendar() {
    this.dates = [];

    const today = new Date();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const offset = (firstDayOfWeek + 6) % 7; // Start from Monday

    // Add empty cells for alignment
    for (let i = 0; i < offset; i++) {
      this.dates.push({ day: null, active: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(this.currentYear, this.currentMonth, i);
      today.setHours(0, 0, 0, 0)
      const isPastOrToday = dateObj >= today;
      this.dates.push({
        day: i,
        month: this.currentMonth,
        year: this.currentYear,
        active: isPastOrToday,
      });
    }


  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }


  selectDate(date: any) {
    if (!date.active) return;  // Ensure the date is active (not disabled)

    const selectedDay = date.day.toString().padStart(2, '0');
    const selectedMonth = (this.currentMonth + 1).toString().padStart(2, '0');
    const selectedFullDate = `${this.currentYear}-${selectedMonth}-${selectedDay}`; // YYYY-MM-DD format

    this.selectedDate = selectedFullDate;  // Store internal date
    this.displayDate = this.formatDisplayDate(this.currentYear, this.currentMonth, date.day); // Store formatted date
    this.showCalendar = false;
  }

  formatDisplayDate(year: number, monthIndex: number, day: number): string {
    const date = new Date(year, monthIndex, day);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const weekdayOptions: Intl.DateTimeFormatOptions = { weekday: 'long' };
    this.selectedDayName = date.toLocaleDateString('en-US', weekdayOptions); //
    return date.toLocaleDateString('en-US', options);
  }

  getFirstThreeChars(dayName: string): string {
    return dayName ? dayName.substring(0, 3) : '';
  }

  isToday(date: any): boolean {
    // Convert this.today back to a Date object before comparison
    const todayDate = new Date(this.today);
    const selectedDate = new Date(this.currentYear, this.currentMonth, date.day);
    return selectedDate.toDateString() === todayDate.toDateString();
  }

  hoverDate(date: any) {
    this.hoverDate = date;
  }

  resetHover() {
    this.hoverDate = null;
  }

  padZero(num: number): string {
    return num < 10 ? '0' + num : '' + num;
  }

  generateTimeSlots() {
    const interval = 15; // minutes
    for (let hour = 0; hour <= 24; hour++) {
      for (let min = 0; min < 60; min += interval) {
        if (hour === 24 && min > 0) break; // Prevent values like 24:15, 24:30
        const hh = hour.toString().padStart(2, '0');
        const mm = min.toString().padStart(2, '0');
        this.timeSlots.push(`${hh}:${mm}`);
      }
    }
  }

  // Email validation add or remove multiple box
  addEmail(): void {
    const trimmedEmail = this.newEmail.trim();
    if (trimmedEmail && this.validateEmail(trimmedEmail)) {
      this.emails.push(trimmedEmail);
      this.newEmail = '';
      this.showEmailInput = false;
    } else {
      alert('Please enter a valid email address.');
    }
  }
  removeEmail(index: number): void {
    this.emails.splice(index, 1);
  }
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showEmail = false;

  toggleEmail(id) {
    if (id == this.reportId) {
      this.showEmail = !this.showEmail;
    } else {
      this.showEmail = true;
      this.reportId = id
    }


  }


  getFiltersEvents() {
    const selecteddriverEventsForVIN = this.driverEventsForVIN
      .map(group => group.items) // returns array of arrays
      .reduce((acc, items) => acc.concat(items), []) // flatten
      .filter(item => item.selected)
      .map(item => `${item.value}`);

    const selecteddistanceTravelledForVIN = this.distanceTravelledForVIN
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    const selectedmileageForVin = this.mileageForVin
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    const selecteddriverScoreFilterForVin = this.driverScoreFilterForVin
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    const selectedvinDetails = this.vinDetails
      .filter(dist => dist.selected)
      .map(dist => `${dist.value}`);

    this.selectedAttributes = [
      ...selecteddriverEventsForVIN,
      ...selecteddistanceTravelledForVIN,
      ...selectedmileageForVin,
      ...selecteddriverScoreFilterForVin,
      ...selectedvinDetails,
    ];

    return this.selectedAttributes
  }

  // Create Filter Submit
  submitScheduleReport() {
    // Ensure selected VINs are updated
    this.individualSelection();

    let reqBody = {
      fleetId: this.fleetIdData,
      scheduleTime: this.selectedTime,
      scheduleDate: this.displayDate ? this.dateConvert(this.displayDate) : '',
      vinList: this.selectedVins,
      groupId: this.groupIdData,
      reportName: this.reportName,
      occurrenceUnit: this.timeIntervalUnit,
      notification: this.getFiltersEvents(),
      emailIds: this.emails
    };
    this.dashboardservice.addFilteredReport(reqBody).subscribe(
      (res: any) => {
        // Reset form fields
        this.emails = [];
        this.selectedTime = '';
        this.timeIntervalUnit = '';
        this.reportName = null;
        this.showEmailInput = false;
        this.getReport();
      },
      (err) => {
        this.toastr.error(err?.error?.apierror?.message);
      }
    );
  }


  //edit delete
  menuOpen = false;

  menuOpenId: string | null = null;
  toggleMenu(item: any): void {
    this.menuOpenId = this.menuOpenId === item.id ? null : item.id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.popup-menu') && !target.closest('.editDelete-icon')) {
      this.menuOpenId = null;
    }
  }

  onEdit() {
    this.menuOpen = false;
  }

  onDelete() {
    this.menuOpen = false;
  }

  deletePopUp(deleteConfirmationPopup:any,id: string, name: string) {
    this.selectedReportId = id;
    this.selectedReportName = name;
    this.modalService.open(deleteConfirmationPopup, { size: 'sl',centered: true, keyboard: false, backdrop: 'static'});
  }

    confirmDelete() {
    if (!this.selectedReportId) return;
    this.dashboardservice.deleteScheduleReport(this.selectedReportId).subscribe({
      next: (res) => {
        this.appService.openSnackBar('Schedule report delete successfully', 'Success');
        this.modalService.dismissAll();

        // 🔥 Actually CALL the method here with ()
        this. getReport()
      },
      error: (err) => {
        this.appService.openSnackBar('Failed to delete schedule report', 'Error');
        this.modalService.dismissAll();
      }
    });
  }

  getReport() {
    this.dashboardservice.getReportList().subscribe((res: any) => {
      this.reportList = res;
    })
  }

  downloadFilterReport(item) {
    const requestPayload = {
      consumer: this.customConsumer,
      fleetId: item?.fleetId,
      cadence: 'TILL_NOW',
      attributeSet: item?.notifications.split(','),
      vinSet: item?.vins.split(','),
    };
    this.dashboardservice.generateReport(requestPayload).subscribe(
      (response) => {
        this.dataReport = response;
        this.fleetLevelData = this.dataReport?.fleetLevelStats;
        this.vinLevelDataforCustom = this.dataReport?.vinLevelStats;
        this.customReportData(requestPayload);
      },
      (err) => {
        if (err?.status === 404) {
          // handle not found
        } else if (err?.error?.message) {
          // handle API error
        }
      }
    );
  }

  async customReportData(requestPayload) {
    const workbook = new ExcelJS.Workbook();
    // Data for A15 to I20
    const worksheet3 = workbook.addWorksheet("Data", {
      views: [{ showGridLines: false }],
    });
    const columnWidths = 230 / 7.5;
    for (let i = 1; i <= 33; i++) {
      worksheet3.getColumn(i).width = columnWidths;
    }
    worksheet3.addRow([`Number of Selected Vehicles: ${this.vinLevelDataforCustom.length}`]);
    worksheet3.addRow([]);
    const headers1 = [
      { name: "VIN", value: "cxVin" },
      { name: "Group Name", value: "groupName"},
      { name: "Vehicle Name", value: "vinAlias" },
      { name: "Total Distance (miles)", value: "tripDistance" },
      { name: "Total Duration (hh:mm)", value: "totalDuration" },
      { name: "Maximum Distance in Single Trip (miles)", value: "maxDistance" },
      { name: "Maximum Duration of Single Trip (hh:mm)", value: "maxDuration" },
      { name: "Average Trip Distance (miles)", value: "averageDistance" },
      { name: "Average Trip Time (hh:mm)", value: "averageTime" },
      { name: "Average Speed (mph)", value: "avgVehicleSpeed" },
      { name: "Top Speed (mph)", value: "maxSpeed" },
      {name: "Odometer (mi)", value: 'odometer'},
      {
        name: "% Distance driven on Front Left low tire pressure",
        value: "flDistance",
      },
      {
        name: "% Distance driven on Front Right low tire pressure",
        value: "frDistance",
      },
      {
        name: "% Distance driven on Rear Left low tire pressure",
        value: "rlDistance",
      },
      {
        name: "% Distance driven on Rear Right low tire pressure",
        value: "rrDistance",
      },
      { name: "Safety Score", value: "driverBehaviourScore" },
      { name: "Score Classification", value: "scoreClassification" },
      { name: "HA (count per 100 miles)", value: "harshAcc" },
      { name: "HB (count per 100 miles)", value: "harshBrake" },
      { name: "HC (count per 100 miles)", value: "harshCornering" },
      { name: "OS (% distance travelled)", value: "overspeedingDistance" },
      { name: "ND (% distance travelled)", value: "nightDistance" },
      { name: "Seatbelt Violation (count)", value: "seatbeltAlertCountDriver" },
      { name: "Mileage (mpg)", value: "mileageMPG" },
      { name: "Total Fuel Consumed (gal)", value: "fuelConsumed" },
      { name: "Total Fuel Cost ($)", value: "fuelConsumedCost" },
      { name: "Total Fuel Cost Per Mile ($)", value: "averageCostPerMile" },
      { name: "Total Idling Duration (hh:mm)", value: "idlingDuration" },
      { name: "Idling Percentage (%)", value: "idlingPercentage" },
      { name: "Battery Voltage (v)", value: "batteryStatus" },
      { name: "Front Left Tire Pressure (psi)", value: "flTirepress" },
      { name: "Front Right Tire Pressure (psi)", value: "frTirepress" },
      { name: "Rear Left Tire Pressure (psi)", value: "rlTirepress" },
      { name: "Rear Right Tire Pressure (psi)", value: "rrTirepress" },
    ];
    const selectedHeaders = headers1.filter((header) =>
      requestPayload?.attributeSet.includes(header.value)
    );
    // Define the header style first
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
      alignment: {
        vertical: "middle",
        horizontal: "center", // Ensure this is a valid string literal type
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      },
    };

    const vinHeader = { name: "VIN", value: "cxVin" };
    const vinName = vinHeader.name;
    const vinIndex = selectedHeaders.findIndex(
      (header) => header.value === "cxVin"
    );
    if (vinIndex > -1) {
      selectedHeaders.splice(vinIndex, 1);
    }
    selectedHeaders.unshift(vinHeader);
    if (
      this.vinLevelDataforCustom &&
      Array.isArray(this.vinLevelDataforCustom) &&
      this.vinLevelDataforCustom.length > 0
    ) {
      const headerRow = [vinName, "Vehicle Name", "Fleet Name", "Group Name"];
      selectedHeaders.forEach((header) => {
        if (header.value !== "cxVin") {
          headerRow.push(header.name);
        }
      });
      const headerRowExcel = worksheet3.addRow(headerRow);
      headerRowExcel.eachCell((cell) => {
        const cellRef = cell.address;
        const headerCell = worksheet3.getCell(cellRef);
        Object.assign(headerCell.style, headerStyleLeft);
      });
      // Main table data VIN Wise
      this.vinLevelDataforCustom.forEach((item: any) => {
        const maskedVin = item.cxVin || "--";
        const vinAlias = item.alias|| "--";;
        const fleetId = item.fleetId || "--";
        const fleetIdName = item.fleetName || "--";
        const fleetName = item.groupName|| "--";
        const rowData = [maskedVin, vinAlias,fleetIdName,fleetName];
        selectedHeaders.forEach((header) => {
          if (header.value !== "cxVin") {
            let value = item[header.value];
            if (
              [
                "totalDuration",
                "maxDuration",
                "averageTime",
                "idlingDuration",
              ].includes(header.value)
            ) {
              const convertedValue = this.convertSecondsToHhMm(value) || "N/A";
              rowData.push(convertedValue);
            } else {
              const formattedValue =
                typeof value === "number" ? value.toFixed(2) : value || "N/A";
              rowData.push(formattedValue);
            }
          }
        });
        worksheet3.addRow(rowData);
      });
    } else {
    }
    const descriptionSheet = workbook.addWorksheet("Description", {
      views: [{ showGridLines: false }],
    });
    for (let col = 1; col <= 26; col++) {
      const cell = descriptionSheet.getCell(1, col);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF25477B" },
      };
    }
    for (let col = 27; col <= 16384; col++) {
      descriptionSheet.getColumn(col).hidden = true;
    }

    const titleCells = descriptionSheet.getCell("A1");
    titleCells.value = "Custom Report Summary";
    titleCells.alignment.horizontal = "left";

    const azugaCell_desc = descriptionSheet.getCell("A2");
    azugaCell_desc.value = requestPayload?.consumer;
    azugaCell_desc.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FFFA751A" },
    };
    azugaCell_desc.alignment = { vertical: "middle" };

    const FleetIdCells = descriptionSheet.getCell("A3");
    if (requestPayload?.fleetId && requestPayload?.fleetId !== this.fleetIds) {
      FleetIdCells.value = `FleetId: ${requestPayload?.fleetId}`;
    } else {
      // If no specific fleet ID is selected, print all fleet IDs
      FleetIdCells.value = `FleetIds: ${this.fleetIds}`;
    }
    FleetIdCells.font = {
      name: "Tahoma",
      size: 10,
      color: { argb: "FF25477B" },
    };
    FleetIdCells.alignment = { vertical: "middle" };
    const dateCells = descriptionSheet.getCell("D1");
    dateCells.value = this.formatDate(new Date());

    // Alerts
    const reportDescriptions = descriptionSheet.getCell("C5");
    reportDescriptions.value = "Report Description";
    reportDescriptions.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptions.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "FA751A" },
      bold: true,
    };
    reportDescriptions.alignment = { vertical: "middle", horizontal: "left" };
    reportDescriptions.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getColumn(3).width = 100;
    const reportDescriptionsValues = descriptionSheet.getCell("C6");
    reportDescriptionsValues.value =
      "Custom reports by CerebrumX are tailored to meet the specific needs of your fleet. Choose critical data parameters that matters to you, enabling quick assessments of performance and proactive decision-making";
    reportDescriptionsValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffff" },
    };
    reportDescriptionsValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    reportDescriptionsValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    reportDescriptionsValues.border = {
      top: { style: "medium", color: { argb: "ffffff" } },
      left: { style: "medium", color: { argb: "ffffff" } },
      bottom: { style: "medium", color: { argb: "ffffff" } },
      right: { style: "medium", color: { argb: "ffffff" } },
    };
    descriptionSheet.getRow(6).height = 60;
    // Pending
    const timePeriods = descriptionSheet.getCell("C10");
    timePeriods.value = "Harsh Acceleration (HA)";
    timePeriods.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "7ea6fe" },
    };
    timePeriods.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    timePeriods.alignment = { vertical: "middle", horizontal: "left" };
    timePeriods.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const timePeriodValues = descriptionSheet.getCell("C11");
    timePeriodValues.value =
      "Harsh acceleration occurs when a driver speeds up quickly (above 2.74 m/s2) from a stop or standstill, often using more power than necessary. Harsh acceleration can be a sign of aggressive driving and can lead to increased fuel consumption as well as wear on the vehicle. Measured in count per 100 miles.";
    timePeriodValues.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "a7bef2" },
    };
    timePeriodValues.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    timePeriodValues.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    timePeriodValues.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(11).height = 60;
    // Failed
    const failedDetails = descriptionSheet.getCell("C12");
    failedDetails.value = "Harsh Braking (HB)";
    failedDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffd0af" },
    };
    failedDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    failedDetails.alignment = { vertical: "middle", horizontal: "left" };
    failedDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const failedDetailsParagraph = descriptionSheet.getCell("C13");
    failedDetailsParagraph.value =
      "Harsh braking refers to sudden or forceful braking (acceleration below -3.04 m/s2), leading the vehicle to a stop or standstill. Harsh braking can be a sign of distracted driving and may result in undue maintenance issues or even collisions. Measured in count per 100 miles.";
    failedDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "fbe5d6" },
    };
    failedDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    failedDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    failedDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(13).height = 60;
    // Active
    const activeDetails = descriptionSheet.getCell("C14");
    activeDetails.value = "Harsh Cornering (HC)";
    activeDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "b3cbff" },
    };
    activeDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    activeDetails.alignment = { vertical: "middle", horizontal: "left" };
    activeDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const activeDetailsParagraph = descriptionSheet.getCell("C15");
    activeDetailsParagraph.value =
      "Harsh cornering is a result of quick or sharp turns, or going into a bend too fast (lateral acceleration greater than 3.92 m/s2 or less than -3.92 m/s2). Harsh cornering can cause loss of stability and control of the vehicle, while increasing the risk of excessive wear and tear. Measured in count per 100 miles.";
    activeDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "c4d4f5" },
    };
    activeDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    activeDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    activeDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getRow(15).height = 60;
    // Un Enrolled
    // Active
    const unenrolledDetails = descriptionSheet.getCell("C16");
    unenrolledDetails.value = "Over Speeding (OS)";
    unenrolledDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "bdbdbd" },
    };
    unenrolledDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    unenrolledDetails.alignment = { vertical: "middle", horizontal: "left" };
    unenrolledDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const overSpeedingParagraph = descriptionSheet.getCell("C17");
    overSpeedingParagraph.value =
      "Over speeding refers to the proportion of distance travelled above the authorized speed limit (above 75 mph) as compared to the total distance travelled. Over speeding may hamper the driver’s ability to react to hazards, leading to increased risks of accidents and legal penalties. Measured in percentage (%) of distance travelled (miles).";
    overSpeedingParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "e2e0e0" },
    };
    overSpeedingParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    overSpeedingParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    overSpeedingParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;

    const overSpeedingDetails = descriptionSheet.getCell("C18");
    overSpeedingDetails.value = "Night Driving (ND)";
    overSpeedingDetails.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ff8f8f" },
    };
    overSpeedingDetails.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    overSpeedingDetails.alignment = { vertical: "middle", horizontal: "left" };
    overSpeedingDetails.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const unenrolledDetailsParagraph = descriptionSheet.getCell("C19");
    unenrolledDetailsParagraph.value =
      "Night driving highlights the proportion of distance travelled between nighttime hours (20:00-06:00 UTC) as compared to the total distance travelled. Ideally, night driving should be kept at a minimum as it could be more hazardous due to reduced visibility and increased fatigue. Measured in percentage (%) of distance travelled (miles).";
    unenrolledDetailsParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "f9bfbf" },
    };
    unenrolledDetailsParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    unenrolledDetailsParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    unenrolledDetailsParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;
    const safetyScoreHeading = descriptionSheet.getCell("C20");
    safetyScoreHeading.value = "Safety Score";
    safetyScoreHeading.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2ca87f" },
    };
    safetyScoreHeading.font = {
      name: "Tahoma",
      size: 12,
      color: { argb: "000000" },
      bold: true,
    };
    safetyScoreHeading.alignment = { vertical: "middle", horizontal: "left" };
    safetyScoreHeading.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };
    descriptionSheet.getColumn(3).width = 80;
    const safetyScoreParagraph = descriptionSheet.getCell("C21");
    safetyScoreParagraph.value =
      "Driver score is an AI-generated indicator of how safely the driver drives, on a scale of 0 to 100 (100 being the safest). It is a consolidated result giving a holistic safety assessment for the driver, calculated across key driver behavior metrics like: Harsh Acceleration, Harsh Braking, Harsh Cornering, Over Speeding and Night Driving Percentage, using machine learning algorithms over a period of time.";
    safetyScoreParagraph.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "95d3bf" },
    };
    safetyScoreParagraph.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "131313" },
    };
    safetyScoreParagraph.alignment = {
      wrapText: true,
      vertical: "top",
      horizontal: "left",
    };
    safetyScoreParagraph.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      right: { style: "medium", color: { argb: "FF000000" } },
    };

    descriptionSheet.getRow(17).height = 60;
    // Merge cells I4 and J4, set value, and font
    descriptionSheet.mergeCells("E3:F3");
    const E3 = descriptionSheet.getCell("E3");
    E3.value = "Safety Score Rating";
    E3.font = { name: "Tahoma", size: 11, bold: true };
    E3.alignment = { vertical: "middle", horizontal: "center" };
    // Set data for I6-J10 cells
    const data = [
      { row: 4, label: "Very Good", range: "81-100", bgColor: "FF2CA87F" },
      { row: 5, label: "Good", range: "61-80", bgColor: "FF95D3BF" },
      { row: 6, label: "Moderate", range: "41-60", bgColor: "FFFA751F" },
      { row: 7, label: "Risky", range: "21-40", bgColor: "FFFF4D4D" },
      { row: 8, label: "Very Risky", range: "1-20", bgColor: "FFFF0000" },
    ];
    data.forEach(({ row, label, range, bgColor }) => {
      const ECell = descriptionSheet.getCell(`E${row}`);
      const FCell = descriptionSheet.getCell(`F${row}`);
      // Set values and styles for column I cells
      ECell.value = label;
      ECell.font = { name: "Tahoma", size: 11 };
      ECell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      ECell.alignment = { vertical: "middle", horizontal: "center" };
      ECell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };

      // Set values and styles for column J cells
      FCell.value = range;
      FCell.font = { name: "Tohama", size: 11 };
      FCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      FCell.alignment = { vertical: "middle", horizontal: "center" };
      FCell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });
    const worksheet2 = workbook.addWorksheet("Summary_snapshot", {
      views: [{ showGridLines: false }],
    });
    worksheet2.state = "veryHidden";
    const columnWidth = 230 / 7.5;
    for (let i = 1; i <= 33; i++) {
      worksheet2.getColumn(i).width = columnWidth;
    }
    // For column font
    for (let col = 1; col <= 35; col++) {
      const cell = worksheet2.getCell(1, col);
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
    // For show blank sheet not column
    for (let col = 35; col <= 16384; col++) {
      worksheet2.getColumn(col).hidden = true;
    }
    // Title of the report
    const titleCell = worksheet2.getCell("A1");
    titleCell.value = "Custom Report";
    titleCell.alignment.horizontal = "left";
    titleCell.font = {
      name: "Tahoma",
      size: 11,
      color: { argb: "FFFFFFFF" },
      bold: true,
    };
    worksheet2.getRow(1).height = 20;
    // Consumer Name in Row 2
    const azugaCell = worksheet2.getCell("A2");
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
    // Fleet Id in Row 3
    const FleetIdCell = worksheet2.getCell("A3");
    if (requestPayload?.fleetId && requestPayload?.fleetId !== this.fleetIds) {
      FleetIdCell.value = `FleetId: ${requestPayload?.fleetId}`;
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
    // Date show in Row 1 Center
    const dateCell = worksheet2.getCell("D1");
    dateCell.value = this.formatDate(new Date());
    for (let row = 9; row <= 12; row++) {
      const cell = worksheet2.getCell(row, 4);
      cell.font = {
        name: "Tahoma",
        size: 12,
        color: { argb: "FF000000" },
        bold: true, // Make text bold
      };
    }
    worksheet2.getColumn(3).width = 220 / 7.5;
    for (let col = 5; col <= 11; col++) {
      worksheet2.getColumn(col).width = 220 / 7.5;
    }
    // A5 - Time Period
    const B3 = worksheet2.getCell("B3");
    B3.value = "Time Period";
    B3.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B3.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    B3.alignment = { vertical: "middle", horizontal: "center" };
    B3.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const B4 = worksheet2.getCell("B4");
    const currentDate = new Date();
    let formattedDate = "";
    // selected period time period
    switch (requestPayload?.cadence) {
      case "TILL_NOW": {
        // Format today's date for 'TILL_NOW'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        B4.value = `Till ${formattedDate}`;
        break;
      }

      case "TODAY": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        B4.value = `${formattedDate}`;
        break;
      }

      case "YESTERDAY": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        B4.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        // Define the custom week ranges
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }

        // Format the first and last date of the week
        formattedDate = `${formatDate(
          firstDayOfWeek,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        B4.value = `${formattedDate}`;
        break;
      }

      case "CURRENT_MONTH": {
        // Format the first day of the current month and current date for 'CURRENT_MONTH'
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        formattedDate = `${formatDate(
          firstDayOfMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        B4.value = `${formattedDate}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        // Calculate the first and last day of the previous month
        const firstDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1
        );
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        formattedDate = `${formatDate(
          firstDayOfPreviousMonth,
          "MM-dd-yyyy",
          "en-US"
        )} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        B4.value = `${formattedDate}`;
        break;
      }
      case "CUSTOM_RANGE": {
        const formattedStartDate = formatDate(
          this.fromDate,
          "MM-dd-yyyy",
          "en-US"
        );
        const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");

        // Assign formatted dates to component properties
        this.startDate = formattedStartDate; // Use the formatted start date
        this.endDate = formattedEndDate; // Use the formatted end date

        // Create the formatted date range (optional)
        const formattedDate = `${formattedStartDate} to ${formattedEndDate}`;

        // Set B4.value to the formatted date range (if needed)
        B4.value = formattedDate;

        break;
      }

      default: {
        B4.value = "Invalid selection";
        break;
      }
    }
    // Apply font formatting to cell B4 time period
    B4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" }, // Orange color as per your request
    };
    B4.alignment = { vertical: "middle", horizontal: "center" };
    B4.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // Number of Days
    // C3 - Time Period
    const C3 = worksheet2.getCell("C3");
    C3.value = "No. of Days";
    C3.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    C3.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F2F2F2" },
    };
    C3.alignment = { vertical: "middle", horizontal: "center" };
    C3.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    const C4 = worksheet2.getCell("C4");
    let totalDays = 0;
    // Number of days count based on time period selection
    switch (requestPayload?.cadence) {
      case "TILL_NOW": {
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        B4.value = `Till ${formattedDate}`;
        break;
      }
      case "TODAY": {
        const totalDays = 1; // Total days for today is always 1
        C4.value = `${totalDays}`;
        break;
      }
      case "YESTERDAY": {
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        const totalDays = 1; // Total days for yesterday is always 1
        C4.value = `${totalDays}`;
        break;
      }
      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate(); // Get current day of the month
        const currentMonth = currentDate.getMonth(); // Get the current month
        const currentYear = currentDate.getFullYear(); // Get the current year
        const daysInMonth = new Date(
          currentYear,
          currentMonth + 1,
          0
        ).getDate(); // Get total days in the current month
        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1); // 01 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 7); // 07 of the month
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8); // 08 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 14); // 14 of the month
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15); // 15 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 21); // 21 of the month
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22); // 22 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
        } else if (dayOfMonth >= 28 && dayOfMonth <= daysInMonth) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28); // 28 of the month
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth); // Last day of the month (30 or 31)
        }
        totalDays =
          Math.ceil(
            (lastDayOfWeek.getTime() - firstDayOfWeek.getTime()) /
            (1000 * 60 * 60 * 24)
          ) + 1; // +1 to include the last day
        C4.value = `${totalDays}`;
        break;
      }
      case "CURRENT_MONTH": {
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const totalDays = firstDayOfMonth.getDate();
        C4.value = `${totalDays}`;
        break;
      }
      case "PREVIOUS_MONTH": {
        const lastDayOfPreviousMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        ); // Last day of previous month
        const totalDays = lastDayOfPreviousMonth.getDate();
        C4.value = `${totalDays}`;
        break;
      }
      case "CUSTOM_RANGE": {
        // Calculate the total number of days between the two formatted dates
        const startDateObj = new Date(this.fromDate); // Convert to Date object
        const endDateObj = new Date(this.toDate); // Convert to Date object

        // Calculate the difference in time and convert to days
        const totalDaysBetween = Math.ceil(
          (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)
        );

        // Assign the total days between to a variable or value
        const totalDays = totalDaysBetween;

        C4.value = `${totalDays}`;
        break;
      }
      default: {
        C4.value = "Invalid selection";
        break;
      }
    }
    C4.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
      color: { argb: "FFFA751A" },
    };
    C4.alignment = { vertical: "middle", horizontal: "center" };
    C4.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
    // Define headers with corresponding value keys for fleet data
    const headers = [
      { title: "Total Distance", attribute: "tripDistance" },
      { title: "Total Duration", attribute: "totalDuration" },
      { title: "Total Fuel Consumed", attribute: "fuelConsumed" },
      { title: "Total Fuel Cost", attribute: "fuelConsumedCost" },
      { title: "Mileage", attribute: "avgMileage" },
      { title: "Total Idling Duration", attribute: "idlingDuration" },
    ];
    // Starting column index (A = 1, B = 2, ..., Z = 26)
    let startingColumn = 1;
    // header map with attributed
    const dataMappings = headers.map((header) => ({
      title: header.title,
      attribute: header.attribute,
      value: undefined,
    }));
    // Assign values based on the fleetLevelData
    dataMappings.forEach((data) => {
      switch (data.attribute) {
        case "tripDistance":
          data.value =
            !this.fleetLevelData?.tripDistance ||
              this.fleetLevelData.tripDistance === "NA" ||
              this.fleetLevelData.tripDistance === 0 ||
              this.fleetLevelData.tripDistance === ""
              ? "--"
              : Number(this.fleetLevelData.tripDistance).toFixed(2) + " miles";
          break;
        case "totalDuration":
          data.value =
            !this.fleetLevelData?.totalDuration ||
              this.fleetLevelData.totalDuration === "NA" ||
              this.fleetLevelData.totalDuration === 0 ||
              this.fleetLevelData.totalDuration === ""
              ? "--"
              : this.convertSecondsToHhMm(this.fleetLevelData.totalDuration) +
              " hh:mm";
          break;
        // case 'averageDistance':
        //   data.value = !this.fleetLevelData?.averageDistance || this.fleetLevelData.averageDistance === 'NA' || this.fleetLevelData.averageDistance === ''
        //     ? '--'
        //     : Number(this.fleetLevelData.averageDistance).toFixed(2) + ' miles';
        //   break;
        // case 'averageTime':
        //   data.value = !this.fleetLevelData?.averageTime || this.fleetLevelData.averageTime === 'NA' || this.fleetLevelData.averageTime === ''
        //     ? '--'
        //     : this.convertSecondsToHhMm(this.fleetLevelData.averageTime) + ' hh:mm';
        //   break;
        case "fuelConsumed":
          data.value =
            !this.fleetLevelData?.fuelConsumed ||
              this.fleetLevelData.fuelConsumed === "NA" ||
              this.fleetLevelData.fuelConsumed === ""
              ? "--"
              : Number(this.fleetLevelData.fuelConsumed).toFixed(2) + " gal";
          break;
        case "fuelConsumedCost":
          data.value =
            this.fleetLevelData?.fuelConsumedCost === 0
              ? "0.00 $"
              : !this.fleetLevelData?.fuelConsumedCost ||
                this.fleetLevelData.fuelConsumedCost === "NA" ||
                this.fleetLevelData.fuelConsumedCost === ""
                ? "--"
                : this.fleetLevelData.fuelConsumedCost.toFixed(2) + " $";
          break;
        case "avgMileage":
          data.value =
            !this.fleetLevelData?.mileageMPG ||
              this.fleetLevelData.mileageMPG === "NA" ||
              this.fleetLevelData.mileageMPG === ""
              ? "--"
              : Number(this.fleetLevelData.mileageMPG).toFixed(2) + " mpg";
          break;
        case "idlingDuration":
          data.value =
            !this.fleetLevelData?.idlingDuration ||
              this.fleetLevelData.idlingDuration === "NA" ||
              this.fleetLevelData.idlingDuration === ""
              ? "--"
              : this.convertSecondsToHhMm(this.fleetLevelData.idlingDuration) +
              " hh:mm";
          break;
        // case 'avgIdlingDurationPerVin':
        //   data.value = !this.fleetLevelData?.avgIdlingDurationPerVin || this.fleetLevelData.avgIdlingDurationPerVin === 'NA' || this.fleetLevelData.avgIdlingDurationPerVin === ''
        //     ? '--'
        //     : this.convertSecondsToHhMm(this.fleetLevelData.avgIdlingDurationPerVin) + ' hh:mm';
        //   break;
        default:
          data.value = "--";
          break;
      }
    });
    // Generate headers and data cells based on selected attributes for fleet
    dataMappings.forEach((data) => {
      if (requestPayload?.attributeSet.includes(data.attribute)) {
        // Check if the attribute is selected
        const position = String.fromCharCode(64 + startingColumn); // Calculate the column letter
        const headerCellPosition = position + "11"; // Header position
        const dataCellPosition = position + "12"; // Data position

        // Set the header cell
        const headerCell = worksheet2.getCell(headerCellPosition);
        headerCell.value = data.title;
        headerCell.font = {
          name: "Tahoma",
          size: 11,
          bold: true,
        };
        headerCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F2F2F2" },
        };
        headerCell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        headerCell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };

        // Set the data cell
        const dataCell = worksheet2.getCell(dataCellPosition);
        dataCell.value = data.value;
        dataCell.font = {
          name: "Tahoma",
          size: 11,
          bold: true,
          color: { argb: "FFFA751A" },
        };
        dataCell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        dataCell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };

        startingColumn++; // Move to the next column for the next data cell
      }
    });
    worksheet2.getRow(11).height = 30;
    worksheet2.getRow(12).height = 30;
    const row13 = worksheet2.getRow(13);
    row13.values = [];
    row13.height = 15;
    // A6 For fleet score
    const A6 = worksheet2.getCell("A6");
    A6.value = "Fleet score";
    A6.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    A6.alignment = { vertical: "middle", horizontal: "center" };
    worksheet2.mergeCells("A7:A9");
    const A7 = worksheet2.getCell("A7");
    A7.value = `${!this.fleetLevelData?.driverBehaviourScore ||
      this.fleetLevelData?.driverBehaviourScore === "NA" ||
      this.fleetLevelData?.driverBehaviourScore === 0 ||
      this.fleetLevelData?.driverBehaviourScore === ""
      ? "--"
      : Number(this.fleetLevelData?.driverBehaviourScore).toFixed(2)
      }`;
    A7.font = {
      name: "Tahoma",
      size: 36,
      bold: false,
    };
    A7.alignment = { vertical: "middle", horizontal: "center" };
    worksheet2.mergeCells("B6:C6");
    const B6 = worksheet2.getCell("B6");
    B6.value = "Avg. Count per 100 miles";
    B6.font = {
      name: "Tahoma",
      size: 11,
      bold: true,
    };
    B6.alignment = { horizontal: "center", vertical: "middle" };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      left: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
      right: { style: "thin", color: { argb: "FFD3D3D3" } as ExcelJS.Color },
    };
    // Events count
    worksheet2.mergeCells("B7");
    const B7 = worksheet2.getCell("B7");
    B7.value = "Avg. Harsh Acceleration (HA)";
    B7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    B7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    B7.alignment = { vertical: "middle", horizontal: "center" };
    B7.border = borderStyle;
    const C7 = worksheet2.getCell("C7");
    C7.value = `${this.fleetLevelData?.harshAcc === 0
      ? "0"
      : !this.fleetLevelData?.harshAcc ||
        this.fleetLevelData?.harshAcc === "NA" ||
        this.fleetLevelData?.harshAcc === ""
        ? "--"
        : (this.fleetLevelData?.harshAcc).toFixed(2)
      }`;
    C7.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    C7.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4680FF" },
    };
    C7.alignment = { vertical: "middle", horizontal: "center" };
    C7.border = borderStyle;
    // E7 and F7 merged, G7 styling
    worksheet2.mergeCells("B8");
    const B8 = worksheet2.getCell("B8");
    B8.value = "Avg. Harsh Braking (HB)";
    B8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    B8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    B8.alignment = { vertical: "middle", horizontal: "center" };
    B8.border = borderStyle;
    const C8 = worksheet2.getCell("C8");
    C8.value = `${this.fleetLevelData?.harshBrake === 0
      ? "0"
      : !this.fleetLevelData?.harshBrake ||
        this.fleetLevelData?.harshBrake === "NA" ||
        this.fleetLevelData?.harshBrake === ""
        ? "--"
        : (this.fleetLevelData?.harshBrake).toFixed(2)
      }`;
    C8.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    C8.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF79A3FF" },
    };
    C8.alignment = { vertical: "middle", horizontal: "center" };
    C8.border = borderStyle;
    // E8 and F8 merged, G8 styling
    worksheet2.mergeCells("B9");
    const B9 = worksheet2.getCell("B9");
    B9.value = "Avg. Harsh Cornering (HC) ";
    B9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    B9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    B9.alignment = { vertical: "middle", horizontal: "center" };
    B9.border = borderStyle;
    const C9 = worksheet2.getCell("C9");
    C9.value = `${this.fleetLevelData?.harshCornering === 0
      ? "0"
      : !this.fleetLevelData?.harshCornering ||
        this.fleetLevelData?.harshCornering === "NA" ||
        this.fleetLevelData?.harshCornering === ""
        ? "--"
        : (this.fleetLevelData?.harshCornering).toFixed(2)
      }`;
    C9.font = { name: "Tahoma", size: 11, color: { argb: "FF000000" } };
    C9.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFA751A" },
    };
    C9.alignment = { vertical: "middle", horizontal: "center" };
    C9.border = borderStyle;


    const buffer = await workbook.xlsx.writeBuffer();
    switch (this.selectedPeriod) {
      case "TILL_NOW": {
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        break;
      }

      case "TODAY": {
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        break;
      }

      case "YESTERDAY": {
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        break;
      }

      case "CURRENT_WEEK": {
        const dayOfMonth = currentDate.getDate();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        let firstDayOfWeek: Date;
        let lastDayOfWeek: Date;

        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 1);
          lastDayOfWeek = new Date(currentYear, currentMonth, 7);
        } else if (dayOfMonth >= 8 && dayOfMonth <= 14) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 8);
          lastDayOfWeek = new Date(currentYear, currentMonth, 14);
        } else if (dayOfMonth >= 15 && dayOfMonth <= 21) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 15);
          lastDayOfWeek = new Date(currentYear, currentMonth, 21);
        } else if (dayOfMonth >= 22 && dayOfMonth <= 28) {
          firstDayOfWeek = new Date(currentYear, currentMonth, 22);
          lastDayOfWeek = new Date(currentYear, currentMonth, 28);
        } else {
          firstDayOfWeek = new Date(currentYear, currentMonth, 28);
          lastDayOfWeek = new Date(currentYear, currentMonth, daysInMonth);
        }

        formattedDate = `${formatDate(firstDayOfWeek, "MM-dd-yyyy", "en-US")} to ${formatDate(lastDayOfWeek, "MM-dd-yyyy", "en-US")}`;
        break;
      }

      case "CURRENT_MONTH": {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        formattedDate = `${formatDate(firstDayOfMonth, "MM-dd-yyyy", "en-US")} to ${formatDate(currentDate, "MM-dd-yyyy", "en-US")}`;
        break;
      }

      case "PREVIOUS_MONTH": {
        const firstDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        formattedDate = `${formatDate(firstDayOfPreviousMonth, "MM-dd-yyyy", "en-US")} to ${formatDate(lastDayOfPreviousMonth, "MM-dd-yyyy", "en-US")}`;
        break;
      }

      case "CUSTOM_RANGE": {
        if (this.fromDate && this.toDate) {
          const formattedStartDate = formatDate(this.fromDate, "MM-dd-yyyy", "en-US");
          const formattedEndDate = formatDate(this.toDate, "MM-dd-yyyy", "en-US");
          formattedDate = `${formattedStartDate} to ${formattedEndDate}`;
        } else {
          console.error("CUSTOM_RANGE requires both fromDate and toDate.");
        }
        break;
      }

      default: {
        formattedDate = "Invalid_Selection";
        console.error("Invalid Period Selected");
        break;
      }
    }
    const blob = new Blob([buffer], { type: "application/octet-stream" });
   if (this.user != "admin") {
      const fileName = `Custom_Report_${this.customConsumer}_${formattedDate}.xlsx`;
      FileSaver.saveAs(blob, fileName);
    }
  }

  editFilterPopup(createFilter: any,reportItem) {
    this.isEditFilter = true
    this.reportName = reportItem?.reportName
    this.editData = reportItem
    this.modalService.open(createFilter, { size: "sl", centered: true });
  }

  editFilterSubmit() {
    let reqBody = {
      scheduleTime: this.selectedTime,
      scheduleDate: this.displayDate ? this.dateConvert(this.displayDate) : '',
      occurrenceUnit: this.timeIntervalUnit,
      emailIds: this.emails,
      reportName: this.reportName,
    }
    this.dashboardservice.updateFilteredReport(reqBody,this.editData?.id).subscribe((res:any)=>{
      this.emails=[]
      this.selectedTime = '';
      this.timeIntervalUnit = '';
      this.reportName = ''
      this.showEmailInput = false
      this.getReport();
      this.isEditFilter = false
    },err=>{
      this.toastr.error(err?.error?.apierror?.message);
      this.emails=[]
      this.selectedTime = '';
      this.timeIntervalUnit = '';
      this.reportName = ''
      this.showEmailInput = false
      this.getReport();
      this.isEditFilter = false
    })
  }

  editReportPopUp(EditReport: any, reportItem: any) {
    this.isEditFilter = true;

    this.reportName = reportItem?.reportName || '';
    this.selectedTime = reportItem?.scheduleTime ? reportItem.scheduleTime.slice(0, 5) : '';
    this.displayDate = reportItem?.scheduleDate ? this.dateConvert(reportItem.scheduleDate) : '';
    this.timeIntervalUnit = reportItem?.occurrenceUnit || '';

    if (reportItem?.occurrenceUnit === 'Weekly') {
      const date = new Date(reportItem.scheduleDate);
      this.selectedDayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      this.selectedDayName = '';
    }

    this.emails = reportItem?.emailIds ? reportItem.emailIds.split(',') : [];
    this.editData = reportItem;
    this.modalService.open(EditReport, { size: 'sl', centered: true });
  }

  dateConvert(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  editReportSubmit() {
    let reqBody = {
      scheduleTime: this.selectedTime,
      scheduleDate: this.displayDate ? this.dateConvert(this.displayDate) : '',
      occurrenceUnit: this.timeIntervalUnit,
      emailIds: this.emails,
      reportName: this.reportName
    };
    this.dashboardservice.updateFilteredReport(reqBody,this.editData?.id).subscribe((res:any)=>{
      this.appService.openSnackBar('Data updated successfully', "Success");
      this.emails=[]
      this.selectedTime = '';
      this.timeIntervalUnit = '';
      this.reportName = ''
      this.showEmailInput = false
      this.isEditFilter = false
      this.getReport();
    },err=>{
      this.toastr.error(err?.error?.apierror?.message);
      this.emails=[]
      this.selectedTime = '';
      this.timeIntervalUnit = '';
      this.reportName = ''
      this.showEmailInput = false
      this.getReport();
      this.isEditFilter = false
    })
  }


}
