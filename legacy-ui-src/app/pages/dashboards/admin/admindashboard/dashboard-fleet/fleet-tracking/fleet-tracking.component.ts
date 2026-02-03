import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild, Input, HostListener } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { MapsAPILoader } from '@agm/core';
import { Subscription, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/app.service';
import moment from 'moment';
import { DatePipe } from '@angular/common';
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import { formatDate } from '@angular/common';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}
@Component({
  selector: 'app-fleet-tracking',
  templateUrl: './fleet-tracking.component.html',
  styleUrls: ['./fleet-tracking.component.scss']
})
export class FleetTrackingComponent implements OnInit {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.closest('.agm-info-window') && !clickedElement.closest('.agm-marker')) {
      this.startInfoWindowOpen = false;
    }
  }
  @Input() trip: any;
  polylines: {
    path: { lat: number; lng: number }[]; strokeColor: string; strokeWeight: number; strokeOpacity: number;
  }[] = []; // Declare the property
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
  currentTripDetails: any;
  filteredData: any[];
  latLng: any;
  vehicleSelection: any;
  seenPoints: Set<string> = new Set();
  isTripSelected = false; // false by default
  eachTripEndPoints: { lat: number; lng: number }[] = [];
  tripDataLength: any;
  showTooltip = false;
  activeSection: string | null = null;
  subscription$: Subscription = new Subscription();
  selectedMenuItem: string | null = null;
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  consumer: any = 'All'
  changeImage1: boolean = true;
  changeImage2: boolean = false;
  popupVisible: boolean = false;
  vinList: any;
  VIN: string;
  latitude: number;
  longitude: number;
  zoom: number;        // Zoomed out to cover both states
  start_end_mark = []
  alertTip: any;
  @ViewChild('nodatafound') nodatafound: any
  @ViewChild('noVehicleActivity') noVehicleActivity: any;
  interval: any;
  colorCode: any = null;
  currentAddres: any;
  firstAddressPart: any;
  secondAddressPart: any;
  fleetIdValueNew: any;
  fleetIds: any;
  totalVehicles: any;
  movingVehicles: any;
  parkedVehicles: any;
  idleVehicles: any;
  isLoading: boolean = false;
  therShold: any;
  currentMapType: 'roadmap' | 'satellite' = 'roadmap';
  colorCodeNew: any;
  latestUpdatedVehicles: any;
  updateTodayVehicle: any;
  colorCodeNewData: any;
  eligibilityData: any;
  getData: any;
  lengthTrip: any;
  tripListLength: any;
  isArrowDown: boolean = true;
  selectedTripId: string | null = null;
  selectedTripDetails: any = null;
  snappedCoordsForMap: any[] = [];
  showPolylineMap: boolean = true; // Toggle this to show/hide polyline map
  selectedTrip: any = null;
  filteredSnappedCoords: any[] = [];  // Store filtered snapped coordinates
  showMap: boolean = true;            // Control visibility of the original map
  showPolyline: boolean = false;
  dataForVehicleDetails: any;
  selectedTab: string = 'events';
  vin: String;
  latitudeMap: Number;
  longitudeMap: Number;
  tripId: any;
  isLive: boolean = false;
  alertMarkers: any;
  LatLng: any;
  isOpen: boolean = false;
  waypoints = []
  speedVal: any;
  currentPositionIndex = 0;
  snappedWaypoints: any[];
  driver_name: any;
  layerOptionsVisible = false;
  layerOptions = [];
  endAddress: any;
  dataShowThershold: boolean = false;
  combinedCoords: number[][] = [];
  polylineCoords: { lat: number; lng: number }[] = [];
  startMarker: { lat: number; lng: number } | null = null;
  fleetId: number | null = null;
  endMarkers: { lat: number; lng: number; alias?: string; colorCode?: string }[] = [];
  snappedPolylineCoords: { lat: number; lng: number }[] = [];
  @ViewChild('mapContainer', { static: true }) mapElement!: ElementRef;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  today: string = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  selectedDate: string = this.today; // Select today by default
  displayDate: string = '';
  showCalendar: boolean = false;
  currentMonth: number;
  currentYear: number;
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  dayNames: string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  dates: any[] = [];
  infoWindowOpen = false;
  startInfoWindowOpen = false; // Controls the start marker's info window visibility
  tripInfoWindowOpen: { [key: string]: boolean } = {}; // Controls the end markers' info window visibility
  allTrips: any[] = [];
  isFirstTrip: boolean = false; // Flag to track the first trip
  isSidebarHidden = false;
  newMap: boolean = false;
  oldMap: boolean = true;
  constructor(private datePipe: DatePipe, private mapsAPILoader: MapsAPILoader, private timezoneService: TimezoneService, @Inject(PLATFORM_ID) private platformId: Object, public http: HttpClient, private modalService: NgbModal, private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService, private router: Router, private appService: AppService,) {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
  }

  // zoom + - over the map layer
  onMapReady(map: google.maps.Map) {
    map.setOptions({
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_CENTER // or LEFT_TOP
      }
    });
  }
  // Satellite or roadmap
  toggleLayerOptions() {
    this.layerOptionsVisible = !this.layerOptionsVisible;
  }
  setMapType(type: 'roadmap' | 'satellite') {
    this.currentMapType = type;
  }
  // All vehicle map denoted by multiple color
  onMarkerHover(coordinate: any): void {
    this.alertTip = coordinate;
    this.infoWindowOpen = true;
  }
  onMarkerHoverEnd(): void {
    this.infoWindowOpen = false;
  }
  getMarkerIcon(colorCode: string): string {
    switch (colorCode) {
      case 'GREEN':
        return './assets/images/green-icon-1.svg';
      case 'YELLOW':
        return './assets/images/blue-icon-1.svg';
      case 'RED':
        return './assets/images/red-icon-1.svg';
      default:
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  }
  getPopupColor(colorCode: string): string {
    switch (colorCode) {
      case 'GREEN':
        return '#2CA67E'; // Green
      case 'YELLOW':
        return '#3b66d5'; // Yellow
      case 'RED':
        return '#FF9191'; // Red
      default:
        return '#FFFFFF'; // White fallback
    }
  }
  // All vehicle map denoted by multiple color end

  ngOnInit() {
    this.showRole();
    if (this.customConsumer === 'EcoTrack') {
      // Tucson, Arizona
      this.latitude = 32.2633;
      this.longitude = -110.8387;
      this.zoom = 10; // Adjust zoom as needed
    }
    else if (this.customConsumer === 'Onwardfleet') {
      this.latitude = 35.4676;         // Slightly north of OKC (was 35.4676)
      this.longitude = -97.5164;    // Keeps it aligned east-west
      this.zoom = 11;
    }
    // Current time bydefault selected
    const currentTz = this.timezoneService.getTimezone();
    this.selectedTimezone = currentTz
    let initialLoad = true;
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      if (initialLoad) {
        initialLoad = false; // prevent updateTime() on first subscription trigger
      } else {
        this.updateTime(); // only update when user changes timezone
      }
    });
    this.isFirstTrip = this.eachTripEndPoints.length > 0;
    this.vehicleList()
    this.generateCalendar();
    if (this.user != 'role_user_fleet') {
      this.getAllConsumerss();
      this.selectConsumers()
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based
    const day = today.getDate();
    // Format YYYY-MM-DD
    const selectedMonth = (month + 1).toString().padStart(2, '0');
    const selectedDay = day.toString().padStart(2, '0');
    this.selectedDate = `${year}-${selectedMonth}-${selectedDay}`;
    // Format display date (e.g., May 6, 2025)
    this.displayDate = this.formatDisplayDate(year, month, day);
  }
  selectedVehicle: any = null;
  selectedIndex: number | null = null;

  showDetails(index: number) {
    this.selectedIndex = index;
  }

  closeDetails() {
    this.selectedIndex = null;
  }

  startInterval() {
    setTimeout(() => {
      this.intervalTme()
    }, 10000)
  }
  startDate: any = null;
  endDate: any = null;
  hoveredDate: any = null;
  displayRange = '';
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
  // Method to check if a date is in the future
  isFutureDate(date: any) {
    if (!date.day) return false; // Skip empty dates
    const selectedDate = new Date(this.currentYear, this.currentMonth, date.day);
    const today = new Date();
    return selectedDate > today;
  }

  generateCalendar() {
    this.dates = [];

    const today = new Date();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const offset = (firstDayOfWeek + 6) % 7; // Align starting day to Monday

    // Add blank spaces for previous month days
    for (let i = 0; i < offset; i++) {
      this.dates.push({ day: null, active: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      const isPastOrToday = date <= today;
      this.dates.push({ day: i, active: isPastOrToday });
    }
  }


  selectDate(date: any) {
    if (!date.active) return;  // Ensure the date is active (not disabled)
    const selectedDay = date.day.toString().padStart(2, '0');
    const selectedMonth = (this.currentMonth + 1).toString().padStart(2, '0');
    const selectedFullDate = `${this.currentYear}-${selectedMonth}-${selectedDay}`; // YYYY-MM-DD format

    this.selectedDate = selectedFullDate;  // Store internal date
    this.displayDate = this.formatDisplayDate(this.currentYear, this.currentMonth, date.day); // Store formatted date
    this.showCalendar = false;
    this.onDayChange(selectedFullDate);
  }

  formatDisplayDate(year: number, monthIndex: number, day: number): string {
    const date = new Date(year, monthIndex, day);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  isToday(date: any): boolean {
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

  toggleCalendar() {
    this.showCalendar = !this.showCalendar;
  }
  selectRange(date: any) {
    if (this.isFutureDate(date)) return;
    if (!this.startDate || (this.startDate && this.endDate)) {
      // Start new range
      this.startDate = date;
      this.endDate = null;
    } else if (this.startDate && !this.endDate) {
      const start = new Date(this.startDate.year, this.startDate.month, this.startDate.day);
      const selected = new Date(date.year, date.month, date.day);
      if (selected >= start) {
        this.endDate = date;
        this.showCalendar = false;
      } else {
        this.startDate = date;
        this.endDate = null;
      }
    }
    this.updateDisplayRange();
  }

  updateDisplayRange() {
    if (this.startDate && this.endDate) {
      this.displayRange = `${this.formatDate(this.startDate)} - ${this.formatDate(this.endDate)}`;
    } else if (this.startDate) {
      this.displayRange = `${this.formatDate(this.startDate)} -`;
    } else {
      this.displayRange = '';
    }
  }

  formatDate(date: any): string {
    return `${this.padZero(date.day)}/${this.padZero(date.month + 1)}/${date.year}`;
  }

  padZero(num: number): string {
    return num < 10 ? '0' + num : '' + num;
  }

  ngOnDestroy(): void {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    if (this.interval) {
      clearInterval(this.interval)
    }
  }
  updateTime() {
    if (this.colorCode === 'GREEN') { // Check if filteredData is available (not null or empty)
      if (this.filteredData && Array.isArray(this.filteredData) && this.filteredData.length > 0) {
        this.filteredData.forEach(group => {
          if (!group) return;
          if (group.tripStartTime) {
            group.formattedStartTime = moment
              .utc(group.tripStartTime)
              .tz(this.selectedTimezone)
              .format('MMM D, YYYY, HH:mm');
            group.formattedStartTimes = moment
              .utc(group.tripStartTime)
              .tz(this.selectedTimezone)
              .format('HH:mm');
          } else {
            group.formattedStartTime = '--';
            group.formattedStartTimes = '--';
          }
        });
      } else {
      }
    }
    // Continue with updating other data (e.g., getData, selectedTrip, alerts, etc.)
    if (Array.isArray(this.getData)) {
      this.getData.forEach(group => {
        if (Array.isArray(group.tripList)) {
          group.tripList.forEach(trip => {
            if (trip.endTimeStamp) {
              trip.formattedDate = moment.utc(trip.endTimeStamp)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY');
              trip.formattedTime = moment.utc(trip.endTimeStamp)
                .tz(this.selectedTimezone)
                .format('HH:mm');
            } else {
              trip.formattedDate = '--';
              trip.formattedTime = '--';
            }
            if (trip.startTimeStamp) {
              trip.formattedDates = moment.utc(trip.startTimeStamp)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY');
              trip.formattedTimes = moment.utc(trip.startTimeStamp)
                .tz(this.selectedTimezone)
                .format('HH:mm');
            } else {
              trip.formattedDates = '--';
              trip.formattedTimes = '--';
            }
            if (trip.endTimeStamp) {
              trip.formattedDatesEnd = moment.utc(trip.endTimeStamp)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY');
              trip.formattedTimesEnd = moment.utc(trip.endTimeStamp)
                .tz(this.selectedTimezone)
                .format('HH:mm');
            } else {
              trip.formattedDatesEnd = '--';
              trip.formattedTimesEnd = '--';
            }
          });
        }
      });
    }
    // Update selectedTrip times
    if (this.selectedTrip?.startTimeStamp) {
      this.selectedTrip.formattedTimes = moment
        .utc(this.selectedTrip.startTimeStamp)
        .tz(this.selectedTimezone)
        .format('HH:mm');
    }
    if (this.selectedTrip?.endTimeStamp) {
      this.selectedTrip.formattedTime = moment
        .utc(this.selectedTrip.endTimeStamp)
        .tz(this.selectedTimezone)
        .format('HH:mm');
    }
    // Update alert times based on new timezone
    if (Array.isArray(this.dataForVehicleDetails?.cxAlerts)) {
      this.dataForVehicleDetails.cxAlerts.forEach(alert => {
        if (alert.alert_timestamp) {
          alert.formattedAlertTime = moment.utc(alert.alert_timestamp)
            .tz(this.selectedTimezone)
            .format('MMM D, YYYY, HH:mm');
        } else {
          alert.formattedAlertTime = '--';
        }
      });
    }
    // Format event marker times
    if (this.eventMarkers) {
      this.eventMarkers.forEach(marker => {
        if (marker.timestamp) {
          marker.formattedAlertTime = moment.utc(marker.timestamp)
            .tz(this.selectedTimezone)
            .format('MMM D, YYYY, HH:mm');
        }
      });
    }
  }
async getAllConsumerss() {
    try {
      // Fetch all consumers
      const response = await this.dashboardservice
        .getAllConsumerss(this.customConsumer).pipe(pluck("data"),catchError(() => of([])),shareReplay(1)).toPromise();
    // Map and filter the consumer list
      this.consumerList = (response as Consumer[]).filter((item) => item.contract).map((item) => ({
        name: item.name,
        startDate: this.formatDatedForActive(item.contract.startDate)
      }));
      const excludedConsumers = new Set([
        "Slick", "OneStep", "Arvind_insurance", "HD Fleet LLC", "GEICO",
        "Forward thinking GPS", "Geo Toll", "Matrack",
        "Geico", "Test fleet", "Rockingham", "Axiom", "GeoToll"
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
  imageChange() {
    this.changeImage1 = false;
    this.changeImage2 = true
  }
  showHistory(): void {
    const historyTab = document.getElementById('history');
    if (historyTab) {
      historyTab.classList.add('active');
    }
  }
  togglePopup() {
    this.popupVisible = !this.popupVisible;
  }

  noDataFounds(nodatafound) {
    if (this.start_end_mark?.length <= 0) {
      this.modalService.open(nodatafound, { centered: true })
    }
  }

  selectMenuItem(item: string) {
    this.selectedMenuItem = this.selectedMenuItem === item ? null : item;
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
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
    console.log('saa')
    this.dataShowThershold = true;
    if (this.fleetIdData) {
      this.subscription$.add(
        this.dashboardservice.getVINs(this.fleetIdData).subscribe((res: any) => {
          this.vinList = res?.vins
          this.therShold = res?.profiling?.spdLimit
        }, err => {
        })
      )
    }
    this.vehicleList(this.VIN)
    this.vinList = []
  }

  selectVIN() {
    this.vehicleList(this.VIN)
  }
  selectedFilter: string = 'Today'; // Default value
  lat: any;
  lon: any;
  vehicleList(vin?) {
    if (!this.colorCode) {
      this.isLoading = true;
      this.totalVehicles = null;
      this.idleVehicles = null;
      this.movingVehicles = null;
      this.parkedVehicles = null;
    }
    this.subscription$.add(
      this.dashboardservice.getLiveVehicle(this.customConsumer, this.fleetIdData, vin, this.colorCode)
        .subscribe(
          (res: any) => {
            const now = new Date();
            const vehiclesWithTimeDiff = res.map((vehicle: any) => {
              const updatedTime = new Date(vehicle.lastUpdatedOn);
              const diffMs = now.getTime() - updatedTime.getTime();
              const totalMinutes = Math.floor(diffMs / (1000 * 60));
              const days = Math.floor(totalMinutes / (60 * 24));
              const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
              const minutes = totalMinutes % 60;
              let lastUpdatedDiff = '';
              if (days > 0) lastUpdatedDiff += `${days}d `;
              if (hours > 0) lastUpdatedDiff += `${hours}h `;
              if (minutes > 0 || (!days && !hours)) lastUpdatedDiff += `${minutes}m`;
              return {
                ...vehicle,
                lastUpdatedDiff: lastUpdatedDiff.trim()
              };
            });
            this.colorCodeNew = vehiclesWithTimeDiff;
            const todayStr = new Date();
            todayStr.setDate(todayStr.getDate());
            const today = todayStr.toISOString().split('T')[0];
            let filteredVehicles = [];
            if (this.selectedFilter === 'Today') {
              filteredVehicles = vehiclesWithTimeDiff.filter(vehicle => {
                const updatedDate = todayStr.toISOString().split('T')[0];
                return updatedDate === today;
              });
            } else {
              filteredVehicles = vehiclesWithTimeDiff;
            }
            if (this.colorCode) {
              filteredVehicles = filteredVehicles.filter(v => v.colorCode === this.colorCode);
            }
            filteredVehicles.forEach((vehicle: any) => {
              const lat = vehicle.endLat;
              const lon = vehicle.endLong;
              if (lat && lon) {
                this.dashboardservice.getAddressLatLng(lat, lon).subscribe((geoRes: any) => {
                  if (geoRes.display_name) {
                    vehicle.address = geoRes.display_name;
                  } else {
                    vehicle.address = 'Address not found';
                  }
                }, error => {
                  console.error('Reverse geocoding failed:', error);
                  vehicle.address = 'Address lookup error';
                });
              } else {
                vehicle.address = 'Coordinates missing';
              }
            });
            this.latestUpdatedVehicles = filteredVehicles;
            this.subscribeToLiveSpeed();
            this.updateTodayVehicle = filteredVehicles.length;
            if (!this.colorCode) {
              this.totalVehicles = filteredVehicles.length;
              this.parkedVehicles = filteredVehicles.filter(v => v.colorCode === 'RED').length;
              this.movingVehicles = filteredVehicles.filter(v => v.colorCode === 'GREEN').length;
              this.idleVehicles = filteredVehicles.filter(v => v.colorCode === 'YELLOW').length;
            }
            // Map start and end markers
            this.start_end_mark = filteredVehicles;
            if (filteredVehicles.length > 0) {
              this.latitude = filteredVehicles[0]?.endLat;
              this.longitude = filteredVehicles[0]?.endLong;
            } else {
            }
            this.isLoading = false;
          },
          (err) => {
            this.isLoading = false;
            const statusCode = err?.status;
            const errorMessage = err?.apierror?.message || 'Technical Issue, Please try after some time';
            if (statusCode === 500 || errorMessage === 'Internal Server Error') {
              this.appService.openSnackBar('Technical Issue, Please try after some time', 'Error');
            } else {
              this.appService.openSnackBar(errorMessage, 'Error');
            }
          }
        )
    )
  }

  isVehicleListVisible: boolean = false
  allTripsCoordinatesArray: Array<Array<{ lat: number, lng: number }>> = [];
  startAddress: string = '';
 onSelectVehicle(vehicle: any): void {
    this.selectedVehicle = vehicle;
    this.vehicleSelection = vehicle?.vin;
    const todayInTz = moment().tz(this.selectedTimezone);
    this.selectedDate = todayInTz.format('YYYY-MM-DD');
    this.displayDate = todayInTz.format('MMM D, YYYY'); // => "May 21, 2025"
    this.allTripsCoordinatesArray = [];
    this.eachTripEndPoints = [];
    this.start_end_mark = [];
    this.snappedPolylineCoords = [];
    this.isTripSelected = false;
    this.showPolyline = false;
    this.isVehicleListVisible = false;
    // Extract VIN and determine OEM
    const selectedVin = vehicle.vin;
    const make = vehicle.provider?.toUpperCase();
    if (this.selectedDate) {
      if (vehicle?.eventType === 'event_ongoing') {
        // this.getStremingData(vehicle);
      }
      else {
        this.getTripHistorySummary(selectedVin, make);
      }
    } else {
    }
    if (vehicle.latitude && vehicle.longitude) {
      this.latitude = vehicle.latitude;
      this.longitude = vehicle.longitude;
      this.zoom = 5; // You can adjust the zoom level depending on your preferred detail level
    }
  }
  refreshingVin: string | null = null;
  refreshSingleVehicleSpeed(vin: string) {
    this.refreshingVin = vin;
    this.dashboardservice.getLiveVehicle(this.customConsumer, this.fleetIdData, vin, this.colorCode)
      .subscribe((res: any) => {
        if (res && res.length > 0) {
          const updatedVehicle = res[0];
          const index = this.latestUpdatedVehicles.findIndex(v => v.vin === updatedVehicle.vin);
          if (index !== -1) {
            const now = new Date();
            const vehiclesWithTimeDiff = res.map((vehicle: any) => {
              const updatedTime = new Date(vehicle.lastUpdatedOn);
              const diffMs = now.getTime() - updatedTime.getTime();
              const totalMinutes = Math.floor(diffMs / (1000 * 60));
              const days = Math.floor(totalMinutes / (60 * 24));
              const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
              const minutes = totalMinutes % 60;
              let lastUpdatedDiff = '';
              if (days > 0) lastUpdatedDiff += `${days}d `;
              if (hours > 0) lastUpdatedDiff += `${hours}h `;
              if (minutes > 0 || (!days && !hours)) lastUpdatedDiff += `${minutes}m`;
              return {
                ...vehicle,
                lastUpdatedDiff: lastUpdatedDiff.trim()
              };
            });
          }
        }
        this.refreshingVin = null;
      }, () => {
        this.refreshingVin = null;
      });
  }
  isResetAction: boolean = false;

  resetSelection() {
    this.newMap = false;
    this.oldMap = true;
    this.selectedVehicle = null;
    this.isResetAction = true;
    this.showMap = true;
    this.showPolyline = false;
    this.isTripSelected = false;
    this.eventType = null;
    this.snappedPolylineCoords = [];
    this.start_end_mark = [];
    this.eachTripEndPoints = [];
    this.allTripsCoordinatesArray = [];
    this.vehicleList();
  }

  formatDisplayDates(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  getAdjustedDateTime(endTimeStamp: string, timeGapInMinutes: number): string {
    const endDate = new Date(endTimeStamp);
    endDate.setMinutes(endDate.getMinutes() - timeGapInMinutes); // Subtract the time gap
    return this.datePipe.transform(endDate, 'MMM d, y h:mm a'); // Return the formatted date
  }

  backFromTrip(): void {
    const savedSelectedDay = this.selectedDay;
    this.selectedTripId = null;
    this.isTripSelected = false;
    this.showPolyline = true;
    this.showMap = true;
    this.isVehicleListVisible = true;
    this.eventMarkers = null;
    this.alertSegments = null;
    // Update selectedDay and selectedDate based on the previously selected option
    if (savedSelectedDay === 'Today') {
      this.selectedDay = 'Today';
      const now = new Date();
      this.selectedDate = now.toISOString().split('T')[0];
    } else if (savedSelectedDay === 'Yesterday') {
      this.selectedDay = 'Yesterday';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      this.selectedDate = yesterday.toISOString().split('T')[0];
    }
    if (this.selectedVehicle) {
      const selectedVin = this.selectedVehicle.vin;
      const make = this.selectedVehicle.provider?.toUpperCase();
      this.getTripHistorySummary(selectedVin, make);
    } else {
    }
  }
  selectedDay: string = 'Today'; // default
  selectVINs: string = '';
  selectedOem: string = '';
  selectedStartDate: string | null = null;
  selectedEndDate: string | null = null;
  onMapClick(): void {
    for (let key in this.tripInfoWindowOpen) {
      this.tripInfoWindowOpen[key] = false;
    }
  }
  onDayChange(selectedDate: string): void {
    this.selectedDay = selectedDate;
    // Set timezone based on selection
    let timezone: string;

    switch (this.selectedTimezone) {
      case 'America/Los_Angeles':
        timezone = 'Pacific Time';
        break;
      case 'America/Chicago':
        timezone = 'Central Time';
        break;
      case 'America/Denver':
        timezone = 'Mountain Time';
        break;
      case 'America/Phoenix':
        timezone = 'Arizona Time';
        break;
      case 'America/Anchorage':
        timezone = 'Alaska Time';
        break;
      case 'Hawaii Time':
        timezone = 'Hawaii Time';
        break;
      default:
        timezone = 'Unknown Timezone';
    }

    if (this.selectedVehicle) {
      const selectedVin = this.selectedVehicle.vin;
      const make = this.selectedVehicle.provider?.toUpperCase();
      if (this.selectedDate) {
        this.getTripHistorySummary(selectedVin, make);
      } else {
      }
    } else {
    }
  }
  getDateLabel(dayType: string): string {
    const nowInTz = moment().tz(this.selectedTimezone);
    switch (dayType) {
      case 'Today':
        return nowInTz.format('MM-DD-YYYY');
      case 'Yesterday':
        return nowInTz.clone().subtract(1, 'day').format('MM-DD-YYYY');
      case 'Previous Day':
        return nowInTz.clone().subtract(2, 'day').format('MM-DD-YYYY');
      default:
        return '';
    }
  }
  getTripHistorySummary(selectedVin: string, selectedOem: string): void {
    this.dashboardservice.gettripSummary(selectedVin, selectedOem).subscribe((res: any) => {
      this.eligibilityData = res;
      this.currentTripDetails = res.currentTripDetails;

      if (!this.selectedDate) {
        console.error('selectedDate is undefined.');
        return;
      }

      const today = new Date();
      const selected = new Date(this.selectedDate);
      const isYesterday = this.selectedDay === 'Yesterday';
      const isFirstOfMonth = today.getDate() === 1;

      if (isYesterday && isFirstOfMonth) {
        selected.setMonth(selected.getMonth());
      } else {
        selected.setMonth(selected.getMonth());
      }

      const targetMonth = selected.toISOString().slice(0, 7);

      const filteredData = (res.yearMonthWiseTripList || [])
        .filter((monthData: any) => monthData.yearMonth === targetMonth)
        .map((monthData: any) => {
          const filteredTrips = (monthData.tripList || [])
            .filter((trip: any) => {
              if (!trip.startTimeStamp) return false;
              const tripDateInSelectedTz = moment
                .utc(trip.startTimeStamp)
                .tz(this.selectedTimezone)
                .format('YYYY-MM-DD');
              return tripDateInSelectedTz === this.selectedDate;
            })
            .sort((a: any, b: any) =>
              new Date(b.endTimeStamp).getTime() - new Date(a.endTimeStamp).getTime()
            )
            .map((trip: any, index: number, array: any[]) => {
              const start = new Date(trip.startTimeStamp);
              const end = new Date(trip.endTimeStamp);
              const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
              trip.vin = selectedVin;
              trip.provider = selectedOem;
              trip.tripDurationInMinutes = durationMinutes;
              trip.timeGapFromPrevious =
                index < array.length - 1
                  ? Math.round(
                      (start.getTime() - new Date(array[index + 1].endTimeStamp).getTime()) / 60000
                    )
                  : null;
              trip.cxIdlingDuration = typeof trip.cxIdlingDuration === 'number' ? trip.cxIdlingDuration : 0;
              return trip;
            });

          return { ...monthData, tripList: filteredTrips };
        })
        .filter((monthData: any) => monthData.tripList.length > 0);

      this.getData = filteredData;
      this.filteredData = this.currentTripDetails ? [this.currentTripDetails] : [];
      this.updateTime();

      const allTrips = this.getData.flatMap((month: any) => month.tripList);
      this.tripDataLength = allTrips.length;

      this.allTripsCoordinatesArray = [];
      this.eachTripEndPoints = [];

      if (allTrips.length === 0) {
        this.triggerMapUpdate();
        return;
      }

      const tripRequests = allTrips.map((trip: any) =>
        this.dashboardservice.gettripSummaryHistory(trip.vin, trip.provider, trip.tripId)
      );

      forkJoin(tripRequests).subscribe((responses: any[]) => {
        responses.forEach((res: any, index: number) => {
          const trip = allTrips[index];

          if (
            Array.isArray(res?.cxSnappedCoords) &&
            res.cxSnappedCoords.length > 1 &&
            typeof res?.cxIdlingDuration === 'number' &&
            res.cxIdlingDuration >= 0 &&
            res.startAddress &&
            res.endAddress
          ) {
            trip.cxIdlingDuration = res.cxIdlingDuration;
            trip.startAddress = res.startAddress;
            trip.endAddress = res.endAddress;

            const cleanedCoords = res.cxSnappedCoords.filter(
              (point: any) =>
                Array.isArray(point) &&
                point.length === 2 &&
                typeof point[0] === 'number' &&
                typeof point[1] === 'number'
            );

            const dedupedCoords = cleanedCoords.filter((coord, idx, arr) => {
              if (idx === 0) return true;
              const [prevLat, prevLng] = arr[idx - 1];
              const [currLat, currLng] = coord;
              return !(prevLat === currLat && prevLng === currLng);
            });

            if (dedupedCoords.length > 1) {
              const tripCoords = dedupedCoords.map(([lat, lng]: number[]) => ({ lat, lng }));
              this.allTripsCoordinatesArray.push(tripCoords);
              const end = dedupedCoords[dedupedCoords.length - 1];
              this.eachTripEndPoints.push({ lat: end[0], lng: end[1] });
            }
          } else {

          }
        });
      });
    });
  }


  formatSecondsToHourMinu(seconds: number | null | undefined): string {
    if (seconds == null) return '--';
    const minutes = Math.floor(seconds / 60);
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const parts = [];
    if (hrs) parts.push(`${hrs} h`);
    if (mins || !hrs) parts.push(`${mins} m`);
    return parts.join(' ');
  }


  private calculateBounds(coordsArray: { lat: number, lng: number }[][]) {
    let latitudes: number[] = [];
    let longitudes: number[] = [];

    coordsArray.forEach(tripCoords => {
      tripCoords.forEach(coord => {
        latitudes.push(coord.lat);
        longitudes.push(coord.lng);
      });
    });

    const southWest = {
      lat: Math.min(...latitudes),
      lng: Math.min(...longitudes)
    };
    const northEast = {
      lat: Math.max(...latitudes),
      lng: Math.max(...longitudes)
    };

    return { southWest, northEast };
  }

  private adjustMapZoomAndCenter() {
    if (this.allTripsCoordinatesArray.length) {
      const bounds = this.calculateBounds(this.allTripsCoordinatesArray);

      // Center = midpoint between SW and NE corners
      this.latitude = (bounds.southWest.lat + bounds.northEast.lat) / 2;
      this.longitude = (bounds.southWest.lng + bounds.northEast.lng) / 2;

      // Adjust zoom level
      this.adjustZoomToBounds(bounds);
    }
  }

  private adjustZoomToBounds(bounds: { southWest: any, northEast: any }) {
    const latDiff = Math.abs(bounds.northEast.lat - bounds.southWest.lat);
    const lngDiff = Math.abs(bounds.northEast.lng - bounds.southWest.lng);

    const maxDiff = Math.max(latDiff, lngDiff);

    // Rough zoom calculation (adjust the thresholds as you test)
    if (maxDiff > 30) {
      this.zoom = 3;
    } else if (maxDiff > 10) {
      this.zoom = 5;
    } else if (maxDiff > 5) {
      this.zoom = 7;
    } else if (maxDiff > 2) {
      this.zoom = 9;
    } else if (maxDiff > 1) {
      this.zoom = 11;
    } else {
      this.zoom = 11;
    }
  }


  triggerMapUpdate(): void {
  }

  showAddress(lat: number, lng: number): void {
    this.mapsAPILoader.load().then(() => {
      const geocoder = new google.maps.Geocoder();
      const latLng = new google.maps.LatLng(lat, lng);

      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          this.address = results[0].formatted_address; // Set the address
          this.tooltipLat = lat;  // Set latitude for info window position
          this.tooltipLng = lng;  // Set longitude for info window position
          this.showTooltip = true; // Show the tooltip
        } else {
          console.error('Geocode failed due to: ' + status);
        }
      });
    });
  }

  hideTooltip(): void {
    this.showTooltip = false;  // Hide tooltip when mouse out
  }

  get adjustedStartTime(): string {
    const startTime = new Date(this.trip.startTimeStamp);
    const adjustedTime = new Date(startTime.getTime() - (this.trip.timeGapFromPrevious * 60000)); // Subtract minutes from startTime
    return formatDate(adjustedTime, 'MMM d, y HH:mm', 'en-US');
  }


  tooltipLat: number = 0; // Latitude for tooltip
  tooltipLng: number = 0; // Longitude for tooltip
  address: string = ''; // Address text for the tooltip

  // Variables
  eventMarkers: Array<{
    lat: number;
    lng: number;
    icon: google.maps.Icon;
    highlightIcon: google.maps.Icon;     // <-- Add this
    alertType: string;
    timestamp: string;
    alertId: string;                     // <-- Add this
    address?: any;
    formattedAlertTime?: string                  // Optional if you're using address in tooltips
  }> = [];

  vehicleLat: number;
  vehicleLng: number;
  polylineColor: string = '#45b01f';
  eventIcons = {
    "harsh_acceleration": "red",
    "rapid_acceleration": "red",
    "harsh_braking": "red",
    "harsh_cornering": "red",
    "overspeeding": "red",
    "default": "red"
  };
  overspeedingPolylines: { path: { lat: number, lng: number }[], color: string }[] = [];
  alertSegments: { start: [number, number], end: [number, number], color: string }[] = [];
  alertIconMap: { [key: string]: string } = {
    overspeeding: 'assets/images/icon-vehicle/os.svg',
    night_driving: 'assets/images/icon-vehicle/nd.svg',
    harsh_acceleration: 'assets/images/icon-vehicle/harsh_a.svg',
    harsh_braking: 'assets/images/icon-vehicle/harsh_b.svg',
    harsh_Cornering: 'assets/images/icon-vehicle/harsh_c.svg',
    default: 'assets/images/icon-vehicle/os.svg',
    low_battery_charge: 'assets/images/icon-vehicle/bettery_level.svg',
    sufficient_battery_charge: 'assets/images/icon-vehicle/bettery_level.svg',
    gps_signal_lost: 'assets/images/icon-vehicle/ev_range.svg'
  };

  getAlertIcon(alertType: string): string {
    return this.alertIconMap[alertType?.toLowerCase()] || this.alertIconMap['default'];
  }

  hoveredAlertId: string | null = null;

  getHighlightedIcon(alertType: string): string {
    switch (alertType) {
      case 'overspeeding': return 'assets/images/hover-icon.svg';
      case 'night_driving': return 'assets/icons/night-driving-highlighted.svg';
      case 'harsh_cornering': return 'assets/images/hover-icon.svg';
      case 'harsh_braking': return 'assets/icons/harsh-braking-highlighted.svg';
      case 'harsh_acceleration': return 'assets/icons/harsh-acceleration-highlighted.svg';
      case 'low_battery_charge': return 'assets/images/hover-icon.svg';
      case 'sufficient_battery_charge': return 'assets/images/hover-icon.svg';
      case 'gps_signal_lost': return 'assets/images/hover-icon.svg';
      default: return 'assets/icons/default-highlighted.svg';
    }
  }

  async onArrowClick(trip: any) {
    this.newMap = false;
    this.isTripSelected = true
    this.oldMap = true;
    this.isResetAction = true;
    const { vin, provider, tripId } = trip;
    // if (!vin || !provider || !tripId) return;
    this.dashboardservice.gettripSummaryHistory(vin, provider, tripId)
      .subscribe(async (res: any) => {
        this.dataForVehicleDetails = res;
        const coords = res.cxSnappedCoords;
        if (Array.isArray(coords) && coords.length > 1) {
          const cleaned = coords.filter(
            (pt: any) => Array.isArray(pt) && pt.length === 2
              && typeof pt[0] === 'number' && typeof pt[1] === 'number'
          );
          this.snappedPolylineCoords = cleaned.map(([lat, lng]: [number, number]) => ({ lat, lng }));

          const [sLat, sLng] = cleaned[0];
          const [eLat, eLng] = cleaned[cleaned.length - 1];
          this.start_end_mark = [{
            startLat: sLat,
            startLng: sLng,
            endLat: eLat,
            endLng: eLng,
            startAddress: res.startAddress || 'Address not available',
            endAddress: res.endAddress || 'Address not available'
          }];
        }

        // 6. Loop through alerts
        for (const alert of (res.cxAlerts || [])) {
          // 6a. Determine alertType first
          const alertType = alert.alert_description?.toLowerCase() || 'default';

          // 6b. Format timestamp
          if (alert.alert_description === 'night_driving') {
            alert.originalAlertTime = alert.alert_timestamp;
            alert.formattedAlertTime = alert.alert_timestamp
              ? moment.utc(alert.alert_timestamp)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY, HH:mm')
              : '--';
            alert.originalAlertTimeFormatted = alert.alert_timestamp
              ? moment.utc(alert.alert_timestamp).format('HH:mm')
              : '--'; // Format the original time in HH:mm
          } else {
            alert.formattedAlertTime = alert.alert_timestamp
              ? moment.utc(alert.alert_timestamp)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY, HH:mm')
              : '--';
          }

          // 6c. Extract lat/lng (preferring alert_location)
          let lat: number | undefined, lng: number | undefined;
          if (Array.isArray(alert.alert_location) && alert.alert_location.length === 2) {
            [lng, lat] = alert.alert_location;
          } else if (alertType === 'overspeeding' && alert.cx_final_location) {
            lat = alert.cx_final_location.cx_latitude;
            lng = alert.cx_final_location.cx_longitude;
          } else if (alert.cx_initial_location) {
            lat = alert.cx_initial_location.cx_latitude;
            lng = alert.cx_initial_location.cx_longitude;
          }
          if (lat == null || lng == null) {
            continue;
          }

          // 6d. Reverse geocode to get address
          const address = await this.getAddress({ latitude: lat, longitude: lng });
          // 6e. Choose icon
          const iconMap: Record<string, string> = {
            overspeeding: 'assets/images/Over_speeding.svg',
            night_driving: 'assets/images/Night_Driving.png',
            harsh_acceleration: 'assets/mapIcon/harsh_acceleration.png',
            harsh_braking: 'assets/mapIcon/harsh_braking.png',
            harsh_cornering: 'assets/mapIcon/Harsh_Cornerings.svg',
            low_battery_charge: 'assets/images/Battery-low.svg',
            sufficient_battery_charge: 'assets/images/Battery-low.svg',
            gps_signal_lost: 'assets/images/gps-signal.svg',
            default: 'assets/mapIcon/alert_marker.png'
          };
          const iconUrl = iconMap[alertType] || iconMap.default;
          const iconSize = new google.maps.Size(5, 5);
          const iconAnchor = new google.maps.Point(7, 7);
          // 6f. Push marker
          this.eventMarkers.push({
            lat,
            lng,
            alertId: alert.alert_id,
            icon: { url: iconUrl, size: iconSize, anchor: iconAnchor },
            highlightIcon: { url: this.getHighlightedIcon(alert.alert_description), size: iconSize, anchor: iconAnchor },
            alertType: alert.alert_description || 'Unknown Alert',
            timestamp: alert.alert_timestamp,
            formattedAlertTime: alert.formattedAlertTime,
            address
          });

          // 6g. Draw red segment for specific alert types
          if (['overspeeding', 'harsh_cornering'].includes(alertType)
            && alert.cx_initial_location && alert.cx_final_location
          ) {
            try {
              const snappedPts = await this.getSnappedPoints(
                alert.cx_initial_location.cx_latitude,
                alert.cx_initial_location.cx_longitude,
                alert.cx_final_location.cx_latitude,
                alert.cx_final_location.cx_longitude
              );
              for (let i = 0; i < snappedPts.length - 1; i++) {
                this.alertSegments.push({
                  start: [snappedPts[i].lat, snappedPts[i].lng],
                  end: [snappedPts[i + 1].lat, snappedPts[i + 1].lng],
                  color: '#ff0000'
                });
              }
            } catch (e) {
              console.error('Error snapping alert segment:', e);
            } }}
// 7. Finally, show the map
        this.showMap = true;
      },
        err => console.error('Error fetching trip history:', err)
      );
  }

  async getSnappedPoints(startLat: number, startLng: number, endLat: number, endLng: number) {
    const osrmUrl = `https://osrm.cerebrumx.ai/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(osrmUrl);
      const data = await response.json();
      if (data.code === "Ok" && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
          lat: coord[1],
          lng: coord[0]
        }));
        return coordinates;
      }
    } catch (error) {
      console.error("Error fetching OSRM route:", error);
    }
    return [];
  }
  toggleArrow(trip: any): void {
    if (this.selectedTripId === trip.tripId) {
      this.selectedTripId = null;
      this.selectedTrip = null;
    } else {
      this.selectedTripId = trip.tripId;
      this.selectedTrip = trip;
      this.onArrowClick(trip)
    }
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

  maskVins(vin: string): string {
    if (vin && vin.length >= 3) { // Add a null check for vin
      return '***' + vin.slice(-3);
    } else {
      return vin;
    }
  }
  formatMinutesToHourMin(minutes: number): string {
    if (minutes == null || isNaN(minutes)) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  formatMinutesToHourMinu(minutes: number | null | undefined): string {
    if (minutes == null) {
      return '0 m idle';
    }
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    const parts = [];
    if (hrs) parts.push(`${hrs} h`);
    if (mins || !hrs) parts.push(`${mins} m`);
    return parts.join(' ') + ' idle';
  }
  formatMinutesToHourMins(minutes: number): string {
    if (minutes == null || isNaN(minutes)) return '--';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }
  subscribeToLiveSpeed() {
    if (!Array.isArray(this.latestUpdatedVehicles)) {
      return;
    }
    this.latestUpdatedVehicles.forEach(vehicle => {
      if (vehicle.colorCode === 'GREEN') {
        const vin = vehicle.vin;
        const tripId = vehicle.tripId;
      }
    });
  }
  getDriverName(name: string): string {
    if (!name || name === 'null null') return '--';
    return name;
  }
  getLabelColor(colorCode: string): string {
    switch (colorCode) {
      case 'red':
        return '#d9534f'; // Bootstrap red
      case 'green':
        return '#5cb85c'; // Bootstrap green
      case 'blue':
        return '#4680FF'; // Bootstrap blue
      default:
        return '#333'; // Default dark color
    }
  }
  addressSplit(address) {
    const firstCommaIndex = address.indexOf(',');
    if (firstCommaIndex !== -1) {
      this.firstAddressPart = address.substring(0, firstCommaIndex).trim();
      this.secondAddressPart = address.substring(firstCommaIndex + 1).trim();
    } else {
      this.firstAddressPart = address
    }
  }
  // toggleInfoWindow(data: any, infoWindow): void {
  //   infoWindow.open()
  //   if (data) {
  //     this.alertTip = data
  //   }}
  noActivityDetected() {
    this.modalService.open(this.noVehicleActivity, { centered: true });
  }
  openTab(trip) {
    if (trip?.colorCode === 'GREEN') {
      this.newMap = true;
      this.oldMap = false;
      this.zoom = 14;     // set zoom level to 18
      this.getStremingData(trip)
    }
  }
  handleVehicleClick(vehicle: any): void {
    this.onSelectVehicle(vehicle);
    this.openTab(vehicle);
  }
  getVehicleByVin(vin: string): any {
    return this.latestUpdatedVehicles?.find(v => v.vin === vin);
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
  // filter Vehicle
  filterCar(color) {
    this.colorCode = color === 'ALL' ? null : color;
    this.vehicleList();
  }

  intervalTme() {
    this.interval = setInterval(() => {
      this.vehicleList(this.VIN)
    }, 10000)}
  @ViewChild('agmMap') agmMapElement: any;
  map: google.maps.Map;
  subtractMinutes(date: string, minutesToSubtract: number): string {
    return moment.utc(date)
      .subtract(minutesToSubtract, 'minutes')
      .tz(this.selectedTimezone)
      .format('MMM D, YYYY HH:mm');
  }

  subtractMinutesForStopped(date: string, minutesToSubtract: number): string {
    return moment.utc(date)
      .subtract(minutesToSubtract, 'minutes')
      .tz(this.selectedTimezone)
      .format('HH:mm'); // Only time
  }
  eventType: any;
  startDateTime: any;
  rawStartDateTime: any;
  // Streaming Live Data
  getStremingData(trip) {
    let dataReceived = false;
    const timeout = setTimeout(() => {if (!dataReceived) { }}, 60000);
    this.dashboardservice.getServerSentEvent(trip?.vin, trip?.tripId).subscribe((res: any) => {
      this.isLive = true
      let data = JSON.parse(res?.data)
        this.eventType = data?.eventType
          this.rawStartDateTime = data?.tripStartTime;
          this.startDateTime = this.rawStartDateTime
            ? moment.utc(this.rawStartDateTime).tz(this.selectedTimezone).format('MMM D, YYYY, HH:mm')
            : '--';
          // get live data from the API  // get live data from the API
      this.getLiveData(data)
      if (data) {
        this.alertTip = data
        this.getAddress(data)
        clearTimeout(timeout);
      }
    }, err => {
      clearTimeout(timeout);
    })
  }
  // live Tracking without history
  getLiveData(liveData: any): void {
    this.LatLng = liveData;
    const telemetryList = liveData?.cxTelemetryDataList;
    // Initialize containers
    if (!this.waypoints) this.waypoints = [];
    if (!this.latLng) this.latLng = [];
    if (!this.seenPoints) this.seenPoints = new Set();
    if (!this.snappedWaypoints) this.snappedWaypoints = [];
    // Extract and append new telemetry points
    if (telemetryList?.length) {
      telemetryList.forEach((data: any) => {
        const point = { lat: data.latitude, lng: data.longitude };
        const key = `${point.lat},${point.lng}`;
        if (!this.seenPoints.has(key)) {
          this.seenPoints.add(key);
          this.waypoints.push(point);
          this.latLng.push(point);
        }
      });
      // Set latest point as vehicle marker
      const latestPoint = telemetryList[telemetryList.length - 1];
      if (latestPoint.latitude && latestPoint.longitude) {
        this.latitude = latestPoint.latitude;
        this.longitude = latestPoint.longitude;
      }
      // If history (multiple points), snap in bulk
      if (this.latLng.length > 2) {
        this.getSnappedPointssFromArray(this.latLng).then(snapped => {
          this.snappedWaypoints = snapped;
          this.drawPolylines();
        });
      }
      else if (this.latLng.length === 2) {
        // Small batch: Snap the pair
        const from = this.latLng[0];
        const to = this.latLng[1];
        this.getSnappedPoints(from.lat, from.lng, to.lat, to.lng).then(snapped => {
          this.snappedWaypoints.push(...snapped);
          this.drawPolylines();
        });
      } else {
        // Less than 2 points, clear polyline
        this.polylines = [];
      }
    }
    // Draw alert markers directly here
    const iconMap = {
      "rapid_acceleration": "./assets/images/HA_TH.svg",
      "harsh_acceleration": "./assets/images/HA_TH.svg",
      "harsh_braking": "./assets/images/HB_TH.svg",
      "harsh_cornering": "./assets/images/HC_TH.svg",
      "night_driving": "./assets/images/ND_TH.svg",
      "idling": "./assets/images/ND_TH.svg",
      "overspeeding": "./assets/images/OS_TH.svg"
    };
    const alertNames = {
      "harsh_acceleration": "Harsh Acceleration",
      "harsh_braking": "Harsh Braking",
      "harsh_cornering": "Harsh Cornering",
      "night_driving": "Night Driving",
      "overspeeding": "Overspeeding"
    };
    this.alertMarkers = []; // Clear existing alert markers
    const newAlerts = liveData?.alerts?.filter((alert: any) => alert.initialLatitude && alert.initialLongitude) || [];
    // Add new alert markers
    newAlerts.forEach((alert: any) => {this.alertMarkers.push({
        id: alert.alertId,
        description: alert.alertDescription,
        lat: alert.initialLatitude,
        lng: alert.initialLongitude,
        iconUrl: iconMap[alert.alertDescription] || "./assets/images/ND_TH.svg",
        title: alertNames[alert.alertDescription] || "Alert"
      })});
    this.drawPolylines();
  }
  // Draw polyline on live tracking
  drawPolylines(): void {
    this.polylines = [];
    if (this.snappedWaypoints.length >= 2) {
      this.polylines.push({path: this.snappedWaypoints,strokeColor: "#07b57a",strokeWeight: 2,strokeOpacity: 0.8});
      this.animatePolyline(this.snappedWaypoints);
    }
    else if (this.waypoints.length >= 2) {
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        const current = this.waypoints[i];
        const next = this.waypoints[i + 1];
        const isOverspeeding = this.checkIfOverspeeding(current, next, this.LatLng?.alerts);
        this.polylines.push({path: [current, next],strokeColor: isOverspeeding ? "#FF0000" : "#07b57a",strokeWeight: 2,strokeOpacity: 0.8});
      }// Smooth line drawing logic for non-snapped waypoints
      this.animatePolyline(this.waypoints);
    }
  }

  // Helper function for smooth polyline animation
  animatePolyline(waypoints: { lat: number, lng: number }[]): void {
    let index = 0;
    let path = [];
    const draw = () => {
      if (index < waypoints.length) {
        path.push(waypoints[index]);
        this.polylines = [{path: path,strokeColor: "#07b57a", strokeWeight: 2,strokeOpacity: 0.8}];
        index++;
        requestAnimationFrame(draw);
      }};
    draw();
  }
  // Helper function to check if a segment is overspeeding
  checkIfOverspeeding(startPoint: { lat: number; lng: number },endPoint: { lat: number; lng: number },alerts: any[]): boolean {
    return alerts?.some((alert) =>
        alert.alertDescription === "overspeeding" &&
        alert.initialLatitude === startPoint.lat &&
        alert.initialLongitude === startPoint.lng &&
        alert.finalLatitude === endPoint.lat &&
        alert.finalLongitude === endPoint.lng
    )}
  // Fetch snapped points from OSRM API
  async getSnappedPointssFromArray(points: { lat: number, lng: number }[]): Promise<any[]> {
    if (points.length < 2) {
      throw new Error('At least two points (start and end) are required.');
    }
    const start = points[0];
    const end = points[points.length - 1];
    const url = `https://osrm.cerebrumx.ai/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.routes || !data.routes[0] || !data.routes[0].geometry) {
      throw new Error('Invalid OSRM response');
    }
    const coordinates = data.routes[0].geometry.coordinates;
    return coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
  }
  // Fetch address from latlong georeverse API.
  getAddress(latLng: { latitude: number; longitude: number }): Promise<string> {
    const { latitude: lat, longitude: lon } = latLng;
    if (lat == null || lon == null) {
      return Promise.resolve('Coordinates missing');
    }
    const url = `https://latlong.cerebrumx.ai/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    return fetch(url)
      .then(r => r.json())
      .then(result => {
        return result?.display_name ?? 'Address not found'})
      .catch(err => {
        console.error('Reverse geocode error:', err);
        return 'Address lookup error';
      });
  }
}
