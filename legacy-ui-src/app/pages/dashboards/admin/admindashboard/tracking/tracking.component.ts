import { Component, ElementRef, Renderer2, Inject, OnInit, PLATFORM_ID, ViewChild, Input, HostListener } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { MapsAPILoader } from '@agm/core';
import { ChangeDetectorRef, NgZone } from '@angular/core'; // ensure imported
import { Subscription, firstValueFrom, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/app.service';
import moment from 'moment';
import { DatePipe } from '@angular/common';
import { TimezoneService, } from "src/app/layouts/user-role/users-role.service";
import { formatDate } from '@angular/common';
import { FleetSelectionService } from 'src/app/core/services/users-role.service';
import { FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
interface GeofenceItem {
  id: number;
  name: string;
  // ... add other properties if needed
}
interface SelectedVehicle {
  vin: string;
  alias: string;
  driverName: string;
  // ... other fields
}
@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss']
})

export class TrackingComponent implements OnInit {
  selectedGeofenceIds: number[] = []; // To store selected IDs
  geofenceList: GeofenceItem[] = [];  // This will come from your API
  eventType: any;
  startDateTime: any;
  rawStartDateTime: any;
  currentTripDetails: any;
  filteredData: any[];
  latLng: any;
  vehicleSelection: any;
  polylines: {
    path: { lat: number; lng: number }[];
    strokeColor: string; strokeWeight: number; strokeOpacity: number
  }[] = []; // Declare the property
  seenPoints: Set<string> = new Set();
  selectedFleetId: number;
  dataAddress: any;
  carRotationAngle: number;
  heading: number = 0;
  alertList: any[];
  totalData: any;
  groupList: any;
  psl: any;
  geoFenceData: any;
  alertEventList: any;
  @HostListener('document:click', ['$event'])
  searchVIN:any;
  searchEvent:any;
  eventList: any;
  pageNumber: number = 1;
  pageSize: number = 40
  totalPages: any;
  pages: any;
  groupId: any;
  fleedId: string;
  pslLimit: any;
  lmTripId: any;
  isCamera: boolean=false;
  onDocumentClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.closest('.agm-info-window') && !clickedElement.closest('.agm-marker')) {
      this.startInfoWindowOpen = false;
    }
  }
  @Input() trip: any;
  mapStyles: any = [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        { color: "#DBECF3" }, // Updated water color
        { lightness: 10 },
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
  dataLoading: boolean = false;
  isTripSelected = false; // false by default
  eachTripEndPoints: {
    lat: number;
    lng: number;
    distance?: number | string;
    dateTime?: number | string;
    trip?: {
      cxIdlingDuration?: number;
      startAddress?: string;
      endAddress?: string;
      cxTripDistance: string,
      cxAlerts?: string,
    };
  }[] = [];
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
  selectedTab: string = 'vehicle';
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
  infoWindowOpen = false;
  currentMonth: number;
  currentYear: number;
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  dayNames: string[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  private globalClickUnlistener: (() => void) | null = null;
  dates: any[] = [];
  hoveredTripIndex: number | null = null;
  startDate: any = null;
  endDate: any = null;
  hoveredDate: any = null;
  displayRange = '';
  @ViewChild('search') public searchElementRef: ElementRef;
  zoomLevel = 10;
  @ViewChild('map') public mapElementRef: ElementRef;
  selectedRadius = 1;
  radiusData = [{ radius: 'Circle' }, { radius: 'Reactangle' }, { radius: 'Polygon' }]; // Example data
  public entries = [];
  geofenceForm: FormGroup;
  marker: any;
  getTypeList: any;
  geofenceTypes = [
    { label: 'Circle', value: 'CIRCLE' },
    { label: 'Rectangle', value: 'RECTANGLE' },
    { label: 'Polygon', value: 'POLYGON' }
  ];
  address: string = '';
  geofenceType: any = ''
  selectedGeofenceType: string
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('search', { static: false }) searchElement!: ElementRef;
  map!: google.maps.Map;
  errorMessages: any;
  geoLocations: number[][] = [];
  groupIdData: any;
  geofence: any;
  selectConsumerId: void;
  polygon: any;
  selectedLatLng: string = '';
  drawnShape: google.maps.Polygon | google.maps.Circle | google.maps.Rectangle | null = null;
  constructor(private eRef: ElementRef, private renderer: Renderer2, private datePipe: DatePipe, private mapsAPILoader: MapsAPILoader, private timezoneService: TimezoneService, @Inject(PLATFORM_ID) public http: HttpClient, private modalService: NgbModal, private dashboardservice: TaxonomyService, private router: Router, private appService: AppService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone) {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
  }
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null = null;
  mapOptions: google.maps.MapOptions = {
    zoomControl: false, // Hide default controls
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false
  };
  isPanelOpen: boolean = true;
  defaultCenter = { lat: 40.73061, lng: -73.935242 };
  center = { ...this.defaultCenter };
  defaultZoom = 8;
  geoFenceList: any[] = [];

  addCustomControls(map: google.maps.Map) {
    const controlWrapper = document.createElement('div');
    controlWrapper.style.display = 'flex';
    controlWrapper.style.background = 'transparent'; // ✅ Transparent background
    controlWrapper.style.border = 'none'; // ✅ Remove border if needed
    controlWrapper.style.borderRadius = '4px';
    controlWrapper.style.boxShadow = 'none'; // ✅ Remove shadow if desired
    controlWrapper.style.margin = '5px';
    controlWrapper.style.overflow = 'visible';
    const zoomIn = this.createButton(`<img src="assets/mapIcon/plus.svg" alt="Zoom In" width="15" height="15">`, () => {
      map.setZoom(map.getZoom() + 1);
    });

    // Zoom Out
    const zoomOut = this.createButton(`<img src="assets/mapIcon/minus.svg" alt="Zoom In" width="15" height="15">`, () => {
      map.setZoom(map.getZoom() - 1);
    });

    // Center Button
    const centerBtn = this.createButton(`<img src="assets/mapIcon/recenter.svg" alt="Zoom In" width="15" height="15">`, () => {
      map.setCenter(this.defaultCenter);
    });

    // Refresh Button
    const refreshBtn = this.createButton(`<img src="assets/mapIcon/refresh.svg" alt="Zoom In" width="15" height="15">`, () => {
      this.startAutoRefresh();
    });
    const fullViewBtn = this.createButton(
      `<img src="assets/mapIcon/fullView.svg" alt="Full View" width="15" height="15">`,
      () => {
        map.setCenter(this.defaultCenter);
        map.setZoom(this.defaultZoom);
      }
    );
    controlWrapper.append(zoomIn, zoomOut, centerBtn, refreshBtn);
    controlWrapper.appendChild(fullViewBtn)
    map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(controlWrapper);
  }

  createButton(label: string, onClick: () => void): HTMLDivElement {
    const btn = document.createElement('div');
    btn.innerHTML = label;
    btn.style.padding = '5px 10px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '12px';
    btn.style.margin = '3px'; // 👈 Add margin here
    btn.style.background = '#fff';
    btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    btn.style.userSelect = 'none';
    btn.addEventListener('mouseover', () => {
      btn.style.background = '#f0f0f0';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.background = '#fff';
    });
    btn.addEventListener('click', onClick);
    return btn;
  }

  toggleMapType(): void {
    this.currentMapType = this.currentMapType === 'roadmap' ? 'satellite' : 'roadmap';
  }

  toggleLayerOptions() {
    this.layerOptionsVisible = !this.layerOptionsVisible;
  }


  setMapType(type: 'roadmap' | 'satellite') {
    this.currentMapType = type;
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

  closeCalendar() {
    this.showCalendar = false;
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

  async ngOnInit() {

    this.showRole();
    await this.loadDataSequentially();
    this.manageGeofenceLists() // Wait to populate this.allVehicles
    this.searchFilter();
    if (this.user != 'role_user_fleet'|| this.user != 'role_org_group' ) {
      this.selectConsumers('')
    }
    if (this.user === 'role_user_fleet' || this.user === 'role_org_group') {
      this.selectGroupId()
      this.manageGeofenceLists()
      this.selectFleetId()

    }


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
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-based
    const day = today.getDate();
    const selectedMonth = (month + 1).toString().padStart(2, '0');
    const selectedDay = day.toString().padStart(2, '0');
    this.selectedDate = `${year}-${selectedMonth}-${selectedDay}`;
    this.displayDate = this.formatDisplayDate(year, month, day);
    this.generateCalendar();
  }

  getAlert(customer?) {
    this.subscription$.add(
      this.dashboardservice.getAlerts(customer).subscribe((res:any)=>{
        this.alertEventList = res;
      })
    )
  }

  selectedVehicle: any = null;
  selectedIndex: number | null = null;

  showDetails(index: number) {
    this.selectedIndex = index;
  }

  closeDetails() {
    this.selectedIndex = null;
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
      this.currentMonth;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }
  generateCalendar() {
    this.dates = [];
    const today = new Date();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const offset = (firstDayOfWeek + 6) % 7;
    const currentMonthNumber = this.currentMonth + 1;
    for (let i = 0; i < offset; i++) {
      this.dates.push({
        day: null,
        active: false,
        year: this.currentYear,
        month: currentMonthNumber
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(this.currentYear, this.currentMonth, i);
      const dateStr = `${this.currentYear}-${String(currentMonthNumber).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isPastOrToday = dateObj <= today;
      const hasTrip = this.tripDatesWithData.has(dateStr);
      this.dates.push({
        day: i,
        active: isPastOrToday || hasTrip, // ✅ ALLOW future dates *if* there's a trip
        year: this.currentYear,
        month: currentMonthNumber
      });
    }
  }

toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar && !this.globalClickUnlistener) {
      this.globalClickUnlistener = this.renderer.listen('document', 'click', (event: Event) => {
        if (!this.eRef.nativeElement.contains(event.target)) {
          this.showCalendar = false;
          this.removeClickListener();
        }
      });
    }
  }
  private removeClickListener(): void {
    if (this.globalClickUnlistener) {
      this.globalClickUnlistener();
      this.globalClickUnlistener = null;
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
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showCalendar = false;
    }
  }

  formatDisplayDate(year: number, monthIndex: number, day: number): string {
    const date = new Date(year, monthIndex, day);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  isToday(dateString: string): boolean {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  }

  hoverDate(date: any) {
    this.hoverDate = date;
  }

  resetHover() {
    this.hoverDate = null;
  }

  isFutureDate(date: any): boolean {
    const today = new Date();
    const dateObj = new Date(date.year, date.month, date.day);
    return dateObj > today;
  }

  selectRange(date: any) {
    if (this.isFutureDate(date)) return;
    if (!this.startDate || (this.startDate && this.endDate)) {
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

  isInRange(date: any): boolean {
    if (!this.startDate || !this.endDate) return false;
    const d = new Date(date.year, date.month, date.day);
    const start = new Date(this.startDate.year, this.startDate.month, this.startDate.day);
    const end = new Date(this.endDate.year, this.endDate.month, this.endDate.day);
    return d >= start && d <= end;
  }

  isStartDate(date: any): boolean {
    return this.startDate &&
      date.day === this.startDate.day &&
      date.month === this.startDate.month &&
      date.year === this.startDate.year;
  }

  isEndDate(date: any): boolean {
    return this.endDate &&
      date.day === this.endDate.day &&
      date.month === this.endDate.month &&
      date.year === this.endDate.year;
  }
  ngOnDestroy(): void {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    if (this.interval) {
      clearInterval(this.interval)
    }
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
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
        // Log if filteredData is null or empty
      }
    }
    // Continue with updating other data (e.g., getData, selectedTrip, alerts, etc.)

    // if (Array.isArray(this.featuresList)) {
    //   this.featuresList = this.featuresList.map(feature => {
    //     const timestamp = feature.properties?.cx_readable_timestamp;

    //     const formattedDateNewData = timestamp
    //       ? moment.utc(timestamp).tz(this.selectedTimezone).format('MMM D, YYYY')
    //       : '--';

    //     const formattedTimeNewData = timestamp
    //       ? moment.utc(timestamp).tz(this.selectedTimezone).format('HH:mm')
    //       : '--';

    //     return {
    //       ...feature,
    //       properties: {
    //         ...feature.properties,
    //         formattedDateNewData,
    //         formattedTimeNewData
    //       }
    //     };
    //   });
    // }


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
  subtractMinutesForStopped(date: string, minutesToSubtract: number): string {
    return moment.utc(date)
      .subtract(minutesToSubtract, 'minutes')
      .tz(this.selectedTimezone)
      .format('HH:mm'); // Only time
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
    if(this.customConsumer) {
      this.getAlert(this.customConsumer)
    }
    const token = localStorage.getItem('access_token');
    if (this.user === 'role_user_fleet') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId
    }
    if (this.user === 'role_org_group') {

      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
    }
    this.searchFilter()
  }

  selectConsumers(consumer: string) {
    this.consumer = consumer;
    this.loadDataSequentially()

      if (this.consumer !== 'All') {
        this.subscription$.add(
          this.dashboardservice.getFleetList(this.customConsumer).subscribe((res: any) => {
            this.fleetList = res;

            this.fleetList.sort((a, b) => a.id - b.id);
            if (this.fleetList && this.fleetList.length > 0) {
              this.fleetIds = this.fleetList.map((fleet: any) => fleet.id).join(', ');
            }
            this.selectGroupId()
            this.fleetIdData = null;
            this.VIN = null;
            this.backFromTrip();
          }, err => {
            console.error('Error fetching fleet list:', err);
          })
        );

    }
    this.oldMap = true;
    this.newMap = false;
    this.eventType = null;
    this.selectedVehicle = null;
    this.showMap = true;
    this.showPolyline = false;
    this.isTripSelected = false;
    this.snappedPolylineCoords = [];
    this.isResetAction = true; // Set this flag only on reset
    this.start_end_mark = [];
    this.eachTripEndPoints = [];
    this.allTripsCoordinatesArray = [];
    const today = new Date();
    this.displayDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.selectedDate = new Date().toISOString().split('T')[0];
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  selectFleetId() {
    this.zoom = 7;
    this.dataShowThershold = true;
    this.vinList = [];
    if (this.drawnGeofences && this.drawnGeofences.length > 0) {
      this.drawnGeofences.forEach((overlay: any) => {
        if (overlay.setMap) overlay.setMap(null);  // Remove from map
      });
      this.drawnGeofences = [];
    }

    this.geoFenceList = [];
    if (this.fleetIdData) {
      // Fetch VINs
      this.subscription$.add(
        this.dashboardservice.getVINs(this.fleetIdData).subscribe((res: any) => {
          this.vinList = res?.vins;
          this.therShold = res?.profiling?.spdLimit;
          this.psl = res?.profiling?.postSpeedLimit;
          this.pslLimit = res?.profiling?.pslUpperThreshold;
          this.fleedId = this.fleetIdData
          this.searchFilter()
        }, err => {
        })
      );
      this.resetSelection();
      this.backFromTrip();
      this.selectGroupId();
      this.manageGeofenceLists();
    }
  }

  selectGroupId() {
    if (!this.fleetIdData) return;
    this.subscription$.add(
      this.dashboardservice.getOrganizationSubGroups(this.fleetIdData,this.consumer).subscribe((res: any) => {
        const nestedGroups = res?.groups || [];
        this.groupList = this.flattenGroups(nestedGroups);
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
  onFleetIdChange(value: any) {
    this.fleetIdData = value;
    this.zoom = 14;
    if (value) {
      this.selectFleetId();  // Only call when fleetId is selected
    } else {
      this.searchFilter()
      this.loadDataSequentially();  // Call only when cleared
    }
  }


  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.groupId = this.groupIdData;
    this.searchFilter()
    this.loadDataSequentially();
    if (this.groupIdData) {
      this.manageGeofenceLists()
    }
  }


  selectedFilter: string = 'Today'; // Default value
  lat: any;
  lon: any;
  batchSize = 50;
  currentBatchIndex = 0;
  allVehicles: any[] = [];
  displayedVehicles: any[] = [];
  getLiveVehiclePromise(vin?: string): Promise<any> {
    return new Promise((resolve, reject) => {
  this.dashboardservice
          .getLiveVehicle(this.customConsumer, this.fleetIdData, this.groupIdData, vin, this.colorCode)
          .subscribe({
            next: (res) => resolve(res),
            error: (err) => reject(err)
          });

    });
  }

  private setDefaultMapSettings(): void {
  if (this.customConsumer === 'Smallboard') {
      this.latitude = 32.7157;
      this.longitude = -117.1611;
      this.zoom = 10;
    } else {
      // Default fallback
      this.latitude = 39.5;
      this.longitude = -98.35;
      this.zoom = 3;
    }
  }
  connectedProviders = ['FORDPRO', 'GM', 'STELLANTIS', 'TOYOTA', 'TESLA', 'HINO', 'OBD II', 'DASHCAM'];

  filters = {
    providers: {
      FORDPRO: true,
      GM: true,
      STELLANTIS: true,
      TOYOTA: true,
      TESLA: true,
      HINO:true,
      'OBD II': true,     // maps to provider === 'CBX'
      DASHCAM: true       // maps to hasCamera === true
    }
  };

  toggleAllProviders() {
    for (const provider of this.connectedProviders) {
      this.filters.providers[provider] = this.selectAll;
    }
    this.loadDataSequentially();
  }


  onProviderChange() {
    const allSelected = this.connectedProviders.every(
      provider => this.filters.providers[provider]
    );
    this.selectAll = allSelected;
    this.loadDataSequentially();
  }

  refreshSubscription: Subscription;
  selectedProviders: string[] = [];
  async loadDataSequentially(vin?: string) {
    try {
      this.isLoading = true;

      this.setDefaultMapSettings();
      let vehicles = await this.getLiveVehiclePromise(vin);
      const activeFilters = Object.entries(this.filters.providers).filter(([_, checked]) => checked).map(([key]) => key);
      const showAll =
        activeFilters.length === Object.keys(this.filters.providers).length;
      if (!showAll) {
        vehicles = vehicles.filter(vehicle => {
          const provider = vehicle.provider;
          const hasCamera = vehicle.hasCamera === true;
          return (
            activeFilters.includes(provider) ||                                // FORDPRO, GM, etc.
            (activeFilters.includes('OBD II') && provider === 'CBX') ||       // OBD II match
            (activeFilters.includes('DASHCAM') && hasCamera)                  // DASHCAM match
          );
        });
      } else {
      }

      // Show markers immediately
      this.start_end_mark = vehicles.map(vehicle => ({
        endLat: vehicle.endLat,
        endLong: vehicle.endLong,
        colorCode: vehicle.colorCode,
        alias: vehicle.alias,
        address: vehicle.currentAddress,
      }));

      if (this.start_end_mark.length > 0) {
        this.setDefaultMapSettings();
        // this.latitude = this.start_end_mark[0].endLat;
        // this.longitude = this.start_end_mark[0].endLong;
      } else {
        this.setDefaultMapSettings();
      }

      // Add lastUpdatedDiff
      const now = new Date();
      const vehiclesWithTimeDiff = vehicles.map((vehicle: any) => {
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

      this.allVehicles = vehiclesWithTimeDiff || [];
      this.allVehicles = vehiclesWithTimeDiff || [];

      // Summary
      this.totalVehicles = this.allVehicles.length;
      this.parkedVehicles = this.allVehicles.filter(v => v.colorCode === 'RED').length;
      this.movingVehicles = this.allVehicles.filter(v => v.colorCode === 'GREEN').length;
      this.idleVehicles = this.allVehicles.filter(v => v.colorCode === 'YELLOW').length;
      this.currentBatchIndex = 0;
      this.displayedVehicles = [];
      this.updateTodayVehicle = this.allVehicles.length;

      this.isLoading = false;
      await this.displayNextBatch();
      this.isLoading = true;

    } catch (err: any) {
      const errorMessage = err?.apierror?.message || 'Technical Issue, Please try after some time';
    } finally {
      // ✅ Hide loader AFTER first batch shown
      this.isLoading = false;
    }
  }

  startAutoRefresh() {
    this.refreshSubscription = interval(45000).subscribe(() => {
      this.loadDataSequentially();  // call without VIN, or pass the current VIN if needed
    });
  }

  displayNextBatch() {
    if (this.isLoading) return; // prevent multiple calls during loading
    if (!this.hasMoreBatches()) return;

    this.isLoading = true;

    const start = this.currentBatchIndex * this.batchSize;
    const end = start + this.batchSize;
    const nextBatch = this.allVehicles.slice(start, end);
    this.displayedVehicles = this.displayedVehicles.concat(nextBatch);
    this.currentBatchIndex++;
    this.isLoading = false;
  }

  hasMoreBatches(): boolean {
    return this.currentBatchIndex * this.batchSize < this.allVehicles.length;
  }

  // Listen to window scroll to detect near bottom
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const threshold = document.body.offsetHeight - 200;
    const scrollPosition = window.innerHeight + window.scrollY;

    if (scrollPosition >= threshold && this.hasMoreBatches() && !this.isLoading) {
      this.displayNextBatch();  // ✅ This is only for next batches
    }
  }
  selectAll = true;
  // Optional trackBy function
  trackByVehicleId(index: number, vehicle: any) {
    return vehicle.vin || index;
  }

  providerList: string[] = ['CBX', 'FORDPRO', 'GM', 'TESLA', 'TOYOTA',];


  // Example batch processing function — customize this as needed
  processVehicleBatch(vehicleBatch: any[]) {
    if (vehicleBatch && vehicleBatch.length) {
    }
  }

  selectedMarker: any = null;
  onHoverTooltip(vehicle: any): void {
    vehicle.showTooltip = true;

    if (!vehicle.address && vehicle.endLat && vehicle.endLong && !vehicle.isAddressLoading) {
      vehicle.isAddressLoading = true;

      this.dashboardservice.getAddressLatLng(vehicle.endLat, vehicle.endLong).subscribe(
        (res: any) => {
          vehicle.address = res?.displayName || 'Address not found';
          vehicle.isAddressLoading = false;
        },
        (error) => {
          vehicle.address = 'Address lookup error';
          vehicle.isAddressLoading = false;
        }
      );
    }
  }


  onMarkerClick(vehicle: any): void {
    this.selectedMarker = vehicle;

    if (!vehicle.address && vehicle.endLat && vehicle.endLong) {
      vehicle.isAddressLoading = true;  // ✅ Show spinner
      this.dashboardservice.getAddressLatLng(vehicle.endLat, vehicle.endLong).subscribe(
        (res: any) => {
          vehicle.address = res?.displayName || 'Address not found';
          vehicle.isAddressLoading = false;
        },
        (error) => {
          console.error('Reverse geocoding failed:', error);
          vehicle.address = 'Address lookup error';
          vehicle.isAddressLoading = false;
        }
      );
    }
  }



  trackByCoordinate(index: number, item: any): string {
    return item?.vin || item?.id || index.toString();
  }

  trackByAlert(index: number, item: any): string {
    // Return a unique identifier for each alert marker or segment
    return item.id || item.alertId || index.toString();
  }

  hoveredMarker: any = null;

  openInfoWindow(coordinate: any) {
    this.infoWindowOpen = true;
    this.hoveredMarker = coordinate;

    // If address is missing and coordinates exist, fetch address on hover
    if (!coordinate.address && coordinate.endLat && coordinate.endLong) {
      this.dashboardservice.getAddressLatLng(coordinate.endLat, coordinate.endLong).subscribe(
        (res: any) => {
          coordinate.address = res?.displayName || 'Address not found';
        },
        (error) => {
          console.error('Reverse geocoding failed:', error);
          coordinate.address = 'Address lookup error';
        }
      );
    }
  }


  closeInfoWindow() {
    this.hoveredMarker = null;
  }
  yellowMarkers: any[] = [];
  isVehicleListVisible: boolean = false
  allTripsCoordinatesArray: Array<Array<{ lat: number, lng: number }>> = [];
  startAddress: string = '';
  onSelectVehicle(vehicle: any): void {
    this.selectedVehicle = vehicle;
    this.vehicleSelection = vehicle?.vin;
    this.isCamera = vehicle?.hasCamera;

    const selectedVin = vehicle.vin;
    const make = this.selectedVehicle.provider?.toUpperCase();

    // Reset map/trip data
    this.allTripsCoordinatesArray = [];
    this.eachTripEndPoints = [];
    this.start_end_mark = [];
    this.snappedPolylineCoords = [];
    this.isTripSelected = false;
    this.showPolyline = false;
    this.isVehicleListVisible = false;

    // ✅ If trip is ongoing and marker color is yellow, show only that marker
    if (vehicle?.eventType === 'trip_ongoing' && vehicle?.colorCode?.toUpperCase() === 'YELLOW') {
      const yellowMarker = {
        endLat: vehicle.latitude,
        endLong: vehicle.longitude,
        colorCode: 'YELLOW',
        alias: vehicle.alias,
        address: vehicle.address
      };
      this.start_end_mark = [yellowMarker];

      if (this.gMapInstance) {
        this.gMapInstance.setCenter({ lat: yellowMarker.endLat, lng: yellowMarker.endLong });
        this.gMapInstance.setZoom(5);
      }

      return; // ✅ Do not continue with trip history fetch for trip_ongoing
    }

    // 🚗 For past trips
    if (this.selectedDate) {
      if (vehicle?.eventType === 'event_ongoing') {
        this.getStremingData(vehicle);
      } else {
        this.getTripHistorySummary(selectedVin, make);
        this.geoFenceList = [];
        this.getGeofenceDataByVIN(selectedVin);
      }
    }
  }






  refreshingVin: string | null = null;

  resetSelection() {
    this.oldMap = true;
    this.newMap = false;
    this.LatLng = null;
    this.featuresList = []

    this.geoFenceList = [];
    this.manageGeofenceLists()
    this.loadDataSequentially().then(() => {
      this.filterCar(this.lastSelectedColor);
    });

    this.eventType = null;
    this.selectedVehicle = null;
    this.showMap = true;
    this.showPolyline = false;
    this.isTripSelected = false;
    this.snappedPolylineCoords = [];
    this.isResetAction = true; // Set this flag only on reset
    this.start_end_mark = [];
    this.eachTripEndPoints = [];
    this.allTripsCoordinatesArray = [];
    const today = new Date();
    // Reset current month and year to today
    this.currentMonth = today.getMonth(); // 0-based
    this.currentYear = today.getFullYear();

    // Reset selected date (YYYY-MM-DD)
    const selectedMonth = (this.currentMonth + 1).toString().padStart(2, '0');
    const selectedDay = today.getDate().toString().padStart(2, '0');
    this.selectedDate = `${this.currentYear}-${selectedMonth}-${selectedDay}`;

    // Reset display date (e.g., May 6, 2025)
    this.displayDate = this.formatDisplayDate(this.currentYear, this.currentMonth, today.getDate());

    // Regenerate calendar for the current month
    this.generateCalendar();
    this.displayDate = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.selectedDate = new Date().toISOString().split('T')[0];
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }

    // Stop animation (live tracking)
    this.isAnimating = false;  // <-- Add this line

    // Clear telemetry queue
    this.telemetryQueue = [];

    // Clear current running trip
    this.currentRunningTrip = null;
  }

  isResetAction: boolean = false;

  getAdjustedDateTime(endTimeStamp: string, timeGapInMinutes: number): string {
    const endDate = new Date(endTimeStamp);
    endDate.setMinutes(endDate.getMinutes() - timeGapInMinutes); // Subtract the time gap
    return this.datePipe.transform(endDate, 'MMM d, y h:mm a'); // Return the formatted date
  }

  backFromTrip(): void {
    const savedSelectedDay = this.selectedDay;
    this.selectedTripId = null;
    this.isTripSelected = false;
    // Reset any trip-specific data
    this.showPolyline = true;
    this.showMap = true;
    this.isVehicleListVisible = true;
    this.eventMarkers = null;
    this.alertSegments = null;
    this.dataLoading = false;
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

  onMapClick(): void {
    // Close all open info windows
    for (let key in this.tripInfoWindowOpen) {
      this.tripInfoWindowOpen[key] = false;
    }
  }
  isTodaySelected: boolean;

  onDayChange(selectedDate: string): void {
    this.dataLoading = true;
    this.selectedDay = selectedDate;
    this.start_end_mark = [];
    this.allTripsCoordinatesArray = [];
    this.eachTripEndPoints = [];
    this.currentTripDetails = null;
    this.tripDataLength = null;
    this.selectedTab = 'vehicle'
    this.featuresList = [];
    this.alertList = [];
    this.oldMap = true;
    this.newMap = false;
    if (this.selectedVehicle) {
      const selectedVin = this.selectedVehicle.vin;
      const make = this.selectedVehicle.provider?.toUpperCase();
      if (this.displayDate) {
        if (this.eventType === 'trip_ongoing') {
          this.newMap = false;
          this.oldMap = true;
        }
        else if (this.eventType != 'trip_ongoing')
          this.newMap = false;
        this.oldMap = true;
        // Stop SSE live tracking
        if (this.sseSubscription) {
          this.sseSubscription.unsubscribe();
          this.sseSubscription = null;
        }

        // Stop animation (live tracking)
        this.isAnimating = false;  // <-- Add this line

        // Clear telemetry queue
        this.telemetryQueue = [];  // <-- Add this line

        // Clear current running trip
        this.currentRunningTrip = null;
        this.setDefaultMapSettings();
        this.getTripHistorySummary(selectedVin, make);
      }

    }
    else {
    }
    if (this.selectedDate) {
      this.start_end_mark = [];
      this.oldMap = true;
      this.newMap = false;
    }
    const todayInTz = moment().tz(this.selectedTimezone).format('YYYY-MM-DD');
    // ✅ Map toggle logic based on selectedDate
    const isToday = this.selectedDate === todayInTz;
    // Ensure selectedDate is also in the same format
    this.isTodaySelected = this.selectedDate === todayInTz;
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
    const nowInTz = moment().tz(this.selectedTimezone);

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

  // Ramer-Douglas-Peucker simplification algorithm
  simplifyPolyline(points: number[][], tolerance = 0.0001): number[][] {
    if (points.length < 3) return points;

    const sqTolerance = tolerance * tolerance;

    function getSqDist(p1: number[], p2: number[]): number {
      const dx = p1[0] - p2[0];
      const dy = p1[1] - p2[1];
      return dx * dx + dy * dy;
    }

    function getSqSegDist(p: number[], p1: number[], p2: number[]): number {
      let x = p1[0];
      let y = p1[1];
      let dx = p2[0] - x;
      let dy = p2[1] - y;

      if (dx !== 0 || dy !== 0) {
        const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
          x = p2[0];
          y = p2[1];
        } else if (t > 0) {
          x += dx * t;
          y += dy * t;
        }
      }

      dx = p[0] - x;
      dy = p[1] - y;

      return dx * dx + dy * dy;
    }

    function simplifyDP(points: number[][], first: number, last: number, sqTolerance: number, simplified: number[][]) {
      let maxSqDist = sqTolerance;
      let index = -1;

      for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
          index = i;
          maxSqDist = sqDist;
        }
      }

      if (index !== -1) {
        if (index - first > 1) simplifyDP(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDP(points, index, last, sqTolerance, simplified);
      }
    }

    const simplified: number[][] = [points[0]];
    simplifyDP(points, 0, points.length - 1, sqTolerance, simplified);
    simplified.push(points[points.length - 1]);

    return simplified;
  }
  tripDatesWithData: Set<string> = new Set();
  allTripListFlat: any[] = [];
  async getTripHistorySummary(selectedVin: string, selectedOem: string): Promise<void> {
    this.dataLoading = true;
    this.getData = [];
    this.filteredData = [];
    this.allTripsCoordinatesArray = [];
    this.eachTripEndPoints = [];
    this.tripDatesWithData = new Set(); // reset dots

    try {
      const res: any = await this.dashboardservice.gettripSummary(selectedVin, selectedOem).toPromise();
      this.eligibilityData = res;
      this.currentTripDetails = res.currentTripDetails;

      if (!this.selectedDate) {
        console.error('selectedDate is undefined.');
        this.dataLoading = false;
        return;
      }
      const selected = new Date(this.selectedDate);
      const targetMonth = selected.toISOString().slice(0, 7);
      const selectedDateStr = this.selectedDate;
      (res.yearMonthWiseTripList || []).forEach((monthData: any) => {
        if (!monthData?.tripList?.length) return;

        monthData.tripList.forEach((trip: any) => {
          if (!trip?.startTimeStamp) return;
          const tripDate = moment.utc(trip.startTimeStamp).tz(this.selectedTimezone).format('YYYY-MM-DD');
          this.tripDatesWithData.add(tripDate);
        });
      });
      const filteredData = (res.yearMonthWiseTripList || []).flatMap((monthData: any) => {
        if (monthData.yearMonth !== targetMonth) return [];
        const trips = (monthData.tripList || [])
          .filter((trip: any) => {
            if (!trip.startTimeStamp) return false;
            const tripDate = moment.utc(trip.startTimeStamp).tz(this.selectedTimezone).format('YYYY-MM-DD');
            return tripDate === selectedDateStr;
          })
          .sort((a: any, b: any) => new Date(b.endTimeStamp).getTime() - new Date(a.endTimeStamp).getTime())
          .map((trip: any, index: number, array: any[]) => {
            const start = new Date(trip.startTimeStamp);
            const end = new Date(trip.endTimeStamp);
            return {
              ...trip,
              vin: selectedVin,
              provider: selectedOem,
              cxIdlingDuration: typeof trip.cxIdlingDuration === 'number' ? trip.cxIdlingDuration : 0,
              tripDurationInMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
              timeGapFromPrevious: index < array.length - 1
                ? Math.round((start.getTime() - new Date(array[index + 1].endTimeStamp).getTime()) / 60000)
                : null
            };
          });

        return trips.length ? [{ ...monthData, tripList: trips }] : [];
      });

      this.getData = filteredData;
      const allTrips = this.getData.flatMap((month: any) => month.tripList);
      this.allTripListFlat = allTrips;
      this.allTripListFlat = this.getData.flatMap((month: any) => month.tripList);
      const isCurrentTripIncluded = allTrips.some(trip => trip.tripId === this.currentTripDetails?.tripId);
      this.filteredData = !isCurrentTripIncluded && this.currentTripDetails ? [this.currentTripDetails] : [];
      this.updateTime();
      this.tripDataLength = allTrips.length;
      if (!allTrips.length) {
        this.triggerMapUpdate();
        this.dataLoading = false;
        return;
      }

      // ✅ STEP 3: Load full trip summaries and map coords
      await Promise.all(
        allTrips.map(async (trip) => {
          try {
            const summary: any = await this.dashboardservice.gettripSummaryHistory(
              trip.vin, trip.provider, trip.tripId
            ).toPromise();

            const coords = summary?.cxSnappedCoords;
            if (Array.isArray(coords) && coords.length > 1) {
              const simplifiedCoords = this.simplifyPolyline(coords, 0.0001);
              const tripCoords = simplifiedCoords.map(([lat, lng]) => ({ lat, lng }));
              const [endLat, endLng] = simplifiedCoords[simplifiedCoords.length - 1];

              if (tripCoords.length > 1) {
                const fullPoint = {
                  lat: endLat,
                  lng: endLng,
                  dataAddress: summary?.endAddress || '',
                  startSAddress: summary?.startAddress || '',
                  trip,
                  speed: summary.cxAvgVehicleSpeed.toFixed(2)
                };

                this.zone.run(() => {
                  this.allTripsCoordinatesArray.push(tripCoords);
                  this.eachTripEndPoints.push(fullPoint);
                  this.adjustMapZoomAndCenter();
                  this.cdr.detectChanges();
                });
              }
            }
            requestIdleCallback(() => {
              const cxAlerts = summary?.cxAlerts || [];
              Object.assign(trip, {
                startAddress: summary?.startAddress || 'Loading...',
                endAddress: summary?.endAddress || 'Loading...',
                cxTripDistance: typeof summary?.cxTripDistance === 'number'
                  ? summary.cxTripDistance.toFixed(2)
                  : '0.00',
                cxIdlingDuration: typeof summary?.cxIdlingDuration === 'number'
                  ? summary.cxIdlingDuration
                  : 0,
                  cxAlerts: cxAlerts.length, // Keep this unchanged
                  hasGeofenceAlert: this.hasGeofenceAlert(cxAlerts) // ✅ Add this

              });
            });

          } catch (err) {
            console.error(`Failed to load tripId ${trip.tripId}`, err);
          }
        })
      );

      this.dataLoading = false;

    } catch (error) {
      console.error('Error fetching trip summary:', error);
      this.dataLoading = false;
    }
  }
  hasGeofenceAlert(alerts: any[]): boolean {
    if (!Array.isArray(alerts)) return false;
    return alerts.some((alert: any) =>
      ['geofence_crossed_out', 'geofence_crossed_in', 'geofence_crossed_crossed']
        .includes(alert.alert_description)
    );
  }
  hasTripOnDate(date: { year: number; month: number; day: number }): boolean {
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    const hasTrip = this.tripDatesWithData.has(dateStr);
    return hasTrip;
  }

  formatSecondsToHourMinu(seconds: number): string {
    if (typeof seconds !== 'number' || seconds <= 0) return '0m';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }

    return `${mins}m ${secs}s`;
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
  tooltipLng: number = 0;
  eventMarkers: Array<{
    lat: number;
    lng: number;
    icon: google.maps.Icon;
    highlightIcon: google.maps.Icon;     // <-- Add this
    alertType: string;
    timestamp: string;
    alertId: string;                     // <-- Add this
    address?: any;
    formattedAlertTime?: string
    speed?: number                // Optional if you're using address in tooltips
  }> = [];

  vehicleLat: number;
  vehicleLng: number;
  polylineColor: string = '#45b01f';
  eventIcons = {
    "harsh_acceleration": "red",
    "rapid_acceleration": "red",
    "harsh_braking": "red",
    "geofence_crossed": "red",
    "harsh_cornering": "red",
    "overspeeding": "red",
    "idling": "red",
    "default": "red"
  };
  overspeedingPolylines: { path: { lat: number, lng: number }[], color: string }[] = [];
  alertSegments: { start: [number, number], end: [number, number], color: string }[] = [];
  alertIconMap: { [key: string]: string } = {
    overspeeding: 'assets/images/icon-vehicle/os.svg',
    rapid_acceleration: 'assets/images/icon-vehicle/harsh_a.svg',
    night_driving: 'assets/images/icon-vehicle/nd.svg',
    harsh_acceleration: 'assets/images/icon-vehicle/harsh_a.svg',
    harsh_braking: 'assets/images/icon-vehicle/harsh_b.svg',
    geofence_crossed: 'assets/images/icon-vehicle/ev_range.svg',
    geofence_crossed_in: 'assets/images/icon-vehicle/ev_range.svg',
    geofence_crossed_out: 'assets/images/icon-vehicle/ev_range.svg',
    overspeeding_in_geofence: 'assets/images/icon-vehicle/ev_range.svg',
    harsh_Cornering: 'assets/images/icon-vehicle/harsh_c.svg',
    default: 'assets/images/icon-vehicle/os.svg',
    low_battery_charge: 'assets/images/icon-vehicle/bettery_level.svg',
    sufficient_battery_charge: 'assets/images/icon-vehicle/bettery_level.svg',
    gps_signal_lost: 'assets/images/icon-vehicle/ev_range.svg',
    impact_event: 'assets/images/icon-vehicle/ev_range.svg'
  };

  getAlertIcon(alertType: string): string {
    return this.alertIconMap[alertType?.toLowerCase()] || this.alertIconMap['default'];
  }

  hoveredAlertId: string | null = null;

  getHighlightedIcon(alertType: string): string {
    return (
      {
        overspeeding: 'assets/images/over_green.svg',
        rapid_acceleration: 'assets/images/harsh_green.svg',
        night_driving: 'assets/images/night_green.svg',
        harsh_cornering: 'assets/images/corner_green.svg',
        harsh_braking: 'assets/images/brake_green.svg',
        geofence_crossed: 'assets/images/corner_green.svg',
        geofence_crossed_in: 'assets/images/corner_green.svg',
        geofence_crossed_out: 'assets/images/corner_green.svg',
        overspeeding_in_geofence: 'assets/images/corner_green.svg',
        harsh_acceleration: 'assets/images/harsh_green.svg',
        low_battery_charge: 'assets/images/low_battery_hover.svg',
        Idling: 'assets/images/hover-icon.svg',
        sufficient_battery_charge: 'assets/images/low_battery_hover.svg',
        gps_signal_lost: 'assets/images/gps_lost_hover.svg',
        impact_event: 'assets/images/gps_lost_hover.svg'
      }[alertType?.toLowerCase()] || 'assets/images/hover-icon.svg'
    );
  }

  getHighlightedIcons(alertType: string): string {
    return (
      {
        overspeeding: 'assets/images/over_red.svg',
        rapid_acceleration: 'assets/images/harsh_red.svg',
        night_driving: 'assets/images/night_red.svg',
        harsh_cornering: 'assets/images/corner_red.svg',
        harsh_braking: 'assets/images/brake_red.svg',
        geofence_crossed: 'assets/images/corner_red.svg',
        geofence_crossed_in: 'assets/images/corner_red.svg',
        overspeeding_in_geofence: 'assets/images/corner_red.svg',
        geofence_crossed_out: 'assets/images/corner_red.svg',
        harsh_acceleration: 'assets/images/harsh_red.svg',
        low_battery_charge: 'assets/images/low_battery_red.svg',
        Idling: 'assets/images/alert_hover.svg',
        sufficient_battery_charge: 'assets/images/low_battery_red.svg',
        gps_signal_lost: 'assets/images/gps_lost_red.svg',
        impact_event: 'assets/images/gps_lost_red.svg'
      }[alertType?.toLowerCase()] || 'assets/images/alert_hover.svg'

    );
  }
  featuresList: any[] = [];
  trackByFeature(index: number, feature: any): any {
    return feature.properties?.id || index;
  }

  isMatched(type): boolean {
    if (type == "LineString") {
      return true
    }
    return false
    // for (const lineFeature of lineStringFeatures) {
    //   const alerts = lineFeature.properties?.cx_alerts || [];
    //   for (const alert of alerts) {
    //     if (
    //       alert.alert_timestamp === featureTimestamp ||
    //       alert.cx_peak_acc_time === featureTimestamp ||
    //       alert.cx_initial_time === featureTimestamp
    //     ) {
    //       return true;
    //     }
    //   }
    // }

    // return false;
  }
  selectedAlertId: string | null = null;
  tableDataForSelectedAlert: any[] = [];

  async onArrowClick(trip: any) {
    this.newMap = false;
    this.oldMap = true;
    this.viewDetails = false;
    this.isTripSelected = true;
    this.featuresList = []
    const { vin, provider, tripId } = trip;

    try {
      this.eventMarkers = [];
      this.alertSegments = [];
      this.allTripsCoordinatesArray = [];
      this.eachTripEndPoints = [];
      const summary: any = await firstValueFrom(
        this.dashboardservice.gettripSummaryHistory(vin, provider, tripId)
      );

      if (!summary) {
        console.error('Invalid summary data for trip:', tripId);
        return;
      }
      this.dataForVehicleDetails = summary;
      const coords = summary?.cxSnappedCoords;
      if (Array.isArray(coords) && coords.length > 1) {
        const simplifiedCoords = this.simplifyPolyline(coords, 0.0001);
        const tripCoords = simplifiedCoords.map(([lat, lng]) => ({ lat, lng }));

        const [startLat, startLng] = simplifiedCoords[0];
        const [endLat, endLng] = simplifiedCoords[simplifiedCoords.length - 1];

        const fullPoint = {
          lat: endLat,
          lng: endLng,
          dataAddress: summary?.endAddress || '',
          startSAddress: summary?.startAddress || '',
          trip,
          speed: summary?.cxAvgVehicleSpeed?.toFixed(2) || '0.00'
        };

        this.zone.run(() => {
          this.snappedPolylineCoords = tripCoords;
          this.start_end_mark = [{
            startLat,
            startLng,
            endLat,
            endLng,
            startAddress: summary?.startAddress || 'Start Address not available',
            endAddress: summary?.endAddress || 'End Address not available'
          }];
          this.allTripsCoordinatesArray.push(tripCoords);
          this.eachTripEndPoints.push(fullPoint);
          this.adjustMapZoomAndCenter();
          this.cdr.detectChanges();
        });
      }


      // Handle alerts
      for (const alert of summary.cxAlerts || []) {
        const alertType = alert.alert_description?.toLowerCase() || 'default';

        const ts = alert.alert_timestamp || alert.cx_initial_time || alert.cx_peak_acc_time;

        alert.formattedAlertTime = ts
          ? moment.utc(ts).tz(this.selectedTimezone).format('MMM D, YYYY, HH:mm')
          : '--';

        let lat: number | undefined;
        let lng: number | undefined;

        if (Array.isArray(alert.alert_location) && alert.alert_location.length === 2) {
          [lng, lat] = alert.alert_location;
        } else if (alertType === 'overspeeding' && alert.cx_final_location) {
          lat = alert.cx_final_location.cx_latitude;
          lng = alert.cx_final_location.cx_longitude;
        } else if (alert.cx_initial_location) {
          lat = alert.cx_initial_location.cx_latitude;
          lng = alert.cx_initial_location.cx_longitude;
        }

        if (lat == null || lng == null) continue;

        const iconUrl = 'assets/images/alert_hover.svg';
        const iconSize = new google.maps.Size(2, 2);
        const iconAnchor = new google.maps.Point(2, 2);
        if (!this.eventMarkers) {
          this.eventMarkers = [];
        }
        const defaultIconUrl = 'assets/images/alert_hover.svg';
        const lati = alert.cx_initial_location?.cx_latitude;
        const lngi = alert.cx_initial_location?.cx_longitude;

        let address = 'Address lookup pending';
        if (lati != null && lngi != null) {
          try {
            address = await this.getAddress({ latitude: lati, longitude: lngi });
          } catch (e) {
            console.error('Error fetching address:', e);
            address = 'Address lookup error';
          }
        }
        this.eventMarkers.push({
          lat,
          lng,
          alertId: alert.alert_id,
          icon: { url: this.getHighlightedIcons(alert.alert_description), size: iconSize, anchor: iconAnchor },
          highlightIcon: { url: this.getHighlightedIcon(alert.alert_description), size: iconSize, anchor: iconAnchor },
          alertType: alert.alert_description || 'Unknown Alert',
          timestamp: alert.alert_timestamp,
          formattedAlertTime: alert.formattedAlertTime,
          speed: alert.cx_final_speed,
          address
        });
      }
      const Tablesummary: any = await this.getTripDataAsPromise(vin, tripId);
      if (!Tablesummary || !Array.isArray(Tablesummary) || Tablesummary.length === 0) {
        console.error('Trip summary is empty or invalid');
        return;
      }

      const summaryItemGeoJSON = Tablesummary[0];
      //  this.dataForVehicleDetails = summaryItemGeoJSON;
      const features = summaryItemGeoJSON?.cx_geojson?.features || [];
      this.featuresList = features.map(item => {
        const timestamp = item.properties?.cx_readable_timestamp;
        const formattedDateNewData = timestamp
          ? moment.utc(timestamp).tz(this.selectedTimezone).format('MMM D, YYYY')
          : '--';

        const formattedTimeNewData = timestamp
          ? moment.utc(timestamp).tz(this.selectedTimezone).format('HH:mm')
          : '--';
        return {
          ...item,
          properties: {
            ...item.properties,
            formattedDateNewData,
            formattedTimeNewData
          }
        };
      });
      this.totalData = features
      this.loadData(summaryItemGeoJSON);



      // After map rendered, lazy-load display meta
      requestIdleCallback(() => {
        Object.assign(trip, {
          startAddress: summary?.startAddress || 'Loading...',
          endAddress: summary?.endAddress || 'Loading...',
          cxTripDistance: typeof summary?.cxTripDistance === 'number'
            ? summary.cxTripDistance.toFixed(2)
            : '0.00',
          cxIdlingDuration: typeof summary?.cxIdlingDuration === 'number'
            ? summary.cxIdlingDuration
            : 0
        });
      });
      this.showMap = true;

    } catch (err) {
      console.error(`Error loading trip history for tripId ${tripId}:`, err);
    }
  }
  onArrowClicks(event: any): void {
    const matchedTrip = this.allTripListFlat?.find(t => t.tripId === event.tripId);
    if (matchedTrip) {
      this.selectedTripId = matchedTrip.tripId;

      this.loadTripDetails(matchedTrip);
    } else {
      console.warn('Matching trip not found for event:', event);
    }
  }

  public selectedEventDescription: string | null = null;
  private async loadTripDetails(trip: any): Promise<void> {
    const { vin, provider, tripId } = trip;
    this.newMap = false;
    this.oldMap = true;
    this.viewDetails = false;
    this.isTripSelected = true;
    this.featuresList = [];
    this.eventMarkers = [];
    this.alertSegments = [];
    this.allTripsCoordinatesArray = [];
    this.eachTripEndPoints = [];

    try {
      const summary: any = await firstValueFrom(
        this.dashboardservice.gettripSummaryHistory(vin, provider, tripId)
      );

      if (!summary) {
        console.error('Invalid summary data for trip:', tripId);
        return;
      }

      this.dataForVehicleDetails = summary;
      if (this.selectedEventDescription) {
        const alerts = this.dataForVehicleDetails?.cxAlerts || [];

        this.dataForVehicleDetails.cxAlerts = [
          // put matching alerts first
          ...alerts.filter(a => a.alert_description === this.selectedEventDescription),
          // followed by non-matching ones
          ...alerts.filter(a => a.alert_description !== this.selectedEventDescription),
        ];
      }

      const tripFromList = this.allTripListFlat?.find(t => String(t.tripId) === String(trip.tripId)) || trip;
      const formattedStartTime = tripFromList?.startTimeStamp
        ? moment.utc(tripFromList.startTimeStamp).tz(this.selectedTimezone).format('HH:mm')
        : '--';

      const formattedEndTime = tripFromList?.endTimeStamp
        ? moment.utc(tripFromList.endTimeStamp).tz(this.selectedTimezone).format('HH:mm')
        : '--';

      const formattedDates = tripFromList?.startTimeStamp
        ? moment.utc(tripFromList.startTimeStamp).tz(this.selectedTimezone).format('MMM D, YYYY')
        : '--';

      this.zone.run(() => {
        this.selectedTrip = {
          ...trip,
          alias: summary?.alias || trip.alias || 'Trip Info',
          startTimeStamp: summary?.startTime || trip?.startTimeStamp,
          endTimeStamp: summary?.endTime || trip?.endTimeStamp,
          formattedDates,
          formattedTimes: formattedStartTime,
          formattedTime: formattedEndTime
        };
        this.cdr.detectChanges();
      });

      // Snapped Coordinates
      const coords = summary?.cxSnappedCoords;
      if (Array.isArray(coords) && coords.length > 1) {
        const simplifiedCoords = this.simplifyPolyline(coords, 0.0001);
        const tripCoords = simplifiedCoords.map(([lat, lng]) => ({ lat, lng }));

        const [startLat, startLng] = simplifiedCoords[0];
        const [endLat, endLng] = simplifiedCoords[simplifiedCoords.length - 1];

        const fullPoint = {
          lat: endLat,
          lng: endLng,
          dataAddress: summary?.endAddress || '',
          startSAddress: summary?.startAddress || '',
          trip,
          speed: summary?.cxAvgVehicleSpeed?.toFixed(2) || '0.00'
        };

        this.zone.run(() => {
          this.snappedPolylineCoords = tripCoords;
          this.start_end_mark = [{
            startLat,
            startLng,
            endLat,
            endLng,
            startAddress: summary?.startAddress || 'Start Address not available',
            endAddress: summary?.endAddress || 'End Address not available'
          }];
          this.allTripsCoordinatesArray.push(tripCoords);
          this.eachTripEndPoints.push(fullPoint);
          this.adjustMapZoomAndCenter();
          this.cdr.detectChanges();
        });
      }

      // Alerts
      for (const alert of summary.cxAlerts || []) {
        const ts = alert.alert_timestamp || alert.cx_initial_time || alert.cx_peak_acc_time;
        alert.formattedAlertTime = ts
          ? moment.utc(ts).tz(this.selectedTimezone).format('MMM D, YYYY, HH:mm')
          : '--';

        let lat: number | undefined;
        let lng: number | undefined;
        if (Array.isArray(alert.alert_location) && alert.alert_location.length === 2) {
          [lng, lat] = alert.alert_location;
        } else if (alert.cx_initial_location) {
          lat = alert.cx_initial_location.cx_latitude;
          lng = alert.cx_initial_location.cx_longitude;
        }

        if (lat == null || lng == null) continue;

        let address = 'Address lookup pending';
        try {
          if (lat && lng) {
            address = await this.getAddress({ latitude: lat, longitude: lng });
          }
        } catch (e) {
          console.error('Address error:', e);
          address = 'Address lookup error';
        }

        const iconSize = new google.maps.Size(2, 2);
        const iconAnchor = new google.maps.Point(2, 2);

        this.eventMarkers.push({
          lat,
          lng,
          alertId: alert.alert_id,
          icon: { url: this.getHighlightedIcons(alert.alert_description), size: iconSize, anchor: iconAnchor },
          highlightIcon: { url: this.getHighlightedIcon(alert.alert_description), size: iconSize, anchor: iconAnchor },
          alertType: alert.alert_description || 'Unknown Alert',
          timestamp: alert.alert_timestamp,
          formattedAlertTime: alert.formattedAlertTime,
          speed: alert.cx_final_speed,
          address
        });
      }

      // Table Summary
      const Tablesummary: any = await this.getTripDataAsPromise(vin, tripId);
      const summaryItemGeoJSON = Tablesummary?.[0];
      const features = summaryItemGeoJSON?.cx_geojson?.features || [];

      this.featuresList = features.map(item => {
        const timestamp = item.properties?.cx_readable_timestamp;
        return {
          ...item,
          properties: {
            ...item.properties,
            formattedDateNewData: timestamp ? moment.utc(timestamp).tz(this.selectedTimezone).format('MMM D, YYYY') : '--',
            formattedTimeNewData: timestamp ? moment.utc(timestamp).tz(this.selectedTimezone).format('HH:mm') : '--'
          }
        };
      });

      this.totalData = features;
      this.loadData(summaryItemGeoJSON);

      requestIdleCallback(() => {
        Object.assign(trip, {
          startAddress: summary?.startAddress || 'Loading...',
          endAddress: summary?.endAddress || 'Loading...',
          cxTripDistance: typeof summary?.cxTripDistance === 'number'
            ? summary.cxTripDistance.toFixed(2)
            : '0.00',
          cxIdlingDuration: typeof summary?.cxIdlingDuration === 'number'
            ? summary.cxIdlingDuration
            : 0
        });
      });

      this.showMap = true;

    } catch (err) {
      console.error(`Error loading trip details for tripId ${tripId}:`, err);
    }
  }




  itemsPerPage = 50;  // load 50 at a time
  currentPage = 0;
  allFeaturesList: any[] = [];
  loadData(summaryItemGeoJSON: any) {
    this.allFeaturesList = summaryItemGeoJSON?.cx_geojson?.features || [];
    this.featuresList = [];  // start with an empty displayed list
    this.currentPage = 0;
    this.loadNextBatch();
  }

  loadNextBatch() {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const nextBatch = this.allFeaturesList.slice(start, end);

    if (nextBatch.length > 0) {
      this.featuresList = [...this.featuresList, ...nextBatch];
      this.currentPage++;
    }
  }

  onScrollHandler(event: any) {
    const element = event.target;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const bottomThreshold = element.scrollHeight - 20;
    if (scrollPosition >= bottomThreshold) {
      this.loadNextBatch();
    }
  }

  getSurroundingRows(alertId: string): any[] {
    const index = this.totalData.findIndex(
      alert => alert.properties.cx_readable_timestamp === alertId
    );

    if (index === -1) {
      return [];
    }

    const start = Math.max(0, index - 3);
    const end = Math.min(this.totalData.length, index + 4);
    const sliced = this.totalData.slice(start, end);

    this.alertList = sliced.map((item, i) => {
      let formattedAlertDate = '--';
      let formattedAlertTime = '--';

      const timestamp = item.properties?.cx_readable_timestamp;
      if (timestamp) {
        const m = moment.utc(timestamp).tz(this.selectedTimezone);
        formattedAlertDate = m.format('MMM D, YYYY');
        formattedAlertTime = m.format('HH:mm');
      }

      const isCenter = i === 3;

      if (isCenter) {
      } else {
      }

      return {
        ...item,
        formattedAlertDate,
        formattedAlertTime,
        isCenterRow: isCenter
      };
    });

    return this.alertList;
  }



  startInfoWindowOpen = false; // Controls the start marker's info window visibility
  tripInfoWindowOpen: { [key: string]: boolean } = {}; // Controls the end markers' info window visibility

  // Method to control the visibility of the info window on hover
  onMarkerHoverTrip(isHovering: boolean, type: string, trip?: any) {
    if (type === 'start') {
      this.startInfoWindowOpen = isHovering; // Open/close start marker's info window
    } else if (type === 'end' && trip) {
      const key = trip.endLat + trip.endLng; // Unique key for each end marker
      this.tripInfoWindowOpen[key] = isHovering; // Open/close the info window for the specific end marker
    }
  } date
  showTooltips(lat: number, lng: number, address: string) {
    this.tooltipLat = lat;
    this.tooltipLng = lng;
    this.address = address;
    this.showTooltip = true;
  }
  async getSnappedPoints(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    timestamp: number
  ): Promise<{ lat: number, lng: number }[]> {
    try {
      const response = await this.dashboardservice
        .getSnappedPointss(startLat, startLng, endLat, endLng, timestamp)
        .toPromise();

      // Handle snapping response structure
      if (response?.code === 'Ok' && response.matchings?.length) {
        const route = response.matchings[0];

        // Check if any leg's distance is greater than 80, then ignore
        if (route.legs?.some((leg: any) => leg.distance > 5000)) {
          console.warn('Route ignored due to leg distance > 80');
          return [];
        }

        const snappedCoordinates = route.geometry?.coordinates || [];
        const points = snappedCoordinates.map(
          ([lng, lat]: [number, number]) => ({ lat, lng })
        );
        const uniquePoints: { lat: number; lng: number }[] = [];
        const seen = new Set<string>();
        for (const p of points) {
          const key = `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniquePoints.push(p);
          }
        }
        return uniquePoints;
      }
    } catch (error) {
      console.error('Error fetching snapped points:', error);
    }

    return [];
  }
  toggleArrow(event: any): void {
    if (!event?.tripId || !event?.vin || !event?.provider) {
      console.warn('Invalid trip data passed to toggleArrow()', event);
      return;
    }

    if (this.selectedTripId === event.tripId) {
      this.selectedTripId = null;
      this.selectedTrip = null;
    } else {
      this.selectedTripId = event.tripId;
      this.selectedTrip = event;
      this.selectedEventDescription = event.alertDescriptions; // store for highlighting
      this.loadTripDetails(event);

      // Ensure 'events' tab is selected
      this.selectedTab = 'events';
    }
  }

  listofVin: boolean = true;
  viewDetails: boolean = false

  allTrips: any[] = [];
  toggleArrows(point: any): void {
    const matchedTrip = this.allTrips.find(trip =>
      trip.endLat === point.lat && trip.endLng === point.lng
    );

    if (matchedTrip) {
      this.selectedTripId = matchedTrip.tripId;
      this.selectedTrip = matchedTrip;
      this.onArrowClick(matchedTrip);  // Ensure onArrowClick() is also defined
    }
  }
  toggleArrowNew(): void {
    alert('Marker clicked!');
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

  getAddressFromLatLng(lat: number, lng: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat, lng };
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve('Address not found');
        }
      });
    });
  }



  showAllTrips() {
    this.isTripSelected = false;
    this.snappedPolylineCoords = [];
    this.start_end_mark = [];
  }
  isFirstTrip: boolean = false; // Flag to track the first trip
  maskVins(vin: string): string {
    if (vin && vin.length >= 3) { // Add a null check for vin
      return '***' + vin.slice(-3);
    } else {
      return vin;
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
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

  stops = [
    {
      time: '2:17 PM',
      address: '3921 Libby Street, Los Angeles, CA, 90017',
      color: '#2ecc71', // green
      isLast: false
    },
    {
      time: '2:19 PM',
      address: '130 Wines Lane, Los Angeles, CA, 90021',
      color: '#f39c12', // orange
      isLast: true
    }
  ];



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

  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    }, 10);
    // this.updateDasboard()
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

  noActivityDetected() {
    this.modalService.open(this.noVehicleActivity, { centered: true });
  }


  showInput = false;


  toggleInput() {
    this.showInput = true;
  }

  searchVin: string = '';

  searchVehicleByVin() {
    const searchText = this.searchVin?.trim().toLowerCase();
    if (searchText) {
      this.displayedVehicles = this.allVehicles.filter(vehicle =>
        vehicle.driverName?.toLowerCase().includes(searchText) ||
        vehicle.vin?.toLowerCase().includes(searchText) ||
        vehicle.alias?.toLowerCase().includes(searchText)
      );
    } else {
      this.displayedVehicles = [...this.allVehicles]; // Reset if input is empty
    }
  }

  onInputChange() {
    const vin = this.searchVin?.trim();
    if (!vin) {
      this.displayedVehicles = [...this.allVehicles]; // Reset to full list
    }
  }

  closeInput() {
    this.showInput = false;
    this.searchVin = '';
    this.displayedVehicles = [...this.allVehicles]; // Reset to full list
  }

  newMap: boolean = false;
  oldMap: boolean = true;
  currentRunningTrip: any = null;
  sseSubscription: Subscription | null = null;
  openTab(trip) {
    if (trip?.colorCode === 'GREEN') {
      if (this.currentRunningTrip?.tripId !== trip.tripId) {
        // New running trip selected
        this.currentRunningTrip = trip;

        this.newMap = true;    // show new map
        this.oldMap = false;

        // If there was a previous subscription, unsubscribe first
        if (this.sseSubscription) {
          this.sseSubscription.unsubscribe();
          this.sseSubscription = null;
        }

        // Start streaming live data for this trip
        this.getStremingData(trip);
      }
      // else, clicking the same trip again does nothing (already streaming)
    }
  }



  handleVehicleClick(vehicle: any): void {

    this.onSelectVehicle(vehicle);
    this.drawnGeofences = [];
    if (this.drawnGeofences && this.drawnGeofences.length > 0) {
  this.drawnGeofences.forEach((overlay: any) => {
    if (overlay.setMap) overlay.setMap(null);  // Remove from map
  });
  this.drawnGeofences = [];
}

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

  message: string | null = null; // Add this in your component class
  lastSelectedColor: string = 'ALL';
  isLoadingVehicles: boolean = true;
  async filterCar(color: string) {
    this.lastSelectedColor = color;
    this.colorCode = color === 'ALL' ? null : color;
    this.message = null;

    if (this.colorCode) {
      const filtered = this.allVehicles.filter(v => v.colorCode === this.colorCode);

      this.start_end_mark = filtered.map(vehicle => ({
        endLat: vehicle.endLat,
        endLong: vehicle.endLong,
        colorCode: vehicle.colorCode,
        alias: vehicle.alias,
        address: vehicle.currentAddress,
      }));

      this.displayedVehicles = filtered;
      this.updateTodayVehicle = filtered.length;

      if (filtered.length === 0) {
        switch (this.colorCode) {
          case 'GREEN':
            this.message = 'No trip in progress';
            break;
          case 'YELLOW':
            this.message = 'No vehicle in idle state';
            break;
          case 'RED':
            this.message = 'No data found';
            break;
        }
      } else {
        // Fit bounds to show all filtered markers
        this.fitMapToMarkers(this.start_end_mark);
      }
    } else {
      this.displayedVehicles = this.allVehicles;
      this.updateTodayVehicle = this.allVehicles.length;

      this.start_end_mark = this.allVehicles.map(vehicle => ({
        endLat: vehicle.endLat,
        endLong: vehicle.endLong,
        colorCode: vehicle.colorCode,
        alias: vehicle.alias,
        address: vehicle.currentAddress,
      }));

      this.message = null;

      // Fit bounds to show all markers
      if (this.start_end_mark.length > 0) {
        this.fitMapToMarkers(this.start_end_mark);
      }
    }
  }

  /**
   * Fits the map bounds to show all markers
   */
  fitMapToMarkers(markers: Array<{ endLat: number; endLong: number }>): void {
    if (!markers || markers.length === 0) {
      return;
    }

    // If using the gMapInstance from onMapReady
    if (this.gMapInstance) {
      const bounds = new google.maps.LatLngBounds();

      markers.forEach(marker => {
        if (marker.endLat && marker.endLong) {
          bounds.extend(new google.maps.LatLng(marker.endLat, marker.endLong));
        }
      });

      this.gMapInstance.fitBounds(bounds);

      // Optional: Set max zoom to prevent zooming in too much on a single marker
      const listener = google.maps.event.addListenerOnce(this.gMapInstance, 'bounds_changed', () => {
        const currentZoom = this.gMapInstance.getZoom();
        if (currentZoom > 15) {
          this.gMapInstance.setZoom(15);
        }
      });
    } else {
      // Fallback: calculate center and zoom manually
      const latitudes = markers.map(m => m.endLat).filter(lat => lat != null);
      const longitudes = markers.map(m => m.endLong).filter(lng => lng != null);

      if (latitudes.length > 0 && longitudes.length > 0) {
        // Calculate center
        this.latitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
        this.longitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

        // Calculate zoom based on bounds
        const latDiff = Math.abs(Math.max(...latitudes) - Math.min(...latitudes));
        const lngDiff = Math.abs(Math.max(...longitudes) - Math.min(...longitudes));
        const maxDiff = Math.max(latDiff, lngDiff);

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
        } else if (maxDiff > 0.1) {
          this.zoom = 13;
        } else {
          this.zoom = 15;
        }
      }
    }
  }


  intervalTme() {
    this.interval = setInterval(() => {
      //  this.vehicleList(this.VIN)
    }, 10000);
  }

  @ViewChild('agmMap') agmMapElement: any;

  subtractMinutes(date: string, minutesToSubtract: number): string {
    return moment.utc(date)
      .subtract(minutesToSubtract, 'minutes')
      .tz(this.selectedTimezone)
      .format('MMM D, YYYY HH:mm');
  }
  resetStreamingData() {
    this.oldMap = true;
    this.newMap = false;
    this.isLive = false;
    this.eventType = null;
    this.rawStartDateTime = '';
    this.startDateTime = '--';
    this.alertTip = null;
    this.snappedPolylineCoords = [];
    this.start_end_mark = [];
    this.eachTripEndPoints = [];
    this.allTripsCoordinatesArray = [];
    this.isAnimating = false;
    this.telemetryQueue = [];
    this.currentRunningTrip = null;
    this.isResetAction = false;

    // Stop any active SSE subscription
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
    }
  }

  // Add this in your component class

toggleTooltip(vehicle: any): void {
  // Close all other tooltips
  this.allVehicles.forEach((v: any) => {
    if (v !== vehicle) v.showTooltip = false;
  });

  // Toggle this one
  vehicle.showTooltip = !vehicle.showTooltip;
}



  // Streaming Live Data
  getStremingData(trip) {
    // Reset previous trip data
    // this.resetStreamingData();

    let dataReceived = false;
    const timeout = setTimeout(() => {
      if (!dataReceived) {
        console.warn('No streaming data received within 60 seconds.');
      }
    }, 60000);

    this.sseSubscription = this.dashboardservice.getServerSentEvent(trip?.vin, trip?.tripId)
      .subscribe((res: any) => {
        dataReceived = true;
        this.isLive = true;
        let data = JSON.parse(res?.data);
        this.eventType = data?.eventType;
        this.rawStartDateTime = data?.tripStartTime;
        this.startDateTime = this.rawStartDateTime
          ? moment.utc(this.rawStartDateTime).tz(this.selectedTimezone).format('MMM D, YYYY, HH:mm')
          : '--';

        this.getLiveData(data);

        if (data) {
          this.alertTip = data;
          this.getAddress(data);
          clearTimeout(timeout);
        }
      }, err => {
        clearTimeout(timeout);
      });
  }

  // Initialize tripDataMap somewhere in your class
  tripDataMap: {
    [tripId: string]: {
      waypoints: any[],
      latLng: any[],
      seenPoints: Set<string>,
      snappedWaypoints: any[],
      alertMarkers: any[]
    }
  } = {};

  mapCenterLat: number | null = null;
  mapCenterLng: number | null = null;

  telemetryQueue: any[] = [];
  isAnimating = false;


  @ViewChild('agmMap') agmMap: any;

  gMapInstance: google.maps.Map;
  carMarker: google.maps.Marker | null = null;

  async getLiveData(liveData: any): Promise<void> {
    if (!this.currentRunningTrip) return;
    const tripId = this.currentRunningTrip.tripId;

    if (!this.tripDataMap[tripId]) {
      this.tripDataMap[tripId] = {
        waypoints: [],
        latLng: [],
        seenPoints: new Set(),
        snappedWaypoints: [],
        alertMarkers: []
      };
    }

    const tripData = this.tripDataMap[tripId];
    this.LatLng = liveData;

    const telemetryList = liveData?.cxTelemetryDataList || [];
    telemetryList.forEach((data: any) => {
      const point = {
        lat: data.latitude,
        lng: data.longitude,
        heading: data.heading || 0,
        timestamp: Math.floor(new Date(data.cxReadableTimestamp).getTime() / 1000)
      };
      const key = `${this.round(point.lat)},${this.round(point.lng)}`;
      if (!tripData.seenPoints.has(key)) {
        tripData.seenPoints.add(key);
        this.telemetryQueue.push(point);
      }
    });

    if (telemetryList.length > 0) {
      const latest = telemetryList[telemetryList.length - 1];
      this.heading = latest.heading || 0;
      if (!this.isAnimating) {
        this.processTelemetryQueue(tripData);
      }
    }

    this.updateAlertMarkers(liveData?.alerts, tripData);
  }

  private async processTelemetryQueue(tripData: any): Promise<void> {
    this.isAnimating = true;

    while (this.telemetryQueue.length > 0) {
      const point = this.telemetryQueue.shift();
      tripData.waypoints.push(point);
      tripData.latLng.push(point);

      const len = tripData.latLng.length;
      if (len >= 2) {
        const from = tripData.latLng[len - 2];
        const to = point;
        // Get snapped points between two GPS coordinates
        const snapped = await this.getSnappedPoints(from.lat, from.lng, to.lat, to.lng, to.timestamp);
        await this.animateCarMovement(snapped, tripData); // animate through snapped path
      } else {
        this.latitude = point.lat;
        this.longitude = point.lng;
        this.heading = point.heading || 0;
        this.setOrUpdateCarMarker(point.lat, point.lng, this.heading);
      }

      if (this.mapCenterLat === null || this.mapCenterLng === null) {
        this.mapCenterLat = point.lat;
        this.mapCenterLng = point.lng;
        this.zoom = 15;
      } else {
        const dist = this.getDistanceInMeters(this.mapCenterLat, this.mapCenterLng, point.lat, point.lng);
        if (dist > 50) {
          this.mapCenterLat = point.lat;
          this.mapCenterLng = point.lng;
          if (dist > 500) this.zoom = 12;
          else if (dist > 200) this.zoom = 13;
          else if (dist > 100) this.zoom = 14;
          else this.zoom = 15;
        }
      }
    }

    this.isAnimating = false;
  }


  async animateCarMovement(
    snappedPoints: { lat: number; lng: number }[],
    tripData: any
  ): Promise<void> {
    const totalSteps = 60;
    const delay = 25;

    for (let i = 0; i < snappedPoints.length - 1; i++) {
      const from = snappedPoints[i];
      const to = snappedPoints[i + 1];

      const interpolated = this.interpolatePoints(from, to, totalSteps);

      for (let j = 0; j < interpolated.length; j++) {
        const point = interpolated[j];
        const nextPoint = interpolated[j + 1] || point;

        const calculatedHeading = this.calculateHeading(point, nextPoint);

        this.heading = this.smoothHeadingTransition(this.heading, calculatedHeading);
        this.latitude = point.lat;
        this.longitude = point.lng;

        this.setOrUpdateCarMarker(point.lat, point.lng, this.heading);

        // Update polyline one step at a time
        tripData.snappedWaypoints.push(point);
        this.updatePolyline(tripData.snappedWaypoints);

        await this.sleep(delay);
      }
    }
  }


  interpolatePoints(from: { lat: number; lng: number }, to: { lat: number; lng: number }, steps: number): { lat: number; lng: number }[] {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const lat = from.lat + ((to.lat - from.lat) * i) / steps;
      const lng = from.lng + ((to.lng - from.lng) * i) / steps;
      points.push({ lat, lng });
    }
    return points;
  }


  setOrUpdateCarMarker(lat: number, lng: number, heading: number): void {
    const icon = {
      url: 'assets/images/small-icon.png', // or .png
      scaledSize: new google.maps.Size(50, 50),
      anchor: new google.maps.Point(25, 25), // center of icon
      rotation: heading, // This works only with Google SymbolPath or if you handle heading manually
    };
    if (!this.carMarker) {
      this.carMarker = new google.maps.Marker({
        map: this.map,
        position: { lat, lng },
        icon: icon
      });
    } else {
      this.carMarker.setPosition({ lat, lng });
      this.carMarker.setIcon(icon);
    }
  }


  private updatePolyline(path: { lat: number, lng: number }[]) {
    this.polylines = [{
      path,
      strokeColor: '#07b57a',
      strokeWeight: 2,
      strokeOpacity: 1
    }];
  }

  private round(value: number): number {
    return Math.round(value * 10000) / 10000;
  }

  smoothHeadingTransition(current: number, target: number, factor: number = 0.2): number {
    const diff = ((target - current + 540) % 360) - 180;
    return (current + diff * factor + 360) % 360;
  }


  calculateHeading(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
    const lat1 = this.toRadians(from.lat);
    const lat2 = this.toRadians(to.lat);
    const deltaLng = this.toRadians(to.lng - from.lng);

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    return (this.toDegrees(Math.atan2(y, x)) + 360) % 360;
  }

  toRadians(deg: number): number {
    return deg * (Math.PI / 180);
  }

  toDegrees(rad: number): number {
    return rad * (180 / Math.PI);
  }



  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }


  private updateAlertMarkers(alerts: any[], tripData: any): void {
    const iconMap = {
      rapid_acceleration: "./assets/images/HA_TH.svg",
      harsh_acceleration: "./assets/images/HA_TH.svg",
      // harsh_braking: "./assets/images/HB_TH.svg",
      // geofence_crossed: "./assets/images/ND_TH.svg",
      // geofence_crossed_in: "./assets/images/ND_TH.svg",
      // geofence_crossed_out: "./assets/images/ND_TH.svg",
      // geofence_crossed_SPEED: "./assets/images/ND_TH.svg",
      harsh_cornering: "./assets/images/HC_TH.svg",
      night_driving: "./assets/images/ND_TH.svg",
      idling: "./assets/images/ND_TH.svg",
      overspeeding: "./assets/images/OS_TH.svg"
    };

    const alertNames = {
      harsh_acceleration: "Harsh Acceleration",
      harsh_braking: "Harsh Braking",
      harsh_cornering: "Harsh Cornering",
      geofence_crossed: "Geofence Breached",
      night_driving: "Night Driving",
      rapid_acceleration: "Rapid Acceleration",
      overspeeding: "Overspeeding",
      idling: "Idling"
    };

    tripData.alertMarkers = alerts
      .filter((a: any) => a.initialLatitude && a.initialLongitude)
      .map((alert: any) => ({
        id: alert.alertId,
        description: alert.alertDescription,
        lat: alert.initialLatitude,
        lng: alert.initialLongitude,
        iconUrl: iconMap[alert.alertDescription] || "./assets/images/ND_TH.svg",
        title: alertNames[alert.alertDescription] || "Alert"
      }));

    this.alertMarkers = tripData.alertMarkers;
  }

  drawPolylines(tripId: string): void {
    const tripData = this.tripDataMap[tripId];
    if (!tripData) return;
    this.updatePolyline(tripData.snappedWaypoints);
  }

  getRotationStyle(): { [key: string]: string } {
    return {
      transform: `rotate(${this.heading}deg)`,
      transition: 'transform 0.1s linear'
    };
  }

  checkIfOverspeeding(
    startPoint: { lat: number; lng: number },
    endPoint: { lat: number; lng: number },
    alerts: any[]
  ): boolean {
    return alerts?.some(
      (alert) =>
        alert.alertDescription === "overspeeding" &&
        alert.initialLatitude === startPoint.lat &&
        alert.initialLongitude === startPoint.lng &&
        alert.finalLatitude === endPoint.lat &&
        alert.finalLongitude === endPoint.lng
    );
  }

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

    // Convert from [lng, lat] to { lat, lng }
    return coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
  }
  // Fetch address from latlong georeverse API.

  getAddress(latLng: { latitude: number; longitude: number }): Promise<string> {
    const { latitude: lat, longitude: lon } = latLng;
    if (lat == null || lon == null) {
      return Promise.resolve('Coordinates missing');
    }

    return firstValueFrom(this.dashboardservice.getAddressLatLngs(lat, lon))
      .then(result => result?.displayName ?? 'Address not found')
      .catch(err => {
        console.error('Reverse geocode error:', err);
        return 'Address lookup error';
      });
  }


  getInfoWindowBackgroundColor(coordinate: any): string {
    // Example logic - return different background colors based on coordinate.colorCode or other property
    switch (coordinate.colorCode?.toLowerCase()) {
      case 'red':
        return '#F79994';
      case 'green':
        return '#30B489';
      case 'yellow':
        return '#3B67D7';
      default:
        return '#ffffff'; // default white
    }
  }
  openInfoWindows: { [key: string]: boolean } = {};

  onMouseOver(point: any) {
    const key = `${point.lat}-${point.lng}`;
    this.openInfoWindows[key] = true;
  }

  onMouseOut(point: any) {
    const key = `${point.lat}-${point.lng}`;
    this.openInfoWindows[key] = false;
  }

  openEndInfoWindowKey: string | null = null;
  closeTimeout: any = null;

  openEndInfoWindow(trip: any) {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    this.openEndInfoWindowKey = this.getTripKey(trip);
  }

  closeEndInfoWindow(trip: any) {
    this.closeTimeout = setTimeout(() => {
      this.openEndInfoWindowKey = null;
      this.start_end_mark = null
    }, 300); // Delay to allow user to hover over info window
  }

  getTripKey(trip: any): string {
    return `${trip.endLat}_${trip.endLng}`; // or use trip ID if available
  }

  clearCloseTimeout() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
      this.start_end_mark = null
    }
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  searchText: string = '';

  selectedOptions = {
    connected: false,
    devices: false
  };

  options = {
    connected: [
      { name: 'FordPro', selected: true },
      { name: 'GM', selected: true },
      { name: 'Stellantis', selected: true },
      { name: 'Toyota', selected: false }
    ],
    devices: [
      { name: 'Dongle', selected: true },
      { name: 'Camera', selected: false }
    ]
  };

  filteredOptions(section: 'connected' | 'devices') {
    if (!this.searchText) {
      return this.options[section];
    }
    return this.options[section].filter(option =>
      option.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // Individual Trip data
  getTripDataAsPromise(vin: string, tripId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dashboardservice.getTripData(vin, tripId).subscribe({
        next: (data) => resolve(data),
        error: (err) => reject(err)
      });
    });
  }

  // Search Filter
  dropdownOpen = false;
  dropdownGeofence = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleDropdowngeoFence() {
    this.dropdownGeofence = !this.dropdownGeofence;
  }
  closeDropdowns() {
    this.dropdownOpen = false;
  }
  closeGeofenceDropDown(){
    this.dropdownGeofence  = false
  }
  toggleDetails(alertId: string, time2, time3, time4,) {
    let timeD: any;
    if (time2) {
      timeD = time2
    } else if (time3) {
      timeD = time3
    } else if (time4) {
      timeD = time4
    }
    this.selectedAlertId = this.selectedAlertId === alertId ? null : alertId;
    this.getSurroundingRows(timeD)
  }
  getEventTypeFromArray(alertArray: any): string {
    try {
      if (Array.isArray(alertArray) && alertArray.length > 0) {
        const parsed = JSON.parse(alertArray[0]);
        const type = parsed?.event_type;

        switch (type) {
          case 'IN': return 'Geofence In';
          case 'OUT': return 'Geofence Out';
          case 'CROSSED': return 'Geofence Crossed';
          default: return '--';
        }
      }
      return '--';
    } catch (err) {
      console.error('Error parsing cx_alerts:', alertArray, err);
      return '--';
    }
  }

  getGeofenceNameFromArray(alertArray: any): string {
    try {
      if (Array.isArray(alertArray) && alertArray.length > 0) {
        const parsed = JSON.parse(alertArray[0]);
        return parsed?.geofence_name || '--';
      }
      return '--';
    } catch (err) {
      console.error('Error parsing geofence_name:', alertArray, err);
      return '--';
    }
  }



  NewToggleDetails(alertId: string, time2, time3, time4,fullViewEventTable: any) {
    let timeD: any;
    if (time2) {
      timeD = time2
    } else if (time3) {
      timeD = time3
    } else if (time4) {
      timeD = time4
    }
    this.selectedAlertId = this.selectedAlertId === alertId ? null : alertId;
    this.getSurroundingRows(timeD)
    this.modalService.open(fullViewEventTable, { size: "xl", centered: true });
  }

  public isFullView: boolean = false;

  tableView(fullViewOfTable: any) {
    this.modalService.open(fullViewOfTable, { size: "xl", centered: true });
  }

  downloadReport() {
    if (!this.featuresList || this.featuresList.length === 0) {
      console.warn('No data available to download.');
      return;
    }

    this.downloadCSV();
    // this.downloadExcel();
  }
  downloadCSV() {
    const csvRows = [];
    const headers = [
      'Date', 'Time', 'Latitude', 'Longitude', 'Speed (mph)', 'Road Speed Limit (mph)', 'Odometer (mi)',
      'Location', 'Acceleration', 'Fuel Level', 'Alerts',  'Geofence Name (If any)', 'Oil Temp', 'Battery Voltage',
      'Battery Level', 'Coolant Temp', 'DTCs', 'Heading', 'Seatbelt', 'Tire Pressure',
      'Altitude', 'EV Level', 'EV Range', 'Provider'
    ];

    csvRows.push(headers.join(','));

    for (const feature of this.featuresList) {
      const row = [
        this.convertDate(feature.properties?.cx_readable_timestamp),
        this.convertTime(feature.properties?.cx_readable_timestamp),
        feature.geometry?.coordinates[1] ?? '--',
        feature.geometry?.coordinates[0] ?? '--',
        feature.properties?.cx_vehicle_speed != null
          ? (feature.properties.cx_vehicle_speed * 0.62137119).toFixed(2)
          : '--',
        feature.properties?.cx_rsl != null
          ? feature.properties.cx_rsl
          : '--',
        feature.properties?.cx_odometer != null
          ? (feature.properties.cx_odometer * 0.62137119).toFixed(2)
          : '--',
        feature.properties?.cx_location ?? '--',
        feature.properties?.cx_acc ?? '--',
        feature.properties?.cx_fuel_level != null
          ? (feature.properties.cx_fuel_level * 0.26417205).toFixed(2)
          : '--',
          this.getEventTypeFromArray(feature.properties?.cx_alerts),
        this.getGeofenceNameFromArray(feature.properties?.cx_alerts),
        feature.properties?.cx_oil_temp ?? '--',
        feature.properties?.cx_battery_voltage ?? '--',
        feature.properties?.cx_battery_level ?? '--',
        feature.properties?.cx_coolant_temp ?? '--',
        feature.properties?.cx_dtcs ?? '--',
        feature.properties?.cx_heading ?? '--',
        feature.properties?.cx_driver_seatbelt ?? '--',
        feature.properties?.cx_tire_pressure ?? '--',
        feature.properties?.cx_altitude ?? '--',
        feature.properties?.cx_ev_level ?? '--',
        feature.properties?.cx_ev_range ?? '--',
        feature.properties?.cx_provider ?? '--'
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'Trip-Summary.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatDates(dateString: string | undefined): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatTimes(timeString: string | undefined): string {
    if (!timeString) return '--';
    const date = new Date(timeString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  convertDate(timestamp: any): string {
    const formatted = timestamp
      ? moment.utc(timestamp).tz(this.selectedTimezone).format('MMM D YYYY') // or wrap with quotes
      : '--';
    return formatted;
  }

  convertTime(timestamp: any): string {
    const formatted = timestamp
      ? moment.utc(timestamp).tz(this.selectedTimezone).format('HH:mm')
      : '--';
    return formatted;
  }


  notificationAlert: boolean = false;

  notificationAlerts() {
    this.notificationAlert = !this.notificationAlert;
  }
  allGeoLocations: any[] = [];
  allCoordinates: number[][] = [];
  // For Geofence
  async manageGeofenceLists() {
    this.isLoading = true;

    const consumerId = this.customConsumer;

    // Get filtered geofences based on consumer/fleet/group
    this.dashboardservice.getGeofences(consumerId, this.fleetIdData, this.groupIdData).subscribe((res: any[]) => {
      this.geoFenceList = res.sort((a, b) => {
        if (a.creationDate > b.creationDate) return -1;
        if (a.creationDate < b.creationDate) return 1;
        return a.name.localeCompare(b.name);
      });

      // ✅ Always select all on load
      this.selectedGeofenceIds = this.geoFenceList.map(item => item.id);

      // Continue rendering logic
      const geofencesToRender = this.geoFenceList;

      this.allGeoLocations = geofencesToRender
        .filter(item => Array.isArray(item.geoLocations) && item.geoLocations.length > 0)
        .map((item: any) => ({
          locations: item.geoLocations,
          radius: item.radius,
        }));

      this.getTypeList = [...new Set(geofencesToRender.map((item: any) => item.type))].map((type: string) => {
        const matchedItem = geofencesToRender.find((item: any) => item.type === type);
        return { id: matchedItem?.id, name: type };
      });

      this.drawGeoFencesOnMap();
      this.isLoading = false;
    });

  }
  getGeofenceDataByVIN(vin: string): void {
    // Clear previous drawn shapes
    this.drawnGeofences.forEach(shape => {
      if (shape.setMap) shape.setMap(null);
    });
    this.drawnGeofences = [];

    this.dashboardservice.getGeofencebyVIN(vin).subscribe({
      next: (res: any) => {
        const filteredGeoFences = res.filter((item: any) =>
          Array.isArray(item.geoLocations) && item.geoLocations.length > 0
        );

        const sortedGeoFences = filteredGeoFences.sort((a: any, b: any) => {
          if (a.creationDate > b.creationDate) return -1;
          if (a.creationDate < b.creationDate) return 1;
          return a.name.localeCompare(b.name);
        });

        this.allGeoLocations = sortedGeoFences.map((item: any) => ({
          locations: item.geoLocations,
          radius: item.radius
        }));

        this.geoFenceData = sortedGeoFences;
        this.drawGeoFencesOnMap();
      },
      error: (err) => {
        console.error('Error fetching geofence data:', err);
      }
    });
  }

  drawnGeofences: any[] = [];
  drawGeoFencesOnMap() {
    // Clear previous shapes
    this.drawnGeofences.forEach(shape => shape.setMap(null));
    this.drawnGeofences = [];

    const infoWindow = new google.maps.InfoWindow();

    this.allGeoLocations.forEach((entry: any) => {
      const locations = entry.locations;
      const radiusMeters = entry.radius;

      if (!Array.isArray(locations) || locations.length === 0) return;

      const path = locations.map((point: any) => ({ lat: point[1], lng: point[0] }));

      const geoItem = this.geoFenceList.find(g =>
        this.areGeoLocationsEqual(g.geoLocations, locations)
      );

      const name = geoItem?.name || 'N/A';
      const type = geoItem?.locationType || 'N/A';
      const radius = geoItem?.radius || '--';
      const coordsString = locations.map(p => `[${p[1]}, ${p[0]}]`).join(', ');

      const content = `
        <div style="font-size: 12px; padding:10px; height:auto">
          Geofence Name: <strong>${name}</strong><br>
          Geofence Type: <strong>${type}</strong><br>
          Coordinates: <strong>${coordsString}</strong><br>
          Radius: <strong>${radius} meter</strong>
        </div>
      `;

      if (locations.length === 1) {
        const center = path[0];

        const circle = new google.maps.Circle({
          strokeColor: '#FA751A',
          strokeOpacity: 0.8,
          strokeWeight: 0.5,
          fillColor: '#FA751A',
          fillOpacity: 0.3,
          map: this.map,
          center,
          radius: radiusMeters
        });

        circle.addListener('mouseover', (e: any) => {
          infoWindow.setContent(content);
          infoWindow.setPosition(e.latLng);
          infoWindow.open(this.map);
        });

        circle.addListener('mouseout', () => {
          infoWindow.close();
        });

        this.drawnGeofences.push(circle);
      } else if (locations.length === 4) {
        const lats = path.map(p => p.lat);
        const lngs = path.map(p => p.lng);

        const bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(Math.min(...lats), Math.min(...lngs)),
          new google.maps.LatLng(Math.max(...lats), Math.max(...lngs))
        );

        const rectangle = new google.maps.Rectangle({
          strokeColor: '#FA751A',
          strokeOpacity: 0.8,
          strokeWeight: 0.5,
          fillColor: '#FA751A',
          fillOpacity: 0.3,
          map: this.map,
          bounds
        });

        rectangle.addListener('mouseover', (e: any) => {
          infoWindow.setContent(content);
          infoWindow.setPosition(e.latLng);
          infoWindow.open(this.map);
        });

        rectangle.addListener('mouseout', () => {
          infoWindow.close();
        });

        this.drawnGeofences.push(rectangle);
      } else if (locations.length > 4) {
        const polygon = new google.maps.Polygon({
          paths: path,
          strokeColor: '#FA751A',
          strokeOpacity: 0.8,
          strokeWeight: 0.5,
          fillColor: '#FA751A',
          fillOpacity: 0.3,
          map: this.map
        });

        polygon.addListener('mouseover', (e: any) => {
          infoWindow.setContent(content);
          infoWindow.setPosition(e.latLng);
          infoWindow.open(this.map);
        });

        polygon.addListener('mouseout', () => {
          infoWindow.close();
        });

        this.drawnGeofences.push(polygon);
      }
    });
  }

  areGeoLocationsEqual(a: number[][], b: number[][]): boolean {
    if (a.length !== b.length) return false;

    return a.every((pointA, index) => {
      const pointB = b[index];
      return pointA.length === pointB.length &&
        pointA.every((val, i) => Number(val).toFixed(6) === Number(pointB[i]).toFixed(6));
    });
  }


  onMapReady(map: google.maps.Map): void {
    this.addCustomControls(map);
    this.gMapInstance = map;
    this.map = map;
 }

  get geofenceTypeSelected(): string {
    return this.geofenceForm.get('geofenceType')?.value;
  }
  onLatLngChange(value: string): void {
    const [lngStr, latStr] = value.split(',').map(v => v.trim());
    const lng = parseFloat(lngStr);
    const lat = parseFloat(latStr);

    if (!isNaN(lat) && !isNaN(lng)) {
      this.setCoordinates(lat, lng);
    } else {
      this.geoLocations = []; // reset if invalid
      console.warn('Invalid Lat/Lng input');
    }
  }
  setCoordinates(lat: number, lng: number): void {
    this.selectedLatLng = `${lng}, ${lat}`;
    this.geoLocations = [[lng, lat]];
  }
  onSubmit(geofence: any) {
    const id = this.geofenceForm.value.id;
    const formValue = this.geofenceForm.value;
    const updatedGeofenceData = {
      name: formValue.name,
      type: formValue.geofenceType?.toUpperCase(),
      address: formValue.address,
      locationType: formValue.locationType,
      radius: formValue.radius,
      unit: 'miles',
      speedLimit: formValue.speedLimit,
      fleetId: formValue.fleetId,
      groupId: formValue.groupId,
      consumerId: formValue.consumerId,
      geoLocations: this.geoLocations,
      email: this.loginUser.email
    };
    this.dashboardservice.updateGeofenceNew(this.geofence?.id, updatedGeofenceData).subscribe(
      (response) => {
        this.appService.openSnackBar("Geofence updated successfully !", 'Success')
        this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/geofence'])
      },
      (error) => {
        console.error('Error updating geofence:', error);
      }
    );
  }
  errorMessage: any;
  validateBeforeSubmit(modal: any): void {
    this.errorMessage = ''; // Clear any previous messages
    const speedLimitControl = this.geofenceForm.get('speedLimit');
    // Trigger validation manually
    speedLimitControl?.markAsTouched();
    this.geofenceForm.markAllAsTouched();
    if (speedLimitControl?.value >= 200) {
      this.errorMessage = 'Speed should be less than 200.';
      this.modalService.open(modal, { size: 'sm', centered: true });
      return;
    }
    if (this.geofenceForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly.';
      this.modalService.open(modal, { size: 'sm', centered: true });
      return;
    }

    // ✅ Proceed to submit if all is valid
    this.onSubmit('');
  }

  onRadiusChangeData(value: any): void {
  }
  onRadiusChange(): void {
    if (this.selectedRadius) {
      this.zoomLevel = this.getZoomLevel(this.selectedRadius);
    }
  }
  getZoomLevel(radiusInMiles: number): number {
    const radiusInMeters = radiusInMiles * 1609.34
    const zoomLevels = [
      { radius: 1, zoom: 13 },
      { radius: 5, zoom: 11 },
      { radius: 10, zoom: 9 },
      { radius: 20, zoom: 8 },
      { radius: 30, zoom: 7 },
      { radius: 40, zoom: 6 },
      { radius: 50, zoom: 6 },
    ];
    const level = zoomLevels.find((level) => radiusInMeters <= level.radius * 1609.34);
    return level ? level.zoom : 7; // Default to zoom level 7 for very large radii
  }
  navigateToAlert() {
    this.router.navigate(['/adlp/admin/admindashboard/geofence/geofence-alert']);
  }
  async getGeofenceType() {
    await this.dashboardservice.getGeofenceType().subscribe((res: any) => {
      this.getTypeList = res
    })
  }
  onSearchChange(value: string) {
    this.geofenceForm.get('address')?.setValue(value);
  }
  initMap() {
    // Safe to access google.maps here
    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -34.397, lng: 150.644 },
      zoom: 8,
    }
  )}
  vinToProviderMap: { [vin: string]: string } = {};
  searchFilter() {
    if (sessionStorage.getItem('groupId')) {
      this.groupId = JSON.parse(sessionStorage.getItem('groupId'));
    }

    if (sessionStorage.getItem('fleetUserId')) {
      this.fleetIdData = sessionStorage.getItem('fleetUserId');
    }

    // ✅ Build VIN-to-Provider map
    const vinToProviderMapFromVehicles: { [vin: string]: string } = {};
    (this.allVehicles || []).forEach(vehicle => {
      const vin = vehicle.vin?.toUpperCase().trim();
      const provider = vehicle.provider?.toUpperCase().trim();
      if (vin && provider) {
        vinToProviderMapFromVehicles[vin] = provider;
      }
    });

    this.subscription$.add(
      this.dashboardservice.getEvents(
        this.pageNumber,
        this.pageSize,
        this.customConsumer,
        this.searchVIN,
        this.searchEvent,
        this.groupId,
        this.fleetIdData
      ).subscribe((res: any) => {
        this.eventList = (res?.data || []).map((event: any) => {
          const vin = event.vin?.toUpperCase()?.trim();
          const providerFromAPI = event.provider?.toUpperCase()?.trim();
          const fallbackProvider = vinToProviderMapFromVehicles[vin] || null;
          const finalProvider = providerFromAPI || fallbackProvider;

          return {
            ...event,
            provider: finalProvider,
          };
        });

        this.totalPages = res.totalPages;
        this.getPagination(this.pageNumber);
      }, err => {
        console.error('❌ Error loading events:', err);
      })
    );
  }





  selectPage(val) {
    // this.getVehicle(this.page, val)
  }

  selectPages(val) {
    if (val != '...') {
      this.pageNumber = val
      this.searchFilter()
    }
  }

  getPagination(page) {
    this.pages = []
    for (let i = 1; i <= this.totalPages; i++) {
      if (i < 3 && page < 3) {
        this.pages.push(i)
      }
      else if (i == 3 && page != 3 && page < 4) {
        this.pages.push(i)
        if (this.totalPages > 3) {
          this.pages.push('...')
        }

      } else if (i == this.totalPages && page != i && page != this.totalPages - 4) {
        this.pages.push(i)
      }
      else if (i == this.totalPages && page != i && page != this.totalPages - 3) {
        this.pages.push(i)
      }
      else if (page > 2 && page == i && page < this.totalPages - 3) {
        this.pages.push(1)
        this.pages.push('...')
        this.pages.push(page - 1)
        this.pages.push(page)
        this.pages.push(page + 1)
        this.pages.push('...')
      }
      else if (page > 2 && page == i && page == this.totalPages - 3) {
        this.pages.push(1)
        this.pages.push('...')
        this.pages.push(page - 1)
        this.pages.push(page)
        this.pages.push(page + 1)
      }
      else if (page > this.totalPages - 3 && this.totalPages != page && i == page) {
        this.pages.push(1)
        this.pages.push('...')
        // this.pages.push(this.totalPages - 4)
        this.pages.push(this.totalPages - 3)
        this.pages.push(this.totalPages - 2)
        this.pages.push(this.totalPages - 1)

      } else if (page == i && i == this.totalPages) {
        if (this.totalPages > 3) {
          this.pages.push(1)
          this.pages.push('...')
        }
        // this.pages.push(this.totalPages - 4)
        // this.pages.push(this.totalPages - 3)
        this.pages.push(this.totalPages - 2)
        this.pages.push(this.totalPages - 1)
        this.pages.push(this.totalPages)
      }
    }
    this.pageNumber = page
  }

  convertTimeDate(timestamp) {

    const formattedTimeNewData = timestamp
      ? moment.utc(timestamp).tz(this.selectedTimezone)
      : '--';
    return formattedTimeNewData
  }

 formatTimeDifference(alertTimeStamp: string): string {
  const eventTime = moment.utc(alertTimeStamp).tz(this.selectedTimezone);
  const currentTime = moment().tz(this.selectedTimezone);

  const diffInSeconds = currentTime.diff(eventTime, 'seconds');
  const totalMinutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = diffInSeconds % 60;

  if (hours >= 1) {
    return `${hours}h ${minutes}m ago`;
  } else if (totalMinutes >= 1) {
    return `${minutes}m ${seconds}s ago`;
  } else {
    return `${seconds}s ago`;
  }
}


  getImage(alert: string): string {
    const images: { [key: string]: string } = {
      'overspeeding': 'assets/images/icon-vehicle/os.svg',
      'rapid_acceleration': 'assets/images/icon-vehicle/harsh_a.svg',
      'night_driving': 'assets/images/icon-vehicle/nd.svg',
      'harsh_acceleration': 'assets/images/icon-vehicle/harsh_a.svg',
      'harsh acceleration': 'assets/images/icon-vehicle/harsh_a.svg',
      'harsh_braking': 'assets/images/icon-vehicle/harsh_b.svg',
      'geofence_crossed': 'assets/images/icon-vehicle/ev_range.svg',
      'geofence_crossed_in': 'assets/images/icon-vehicle/ev_range.svg',
      'geofence_crossed_out': 'assets/images/icon-vehicle/ev_range.svg',
      'overspeeding_in_geofence': 'assets/images/icon-vehicle/ev_range.svg',
      'harsh_cornering': 'assets/images/icon-vehicle/harsh_c.svg',
      'low_battery_charge': 'assets/images/icon-vehicle/bettery_level.svg',
      'sufficient_battery_charge': 'assets/images/icon-vehicle/bettery_level.svg',
      'gps_signal_lost': 'assets/images/icon-vehicle/ev_range.svg',
      'impact_event': 'assets/images/icon-vehicle/ev_range.svg',
      'abs warning': 'assets/images/abs_status.svg',
      'driver alertness warning': 'assets/images/cx_driver_alertness.svg',
      'cx_collision_mitigation_brake_status': 'assets/images/cx_collision_mitigation.svg',
      'fw_collision_audio_warning+warning_system': 'assets/images/cx_forward_collision.svg',
      'cx_collision.cx_collision_severity': 'assets/images/cx_collision_severity.svg',
      'cx_low_speed_collision_mitigation_system_status': 'assets/images/cx_low_speed.svg',
      'traction_control_brake': 'assets/images/cx_tracktion_control.svg',
      'vehicle tipped over': 'assets/images/cx_collision_tipped_over.svg',
      'auto emergency call': 'assets/images/cx_auto_e_call.svg',
      'airbag engaged': 'assets/images/seatbelt-black.svg',
      'multiple collision detected': 'assets/images/restraint-black.svg',
      'idling': 'assets/images/icon-vehicle/ev_range.svg', // add if you have an image
      'low_fuel':'assets/images/icon-vehicle/fuel_level.svg'
    };

    const normalized = alert?.trim().toLowerCase().replace(/\s+/g, '_');

    return images[normalized] || 'assets/images/icon-vehicle/ev_range.svg';
  }

  selectedVin: string | null = null;

  selectEvent(vin: string): void {
    this.selectedVin = vin;

    // Scroll to selected element after view updates
    setTimeout(() => {
      const element = document.getElementById(`vehicle-${vin}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // geofence filter
  get selectedGeofenceNames(): string[] {
    return this.geofenceList
      .filter(item => this.selectedGeofenceIds.includes(item.id))
      .map(item => item.name);
  }

  isAllGeofencesSelected(): boolean {
    return this.geoFenceList.length > 0 && this.selectedGeofenceIds.length === this.geoFenceList.length;
  }

  onToggleGeofence(id: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedGeofenceIds.includes(id)) {
        this.selectedGeofenceIds.push(id);
      }
    } else {
      this.selectedGeofenceIds = this.selectedGeofenceIds.filter(gid => gid !== id);
    }

    this.updateGeofenceSelection();
  }

  toggleSelectAllGeofences(checked: boolean): void {
    if (checked) {
      this.selectedGeofenceIds = this.geoFenceList.map(g => g.id);
    } else {
      this.selectedGeofenceIds = [];
    }
    this.updateGeofenceSelection();
  }

  updateGeofenceSelection(): void {
    const geofencesToRender = this.selectedGeofenceIds.length > 0
      ? this.geoFenceList.filter(item => this.selectedGeofenceIds.includes(item.id))
      : [];

    this.allGeoLocations = geofencesToRender
      .filter(item => Array.isArray(item.geoLocations) && item.geoLocations.length > 0)
      .map(item => ({
        locations: item.geoLocations,
        radius: item.radius,
      }));

    this.getTypeList = [...new Set(geofencesToRender.map(item => item.type))].map(type => {
      const matchedItem = geofencesToRender.find(item => item.type === type);
      return { id: matchedItem?.id, name: type };
    });

    this.drawGeoFencesOnMap();
  }
  getLogoPathByHostname(): string {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('onwardconnected.fleettrack.ai')) {
      return './assets/images/onward_connected.png';
    } else if (hostname.includes('ecotrack.fleettrack.ai')) {
      return './assets/images/logo-1.png';
    } else if (hostname.includes('smallboard.fleettrack.ai')) {
      return './assets/images/onpointsolution.png';
    }
    return './assets/images/onward_connected.png';
  }
  downloadTripHistoryReport() {
    const logoPath = this.getLogoPathByHostname();
    const formattedDate = this.datePipe.transform(this.selectedDate, 'MMM d, y') || 'Unknown Date';
    const metadata = {
      vin: this.selectedVehicle?.vin || '--',
      tripDate: formattedDate || '--',
      driverName: this.selectedVehicle?.driverName || '--',
      vehicleName: this.selectedVehicle?.alias || '--',
      make:this.eligibilityData?.make || '--',
      model:this.eligibilityData?.model || '--',
      year:this.eligibilityData?.year || '--',
    };
    const tripData = this.getData.flatMap((month: any) => month.tripList || []);
    const doc = new jsPDF('landscape', 'mm', 'a4'); // Portrait, mm units, A4 size
    const img = new Image();
    img.src = logoPath;

    img.onload = () => {
      const pageWidth = doc.internal.pageSize.getWidth();

      // Set default font and size
      doc.setFont('Poppins', 'normal');
      doc.setFontSize(12);

      // Draw logo on the left
      doc.addImage(img, 'PNG', 15, 10, 40, 13.2); // X, Y, Width, Height

      // Draw title centered
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const title = 'Trip History Report';
      const titleWidth = doc.getTextWidth(title);
      const centerX = (pageWidth - titleWidth) / 2;
      doc.text(title, centerX, 22); // Y = aligned with center of logo

      doc.setFontSize(9);
      let y = 40;
      const colGap = 52.9; // ~200px in mm

      // Helper function to draw bold label + normal value
      const drawLabelValue = (label: string, value: string, x: number, y: number) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, y);

        const labelWidth = doc.getTextWidth(label);
        doc.setFont('helvetica', 'normal');
        doc.text(value, x + labelWidth + 1, y); // +1mm padding after label
      };

      // Row 1: VIN and Trip Date
      drawLabelValue('VIN: ', metadata.vin, 15, y);
      drawLabelValue('Trip Date: ', metadata.tripDate, 15 + colGap, y);

      // Row 2: Driver Name and Vehicle Name
      drawLabelValue('Driver Name: ', metadata.driverName, 15, y + 7);
      drawLabelValue('Vehicle Name: ', metadata.vehicleName, 15 + colGap, y + 7);

      // Row 3: Make, Model, Year
      drawLabelValue('Make: ', metadata.make, 15, y + 14);
      drawLabelValue('Model: ', metadata.model, 15 + colGap, y + 14);
      drawLabelValue('Year: ', metadata.year, 15 + colGap * 2, y + 14); // 3rd column if needed

      // Prepare table data
      const tableData = tripData.map((trip: any) => [
        trip.formattedTimes || '--',
        trip.formattedTimesEnd || '--',
        this.formatSecondsToHourMinu(trip.cxIdlingDuration),
        trip.cxTripDistance || '0.00',
        trip.cxAlerts || 0,
        trip.startAddress || 'N/A',
        trip.endAddress || 'N/A'
      ]);

      // AutoTable
      autoTable(doc, {
        head: [[
          'Start Time', 'End Time', 'Idling Time',
          'Distance (mi)', 'Total Alerts', 'Start Address', 'End Address'
        ]],
        body: tableData,
        startY: y + 30,
        styles: {
          font: 'helvetica',
          fontSize: 9,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
        },
        columnStyles: {
          2: { // Idling Time
            cellWidth: 'auto',
            overflow: 'visible',
          },
          5: { // Start Address
            cellWidth: 70,             // fixed width to allow wrapping
            overflow: 'linebreak'      // wrap text
          },
          6: { // End Address
            cellWidth: 70,
            overflow: 'linebreak'
          }
        },
        headStyles: {
          fontStyle: 'bold',
          textColor: [0, 0, 0],
          fillColor: false,
          halign: 'left'
        },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.2
      });




      // Save PDF
      doc.save(`Trip_History_Report_${metadata.vin}_${metadata.tripDate}.pdf`);
    };
  }

  downloadTripSummaryPdf() {
    const data = this.dataForVehicleDetails;
    if (!data) return;

    const logoPath = this.getLogoPathByHostname(); // Keep your existing function
    const doc = new jsPDF('landscape', 'mm', 'a4'); // Landscape A4

    const img = new Image();
    img.src = logoPath;

    img.onload = () => {
      const pageWidth = doc.internal.pageSize.getWidth();

      // Set fonts and sizes
      doc.setFont('Poppins', 'normal');
      doc.setFontSize(12);

      // Logo
      doc.addImage(img, 'PNG', 15, 10, 40, 13.2);

      // Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const title = 'Trip Summary Report';
      const titleWidth = doc.getTextWidth(title);
      const centerX = (pageWidth - titleWidth) / 2;
      doc.text(title, centerX, 22);

      // Metadata
      doc.setFontSize(9);
      let y = 40;
      const colGap = 100.9;
      const formattedDate = this.datePipe.transform(this.selectedDate, 'MMM d, y') || 'Unknown Date';
      const drawLabelValue = (label: string, value: string, x: number, y: number) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, y);
        const labelWidth = doc.getTextWidth(label);
        doc.setFont('helvetica', 'normal');
        doc.text(value || '-', x + labelWidth + 1, y);
      };

      drawLabelValue('VIN: ', this.selectedVehicle.vin || '--', 15, y);
      drawLabelValue('Trip Date: ', formattedDate, 15 + colGap, y);
      drawLabelValue('Driver Name: ', data?.driverName || '--', 15, y + 7);
      drawLabelValue('Vehicle Name: ', this.selectedVehicle?.alias || '--', 15 + colGap, y + 7);
      // Wrap Start Address
      const startAddressLines = doc.splitTextToSize(data?.startAddress || 'N/A', 80);
      doc.setFont('helvetica', 'bold');
      doc.text('Start Address: ', 15, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.text(startAddressLines, 15 + doc.getTextWidth('Start Address: ') + 1, y + 14);

      // Wrap End Address
      const endAddressLines = doc.splitTextToSize(data?.endAddress || 'N/A', 80);
      doc.setFont('helvetica', 'bold');
      doc.text('End Address: ', 15 + colGap, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.text(endAddressLines, 15 + colGap + doc.getTextWidth('End Address: ') + 1, y + 14);

      drawLabelValue('Start Time: ', this.selectedTrip?.formattedTimes || '--', 15, y + 21);
      drawLabelValue('End Time: ', this.selectedTrip?.formattedTime || '--', 15 + colGap, y + 21);

      // Section Title
      doc.setFont('helvetica', 'bold');
      doc.text('Trip Summary:', 15, y + 30);

      // Table headers and row
      const headers = [[
        'Odometer (mi)','Trip Distance (mi)','Trip Duration','Speed (mph)','Fuel Consumed (gal)',
        'Fuel Level (gal)','Mileage (mpg)', 'Driver Score', 'Battery Level', 'Vehicle Status',
        'EV Range',

      ]];

      const row = [[
        data.endOdometer?.toFixed(2) ?? '-',
        data.cxTripDistance?.toFixed(2) ?? '-',
        this.formatSecondsToHourMinu(data.cxDuration),
        data.cxAvgVehicleSpeed?.toFixed(2) ?? '-',
        data.cxFuelConsumed?.toFixed(2) ?? '-',
        data.fuelLevel?.toFixed(2) ?? '-',
        data.mileage?.toFixed(2) ?? '-',
        data.cxDriverBehaviourScore ?? '-',
        data.remainingBattery >= 0 ? data.remainingBattery.toFixed(2) : '-',
       'Good',
        data.evRangeMilesPerKWh >= 0 ? data.evRangeMilesPerKWh.toFixed(2) : '-',
      ]];

      autoTable(doc, {
        head: headers,
        body: row,
        startY: y + 35,
        styles: {
          font: 'helvetica',
          fontSize: 9,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
        },
        headStyles: {
          fontStyle: 'bold',
          textColor: [0, 0, 0],
          fillColor: false,
          halign: 'left'
        },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.2,
        columnStyles: {
          9: { cellWidth: 30 }, // Trip Duration
          0: { cellWidth: 25 }, // Vehicle Status
          5: { cellWidth: 30 }, // Odometer
        },
      });

      // Event Summary Section
if (Array.isArray(data.cxAlerts) && data.cxAlerts.length > 0) {
  doc.setFont('helvetica', 'bold');
  doc.text('Event Summary:', 15, y + 60);

  // Prepare event table data
  const eventTableData = data.cxAlerts.map((alert: any) => {
    // 📅 Date & Time
    const timestamp = alert.alert_timestamp
      ? moment.utc(alert.alert_timestamp).tz(this.selectedTimezone).format('MMM D, YYYY, HH:mm')
      : '--';

    // 📍 Location (fallback from final to initial)
    const location = alert.cx_final_location || alert.cx_initial_location || alert.cx_location;
    const lat = location?.cx_latitude?.toFixed(5) ?? '--';
    const lng = location?.cx_longitude?.toFixed(5) ?? '--';

    // ⏱ Final Time (or fallback to alert_timestamp)
    const finalTime = alert.cx_final_time
      ? moment.utc(alert.cx_final_time).tz(this.selectedTimezone).format('HH:mm')
      : alert.alert_timestamp
        ? moment.utc(alert.alert_timestamp).tz(this.selectedTimezone).format('HH:mm')
        : '--';

    // 💤 Idling Duration (if exists)
    const idlingDuration = alert.cx_idling_duration?.value?.toString() ?? '--';

    // ⚠️ Event Type
    const description = alert.alert_description || '--';

    // 🚗 Final Speed (optional)
    const finalSpeed = alert.cx_final_speed ?? alert.cx_initial_speed ?? '--';

    // 🛣 Overspeed Distance OR value (e.g. g-force for harsh events)
    const distanceOrValue = alert.cx_overspeeding_distance?.value
      ? `${alert.cx_overspeeding_distance.value} ${alert.cx_overspeeding_distance.unit}`
      : alert.value?.toFixed(2) ?? '--';

    return [
      timestamp,
      `${lat}, ${lng}`,
      finalTime,
      idlingDuration,
      description,
      finalSpeed,
      distanceOrValue
    ];
  });

  autoTable(doc, {
    head: [[
      'Date & Time',
      'Location (Lat, Lng)',
      'Event Time',
      'Idling Duration (s)',
      'Event Type',
      'Speed (mph)',
      'Overspeed Distance'
    ]],
    body: eventTableData,
    startY: y + 65,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    columnStyles: {
      1: { cellWidth: 40 },
      4: { cellWidth: 30 },
      6: { cellWidth: 30 },
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fillColor: false,
      halign: 'left'
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.2
  });
}


      // Save the file
      doc.save(`Trip_Summary_Report_${data.vin}_${data.tripDate}.pdf`);
    };
  }

  getTrip(alert) {
    this.subscription$.add(
      this.dashboardservice.getTripId(this.vehicleSelection,alert?.alert_timestamp).subscribe((res:any)=>{
        if(res?.length > 0) {
          this.lmTripId = res[0]?.tripId;
          this.router.navigate(['adlp/admin/admindashboard/template-portal'],{queryParams:{tripId:this.lmTripId}})
        } else {
          this.router.navigate(['adlp/admin/admindashboard/template-portal'])
        }
      },err=>{

        this.appService.openSnackBar(err?.error?.apierror?.message,'Error')
      })
    )
  }

}
