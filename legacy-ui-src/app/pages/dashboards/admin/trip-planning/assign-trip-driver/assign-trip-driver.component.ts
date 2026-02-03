import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { RouteOptimzeService } from '../../../route-optimize.service';
import { TaxonomyService } from '../../../taxonomy.service';
import { ToastrService } from 'ngx-toastr';





interface Driver {
  id: number;
  name: string;
}

interface Trip {
  id: number;
  name: string;
  details: string;
  assignedDriver?: Driver;
}

@Component({
  selector: 'app-assign-trip-driver',
  templateUrl: './assign-trip-driver.component.html',
  styleUrls: ['./assign-trip-driver.component.scss']
})
export class AssignTripDriverComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  plannedTrips: Trip[] = [];
  availableDrivers: Driver[] = [];
  tripDetailId!: string ;
  selectedVinId!: any; // Holds the selected driver ID
  availableVin: any[] = []; // List of available VINs
  user: any;
  fleetList: any;
  searchByConsumer: any;
  fleetIdData: any = null;
  tripData:any = null;
  tripId:any
  tripStartDate:any; //
  fleetIdValueNew: string = '';
  isFleetUser: boolean = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private routeOptimizeService: RouteOptimzeService,
    private _vehicleService: TaxonomyService ,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {

    const tripID = this.route.snapshot.paramMap.get('tripDetailId');
    this.tripId =tripID
    if ( this.tripId) {
      //this.spinner.show();
      this.getUserRole();
      this.selectConsumerFleetId();

      this.fetchTripData(this.tripId);
    } else {
      console.error('Trip Detail ID is missing from the route.');
    }

    // Initialize with mock data
    this.availableDrivers = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Michael Johnson' },
      { id: 4, name: 'Emily Davis' },
      { id: 5, name: 'David Martinez' }
    ];
  }

  getUserRole(): void {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    console.log('User role:', this.user);
    if(this.user === 'role_user_fleet'){
      this.isFleetUser = true;
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;
      console.log('Fleet user detected. Fleet ID:', this.fleetIdData);
    }
  }

  tripFinalSubmit(): void {
    if (!this.tripId || !this.selectedVinId) {
      console.error('Trip ID or Driver ID is missing');
      return;
    }

  console.log(this.selectedVinId);
    this.routeOptimizeService.associateVin(this.tripId, this.selectedVinId).subscribe(
      response => {
       this.spinner.show();
       this.toastr.success('VIN successfully assigned to the trip!', 'Success');
        this.router.navigate(['adlp/admin/admindashboard/trip-planning/planning']);
      },
      error => {
        this.spinner.hide();
        if (error.error && error.error.apierror) {
          const apiError = error.error.apierror;
          this.toastr.error(apiError.message, 'Error');
        } else {
          this.toastr.error('Failed to create trip. Please try again.', 'Error');
        }
      }
    );
  }
  selectConsumerFleetId() {
    this.subscription$.add(
      this._vehicleService.getFleetList(this.searchByConsumer).subscribe((res: any) => {
        this.fleetList = res
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })

        // If fleet user and trip data is already loaded, auto-select fleet and load VINs
        if(this.isFleetUser && this.fleetIdData && this.tripStartDate) {
          this.selectFleetId(this.fleetIdData);
        }
      }, err => { })
    )
  }
  fetchTripData(tripDetailId: string): void {
    console.log('Fetching trip data for ID:', tripDetailId);
    this.routeOptimizeService.getTripData(tripDetailId).subscribe(
      data => {
        this.tripData = data;
        this.tripStartDate = this.formatToDateOnly(this.tripData.tripStartDateTime);
        console.log('Trip data loaded. Trip start date:', this.tripStartDate);

        // If fleet user, auto-load VINs after trip data is fetched
        if(this.isFleetUser && this.fleetIdData) {
          console.log('Auto-loading VINs for fleet user with fleet ID:', this.fleetIdData);
          this.selectFleetId(this.fleetIdData);
        }
      },
      error => {
        console.error('Error fetching trip data:', error);
        this.spinner.hide();
      }
    );
  }
  selectFleetId(fleetId: any): void {
    // Handle both direct fleetId and event from ng-select
    // ng-select passes the selected value directly, not an event object
    const selectedFleetId = fleetId;

    if (!selectedFleetId) {
      console.warn('No Fleet ID provided. Resetting available VIN list.');
      this.availableVin = []; // Clear the list if no Fleet ID is selected
      return;
    }

    // Convert to number for API call
    const fleetIdNumber = typeof selectedFleetId === 'string' ? parseInt(selectedFleetId, 10) : selectedFleetId;

    if (!this.tripStartDate) {
      console.warn('Trip start date not available yet. VINs will be loaded after trip data is fetched.');
      return;
    }

    console.log('Loading VINs for fleet:', fleetIdNumber, 'and trip date:', this.tripStartDate);

    this.routeOptimizeService.getVINListByFleet(fleetIdNumber, this.tripStartDate).subscribe(
      (response: any[]) => {
        console.log('Fleet Data:', response);
        this.availableVin = response;
        console.log('Available VINs loaded:', this.availableVin.length);
      },
      (error) => {
        console.error('Error fetching available VINs:', error);
        this.availableVin = []; // Clear the list on error
      }
    );
  }
  formatToDateOnly(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  clearFleetSelection() {

  }

}
