import { Component, OnInit, TemplateRef, ViewChild,NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { TripReportService } from 'src/app/pages/dashboards/trip-report.service';
import { TimezoneService } from 'src/app/pages/dashboards/timezone.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-driver-summary',
  templateUrl: './driver-summary.component.html',
  styleUrls: ['./driver-summary.component.scss']
})
export class DriverSummaryComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  @ViewChild('remarks', { static: true }) remarks!: TemplateRef<any>;
  searchByOem: any
  searchByStatus: any
  btnstatus: boolean = false
  searchText: string
  sortByStatus: boolean = false;
  searchFleets: String
  selectedFailureReason: string | null = null;
  driverId:any;
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
  totalTripCounts: number = 0; // Initialize with default value
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
  driverName = "Avani Smallboard";
driverLicense = "XYZ-12345";
totalTrips = 7;
vehicleAssigned = "TOYOTA_03";

  currentMapType: string = 'roadmap';
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
    vinList:any;
    driverDetails:any;
    vehicleAssociations:any;
    aggregatedTripSummary:any;
    vin:any;
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
  constructor(private modalService: NgbModal, private _vehicleService: TaxonomyService, private route: ActivatedRoute, private router: Router, private spinner: NgxSpinnerService,  public http: HttpClient,private tripReportService:TripReportService,private ngZone: NgZone,private timezoneService: TimezoneService) {
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
  localTime:any
  ngOnInit() {
    const driverParmsId = this.route.snapshot.paramMap.get('driverId');
    this.driverId=driverParmsId;
    if (this.driverId) {
      this.spinner.show();
      this.loadVinList();
      this.selectedPeriod = 'weekly';
      this.onTimePeriodChangeData(this.selectedPeriod);
    } else {
      console.error('Trip Detail ID is missing from the route.');
    }

    if (!this.searchByConsumer) {
      this.searchByConsumer = 'All';
    }
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
    console.log("ddd");
    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }
    //this.isCardOpen = selectedPeriod === 'customRange'; // When custom range is selected, show custom date input
   this.loadData();

  }
  async loadData() {
    console.log("Starting data load...");
    this.spinner.show();

    try {
      await this.loadDriverSummary(this.pageNumber, this.pageSize);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      this.spinner.hide();
    }
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

     this.loadDriverSummary(this.pageNumber, this.pageSize);
    // this.loadTripSummary(this.pageNumber, this.pageSize);
    const dateDifference = this.calculateDateDifference(this.fromDate, this.toDate);
    // When custom range is selected, update the card values accordingly

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
formatTimestamp(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${month}-${day}-${year}`;
}
loadDriverSummary(page: number, size: number): void {
  //this.loading = true;
  //this.spinner.show();

  // Get date range based on selected period
  const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);
  const driverId = this.driverId || ''; // Pass empty string if no VIN is selected
  this.tripReportService.getDriverSummary(
    driverId,
    startDate,
    endDate,
    page - 1,
    size
  ).subscribe({
    next: (response) => {

      this.driverDetails = response.driver_details;
      this.vehicleAssociations = response.vehicle_associations[0];
      this.vin=this.vehicleAssociations.vin;
      console.log(this.vin);
      this.loadTripSummary(this.pageNumber, this.pageSize);
      this.aggregatedTripSummary = response.aggregated_trip_summary;
      this.spinner.hide();
      this.loading = false;
    },
    error: (err) => {
      console.error('API Error:', err);

      // Hide the spinner and set loading to false
      this.spinner.hide();
      this.loading = false;
    }
  });
}

  filterByVin() {
     this.loadDriverSummary(this.pageNumber, this.pageSize);
    // this.loadTripSummary(this.pageNumber, this.pageSize);

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
  getScheduleTripHistoryDetails(
    vin: string,
    tripId: number,
    timeZones: string,
    deliveryLocations: any,
    geometry: any
  ): void {
      this.tripDataNew = {};  // Initialize as an object

      const tripTimes = this.getTripTimes(deliveryLocations);
      const startTime = tripTimes.arrivalTimeAtStart;
      const endTime = tripTimes.departureTimeAtEnd;

      // Extract start and end addresses
      const startLocation = deliveryLocations.find(loc => loc.type === "START") || null;
      const endLocation = deliveryLocations.find(loc => loc.type === "END") || null;

      // Function to format address properly
      const formatAddress = (location: any) => {
          if (!location) return null;  // Handle null case
          return `${location.streetAddress || ''}, ${location.city || ''}, ${location.state || ''} ${location.zipcode || ''}`.trim();
      };

      // Assign start and end addresses to tripDataNew
      this.tripDataNew.startAddress = formatAddress(startLocation);
      this.tripDataNew.endAddress = formatAddress(endLocation);

      this.tripReportService.getScheduledTripDetails(vin, tripId, startTime, endTime).subscribe(
        (res: any) => {
          this.tripDataNew = res;

          const startLat = res.startLat;
          const startLong = res.startLong;
          const endLat = res.endLat;
          const endLong = res.endLong;

          // Convert Start Time
          this.timezoneService.getLocalTimeFromUTC(startLat, startLong, this.tripDataNew.startTimeStamp).subscribe(startTime => {
            this.tripDataNew.startTimeStamp = startTime;

          });

          // Convert End Time
          this.timezoneService.getLocalTimeFromUTC(endLat, endLong, this.tripDataNew.endTimeStamp).subscribe(endTime => {
            this.tripDataNew.endTimeStamp = endTime;

          });

          // Convert location times
          if (this.tripDataNew.locationDetails) {
            this.tripDataNew.locationDetails.forEach(location => {
              this.timezoneService.getLocalTimeFromUTC(location.latitude, location.longitude, location.timeOfArrival)
                .subscribe(timeOfArrival => {
                  location.timeOfArrival = timeOfArrival;

                });

              this.timezoneService.getLocalTimeFromUTC(location.latitude, location.longitude, location.timeOfDeparture)
                .subscribe(timeOfDeparture => {
                  location.timeOfDeparture = timeOfDeparture;

                });
            });
          }

          // Convert distance and fuel consumption
          this.distance = ((this.tripDataNew?.cxTripDistance) * 0.621371).toFixed(2);
          this.fuelConsumed = (this.tripDataNew?.cxFuelConsumed * 0.264172).toFixed(2);
        }
      );
  }

   getTripTimes(deliveryLocations: any[]) {
    const startLocation = deliveryLocations.find(loc => loc.type === "START");
    const endLocation = deliveryLocations.find(loc => loc.type === "END");

    return {
        arrivalTimeAtStart: startLocation ? startLocation.timeOfArrival : null,
        departureTimeAtEnd: endLocation ? endLocation.timeOfDeparture : null
    };
}
convertUTCToTimestamp(utcDateTime: string): number {     // Ensure proper UTC date
  const utcDate = new Date(utcDateTime); // No need to append 'Z' if already in ISO format
  return utcDate.getTime(); // Return timestamp
 }

 convertUTCToMonthDay(utcDateTime: string): string {
  const utcDate = new Date(utcDateTime);
  const day = utcDate.getUTCDate(); // Get day of the month
  const month = utcDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }); // Get short month name in UTC
  return `${day} ${month}`;
}

  // Convert UTC timestamp to local time based on time zone
  convertToLocalTime(utcTimestamp: number, timezoneData: any): string {
    if (!timezoneData || !timezoneData.timeZoneName) {
        console.error('Invalid timezone data:', timezoneData);
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
    console.log('getTimezoneFromCoordinates called with:', { lat, lng });

    const timestamp = Math.floor(Date.now() / 1000);
    console.log('Timestamp:', timestamp);

    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${environment.googleMapApiKey}`;
    console.log('Making request to:', url);

    this.http.get(url).subscribe(
      (response: any) => {
        this.ngZone.run(() => {
          if (response.status === 'OK') {
            console.log('Timezone response:', response);
            // Pass the timeZoneName along with other data
            callback({
              timeZoneId: response.timeZoneId,
              timeZoneName: response.timeZoneName,
              rawOffset: response.rawOffset,
              dstOffset: response.dstOffset
            });
          } else {
            console.error('Timezone API error:', response.status, response.errorMessage);
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
        console.error('Error fetching timezone:', error);
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
    const consumer = 'Smallboard'; // Example value (you can change it dynamically)
    const fleetId = '100224'; // Example fleetId
    const startDate = ''; // Pass empty to use default
    const endDate = ''; // Pass empty to use default

    this._vehicleService.getManageListDownloadConsumers(consumer, fleetId, startDate, endDate)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.vinList = response.map((item) => ({
              vin: item.vin,
              alias: item.alias || item.vin // Use alias if available, else VIN
            }));
          }
        },
        error: (error) => {
          console.error('Error fetching VIN list:', error);
        }
      });
  }
  formatDuration(durationInMinutes: number): string {
    const totalSeconds = durationInMinutes * 60; // Convert minutes to seconds

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60); // Round to avoid decimals

    let result = '';

    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;

    // Only add seconds if it's greater than 0
    if (seconds > 0) result += `${seconds}s`;

    return result.trim(); // Remove trailing space if seconds is omitted
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
       this.loadDriverSummary(this.pageNumber, this.pageSize);
      // this.loadTripSummary(this.pageNumber, this.pageSize);
      this.scrollToTop();
    }
  }

  selectPage(size: number): void {
    this.pageSize = size;
     this.loadDriverSummary(this.pageNumber, this.pageSize);
    // this.loadTripSummary(this.pageNumber, this.pageSize);
  }

  scrollToTop(): void {
    const breadcrumbElement = document.querySelector('.page-content');
    if (breadcrumbElement) {
      breadcrumbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  calculateHaltTime(arrival: string, departure: string): string {
    if (!arrival || !departure) return 'N/A'; // Handle missing values

    const arrivalTime = new Date(arrival);
    const departureTime = new Date(departure);

    if (isNaN(arrivalTime.getTime()) || isNaN(departureTime.getTime())) {
      return 'Invalid Date'; // Handle invalid dates
    }

    // Check if departure is before arrival
    if (departureTime < arrivalTime) {
      return 'Error: Departure before Arrival';
    }

    let diffInSeconds = Math.floor((departureTime.getTime() - arrivalTime.getTime()) / 1000);

    const hours = Math.floor(diffInSeconds / 3600);
    diffInSeconds %= 3600;
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;

    return `${hours} hr ${minutes} min ${seconds} sec`;
  }

  getTotalStops(trip: any): number {
    if (!trip?.deliveryLocations) {
      return 0;
    }

    let totalStops = trip.deliveryLocations.length;
    const startLocation = trip.deliveryLocations.find(loc => loc.type === 'START');
    const endLocation = trip.deliveryLocations.find(loc => loc.type === 'END');

    if (startLocation && endLocation) {
      if (startLocation.latitude === endLocation.latitude && startLocation.longitude === endLocation.longitude) {
        totalStops -= 2; // Only subtract 1 if START and END are the same
      } else {
        totalStops -= 2; // Subtract 2 if they are different
      }
    } else {
      if (startLocation) {
        totalStops -= 1;
      }
      if (endLocation) {
        totalStops -= 1;
      }
    }

    return totalStops;
  }

   calculateMileage(totalTripDistance, totalFuelConsumed) {
    if (totalFuelConsumed <= 0) {
        return "Fuel consumption must be greater than zero";
    }
    return totalTripDistance / totalFuelConsumed; // Returns miles per gallon (MPG)
}
 convertToTimeZone(utcDateStr, timeZoneAbbr) {
  // Parse the UTC date correctly
  const utcDate = new Date(`${utcDateStr}Z`); // Ensures it's treated as UTC

  // Map common timezone abbreviations to IANA timezone names
  const timeZoneMap = {
      "PST": "America/Los_Angeles",
      "PDT": "America/Los_Angeles",
      "EST": "America/New_York",
      "EDT": "America/New_York",
      "CST": "America/Chicago",
      "CDT": "America/Chicago",
      "MST": "America/Denver",
      "MDT": "America/Denver"
  };

  const ianaTimeZone = timeZoneMap[timeZoneAbbr] || timeZoneAbbr; // Default to given timezone if not mapped

  const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimeZone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
  });

  return formatter.format(utcDate);
}
convertUTCintoDateMonth(utcDateStr: string, timeZoneAbbr: string): string {
  // Parse the UTC date correctly
  const utcDate = new Date(`${utcDateStr}Z`); // Ensures it's treated as UTC

  // Map common timezone abbreviations to IANA timezone names
  const timeZoneMap = {
      "PST": "America/Los_Angeles",
      "PDT": "America/Los_Angeles",
      "EST": "America/New_York",
      "EDT": "America/New_York",
      "CST": "America/Chicago",
      "CDT": "America/Chicago",
      "MST": "America/Denver",
      "MDT": "America/Denver"
  };

  const ianaTimeZone = timeZoneMap[timeZoneAbbr] || timeZoneAbbr; // Default to given timezone if not mapped

  const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimeZone,
      month: 'short',
      day: '2-digit',
  });

  return formatter.format(utcDate); // Returns only "Feb 14"
}
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
loadTripSummary(page: number, size: number): void {
  this.isLoading = true;
  this.spinner.show();

  // Get date range based on selected period
  const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);
  const selectedVin = this.selectedVin || ''; // Pass empty string if no VIN is selected
  console.log(this.vin,"efdfjndfsjnfdj");
  this.tripReportService.getSystemTripSummary(
    this.vin,
    startDate,
    endDate,
    page - 1,
    size
  ).subscribe({
    next: (response) => {
      this.tripSummaryData = response.content;
      this.totalPages = response.totalPages;
      this.getPagination(this.pageNumber);
      // Use a map to store trip data by tripId
      const tripMap = new Map<string, any>();
      this.tripSummaryData.forEach((res) => {
        const { tripId, startTime, endTime, startLat, startLng, endLat, endLng } = res;

        // Initialize trip data in the map
        tripMap.set(tripId, res);

        // Convert start time using start location's coordinates
        if (startTime && startLat && startLng) {
          this.getTimezoneFromCoordinates(startLat, startLng, (timezoneData: any) => {

            this.tripTimeZones[tripId] = timezoneData.timeZoneId;

            const startTimeStamp = this.convertUTCToTimestamp(startTime);
            const trip = tripMap.get(tripId); // Retrieve trip data by tripId

            if (trip) {
              trip.startTime = this.convertToLocalTime(startTimeStamp, timezoneData);
            }
          });
        }

        // Convert end time using end location's coordinates
        if (endTime && endLat && endLng) {
          this.getTimezoneFromCoordinates(endLat, endLng, (timezoneData: any) => {


            const endTimeStamp = this.convertUTCToTimestamp(endTime);
            const trip = tripMap.get(tripId); // Retrieve trip data by tripId

            if (trip) {
              trip.endTime = this.convertToLocalTime(endTimeStamp, timezoneData);
            }
          });
        }
      });

      // Now update the tripSummaryData with the converted times
      this.tripSummaryData = Array.from(tripMap.values());



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

}
