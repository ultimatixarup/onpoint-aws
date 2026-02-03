import { catchError, pluck, shareReplay,  } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Component, OnInit,ElementRef,ViewChild } from "@angular/core";
import { TaxonomyService } from "../../../../taxonomy.service";
import { Subscription, of} from "rxjs";
import { HttpClient } from "@angular/common/http";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import * as moment from 'moment-timezone';

interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}

@Component({
  selector: 'app-safety-collision-fleet',
  templateUrl: './safety-collision-fleet.component.html',
  styleUrls: ['./safety-collision-fleet.component.scss']
})
export class SafetyCollisionFleetComponent implements OnInit {
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef;
  mapStyles: any = [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        { color: "#DBECF3" }, // Updated water color
        { lightness: 17 },
      ],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [{ color: "#E2E2E4" }, { lightness: 10 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#E2E2E4" }, { lightness: 10 }, { weight: 0.2 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      // Adding a second stroke with dashed effect
      stylers: [
        { color: "#ffffff" },
        { weight: 0.5 }, // Thinner line to create a dashed look
        { visibility: "on" },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#E2E2E4" }, { lightness: 4 }],
    },
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }, { lightness: 5 }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#dedede" }, { lightness: 21 }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }],
    },
    {
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.fill",
      stylers: [{ color: "#fefefe" }, { lightness: 20 }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
    },
  ];
  waypoints: any = []
  start_end_mark = []
  zoom: number = 7;
  latitude:any
  longitude:any;
 subscription$: Subscription = new Subscription();
  searchbyAlerts: any;
  searchbyLatestEvents: any;
 timePeriods = [
  // { label: 'Till Date', value: 'tilldate' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  // { label: 'Last 7 Days', value: 'weekly' },
  { label: 'Current Month', value: 'monthly' },
  { label: 'Previous Month', value: 'lastmonth' },
  // { label: 'Custom Range', value: 'customRange' },
];
dataOfMonths = [
  { label: 'Last 30 Days', value: 1 },
  { label: 'Last 90 Days', value: 3 },
  { label: 'Last 6 Months', value: 6 },
  { label: 'Last 12 Months', value: 12 },
];
  fleetIdData: any;
  consumerList: any
  loginUser: any;
  user: any;
  multiRoles: any;
  customConsumer: any;
  fleetList: any;
  consumer: any = 'All'
  fleetIdValueNew: any;
  fleetIds: any;
  chartOptions: any;
  hoveredEventType: string = '';
  selectedTimePeriod: string = '';
  detailData: any = {};
  detailDataReport: any;
  tableData: any;
  searchbyVinNumber: any;
  monthData: any;
  dateRange: any
  selectedPeriod: any;
  selectedTimePeriodss: number = 6;
  dataShow: boolean = false;
  downloadReport: any;
  dataForTable: any;
  eventTripSnapshot: any;
  hide: boolean = false;
  selectedVin: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  groupList: any;
  constructor(private timezoneService: TimezoneService,public router: Router, public http: HttpClient, private dashboardservice: TaxonomyService) {

  }
  ngOnInit() {
    this.showRole();
    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }
    this.selectedPeriod = 'monthly';
    this.onTimePeriodChangeData(this.selectedPeriod);
    this.collisionComponentData()
    this.monthlyChart()
    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime(); // Update vehicle data when timezone changes
    });
    if (this.user != 'role_user_fleet') {
      this.selectConsumers()
    }
  }
     updateTime() {
         if (!this.tableData || this.tableData.length === 0) return;
         this.tableData.forEach(vehicle => {
           // Handle Event Date & Time
           if (vehicle.eventDate) {
             vehicle.formattedDate = moment.utc(vehicle.eventDate)
               .tz(this.selectedTimezone)
               .format('MMM D, YYYY');

             vehicle.formattedTime = moment.utc(vehicle.eventDate)
               .tz(this.selectedTimezone)
               .format('HH:mm');
           }
           else {
             vehicle.formattedDate = '--';
             vehicle.formattedTime = '--';
           }

           // Handle tripStartTimestamp Date & Time
           if (vehicle.tripStartTimestamp) {
             vehicle.creationFormattedDate = moment.utc(vehicle.tripStartTimestamp)
               .tz(this.selectedTimezone)
               .format('MMM D, YYYY');

             vehicle.creationFormattedTime = moment.utc(vehicle.tripStartTimestamp)
               .tz(this.selectedTimezone)
               .format('HH:mm');
           }
           else {
             vehicle.creationFormattedDate = '--';
             vehicle.creationFormattedTime = '--';
           }
    // Handle tripEndTimeStamp Date & Time
           if (vehicle.tripEndTimeStamp) {
             vehicle.creationFormattedDateNew = moment.utc(vehicle.tripEndTimeStamp)
               .tz(this.selectedTimezone)
               .format('MMM D, YYYY');

             vehicle.creationFormattedTimeNew = moment.utc(vehicle.tripEndTimeStamp)
               .tz(this.selectedTimezone)
               .format('HH:mm');
           }
           else {
             vehicle.creationFormattedDateNew = '--';
             vehicle.creationFormattedTimeNew = '--';
           }
           if (vehicle.tripEndTimeStamp) {
             vehicle.creationFormattedDateNew = moment.utc(vehicle.tripEndTimeStamp)
               .tz(this.selectedTimezone)
               .format('MMM D, YYYY');

             vehicle.creationFormattedTimeNew = moment.utc(vehicle.tripEndTimeStamp)
               .tz(this.selectedTimezone)
               .format('HH:mm');
           }
           else {
             vehicle.creationFormattedDateNew = '--';
             vehicle.creationFormattedTimeNew = '--';
           }
         });

         if (!this.downloadReport) return;

         // Combine eventDate and eventTime into full UTC datetime
         if (this.downloadReport.eventDate && this.downloadReport.eventTime) {
           const combinedUTC = moment
             .utc(`${this.downloadReport.eventDate} ${this.downloadReport.eventTime}`, 'YYYY-MM-DD HH:mm');

           const event = combinedUTC.tz(this.selectedTimezone);
           this.downloadReport.formattedDate = event.format('MMM D, YYYY');
           this.downloadReport.formattedTime = event.format('HH:mm');
         }
         else {
           this.downloadReport.formattedDate = '--';
           this.downloadReport.formattedTime = '--';
         }

         if (this.dataForTable && this.dataForTable.length > 0) {
           this.dataForTable.forEach(data => {
             if (data.tripStartTimestamp) {
               const event = moment.utc(data.tripStartTimestamp).tz(this.selectedTimezone);
               data.formattedDateEvtnData = event.format('MMM D, YYYY');
               data.formattedTimeEvtnData = event.format('HH:mm');
             } else {
               data.formattedDateEvtnData = '--';
               data.formattedTimeEvtnData = '--';
             }
           });
         }
         if (this.dataForTable && this.dataForTable.length > 0) {
           this.dataForTable.forEach(data => {
             if (data.tripEndTimeStamp) {
               const event = moment.utc(data.tripEndTimeStamp).tz(this.selectedTimezone);
               data.formattedDateEvtnTime = event.format('MMM D, YYYY');
               data.formattedTimeEvtnTime = event.format('HH:mm');
             } else {
               data.formattedDateEvtnTime = '--';
               data.formattedTimeEvtnTime = '--';
             }
           });
         }

       }
  hoveredEvent: string | null = null;
  getEventTypeImage(eventType: string, isHovered: boolean): string {
    const eventImages: { [key: string]: { normal: string; hover: string } } = {
      'ABS Warning': { normal: 'abs_status.svg', hover: 'abs_status_red.svg' },
      'Driver Alertness Warning':{ normal: 'cx_driver_alertness.svg', hover: 'cx_driver_alertness_red.svg'},
      'blind_spot_warning': { normal: 'cx_blind_spot.svg', hover: 'cx_blind_spot_red.svg' },
      'cx_collision_mitigation_brake_status': { normal: 'cx_collision_mitigation.svg', hover: 'cx_collision_mitigation_red.svg' },
      'fw_collision_audio_warning+warning_system': { normal: 'cx_forward_collision.svg', hover: 'cx_forward_collision_red.svg' },
      'cx_collision.cx_collision_severity': { normal: 'cx_collision_severity.svg', hover: 'cx_collision_severity_red.svg' },
      'cx_low_speed_collision_mitigation_system_status': { normal: 'cx_low_speed.svg', hover: 'cx_low_speed_red.svg' },
      'traction_control_brake': { normal: 'cx_tracktion_control.svg', hover: 'cx_tracktion_control_red.svg' },
      'Vehicle Tipped Over': { normal: 'cx_collision_tipped_over.svg', hover: 'cx_collision_tipped_over_red.svg' },
      'Auto Emergency Call': { normal: 'cx_auto_e_call.svg', hover: 'auto_e_call_red.svg' },
      'Airbag Engaged': { normal: 'seatbelt-black.svg', hover: 'seatbelt-red.svg' },
      'Multiple Collision Detected': { normal: 'restraint-black.svg', hover: 'restraint-red.svg' },
    };

    return isHovered && eventImages[eventType]?.hover
      ? `assets/images/signal-icons/${eventImages[eventType].hover}`
      : `assets/images/signal-icons/${eventImages[eventType]?.normal}`;
  }


    // Function to extract event type from the event string
    extractEventType(event: string): string {
      const match = event.match(/direct - ([^,]+)/);
      return match ? match[1].trim() : event; // Extract event type or return full string as fallback
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
    this.collisionComponentData()
    this.monthlyChart()
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.collisionComponentData()
    this.monthlyChart()
  }


  clearFleetSelection() {
      this.monthlyChart()
  }

  maskVinNumberr(vin: string): string {
    return vin.length === 17 ? vin.slice(0, 13).replace(/./g, '*') + vin.slice(13) : vin;
  }

  onTimePeriodChangeData(selectedPeriod: string) {
    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedTimePeriod) {
      this.collisionComponentData()
    }
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


  filteredTableData: any[] = [];
  collisionComponentData() {
    this.subscription$.add(
      this.dashboardservice.collsionReportData(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriod).subscribe((res: any) => {
        this.detailData = res;
        this.tableData = res?.collisionData || [];
        this.updateTime()
        this.filteredTableData = [...this.tableData];
      })
    );
  }

  getExtractedEventType(warnings: any): string {
    if (typeof warnings === 'string') {
      try {
        const parsedWarnings = JSON.parse(warnings.replace(/'/g, '"')); // Convert single quotes to double quotes
        return Array.isArray(parsedWarnings) && parsedWarnings.length ? parsedWarnings[0] : '';
      } catch (error) {
        console.error('Error parsing detectedWarnings:', error);
        return '';
      }
    }
    return Array.isArray(warnings) && warnings.length ? warnings[0] : '';
  }
  filterTableData() {
    const searchTerm = this.searchbyVinNumber?.toLowerCase() || '';

    // Filter by VIN or Vehicle Name
    this.filteredTableData = this.tableData.filter(data =>
      data.vin?.toLowerCase().includes(searchTerm) ||
      data.vehicleName?.toLowerCase().includes(searchTerm)
    );

    // Sort by latest event if the ng-select option is chosen
    if (this.isEventSort) {
      this.filteredTableData.sort((a, b) => {
        const dateA = new Date(`${a.eventDate} ${a.eventTime} CDT`).getTime();
        const dateB = new Date(`${b.eventDate} ${b.eventTime} CDT`).getTime();
        return this.isEventSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    // **Filter by Event Type**
    if (this.searchByStatus && this.searchByStatus.length > 0) {
      this.filteredTableData = this.filteredTableData.filter(data =>
        this.searchByStatus.includes(this.extractEventType(data.event))
      );
    }
    if (this.searchByWarning && this.searchByWarning.length > 0) {
      this.filteredTableData = this.filteredTableData.filter(data =>
        this.searchByWarning.includes(this.extractEventType(data.event))
      );
    }
  }


  eventOptions = [
    { id: 'select_all', name: 'Select All' },  // Added Select All
    { id: 'Airbag Engaged', name: 'Airbag Engaged' },
    { id: 'Auto Emergency Call', name: 'Auto Emergency Call' },
    { id: 'Multiple Collision Detected', name: 'Multiple Collision Detected' },
    { id: 'Vehicle Tipped Over', name: 'Vehicle Tipped Over' },
 ];

 waringOptions = [
  { id: 'ABS Warning', name: 'ABS Warning' },
  { id: 'Airbag Triggered Warning', name: 'Airbag Triggered Warning' },
  { id: 'Bilnd Spot Warning', name:'Bilnd Spot Warning'},
  { id: 'Collision Mitigation Brake Warning', name: 'Collision Mitigation Brake Warning' },
  { id: 'Driver Alertness Warning', name: 'Driver Alertness Warning' },
  { id: 'Forward Collision Audio Warning', name: 'Forward Collision Audio Warning' },
  { id: 'Restraints Engaged Warning', name: 'Restraints Engaged Warning' },
  { id: 'Traction Control Brake Warning', name: '	Traction Control Brake Warning' },
 ]

 searchByStatus: string[] = [];
 searchByWarning: string[] = [];

toggleSelectAll(item: any, event: Event) {
    event.stopPropagation(); // Prevent dropdown from closing

    if (item.id === 'select_all') {
        if (this.searchByStatus.length === this.eventOptions.length - 1) {
            this.searchByStatus = []; // Deselect All
        } else {
            this.searchByStatus = this.eventOptions
                .filter(option => option.id !== 'select_all')
                .map(option => option.id); // Select All
        }
    }

    this.filterTableData();
}

toggleSelectAlls(item: any, event: Event) {
  event.stopPropagation(); // Prevent dropdown from closing

  if (item.id === 'select_all') {
      if (this.searchByWarning.length === this.eventOptions.length - 1) {
          this.searchByWarning = []; // Deselect All
      } else {
          this.searchByWarning = this.eventOptions
              .filter(option => option.id !== 'select_all')
              .map(option => option.id); // Select All
      }
  }

  this.filterTableData();
}

  isEventSort: 'asc' | 'dsc' | null = null;
  sortByEventDateTime() {
    this.isEventSort = this.isEventSort === 'asc' ? 'dsc' : 'asc';
    this.filterTableData(); // Reapply filtering and sorting
  }
  parseDtcCode(dtcString: string): string {
    try {
      const dtcArray = JSON.parse(dtcString.replace(/'/g, '"')); // Convert to a valid JSON array
      return dtcArray.length > 0 ? dtcArray[0] : ''; // Show the first DTC code
    } catch (error) {
      return ''; // Return empty if parsing fails
    }
  }
  async monthlyChart() {
    this.subscription$.add(
      this.dashboardservice.collisionMonthlyTrends(this.customConsumer, this.fleetIdData, this.groupIdData, this.selectedTimePeriodss)
        .subscribe((res: any) => {
          let tripResult = res.allEvents || [];
          this.highLowChart(tripResult);
        }, err => {
          console.error("Error fetching data:", err);
        })
    );
  }
  highLowChart(data) {
    if (!Array.isArray(data) || data.length === 0) {
      this.chartOptions = {
        series: [],
        chart: {
          height: 0,
          width: 0,
          type: 'area',
        },
      };
      return;
    }

    let labelDatas: string[] = [];
    let seriesDatas: number[] = [];

    // Sort by yearMonth (YYYY-MM format)
    data.sort((a, b) => {
      const [yearA, monthA] = a.yearMonth.split("-").map(Number);
      const [yearB, monthB] = b.yearMonth.split("-").map(Number);
      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });

    // Process data
    data.forEach((item) => {
      const [year, month] = item.yearMonth.split("-").map(Number);
      const formattedDate = new Date(year, month - 1, 1)
        .toLocaleString('default', { month: 'short' }) + " '" + year.toString().slice(2);

      labelDatas.push(formattedDate);

      let eventsCount = Array.isArray(item.eventsCount) ? item.eventsCount[0] : item.eventsCount;
      seriesDatas.push(eventsCount ? parseFloat(eventsCount.toFixed(0)) : 0);
    });

    const maxTripCount = Math.max(...seriesDatas, 10);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;

    this.chartOptions = {
      series: [{ name: 'Total Trips', data: seriesDatas }],
      colors: ["#0000FF"],
      chart: {
        height: 300,
        type: 'area',
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: 'smooth' },
      grid: { show: false },
      xaxis: {
        categories: labelDatas,
        title: { text: "Month", offsetX: -10, offsetY: -13 },
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: "#000000", fontSize: '16px', fontWeight: 500, cssClass: "chart-label-x" },
        },
      },
      yaxis: {
        title: { text: "Total Events Detected", offsetX: -8 },
        min: 0,
        max: yAxisMax,
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
          const value = series[seriesIndex][dataPointIndex];
          const backgroundColor = '#0000ff';

          return `
            <div style="background-color: ${backgroundColor}; color: white; font-family: 'Poppins'; font-size: 12px; padding: 8px 12px; border-radius: 8px;">
              <strong>Total Events Detected: </strong> ${value.toLocaleString()}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid ${backgroundColor};"></div>
            </div>
          `;
        },
      },
    };
  }
  async onTimePeriodChanges(event: number) {
    this.selectedTimePeriodss = event;
    if (event === 1) {
      this.monthlyChart()
    }
    else {
      this.monthlyChart()
    }
  }
  convertUtcToCST(utcTimeStr: string): string {
    // Ensure the date is parsed as UTC
    const utcDate = new Date(utcTimeStr + "Z");

    const options: Intl.DateTimeFormatOptions = {
      timeZone: "America/Chicago", // CST/CDT timezone
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Use 24-hour format
    };

    return new Intl.DateTimeFormat("en-US", options).format(utcDate).replace(",", "") + " CST/CDT";
  }
  convertIstToUtc(istTimeStr: string): string | null {
    if (istTimeStr) {
      let istDate = new Date(istTimeStr);
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
    return null;
  }
  event_marker: { latitude: number; longitude: number; iconUrl: string } | null = null;
  collisionSummaryReportDownload(data: any) {
    this.dataShow = true;
    const { vin, eventDate, eventTime, tripId, event, eventLocation, eventLat, eventLong } = data; // Corrected parameter order

    this.subscription$.add(
      this.dashboardservice.collsionReportDownload(
        this.customConsumer,
        vin,
        eventDate,
        eventTime,
        tripId,
        this.extractEventType(event), // Ensure correct eventType mapping
        eventLocation,
        eventLat,  // Corrected: eventLat before eventLong
        eventLong  // Corrected: eventLong after eventLat
      ).subscribe((res: any) => {
        this.downloadReport = res;
        this.updateTime();
        this.selectedVin = this.downloadReport.vin
        this.dataShow = true;
        this.dataForTable = this.downloadReport.tripSummary?.flat() || [];
        this.updateTime();// Avoid potential errors if undefined
        this.eventTripSnapshot = this.downloadReport.eventTripSnapshot?.[0] || null;

        setTimeout(() => {
          this.generatePDF();
        }, 1000);

        if (this.eventTripSnapshot && this.eventTripSnapshot.tripLatLongs?.length > 0) {
          const tripLatLongs = this.eventTripSnapshot.tripLatLongs;

          // Store waypoints for polyline
          this.waypoints = tripLatLongs.map(coord => ({
            latitude: coord[0],
            longitude: coord[1]
          }));

          this.start_end_mark = [
            {
              latitude: tripLatLongs[0][0],
              longitude: tripLatLongs[0][1],
              iconUrl: 'assets/mapIcon/startPoint.svg'
            },
            {
              latitude: tripLatLongs[tripLatLongs.length - 1][0],
              longitude: tripLatLongs[tripLatLongs.length - 1][1],
              iconUrl: 'assets/mapIcon/endPoint.svg'
            }
          ];
        }
        if (eventLat && eventLong) {
          this.event_marker = {
            latitude: eventLat,
            longitude: eventLong,
            iconUrl: 'assets/mapIcon/markers.png'
          };
        }
      })
    );
  }
  generatePDF() {
    const element = this.pdfContent.nativeElement; // Ensure this contains the map
    const mapElement = document.getElementById('map'); // Your Google Map container

    if (!mapElement) {
      console.error('Map element not found!');
      return;
    }

    setTimeout(() => {
      html2canvas(element, {
        scale: 2,
        useCORS: true, // Helps with cross-origin issues
        logging: true, // Debugging
        backgroundColor: null, // Transparent background
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', [297, 700]);

        const imgWidth = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Event_Report_${this.selectedVin}.pdf`);
      });
    }, 1500); // Give time for Google Maps to fully render
  }


  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    },10);
    // this.updateDasboard()
  }


  ngOnDestroy(): void {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }
}
