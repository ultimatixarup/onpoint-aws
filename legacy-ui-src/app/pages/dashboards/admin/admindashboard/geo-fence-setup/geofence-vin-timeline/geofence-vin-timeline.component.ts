import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaxonomyService } from '../../../../taxonomy.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import moment from 'moment';

interface VinTimelineEvent {
  eventType: string;          // IN or OUT
  tripId?: string;            // Trip ID
  timestamp: string;          // Main event timestamp (formatted)
  rawTimestamp?: string;      // Raw timestamp for timezone conversion
  pairedTimestamp?: string;   // Paired event timestamp (formatted)
  rawPairedTimestamp?: string; // Raw paired timestamp
  duration: string;           // Formatted duration
  odometerReading?: string;   // Odometer reading
  fuelLevelPercent?: number;  // Fuel level percentage
  vehicleHealth?: string;     // Good or Not Good
  status: string;             // Inside, Outside, Inside (Ongoing), etc.
  isOngoing: boolean;         // Whether event is ongoing
  latitude?: number;
  longitude?: number;
  notes?: string;
  // Additional health data from API
  overallHealth?: string;     // ORANGE, GREEN, RED
  healthReason?: string;
  tirePressures?: {
    frontRight?: number;
    frontLeft?: number;
    rearLeft?: number;
    rearRight?: number;
  };
  recommendedTirePressure?: number;
  fuelLevel?: number;         // Actual fuel value
  fuelLevelUnit?: string;     // 'perc' or 'gal'
  odometerUnit?: string;      // 'miles' or 'km'
  batteryVoltage?: number;    // Battery voltage if available
  batteryLevel?: number;      // Battery level from API
  milesDriven?: string;       // Miles driven during the event
}

@Component({
  selector: 'app-geofence-vin-timeline',
  templateUrl: './geofence-vin-timeline.component.html',
  styleUrls: ['./geofence-vin-timeline.component.scss']
})
export class GeofenceVinTimelineComponent implements OnInit {
  geofenceId: string | number;
  geofenceName: string = '';
  vin: string = '';
  vehicleName: string = '';
  startDate?: string;
  endDate?: string;

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

  // Date filter properties
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;

  timelineEvents: VinTimelineEvent[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  // Health status options
  healthStatusOptions = [
    { label: 'Normal', value: 'GREEN' },
    { label: 'Warning', value: 'ORANGE' },
    { label: 'Critical', value: 'RED' }
  ];

  // Timezone conversion properties
  geofenceLatitude?: number;
  geofenceLongitude?: number;
  geofenceTimezone?: string;

  // Vehicle health modal properties
  showHealthModal: boolean = false;
  healthDetails = {
    odometerReading: '',
    batteryLevel: '',
    tirePressure: {
      FR: '',
      FL: '',
      RL: '',
      RR: ''
    },
    fuelLevel: '',
    overallHealth: '',
    healthReason: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taxonomyService: TaxonomyService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.geofenceId = params['geofenceId'];
      this.geofenceName = params['geofenceName'] || '';
      this.vin = params['vin'] || '';
      this.vehicleName = params['vehicleName'] || '';
      this.startDate = params['startDate'];
      this.endDate = params['endDate'];

      // Initialize with monthly as default
      if (!this.selectedPeriod) {
        this.selectedPeriod = 'monthly';
      }

      if (this.geofenceId && this.vin) {
        this.loadTimelineData();
      }
    });
  }

  loadTimelineData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const geofenceIdNum = typeof this.geofenceId === 'string'
      ? parseInt(this.geofenceId, 10)
      : this.geofenceId;

    // Calculate date range based on selected period
    // Use UTC to avoid timezone conversion issues when sending to API
    let useStartDate: string;
    let useEndDate: string;

    switch (this.selectedPeriod) {
      case 'today':
        useStartDate = moment.utc().startOf('day').format('YYYY-MM-DDTHH:mm:ss');
        useEndDate = moment.utc().endOf('day').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'weekly':
        useStartDate = moment.utc().startOf('week').format('YYYY-MM-DDTHH:mm:ss');
        useEndDate = moment.utc().endOf('week').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'monthly':
        useStartDate = moment.utc().startOf('month').format('YYYY-MM-DDTHH:mm:ss');
        useEndDate = moment.utc().endOf('month').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'lastmonth':
        useStartDate = moment.utc().subtract(1, 'month').startOf('month').format('YYYY-MM-DDTHH:mm:ss');
        useEndDate = moment.utc().subtract(1, 'month').endOf('month').format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'customRange':
        // Custom range will be set through date picker
        if (this.fromDate && this.toDate) {
          useStartDate = moment.utc(this.convertNgbDateToMoment(this.fromDate)).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
          useEndDate = moment.utc(this.convertNgbDateToMoment(this.toDate)).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
        } else {
          // Fallback to query params or default
          useStartDate = this.startDate || moment.utc().startOf('week').format('YYYY-MM-DDTHH:mm:ss');
          useEndDate = this.endDate || moment.utc().endOf('week').format('YYYY-MM-DDTHH:mm:ss');
        }
        break;
      default:
        // Default to query params or current week
        useStartDate = this.startDate || moment.utc().startOf('week').format('YYYY-MM-DDTHH:mm:ss');
        useEndDate = this.endDate || moment.utc().endOf('week').format('YYYY-MM-DDTHH:mm:ss');
        break;
    }

    console.log('Loading timeline data for:', {
      geofenceId: geofenceIdNum,
      vin: this.vin,
      startDate: useStartDate,
      endDate: useEndDate
    });

    this.taxonomyService.getGeofenceEventsByVin(
      geofenceIdNum,
      this.vin,
      useStartDate,
      useEndDate
    ).subscribe({
      next: (response: any) => {
        console.log('Timeline API response:', response);
        this.timelineEvents = this.normalizeTimelineResponse(response);
        console.log('Normalized events:', this.timelineEvents);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading VIN timeline:', err);
        this.errorMessage = 'Failed to load timeline data';
        this.isLoading = false;
      }
    });
  }

  // Convert NgbDateStruct to moment format (YYYY-MM-DD)
  convertNgbDateToMoment(date: NgbDateStruct): string {
    return moment(`${date.year}-${date.month}-${date.day}`, 'YYYY-M-D').format('YYYY-MM-DD');
  }

  private normalizeTimelineResponse(response: any): VinTimelineEvent[] {
    // Handle different API response structures
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

    console.log('Extracted events array:', events);

    if (events.length === 0) {
      console.warn('No events found in response');
      return [];
    }

    // Check if this is IN/OUT event format (new API response)
    const hasEventType = events.some((e: any) => e?.eventType !== undefined);

    if (hasEventType) {
      // New format: IN/OUT events with paired timestamps
      return this.normalizeInOutEvents(events);
    }

    // Old format: Visit-based events - convert to new format
    return events.map((event: any) => {
      const isOngoing = event?.isOngoing === true;
      const status = (event?.status || '').toString().toUpperCase();
      const eventType = status === 'ONGOING' ? 'IN' : (event?.eventType || event?.type || status || 'IN').toString().toUpperCase();

      const entryRaw = event?.entryTimestamp ?? event?.entryDateTime ?? event?.entryTime ?? event?.startTime;
      const exitRaw = event?.exitTimestamp ?? event?.exitDateTime ?? event?.exitTime ?? event?.endTime;

      const durationValue = event?.durationFormatted ?? event?.duration ?? event?.durationMinutes ?? event?.durationSeconds;

      return {
        eventType: eventType,
        timestamp: this.formatDateTime(entryRaw),
        pairedTimestamp: exitRaw ? this.formatDateTime(exitRaw) : undefined,
        duration: this.formatDuration(durationValue),
        status: isOngoing ? `${eventType} (Ongoing)` : eventType,
        isOngoing: isOngoing,
        notes: event?.notes ?? ''
      };
    });
  }

  private normalizeInOutEvents(events: any[]): VinTimelineEvent[] {
    const timeline: VinTimelineEvent[] = [];

    // Get geofence location from first event (all events should be at same geofence)
    if (events.length > 0 && events[0].latitude && events[0].longitude) {
      if (!this.geofenceLatitude || !this.geofenceLongitude) {
        this.geofenceLatitude = events[0].latitude;
        this.geofenceLongitude = events[0].longitude;
        // Fetch timezone for this location
        this.fetchTimezoneForLocation(this.geofenceLatitude, this.geofenceLongitude);
      }
    }

    // Process all events (both IN and OUT)
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventType = event.eventType?.toUpperCase();
      const isOngoing = event.isOngoing === true;
      const timestamp = event.timestamp;
      const pairedTimestamp = event.pairedEventTimestamp;
      const duration = event.durationFormatted || this.formatDurationFromSeconds(event.durationSeconds);

      let status = '';
      if (eventType === 'IN') {
        status = isOngoing ? 'Inside (Ongoing)' : 'Inside';
      } else if (eventType === 'OUT') {
        status = isOngoing ? 'Outside (Ongoing)' : 'Outside';
      }

      // Extract odometer and fuel level
      const odometerReading = event.odometerReading || event.odometer;
      const fuelLevel = event.fuelLevelPercent || event.fuelLevel;

      // Extract and format miles driven to 1 decimal place
      const milesDriven = event.milesDriven !== undefined && event.milesDriven !== null
        ? parseFloat(event.milesDriven).toFixed(1)
        : '--';

      // Determine vehicle health based on available data
      let vehicleHealth = 'Good';
      if (event.vehicleHealth) {
        vehicleHealth = event.vehicleHealth;
      } else if (event.alertString || event.alerts) {
        vehicleHealth = 'Not Good';
      } else if (fuelLevel && fuelLevel < 10) {
        vehicleHealth = 'Not Good';
      }

      // Get overall health from API - check if all tire pressures are zero
      let overallHealth = event.overallHealth;
      if (event.tirePressures) {
        const allTiresZero =
          event.tirePressures.frontRight === 0 &&
          event.tirePressures.frontLeft === 0 &&
          event.tirePressures.rearLeft === 0 &&
          event.tirePressures.rearRight === 0;

        // If all tires are zero, set health to GREEN (Normal)
        if (allTiresZero) {
          overallHealth = 'GREEN';
        }
      }

      timeline.push({
        eventType: eventType,
        tripId: event.tripId || event.trip_id,
        timestamp: this.formatDateTime(timestamp),
        rawTimestamp: timestamp,
        pairedTimestamp: pairedTimestamp ? this.formatDateTime(pairedTimestamp) : undefined,
        rawPairedTimestamp: pairedTimestamp,
        duration: duration,
        milesDriven: milesDriven,
        odometerReading: odometerReading ? parseFloat(odometerReading).toFixed(1) : undefined,
        fuelLevelPercent: fuelLevel,
        vehicleHealth: vehicleHealth,
        status: status,
        isOngoing: isOngoing,
        latitude: event.latitude,
        longitude: event.longitude,
        notes: event.alertString || event.notes || '',
        // Include additional health data from API
        overallHealth: overallHealth,
        healthReason: event.healthReason,
        tirePressures: event.tirePressures,
        recommendedTirePressure: event.recommendedTirePressure,
        fuelLevel: event.fuelLevel,
        fuelLevelUnit: event.fuelLevelUnit,
        odometerUnit: event.odometerUnit,
        batteryVoltage: event.batteryVoltage,
        batteryLevel: event.batteryLevel
      });
    }

    return timeline;
  }

  private formatDurationFromSeconds(seconds: number): string {
    if (!seconds || seconds <= 0) return '--';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 && parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ') || '--';
  }

  private formatDateTime(dateTime: string): string {
    if (!dateTime) return '--';
    try {
      // Parse as UTC timestamp (API returns UTC)
      // Add 'Z' to indicate UTC if not already present
      const utcDateString = dateTime.endsWith('Z') ? dateTime : `${dateTime}Z`;
      const date = new Date(utcDateString);

      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateTime);
        return dateTime;
      }

      // If we have a timezone, format with that timezone and abbreviation
      if (this.geofenceTimezone) {
        const formatted = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: this.geofenceTimezone
        });

        // Get timezone abbreviation
        const tzAbbr = this.getTimezoneAbbreviation(this.geofenceTimezone, date);
        return `${formatted} (${tzAbbr})`;
      }

      // Otherwise use default formatting with browser timezone
      const formatted = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Get browser timezone abbreviation
      const tzAbbr = this.getBrowserTimezoneAbbreviation(date);
      return `${formatted} (${tzAbbr})`;
    } catch (err) {
      console.error('Error formatting date:', dateTime, err);
      return dateTime;
    }
  }

  private getTimezoneAbbreviation(timeZone: string, date: Date): string {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timeZone,
        timeZoneName: 'short'
      };
      const formatted = new Intl.DateTimeFormat('en-US', options).format(date);
      const match = formatted.match(/\b([A-Z]{3,5})\b/);
      if (match) {
        return match[1];
      }
    } catch (err) {
      console.warn('Error getting timezone abbreviation:', err);
    }
    return timeZone;
  }

  private getBrowserTimezoneAbbreviation(date: Date): string {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZoneName: 'short'
      };
      const formatted = new Intl.DateTimeFormat('en-US', options).format(date);
      const match = formatted.match(/\b([A-Z]{3,5})\b/);
      if (match) {
        return match[1];
      }
    } catch (err) {
      console.warn('Error getting browser timezone abbreviation:', err);
    }

    // Fallback: try to get from date string
    const dateString = date.toString();
    const tzMatch = dateString.match(/\(([^)]+)\)$/);
    if (tzMatch) {
      // Extract abbreviation from timezone name
      const tzName = tzMatch[1];
      const words = tzName.split(' ');
      if (words.length > 1) {
        return words.map(w => w[0]).join('');
      }
      return tzName;
    }

    return 'Local';
  }

  // Fetch timezone for geofence location using Google Time Zone API
  private fetchTimezoneForLocation(latitude: number, longitude: number): void {
    const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const apiKey = 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw'; // Your Google API key
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=${apiKey}`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'OK' && data.timeZoneId) {
          this.geofenceTimezone = data.timeZoneId;
          console.log('Geofence timezone:', this.geofenceTimezone);

          // Reformat all timestamps with the correct timezone
          this.timelineEvents = this.timelineEvents.map(event => ({
            ...event,
            timestamp: event.rawTimestamp ? this.formatDateTime(event.rawTimestamp) : event.timestamp,
            pairedTimestamp: event.rawPairedTimestamp ? this.formatDateTime(event.rawPairedTimestamp) : event.pairedTimestamp
          }));
        } else {
          console.error('Failed to fetch timezone:', data.status);
        }
      })
      .catch(error => {
        console.error('Error fetching timezone:', error);
      });
  }
  private formatDuration(duration: any): string {
    if (!duration) return '--';

    // If already formatted as string (e.g., "2d 3h 45m"), return as is
    if (typeof duration === 'string' && duration.includes('d') || duration.includes('h')) {
      return duration;
    }

    // Convert to minutes if it's a number
    const mins = typeof duration === 'string' ? parseFloat(duration) : duration;

    if (isNaN(mins)) return '--';

    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    const remainingMins = Math.floor(mins % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${remainingMins}m`;
    } else if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    } else {
      return `${remainingMins}m`;
    }
  }

  isInsideStatus(eventType: string): boolean {
    if (!eventType) return false;
    const type = eventType.toUpperCase();
    return type === 'IN' || type.includes('INSIDE') || type.includes('ENTRY');
  }

  // Get health status label from value
  getHealthStatusLabel(status?: string): string {
    if (!status) return 'Unknown';
    const statusUpper = status.toUpperCase();
    const option = this.healthStatusOptions.find(opt => opt.value === statusUpper);
    return option ? option.label : status;
  }

  // Get health status class for styling
  getHealthStatusClass(status?: string): string {
    if (!status) return 'health-unknown';
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'GREEN':
        return 'health-normal';
      case 'ORANGE':
        return 'health-warning';
      case 'RED':
        return 'health-critical';
      default:
        return 'health-unknown';
    }
  }

  openVehicleHealthPopup(event: VinTimelineEvent): void {
    // Get fuel level in percentage
    let fuelLevelPercent = 'N/A';
    if (event.fuelLevel !== undefined && event.fuelLevel !== null) {
      if (event.fuelLevelUnit === 'perc') {
        // Use percentage as-is
        fuelLevelPercent = event.fuelLevel.toFixed(1);
      } else if (event.fuelLevelUnit === 'gal') {
        // Convert gallons to percentage (assuming 15 gallon tank)
        const tankCapacity = 15;
        fuelLevelPercent = ((event.fuelLevel / tankCapacity) * 100).toFixed(1);
      } else {
        fuelLevelPercent = event.fuelLevel.toString();
      }
    }

    // Get odometer reading
    let odometerValue = event.odometerReading || 'N/A';

    // Get battery level - use batteryLevel from API response
    let batteryLevelValue = 'N/A';
    if (event.batteryLevel !== undefined && event.batteryLevel !== null) {
      batteryLevelValue = event.batteryLevel.toFixed(1);
    } else if (event.batteryVoltage !== undefined && event.batteryVoltage !== null) {
      // Fallback to batteryVoltage if batteryLevel not available
      batteryLevelValue = event.batteryVoltage.toFixed(1);
    }
    // else {
    //   // Generate mock data if not available
    //   batteryLevelValue = (Math.random() * 2.5 + 12).toFixed(1);
    // }

    // Get tire pressures
    let tirePressures = {
      FR: 'N/A',
      FL: 'N/A',
      RL: 'N/A',
      RR: 'N/A'
    };

    if (event.tirePressures) {
      tirePressures = {
        FR: event.tirePressures.frontRight && event.tirePressures.frontRight !== 0 ? event.tirePressures.frontRight.toString() : 'N/A',
        FL: event.tirePressures.frontLeft && event.tirePressures.frontLeft !== 0 ? event.tirePressures.frontLeft.toString() : 'N/A',
        RL: event.tirePressures.rearLeft && event.tirePressures.rearLeft !== 0 ? event.tirePressures.rearLeft.toString() : 'N/A',
        RR: event.tirePressures.rearRight && event.tirePressures.rearRight !== 0 ? event.tirePressures.rearRight.toString() : 'N/A'
      };
    } else {
      // Generate mock tire pressures if not available
      tirePressures = {
        FR: (Math.floor(Math.random() * 6 + 30)).toString(),
        FL: (Math.floor(Math.random() * 6 + 30)).toString(),
        RL: (Math.floor(Math.random() * 6 + 30)).toString(),
        RR: (Math.floor(Math.random() * 6 + 30)).toString()
      };
    }

    // Get overall health status - keep the original value (GREEN/ORANGE/RED)
    let overallHealth = event.overallHealth || event.vehicleHealth || 'Unknown';

    // Check if all tire pressures are zero
    if (event.tirePressures) {
      const allTiresZero =
        event.tirePressures.frontRight === 0 &&
        event.tirePressures.frontLeft === 0 &&
        event.tirePressures.rearLeft === 0 &&
        event.tirePressures.rearRight === 0;

      // If all tires are zero, set health to GREEN (Normal)
      if (allTiresZero) {
        overallHealth = 'GREEN';
      }
    }

    // Populate health details
    this.healthDetails = {
      odometerReading: odometerValue,
      batteryLevel: batteryLevelValue,
      tirePressure: tirePressures,
      fuelLevel: fuelLevelPercent,
      overallHealth: overallHealth,
      healthReason: event.healthReason || ''
    };

    this.showHealthModal = true;
  }

  closeHealthModal(): void {
    this.showHealthModal = false;
  }

  // Helper method to convert fuel percentage to gallons (assuming 15 gallon tank)
  private convertFuelPercentToGallons(fuelPercent?: number): string {
    if (fuelPercent === undefined || fuelPercent === null) return 'N/A';
    const tankCapacity = 15; // Default tank capacity in gallons
    const gallons = (fuelPercent / 100) * tankCapacity;
    return gallons.toFixed(1);
  }

  // Mock method to generate battery level (replace with actual API call if available)
  private generateMockBatteryLevel(): string {
    // Random voltage between 12.0V and 14.5V
    const voltage = (Math.random() * 2.5 + 12).toFixed(1);
    return voltage;
  }

  // Mock method to generate tire pressure (replace with actual API call if available)
  private generateMockTirePressure(): string {
    // Random pressure between 30 and 35 PSI
    const pressure = Math.floor(Math.random() * 6 + 30);
    return pressure.toString();
  }

  navigateBack(): void {
    this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/geofence-vin-report'], {
      queryParams: {
        geofenceId: this.geofenceId,
        geofenceName: this.geofenceName
      }
    });
  }

  // Time period dropdown change handler
  onTimePeriodChange(selectedPeriod: string): void {
    console.log('Selected period:', selectedPeriod);
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
      this.loadTimelineData();
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
      this.loadTimelineData();
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
    this.loadTimelineData();
  }
}
