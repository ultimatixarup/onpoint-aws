import { Component, Input, OnInit, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaxonomyService } from '../../../../taxonomy.service';
import { HttpClient } from '@angular/common/http';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';

interface VinSummaryRow {
  vehicleName: string;
  vin: string;
  entries: number;
  exits: number;
  duration: string;
  lastEntry: string;
  lastExit: string;
  lastDuration: string;
  status: string;
  _expanded?: boolean;
}

interface VinDetailEvent {
  eventType: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  isOngoing?: boolean;
  status?: string;
  odometerReading?: string;
  fuelLevelGallons?: string;
  notes?: string;
}

interface VinTimelineState {
  loading: boolean;
  events: VinDetailEvent[];
}

interface GeofenceData {
  geofenceId: string | number;
  timeZone?: string;
  timeZoneId?: string;
  timeZoneName?: string;
  rawOffset?: number;
  dstOffset?: number;
  latitude?: number;
  longitude?: number;
}

@Component({
  selector: 'app-geofence-vin-report',
  templateUrl: './geofence-vin-report.component.html',
  styleUrls: ['./geofence-vin-report.component.scss']
})
export class GeofenceVinReportComponent implements OnInit, OnChanges {
  @Input() geofenceId: string | number;
  @Input() geofenceName: string = '';
  @Input() startDate?: string;
  @Input() endDate?: string;
  @Input() geofenceData?: GeofenceData;
  @Input() fleetId?: string; // Optional fleetId input

  vinSummaryRows: VinSummaryRow[] = [];
  vinTimelineStates: Map<string, VinTimelineState> = new Map();
  isLoadingSummary: boolean = false;

  // Geofence selection
  geofenceList: any[] = [];
  isLoadingGeofences: boolean = false;
  showGeofenceSelector: boolean = false;

  // Timezone data storage
  private geofenceTimezones: Map<string | number, any> = new Map();

  // Time period filter properties
  selectedPeriod: any;
  selectedOption: string = 'customRange';
  isCardOpen: boolean = false;
  timePeriods = [
    { label: 'Today', value: 'today' },
    { label: 'Current Week', value: 'weekly' },
    { label: 'Current Month', value: 'monthly' },
    { label: 'Previous Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'customRange' },
  ];

  // Date filter properties (matching trip history)
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;

  constructor(
    private taxonomyService: TaxonomyService,
    private http: HttpClient,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for route parameters first (query params take priority)
    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);

      // Always read from query params if available (overrides @Input)
      if (params['geofenceId']) {
        this.geofenceId = params['geofenceId'];
        console.log('GeofenceId from query params:', this.geofenceId);
      }
      if (params['geofenceName']) {
        this.geofenceName = params['geofenceName'];
      }
      if (params['startDate']) {
        this.startDate = params['startDate'];
      }
      if (params['endDate']) {
        this.endDate = params['endDate'];
      }
      if (params['fleetId']) {
        this.fleetId = params['fleetId'];
      }

      // Store timezone information from query params
      if (this.geofenceId && (params['timeZone'] || params['latitude'])) {
        const timezoneInfo = {
          timeZone: params['timeZone'],
          timeZoneId: params['timeZoneId'],
          timeZoneName: params['timeZoneName'],
          rawOffset: params['rawOffset'] ? parseInt(params['rawOffset'], 10) : undefined,
          dstOffset: params['dstOffset'] ? parseInt(params['dstOffset'], 10) : undefined,
          latitude: params['latitude'] ? parseFloat(params['latitude']) : undefined,
          longitude: params['longitude'] ? parseFloat(params['longitude']) : undefined
        };
        this.geofenceTimezones.set(this.geofenceId, timezoneInfo);
        console.log('Timezone info stored for geofenceId:', this.geofenceId);
        console.log('Timezone data:', timezoneInfo);
        console.log('All timezones in map:', Array.from(this.geofenceTimezones.entries()));
      } else {
        console.log('No timezone data found in params. GeofenceId:', this.geofenceId);
        console.log('Params received:', params);
      }

      // If no geofenceId provided, show geofence selector
      if (!this.geofenceId) {
        console.log('No geofenceId found, showing selector');
        this.showGeofenceSelector = true;
        this.loadGeofenceList();
      } else {
        console.log('Loading geofence report for ID:', this.geofenceId);
        this.showGeofenceSelector = false;

        // Initialize with monthly as default if not set
        if (!this.selectedPeriod) {
          this.selectedPeriod = 'monthly';
        }

        this.loadGeofenceReport();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geofenceId'] || changes['startDate'] || changes['endDate']) {
      if (this.geofenceId) {
        this.loadGeofenceReport();
      }
    }

    // Store timezone data when geofenceData changes
    if (changes['geofenceData'] && this.geofenceData) {
      this.storeGeofenceTimezone(this.geofenceData);
    }
  }

  private storeGeofenceTimezone(data: GeofenceData): void {
    if (!data.geofenceId) return;

    const timezoneInfo = {
      timeZone: data.timeZone,
      timeZoneId: data.timeZoneId,
      timeZoneName: data.timeZoneName,
      rawOffset: data.rawOffset,
      dstOffset: data.dstOffset,
      latitude: data.latitude,
      longitude: data.longitude
    };

    this.geofenceTimezones.set(data.geofenceId, timezoneInfo);
  }

  loadGeofenceList(): void {
    if (!this.fleetId) {
      // Try to get fleetId from localStorage or default
      const storedFleetId = localStorage.getItem('fleetId') || '100224';
      this.fleetId = storedFleetId;
    }

    this.isLoadingGeofences = true;
    this.taxonomyService.getStandaloneGeofences(this.fleetId)
      .subscribe({
        next: (response) => {
          this.geofenceList = Array.isArray(response) ? response : [];
          this.isLoadingGeofences = false;
        },
        error: (err) => {
          console.error('Error loading geofence list:', err);
          this.geofenceList = [];
          this.isLoadingGeofences = false;
        }
      });
  }

  onGeofenceSelect(geofence: any): void {
    this.geofenceId = geofence.geofenceId || geofence.id;
    this.geofenceName = geofence.geofenceName || geofence.name;

    // Store timezone data if available
    if (geofence.timeZone || geofence.centerLatitude) {
      const geofenceData: GeofenceData = {
        geofenceId: this.geofenceId,
        timeZone: geofence.timeZone,
        timeZoneId: geofence.timeZoneId,
        timeZoneName: geofence.timeZoneName,
        rawOffset: geofence.rawOffset,
        dstOffset: geofence.dstOffset,
        latitude: geofence.centerLatitude || geofence.latitude,
        longitude: geofence.centerLongitude || geofence.longitude
      };
      this.storeGeofenceTimezone(geofenceData);
    }

    this.showGeofenceSelector = false;
    this.loadGeofenceReport();
  }

  clearGeofenceSelection(): void {
    this.geofenceId = null;
    this.geofenceName = '';
    this.vinSummaryRows = [];
    this.vinTimelineStates.clear();
    this.showGeofenceSelector = true;
  }

  navigateToGeofenceList(): void {
    this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/geofence2']);
  }

  loadGeofenceReport(): void {
    console.log('loadGeofenceReport called with:', {
      geofenceId: this.geofenceId,
      startDate: this.startDate,
      endDate: this.endDate,
      selectedPeriod: this.selectedPeriod,
      fromDate: this.fromDate,
      toDate: this.toDate
    });

    if (!this.geofenceId) {
      console.error('Cannot load report: geofenceId is missing');
      return;
    }

    // First, fetch geofence details to get timezone if not already available
    if (!this.geofenceTimezones.has(this.geofenceId)) {
      console.log('Fetching geofence details to get timezone...');
      this.fetchGeofenceTimezone(this.geofenceId);
    }

    this.isLoadingSummary = true;
    this.vinSummaryRows = [];

    // Calculate date range based on selected period
    // Use UTC to avoid timezone conversion issues when sending to API
    let apiStartDate: string;
    let apiEndDate: string;

    switch (this.selectedPeriod) {
      case 'today':
        apiStartDate = moment.utc().startOf('day').format('YYYY-MM-DDTHH:mm:ss');
        apiEndDate = moment.utc().endOf('day').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'weekly':
        apiStartDate = moment.utc().startOf('week').format('YYYY-MM-DDTHH:mm:ss');
        apiEndDate = moment.utc().endOf('week').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'monthly':
        apiStartDate = moment.utc().startOf('month').format('YYYY-MM-DDTHH:mm:ss');
        apiEndDate = moment.utc().endOf('month').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'lastmonth':
        apiStartDate = moment.utc().subtract(1, 'month').startOf('month').format('YYYY-MM-DDTHH:mm:ss');
        apiEndDate = moment.utc().subtract(1, 'month').endOf('month').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'customRange':
        // Custom range will be set through date picker
        if (this.fromDate && this.toDate) {
          apiStartDate = moment.utc(this.convertNgbDateToMoment(this.fromDate)).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
          apiEndDate = moment.utc(this.convertNgbDateToMoment(this.toDate)).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
        } else {
          // Fallback to query params or default
          apiStartDate = this.startDate || moment.utc().startOf('week').format('YYYY-MM-DDTHH:mm:ss');
          apiEndDate = this.endDate || moment.utc().endOf('week').format('YYYY-MM-DDTHH:mm:ss');
        }
        break;
      default:
        // Default to query params or current week
        apiStartDate = this.startDate || moment.utc().startOf('week').format('YYYY-MM-DDTHH:mm:ss');
        apiEndDate = this.endDate || moment.utc().endOf('week').format('YYYY-MM-DDTHH:mm:ss');
        break;
    }

    const geofenceIdNum = typeof this.geofenceId === 'string' ? parseInt(this.geofenceId, 10) : this.geofenceId;

    console.log('Calling getGeofenceVehicleStatistics with:', {
      geofenceId: geofenceIdNum,
      startDate: apiStartDate,
      endDate: apiEndDate
    });

    this.taxonomyService.getGeofenceVehicleStatistics(geofenceIdNum, apiStartDate, apiEndDate)
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);

          // Extract timezone from response if available
          if (response?.timeZone) {
            const timezoneInfo = {
              timeZone: response.timeZone,
              timeZoneId: response.timeZoneId,
              timeZoneName: response.timeZoneName
            };
            this.geofenceTimezones.set(this.geofenceId!, timezoneInfo);
            console.log('Timezone extracted from API response:', timezoneInfo);
          }

          this.vinSummaryRows = this.normalizeGeofenceStatsResponse(response);
          console.log('Normalized data:', this.vinSummaryRows);
          this.isLoadingSummary = false;
        },
        error: (err) => {
          console.error('Error loading geofence report:', err);
          this.isLoadingSummary = false;
        }
      });
  }

  // Convert NgbDateStruct to moment for date formatting
  convertNgbDateToMoment(date: NgbDateStruct): moment.Moment {
    return moment([date.year, date.month - 1, date.day]);
  }

  private fetchGeofenceTimezone(geofenceId: string | number): void {
    if (!this.fleetId) {
      this.fleetId = localStorage.getItem('fleetId') || '100224';
    }

    console.log('Fetching geofence list to get timezone for geofenceId:', geofenceId);

    this.taxonomyService.getStandaloneGeofences(this.fleetId).subscribe({
      next: (geofences: any[]) => {
        console.log('Geofences received:', geofences);
        const geofence = geofences.find((g: any) =>
          (g.geofenceId || g.id) == geofenceId
        );

        if (geofence) {
          console.log('Found matching geofence:', geofence);
          const latitude = geofence.centerLatitude || geofence.latitude;
          const longitude = geofence.centerLongitude || geofence.longitude;

          // If lat/long available, fetch timezone from Google API
          if (latitude && longitude) {
            this.fetchTimezoneFromGoogle(geofenceId, latitude, longitude);
          } else {
            // Fallback to stored timezone data
            const timezoneInfo = {
              timeZone: geofence.timeZone,
              timeZoneId: geofence.timeZoneId,
              timeZoneName: geofence.timeZoneName,
              rawOffset: geofence.rawOffset,
              dstOffset: geofence.dstOffset,
              latitude: latitude,
              longitude: longitude
            };
            this.geofenceTimezones.set(geofenceId, timezoneInfo);
            console.log('Timezone info stored from geofence list:', timezoneInfo);
          }
        } else {
          console.warn('Geofence not found in list');
        }
      },
      error: (err) => {
        console.error('Error fetching geofence timezone:', err);
      }
    });
  }

  private fetchTimezoneFromGoogle(geofenceId: string | number, latitude: number, longitude: number): void {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiKey = 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw';
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${apiKey}`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'OK' && data.timeZoneId) {
          const timezoneInfo = {
            timeZone: data.timeZoneId,
            timeZoneId: data.timeZoneId,
            timeZoneName: data.timeZoneName,
            rawOffset: data.rawOffset,
            dstOffset: data.dstOffset,
            latitude: latitude,
            longitude: longitude
          };
          this.geofenceTimezones.set(geofenceId, timezoneInfo);
          console.log('Timezone fetched from Google API:', timezoneInfo);

          // Refresh the display with new timezone
          if (this.vinSummaryRows.length > 0) {
            this.vinSummaryRows = this.normalizeGeofenceStatsResponse({ vehicles: this.vinSummaryRows });
          }
        } else {
          console.error('Failed to fetch timezone from Google:', data.status);
        }
      })
      .catch(error => {
        console.error('Error fetching timezone from Google:', error);
      });
  }

  private normalizeGeofenceStatsResponse(response: any): VinSummaryRow[] {
    const vehicles = Array.isArray(response?.vehicles)
      ? response.vehicles
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.vehicleStatistics)
          ? response.vehicleStatistics
          : Array.isArray(response)
            ? response
            : [];

    return vehicles.map((vehicle: any) => {
      // Handle different duration field names
      const durationValue = vehicle?.totalDuration
        ?? vehicle?.duration
        ?? vehicle?.totalDurationMinutes;

      const lastDurationValue = vehicle?.lastDuration
        ?? vehicle?.lastVisitDuration
        ?? vehicle?.lastDurationMinutes;

      return {
        vehicleName: vehicle?.vehicleName ?? vehicle?.name ?? vehicle?.vehicleAlias ?? 'Unknown Vehicle',
        vin: vehicle?.vin ?? vehicle?.vehicleVin ?? '--',
        entries: vehicle?.entries ?? vehicle?.totalEntries ?? vehicle?.numberOfEntries ?? vehicle?.inCount ?? 0,
        exits: vehicle?.exits ?? vehicle?.totalExits ?? vehicle?.numberOfExits ?? vehicle?.outCount ?? 0,
        duration: this.formatDuration(durationValue),
        lastEntry: this.formatDateTime(
          vehicle?.lastEntry ?? vehicle?.lastEntryTime ?? vehicle?.lastEntryDateTime,
          this.geofenceId
        ),
        lastExit: this.formatDateTime(
          vehicle?.lastExit ?? vehicle?.lastExitTime ?? vehicle?.lastExitDateTime,
          this.geofenceId
        ),
        lastDuration: this.formatDuration(lastDurationValue),
        status: (vehicle?.status ?? vehicle?.currentStatus ?? 'OUTSIDE').toString().toUpperCase(),
        _expanded: false
      };
    });
  }

  toggleVinDetails(vinRow: VinSummaryRow): void {
    // Navigate to separate timeline page instead of expanding inline
    this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/geofence-vin-timeline'], {
      queryParams: {
        geofenceId: this.geofenceId,
        geofenceName: this.geofenceName,
        vin: vinRow.vin,
        vehicleName: vinRow.vehicleName,
        startDate: this.startDate,
        endDate: this.endDate
      }
    });
  }

  isVinExpanded(vin: string): boolean {
    const row = this.vinSummaryRows.find(r => r.vin === vin);
    return row?._expanded || false;
  }

  getVinTimelineState(vin: string): VinTimelineState {
    if (!this.vinTimelineStates.has(vin)) {
      this.vinTimelineStates.set(vin, { loading: false, events: [] });
    }
    return this.vinTimelineStates.get(vin)!;
  }

  private loadVinTimeline(vin: string): void {
    const state: VinTimelineState = { loading: true, events: [] };
    this.vinTimelineStates.set(vin, state);

    const params: any = {};
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    const geofenceIdNum = typeof this.geofenceId === 'string' ? parseInt(this.geofenceId, 10) : this.geofenceId;

    this.taxonomyService.getGeofenceEventsByVin(geofenceIdNum, vin, params.startDate, params.endDate)
      .subscribe({
        next: (response) => {
          state.events = this.normalizeVinTimelineEvents(response);
          state.loading = false;
        },
        error: (err) => {
          console.error('Error loading VIN timeline:', err);
          state.loading = false;
        }
      });
  }

  private normalizeVinTimelineEvents(response: any): VinDetailEvent[] {
    // Handle new events-combined API response structure with 'visits' array
    const events = Array.isArray(response?.visits)
      ? response.visits
      : Array.isArray(response?.events)
        ? response.events
        : Array.isArray(response?.eventTimeline)
          ? response.eventTimeline
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

    return events.map((event: any) => {
      // Handle new events-combined structure
      const isOngoing = event?.isOngoing === true;
      const status = (event?.status || '').toString().toUpperCase();
      const eventType = status === 'ONGOING' ? 'ONGOING' : (event?.eventType || event?.type || status || 'IN').toString().toUpperCase();

      const entryRaw = event?.entryTimestamp ?? event?.entryDateTime ?? event?.entryTime ?? event?.startTime;
      const exitRaw = event?.exitTimestamp ?? event?.exitDateTime ?? event?.exitTime ?? event?.endTime;

      const entryTime = this.formatDateTime(entryRaw, this.geofenceId);
      const exitTime = this.formatDateTime(exitRaw, this.geofenceId);

      // Use durationFormatted from events-combined API, fallback to other formats
      const durationValue = event?.durationFormatted ?? event?.duration ?? event?.durationMinutes ?? event?.durationSeconds;

      return {
        eventType,
        entryTime,
        exitTime,
        duration: this.formatDuration(durationValue),
        isOngoing,
        status: status || eventType,
        odometerReading: event?.odometerReading ?? 'N/A',
        fuelLevelGallons: event?.fuelLevelGallons ?? 'N/A',
        notes: event?.notes ?? ''
      };
    });
  }

  isInsideStatus(status: string): boolean {
    if (!status) return false;
    const upperStatus = status.toString().toUpperCase();
    return upperStatus === 'IN' || upperStatus === 'INSIDE' || upperStatus === 'ONGOING';
  }

  // Date/Time Formatting with Timezone Support
  private formatDateTime(value: any, geofenceId?: string | number): string {
    if (value === null || value === undefined || value === '') {
      return '--';
    }

    console.log('formatDateTime called with:', { value, geofenceId, hasTimezone: this.geofenceTimezones.has(geofenceId!) });

    // Parse as UTC timestamp (API returns UTC)
    // Add 'Z' to indicate UTC if not already present
    const utcDateString = typeof value === 'string' && !value.endsWith('Z') ? `${value}Z` : value;

    // Priority 1: Use geofence timezone data if available
    if (geofenceId && this.geofenceTimezones.has(geofenceId)) {
      const tzInfo = this.geofenceTimezones.get(geofenceId);
      console.log('Using timezone info:', tzInfo);
      if (tzInfo?.timeZone) {
        try {
          const dateObj = new Date(utcDateString);
          if (!isNaN(dateObj.getTime())) {
            const formatted = dateObj.toLocaleString('en-US', {
              timeZone: tzInfo.timeZone,
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            // Get timezone abbreviation dynamically
            const tzAbbr = this.getTimezoneAbbreviation(tzInfo.timeZone, dateObj);
            const result = `${formatted} (${tzAbbr})`;
            console.log('Formatted with timezone:', result);
            return result;
          }
        } catch (err) {
          console.warn('Error formatting with geofence timezone:', err);
        }
      }
    } else {
      console.log('No timezone data available for geofenceId:', geofenceId);
    }

    // Fallback: Use browser timezone with abbreviation
    try {
      const dateObj = new Date(utcDateString);
      if (!isNaN(dateObj.getTime())) {
        const formatted = dateObj.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Get browser timezone abbreviation
        const tzAbbr = this.getBrowserTimezoneAbbreviation(dateObj);
        return `${formatted} (${tzAbbr})`;
      }
    } catch (err) {
      console.warn('Error formatting datetime:', err);
    }

    return String(value);
  }

  private getTimezoneAbbreviation(timeZone: string, date?: Date): string {
    try {
      // Try to get dynamic abbreviation using Intl
      if (date) {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: timeZone,
          timeZoneName: 'short'
        };
        const formatted = new Intl.DateTimeFormat('en-US', options).format(date);
        const match = formatted.match(/\b([A-Z]{3,5})\b/);
        if (match) {
          return match[1];
        }
      }
    } catch (err) {
      console.warn('Error getting dynamic timezone abbreviation:', err);
    }

    // Fallback to static map
    const tzMap: { [key: string]: string } = {
      'America/Los_Angeles': 'PST',
      'America/Denver': 'MST',
      'America/Chicago': 'CST',
      'America/New_York': 'EST',
      'America/Phoenix': 'MST',
      'America/Anchorage': 'AKST',
      'Pacific/Honolulu': 'HST',
      'UTC': 'UTC',
      'Europe/London': 'GMT',
      'Europe/Paris': 'CET',
      'Asia/Tokyo': 'JST',
      'Asia/Shanghai': 'CST',
      'Australia/Sydney': 'AEDT'
    };
    return tzMap[timeZone] || 'UTC';
  }

  private getBrowserTimezoneAbbreviation(date: Date): string {
    try {
      const formatted = date.toLocaleString('en-US', { timeZoneName: 'short' });
      const match = formatted.match(/\b([A-Z]{3,5})\b/);
      if (match) {
        return match[1];
      }
    } catch (err) {
      console.warn('Error getting browser timezone abbreviation:', err);
    }
    return 'UTC';
  }

  private formatDuration(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '--';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '--';
      // If already formatted (contains letters or colons), return as-is
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
    // Assume if value > 10000, it's in seconds; otherwise in minutes
    return value > 10000 ? value : value * 60;
  }

  private formatDurationFromSeconds(totalSeconds: number): string {
    if (totalSeconds <= 0) return '--';

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(' ');
  }

  // Time period dropdown change handler
  onTimePeriodChange(selectedPeriod: string): void {
    console.log('Selected period:', selectedPeriod);
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
      this.loadGeofenceReport();
    }
  }

  // Handle modal close
  closeCard(): void {
    this.isCardOpen = false;
  }

  // Handle option selection in modal
  handleOption(option: string): void {
    this.selectedOption = option;
    this.selectedPeriod = this.timePeriods.find(period => period.value === option)?.value || '';

    if (option !== 'customRange') {
      this.closeCard();
      this.loadGeofenceReport();
    }
  }

  // Handle custom date range selection from calendar
  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {
    console.log('Date range selected:', dateRange);

    // Convert string dates to NgbDateStruct
    if (dateRange.fromDate) {
      const fromMoment = moment(dateRange.fromDate);
      this.fromDate = {
        year: fromMoment.year(),
        month: fromMoment.month() + 1,
        day: fromMoment.date()
      };
    }

    if (dateRange.toDate) {
      const toMoment = moment(dateRange.toDate);
      this.toDate = {
        year: toMoment.year(),
        month: toMoment.month() + 1,
        day: toMoment.date()
      };
    }

    this.closeCard();
    this.loadGeofenceReport();
  }
}
