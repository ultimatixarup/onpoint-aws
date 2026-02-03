import { HttpClient } from "@angular/common/http";
import { Component, ElementRef, OnInit, Renderer2, } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { AppService } from "src/app/app.service";
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription, of } from "rxjs";
import { NgxSpinnerService } from 'ngx-spinner';
import { FleetService, LocationTypeService, SelectedLocationService, SelectedPeriodService, TimePeriodService } from "src/app/core/services/users-role.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
  id: string;  // Add the id property
}

interface Vehicle {
  firstName: string;
  lastName: string;
  phoneNo: string;
  email: string;
  assignedVehicle?: string;
  vins: { id: number; vin: string; alias?: string; associatedStart: string; associatedEnd: string }[];
  available: boolean;
  id?: string;
  licenceNo?: string;
  expiryDate?: string;
  issueState?: string;
  fleet?: { id: number; name: string };
  consumer?: { id: number; name: string };
  status?: string;
  name?: string;
}

@Component({
  selector: 'app-driver-added',
  templateUrl: './driver-added.component.html',
  styleUrls: ['./driver-added.component.scss']
})
export class DriverAddedComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  fleetId: number = 0; // Assign a fleetId value
  consumer: any = "All";
  consumerList: {
    name: any; startDate: any; // Include the start date
  }[];
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetList: any;
  fleetIdData: string;
  fleetIdValueNew: any;
  vehicle_names: any[] = [];
  allDrivers: Vehicle[] = []; // Store all drivers for client-side filtering
  paginatedDrivers: Vehicle[] = []; // Drivers for current page

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;

  // Filter properties
  showUnassignedOnly: boolean = false;

  number: string = '42'; // Example number
  selectedVehicle: any;
  filteredVehicles: Vehicle[] = []; // Holds filtered vehicle data
  constructor(private modalService: NgbModal,private timePeriodService: TimePeriodService, private selectedLocationServiceData: SelectedLocationService, private selectedPeriodService: SelectedPeriodService, private fleetService: FleetService, public locationTypeService: LocationTypeService, private appService: AppService, private http: HttpClient, private elRef: ElementRef, private renderer: Renderer2, private router: Router, private _vehicleService: TaxonomyService,private spinner: NgxSpinnerService,private toastr: ToastrService) {
  }

  ngOnInit(): void {
    this.showRole();
    this.selectConsumers();
  }
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem("userRole"));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem("multiRole"));
    let customConsumers = JSON.stringify(
      sessionStorage.getItem("custom-consumer")
    );
    this.customConsumer = JSON.parse(customConsumers);
    console.log('User role:', this.user);
    console.log('Custom consumer:', this.customConsumer);

    if (this.user === "role_user_fleet") {
      let fleetId = JSON.stringify(sessionStorage.getItem("fleetUserId"));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;
      console.log('Fleet user detected. Fleet ID:', this.fleetIdData);
    }
  }



  selectedConsumer: { name: string, id: string }


  async selectConsumer() {
    if (this.consumer) {
      const consumerName = this.consumer.name;
      const consumerId = this.consumer.id;
      // You can now use both name and id as needed
    }
     else {
      console.log('No consumer selected');
    }
    this.getDriverData();
    this.selectConsumers();
  }

  onFleetIdChange() {
    console.log('Fleet ID changed to:', this.fleetIdData);
    this.fleetService.setFleetId(this.fleetIdData);
    // Apply client-side filtering instead of API call
    this.applyFleetFilter();
  }

  getDriverData(): void {
    this.spinner.show();
    console.log('Loading all drivers with their vehicle associations');

    // Always use consumer ID 877634
    const consumerId = '877634';

    console.log('Fetching data with consumerId:', consumerId);

    // Call driver API - it already includes vins array for each driver
    this._vehicleService.getAssignDrivers(consumerId, null).toPromise()
      .then((driversResp: any) => {
        console.log('Drivers API Response:', driversResp);

        // Get all drivers from driver API (handles paginated response)
        let allDriversList: any[] = [];
        if (Array.isArray(driversResp)) {
          allDriversList = driversResp;
        } else if (driversResp && Array.isArray(driversResp.content)) {
          allDriversList = driversResp.content;
        }

        console.log('Total drivers from API:', allDriversList.length);

        // Map drivers - vins array is already included in the response
        this.allDrivers = allDriversList.map((d: any) => {
          const firstName = (d.firstName || '').trim();
          const lastName = (d.lastName || '').trim();
          const name = [firstName, lastName].filter(Boolean).join(' ') || '—';

          // vins array is already in the response, just use it directly
          const vins = Array.isArray(d.vins) ? d.vins.map((v: any) => ({
            id: v.id || 0,
            vin: v.vin || '',
            alias: v.alias || '',
            associatedStart: v.associatedStart || '',
            associatedEnd: v.associatedEnd || ''
          })) : [];

          return {
            id: d.id,
            name,
            firstName: d.firstName ?? '',
            lastName: d.lastName ?? '',
            phoneNo: d.phoneNo ?? '',
            email: d.email ?? '',
            status: d.status ?? '',
            licenceNo: d.licenceNo ?? '',
            expiryDate: d.expiryDate ?? '',
            issueState: d.issueState ?? '',
            vins: vins,
            available: !!d.available,
            fleet: d.fleet || null,
            consumer: d.consumer || null
          };
        });

        console.log('Total drivers processed:', this.allDrivers.length);
        console.log('Drivers with vehicles:', this.allDrivers.filter(d => d.vins.length > 0).length);
        console.log('Drivers without vehicles (unassigned):', this.allDrivers.filter(d => d.vins.length === 0).length);
        console.log('Sample driver with vehicles:', this.allDrivers.find(d => d.vins.length > 0));
        console.log('Sample unassigned driver:', this.allDrivers.find(d => d.vins.length === 0));

        // Apply client-side fleet filter
        this.applyFleetFilter();
        this.spinner.hide();
      })
      .catch((error) => {
        console.error('Error loading driver data:', error);
        console.error('Error details:', error.message, error.status);
        this.allDrivers = [];
        this.vehicle_names = [];
        this.appService.openSnackBar('Failed to load driver data: ' + (error.message || 'Unknown error'), 'Error');
        this.spinner.hide();
      });
  }

  applyFleetFilter(): void {
    let filteredDrivers = [...this.allDrivers];

    // Apply fleet filter
    if (this.fleetIdData) {
      filteredDrivers = filteredDrivers.filter(driver =>
        driver.fleet && driver.fleet.id === parseInt(this.fleetIdData)
      );
      console.log(`Filtered to fleet ${this.fleetIdData}:`, filteredDrivers.length, 'drivers');
    } else {
      console.log('Showing all drivers:', filteredDrivers.length);
    }

    // Apply unassigned filter
    if (this.showUnassignedOnly) {
      filteredDrivers = filteredDrivers.filter(driver => this.isDriverUnassigned(driver));
      console.log(`Filtered to unassigned drivers:`, filteredDrivers.length, 'drivers');
    }

    this.vehicle_names = filteredDrivers;
    console.log('First driver sample:', this.vehicle_names[0]);

    // Reset to first page and update pagination
    this.currentPage = 0;
    this.updatePagination();
  }

  isDriverUnassigned(driver: Vehicle): boolean {
    return !driver.vins || driver.vins.length === 0;
  }

  getUnassignedCount(): number {
    if (!this.vehicle_names) return 0;
    return this.vehicle_names.filter(driver => this.isDriverUnassigned(driver)).length;
  }

  toggleFilter(filterType: 'all' | 'unassigned'): void {
    this.showUnassignedOnly = filterType === 'unassigned';
    console.log('Filter toggled to:', filterType);
    this.applyFleetFilter();
  }


  updatePagination(): void {
    // Calculate total pages
    this.totalPages = Math.ceil(this.vehicle_names.length / this.pageSize);

    // Get drivers for current page
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedDrivers = this.vehicle_names.slice(startIndex, endIndex);

    console.log(`Page ${this.currentPage + 1} of ${this.totalPages}: showing ${this.paginatedDrivers.length} drivers`);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
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

  selectPage(value: string): void {
    this.pageSize = parseInt(value);
    this.currentPage = 0; // Reset to first page when changing page size
    this.updatePagination();
  }


  selectConsumers() {
    console.log('selectConsumers called - user:', this.user, 'customConsumer:', this.customConsumer);

    this.subscription$.add(
      this._vehicleService.getFleetList(this.customConsumer).subscribe(
        (res: any) => {
          this.fleetList = res || [];
          this.fleetList = this.fleetList.sort((a, b) => {
            return a.id - b.id;
          });
          console.log('Fleet list loaded:', this.fleetList.length, 'fleets');

          // For fleet users, keep their assigned fleet and load data
          if (this.user === "role_user_fleet" && this.fleetIdData) {
            console.log('Fleet user - loading drivers for fleet:', this.fleetIdData);
            this.getDriverData();
          } else {
            // For admin users, clear fleet filter to load all drivers
            console.log('Admin user - clearing fleet filter and loading all drivers');
            this.fleetIdData = null;
            this.getDriverData();
          }
        },
        (err) => {
          console.error('Error loading fleet list:', err);
          // Still try to load drivers even if fleet list fails
          console.log('Fleet list failed - attempting to load drivers anyway');
          this.fleetIdData = null;
          this.getDriverData();
        }
      )
    );
  }

  viewMoreAssignDriver(viewMore: any, vehicle: any) {
    this.selectedVehicle = vehicle;
      this.modalService.open(viewMore, { size: "xl", centered: true });
  }
  getLatestVin(vins: any[]): any {
    if (!vins || vins.length === 0) {
      return null;
    }
    return vins.reduce((latest, current) =>
      new Date(current.associatedStart) > new Date(latest.associatedStart)
        ? current
        : latest
    );
  }
  getLatestVinTime(vins: any[], format: 'date' | 'time'): string | null {
    if (!vins || vins.length === 0) {
      return null;
    }

    const latestVin = vins.reduce((latest, current) =>
      new Date(current.associatedStart) > new Date(latest.associatedStart)
        ? current
        : latest
    );

    const latestDate = new Date(latestVin.associatedStart);

    if (format === 'date') {
      // Format as MM/DD/YYYY
      const month = (latestDate.getMonth() + 1).toString().padStart(2, '0');
      const day = latestDate.getDate().toString().padStart(2, '0');
      const year = latestDate.getFullYear();
      return `${month}/${day}/${year}`;
    } else if (format === 'time') {
      // Format as HH:MM
      const hours = latestDate.getHours().toString().padStart(2, '0');
      const minutes = latestDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    return null;
  }
  getLatestVinRange(vins: any[]): { date: string | null; time: string | null } {
    if (!vins || vins.length === 0) {
      return { date: null, time: null };
    }

    const latestVin = vins.reduce((latest, current) =>
      new Date(current.associatedStart) > new Date(latest.associatedStart)
        ? current
        : latest
    );

    const startDate = new Date(latestVin.associatedStart);
    const endDate = new Date(latestVin.associatedEnd);

    // Format MM/DD/YYYY
    const formatDate = (date: Date) => {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    // Format HH:MM
    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    return {
      date: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      time: `${formatTime(startDate)} - ${formatTime(endDate)}`
    };
  }
  onEdit(vehicle: any): void {
    vehicle.isEditing = true;
  }
  phoneNoInvalid(vehicle: any): boolean {
    const phoneNumber = vehicle.phoneNo;
    return phoneNumber && /^[0-9]+$/.test(phoneNumber) && phoneNumber.length > 10;
  }
  onSave(vehicle: any) {
    const payload: any = {};
    const changedFields: string[] = [];

    if (vehicle.phoneNo && (!/^[0-9]{10}$/.test(vehicle.phoneNo))) {
      this.appService.openSnackBar('Please enter a valid 10-digit phone number', 'Error');
      return; // Prevent the update if the phone number is invalid
    }
    // Check and add only changed fields to the payload
    if (vehicle.firstName && vehicle.firstName !== vehicle.originalFirstName) {
        payload['firstName'] = vehicle.firstName;
        changedFields.push('First Name');
    }
    if (vehicle.lastName && vehicle.lastName !== vehicle.originalLastName) {
        payload['lastName'] = vehicle.lastName;
        changedFields.push('Last Name');
    }
    if (vehicle.email && vehicle.email !== vehicle.originalEmail) {
        payload['email'] = vehicle.email;
        changedFields.push('Email Id');
    }

    // Check and handle phone number change, if unchanged, set to empty string or placeholder '--'
    if (vehicle.phoneNo !== undefined && vehicle.phoneNo !== vehicle.originalPhoneNo) {
        // If phone number has changed, use the new value
        payload['phoneNo'] = vehicle.phoneNo;
        changedFields.push('Phone No');
    } else if (vehicle.phoneNo === '' || vehicle.phoneNo === undefined) {
        // If phone number is empty or undefined, set to placeholder '--'
        payload['phoneNo'] = '--';
        changedFields.push('Phone No');
    }

    if (Object.keys(payload).length > 0) {
        this._vehicleService.updateDriver(vehicle.id, payload).subscribe({
            next: () => {
                const message = `Driver detail updated successfully.`;
                this.appService.openSnackBar(message, 'Success');
                Object.keys(payload).forEach(key => {
                    vehicle[`original${key.charAt(0).toUpperCase() + key.slice(1)}`] = payload[key];
                });
                vehicle.isEditing = false; // Exit edit mode
                this.getDriverData(); // Refresh data
            },
            error: (error) => {
                console.error('Error updating driver:', error);
            },
        });
    } else {
        this.appService.openSnackBar('No changes to update.', 'Info');
    }
}

  getFieldName(field: string): string {
    switch (field) {
      case 'firstName':
        return 'First Name';
      case 'lastName':
        return 'Last Name';
      case 'email':
        return 'Email Id';
      case 'phoneNo':
        return 'Phone No';
      default:
        return field;
    }
  }




  async deleteGeofenceById(id: string) {
    try {
      await this._vehicleService.deleteDriver(id).toPromise();
      this.appService.openSnackBar("Driver deleted successfully !", 'Success')
      this.getDriverData();
    } catch (error) {
      console.error(`Error deleting driver with id ${id}`, error);
    }
  }

  selectedGeofence: any;
  openDeleteModal(geofence: any, modalTemplate: any): void {
    this.selectedGeofence = geofence;
    this.modalService.open(modalTemplate, { size: "sm", centered: true });

  }
  addDriver() {
    this.router.navigate(['/adlp/admin/admindashboard/manageDriver/addDriver']);
  }

  goToAssignVehicle() {
    this.router.navigate(['/adlp/admin/admindashboard/manageDriver/assignDriver']);
  }

  formatName(name: string): string {
    return name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : 'No Name';
  }
  handleDeleteAssociation(transitionId): void {
    this._vehicleService.deleteAssociation(transitionId)
      .subscribe(
        (response) => {
          this.toastr.success('Association deleted successfully!', 'Success');
          this.getDriverData();
        },
        (error) => {
          if (error.error && error.error.apierror) {
            const apiError = error.error.apierror;
            this.toastr.error(apiError.message, 'Error');
          } else {
            this.toastr.error('Failed to delete association. Please try again.', 'Error');
          }
          console.error('Error deleting association:', error);
        }
      );
  }
}
