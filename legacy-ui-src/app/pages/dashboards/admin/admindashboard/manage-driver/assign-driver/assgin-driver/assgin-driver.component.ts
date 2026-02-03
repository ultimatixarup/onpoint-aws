/**
 * Assign Driver Component - API Integrated Version
 *
 * This component allows assigning drivers to unassigned vehicles with one-to-one relationship.
 * Calls driver-vin-association API to get all vehicles, determines assignment status based on driverId.
 *
 * API Endpoints:
 * - GET /v1/driver-vin-association (no status filter)
 *   Returns ALL vehicles with flat structure
 *   Vehicles with driverId=0 or null = UNASSIGNED
 *   Vehicles with driverId>0 and driverName = ASSIGNED
 * - GET /v1/driver?consumerId=877634
 *   Returns all available drivers
 * - POST /v1/driver-vin-association - Assign driver to vehicle
 * - DELETE /v1/driver-vin-association/vin/{vin} - Remove driver from vehicle by VIN
 */

import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "src/app/app.service";
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription } from "rxjs";
import { NgxSpinnerService } from "ngx-spinner";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

interface VehicleData {
  vin: string;
  alias: string;
  fleetId: number;
  fleetName: string;
  currentLocation?: string;
  healthStatus?: string;
  healthNotes?: string;
  currentDriver?: {
    id: number;
    name: string;
    phoneNo?: string;
    assignedStart: string;
    assignedEnd: string;
    transitionId?: number; // For deletion - from driver object
  };
  selectedDriver?: number;
  isAssigning?: boolean;
}

interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  phoneNo?: string;
  email?: string;
}

@Component({
  selector: 'app-assgin-driver',
  templateUrl: './assgin-driver.component.html',
  styleUrls: ['./assgin-driver.component.scss']
})
export class AssginDriverComponent implements OnInit, OnDestroy {
  subscription$: Subscription = new Subscription();

  // User and auth
  user: any;
  customConsumer: any;

  // Data arrays
  allVehicles: VehicleData[] = [];
  filteredVehicles: VehicleData[] = [];
  drivers: Driver[] = [];

  // Filter
  showOnlyUnassigned: boolean = true;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  paginatedVehicles: VehicleData[] = [];

  // Selected vehicle for modal
  selectedVehicle: VehicleData | null = null;

  constructor(
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private appService: AppService,
    private router: Router,
    private _vehicleService: TaxonomyService
  ) {}

  ngOnInit(): void {
    this.showRole();
    this.loadData();
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem("userRole"));
    this.user = JSON.parse(userRolLogin);
    let customConsumers = JSON.stringify(sessionStorage.getItem("custom-consumer"));
    this.customConsumer = JSON.parse(customConsumers);

    // Ensure customConsumer is always the numeric ID (877634), not "Smallboard"
    if (!this.customConsumer || this.customConsumer === 'Smallboard' || isNaN(this.customConsumer)) {
      this.customConsumer = '877634';
    }
  }

  loadData(): void {
    this.spinner.show();
    this.allVehicles = []; // Reset vehicles array

    // Load vehicles and drivers
    Promise.all([
      this.loadAllVehicles(),
      this.loadDrivers()
    ]).finally(() => {
      this.spinner.hide();
      this.applyFilter();
    });
  }

  async loadAllVehicles(): Promise<void> {
    try {
      // Call API without status filter to get ALL vehicles
      // Backend returns all vehicles regardless of assignment status
      // We determine assigned/unassigned based on driverId field
      const response: any = await this._vehicleService.getDriverVinAssociationByStatus('', '').toPromise();

      const allVehicleAssignments = Array.isArray(response) ? response : [];

      console.log('API Response - All Vehicles:', allVehicleAssignments.length);

      // Group by VIN to handle multiple assignments for same vehicle
      const vehicleMap = new Map<string, any>();

      allVehicleAssignments.forEach((assignment: any) => {
        const vin = assignment.vin;

        // Check if vehicle has a REAL driver assigned (not driverId: 0 or null)
        const hasDriver = assignment.driverId && assignment.driverId > 0 && assignment.driverName;

        console.log(`Vehicle ${assignment.alias}: driverId=${assignment.driverId}, hasDriver=${hasDriver}`);

        if (!vehicleMap.has(vin)) {
          // New vehicle - initialize with fields from this assignment
          vehicleMap.set(vin, {
            vin: assignment.vin || '',
            alias: assignment.alias || 'Unknown',
            fleetId: assignment.fleetId || 0,
            fleetName: assignment.fleetName || 'Unknown Fleet',
            // New API provides these fields now
            currentLocation: assignment.currentLocation ?? 'Unknown',
            healthStatus: assignment.healthStatus ?? 'unknown',
            healthNotes: assignment.healthNotes ?? 'No notes available',
            currentDriver: hasDriver ? {
              id: assignment.driverId,
              name: assignment.driverName || `${assignment.firstName || ''} ${assignment.lastName || ''}`.trim(),
              phoneNo: '',
              assignedStart: assignment.associatedStart || '',
              assignedEnd: assignment.associatedEnd || '',
              transitionId: assignment.vinId // Use vinId as transitionId for deletion
            } : undefined,
            selectedDriver: undefined,
            isAssigning: false
          });
        } else {
          // Vehicle already exists (possible duplicate rows)
          const existing = vehicleMap.get(vin);

          // Update health/location fields if present in this assignment
          if (assignment.currentLocation) existing.currentLocation = assignment.currentLocation;
          if (assignment.healthStatus) existing.healthStatus = assignment.healthStatus;
          if (assignment.healthNotes) existing.healthNotes = assignment.healthNotes;

          // If we don't have a driver yet and this assignment has one, set it (prefer assigned record)
          if (!existing.currentDriver && hasDriver) {
            existing.currentDriver = {
              id: assignment.driverId,
              name: assignment.driverName || `${assignment.firstName || ''} ${assignment.lastName || ''}`.trim(),
              phoneNo: '',
              assignedStart: assignment.associatedStart || '',
              assignedEnd: assignment.associatedEnd || '',
              transitionId: assignment.vinId
            };
          }

          vehicleMap.set(vin, existing);
        }
      });

      // Convert map to array
      this.allVehicles = Array.from(vehicleMap.values());

      console.log('Total unique vehicles loaded:', this.allVehicles.length);
      console.log('Assigned vehicles:', this.allVehicles.filter(v => v.currentDriver).length);
      console.log('Unassigned vehicles:', this.allVehicles.filter(v => !v.currentDriver).length);
      console.log('Sample assigned vehicle:', this.allVehicles.find(v => v.currentDriver));
      console.log('Sample unassigned vehicle:', this.allVehicles.find(v => !v.currentDriver));

      // Convert lat/long to readable addresses for all vehicles
      this.convertLocationsToAddresses();

    } catch (error) {
      console.error('Error loading vehicles:', error);
      this.toastr.error('Failed to load vehicles');
    }
  }

  /**
   * Convert lat/long currentLocation strings to readable addresses
   * Format: "40.563820, -75.471695" -> "123 Main St, City, State"
   */
  private convertLocationsToAddresses(): void {
    this.allVehicles.forEach((vehicle) => {
      if (vehicle.currentLocation && vehicle.currentLocation !== 'Unknown') {
        // Parse lat/long from string format "lat, long"
        const coords = vehicle.currentLocation.split(',').map(c => c.trim());

        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);

          if (!isNaN(lat) && !isNaN(lng)) {
            // Mark as loading
            vehicle.currentLocation = 'Loading address...';

            // Call reverse geocode API
            this._vehicleService.getAddressLatLng(lat, lng).subscribe(
              (res: any) => {
                vehicle.currentLocation = res?.displayName || `${lat}, ${lng}`;
              },
              (error) => {
                console.error('Reverse geocoding failed for vehicle:', vehicle.vin, error);
                vehicle.currentLocation = `${lat}, ${lng}`;
              }
            );
          }
        }
      }
    });
  }

  async loadAssignedVehicles(): Promise<void> {
    // This method is no longer used - kept for backward compatibility
    // All vehicles are now loaded in loadAllVehicles()
  }

  async loadUnassignedVehicles(): Promise<void> {
    // This method is no longer used - kept for backward compatibility
    // All vehicles are now loaded in loadAllVehicles()
  }

  async loadDrivers(): Promise<void> {
    try {
      // Always use numeric consumerId (877634)
      const consumerId = '877634';
      const response: any = await this._vehicleService.getAssignDrivers(consumerId, null).toPromise();
      const drivers = Array.isArray(response) ? response : (response?.content || []);

      this.drivers = drivers.map((d: any) => ({
        id: d.id,
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        name: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
        phoneNo: d.phoneNo,
        email: d.email
      }));

      console.log('Loaded drivers:', this.drivers.length);
    } catch (error) {
      console.error('Error loading drivers:', error);
      this.toastr.error('Failed to load drivers');
    }
  }

  toggleFilter(): void {
    this.showOnlyUnassigned = !this.showOnlyUnassigned;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.showOnlyUnassigned) {
      this.filteredVehicles = this.allVehicles.filter(v => !v.currentDriver);
      console.log('Filter: Showing UNASSIGNED vehicles only');
      console.log('Total vehicles:', this.allVehicles.length);
      console.log('Unassigned vehicles (filtered):', this.filteredVehicles.length);
      console.log('Sample unassigned vehicle:', this.filteredVehicles[0]);
    } else {
      this.filteredVehicles = [...this.allVehicles];
      console.log('Filter: Showing ALL vehicles');
      console.log('Total vehicles:', this.filteredVehicles.length);
    }

    this.currentPage = 0;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVehicles.length / this.pageSize);
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedVehicles = this.filteredVehicles.slice(startIndex, endIndex);
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
    this.currentPage = 0;
    this.updatePagination();
  }

  getUnassignedCount(): number {
    return this.allVehicles.filter(v => !v.currentDriver).length;
  }

  // Health Status Helper Methods
  getHealthStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'good':
        return 'health-good';
      case 'warning':
        return 'health-warning';
      case 'critical':
        return 'health-critical';
      default:
        return 'health-unknown';
    }
  }

  getHealthStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'good':
        return 'bx bx-check-circle';
      case 'warning':
        return 'bx bx-error-circle';
      case 'critical':
        return 'bx bx-x-circle';
      default:
        return 'bx bx-help-circle';
    }
  }

  getHealthStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'good':
        return 'Good';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  }

  assignDriver(vehicle: VehicleData): void {
    if (!vehicle.selectedDriver) {
      this.toastr.warning('Please select a driver');
      return;
    }

    vehicle.isAssigning = true;

    // API expects just driverId and vin
    this._vehicleService.saveDriverVinAssociation(
      vehicle.selectedDriver,
      vehicle.vin
    ).pipe(
      finalize(() => vehicle.isAssigning = false)
    ).subscribe({
      next: (response) => {
        console.log('Driver assigned successfully:', response);
        this.toastr.success('Driver assigned successfully');
        this.loadData(); // Reload data to get updated assignments
      },
      error: (error) => {
        console.error('Error assigning driver:', error);

        // Extract error message from API response
        // API returns: { apierror: { message: "..." } } or { error: { message: "..." } }
        let errorMessage = 'Failed to assign driver';

        if (error?.error?.apierror?.message) {
          errorMessage = error.error.apierror.message;
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.toastr.error(errorMessage, 'Assignment Failed', {
          timeOut: 5000,
          closeButton: true
        });
      }
    });
  }

  openDisassociateModal(vehicle: VehicleData, modal: any): void {
    this.selectedVehicle = vehicle;
    this.modalService.open(modal, { centered: true });
  }

  disassociateDriver(): void {
    if (!this.selectedVehicle || !this.selectedVehicle.currentDriver) {
      return;
    }

    const vin = this.selectedVehicle.vin;
    if (!vin) {
      this.toastr.error('No VIN found for this vehicle');
      return;
    }

    this.spinner.show();

    // Using v1 API endpoint for disassociation by VIN
    this._vehicleService.disassociateDriverFromVehicle(vin).pipe(
      finalize(() => this.spinner.hide())
    ).subscribe({
      next: (response) => {
        console.log('Driver disassociated successfully:', response);
        this.toastr.success('Driver removed successfully');
        this.modalService.dismissAll();
        this.selectedVehicle = null;
        this.loadData(); // Reload data to get updated assignments
      },
      error: (error) => {
        console.error('Error disassociating driver:', error);

        // Extract error message from API response
        let errorMessage = 'Failed to remove driver';

        if (error?.error?.apierror?.message) {
          errorMessage = error.error.apierror.message;
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.error?.detail) {
          errorMessage = error.error.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.toastr.error(errorMessage, 'Removal Failed', {
          timeOut: 5000,
          closeButton: true
        });
        this.modalService.dismissAll();
      }
    });
  }

  backToDriverList(): void {
    this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
  }

  ngOnDestroy(): void {
    this.subscription$.unsubscribe();
  }
}
