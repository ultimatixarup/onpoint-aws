import { Component, OnInit, ViewChild, Injectable } from '@angular/core';
import { TaxonomyService } from '../../../taxonomy.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from 'src/app/app.service';
import { ActivatedRoute } from '@angular/router';
import { DatePipe,formatDate  } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NgbCalendar, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { VinService } from 'src/app/core/services/users-role.service';
import { TimezoneService } from 'src/app/layouts/user-role/users-role.service';
// import * as moment from 'moment-timezone';
@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
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
@Component({
  selector: 'app-vin-history',
  templateUrl: './vin-history.component.html',
  styleUrls: ['./vin-history.component.scss'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class VinHistoryComponent implements OnInit {
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
  model2: string;
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;
  show: boolean = true;
  hide: boolean = false;
  selectedVIN: string = ''
  totalTrips: number = 0;
  selectedMenuItem: string | null = null;
  subscription$: Subscription = new Subscription();
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  getData: any[] = [];
  selectedVin: string;
  startingAddress: any;
  endAddress: any;
  selectedOem: string;
  tripData: any;
  startingAddresses: string[] = []; // Change to array to store multiple addresses
  endAddresses: string[] = [];
  vin: string;
  data: any;
  months = [
    "Jan", "Feb", "Mar", "Apr", "May", "June",
    "July", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  dataShow: boolean = false;
  dataShowTrip: boolean = false
  dataHide: boolean = false;
  isExpand: false
  tableExpand: false;
  newSummary: any;
  tripDataNew: any;
  tripIds: string[] = [];
  getData1: any;
  oemSelection: any;
  expandedRowIndex: number = -1;
  expandedRow1Index: number | null = null;
  @ViewChild('nodatafound') nodatafound: any
  lat: any;
  lng: any;
  zoom = 15; // Example zoom level
  wayPoints: any;
  start_end_mark = [];
  dataMake: any;
  getDataVinSumamry: any;
  newTimeData: any;
  totalTimeNewData: string;
  averageTimeNewData: string;
  distance: any;
  fuelConsumed: any;
  fleetIdValueNew: any;
  noDataMessage: string = "";
  selectedVins: string;
  currentMapType: string = 'roadmap';
  eligibilityData: any;
  selectedAlias: any;
  polylineTitle: string;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  constructor(private timezoneService: TimezoneService,private ngbCalendar: NgbCalendar, private vinService: VinService, private AuthService: AuthenticationService
    , private dateAdapter: NgbDateAdapter<string>, private router: Router, private route: ActivatedRoute, private modalService: NgbModal, private http: HttpClient, private datePipe: DatePipe, private _vehicleService: TaxonomyService, private appService: AppService, private spinner: NgxSpinnerService) {
    this.selectedVins = this.vinService.getSelectedVin();
    this.route.queryParams.subscribe(params => {
      const selectedVin = params['vin']
      const selectedalias = params['alias']
      this.selectedVin = selectedVin
      this.selectedAlias = selectedalias
      const selectedOem = params['provider'];
      this.getTripHistorySummary(this.selectedVins, selectedOem);
    });
  }
  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }
  toggleMapType(): void {
    this.currentMapType = this.currentMapType === 'roadmap' ? 'satellite' : 'roadmap';
  }
  ngOnInit() {
    this.showRole()
    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.updateTripTimes(); // 🔁 Initial formatting
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;

      this.updateTripTimes(); // Update vehicle data when timezone changes
    });

  }
  updateTripTimes() {
    if (!this.getData || this.getData.length === 0) return;

    // Sort getData by yearMonth first
    this.getData.sort((a: any, b: any) => b.yearMonth.localeCompare(a.yearMonth));

    this.getData.forEach((month: any) => {
      if (!month.tripList || month.tripList.length === 0) return;

      month.tripList.forEach((trip: any) => {
        const startMoment = moment.utc(trip.startTimeStamp).tz(this.selectedTimezone);
        const endMoment = moment.utc(trip.endTimeStamp).tz(this.selectedTimezone);

        trip.formattedStartTime = startMoment.format('MMM D, YYYY, HH:mm');
        trip.formattedStartTimeNew = startMoment.format('MMM D, YYYY'); // Full date
        trip.formattedEndTime = endMoment.format('MMM D, YYYY, HH:mm');
        trip.formattedTimeEnd = endMoment.format('HH:mm');
        trip.formattedTimeStart = startMoment.format('HH:mm');
        trip.formattedStartTimeShort = startMoment.format('D MMM'); // Short date
      });
    });
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
  // for Onward connected month change
  convertToCDT(dateTime: string): string {
    if (!dateTime) return '';
    const utcDateTime = new Date(dateTime);
    const cdtOffset = -6 * 60;
    const cdtDateTime = new Date(utcDateTime.getTime() + (cdtOffset * 60 * 1000));
    cdtDateTime.setMinutes(cdtDateTime.getMinutes());
    const cdtHours = cdtDateTime.getHours().toString().padStart(2, '0');
    const cdtMinutes = cdtDateTime.getMinutes().toString().padStart(2, '0');
    return ` ${cdtHours}:${cdtMinutes}`;
  }
  convertToCDTOnward(dateTime: string): string {
    if (!dateTime) return '';
    const utcDateTime = new Date(dateTime);
    const cdtOffset = -6 * 60;
    const cdtDateTime = new Date(utcDateTime.getTime() + (cdtOffset * 60 * 1000));
    const cdtHours = cdtDateTime.getHours().toString().padStart(2, '0');
    const cdtMinutes = cdtDateTime.getMinutes().toString().padStart(2, '0');
    const time = `${cdtHours}:${cdtMinutes}`;
    const month = (cdtDateTime.getMonth() + 1).toString().padStart(2, '0');
    const day = cdtDateTime.getDate().toString().padStart(2, '0');
    const year = cdtDateTime.getFullYear();
    const date = `${month}-${day}-${year}`;

    // Combine and return the formatted date and time
    return `${time}, ${date}`;
  }


  // for Onward connected date change
  convertToCDTDate(dateTime: string): string {
    if (!dateTime) return '';
    const utcDateTime = new Date(dateTime);
    const cdtOffset = -5 * 60;
    const cdtDateTime = new Date(utcDateTime.getTime() + (cdtOffset * 60 * 1000));
    cdtDateTime.setMinutes(cdtDateTime.getMinutes());
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const cdtMonth = monthNames[cdtDateTime.getMonth()];
    const cdtDay = cdtDateTime.getDate().toString().padStart(2, '0');
    return `${cdtDay} ${cdtMonth}`;
  }
  // Toggle expand for VIN Summary
  toggleExpandRow1(): void {
    this.dataShow = true;
  }
  // Toggle expand for Trip Summary
  toggleHideRow1(): void {
    this.dataShow = false;
  }
  // Toggle expand for Trip Summary Row
  toggleExpandRow(index: number): void {
    if (this.expandedRowIndex === index) {
      this.expandedRowIndex = null;
    } else {
      this.expandedRowIndex = index;
    }
  }
  toggleExpand(index: number) {
    if (this.expandedRowIndex === index) {
      this.expandedRowIndex = -1;
    } else {
      this.expandedRowIndex = index;
    }
  }

  toggleExpands(index: number): void {
    this.expandedRow1Index = this.expandedRow1Index === index ? null : index;
  }

  // Time period change in VIN Summary Monthly, Weekly, Daily
  onPeriodChange(event: any) {
    const selectedPeriod = event.target.value;
    this._vehicleService.getVinSummarys(this.selectedVin, selectedPeriod).subscribe(
      (res: any) => {
        this.getDataVinSumamry = res;
        this.newTimeData = this.convertSecondsToHoursMinutes(this.getDataVinSumamry?.maxDuration);
        this.totalTimeNewData = this.convertSecondsToHoursMinutes(this.getDataVinSumamry?.totalDuration);
        this.averageTimeNewData = this.convertSecondsToHoursMinutes(this.getDataVinSumamry?.averageTime);

      },
      err => {
        this.spinner.hide();
        console.error('Error fetching VIN summary:', err);
      }
    );
  }
  convertNgbDateToMoment(date: NgbDateStruct): moment.Moment {
    return moment([date.year, date.month - 1, date.day]);
  }
  // Differece
  getTimeDifference(startTime: string, endTime: string): string {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime(); // Difference in milliseconds

      const hours = Math.floor(diffMs / (1000 * 60 * 60)); // Extract hours
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); // Extract minutes
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000); // Extract seconds

      return `${hours}h : ${minutes}m : ${seconds}s`;
    }
    return '';
  }
  calculateDuration(startTimeStamp: string | undefined, endTimeStamp: string | undefined): string {
    if (!startTimeStamp || !endTimeStamp) return '';
    const start = new Date(startTimeStamp);
    const end = new Date(endTimeStamp);
    const durationInMilliseconds = end.getTime() - start.getTime();
    if (durationInMilliseconds <= 0) return 'Invalid duration';
    const hours = Math.floor(durationInMilliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((durationInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hrs ${minutes} mins`;
  }
  // Download report date range selection
  downloadExcel() {
    const startDate = this.fromDate ? this.convertNgbDateToMoment(this.fromDate).format('YYYY-MM-DD') : null;
    const endDate = this.toDate ? this.convertNgbDateToMoment(this.toDate).format('YYYY-MM-DD') : null;
    this._vehicleService.getDownloadVinSummarys(this.selectedVin, startDate, endDate)
      .subscribe((data: any) => {
        if (data.length === 0) {
          this.noDataFounds(this.nodatafound);
        } else {
          this.generateExcel(data);
        }
      });
    this.fromDate = null;
    this.toDate = null;
  }
  async generateExcel(data: any[]) {
    const convertToHHMM = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    const formatTimestamp = (timestamp: string): string => {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${hours}:${minutes}; ${month}-${day}-${year}`;
    };


    const worksheetData = await Promise.all(
      data.map(async (item) => {
        const startAddress = await this.convertCoordinatesToAddress(item.startLatitudeLongitude);
        const endAddress = await this.convertCoordinatesToAddress(item.endLatitudeLongitude);
        const dateTimeUTC = moment.utc(item.startTimestamp);
        const formattedDate = dateTimeUTC.tz(this.selectedTimezone).format('MMM D, YYYY');
        const formattedTime = dateTimeUTC.tz(this.selectedTimezone).format('HH:mm');
        const timeOfRefueling = `${formattedDate} ${formattedTime}`;
        const dateTimeUTCEnd = moment.utc(item.endTimestamp);
        const formattedDateEnd = dateTimeUTCEnd.tz(this.selectedTimezone).format('MMM D, YYYY');
        const formattedTimeEnd = dateTimeUTCEnd.tz(this.selectedTimezone).format('HH:mm');
        const timeOfRefuelingEnd = `${formattedDateEnd} ${formattedTimeEnd}`;
        return {
          "Trip Id": item.tripId,
          "VIN": item.cxVin,
          "Vehicle Name": item.alias,
          "OEM": item.cxVehicleOem,
          "Trip Start Time (HH:MM; MM-DD-YYYY)": `${timeOfRefueling}`,
          "Trip End Time (HH:MM; MM-DD-YYYY)":`${timeOfRefuelingEnd}`,
          "Start address": item.startAddress,
          "End address": item.endAddress,
          "Trip Start Odometer Reading (Miles)": item.startOdometer.toFixed(2),
          "Trip End Odometer Reading (Miles)": item.endOdometer.toFixed(2),
          "Trip Distance (Miles)": item.tripDistance.toFixed(2),
          "Average Vehicle Speed (MPH)": item.avgVehicleSpeed.toFixed(2),
          "Count of Harsh Acceleration Events": item.rapidAccelerationCount,
          "Count of Harsh Braking Events": item.harshBrakingCount,
          "Count of Harsh Cornering Events": item.harshCorneringCount,
          "Driver Seatbelt Violation Count": item.driverViolations,
          "Passenger Seatbelt Violation Count": item.passengerViolations,
          "Duration Idled (HH:MM)": convertToHHMM(item.idlingDuration),
          "Duration Driven at Night (HH:MM)": convertToHHMM(item.nightPerc),
          "Distance to Service (Miles)": item.distService === -1 ? 'NA' : item.distService,
          "Average Battery Level (%)": item.avgBatteryLevel === -1 ? 'NA' : item.avgBatteryLevel,
          "Average Coolant Temperature (oF)": item.avgCoolantTemp,
          "Vehicle Passenger Occupancy": item.occupancy,
          "Trip Duration (HH:MM)": convertToHHMM(item.duration),
          "Remaining Fuel Percentage (%)": item.fuelPercentageRemaining,
          "Fuel Level": item.fuelLevel,
          "Fuel Consumed": item.fuelConsumed.toFixed(2),
          "Distance Driven at Night (Miles)": item.nightDistance,
          "Cost of Fuel Used ($)": item.fuelUsedCost,
          "Alerts": item.alerts,
          "Distance Travelled (Miles)": item.os80.toFixed(2),
            "Indicator": item.fuelIndicator === 'absolute' ? 'gal' : '%'
        };
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trip Details');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trip-details.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }
  // Get Trip History Summary and VIN History Sumamry
  numbersOnlyUpto(event: any) {
    const pattern = /[0-9, A-Z, a-z]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
  // Mask VIN number
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
  startTime: Date;
  endTime: Date
  tripStartTime: any
  tripEndTime: any

  getTripHistorySummary(selectedVin: string, selectedOem: string): void {
    this.spinner.show();

    this._vehicleService.gettripSummary(selectedVin, selectedOem).subscribe((res: any) => {
      this.eligibilityData = res;
      this.getData = this.eligibilityData?.yearMonthWiseTripList;
      const startDate = new Date('2024-12-01');
      const endDate = new Date('2025-12-31');

      // Filter trips within date range
      const filteredTrips = res.yearMonthWiseTripList
        .flatMap((month: any) => month.tripList)
        .filter((trip: any) => {
          const tripStartTime = new Date(trip.startTimeStamp);
          const tripEndTime = new Date(trip.endTimeStamp);
          return tripStartTime >= startDate && tripEndTime <= endDate;
        });

      // Group trips by year-month
      const groupedByMonth: { [key: string]: any[] } = {};
      for (const trip of filteredTrips) {
        const yearMonth = moment.utc(trip.startTimeStamp)
          .tz(this.selectedTimezone)
          .format('YYYY-MM');

        if (!groupedByMonth[yearMonth]) {
          groupedByMonth[yearMonth] = [];
        }
        groupedByMonth[yearMonth].push(trip);
      }

      this.getData = Object.entries(groupedByMonth).map(([yearMonth, tripList]) => {
        const monthDataFromApi = res.yearMonthWiseTripList.find((m: any) => m.yearMonth === yearMonth);
        return {
          yearMonth,
          tripList,
          tripCount: tripList.length,
          miles: monthDataFromApi ? monthDataFromApi.miles : 0,  // ✅ Direct miles from API
          isDropdownOpen: false,
          cxRapidAccelerationCount: tripList.reduce((sum, trip) => sum + Number(trip.cxRapidAccelerationCount || 0), 0),
          cxHarshBrakingCount: tripList.reduce((sum, trip) => sum + Number(trip.cxHarshBrakingCount || 0), 0),
          cxHarshCorneringCount: tripList.reduce((sum, trip) => sum + Number(trip.cxHarshCorneringCount || 0), 0),
          cxOverspeeding75Distance: tripList.reduce((sum, trip) => sum + Number(trip.cxOverspeeding75Distance || 0), 0),
          nightDistance: tripList.reduce((sum, trip) => sum + Number(trip.nightDistance || 0), 0)
        };
      });
      this.updateTripTimes();

      // Handle no data message
      this.noDataMessage = this.getData.length === 0 ? "No trip found" : "";

      this.selectedVin = selectedVin;

      this.tripData = filteredTrips.map(trip => ({
        startLatLong: trip.startLatLong,
        endLatLong: trip.endLatLong
      }));

      this.totalTrips = filteredTrips.length;

      this.tripIds = filteredTrips.map(trip => ({
        tripId: trip.tripId,
        oem: selectedOem
      }));

      setTimeout(() => this.spinner.hide(), 2000);
    });

    this._vehicleService.getVinSummary(selectedVin, 'MONTHLY').subscribe((res: any) => {
      this.getDataVinSumamry = res;
      this.newTimeData = this.convertSecondsToHoursMinutes(this.getDataVinSumamry?.maxDuration);
      this.totalTimeNewData = this.convertSecondsToHoursMinutes(this.getDataVinSumamry?.totalDuration);
      this.averageTimeNewData = this.convertSecondsToHoursMinutes(this.getDataVinSumamry?.averageTime);
    }, err => {
      this.spinner.hide();
    });
  }


  formatDuration(seconds: number): string {
    if (seconds == null || isNaN(seconds)) return 'NA';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h} h ${m} m ${s} s`;
    } else if (m > 0) {
      return `${m} m ${s} s`;
    } else {
      return `${s} s`;
    }
  }

  alertMarkers: { lat: number; lng: number; iconUrl: string; title: string, }[] = [];
  alertSegments: { start: [number, number]; end: [number, number], color: string; }[] = [];
  mapLoading : boolean = false;
  async getTripHistoryDetails(
    selectedVin: string,
    selectedOem: string,
    tripId: string,
    tripStartTime: Date,
    tripEndTime: Date
  ) {
    this.tripDataNew = [];
    this.alertMarkers = [];
    this.alertSegments = [];
    this.wayPoints = [];
    this.mapLoading = true; // 🔥 Show loading

    try {
      const res = await this._vehicleService.gettripSummaryHistory(selectedVin, selectedOem, tripId).toPromise();

      // Show trip summary info immediately
      this.tripDataNew = res;
      this.distance = (res?.cxTripDistance || 0).toFixed(2);
      this.fuelConsumed = (res?.cxFuelConsumed || 0).toFixed(2);

      setTimeout(async () => {
        this.wayPoints = res.cxSnappedCoords.map((coords: any) => {
          const timestamp = tripStartTime;
          let pointColor = this.isNightTime(timestamp) ? 'blue' :
                           this.isMorningTime(timestamp) ? 'green' : 'green';

          return {
            coords: coords,
            color: pointColor
          };
        }).filter(point => !isNaN(point.coords[0]) && !isNaN(point.coords[1]));

        this.start_end_mark = [
          [this.wayPoints[0].coords[0], this.wayPoints[0].coords[1], { iconUrl: 'assets/mapIcon/startPoint.svg' }],
          [this.wayPoints[this.wayPoints.length - 1].coords[0], this.wayPoints[this.wayPoints.length - 1].coords[1], { iconUrl: 'assets/mapIcon/endPoint.svg' }]
        ];

        this.lat = this.wayPoints[0].coords[0];
        this.lng = this.wayPoints[0].coords[1];
        this.updateZoomLevel();

        this.mapLoading = false;

        const alertIcons = {
          "harsh_acceleration": "./assets/images/HA_TH.svg",
          "rapid_acceleration": "./assets/images/HA_TH.svg",
          "harsh_braking": "./assets/images/HB_TH.svg",
          "harsh_cornering": "./assets/images/HC_TH.svg"
        };

        const alertNames = {
          "harsh_acceleration": "Harsh Acceleration",
          "rapid_acceleration": "Harsh Acceleration",
          "harsh_braking": "Harsh Braking",
          "harsh_cornering": "Harsh Cornering"
        };

        for (const alert of res.cxAlerts || []) {
          let strokeColor = '#28D459'; // Default green

          const initial = alert?.cx_initial_location;
          const final = alert?.cx_final_location;

          if (!initial?.cx_latitude || !initial?.cx_longitude || !final?.cx_latitude || !final?.cx_longitude) {
            console.warn("⚠️ Skipping alert due to missing location data:", alert);
            continue;
          }

          if (alert.alert_description === "night_driving") {
            strokeColor = '#0000FF';
          }

          if (alert.alert_description !== "night_driving") {
            this.alertMarkers.push({
              lat: initial.cx_latitude,
              lng: initial.cx_longitude,
              iconUrl: alertIcons[alert.alert_description],
              title: alertNames[alert.alert_description]
            });

            this.alertMarkers.push({
              lat: final.cx_latitude,
              lng: final.cx_longitude,
              iconUrl: alertIcons[alert.alert_description],
              title: alertNames[alert.alert_description]
            });

            this.alertSegments.push({
              start: [initial.cx_latitude, initial.cx_longitude],
              end: [final.cx_latitude, final.cx_longitude],
              color: strokeColor
            });
          }

          try {
            const snappedPoints = await this.getSnappedPoints(
              initial.cx_latitude,
              initial.cx_longitude,
              final.cx_latitude,
              final.cx_longitude
            );

            if (snappedPoints.length > 1) {
              for (let i = 0; i < snappedPoints.length - 1; i++) {
                this.alertSegments.push({
                  start: [snappedPoints[i].lat, snappedPoints[i].lng],
                  end: [snappedPoints[i + 1].lat, snappedPoints[i + 1].lng],
                  color: "transparent"
                });
              }
            }
          } catch (snapError) {
            console.error("Error snapping points for overspeeding:", snapError);
          }
        }

        const startMoment = moment(this.tripDataNew.startTimeStamp).tz(this.selectedTimezone);
        const startHour = startMoment.hour();  // ✅ Now correct local hour

        let tripPolylineColor = '#28D459'; // Green for daytime
        if (startHour >= 20 || startHour < 6) {
          tripPolylineColor = '#0000FF'; // Blue for night driving
        }
        this.mapLoading = false;

      }, 100);

    } catch (error) {
      console.error("Error loading trip details:", error);
      this.mapLoading = false;
    }
  }

  // ✅ Utility function to get timezone-adjusted hour
  getLocalStartHour(timestamp: string): number {
    return moment.utc(timestamp).tz(this.selectedTimezone).hour();
  }

  // ✅ Updated to use timezone logic
  isNightTime(date: Date | string): boolean {
    const hour = moment(date).tz(this.selectedTimezone).hour();
    return hour >= 20 || hour < 6;
  }

  isMorningTime(date: Date | string): boolean {
    const hour = moment(date).tz(this.selectedTimezone).hour();
    return hour >= 6 && hour < 20;
  }



  async getSnappedPoints(startLat: number, startLng: number, endLat: number, endLng: number): Promise<{lat: number, lng: number}[]> {
    try {
      const data = await this._vehicleService.getSnappedPoints(startLat, startLng, endLat, endLng,).toPromise();

      // Adjust below based on your API response structure, here is an example:
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
          lat: coord[1],
          lng: coord[0]
        }));
        return coordinates;
      }
    } catch (error) {
      console.error("Error fetching snapped points:", error);
    }
    return [];
  }

  getPolylineColor() {
    // Check if there are valid waypoints and if the wayPoints array exists
    if (!this.wayPoints || this.wayPoints.length === 0) {
      return '#000080'; // Default color (blue) if no waypoints exist
    }

    const hasBlue = this.wayPoints.some(point => point.color === 'blue');
    const hasRed = this.wayPoints.some(point => point.color === 'red');
    const hasGreen = this.wayPoints.some(point => point.color === 'green');

    if (hasBlue && hasRed) {
      // this.polylineTitle = 'OS';
      // return '#FF0000'; // Red for morning time (6:00 AM - 7:59 AM)
    } else if (hasBlue) {
      this.polylineTitle = 'ND';
      return '#000080'; // Blue for night time (8:00 PM - 6:00 AM)
    } else if (hasGreen) {
      this.polylineTitle = '';
      return '#28D459'; // Green for day time
    }

    return '#000080'; // Default to blue if no colored points are found
  }

  showInfoWindow(infoWindow: any) {
    infoWindow.open();
  }

  hideInfoWindow(infoWindow: any) {
    infoWindow.close();
  }

  getPolylineTitle() {
    if (!this.wayPoints || this.wayPoints.length === 0) {
      return 'ND'; // Default title
    }

    const hasBlue = this.wayPoints.some(point => point.color === 'blue');
    const hasRed = this.wayPoints.some(point => point.color === 'red');

    if (hasBlue && hasRed) {
      return 'OS'; // Title for red polyline
    } else if (hasBlue) {
      return 'ND'; // Title for blue polyline
    }

    return ''; // No title for other cases
  }

  updateZoomLevel(): void {
    if (this.distance >= 1 && this.distance < 10) {
      this.zoom = 11; // Close zoom for short distances
    } else if (this.distance >= 10 && this.distance < 50) {
      this.zoom = 10; // Medium zoom for moderate distances
    } else if (this.distance >= 50 && this.distance < 100) {
      this.zoom = 8; // Wider zoom for longer distances
    }
    else if (this.distance >= 100 && this.distance < 200) {
      this.zoom = 7; // Wider zoom for longer distances
    } else {
      this.zoom = 8; // Default zoom for very long distances
    }
  }
  // Format time zone HH:MM, MM-DD-YYYY, HH:MM:SS
  convertSecondsToHoursMinutes(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${this.padZero1(hours)}:${this.padZero1(minutes)}`;

  }
  padZero1(value) {
    return value < 10 ? '0' + value : '' + value;
  }
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'HH:mm');
  }
  formatTimes(timestamp: string): string {
    const date = new Date(timestamp);
    const hours = this.padZero(date.getHours());
    const minutes = this.padZero(date.getMinutes());
    return `${hours}:${minutes}`;
  }
  padZero(value: number): string {
    return value < 10 ? '0' + value : '' + value;
  }
  formatDate(date: NgbDateStruct): string {
    if (!date) {
      return '';
    }
    const month = date.month < 10 ? `0${date.month}` : date.month;
    const day = date.day < 10 ? `0${date.day}` : date.day;
    return `${date.year}-${month}-${day}`;
  }
formattDate(dateString: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    timeZone: this.selectedTimezone
  });
  return formatter.format(date);
}

formatMonthName(dateString: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: this.selectedTimezone
  });
  return formatter.format(date); // returns "April", "May", etc.
}
  // Trip sort by current date
  sortTripsByDate(tripsA: any, tripsB: any): number {
    const dateA = new Date(tripsA.startTimeStamp);
    const dateB = new Date(tripsB.startTimeStamp);
    const currentDate = new Date();
    if (dateA.toDateString() === currentDate.toDateString() && dateB.toDateString() === currentDate.toDateString()) {
      return dateA.getTime() - dateB.getTime();
    } else if (dateA.toDateString() === currentDate.toDateString()) {
      return -1;
    } else if (dateB.toDateString() === currentDate.toDateString()) {
      return 1;
    } else {
      return dateB.getTime() - dateA.getTime();
    }
  }
  formatYearMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const monthIndex = parseInt(month) - 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthAbbreviation = monthNames[monthIndex];
    const shortYear = year.slice(2, 4);
    return `${monthAbbreviation}'${shortYear}`;
  }
  // No data found popup
  noDataFounds(nodatafound) {
    this.modalService.open(nodatafound, { centered: true })
  }
  // Breadcrumb link back to previous page
  backManageVehicle() {
    if (this.customConsumer) {
      this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { consumer: this.customConsumer } })
    }
  }
  ngOnDestroy() {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }

  worksheetData: any[] = [];
  async convertCoordinatesToAddress(latLong: [number, number]): Promise<string> {
    const [longitude, latitude] = latLong; // Swap if necessary based on your input
    return new Promise((resolve, reject) => {
      this.AuthService.getAddress(latitude, longitude).subscribe(
        (response) => {
          if (response.status === 'OK' && response.results.length > 0) {
            resolve(response.results[0].formatted_address);
          } else {
            resolve('Address Not Found');
          }
        },
        (error) => {
          resolve('Error Fetching Address');
        }
      );
    });
  }

  isDropdownOpen: boolean = false;

  toggleCard(index: number): void {
    // Toggle dropdown for the selected index, close others
    this.getData = this.getData.map((month, i) => ({
      ...month,
      isDropdownOpen: i === index ? !month.isDropdownOpen : false,
    }));
  }
}
