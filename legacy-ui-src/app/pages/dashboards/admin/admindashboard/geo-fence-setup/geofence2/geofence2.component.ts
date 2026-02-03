import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MapsAPILoader } from '@agm/core';
import { Router } from '@angular/router';
import { TaxonomyService } from '../../../../taxonomy.service';
import { AppService } from 'src/app/app.service';
import { HttpClient } from '@angular/common/http';

type VinMappingStatus = 'pending' | 'mapping' | 'success' | 'failed';

interface GeofenceData {
  geofenceId?: string | number;
  id?: string | number;
  geofenceName: string;
  address?: string;
  addressName?: string;
  radiusInMeters: number;
  mappedVehicles?: any[];
  createdOn?: string | Date;  // API uses createdOn
  createdDate?: string | Date;  // For backward compatibility
  lastModifiedOn?: string | Date;  // API field for last modification
  isActive?: boolean;  // For backward compatibility
  status?: boolean | string;  // boolean from API (true/false)
  inactiveDate?: string | Date;  // For backward compatibility
  notificationEnabled?: boolean;
  notificationStatus?: string;
  latitude?: number;
  longitude?: number;
  formattedCreatedDate?: string;
  formattedInactiveDate?: string;
  timeZone?: string; // Timezone from API response
  timeZoneId?: string; // Timezone ID (e.g., "America/New_York")
  timeZoneName?: string; // Timezone name
  rawOffset?: number; // Raw offset in seconds
  dstOffset?: number; // DST offset in seconds
}

interface VinOption {
  vin: string;
  alias: string;
  checked: boolean;
  isMapped: boolean;
}

interface VinMappingState {
  vin: string;
  alias: string;
  status: VinMappingStatus;
  message?: string;
}

interface GeofenceStatsSummary {
  totalVehicles: number | string;
  totalEntries: number | string;
  totalExits: number | string;
  vehiclesInside: number | string;
  avgDuration: string;
}

interface GeofenceVehicleStatRow {
  vehicleName: string;
  vin: string;
  entries: number | string;
  exits: number | string;
  duration: string;
  lastEntry: string;
  lastExit: string;
  lastDuration: string;
  status: string;
}

interface VinTimelineEvent {
  eventType: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  isOngoing?: boolean;
  isLatest?: boolean;
  notes?: string;
  odometerReading?: string;
  fuelLevelGallons?: string;
}

interface GeofenceStatsState {
  loading: boolean;
  error: string;
  summary: GeofenceStatsSummary;
  vehicles: GeofenceVehicleStatRow[];
}

interface VinTimelineState {
  loading: boolean;
  error: string;
  events: VinTimelineEvent[];
}

interface DateRangeState {
  startDate: string;
  endDate: string;
  label: string;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-geofence2',
  templateUrl: './geofence2.component.html',
  styleUrls: ['./geofence2.component.scss']
})
export class Geofence2Component implements OnInit, OnDestroy {
  // Subscriptions
  subscription$: Subscription = new Subscription();

  // User & Auth
  user: any;
  customConsumer: any;
  fleetIdValueNew: any;

  // Fleet & Consumer Selection
  consumer: any = "All";
  fleetIdData: any;
  fleetList: any[] = [];

  // Geofence Data
  geofence2List: GeofenceData[] = [];
  expandedGeofenceId: string | number | null = null;
  expandedVinByGeofence: { [key: string]: string | null } = {};
  geofenceStatsMap: { [key: string]: GeofenceStatsState } = {};
  vinTimelineMap: { [key: string]: { [vin: string]: VinTimelineState } } = {};
  geofenceDateRanges: { [key: string]: DateRangeState } = {};

  // Search
  searchTerm: string = "";

  // Loading States
  isLoading: boolean = false;
  updatingGeofenceIds: Set<string | number> = new Set();
  statusUpdatingIds: Map<string | number, boolean> = new Map();

  // Modal Data
  selectedGeofence: any;
  mappedVehicles: any[] = [];

  // VIN Mapping Modal Data
  selectedGeofenceForMapping: any;
  vinList: VinOption[] = [];
  vinSearchTerm: string = "";
  selectAllVins: boolean = false;
  isLoadingVins: boolean = false;
  isMapping: boolean = false;
  mappingStatuses: VinMappingState[] = [];
  userEmail: string = "";
  mappingEndDateTime: string = "2099-12-16T00:55:02.507Z";
  mappedVinLookup: { [key: string]: VinMappingState } = {};

  // Event Modal Data
  selectedGeofenceForEvents: any;
  geofenceEventsData: any;
  eventsList: any[] = [];
  filteredEventsList: any[] = [];

  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  totalPages: number = 0;
  totalElements: number = 0;

  // Search
  eventSearchTerm: string = "";

  // Loading
  isLoadingEvents: boolean = false;

  // Modal Reference
  modalRef: NgbModalRef;

  // Add Geofence Form
  addGeofenceForm: FormGroup;
  isSubmitting: boolean = false;
  selectedAddress: string = '';
  selectedAddressName: string = '';

  // Google Maps
  map: any;
  geocoder: any;
  currentCircle: any;
  autocomplete: any;

  // Map Settings
  latitude: number = 37.09024;
  longitude: number = -95.712891;
  zoom: number = 4.5;
  mapTypeId: string = 'roadmap';

  // Timezone
  geofenceTimeZones: { [geofenceId: string]: any } = {};
  timeZones = [
    { key: 'PST', value: 'Pacific Standard Time' },
    { key: 'MST', value: 'Mountain Standard Time' },
    { key: 'CST', value: 'Central Standard Time' },
    { key: 'EST', value: 'Eastern Standard Time' },
    { key: 'AKST', value: 'Alaska Standard Time' },
    { key: 'HST', value: 'Hawaii Standard Time' },
    { key: 'PDT', value: 'Pacific Daylight Time' },
    { key: 'MDT', value: 'Mountain Daylight Time' },
    { key: 'CDT', value: 'Central Daylight Time' },
    { key: 'EDT', value: 'Eastern Daylight Time' },
    { key: 'AKDT', value: 'Alaska Daylight Time' },
    { key: 'UTC', value: 'Coordinated Universal Time' }
  ];

  // Date Range Filter
  selectedPeriod: string = ''; // Empty string to show all geofences by default
  selectedOption: string = '';
  timePeriods = [
    { label: 'Today', value: 'today' },
    { label: 'Current Week', value: 'weekly' },
    { label: 'Current Month', value: 'monthly' },
    { label: 'Previous Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'customRange' }
  ];
  isCardOpen: boolean = false;
  fromDate: string = '';
  toDate: string = '';
  customStartDate: string = '';
  customEndDate: string = '';
  filteredGeofence2List: GeofenceData[] = [];
  currentGeofenceId: string | number | null = null; // Track which geofence is being filtered

  // Delete modal properties
  showDeleteModal: boolean = false;
  deleteGeofenceId: string | number | null = null;
  deleteGeofenceName: string = '';
  deleteGeofenceToDelete: any = null;

  constructor(
    private _vehicleService: TaxonomyService,
    private modalService: NgbModal,
    private appService: AppService,
    private formBuilder: FormBuilder,
    private mapsAPILoader: MapsAPILoader,
    private http: HttpClient,
    private ngZone: NgZone,
    private router: Router
  ) {
    this.createAddGeofenceForm();
  }

  ngOnInit(): void {
    this.showRole();
    if (this.user === 'role_consumer_fleet') {
      this.selectConsumers();
    }

    // Set default fleetId to 100224 if not already set
    if (!this.fleetIdData) {
      this.fleetIdData = 100224;
      this.fetchGeofence2Data();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription$) {
      this.subscription$.unsubscribe();
    }
  }

  showRole(): void {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);

    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    this.userEmail = this.getLoggedInEmail();

    // Auto-set fleet ID for regular users
    if (this.user === 'role_user_fleet' || this.user === 'role_org_group') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;

      // Auto-fetch data for regular users
      if (this.fleetIdData) {
        this.fetchGeofence2Data();
      }
    }
  }

  selectConsumer(consumer: any): void {
    this.consumer = consumer;
    this.selectConsumers();
  }

  selectConsumers(): void {
    this.subscription$.add(
      this._vehicleService.getFleetList(this.consumer).subscribe(
        (res: any) => {
          this.fleetList = res || [];
          this.fleetList.sort((a: any, b: any) => a.name.localeCompare(b.name));
        },
        (err) => {
          console.error('Error fetching fleet list:', err);
          this.fleetList = [];
        }
      )
    );
  }

  onFleetIdChange(): void {
    if (this.fleetIdData) {
      this.fetchGeofence2Data();
    }
  }

  fetchGeofence2Data(): void {
    if (!this.fleetIdData) {
      return;
    }

    this.isLoading = true;
    this.subscription$.add(
      this._vehicleService.getStandaloneGeofences(this.fleetIdData).subscribe(
        (res: any) => {
          this.geofence2List = Array.isArray(res) ? res.map(g => this.normalizeGeofenceData(g)) : [];
          this.geofence2List.forEach((geofence) => {
            const geofenceId = this.getGeofenceId(geofence);
            if (!geofenceId) {
              return;
            }
            this.ensureDateRange(geofenceId);
            // Format dates with timezone
            this.formatGeofenceDates(geofence);
          });
          // Don't apply date filter - show all geofences
          this.filteredGeofence2List = [...this.geofence2List];
          this.isLoading = false;
        },
        (err) => {
          console.error('Error fetching geofence2 data:', err);
          this.geofence2List = [];
          this.filteredGeofence2List = [];
          this.isLoading = false;
          this.appService.openSnackBar('Failed to load geofence data', 'Error');
        }
      )
    );
  }

  normalizeGeofenceData(geofence: any): GeofenceData {
    // API returns status as boolean (true/false)
    const statusBoolean = geofence.status !== undefined ? geofence.status :
                          (geofence.isActive !== undefined ? geofence.isActive : true);

    return {
      ...geofence,
      // Map API fields
      createdOn: geofence.createdOn || geofence.createdDate || geofence.dateCreated || null,
      createdDate: geofence.createdOn || geofence.createdDate || geofence.dateCreated || null,
      lastModifiedOn: geofence.lastModifiedOn || null,

      // Status handling: API returns boolean, keep both for compatibility
      status: statusBoolean,  // Keep as boolean from API
      isActive: statusBoolean,  // For backward compatibility

      // Inactive date handling (only set if status is false)
      inactiveDate: !statusBoolean ? (geofence.lastModifiedOn || geofence.inactiveDate || geofence.dateInactive) : null,

      notificationEnabled: geofence.notificationEnabled !== undefined ? geofence.notificationEnabled : (geofence.notificationStatus === 'ON' ? true : geofence.notificationStatus === 'OFF' ? false : true),
      notificationStatus: geofence.notificationStatus || (geofence.notificationEnabled === false ? 'OFF' : 'ON'),
      latitude: geofence.centerLatitude || geofence.latitude || geofence.lat || null,
      longitude: geofence.centerLongitude || geofence.longitude || geofence.lng || geofence.lon || null,
      // Capture timezone information from API response if available
      timeZone: geofence.timeZone || geofence.timezone || null,
      timeZoneId: geofence.timeZoneId || geofence.timezoneId || null,
      timeZoneName: geofence.timeZoneName || geofence.timezoneName || null,
      rawOffset: geofence.rawOffset !== undefined ? geofence.rawOffset : null,
      dstOffset: geofence.dstOffset !== undefined ? geofence.dstOffset : null
    };
  }

  // Date Range Filter Methods
  onTimePeriodChange(selectedPeriod: string, geofenceId?: string | number): void {
    this.selectedPeriod = selectedPeriod;
    this.selectedOption = selectedPeriod;

    // If geofenceId is provided, update the stats for that specific geofence
    if (geofenceId) {
      this.currentGeofenceId = geofenceId;
      const range = this.ensureDateRange(geofenceId);

      if (this.selectedPeriod === 'customRange') {
        // Open modal for custom range selection
        this.isCardOpen = true;
        range.label = 'Showing statistics for Custom Range (select dates and click Submit)';
        return;
      }

      // Calculate date range based on selected period
      const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);

      // Convert ISO strings to YYYY-MM-DD format for date inputs
      range.startDate = this.formatDateInput(new Date(startDate));
      range.endDate = this.formatDateInput(new Date(endDate));

      // Set appropriate label based on period
      switch (this.selectedPeriod) {
        case 'today':
          range.label = 'Showing statistics for Today';
          break;
        case 'weekly':
          range.label = 'Showing statistics for Current Week';
          break;
        case 'monthly':
          range.label = 'Showing statistics for Current Month';
          break;
        case 'lastmonth':
          range.label = 'Showing statistics for Previous Month';
          break;
        default:
          this.updateDateRangeLabel(range);
      }

      // Fetch stats with new date range
      this.fetchGeofenceVehicleStats(geofenceId);

      // If a VIN is expanded, reload its timeline too
      const expandedVin = this.expandedVinByGeofence[geofenceId];
      if (expandedVin) {
        this.fetchVinTimeline(geofenceId, expandedVin);
      }
    } else {
      // Legacy behavior for top-level filter (if still used elsewhere)
      if (this.selectedPeriod === 'customRange') {
        this.isCardOpen = true;
      } else {
        this.isCardOpen = false;
        this.applyDateFilter();
      }
    }
  }

  handleOption(option: string): void {
    this.selectedOption = option;
    if (this.currentGeofenceId) {
      this.onTimePeriodChange(option, this.currentGeofenceId);
    }
  }

  openCard(geofenceId: string | number): void {
    this.currentGeofenceId = geofenceId;
    this.isCardOpen = true;
  }

  closeCard(): void {
    this.isCardOpen = false;
  }

  onCalendarDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;

    if (this.currentGeofenceId) {
      const range = this.ensureDateRange(this.currentGeofenceId);
      range.startDate = this.fromDate;
      range.endDate = this.toDate;
      this.updateDateRangeLabel(range);

      // Fetch stats with custom date range
      this.fetchGeofenceVehicleStats(this.currentGeofenceId);

      // If a VIN is expanded, reload its timeline too
      const expandedVin = this.expandedVinByGeofence[this.currentGeofenceId];
      if (expandedVin) {
        this.fetchVinTimeline(this.currentGeofenceId, expandedVin);
      }
    }

    this.closeCard();
  }

  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
    this.applyDateFilter();
  }

  applyDateFilter(): void {
    // If no period is selected or period is empty, show all geofences
    if (!this.selectedPeriod || this.selectedPeriod === '') {
      this.filteredGeofence2List = [...this.geofence2List];
      return;
    }

    const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod);

    this.filteredGeofence2List = this.geofence2List.filter(geofence => {
      if (!geofence.createdDate) {
        return false;
      }

      const createdDate = new Date(geofence.createdDate);
      const start = new Date(startDate);
      const end = new Date(endDate);

      return createdDate >= start && createdDate <= end;
    });
  }

  private calculateDateRange(period: string): { startDate: string, endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch(period) {
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
        startDate = new Date(`${this.fromDate}T00:00:00`);
        endDate = new Date(`${this.toDate}T23:59:59`);
        break;
      default:
        startDate = new Date(Date.UTC(2000, 0, 1));
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  // Apply custom date range filter for a specific geofence
  applyCustomDateRange(geofenceId: string | number): void {
    if (!this.customStartDate || !this.customEndDate) {
      console.warn('Both start and end dates are required');
      return;
    }

    // Validate that end date is after start date
    if (new Date(this.customStartDate) > new Date(this.customEndDate)) {
      console.warn('End date must be after start date');
      return;
    }

    // Set the custom date range and reload the geofence data
    this.fromDate = this.customStartDate;
    this.toDate = this.customEndDate;
    this.selectedPeriod = 'customRange';

    // Update the date range for this geofence
    this.geofenceDateRanges[geofenceId] = {
      startDate: this.customStartDate,
      endDate: this.customEndDate,
      label: 'Custom Range',
      isCurrentMonth: false
    };

    // Reload the geofence statistics with the custom date range
    this.fetchGeofenceVehicleStats(geofenceId);
  }

  // Reset custom date range filter for a specific geofence
  resetCustomDateRange(geofenceId: string | number): void {
    this.customStartDate = '';
    this.customEndDate = '';
    this.fromDate = '';
    this.toDate = '';
    this.selectedPeriod = 'monthly'; // Reset to default

    // Clear the date range for this geofence
    delete this.geofenceDateRanges[geofenceId];

    // Reload the geofence statistics without date filter
    this.fetchGeofenceVehicleStats(geofenceId);
  }

  getTimeZoneKey(value: string): string | undefined {
    const zone = this.timeZones.find(zone => zone.value === value);
    return zone ? zone.key : value;
  }

  convertUTCToTimestamp(utcDateTime: string): number {
    const utcDate = new Date(utcDateTime);
    return utcDate.getTime();
  }

  convertToLocalTime(utcTimestamp: number, timezoneData: any): string {
    if (!timezoneData || !timezoneData.timeZoneName) {
      return 'Invalid Timezone';
    }

    const totalOffsetMs = (timezoneData.rawOffset + timezoneData.dstOffset) * 1000;
    const localTimestamp = utcTimestamp + totalOffsetMs;
    const localTime = new Date(localTimestamp);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    return `${localTime.toLocaleString('en-US', options)} (${this.getTimeZoneKey(timezoneData.timeZoneName)})`;
  }

  private getTimezoneFromCoordinates(lat: number, lng: number, callback: (timezone: any) => void): void {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=AIzaSyBNwm8gkVLJMsKn6crHaFZ4tCKvihwy6Bg`;

    this.http.get(url).subscribe(
      (response: any) => {
        this.ngZone.run(() => {
          if (response.status === 'OK') {
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

  formatGeofenceDates(geofence: GeofenceData): void {
    const geofenceId = this.getGeofenceId(geofence);

    // Check if geofence has timezone information from API response
    const hasTimezoneData = geofence.timeZoneId || (geofence.rawOffset !== null && geofence.rawOffset !== undefined);

    // Use createdOn for created date (API field)
    const createdDateValue = geofence.createdOn || geofence.createdDate;
    // Use lastModifiedOn for inactive date if status is false
    const inactiveDateValue = (geofence.status === false || geofence.isActive === false) ?
                              (geofence.lastModifiedOn || geofence.inactiveDate) : null;

    if (hasTimezoneData) {
      // Use timezone data from API response
      const timezoneData = {
        timeZoneId: geofence.timeZoneId || 'UTC',
        timeZoneName: geofence.timeZoneName || geofence.timeZone || 'Coordinated Universal Time',
        rawOffset: geofence.rawOffset || 0,
        dstOffset: geofence.dstOffset || 0
      };

      // Store timezone data for this geofence
      if (geofenceId) {
        this.geofenceTimeZones[geofenceId.toString()] = timezoneData;
      }

      // Format dates using the timezone from API
      if (createdDateValue) {
        const createdTimestamp = this.convertUTCToTimestamp(createdDateValue.toString());
        geofence.formattedCreatedDate = this.convertToLocalTime(createdTimestamp, timezoneData);
      } else {
        geofence.formattedCreatedDate = 'N/A';
      }

      if (inactiveDateValue) {
        const inactiveTimestamp = this.convertUTCToTimestamp(inactiveDateValue.toString());
        geofence.formattedInactiveDate = this.convertToLocalTime(inactiveTimestamp, timezoneData);
      } else {
        geofence.formattedInactiveDate = 'N/A';
      }
      return;
    }

    // Fallback: if no timezone data and no coordinates, use browser timezone
    if (!geofenceId || !geofence.latitude || !geofence.longitude) {
      if (createdDateValue) {
        const createdDate = new Date(createdDateValue);
        const formattedDate = createdDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const timeZoneAbbr = createdDate.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
        geofence.formattedCreatedDate = `${formattedDate} (${timeZoneAbbr})`;
      } else {
        geofence.formattedCreatedDate = 'N/A';
      }

      if (inactiveDateValue) {
        const inactiveDate = new Date(inactiveDateValue);
        const formattedDate = inactiveDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const timeZoneAbbr = inactiveDate.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
        geofence.formattedInactiveDate = `${formattedDate} (${timeZoneAbbr})`;
      } else {
        geofence.formattedInactiveDate = 'N/A';
      }
      return;
    }

    // If coordinates exist but no timezone data from API, use Google Maps Timezone API
    this.getTimezoneFromCoordinates(geofence.latitude, geofence.longitude, (timezoneData: any) => {
      this.geofenceTimeZones[geofenceId.toString()] = timezoneData;

      if (createdDateValue) {
        const createdTimestamp = this.convertUTCToTimestamp(createdDateValue.toString());
        geofence.formattedCreatedDate = this.convertToLocalTime(createdTimestamp, timezoneData);
      } else {
        geofence.formattedCreatedDate = 'N/A';
      }

      if (inactiveDateValue) {
        const inactiveTimestamp = this.convertUTCToTimestamp(inactiveDateValue.toString());
        geofence.formattedInactiveDate = this.convertToLocalTime(inactiveTimestamp, timezoneData);
      } else {
        geofence.formattedInactiveDate = 'N/A';
      }
    });
  }

  get filteredData(): GeofenceData[] {
    // Use filteredGeofence2List if a period filter is applied, otherwise use full list
    const dateFiltered = (this.filteredGeofence2List.length > 0 && this.selectedPeriod)
      ? this.filteredGeofence2List
      : this.geofence2List;

    // Apply search filter on top of date filter
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      return dateFiltered;
    }

    const searchLower = this.searchTerm.toLowerCase();
    return dateFiltered.filter((geofence: GeofenceData) =>
      geofence.geofenceName && geofence.geofenceName.toLowerCase().includes(searchLower)
    );
  }

  toggleGeofenceStatus(geofence: GeofenceData): void {
    const geofenceId = this.getGeofenceId(geofence);
    if (!geofenceId) {
      this.appService.openSnackBar('Unable to identify geofence', 'Error');
      return;
    }

    // Prevent multiple simultaneous updates
    if (this.updatingGeofenceIds.has(geofenceId)) {
      return;
    }

    // Toggle the status
    const newIsActive = !(geofence.isActive === true || geofence.status === 'Active');
    geofence.isActive = newIsActive;
    geofence.status = newIsActive ? 'Active' : 'Inactive';

    // Set inactive date if changing to inactive
    if (!newIsActive && !geofence.inactiveDate) {
      geofence.inactiveDate = new Date().toISOString();
    }

    // Clear inactive date if changing to active
    if (newIsActive) {
      geofence.inactiveDate = null;
    }

    // Call API to update the geofence status
    this.updateGeofenceStatus(geofence, newIsActive);
  }

  toggleNotificationStatus(geofence: GeofenceData): void {
    const geofenceId = this.getGeofenceId(geofence);
    if (!geofenceId) {
      this.appService.openSnackBar('Unable to identify geofence', 'Error');
      return;
    }

    // Prevent multiple simultaneous updates
    if (this.updatingGeofenceIds.has(geofenceId)) {
      return;
    }

    // Toggle the notification status
    const newNotificationEnabled = !(geofence.notificationEnabled === true || geofence.notificationStatus === 'ON');
    geofence.notificationEnabled = newNotificationEnabled;
    geofence.notificationStatus = newNotificationEnabled ? 'ON' : 'OFF';

    // Call API to update the notification status
    this.updateNotificationStatus(geofence, newNotificationEnabled);
  }

  updateGeofenceStatus(geofence: GeofenceData, isActive: boolean): void {
    const geofenceId = this.getGeofenceId(geofence);
    if (!geofenceId) return;

    // Mark as updating
    this.updatingGeofenceIds.add(geofenceId);

    // Prepare update payload
    const updatePayload = {
      isActive: isActive,
      status: isActive ? 'Active' : 'Inactive',
      inactiveDate: isActive ? null : (geofence.inactiveDate || new Date().toISOString())
    };

    // Call the API to update geofence status
    this.subscription$.add(
      this._vehicleService.updateGeofenceNew(geofenceId.toString(), updatePayload).subscribe(
        (res: any) => {
          this.updatingGeofenceIds.delete(geofenceId);
          this.appService.openSnackBar(
            `Geofence status updated to ${isActive ? 'Active' : 'Inactive'}`,
            'Success'
          );
        },
        (err) => {
          console.error('Error updating geofence status:', err);
          this.updatingGeofenceIds.delete(geofenceId);
          // Revert the change on error
          geofence.isActive = !isActive;
          geofence.status = !isActive ? 'Active' : 'Inactive';
          if (!isActive) {
            geofence.inactiveDate = null;
          }
          this.appService.openSnackBar('Failed to update geofence status', 'Error');
        }
      )
    );
  }

  updateNotificationStatus(geofence: GeofenceData, notificationEnabled: boolean): void {
    const geofenceId = this.getGeofenceId(geofence);
    if (!geofenceId) return;

    // Mark as updating
    this.updatingGeofenceIds.add(geofenceId);

    // Prepare update payload
    const updatePayload = {
      notificationEnabled: notificationEnabled,
      notificationStatus: notificationEnabled ? 'ON' : 'OFF'
    };

    // Call the API to update notification status
    this.subscription$.add(
      this._vehicleService.updateGeofenceNew(geofenceId.toString(), updatePayload).subscribe(
        (res: any) => {
          this.updatingGeofenceIds.delete(geofenceId);
          this.appService.openSnackBar(
            `Notifications turned ${notificationEnabled ? 'ON' : 'OFF'}`,
            'Success'
          );
        },
        (err) => {
          console.error('Error updating notification status:', err);
          this.updatingGeofenceIds.delete(geofenceId);
          // Revert the change on error
          geofence.notificationEnabled = !notificationEnabled;
          geofence.notificationStatus = !notificationEnabled ? 'ON' : 'OFF';
          this.appService.openSnackBar('Failed to update notification status', 'Error');
        }
      )
    );
  }

  openMappedVehiclesModal(modalRef: any, geofence: any): void {
    this.selectedGeofence = geofence;
    this.mappedVehicles = geofence.mappedVehicles || [];
    this.modalRef = this.modalService.open(modalRef, { size: 'md', centered: true });
  }

  openMapVinsModal(modalRef: any, geofence: any): void {
    if (!this.fleetIdData) {
      this.appService.openSnackBar('Please select a fleet before mapping vehicles.', 'Error');
      return;
    }

    this.selectedGeofenceForMapping = geofence;
    this.vinSearchTerm = "";
    this.selectAllVins = false;
    this.setMappedVehicles(geofence);
    this.loadVinList();
    this.modalRef = this.modalService.open(modalRef, { size: 'lg', centered: true });
  }

  loadVinList(): void {
    if (!this.fleetIdData) {
      this.vinList = [];
      return;
    }

    this.isLoadingVins = true;
    this.subscription$.add(
      this._vehicleService.getVINs(this.fleetIdData).subscribe(
        (res: any) => {
          const rawVins = Array.isArray(res?.vins) ? res.vins : [];
          const normalized = rawVins
            .map((item: any) => this.normalizeVinOption(item))
            .filter((item: VinOption | null) => item !== null) as VinOption[];
          this.vinList = normalized.sort((a, b) => a.vin.localeCompare(b.vin));
          this.applyMappedVehicles();
          this.isLoadingVins = false;
          this.updateSelectAllVinsStatus();
        },
        (err) => {
          console.error('Error fetching VIN list:', err);
          this.vinList = [];
          this.isLoadingVins = false;
          this.appService.openSnackBar('Failed to load vehicle list', 'Error');
        }
      )
    );
  }

  toggleGeofencePanel(geofence: any): void {
    const geofenceId = this.getGeofenceId(geofence);
    if (!geofenceId) {
      this.appService.openSnackBar('Geofence details are missing.', 'Error');
      return;
    }

    if (this.expandedGeofenceId === geofenceId) {
      this.expandedGeofenceId = null;
      return;
    }

    this.expandedGeofenceId = geofenceId;
    this.expandedVinByGeofence[geofenceId] = null;
    this.ensureDateRange(geofenceId);
    this.fetchGeofenceVehicleStats(geofenceId);
  }

  /**
   * Navigate to Geofence VIN Report page
   */
  navigateToGeofenceReport(geofence: any, event?: Event): void {
    // Prevent event propagation if clicking on icon/button
    if (event) {
      event.stopPropagation();
    }

    const geofenceId = this.getGeofenceId(geofence);
    const geofenceName = geofence?.geofenceName || 'Unknown Geofence';

    console.log('Navigating to geofence report:', {
      geofenceId,
      geofenceName,
      geofence,
      'Full geofence object': JSON.stringify(geofence, null, 2)
    });

    if (!geofenceId) {
      this.appService.openSnackBar('Geofence details are missing.', 'Error');
      return;
    }

    // Build query parameters with timezone information
    const queryParams: any = {
      geofenceId: geofenceId,
      geofenceName: geofenceName,
      fleetId: this.fleetIdData || '100224'
    };

    // Add timezone information directly from geofence object if available
    if (geofence?.timeZone) {
      queryParams.timeZone = geofence.timeZone;
      console.log('Passing timezone:', geofence.timeZone);
    }
    if (geofence?.timeZoneId) {
      queryParams.timeZoneId = geofence.timeZoneId;
    }
    if (geofence?.timeZoneName) {
      queryParams.timeZoneName = geofence.timeZoneName;
    }

    console.log('Navigation query params:', queryParams);

    this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/geofence-vin-report'], {
      queryParams: queryParams
    }).then(success => {
      console.log('Navigation success:', success);
    }).catch(err => {
      console.error('Navigation error:', err);
    });
  }

  /**
   * Delete a geofence permanently - Open modal
   */
  deleteGeofence(geofence: any, event?: Event): void {
    // Prevent event propagation if clicking on icon/button
    if (event) {
      event.stopPropagation();
    }

    const geofenceId = this.getGeofenceId(geofence);
    const geofenceName = geofence?.geofenceName || 'this geofence';

    if (!geofenceId) {
      this.appService.openSnackBar('Geofence details are missing.', 'Error');
      return;
    }

    // Store geofence details and show modal
    this.deleteGeofenceId = geofenceId;
    this.deleteGeofenceName = geofenceName;
    this.deleteGeofenceToDelete = geofence;
    this.showDeleteModal = true;
  }

  /**
   * Confirm deletion
   */
  confirmDelete(): void {
    if (!this.deleteGeofenceId) {
      return;
    }

    console.log('Deleting geofence permanently:', this.deleteGeofenceId);

    // Close modal
    this.showDeleteModal = false;

    // Show loading state
    this.isLoading = true;

    // Call the cascade delete API
    this._vehicleService.deleteGeofenceCascade(this.deleteGeofenceId).subscribe(
      (response) => {
        console.log('Geofence deleted successfully:', response);
        this.appService.openSnackBar(`Geofence "${this.deleteGeofenceName}" has been permanently deleted`, 'Success');

        // Reset delete properties
        this.resetDeleteModal();

        // Refresh the geofence list
        this.fetchGeofence2Data();
      },
      (error) => {
        console.error('Error deleting geofence:', error);
        this.isLoading = false;

        const errorMessage = error?.error?.message || error?.message || 'Failed to delete geofence';
        this.appService.openSnackBar(errorMessage, 'Error');

        // Reset delete properties
        this.resetDeleteModal();
      }
    );
  }

  /**
   * Cancel deletion
   */
  cancelDelete(): void {
    this.resetDeleteModal();
  }

  /**
   * Reset delete modal properties
   */
  private resetDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteGeofenceId = null;
    this.deleteGeofenceName = '';
    this.deleteGeofenceToDelete = null;
  }

  toggleVinPanel(geofenceId: string | number, vinRow: GeofenceVehicleStatRow): void {
    const vin = vinRow?.vin;
    if (!vin) {
      return;
    }

    if (this.expandedVinByGeofence[geofenceId] === vin) {
      this.expandedVinByGeofence[geofenceId] = null;
      return;
    }

    this.expandedVinByGeofence[geofenceId] = vin;
    this.fetchVinTimeline(geofenceId, vin);
  }

  isVinExpanded(geofenceId: string | number, vin: string): boolean {
    return this.expandedVinByGeofence[geofenceId] === vin;
  }

  isGeofenceExpanded(geofenceId: string | number): boolean {
    return this.expandedGeofenceId === geofenceId;
  }

  isGeofenceUpdating(geofence: GeofenceData): boolean {
    const geofenceId = this.getGeofenceId(geofence);
    return geofenceId ? this.updatingGeofenceIds.has(geofenceId) : false;
  }

  isStatusUpdating(geofenceId: string | number): boolean {
    return this.statusUpdatingIds.get(geofenceId) === true;
  }

  updateStatus(geofence: any, active: boolean): void {
    const geofenceId = this.getGeofenceId(geofence);
    if (!geofenceId) {
      this.appService.openSnackBar('Unable to identify geofence', 'Error');
      return;
    }

    // Check if already updating
    if (this.isStatusUpdating(geofenceId)) {
      return;
    }

    // Set updating state
    this.statusUpdatingIds.set(geofenceId, true);

    // Call the API
    this.subscription$.add(
      this._vehicleService.updateGeofenceStatus(geofenceId, active).subscribe(
        (response) => {
          // Always clear updating state first
          this.statusUpdatingIds.delete(geofenceId);

          if (response && response.success) {
            // Update the geofence status in the local data using both status (boolean) and isActive
            geofence.status = active;  // boolean from API
            geofence.isActive = active;  // for backward compatibility

            // Update lastModifiedOn if provided in response
            if (response.lastModifiedOn) {
              geofence.lastModifiedOn = response.lastModifiedOn;
            }

            // Set/clear inactive date
            if (!active && !geofence.inactiveDate) {
              geofence.inactiveDate = new Date().toISOString();

              // Format the inactive date
              const inactiveDate = new Date(geofence.inactiveDate);
              const formattedDate = inactiveDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              const timeZoneAbbr = inactiveDate.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
              geofence.formattedInactiveDate = `${formattedDate} (${timeZoneAbbr})`;
            } else if (active) {
              geofence.inactiveDate = null;
              geofence.formattedInactiveDate = 'N/A';
            }

            this.appService.openSnackBar(
              response.message || `Geofence status updated to ${active ? 'Active' : 'Inactive'} successfully`,
              'Success'
            );
          } else {
            // Revert on failure
            geofence.status = !active;
            geofence.isActive = !active;

            this.appService.openSnackBar(
              response?.errorMessage || 'Failed to update geofence status',
              'Error'
            );
          }
        },
        (error) => {
          // Always clear updating state first
          this.statusUpdatingIds.delete(geofenceId);

          // Revert on error
          geofence.status = !active;
          geofence.isActive = !active;

          this.appService.openSnackBar(
            'Error updating geofence status: ' + (error?.error?.message || error?.message || 'Unknown error'),
            'Error'
          );
        }
      )
    );
  }

  applyDateRange(geofence: any): void {
    const geofenceId = this.getGeofenceId(geofence);
    if (!geofenceId) {
      return;
    }

    const range = this.ensureDateRange(geofenceId);
    if (!range.startDate || !range.endDate) {
      this.appService.openSnackBar('Please select both start and end dates.', 'Error');
      return;
    }

    this.updateDateRangeLabel(range);
    this.fetchGeofenceVehicleStats(geofenceId);

    const expandedVin = this.expandedVinByGeofence[geofenceId];
    if (expandedVin) {
      this.fetchVinTimeline(geofenceId, expandedVin);
    }
  }

  getDateRangeLabel(geofenceId: string | number): string {
    return this.geofenceDateRanges[geofenceId]?.label || 'Showing statistics for Current Month';
  }

  getGeofenceStatsState(geofenceId: string | number): GeofenceStatsState {
    if (!this.geofenceStatsMap[geofenceId]) {
      this.geofenceStatsMap[geofenceId] = {
        loading: false,
        error: '',
        summary: this.getEmptySummary(),
        vehicles: []
      };
    }
    return this.geofenceStatsMap[geofenceId];
  }

  getVinTimelineState(geofenceId: string | number, vin: string): VinTimelineState {
    if (!this.vinTimelineMap[geofenceId]) {
      this.vinTimelineMap[geofenceId] = {};
    }
    if (!this.vinTimelineMap[geofenceId][vin]) {
      this.vinTimelineMap[geofenceId][vin] = {
        loading: false,
        error: '',
        events: []
      };
    }
    return this.vinTimelineMap[geofenceId][vin];
  }

  openGeofenceEventsModal(modalRef: any, geofence: any): void {
    this.selectedGeofenceForEvents = geofence;
    this.currentPage = 0;
    this.eventSearchTerm = "";

    this.modalRef = this.modalService.open(modalRef, { size: 'xl', centered: true });
    this.fetchGeofenceEvents();
  }

  fetchGeofenceEvents(): void {
    if (!this.selectedGeofenceForEvents?.geofenceId) {
      return;
    }

    this.isLoadingEvents = true;
    this.subscription$.add(
      this._vehicleService.getGeofenceEvents(
        this.selectedGeofenceForEvents.geofenceId,
        this.currentPage,
        this.pageSize
      ).subscribe(
        (res: any) => {
          this.geofenceEventsData = res;
          this.eventsList = res?.events || [];
          this.totalPages = res?.pagination?.totalPages || 0;
          this.totalElements = res?.pagination?.totalElements || 0;
          this.filterEvents();
          this.isLoadingEvents = false;
        },
        (err) => {
          console.error('Error fetching geofence events:', err);
          this.eventsList = [];
          this.isLoadingEvents = false;
          this.appService.openSnackBar('Failed to load geofence events', 'Error');
        }
      )
    );
  }

  filterEvents(): void {
    if (!this.eventSearchTerm || this.eventSearchTerm.trim() === '') {
      this.filteredEventsList = this.eventsList;
      return;
    }

    const searchLower = this.eventSearchTerm.toLowerCase();
    this.filteredEventsList = this.eventsList.filter((event: any) =>
      (event.vin && event.vin.toLowerCase().includes(searchLower)) ||
      (event.vinAlias && event.vinAlias.toLowerCase().includes(searchLower))
    );
  }

  get filteredVinList(): VinOption[] {
    if (!this.vinSearchTerm || this.vinSearchTerm.trim() === '') {
      return this.vinList;
    }

    const searchLower = this.vinSearchTerm.toLowerCase();
    return this.vinList.filter((vin) =>
      vin.vin.toLowerCase().includes(searchLower) ||
      (vin.alias && vin.alias.toLowerCase().includes(searchLower))
    );
  }

  get hasSelectedVins(): boolean {
    return this.vinList.some((vin) => vin.checked && !vin.isMapped);
  }

  get mappingDoneCount(): number {
    return this.mappingStatuses.filter((status) => status.status === 'success' || status.status === 'failed').length;
  }

  get mappingFailedCount(): number {
    return this.mappingStatuses.filter((status) => status.status === 'failed').length;
  }

  toggleSelectAllVins(): void {
    const targetList = this.filteredVinList;
    targetList.forEach((vin) => {
      if (!vin.isMapped) {
        vin.checked = this.selectAllVins;
      }
    });
    this.updateSelectAllVinsStatus();
  }

  updateSelectAllVinsStatus(): void {
    const targetList = this.filteredVinList;
    const selectableList = targetList.filter((vin) => !vin.isMapped);
    if (selectableList.length === 0) {
      this.selectAllVins = targetList.length > 0;
      return;
    }

    this.selectAllVins = selectableList.every((vin) => vin.checked);
  }

  async mapSelectedVins(): Promise<void> {
    if (this.isMapping) {
      return;
    }

    const geofenceId = this.selectedGeofenceForMapping?.geofenceId ?? this.selectedGeofenceForMapping?.id;
    if (!geofenceId) {
      this.appService.openSnackBar('Geofence details are missing for mapping.', 'Error');
      return;
    }

    if (!this.userEmail) {
      this.appService.openSnackBar('Unable to find logged-in email for alerts.', 'Error');
      return;
    }

    const selected = this.vinList.filter((vin) => vin.checked && !vin.isMapped);
    if (selected.length === 0) {
      this.appService.openSnackBar('All selected VINs are already mapped.', 'Error');
      return;
    }

    this.isMapping = true;
    const alreadyMappedStatuses = this.getMappedStatusList();
    this.mappingStatuses = [
      ...alreadyMappedStatuses,
      ...selected.map((vin) => ({
        vin: vin.vin,
        alias: vin.alias,
        status: 'pending' as VinMappingStatus
      }))
    ];

    for (let index = 0; index < selected.length; index++) {
      const vinEntry = selected[index];
      this.updateMappingStatus(vinEntry.vin, 'mapping');

      const payload = this.buildVinMappingPayload(vinEntry.vin, geofenceId);

      try {
        await firstValueFrom(this._vehicleService.mapVinToGeofence(payload));
        vinEntry.isMapped = true;
        this.updateMappingStatus(vinEntry.vin, 'success');
      } catch (err: any) {
        const errorMessage = err?.error?.message || err?.message || 'Mapping failed';
        this.updateMappingStatus(vinEntry.vin, 'failed', errorMessage);
      }

      if (index < selected.length - 1) {
        await this.delay(200);
      }
    }

    this.isMapping = false;
    this.fetchGeofence2Data();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.fetchGeofenceEvents();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, pages around current, and last page
      const startPage = Math.max(0, this.currentPage - 2);
      const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Initialize Add Geofence Form
  createAddGeofenceForm(): void {
    this.addGeofenceForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      fleetId: [null, Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      radius: [100, [Validators.required, Validators.min(50), Validators.max(500)]],
      description: [''],
      address: [''],
      addressName: ['']
    });
  }

  // Open Add Geofence Modal
  openAddGeofenceModal(modalRef: any): void {
    // Reset form - set default radius and auto-fill fleet for regular users
    this.addGeofenceForm.reset({
      radius: 100,
      fleetId: this.user === 'role_user_fleet' || this.user === 'role_org_group' ? this.fleetIdValueNew : null
    });
    this.selectedAddress = '';
    this.selectedAddressName = '';

    // Clear existing circle
    if (this.currentCircle) {
      this.currentCircle.setMap(null);
      this.currentCircle = null;
    }

    // Reset map position
    this.latitude = 37.09024;
    this.longitude = -95.712891;
    this.zoom = 4.5;

    this.modalRef = this.modalService.open(modalRef, {
      size: 'xl',
      centered: true,
      backdrop: 'static'
    });

    setTimeout(() => {
      const searchBox = document.getElementById('addressSearch') as HTMLInputElement;
      if (searchBox) {
        searchBox.value = '';
      }
    }, 50);

    // Initialize Google Maps after modal opens
    setTimeout(() => this.initializeMap(), 500);
  }

  // Initialize Google Maps
  initializeMap(): void {
    this.mapsAPILoader.load().then(() => {
      this.geocoder = new google.maps.Geocoder();

      // Wait a bit more for the DOM element to be ready
      setTimeout(() => {
        const searchBox = document.getElementById('addressSearch') as HTMLInputElement;
        if (searchBox) {
          // Clear any existing autocomplete
          if (this.autocomplete) {
            google.maps.event.clearInstanceListeners(searchBox);
          }

          // Initialize autocomplete with proper options
          this.autocomplete = new google.maps.places.Autocomplete(searchBox, {
            componentRestrictions: { country: 'us' },
            fields: ['geometry', 'formatted_address', 'name'],
            types: ['address']
          });

          // Add listener for place selection
          this.autocomplete.addListener('place_changed', () => {
            const place = this.autocomplete.getPlace();

            if (!place.geometry) {
              console.warn('No geometry found for selected place');
              return;
            }

            const formattedAddress = place.formatted_address || place.formattedAddress || place.name || '';
            const placeName = place.name || formattedAddress;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            this.latitude = lat;
            this.longitude = lng;
            this.zoom = 15;
            this.selectedAddress = formattedAddress;
            this.selectedAddressName = placeName;

            // Update form
            this.addGeofenceForm.patchValue({
              latitude: lat.toString(),
              longitude: lng.toString(),
              address: formattedAddress,
              addressName: placeName
            });

            // Draw circle at location
            this.drawCircle(lat, lng);
          });

          console.log('Autocomplete initialized successfully');
        } else {
          console.error('Address search input not found');
        }
      }, 100);
    }).catch(err => {
      console.error('Error loading Google Maps API:', err);
    });
  }

  // Map ready handler
  onMapReady(map: any): void {
    this.map = map;
  }

  // Draw circle on map
  drawCircle(lat: number, lng: number): void {
    // Remove existing circle
    if (this.currentCircle) {
      this.currentCircle.setMap(null);
    }

    const radiusInMeters = this.addGeofenceForm.get('radius')?.value || 100;

    // Create new circle
    this.currentCircle = new google.maps.Circle({
      strokeColor: '#FA751A',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FA751A',
      fillOpacity: 0.35,
      map: this.map,
      center: { lat, lng },
      radius: radiusInMeters,
      editable: true,
      draggable: true
    });

    // Listen to radius changes
    google.maps.event.addListener(this.currentCircle, 'radius_changed', () => {
      const newRadius = Math.round(this.currentCircle.getRadius());
      this.addGeofenceForm.patchValue({ radius: newRadius }, { emitEvent: false });
    });

    // Listen to center changes
    google.maps.event.addListener(this.currentCircle, 'center_changed', () => {
      const center = this.currentCircle.getCenter();
      this.latitude = center.lat();
      this.longitude = center.lng();
      this.addGeofenceForm.patchValue({
        latitude: center.lat().toString(),
        longitude: center.lng().toString()
      }, { emitEvent: false });
    });
  }

  // Handle radius input change
  onRadiusChange(): void {
    if (this.currentCircle) {
      const radiusInMeters = this.addGeofenceForm.get('radius')?.value;
      if (radiusInMeters >= 50 && radiusInMeters <= 500) {
        this.currentCircle.setRadius(radiusInMeters);
      }
    }
  }

  // Handle map click
  onMapClick(event: any): void {
    const lat = event.coords.lat;
    const lng = event.coords.lng;

    this.latitude = lat;
    this.longitude = lng;
    this.selectedAddress = '';
    this.selectedAddressName = '';

    this.addGeofenceForm.patchValue({
      latitude: lat.toString(),
      longitude: lng.toString(),
      address: '',
      addressName: ''
    });

    this.drawCircle(lat, lng);
  }

  // Submit Add Geofence Form
  submitAddGeofence(): void {
    if (this.addGeofenceForm.invalid) {
      Object.keys(this.addGeofenceForm.controls).forEach(key => {
        this.addGeofenceForm.get(key)?.markAsTouched();
      });
      this.appService.openSnackBar('Please fill all required fields', 'Error');
      return;
    }

    const formValue = this.addGeofenceForm.value;

    // Convert radius from meters to kilometers
    const radiusInKm = formValue.radius / 1000;

    const payload = {
      name: formValue.name,
      fleetId: formValue.fleetId.toString(),
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      radius: radiusInKm,
      description: formValue.description || '',
      address: formValue.address || '',
      addressName: formValue.addressName || ''
    };

    this.isSubmitting = true;
    this.subscription$.add(
      this._vehicleService.createStandaloneGeofence(payload).subscribe(
        (res: any) => {
          this.isSubmitting = false;
          this.modalRef.close();
          this.appService.openSnackBar('Geofence created successfully!', 'Success');

          // Refresh geofence list
          this.fetchGeofence2Data();
        },
        (err) => {
          console.error('Error creating geofence:', err);
          this.isSubmitting = false;
          this.appService.openSnackBar(err?.error?.message || 'Failed to create geofence', 'Error');
        }
      )
    );
  }

  private normalizeVinOption(item: any): VinOption | null {
    if (!item) {
      return null;
    }

    if (typeof item === 'string') {
      const vin = item.trim();
      return vin ? { vin, alias: vin, checked: false, isMapped: false } : null;
    }

    const vinValue = item.vin || item.VIN || item.vinId || item.id;
    if (!vinValue) {
      return null;
    }

    const vin = String(vinValue).trim();
    if (!vin) {
      return null;
    }

    const aliasValue = item.alias || item.vinAlias || item.Alias || item.name || vin;
    return {
      vin,
      alias: String(aliasValue || vin),
      checked: false,
      isMapped: false
    };
  }

  private buildVinMappingPayload(vin: string, geofenceId: number): any {
    return {
      vin,
      geofenceId,
      startDateTime: new Date().toISOString(),
      endDateTime: this.mappingEndDateTime,
      expiryTime: this.mappingEndDateTime,
      alertRule: {
        emails: [this.userEmail],
        mobileNumbers: ['1234567890']
      }
    };
  }

  private updateMappingStatus(vin: string, status: VinMappingStatus, message: string = ''): void {
    const entry = this.mappingStatuses.find((item) => item.vin === vin);
    if (entry) {
      entry.status = status;
      entry.message = message;
    }
  }

  private setMappedVehicles(geofence: any): void {
    const mappedStatuses = this.extractMappedVehicles(geofence);
    this.mappingStatuses = mappedStatuses;
    this.mappedVinLookup = {};
    mappedStatuses.forEach((status) => {
      this.mappedVinLookup[status.vin.toUpperCase()] = status;
    });
  }

  private applyMappedVehicles(): void {
    if (!this.vinList.length) {
      return;
    }

    this.vinList.forEach((vin) => {
      const mapped = this.mappedVinLookup[vin.vin.toUpperCase()];
      if (mapped) {
        vin.checked = true;
        vin.isMapped = true;
        if (!mapped.alias || mapped.alias === mapped.vin) {
          mapped.alias = vin.alias || mapped.alias;
        }
      } else {
        vin.isMapped = false;
      }
    });
  }

  private getMappedStatusList(): VinMappingState[] {
    return Object.values(this.mappedVinLookup);
  }

  private extractMappedVehicles(geofence: any): VinMappingState[] {
    const mappedVehicles = Array.isArray(geofence?.mappedVehicles) ? geofence.mappedVehicles : [];
    const mappedStatuses: VinMappingState[] = [];
    const seen = new Set<string>();

    mappedVehicles.forEach((item: any) => {
      const normalized = this.normalizeVinOption(item);
      if (!normalized) {
        return;
      }

      const key = normalized.vin.toUpperCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      mappedStatuses.push({
        vin: normalized.vin,
        alias: normalized.alias,
        status: 'success',
        message: 'Already mapped'
      });
    });

    return mappedStatuses;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private fetchGeofenceVehicleStats(geofenceId: string | number): void {
    const range = this.ensureDateRange(geofenceId);
    const dateTimeRange = this.formatDateTimeRange(range);
    const statsState = this.getGeofenceStatsState(geofenceId);

    statsState.loading = true;
    statsState.error = '';

    this.subscription$.add(
      this._vehicleService.getGeofenceVehicleStatistics(
        Number(geofenceId),
        dateTimeRange.startDate,
        dateTimeRange.endDate
      ).subscribe(
        (res: any) => {
          const normalized = this.normalizeGeofenceStatsResponse(res, geofenceId);
          statsState.summary = normalized.summary;
          statsState.vehicles = normalized.vehicles;
          statsState.loading = false;
        },
        (err) => {
          console.error('Error fetching geofence vehicle stats:', err);
          statsState.loading = false;
          statsState.error = 'Failed to load statistics';
          statsState.vehicles = [];
          statsState.summary = this.getEmptySummary();
          this.appService.openSnackBar('Failed to load geofence statistics', 'Error');
        }
      )
    );
  }

  private fetchVinTimeline(geofenceId: string | number, vin: string): void {
    const range = this.ensureDateRange(geofenceId);
    const dateTimeRange = this.formatDateTimeRange(range);
    const vinState = this.getVinTimelineState(geofenceId, vin);

    vinState.loading = true;
    vinState.error = '';

    this.subscription$.add(
      this._vehicleService.getGeofenceEventsByVin(
        Number(geofenceId),
        vin,
        dateTimeRange.startDate,
        dateTimeRange.endDate,
        0,
        20
      ).subscribe(
        (res: any) => {
          vinState.events = this.normalizeVinTimelineEvents(res, geofenceId);
          vinState.loading = false;
        },
        (err) => {
          console.error('Error fetching VIN timeline:', err);
          vinState.loading = false;
          vinState.error = 'Failed to load timeline';
          vinState.events = [];
          this.appService.openSnackBar('Failed to load VIN timeline', 'Error');
        }
      )
    );
  }

  private normalizeGeofenceStatsResponse(response: any, geofenceId?: string | number): { summary: GeofenceStatsSummary; vehicles: GeofenceVehicleStatRow[] } {
    const rawVehicles = Array.isArray(response?.vehicles)
      ? response.vehicles
      : Array.isArray(response?.vehicleStatistics)
        ? response.vehicleStatistics
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

    const vehicles = rawVehicles
      .map((item: any) => {
        const vin = item?.vin || item?.VIN || item?.vehicleVin || item?.vinId || '';
        const vehicleName = item?.vehicleName || item?.alias || item?.name || item?.vehicleAlias || vin || '--';
        const entries = item?.numberOfEntries ?? item?.entries ?? item?.entryCount ?? item?.totalEntries ?? 0;
        const exits = item?.numberOfExits ?? item?.exits ?? item?.exitCount ?? item?.totalExits ?? 0;
        const durationValue = item?.totalDurationMinutes ?? item?.durationFormatted ?? item?.duration ?? item?.totalDuration ?? item?.durationInMinutes ?? item?.durationInSeconds ?? item?.durationSeconds;
        const lastEntryValue = item?.lastEntry ?? item?.lastEntryTime ?? item?.lastEntryTimestamp ?? item?.lastEntryDateTime;
        const lastExitValue = item?.lastExit ?? item?.lastExitTime ?? item?.lastExitTimestamp ?? item?.lastExitDateTime;
        const lastDurationValue = item?.lastDurationMinutes ?? item?.lastDurationFormatted ?? item?.lastDuration ?? item?.lastDurationSeconds;
        const status = item?.currentStatus || item?.status || item?.state || '';

        if (!vin && !vehicleName) {
          return null;
        }

        return {
          vehicleName,
          vin,
          entries,
          exits,
          duration: this.formatDuration(durationValue),
          lastEntry: this.formatDateTime(lastEntryValue, geofenceId),
          lastExit: this.formatDateTime(lastExitValue, geofenceId),
          lastDuration: this.formatDuration(lastDurationValue),
          status
        } as GeofenceVehicleStatRow;
      })
      .filter((item: GeofenceVehicleStatRow | null) => item !== null) as GeofenceVehicleStatRow[];

    const summarySource = response?.summary || response?.kpis || {};
    const totalVehicles = summarySource?.totalVehicles ?? response?.totalVehicles ?? vehicles.length;
    const totalEntries = summarySource?.totalEntries ?? response?.totalEntries ?? this.sumField(vehicles, 'entries');
    const totalExits = summarySource?.totalExits ?? response?.totalExits ?? this.sumField(vehicles, 'exits');
    const vehiclesInside = summarySource?.vehiclesInside ?? response?.vehiclesInside ?? vehicles.filter((item) => this.isInsideStatus(item.status)).length;
    const avgDurationValue = summarySource?.avgDuration ?? summarySource?.averageDuration ?? response?.avgDuration ?? response?.averageDuration;
    const avgDuration = avgDurationValue ? this.formatDuration(avgDurationValue) : '--';

    return {
      summary: {
        totalVehicles,
        totalEntries,
        totalExits,
        vehiclesInside,
        avgDuration
      },
      vehicles
    };
  }

  private normalizeVinTimelineEvents(response: any, geofenceId?: string | number): VinTimelineEvent[] {
    // Handle new events-combined API response with 'visits' array
    const events = Array.isArray(response?.visits)
      ? response.visits
      : Array.isArray(response?.events)
        ? response.events
        : Array.isArray(response?.eventTimeline)
          ? response.eventTimeline
          : Array.isArray(response?.vehicleEvents)
            ? response.vehicleEvents
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : Array.isArray(response?.vehicleStatistics?.[0]?.events)
                  ? response.vehicleStatistics[0].events
                  : [];

    const normalized = events.map((event: any) => {
      // Handle new API response format with status field
      const eventType = (event?.status || event?.eventType || event?.type || '').toString().toUpperCase();
      const isOngoing = event?.isOngoing === true || event?.status === 'ONGOING';
      const rawTimestamp = event?.timestamp ?? event?.eventTime ?? event?.time;
      const entryRaw = event?.entryTimestamp ?? event?.entryDateTime ?? event?.entryTime ?? event?.startTime ?? event?.inTime;
      const exitRaw = event?.exitTimestamp ?? event?.exitDateTime ?? event?.exitTime ?? event?.endTime ?? event?.outTime;

      let entrySource = entryRaw;
      let exitSource = exitRaw;

      if (!entrySource && rawTimestamp && eventType === 'IN') {
        entrySource = rawTimestamp;
      }
      if (!exitSource && rawTimestamp && eventType === 'OUT') {
        exitSource = rawTimestamp;
      }

      const entryTime = this.formatDateTime(entrySource, geofenceId);
      const exitTime = this.formatDateTime(exitSource, geofenceId);
      // Use durationFormatted first, then durationColonFormat, then fallback to other fields
      const durationValue = event?.durationFormatted ?? event?.durationColonFormat ?? event?.duration ?? event?.durationMinutes ?? event?.durationSeconds ?? event?.totalDurationMinutes;
      const sortValue = this.getDateValue(entrySource ?? exitSource ?? rawTimestamp);
      const notes = event?.notes ?? null;
      const odometerReading = event?.odometerReading ?? 'N/A';
      const fuelLevelGallons = event?.fuelLevelGallons ?? 'N/A';

      return {
        eventType,
        entryTime,
        exitTime,
        duration: this.formatDuration(durationValue),
        isOngoing,
        isLatest: false,
        notes,
        odometerReading,
        fuelLevelGallons,
        _sortValue: sortValue
      };
    });

    let latestSortValue = 0;
    normalized.forEach((item: any) => {
      if (item._sortValue > latestSortValue) {
        latestSortValue = item._sortValue;
      }
    });

    if (latestSortValue > 0) {
      normalized.forEach((item: any) => {
        item.isLatest = item._sortValue === latestSortValue;
      });
    } else if (normalized.length > 0) {
      normalized[normalized.length - 1].isLatest = true;
    }

    return normalized.map((item: any) => ({
      eventType: item.eventType,
      entryTime: item.entryTime,
      exitTime: item.exitTime,
      duration: item.duration,
      isOngoing: item.isOngoing,
      isLatest: item.isLatest,
      notes: item.notes,
      odometerReading: item.odometerReading,
      fuelLevelGallons: item.fuelLevelGallons
    }));
  }

  private getDateValue(value: any): number {
    if (!value) {
      return 0;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }

    const fallback = this.parseDateValue(value);
    return fallback ? fallback.getTime() : 0;
  }

  private sumField(items: GeofenceVehicleStatRow[], key: 'entries' | 'exits'): number {
    return items.reduce((acc, item) => {
      const value = Number(item[key]);
      return acc + (Number.isNaN(value) ? 0 : value);
    }, 0);
  }

  private formatDuration(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '--';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return '--';
      }
      if (trimmed.match(/[a-zA-Z]/) || trimmed.includes(':')) {
        return trimmed;
      }
      const asNumber = Number(trimmed);
      if (!Number.isNaN(asNumber)) {
        return this.formatDurationFromSeconds(this.normalizeDurationToSeconds(asNumber));
      }
      return trimmed;
    }

    if (typeof value === 'number') {
      return this.formatDurationFromSeconds(this.normalizeDurationToSeconds(value));
    }

    return String(value);
  }

  private normalizeDurationToSeconds(value: number): number {
    if (value > 1000000) {
      return Math.round(value / 1000);
    }
    if (value > 86400) {
      return Math.round(value);
    }
    if (value > 1440) {
      return Math.round(value * 60);
    }
    return Math.round(value * 60);
  }

  private formatDurationFromSeconds(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds < 0) {
      return '--';
    }

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private formatDateTime(value: any, geofenceId?: string | number): string {
    if (!value) {
      return '--';
    }

    const parsed = this.parseDateValue(value);
    if (!parsed) {
      return String(value);
    }

    // If geofenceId is provided, use the stored timezone data
    if (geofenceId && this.geofenceTimeZones[geofenceId.toString()]) {
      const timezoneData = this.geofenceTimeZones[geofenceId.toString()];
      const timestamp = parsed.getTime();
      return this.convertToLocalTime(timestamp, timezoneData);
    }

    // Fallback to browser timezone with timezone abbreviation
    const formattedDate = parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const timeZoneAbbr = parsed.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
    return `${formattedDate} (${timeZoneAbbr})`;
  }

  private parseDateValue(value: any): Date | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    if (typeof value === 'string') {
      const parts = value.split('-').map((part) => Number(part));
      if (parts.length >= 3 && parts.every((part) => !Number.isNaN(part))) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }

    return null;
  }

  private ensureDateRange(geofenceId: string | number): DateRangeState {
    if (!this.geofenceDateRanges[geofenceId]) {
      const currentRange = this.getCurrentMonthRange();
      this.geofenceDateRanges[geofenceId] = {
        startDate: currentRange.startDate,
        endDate: currentRange.endDate,
        label: 'Showing statistics for Current Month',
        isCurrentMonth: true
      };
    }
    return this.geofenceDateRanges[geofenceId];
  }

  private getCurrentMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: this.formatDateInput(startDate),
      endDate: this.formatDateInput(endDate)
    };
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private updateDateRangeLabel(range: DateRangeState): void {
    if (!range.startDate || !range.endDate) {
      range.label = 'Showing statistics for Custom Range';
      range.isCurrentMonth = false;
      return;
    }

    const isCurrentMonth = this.isCurrentMonthRange(range.startDate, range.endDate);
    range.isCurrentMonth = isCurrentMonth;
    if (isCurrentMonth) {
      range.label = 'Showing statistics for Current Month';
      return;
    }

    range.label = `Showing statistics for ${this.formatDateLabel(range.startDate)} - ${this.formatDateLabel(range.endDate)}`;
  }

  private isCurrentMonthRange(startDate: string, endDate: string): boolean {
    const currentRange = this.getCurrentMonthRange();
    return startDate === currentRange.startDate && endDate === currentRange.endDate;
  }

  private formatDateLabel(value: string): string {
    const parsed = this.parseDateValue(value);
    if (!parsed) {
      return value;
    }

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private getEmptySummary(): GeofenceStatsSummary {
    return {
      totalVehicles: 0,
      totalEntries: 0,
      totalExits: 0,
      vehiclesInside: 0,
      avgDuration: '--'
    };
  }

  isInsideStatus(status: string): boolean {
    const normalized = (status || '').toString().toUpperCase();
    return normalized === 'INSIDE' || normalized === 'IN';
  }

  private getGeofenceId(geofence: any): string | number | null {
    return geofence?.geofenceId ?? geofence?.id ?? geofence?.geofenceID ?? null;
  }

  private formatDateTimeRange(range: DateRangeState): { startDate: string; endDate: string } {
    return {
      startDate: this.toLocalDateTime(range.startDate, false),
      endDate: this.toLocalDateTime(range.endDate, true)
    };
  }

  private toLocalDateTime(value: string, isEnd: boolean): string {
    if (!value) {
      return '';
    }

    if (value.includes('T')) {
      return value;
    }

    return `${value}T${isEnd ? '23:59:59' : '00:00:00'}`;
  }

  private getLoggedInEmail(): string {
    const storedUser = sessionStorage.getItem('Useremail');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const email = parsed?.email || parsed?.emailId || parsed?.username;
        if (email) {
          return email;
        }
      } catch (err) {
        console.error('Error parsing Useremail from session storage:', err);
      }
    }

    const emailId = sessionStorage.getItem('emailid');
    if (emailId) {
      try {
        return JSON.parse(emailId);
      } catch (err) {
        return emailId;
      }
    }

    return '';
  }
}
