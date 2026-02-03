import { Component, OnInit,HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { RouteOptimzeService } from '../../route-optimize.service';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-trip-planning',
  templateUrl: './trip-planning.component.html',
  styleUrls: ['./trip-planning.component.scss']
})
export class TripPlanningComponent implements OnInit {
  loading: boolean = false;
   selectedDate: any;
  isDatePickerVisible = false;
  trips: any[] = [];
  tripStatus: string;
  tripName: string = '';
  selectedStatus: string | null = null;
  pageSize: number = 10;
  pageNumber: number = 1;
  totalPages: number = 5;
  pages: any[] = [];
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  tripToDelete: number | null = null;
  isCardOpen: boolean = false;
  selectedPeriod: any;
  selectedOption: string = 'customRange';
  timePeriods = [
    { label: 'Today', value: 'today' },
    { label: 'Current Week', value: 'weekly' },
    { label: 'Current Month', value: 'monthly' },
    { label: 'Previous Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'customRange' },
  ];
  tripStatuses: { name: string, value: string }[] = [
    { name: 'UNDER PLANNED', value: 'UNDER_PLANNED' },
    { name: 'PLANNED TRIP', value: 'DRIVER_ASSOCIATED' },
    // { name: 'IN PROGRESS', value: 'IN_PROGRESS' }

    // Add more statuses as needed
  ];

   availableDrivers = [
    { id: 1, name: 'John Doe', vehicle_name: 'Toyota Corolla' },
    { id: 2, name: 'Jane Smith', vehicle_name: 'Honda Civic' },
    { id: 3, name: 'Michael Johnson', vehicle_name: 'Ford Focus' },
    { id: 4, name: 'Emily Davis', vehicle_name: 'Chevrolet Malibu' },
    { id: 5, name: 'David Martinez', vehicle_name: 'Nissan Altima' }
];
  // --- Template bindings for consumer/fleet/group filters (added as safe defaults) ---
  user: string = '';
  searchByConsumer: string = '';
  customConsumer: string = '';
  consumerList: any[] = [];
  fleetIdValueNew: string = '';
  fleetList: any[] = [];
  fleetIdData: string | number | null = null;
  groupList: any[] = [];
  groupIdData: string | number | null = null;
  selectedFleetDisplay: string = '';

  // Minimal handlers used by the template. They trigger a trip refresh — replace with real logic as needed.
  selectFleetId(): void {
    // update displayed fleet id label
    const f = this.fleetList.find((x: any) => x.id === this.fleetIdData);
    this.fleetIdValueNew = f ? `${f.id}` : '';
    this.pageNumber = 1;
    // Group selection disabled: directly refresh trips on fleet change
    this.groupList = [];
    this.groupIdData = null;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  // Flatten nested groups into a flat list (preserves hierarchy level if needed)
  flattenGroups(groups: any[], level: number = 0): any[] {
    let flatList: any[] = [];
    for (const group of groups) {
      flatList.push({
        id: group.id,
        name: group.name,
        parentGroupId: group.parentGroupId ?? 0,
        level: level
      });

      if (group.subgroups && group.subgroups.length > 0) {
        flatList = flatList.concat(this.flattenGroups(group.subgroups, level + 1));
      }
    }

    return flatList;
  }

  clearFleetSelection(): void {
    this.fleetIdData = null;
    this.fleetIdValueNew = '';
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  onGroupIdChange(event: any): void {
    // event may be the selected id or the full object depending on ng-select configuration
    this.groupIdData = typeof event === 'object' ? event?.id ?? event : event;
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }
  constructor(
    private router: Router,
    private routeOptimzeService: RouteOptimzeService,
    private calendar: NgbCalendar,
    private toastr: ToastrService,
    private dashboardservice: TaxonomyService,
  ) {}

  ngOnInit(): void {
    this.showRole();
    this.fetchTrips(this.pageNumber, this.pageSize);
    // populate fleet list for the fleet filter
    this.loadFleets();
  }

  showRole(): void {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if(this.user === 'role_user_fleet'){
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew
    }
  }

  /**
   * Load fleet list for the fleet select control.
   * If you want to filter by consumer, pass the consumer name as argument.
   */
  loadFleets(consumer?: string | null): void {
    this.dashboardservice.getFleetList(consumer ?? null).subscribe(
      (res: any) => {
        if (Array.isArray(res)) {
          this.fleetList = res.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
        } else {
          // some endpoints return an object with `data` key
          const list = (res && (res.data || res.items)) ? (res.data || res.items) : [];
          this.fleetList = Array.isArray(list) ? list.sort((a: any, b: any) => (a.id || 0) - (b.id || 0)) : [];
        }
      },
      (err) => {
        console.error('Error loading fleet list', err);
        this.fleetList = [];
      }
    );
  }
  getDriverName(driverId: number | null, tripId: number): string {
    if (driverId === null) {
      return 'No Driver Assigned';
    }

    const driver = this.availableDrivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  }
  getVehicleName(driverId: number ): string {
    if (driverId === null) {
      return 'No Vehicle Assigned';
    }

    const driver = this.availableDrivers.find(d => d.id === driverId);
    return driver ? driver.vehicle_name : 'NA';
  }

  fetchTrips(page: number, size: number): void {
    this.loading = true;
    const filters = {
      tripName: this.tripName || null,
      status: this.selectedStatus || null,
      fromDate: this.fromDate ?
        `${this.fromDate.year}-${String(this.fromDate.month).padStart(2, '0')}-${String(this.fromDate.day).padStart(2, '0')}T00:00:00`
        : null,
      toDate: this.toDate ?
        `${this.toDate.year}-${String(this.toDate.month).padStart(2, '0')}-${String(this.toDate.day).padStart(2, '0')}T23:59:59`
        : null,
      fleetId: this.fleetIdData || null,
      // groupId removed per request (group filter disabled)
    };
    this.routeOptimzeService.fetchTrips(page - 1, size, filters).subscribe(
      (response) => {
        console.log(response);
        this.trips = response.content || [];
        this.totalPages = response.totalPages;
        console.log(this.totalPages);
        this.getPagination(this.pageNumber);
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching trips:', error);
        this.loading = false;
      }
    );
  }
  formatStatus(status: string): string {
    if (status === 'DRIVER_ASSOCIATED') {
      return 'Planned Trip';
    }

    return status
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split the string into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(' '); // Join the words back into a string
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = (event.target as HTMLElement).closest('.datepicker-container');
    if (!clickedInside && this.isDatePickerVisible) {
      this.isDatePickerVisible = false;
    }
  }
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
      this.fetchTrips(page, this.pageSize);
      this.scrollToTop();
    }
  }

  selectPage(size: number): void {
    this.pageSize = size;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  scrollToTop(): void {
    const breadcrumbElement = document.querySelector('.page-content');
    if (breadcrumbElement) {
      breadcrumbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
   // Set the trip ID for deletion
   setTripToDelete(tripId: number, tripStatus:string) {
    this.tripToDelete = tripId;
    this.tripStatus=this.formatStatus(tripStatus);
  }


  confirmDelete() {
    if (this.tripToDelete != null) {
      this.routeOptimzeService.deleteTrip(this.tripToDelete).subscribe(
        response => {
          console.log('Trip deleted successfully:', response);
          this.tripToDelete = null; // Reset after deletion

          // Hide the delete confirmation modal using Angular ViewChild instead of direct DOM manipulation
          this.hideModal('deleteConfirmModal');

          // Show a success notification
          this.toastr.success('Trip deleted successfully!', 'Success');

          // Refresh trips
          this.fetchTrips(this.pageNumber, this.pageSize);
        },
        error => {
          let errorMessage = 'Failed to delete trip. Please try again.';
          this.hideModal('deleteConfirmModal');
          // Check for specific API error messages
          if (error.error && error.error.apierror) {
            errorMessage = error.error.apierror.message || errorMessage;
          }

          // Show the error message using Toastr
          this.toastr.error(errorMessage, 'Error');

          // Refresh trips even if there was an error
          this.fetchTrips(this.pageNumber, this.pageSize);
        }
      );
    }
  }

  // Helper method to hide modal using Angular's Renderer2 or a better approach
  hideModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }



  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
    } else {
      this.toDate = null;
      this.fromDate = date;
    }

    // Only fetch trips if both fromDate and toDate are selected
    if (this.fromDate && this.toDate) {
      this.fetchTrips(this.pageNumber, this.pageSize);
    }
  }



  isHovered(date: NgbDate) {
    return (
      this.fromDate &&
      !this.toDate &&
      this.hoveredDate &&
      date.after(this.fromDate) &&
      date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }
  toggleDatePicker() {
    this.isDatePickerVisible = !this.isDatePickerVisible;
  }

  clearDateRange() {
    this.fromDate = null;
    this.toDate = null;
    this.hoveredDate = null;
    this.isDatePickerVisible = false;
    this.pageNumber = 1; // Reset to first page
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  dateRangeLabel(): string {
    if (this.fromDate && this.toDate) {
      return `${this.fromDate.day}/${this.fromDate.month}/${this.fromDate.year} - ${this.toDate.day}/${this.toDate.month}/${this.toDate.year}`;
    } else if (this.fromDate) {
      return `${this.fromDate.day}/${this.fromDate.month}/${this.fromDate.year}`;
    } else {
      return 'Pick trip date';
    }
  }

  findTripDetails() {
    console.log('findeTripDeatils');
    if (this.tripName && this.tripName.length > 0) {
      this.pageNumber = 1; // Reset to first page when searching
      this.fetchTrips(this.pageNumber, this.pageSize);
    }
  }
  findTripDetailsOnChange() {
    console.log('findeTrip');
    if (this.tripName.length === 0) {
      this.pageNumber = 1; // Reset to first page when clearing search
      this.fetchTrips(this.pageNumber, this.pageSize);
    }
  }
  onStatusChange() {
    console.log('Selected Status:', this.selectedStatus);
    console.log('d');
    this.fetchTrips(this.pageNumber, this.pageSize);
    // You can add additional logic here, such as making API calls based on the selected status
  }
  submitDate() {
    // Add logic to submit the selected date
    console.log('Selected Date:', this.selectedDate);
    this.isDatePickerVisible = false;
  }
  cancelDatePicker() {
    this.selectedDate = null;
    this.isDatePickerVisible = false;
  }
  getTotalStops(deliveryLocations: any): number {
    if (!deliveryLocations) {
      return 0;
    }

    let totalStops = deliveryLocations.length;
    const startLocation = deliveryLocations.find(loc => loc.type === 'START');
    const endLocation = deliveryLocations.find(loc => loc.type === 'END');

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

  closeCard() {
    this.isCardOpen = false;
  }

  handleOption(option: string): void {
    this.selectedOption = option;
    this.selectedPeriod = this.timePeriods.find(period => period.value === option)?.value || '';
    this.onTimePeriodChange(this.selectedPeriod);
  }

  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {
    const parseDate = (dateStr: string): NgbDate => {
      const date = new Date(dateStr);
      return new NgbDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    };

    this.fromDate = parseDate(dateRange.fromDate);
    this.toDate = parseDate(dateRange.toDate);
    this.selectedPeriod = 'customRange';
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  onTimePeriodChange(selectedPeriod: string): void {
    if (selectedPeriod === 'customRange') {
      this.isCardOpen = true;
      return;
    }

    this.isCardOpen = false;
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch(selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'lastmonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default:
        this.fromDate = null;
        this.toDate = null;
        this.pageNumber = 1;
        this.fetchTrips(this.pageNumber, this.pageSize);
        return;
    }

    this.fromDate = new NgbDate(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());
    this.toDate = new NgbDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate());
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }
}
