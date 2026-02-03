import { Component, OnInit, TemplateRef, ViewChild,NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { TripReportService } from 'src/app/pages/dashboards/trip-report.service';

@Component({
  selector: 'app-vehicle-alerts',
  templateUrl: './vehicle-alerts.component.html',
  styleUrls: ['./vehicle-alerts.component.scss']
})
export class VehicleAlertsComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  @ViewChild('remarks', { static: true }) remarks!: TemplateRef<any>;
  searchByOem: any
  searchByStatus: any
  btnstatus: boolean = false
  searchText: string
  sortByStatus: boolean = false;
  searchFleets: String
  selectedFailureReason: string | null = null;

  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  oem: string[];
  allOem: string[]
  selectedPeriod: any;
  manageVehicleList: any[] = [];
  loading: boolean = false
  vins: any = []
  AddFleetIdEnroll: any;
  consumerData: any;
  pageSize: number = 10;
  pageNumber: number = 1;
  totalPages: number = 5;
  pages: any[] = [];

  temp: any[];
  searchByConsumer: any
  fleetList: any;
  fleetIdData: null;
  activeVehicless: any;
  mileDriven: any;
  tripData: any;
  isAscendings = true;
  totalTripsDetails: any;
  displayVehicles: any[];
  totalDistance: any;
  totalTripCounts: any;
  manageList: number;
  totalVinCount: number;
  fleetSumamryTotalData: any;
  isLoading: boolean = false;
  fleetIdValueNew: any;
  isDataNotFound: boolean = false;
  totalFuelConsumedCost: any;
  totalFuelConsumed: any;
  totalTimePeriods:any;
  totalMileage:any;
  avgFuelCost:any
  isloading2:boolean = false;
  tripSummaryData:any;
  tripDataNew: any;
  wayPoints: any;
  currentMapType: string = 'roadmap';
  driverList:any;
    start_end_mark = [];
    dataMake: any;
    getDataVinSumamry: any;
    @ViewChild('nodatafound') nodatafound: any
    lat: any;
    lng: any;
    zoom = 11; // Example zoom level
    distance: any;
    fuelConsumed: any;
    expandedRowIndex: number = -1;
    selectedVin: string;
    selectedDriver:string;
    selectedDriverId: string;
    vinList:any;
    vehicleAlertSummary:any;
    vehicleAlertList:any;
    tripTimeZones: { [tripId: string]: string } = {}; // Store timezone for each trip
  timePeriods = [
    // { label: 'Till Date', value: 'tilldate' },
    { label: 'Today', value: 'today' },
    { label: 'Current Week', value: 'weekly' },
    { label: 'Current Month', value: 'monthly' },
    { label: 'Previous Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'customRange' },
  ];
 timeZones = [
    { key: "PST", value: "Pacific Standard Time" },
    { key: "PDT", value: "Pacific Daylight Time" },
    { key: "EST", value: "Eastern Standard Time" },
    { key: "EDT", value: "Eastern Daylight Time" },
    { key: "CST", value: "Central Standard Time" },
    { key: "CDT", value: "Central Daylight Time" },
    { key: "MST", value: "Mountain Standard Time" },
    { key: "MDT", value: "Mountain Daylight Time" },
    { key: "GMT", value: "Greenwich Mean Time" },
    { key: "IST", value: "Indian Standard Time" },
    { key: "UTC", value: "Coordinated Universal Time" }
  ];


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
trips: any;
  constructor(private modalService: NgbModal, private _vehicleService: TaxonomyService, private route: ActivatedRoute, private router: Router, private spinner: NgxSpinnerService,  public http: HttpClient,private tripReportService:TripReportService,private ngZone: NgZone) {
    this.route.queryParams.subscribe(params => {
      this.searchByConsumer = params['consumer'];
    });
    this.route.queryParams.subscribe(params => {
      if (params) {
        this.searchFleets = params['fleetId'];
        this.AddFleetIdEnroll = params['fleetId'] ? params['fleetId'] : '';
      }
    });
  }

  ngOnInit() {
    this.showRole();
    this.selectConsumers();
    this.loadVinList();
    this.loadDriverList();
    this.selectedPeriod = 'weekly';
    this.onTimePeriodChangeData(this.selectedPeriod);
    if (!this.searchByConsumer) {
      this.searchByConsumer = 'All';
    }
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
    }
  }

  selectConsumers() {
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    this.subscription$.add(
      this._vehicleService.getFleetList(this.customConsumer).subscribe((res: any) => {
        this.fleetList = Array.isArray(res) ? [...res] : [];
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id });
      })
    );
  }

  selectFleetId() {
    this.loadVinList();
    this.loadDriverList();
    this.onTimePeriodChangeData(this.selectedPeriod);
  }

  clearFleetSelection() {
    this.fleetIdData = null;
    this.loadVinList();
    this.loadDriverList();
    this.onTimePeriodChangeData(this.selectedPeriod);
  }


  vinSummary(selectedVin: string, selectedOem: string): void {
    this.spinner.show()
    this._vehicleService.eligibilityCheck(selectedVin).subscribe((data: any) => {
      this.router.navigate(['/adlp/admin/manageVehicle/vinSummary'], {
        queryParams: { vin: selectedVin, provider: selectedOem, data: JSON.stringify(data) }
      });
      this.spinner.hide()
    }, (error: any) => {
    });
  }
  // VIN Summary function end
  // VIN History function
  viewMore(selectedVin: string, selectedOem: string): void {
    this.spinner.show()
    this._vehicleService.eligibilityCheck(selectedVin).subscribe((data: any) => {
      this.router.navigate(['/adlp/admin/manageVehicle/vinHistory'], {
        queryParams: { vin: selectedVin, provider: selectedOem, data: JSON.stringify(data) }
      });
      this.spinner.hide()
    }, (error: any) => {
    });
  }
  getTimeZoneKey(value: string): string | undefined {

    const zone = this.timeZones.find(zone => zone.value === value);

    return zone ? zone.key : undefined;
  }


  getAllProvider() {
    this.subscription$.add(
      this._vehicleService.oemNewData(this.customConsumer).subscribe((res: any) => {
        this.oem = res[this.customConsumer]
      }, err => {
        this.spinner.hide()
      })
    )
  }
  getAllProviderConsumer() {
    this.subscription$.add(
      this._vehicleService.oemNewData(this.customConsumer).subscribe((res: any) => {
        this.allOem = res[this.customConsumer]
      }, err => {
        this.spinner.hide()
      })
    )
  }

  ngOnDestroy() {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }

  selectedTimePeriod: string = '';
  isCardOpen = false;

  openCard() {
    this.isCardOpen = true;
  }

  closeCard() {
    this.isCardOpen = false;
  }
  onTimePeriodChangeData(selectedPeriod: string): void {
    console.log(selectedPeriod,"esrw");
    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }
    //this.isCardOpen = selectedPeriod === 'customRange'; // When custom range is selected, show custom date input
    this.loadTripSummary(this.pageNumber, this.pageSize);
  }

  selectedOption: string = 'customRange';
  fromDate: string = '';
  toDate: string = '';
  cards: any[] = []; // Declare cards here to hold the data

  // Handles the selection of the time period and updates the displayed data accordingly
  handleOption(option: string): void {
    this.selectedOption = option;
    this.selectedPeriod = this.timePeriods.find(period => period.value === option)?.value || '';
    this.onTimePeriodChangeData(this.selectedPeriod);
  }

  // Handles the custom date range selection
  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {

    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
    const dateDifference = this.calculateDateDifference(this.fromDate, this.toDate);
    // When custom range is selected, update the card values accordingly
    this.updateCardValuesBasedOnRange(this.cards, dateDifference);// Pass the cards to the function
  }
  calculateDateDifference(fromDate: string, toDate: string): any {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffInMs = to.getTime() - from.getTime();

    // Convert milliseconds to days, hours, minutes
    const days = Math.floor(diffInMs / (1000 * 3600 * 24));
    const hours = Math.floor((diffInMs % (1000 * 3600 * 24)) / (1000 * 3600));
    const minutes = Math.floor((diffInMs % (1000 * 3600)) / (1000 * 60));

    return { days, hours, minutes };
  }


  // Updates card values based on the selected date range
  updateCardValues(cards: any[]): void {
    cards.forEach(card => {
      switch (card.title) {
        case 'Total Duration':
          this.totalTimePeriods = card.values[this.selectedTimePeriod] || null;
          break;
        case 'Fuel Consumed':
          this.totalFuelConsumed = card.values[this.selectedTimePeriod] || null;
          this.isDataNotFound = this.totalFuelConsumed === null;
          break;
        case 'Mileage':
          this.totalMileage = card.values[this.selectedTimePeriod] || null;
          break;
        case 'Fuel Cost':
          this.totalFuelConsumedCost = card.values[this.selectedTimePeriod] || null;
          break;
        case 'Avg. Fuel Cost Per Mile':
          this.avgFuelCost = card.values[this.selectedTimePeriod] || null;
          break;
        default:
          break;
      }
    });
  }

  // Update values dynamically for custom range
  updateCardValuesBasedOnRange(cards: any[],dateDifference: any): void {


    // Example dummy logic for custom range calculation
    const customDuration = this.calculateDurationBasedOnDateDiff(dateDifference);
  const customFuelConsumed = this.calculateFuelConsumedBasedOnDateDiff(dateDifference);
  const customMileage = this.calculateMileageBasedOnDateDiff(dateDifference);
  const customFuelCost = this.calculateFuelCostBasedOnDateDiff(dateDifference);
  const customAvgFuelCost = this.calculateAvgFuelCostBasedOnDateDiff(dateDifference);

    // Update the customRange values in the cards
    cards.forEach(card => {
      switch (card.title) {
        case 'Total Duration':
          card.values['customRange'] = customDuration;
          break;
        case 'Fuel Consumed':
          card.values['customRange'] = customFuelConsumed;
          break;
        case 'Mileage':
          card.values['customRange'] = customMileage;
          break;
        case 'Fuel Cost':
          card.values['customRange'] = customFuelCost;
          break;
        case 'Avg. Fuel Cost Per Mile':
          card.values['customRange'] = customAvgFuelCost;
          break;
        default:
          break;
      }
    });

    // After updating, refresh the view with the updated data
    this.updateCardValues(cards);
  }

  // Dummy calculation methods (replace with actual logic)
  // Calculate duration based on the date difference (e.g., hours:minutes)
calculateDurationBasedOnDateDiff(dateDifference: any): string {
  const totalHours = (dateDifference.days * 24) + dateDifference.hours;
  return `${totalHours}:${dateDifference.minutes}`;
}

// Calculate fuel consumed based on the date difference
calculateFuelConsumedBasedOnDateDiff(dateDifference: any): number {
  // Assuming average consumption per day
  const averageFuelPerDay = 20; // Example: 20 gallons per day
  const totalFuelConsumed = averageFuelPerDay * dateDifference.days + (averageFuelPerDay / 24) * dateDifference.hours;
  return totalFuelConsumed;
}

// Calculate mileage based on the date difference
calculateMileageBasedOnDateDiff(dateDifference: any): number {
  // Assuming average mileage per day
  const averageMileagePerDay = 18; // Example: 18 miles per day
  const totalMileage = averageMileagePerDay * dateDifference.days + (averageMileagePerDay / 24) * dateDifference.hours;
  return totalMileage;
}

// Calculate fuel cost based on the date difference
calculateFuelCostBasedOnDateDiff(dateDifference: any): number {
  // Assuming an average cost per gallon
  const averageCostPerGallon = 3.5; // Example: $3.5 per gallon
  const totalFuelConsumed = this.calculateFuelConsumedBasedOnDateDiff(dateDifference);
  return totalFuelConsumed * averageCostPerGallon;
}

// Calculate average fuel cost per mile based on the date difference
calculateAvgFuelCostBasedOnDateDiff(dateDifference: any): number {
  // Use total fuel cost and mileage to calculate average fuel cost per mile
  const totalFuelCost = this.calculateFuelCostBasedOnDateDiff(dateDifference);
  const totalMileage = this.calculateMileageBasedOnDateDiff(dateDifference);
  return totalFuelCost / totalMileage;
}

  // Add this utility function to your component
private formatDateTime(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),  // Months are 0-based
    pad(date.getUTCDate())
  ].join('-') + 'T' + [
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds())
  ].join(':');
}

// Update your date range calculation
private calculateDateRange(period: string): { startDate: string, endDate: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date();

  switch(period) {
    case 'tilldate':
      startDate = new Date(Date.UTC(2000, 0, 1));
      break;
    case 'today':
      startDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));
      endDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23, 59, 59
      ));
      break;
    case 'weekly':
      startDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - now.getUTCDay()
      ));
      break;
    case 'monthly':
      startDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1
      ));
      endDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        0,
        23, 59, 59
      ));
      break;
    case 'lastmonth':
      startDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 1,
        1
      ));
      endDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        0,
        23, 59, 59
      ));
      break;
    case 'customRange':
      startDate = new Date(`${this.fromDate}T00:00:00`); // Convert to UTC
      endDate = new Date(`${this.toDate}T23:59:59`); // End of the selected da

      break;
    default:
      startDate = new Date(Date.UTC(2000, 0, 1));
      break;
  }

  return {
    startDate: this.formatDateTime(startDate),
    endDate: this.formatDateTime(endDate)
  };
}
alertTypeList = [
  { label: 'Emergency', value: 'emergency' },
  { label: 'High Priority', value: 'high' },
  // { label: 'Geofence', value: 'geofence' },
  { label: 'Information Only', value: 'information' }
];
onAlertTypeChange() {
  console.log('Selected Alert Type:', this.selectedAlertType);
  // Optional: filter table or perform action
}

selectedAlertType: any = null;
loadTripSummary(page: number, size: number): void {
  this.isLoading = true;
  this.spinner.show();

  // Get date range based on selected period
  const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);

  // Build filters object
  const filters: any = {};
  if (this.fleetIdData) {
    filters.fleetId = this.fleetIdData;
  }
  if (this.selectedDriverId) {
    filters.driverId = this.selectedDriverId;
  }
  if (this.selectedVin) {
    filters.vin = this.selectedVin;
  }

  this._vehicleService.fetchAlertList(
    filters,
    startDate,
    endDate,
    ['VEHICLE_HEALTH'],
    page - 1,
    size
  ).subscribe({
    next: (response) => {
      this.vehicleAlertSummary= response.summary;
      this.vehicleAlertList = response.alerts;
      this.totalPages = response.totalPages;
      this.getPagination(this.pageNumber);



      // Hide the spinner and set loading to false
      this.spinner.hide();
      this.isLoading = false;
    },
    error: (err) => {


      // Hide the spinner and set loading to false
      this.spinner.hide();
      this.isLoading = false;
    }
  });
}


  filterByVin() {
    this.loadTripSummary(this.pageNumber, this.pageSize);

    // Implement your filtering logic here
  }
  filterByDriver() {
    this.loadTripSummary(this.pageNumber, this.pageSize);

    // Implement your filtering logic here
  }
  // private convertToLocalTime(utcTimeStr: string, timezone: any, duration?: number): string {
  //   try {
  //     const utcDate = new Date(utcTimeStr);
  //     const totalOffset = (timezone.rawOffset + timezone.dstOffset) * 1000;
  //     const localTime = new Date(utcDate.getTime() + totalOffset);

  //     // If duration is provided, add it to get end time
  //     if (duration) {
  //       localTime.setSeconds(localTime.getSeconds() + duration);
  //     }

  //     console.log('Time conversion:', {
  //       utcTime: utcTimeStr,
  //       timezone: timezone.timeZoneId,
  //       timeZoneName: timezone.timeZoneName,
  //       rawOffset: timezone.rawOffset,
  //       dstOffset: timezone.dstOffset,
  //       duration: duration,
  //       localTime: localTime.toISOString()
  //     });

  //     // Format the local time with timezone name
  //     const options: Intl.DateTimeFormatOptions = {
  //       year: 'numeric',
  //       month: 'long',
  //       day: 'numeric',
  //       hour: 'numeric',
  //       minute: '2-digit',
  //       hour12: true
  //     };

  //     // Get city name from timeZoneId
  //     const city = timezone.timeZoneId.split('/')[1].replace(/_/g, ' ');

  //     // Use the timeZoneName from Google API response
  //     return `${localTime.toLocaleString('en-US', options)} (${this.getTimeZoneKey(timezone.timeZoneName)})`;

  //   } catch (error) {
  //     console.error('Error converting time:', error);
  //     return utcTimeStr;
  //   }
  // }
  getTripHistoryDetails(selectedVin: string, selectedOem: string, tripId: string): void {
    this.tripDataNew = [];
    this._vehicleService.gettripSummaryHistory(selectedVin, selectedOem, tripId).subscribe(
      (res: any) => {
        this.tripDataNew = res;
        this.wayPoints = res.cxSnappedCoords.filter(coords => !isNaN(coords[0]) && !isNaN(coords[1]));
        this.start_end_mark = [];
        this.start_end_mark.push([
          this.wayPoints[0][0],  // Latitude of the first waypoint
          this.wayPoints[0][1],  // Longitude of the first waypoint
          { 'iconUrl': 'assets/mapIcon/startPoint.svg' }
        ]);
        this.start_end_mark.push([this.wayPoints[this.wayPoints.length - 1][0], this.wayPoints[this.wayPoints.length - 1][1], { 'iconUrl': 'assets/mapIcon/endPoint.svg' }]);
        this.lat = this.wayPoints[this.wayPoints.length - 1][0];
        this.lng = this.wayPoints[this.wayPoints.length - 1][1];
        this.distance = ((this.tripDataNew?.cxTripDistance) * 0.621371).toFixed(2);
        this.fuelConsumed = (this.tripDataNew?.cxFuelConsumed * 0.264172).toFixed(2);
      });
  }
  convertUTCToTimestamp(utcDateTime: string): number {     // Ensure proper UTC date
    const utcDate = new Date(utcDateTime); // No need to append 'Z' if already in ISO format
    return utcDate.getTime(); // Return timestamp
   }


    // Convert UTC timestamp to local time based on time zone
    convertToLocalTime(utcTimestamp: number, timezoneData: any): string {
      if (!timezoneData || !timezoneData.timeZoneName) {

          return 'Invalid Timezone';
      }
      // Correct offset calculation
      const totalOffsetMs = (timezoneData.rawOffset + timezoneData.dstOffset) * 1000;
      const localTimestamp = utcTimestamp + totalOffsetMs;

      const localTime = new Date(localTimestamp);

      // Format time without specifying an invalid timeZone
      const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
      };

      return `${localTime.toLocaleString('en-US', options)}  (${this.getTimeZoneKey(timezoneData.timeZoneName)})`;
  }



  private getTimezoneFromCoordinates(lat: number, lng: number, callback: (timezone: any) => void): void {


    const timestamp = Math.floor(Date.now() / 1000);


    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lng},${lat}&timestamp=${timestamp}&key=AIzaSyBNwm8gkVLJMsKn6crHaFZ4tCKvihwy6Bg`;


    this.http.get(url).subscribe(
      (response: any) => {
        this.ngZone.run(() => {
          if (response.status === 'OK') {

            // Pass the timeZoneName along with other data
            callback({
              timeZoneId: response.timeZoneId,
              timeZoneName: response.timeZoneName,
              rawOffset: response.rawOffset,
              dstOffset: response.dstOffset
            });
          } else {

            callback({
              timeZoneId: 'UTC',
              timeZoneName: 'Coordinated Universal Time',
              rawOffset: 0,
              dstOffset: 0
            });
          }
        });
      },
      (error) => {

        callback({
          timeZoneId: 'UTC',
          timeZoneName: 'Coordinated Universal Time',
          rawOffset: 0,
          dstOffset: 0
        });
      }
    );
  }
  toggleExpand(index: number) {
    if (this.expandedRowIndex === index) {
      this.expandedRowIndex = -1;
    } else {
      this.expandedRowIndex = index;
    }
  }
  loadVinList(): void {
    const consumer = this.customConsumer || 'Smallboard';
    const fleetId = this.fleetIdData || this.fleetIdValueNew || '';
    const startDate = '';
    const endDate = '';

    this._vehicleService.getManageListDownloadConsumers(consumer, fleetId, startDate, endDate)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.vinList = response.map((item) => ({
              vin: item.vin,
              alias: item.alias || item.vin
            }));
          }
        },
        error: (error) => {

        }
      });
  }
  loadDriverList(): void {
    const consumerId = this.customConsumer || '877634';
    const fleetId = this.fleetIdData || this.fleetIdValueNew || '';

    this.spinner.show();

    this._vehicleService.getAssignDrivers(consumerId, fleetId).subscribe({
      next: (response: any[]) => {
        this.driverList = response.map((item) => {
          const vinObj = item.vins?.[0]; // Taking the first VIN

          return {
            id: item.id,
            fullName: `${item.firstName} ${item.lastName}`,
            phoneNo: item.phoneNo,
            email: item.email,
            status: item.status,
            licenceNo: item.licenceNo,
            issueState: item.issueState,
            expiryDate: item.expiryDate,
            driverVin: vinObj?.vin || '',
            alias: vinObj?.alias || vinObj?.vin || '',
            associatedStart: vinObj?.associatedStart || '',
            associatedEnd: vinObj?.associatedEnd || '',
            available: item.available,
            fleetName: item.fleet?.name || '',
            consumerName: item.consumer?.name || ''
          };
        });

        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading driver list:', error);
        this.spinner.hide();
      }
    });
  }

   formatDuration(durationInSeconds) {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    let result = '';

    if (hours > 0) result += `${hours}h: `;
    if (minutes > 0 || hours > 0) result += `${minutes}m: `;
    result += `${seconds}s`;

    return result;
}
disabledAlertIds: Set<string> = new Set();

onAcknowledge(alertId: string): void {
  this.disabledAlertIds.add(alertId); // disable immediately
  this.acknowledgeAlert(alertId);
}

acknowledgeAlert(alertId: string): void {
  console.log('Acknowledging alert ID:', alertId);

  if (!alertId) {
    console.error('No alert ID provided.');
    return;
  }

  this._vehicleService.acknowledgeAlert(alertId).subscribe({
    next: (response) => {
      console.log('Alert acknowledged successfully:', response);
      //this.fetchAlerts(); // Optional: reload the list to update UI
    },
    error: (error) => {
      console.error('Failed to acknowledge alert:', error);
    }
  });
}


  toggleMapType(): void {
    this.currentMapType = this.currentMapType === 'roadmap' ? 'satellite' : 'roadmap';
  }
  alertMarkers: { lat: number; lng: number; iconUrl: string; title: string, }[] = [];
  // alertSegments: { start: [number, number]; end: [number, number], color: string;  }[] = [];
  alertSegments: { start: [number, number]; midpoints: [number, number][]; end: [number, number], color: string;  }[] = [];

  getPagination(page: number): void {
    this.pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      if (i < 5 || i > this.totalPages - 4 || (i >= page - 2 && i <= page + 2)) {
        this.pages.push(i);
      } else if (i === page - 3 || i === page + 3) {
        this.pages.push('...');
      }
    }
  }

  selectPages(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.pageNumber = page;
      this.loadTripSummary(this.pageNumber, this.pageSize);
      this.scrollToTop();
    }
  }

  selectPage(size: number): void {
    this.pageSize = size;
    this.loadTripSummary(this.pageNumber, this.pageSize);
  }

  scrollToTop(): void {
    const breadcrumbElement = document.querySelector('.page-content');
    if (breadcrumbElement) {
      breadcrumbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  formatDurationSeconds(durationInSeconds: number): string {
    const totalSeconds = durationInSeconds // Convert minutes to seconds

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60); // Round to avoid decimals

    let result = '';

    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${seconds}s`;

    return result.trim(); // Remove trailing space if seconds is the only value
  }
}
