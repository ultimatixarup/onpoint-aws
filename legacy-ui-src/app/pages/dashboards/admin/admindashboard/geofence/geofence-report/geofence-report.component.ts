import { Component,OnInit} from "@angular/core";
import { DatePipe, formatDate } from "@angular/common";
import { FleetService, LocationTypeService, SelectedLocationService, SelectedPeriodService } from "src/app/core/services/users-role.service";
import * as ExcelJS from "exceljs";
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import moment from 'moment';
interface ReportResponse {
  status: string;  // Assuming status is a string
  report: any[];   // Assuming report is an array, adjust type if needed
}
import { ActivatedRoute, Router } from "@angular/router";
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import * as FileSaver from 'file-saver';
@Component({
  selector: "app-geofence-report",
  templateUrl: "./geofence-report.component.html",
  styleUrls: ["./geofence-report.component.scss"],
})
export class GeofenceReportComponent implements OnInit {
  taskId: string | null = null;
  taskStatusData: any;
  selectedEntry = "Fuel Entry";
  timePeriods = [
    { label: "Till Date", value: "TILL_NOW" },
    { label: "Today", value: "TODAY" },
    { label: "Yesterday", value: "YESTERDAY" },
    { label: "Current Week", value: "CURRENT_WEEK" },
    { label: "Current Month", value: "CURRENT_MONTH" },
    { label: "Previous Month", value: "PREVIOUS_MONTH" },
    // { label: "Custom Range", value: "CUSTOM_RANGE" },
  ];
  sortAscending: boolean = true;
  selectedFleetId: string;
  fromDate: string;
  toDate: string;
  startDate: string;
  endDate: string;
  selectedTimePeriod: string = "Current Week";
  selectedPeriod: string;
  isCardOpen = false;
  selectedOption: string = "customRange";
  selectAllChecked = false;
  reportData: any;
  user: any;
  loginUser: any;
  customConsumer: any;
  multiRoles: any;
  taskStatusDataNew: any;
  getTypeListReport: any
  filteredReportData: any;
  selectedGeofences = [];
  fleetIds: any;
  private taskStatusInterval: any;
  selectedTypes: number[][] = []; // 2D array of numbers
  selectedLocationTypeData: number[][] = [];
  fleetIdValueNew: any;
  consumer: any;
  fleetIdData: any;
  geoFenceList: any[] = [];
  getTypeList: any;
  selectedTypeIds: any[] = [];
  searchText = '';
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  selectedLocationTypeNames: any;
  constructor(private datePipe: DatePipe,private timezoneService: TimezoneService,private router: Router, private route: ActivatedRoute, private _vehicleService: TaxonomyService,
  public locationTypeService: LocationTypeService, private fleetService: FleetService, private selectedPeriodService: SelectedPeriodService, private SelectedLocationServiceData: SelectedLocationService) { }

  ngOnInit(): void {
    this.showRole()
    this.selectedTypeIds = this.locationTypeService.selectedTypeIds;

    this.selectedFleetId = this.fleetService.getFleetId();
    this.selectConsumers()
    this.selectedPeriod = this.selectedPeriodService.getSelectedPeriod();
    const savedLocationType = this.SelectedLocationServiceData.getSelectedLocationPeriod();
    if (savedLocationType && savedLocationType.length) {
      this.selectedTypes = savedLocationType;
    }
    this.manageGeofenceList()
    this.fetchTaskStatus('')
    this.taskId = this.route.snapshot.paramMap.get('taskId');

    this.route.queryParams.subscribe(params => {
      // Try from queryParams
      const types = params['selectedTypes'] || localStorage.getItem('selectedTypes');
      const names = params['selectedTypeNames'] || localStorage.getItem('selectedTypeNames');
      const period = params['selectedPeriod'] || localStorage.getItem('selectedPeriod');

      if (types) {
        this.selectedTypes = JSON.parse(types);
      }

      if (names) {
        this.selectedLocationTypeNames = JSON.parse(names);
      }

      if (period) {
        this.selectedPeriod = period;
      }

      this.locationTypeService.selectedTypeIds = this.selectedTypes;
    });

    if (this.taskId) {
      this.fetchTaskStatus(this.taskId);
    }

    this.taskStatusInterval = setInterval(() => {
      if (this.taskId) {
        this.fetchTaskStatus(this.taskId);
      }
    }, 1000);
    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime();
    });
  }
  fleetList: any;
  selectedFleetName: string = '';
  selectConsumers() {
    this._vehicleService.getFleetList(this.consumer).subscribe((res: any) => {
      this.fleetList = res.sort((a, b) => a.id - b.id);

      // If selectedFleetId exists, find and set the name
      if (this.selectedFleetId) {
        const selectedFleet = this.fleetList.find(f => String(f.id) === String(this.selectedFleetId));
        this.selectedFleetName = selectedFleet ? selectedFleet.name : '';
      }

      this.fleetIdData = null;
    }, err => {});
  }
  get selectedTimezoneLabel(): string {
    return moment().tz(this.selectedTimezone).format('z'); // e.g., "CDT", "MST"
  }
     updateTime() {
          if (this.taskStatusData && this.taskStatusData.length > 0) {
            this.taskStatusData.forEach(geofence => {
              if (geofence.created_on) {
                geofence.creationFormattedDate = moment.utc(geofence.created_on)
                  .tz(this.selectedTimezone)
                  .format('MMM D, YYYY');

                geofence.creationFormattedTime = moment.utc(geofence.created_on)
                  .tz(this.selectedTimezone)
                  .format('HH:mm');
              } else {
                geofence.creationFormattedDate = '--';
                geofence.creationFormattedTime = '--';
              }
            })}

            }
            convertEpochToSelectedTimezone(epoch: number | string): Date | null {
              if (!epoch || !this.selectedTimezone) return null;

              const epochStr = String(epoch).trim();
              let epochSeconds: number;

              if (epochStr.length === 13) {
                epochSeconds = Number(epochStr.slice(0, 10));
              } else if (epochStr.length === 10) {
                epochSeconds = Number(epochStr);
              } else {
                console.warn('Invalid epoch format:', epoch);
                return null;
              }

              const momentInTz = moment.unix(epochSeconds).tz(this.selectedTimezone);
              return momentInTz.toDate();
            }

            get selectedTimezoneAbbreviation(): string {
              if (!this.selectedTimezone) return '';
              return moment.tz(this.selectedTimezone).zoneAbbr();
            }

  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;
    this.taskStatusData.forEach(
      (geofence) => (geofence.selected = this.selectAllChecked)
    );
  }
  isAllSelected() {
    return this.taskStatusData.every((geofence) => geofence.selected);
  }
  onCheckboxChange(geofence: any): void {
    if (geofence.selected) {
      // Add to selected list based on geofence_name
      this.selectedGeofences.push(geofence.geofence_name);
    } else {
      // Remove from selected list based on geofence_name
      this.selectedGeofences = this.selectedGeofences.filter(name => name !== geofence.geofence_name);
    }
  }
  toggleExpand(row) {
    row.expanded = !row.expanded;
  }
  navigateToGeofence() {
    this.router.navigate(["/adlp/admin/admindashboard/geofence/set-geofence"]);
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === "role_user_fleet") {
      let fleetId = JSON.stringify(sessionStorage.getItem("fleetUserId"));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;
    }
  }

  convertEpochToDate(epoch: any): Date | null {
    if (!epoch || isNaN(Number(epoch))) {
      console.warn('Invalid epoch input:', epoch);
      return null;
    }

    let epochNum = Number(epoch);

    // Filter out too-small or clearly invalid values
    if (epochNum < 1000000000) {
      console.warn(`Epoch too small or invalid: ${epochNum}`);
      return null;
    }

    // Convert to milliseconds if in seconds
    if (epochNum < 1e12) {
      // console.log(`Epoch in seconds detected: ${epochNum} → ${epochNum * 1000}`);
      epochNum *= 1000;
    }

    const date = new Date(epochNum);

    if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
      console.warn(`Suspicious date for epoch ${epochNum}:`, date.toString());
      return null;
    }

    return date;
  }

  fetchTaskStatus(taskId: string): void {
    this._vehicleService.getTaskStatus(taskId).subscribe(
      response => {
        this.taskStatusDataNew = response?.status;
        this.taskStatusData = response?.report;
        this.reportData = [];

        this.taskStatusData?.forEach((geofenceData: any) => {
          const filteredReports = geofenceData.report.filter(
            (reportItem: any) => reportItem.exit_time !== null
          );

          filteredReports.forEach((reportItem: any) => {
            if (!reportItem.entry_time || !reportItem.exit_time) return;

            const isExcluded = this.isExcludedDate(reportItem.entry_time) && this.isExcludedDate(reportItem.exit_time);

            if (!isExcluded) {
              const reportDetails = {
                geofence_name: geofenceData.geofence_name,
                vin_alias: reportItem.vin_alias,
                entry_time: reportItem.entry_time, // raw epoch in ms
                exit_time: reportItem.exit_time     // raw epoch in ms
              };
              this.reportData.push(reportDetails);
            }
          });
        });

        if (this.taskStatusDataNew === 'COMPLETED' || this.taskStatusDataNew === 'FAILED') {
          clearInterval(this.taskStatusInterval);
        }

        this.updateTime(); // ⬅️ trigger time formatting after data load
      },
      error => {
        console.error('Error fetching task status:', error);
      }
    );
  }
  formatEpochToTimezone(epoch: number | string, timezone: string): { date: string, time: string } {
    if (!epoch) return { date: '--', time: '--' };

    const epochStr = String(epoch).trim();
    let epochSeconds: number;

    if (epochStr.length === 13) {
      epochSeconds = Number(epochStr.slice(0, 10));
    } else if (epochStr.length === 10) {
      epochSeconds = Number(epochStr);
    } else {
      console.warn('Invalid epoch format:', epoch);
      return { date: '--', time: '--' };
    }

    const m = moment.unix(epochSeconds).tz(timezone);
    return {
      date: m.format('MMM D, YYYY'),
      time: m.format('HH:mm')
    };
  }




  // Converts 13-digit or 10-digit epoch to CST Date

convertEpochToCst(epoch: number | string): Date | null {
  if (!epoch) return null;

  const epochStr = String(epoch).trim();
  let epochSeconds: number;

  // Convert 13-digit epoch (milliseconds) to 10-digit (seconds)
  if (epochStr.length === 13) {
    epochSeconds = Number(epochStr.slice(0, 10)); // remove last 3 digits
  } else if (epochStr.length === 10) {
    epochSeconds = Number(epochStr);
  } else {
    console.warn('Invalid epoch format:', epoch);
    return null;
  }

  // Use moment-timezone to convert UTC to CDT
  const cdtMoment = moment.unix(epochSeconds).tz('America/Chicago');
  return cdtMoment.toDate();
}
convertEpochToMountain(epoch: number | string): Date | null {
  if (!epoch) return null;

  const epochStr = String(epoch).trim();
  let epochSeconds: number;

  // Convert 13-digit epoch (milliseconds) to 10-digit (seconds)
  if (epochStr.length === 13) {
    epochSeconds = Number(epochStr.slice(0, 10)); // remove last 3 digits
  } else if (epochStr.length === 10) {
    epochSeconds = Number(epochStr);
  } else {
    console.warn('Invalid epoch format:', epoch);
    return null;
  }

  // Use moment-timezone to convert UTC to CDT
  const cdtMoment = moment.unix(epochSeconds).tz('America/Phoenix');
  return cdtMoment.toDate();
}

  // Optional: Check for valid date object
  isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  isExcludedDate(entryTime: string | number | Date | null): boolean {
    if (!entryTime) {
      return false; // If null/undefined, don't exclude
    }

    let date: Date;

    try {
      if (entryTime instanceof Date) {
        date = entryTime;
      } else {
        const epoch = Number(entryTime);
        if (!isNaN(epoch)) {
          const epochInMs = epoch < 1e12 ? epoch * 1000 : epoch;
          date = new Date(epochInMs);
        } else {
          date = new Date(entryTime);
        }

        if (isNaN(date.getTime())) {
          console.warn('Invalid date in isExcludedDate:', entryTime);
          return false;
        }
      }
    } catch (e) {
      console.error('Error parsing date in isExcludedDate:', e);
      return false;
    }

    // Exclude 30 November 2024
    return (
      date.getFullYear() === 2024 &&
      date.getMonth() === 10 && // November
      date.getDate() === 30
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
  convertUtcToCst(input: string | number | Date): Date {
    return moment.utc(input).tz('America/Chicago').toDate();
  }
  convertIstToUtc(istTimeStr: string | number): string | null {
    if (!istTimeStr) return null;

    // Convert to number if it's a string
    const epochValue = typeof istTimeStr === 'string' ? Number(istTimeStr) : istTimeStr;

    // Check if it's a valid number
    if (isNaN(epochValue)) {
      console.warn('Invalid epoch value in convertIstToUtc:', istTimeStr);
      return null;
    }

    // Convert to milliseconds if it's in seconds (10 digits)
    const epochInMs = epochValue < 1e12 ? epochValue * 1000 : epochValue;

    // Create date object from epoch milliseconds
    let istDate = new Date(epochInMs);

    // Validate the date
    if (isNaN(istDate.getTime()) || istDate.getFullYear() === 1970) {
      console.warn('Invalid date generated from epoch:', istTimeStr, '→', istDate);
      return null;
    }

    let utcDateStr = istDate.toISOString(); // Converts directly to UTC

    // Format the UTC date as "Feb 11 2025 13:42 UTC"
    let formattedDate = new Date(utcDateStr).toLocaleString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return formattedDate.replace(",", "");
  }


  async manageGeofenceList() {
    await this._vehicleService.getAllGeoFence().subscribe((res: any) => {
      this.geoFenceList = res.sort((a: any, b: any) => {
        if (a.creationDate > b.creationDate) {
          return -1;
        } else if (a.creationDate < b.creationDate) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
      this.getTypeList = [...new Set(this.geoFenceList.map((item: any) => item.type))]
        .map((type: string) => {
          const matchedItem = this.geoFenceList.find((item: any) => item.type === type);
          return { id: matchedItem.id, name: type };
        });
    });
  }
  formatDateToCDT(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago', // CDT
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  formatDateToUTC(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  downloadIdlingReportSection() {
    if (
      !this.taskStatusData ||
      this.taskStatusData.length === 0
    ) {
      this.fetchTaskStatus(this.taskId);
    } else {
      this.dataDownlaod();
    }
  }
  async dataDownlaod() {
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
    titleCell.value = "Geofence Breach Report";
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
    FleetIdCell.value = `Fleet: ${this.selectedFleetId} ${this.selectedFleetName}`;
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
      case "till_date": {
        formattedDate = formatDate(currentDate, "MMMM d, y", "en-US");
        A6.value = `Till ${formattedDate}`;
        break;
      }

      case "daily": {
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "yesterday": {
        // Format yesterday's date for 'YESTERDAY'
        const yesterday = new Date();
        yesterday.setDate(currentDate.getDate() - 1);
        formattedDate = formatDate(yesterday, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;
      }

      case "weekly": {
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

      case "monthly": {
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

      case "lastmonth": {
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
        // Format today's date for 'TODAY'
        formattedDate = formatDate(currentDate, "MM-dd-yyyy", "en-US");
        A6.value = `${formattedDate}`;
        break;

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
      "Consumer",
      "Fleet Id",
      "Fleet Name",
      "Location Type",
      "Geofence Name",
      "Vehicle Name",
      "Entry Date",
      "Exit Date",
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
    const headers = ["A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8"];
    headers.forEach((cell) => {
      const headerCell = worksheet.getCell(cell);
      Object.assign(headerCell, headerStyleLeft);
    });


    // Loop over each task in taskStatusData
    if (Array.isArray(this.taskStatusData) && this.taskStatusData.length > 0) {
      this.taskStatusData.forEach((item) => {
        // Check if there are no items in the report array
        if (item.report.length === 0) {
          // Create a row with the available geofence information, even if the report array is empty
          worksheet.addRow([
            this.customConsumer,
            this.selectedFleetId || 'N/A',  // Default to 'N/A' if fleetId is not available
            this.selectedFleetName || 'N/A',
            item.geofence_type || 'N/A',
            item.geofence_name || 'N/A',
            'N/A', // No VIN data when report is empty
            'N/A', // No entry time when report is empty
            'N/A', // No entry time when report is empty
          ]);
        }
        else {
          item.report.forEach((reportItem) => {
            const vinToDisplay = reportItem.vin_alias.length === 17
              ? this.maskVinNumber(reportItem.vin_alias)
              : reportItem.vin_alias;

            const isOnwardUser =
              (this.user === 'role_consumer_fleet' || this.user === 'role_user_fleet') &&
              this.customConsumer === 'Onwardfleet';
              const inEcotrack =
              (this.user === 'role_consumer_fleet' || this.user === 'role_user_fleet') &&
              this.customConsumer === 'EcoTrack';

            const isOtherFleetUser =
              this.user === 'admin' ||
              (this.user === 'role_consumer_fleet' &&
                ['Btracking', 'Smallboard', 'DPL Telematics'].includes(this.customConsumer));

            let entryDate = 'N/A';
            if (reportItem.entry_time) {
              if (isOnwardUser) {
                const entry = this.convertEpochToCst(reportItem.entry_time);
                entryDate = `${this.datePipe.transform(entry, 'MMM d, y')} ${this.datePipe.transform(entry, 'HH:mm')} CDT`;
              } else if (isOtherFleetUser) {
                const entry = this.convertIstToUtc(reportItem.entry_time);
                entryDate = `${this.datePipe.transform(entry, 'MMM d, y')} ${this.datePipe.transform(entry, 'HH:mm')} UTC`;
              }
            }

            if (reportItem.entry_time) {
              if (inEcotrack) {
                const entry = this.convertEpochToMountain(reportItem.entry_time);
                entryDate = `${this.datePipe.transform(entry, 'MMM d, y')} ${this.datePipe.transform(entry, 'HH:mm')} CDT`;
              } else if (isOtherFleetUser) {
                const entry = this.convertIstToUtc(reportItem.entry_time);
                entryDate = `${this.datePipe.transform(entry, 'MMM d, y')} ${this.datePipe.transform(entry, 'HH:mm')} UTC`;
              }
            }

            let exitDate = 'N/A';
            if (reportItem.exit_time) {
              if (isOnwardUser) {
                const exit = this.convertEpochToCst(reportItem.exit_time);
                exitDate = `${this.datePipe.transform(exit, 'MMM d, y')} ${this.datePipe.transform(exit, 'HH:mm')} CDT`;
              } else if (isOtherFleetUser) {
                const exit = this.convertIstToUtc(reportItem.exit_time);
                exitDate = `${this.datePipe.transform(exit, 'MMM d, y')} ${this.datePipe.transform(exit, 'HH:mm')} UTC`;
              }
            }
            if (reportItem.exit_time) {
              if (inEcotrack) {
                const exit = this.convertEpochToMountain(reportItem.exit_time);
                exitDate = `${this.datePipe.transform(exit, 'MMM d, y')} ${this.datePipe.transform(exit, 'HH:mm')} CDT`;
              } else if (isOtherFleetUser) {
                const exit = this.convertIstToUtc(reportItem.exit_time);
                exitDate = `${this.datePipe.transform(exit, 'MMM d, y')} ${this.datePipe.transform(exit, 'HH:mm')} UTC`;
              }
            }

            let formattedDate = 'N/A';
            let userDisplay = '--';
            if (this.user === 'admin') {
              userDisplay = this.consumer;
            } else if (this.user === 'role_consumer_fleet') {
              userDisplay = this.customConsumer || this.customConsumer;
            }

            worksheet.addRow([
              this.customConsumer || 'Siriusxm',
              this.selectedFleetId || 'N/A',
              this.selectedFleetName || 'N/A',
               item.geofence_type || 'N/A',
              item.geofence_name || 'N/A',
              vinToDisplay,
              entryDate,
              exitDate,
            ]);
          });

        }
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
      });
    }
    else {
      console.error("taskStatusData is either undefined or empty.");
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    if (this.user === "admin") {
      FileSaver.saveAs(
        blob,
        `Geofence_Breach_Report${this.consumer}_${formattedDate}.xlsx`
      );
    } else if (this.user != "admin") {
      FileSaver.saveAs(
        blob,
        `Geofence_Breach_Report${this.customConsumer}_${formattedDate}.xlsx`
      );
    }
  }
  getGeofenceNameById(id: string): string {
    const geofence = this.taskStatusData.find(g => g.id === id);
    return geofence ? geofence.geofence_name : 'Unknown';
  }

  isOnwardfleet(): boolean {
    return this.user === 'role_consumer_fleet' && this.customConsumer === 'Onwardfleet';
  }

  getFormattedTime(dateString: string, timezone: 'CDT' | 'UTC'): string {
    const date = new Date(dateString);

    if (timezone === 'CDT') {
      // CDT is UTC-5 (without DST handling)
      const cdtDate = new Date(date.getTime() - (5 * 60 * 60 * 1000));
      return cdtDate.toLocaleString('en-US', { timeZone: 'America/Chicago', hour12: false }); // optional: adjust formatting
    } else {
      // For UTC, return as-is
      return new Date(date).toISOString().replace('T', ' ').substring(0, 16); // formatted as 'YYYY-MM-DD HH:mm'
    }
  }



  get selectedTypeNames(): string[] {
  return this.locationTypeService.selectedTypeIds.map(id => {
    const type = this.getTypeList.find(t => t.id === id);
    return type ? type.name : '';
  });
}

  formatEpochToDateTime(epoch: number): string {
  const date = new Date(epoch); // Convert seconds to milliseconds
  const options: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  return date.toLocaleString('en-US', options).replace(',', '');
}

  private formatDate(date: Date): string {
    const options = {
      year: "numeric",
      month: "short",
      day: "2-digit",
    } as const;
    return date.toLocaleDateString("en-US", options);
  }
  maskVinNumber(_vinNumber) {
    if (_vinNumber && _vinNumber.length === 17) {
      const mask = "*".repeat(14);
      const visiblePart = _vinNumber.slice(-3);
      return mask + visiblePart;
    } else {
      return null;
    }
  }

isSidebarHidden = false;
toggleSidebar() {
  this.isSidebarHidden = !this.isSidebarHidden;
}

getDuration(entryTime: number, exitTime: number): string {
  if (!entryTime || !exitTime) return '--';

  // Convert both to numbers and handle both seconds (10 digits) and milliseconds (13 digits)
  let entryMs = entryTime < 1e12 ? entryTime * 1000 : entryTime;
  let exitMs = exitTime < 1e12 ? exitTime * 1000 : exitTime;

  const durationMs = exitMs - entryMs;
  if (durationMs < 0) return '--';

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

}
