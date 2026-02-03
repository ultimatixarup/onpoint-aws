import { Component, OnInit,HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { RouteOptimzeService } from '../../../route-optimize.service';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
declare var bootstrap: any;

@Component({
  selector: 'app-tracking-live-trip',
  templateUrl: './tracking-live-trip.component.html',
  styleUrls: ['./tracking-live-trip.component.scss']
})
export class TrackingLiveTripComponent implements OnInit {
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
  tripStatuses: { name: string, value: string }[] = [
    { name: 'UNDER PLANNED', value: 'UNDER_PLANNED' },
    { name: 'Planned Trip', value: 'DRIVER_ASSOCIATED' },
    { name: 'IN PROGRESS', value: 'IN_PROGRESS' },
    { name: 'COMPLETED', value: 'COMPLETE' },
    // Add more statuses as needed
  ];
    // Fleet filter state
    fleetList: any[] = [];
    fleetIdData: number | string | null = null;
    user: string = '';
    customConsumer: string = '';
    fleetIdValueNew: string = '';
    selectedFleetDisplay: string = '';

   availableDrivers = [
    { id: 1, name: 'John Doe', vehicle_name: 'Toyota Corolla' },
    { id: 2, name: 'Jane Smith', vehicle_name: 'Honda Civic' },
    { id: 3, name: 'Michael Johnson', vehicle_name: 'Ford Focus' },
    { id: 4, name: 'Emily Davis', vehicle_name: 'Chevrolet Malibu' },
    { id: 5, name: 'David Martinez', vehicle_name: 'Nissan Altima' }
];
  constructor(
    private router: Router,
    private routeOptimzeService: RouteOptimzeService,
    private calendar: NgbCalendar,
    private dashboardservice: TaxonomyService,
  ) {}

  ngOnInit(): void {
    this.showRole();
    this.fetchTrips(this.pageNumber, this.pageSize);
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
      status: 'IN_PROGRESS',
      fromDate: this.fromDate ?
        `${this.fromDate.year}-${String(this.fromDate.month).padStart(2, '0')}-${String(this.fromDate.day).padStart(2, '0')}T00:00:00`
        : null,
      toDate: this.toDate ?
        `${this.toDate.year}-${String(this.toDate.month).padStart(2, '0')}-${String(this.toDate.day).padStart(2, '0')}T23:59:59`
        : null,
      fleetId: this.fleetIdData || null,
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
  // Load fleet list
  loadFleets(consumer?: string | null): void {
    this.dashboardservice.getFleetList(consumer ?? null).subscribe(
      (res: any) => {
        if (Array.isArray(res)) {
          this.fleetList = res.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
        } else {
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

  selectFleetId(): void {
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  clearFleetSelection(): void {
    this.fleetIdData = null;
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
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
    if (this.tripToDelete !== null) {
      this.routeOptimzeService.deleteTrip(this.tripToDelete).subscribe(
        response => {
          console.log('Trip deleted successfully:', response);
          this.tripToDelete = null; // Reset after deletion

          // Use Bootstrap's Modal API to properly hide the modal
          const modalElement = document.getElementById('deleteConfirmModal');
          if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
              modalInstance.hide();
            }
          }

          // Force Bootstrap to clean up any leftover modals or backdrops
          document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.remove(); // Clean up any leftover backdrops
          });
          document.body.classList.remove('modal-open'); // Remove any classes that Bootstrap adds
          this.fetchTrips(this.pageNumber, this.pageSize);
          // Navigate to the trip planning page after deletion
          this.router.navigate(['adlp/admin/admindashboard/trip-planning']).then(() => {

          });
        },
        error => {
          console.error('Error deleting trip:', error);
        }
      );
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
    this.fetchTrips(this.pageNumber, this.pageSize);
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
}
