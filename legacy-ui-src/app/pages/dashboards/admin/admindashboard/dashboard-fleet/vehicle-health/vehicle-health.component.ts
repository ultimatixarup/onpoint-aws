import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';

@Component({
  selector: 'app-vehicle-health',
  templateUrl: './vehicle-health.component.html',
  styleUrls: ['./vehicle-health.component.scss']
})
export class VehicleHealthComponent implements OnInit {
  subscription$: Subscription = new Subscription();

  // User and Authentication
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;

  // Fleet and Vehicle Data
  fleetList: any;
  fleetIdData: any;
  vehicleHealthList: any[] = [];
  filteredVehicleList: any[] = [];

  // Summary Metrics
  totalActiveVehicles: number = 0;
  vehiclesNeedAttention: number = 0;

  // Search and Filter
  searchText: string = '';
  selectedHealthStatus: any = null;
  selectedVin: any = null;
  vinList: any[] = [];

  // Pagination
  pageSize: number = 10;
  pageNumber: number = 1;
  totalPages: number = 1;
  pages: any[] = [];

  // UI States
  loading: boolean = false;
  isDataNotFound: boolean = false;
  expandedRowIndex: number = -1;

  // Health Status Options
  healthStatusOptions = [
    { label: 'Normal', value: 'GREEN' },
    { label: 'Warning', value: 'ORANGE' },
    { label: 'Critical', value: 'RED' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private http: HttpClient,
    private taxonomyService: TaxonomyService
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  initializeComponent(): void {
    this.user = sessionStorage.getItem("role");
    this.loginUser = sessionStorage.getItem('consumer');
    this.multiRoles = sessionStorage.getItem('multirole');
    this.customConsumer = sessionStorage.getItem('customConsumer');

    this.loadFleetList();
    this.loadVinList();
    this.loadSummaryMetrics();
    this.loadVehicleHealthData();
  }

  loadFleetList(): void {
    // Load fleet list based on user role
    this.spinner.show();
    this.taxonomyService.getFleetList(this.customConsumer).subscribe({
      next: (response: any) => {
        this.fleetList = Array.isArray(response) ? response : [];
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading fleet list:', error);
        this.spinner.hide();
      }
    });
  }

  loadVinList(): void {
    const consumer = 'Smallboard'; // Example value (you can change it dynamically)
    const fleetId = this.fleetIdData || this.loginUser; // Use selected fleet or default
    const startDate = ''; // Pass empty to use default
    const endDate = ''; // Pass empty to use default

    this.taxonomyService.getManageListDownloadConsumers(consumer, fleetId, startDate, endDate)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.vinList = response.map((item) => ({
              vin: item.vin,
              alias: item.alias || item.vin // Use alias if available, else VIN
            }));
          }
        },
        error: (error) => {
          console.error('Error loading VIN list:', error);
        }
      });
  }

  loadSummaryMetrics(): void {
    const fleetId = this.fleetIdData || this.loginUser || '100224';

    this.taxonomyService.getVehicleHealthMetrics(fleetId).subscribe({
      next: (response: any) => {
        if (response) {
          // Update summary metrics from API response
          // Vehicle Active: totalVehicles
          // Vehicle Need Attention: redCount (consider only red count)
          this.totalActiveVehicles = response.totalVehicles || 0;
          this.vehiclesNeedAttention = response.redCount || 0;
        }
      },
      error: (error) => {
        console.error('Error loading summary metrics:', error);
      }
    });
  }

  loadVehicleHealthData(): void {
    this.loading = true;
    this.spinner.show();

    const fleetId = this.fleetIdData || this.loginUser || '100224';
    const pageNumber = this.pageNumber - 1; // API uses 0-based indexing
    const pageSize = this.pageSize;

    this.taxonomyService.getVehicleHealthSummary(fleetId, pageNumber, pageSize).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          // Handle the new API response structure
          this.processVehicleHealthData(response.data);

          // Update pagination from API response
          if (response.pagination) {
            this.totalPages = response.pagination.totalPages || 1;
            this.calculatePagination();
          }
        } else {
          this.vehicleHealthList = [];
          this.filteredVehicleList = [];
          this.isDataNotFound = true;
        }
        this.loading = false;
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading vehicle health data:', error);
        this.loading = false;
        this.spinner.hide();
        this.isDataNotFound = true;
        this.vehicleHealthList = [];
        this.filteredVehicleList = [];
      }
    });
  }

  loadMockData(): void {
    // Mock data for demonstration
    this.vehicleHealthList = [
      {
        vin: '1HGCM82633A123456',
        vehicleName: 'Fleet Vehicle 001',
        odometerReading: 45678,
        batteryLevel: 12.6,
        tirePressure: {
          frontRight: 32,
          frontLeft: 33,
          rearLeft: 31,
          rearRight: 32
        },
        fuelLevel: 8.5,
        overallHealth: 'GREEN',
        dtcCodes: [],
        oilLife: 45,
        coolantTemp: {
          max: 195,
          min: 180
        },
        oilTemp: {
          max: 220,
          min: 200
        }
      },
      {
        vin: '1HGCM82633A123457',
        vehicleName: 'Fleet Vehicle 002',
        odometerReading: 52341,
        batteryLevel: 12.4,
        tirePressure: {
          frontRight: 28,
          frontLeft: 30,
          rearLeft: 29,
          rearRight: 28
        },
        fuelLevel: 1.5,
        overallHealth: 'ORANGE',
        dtcCodes: [],
        oilLife: 8,
        coolantTemp: {
          max: 198,
          min: 185
        },
        oilTemp: {
          max: 225,
          min: 205
        }
      },
      {
        vin: '1HGCM82633A123458',
        vehicleName: 'Fleet Vehicle 003',
        odometerReading: 68945,
        batteryLevel: 11.8,
        tirePressure: {
          frontRight: 18,
          frontLeft: 32,
          rearLeft: 31,
          rearRight: 30
        },
        fuelLevel: 5.2,
        overallHealth: 'RED',
        dtcCodes: [
          {
            category: 'Engine',
            code: 'P0171',
            description: 'System Too Lean (Bank 1)'
          }
        ],
        oilLife: 0,
        coolantTemp: {
          max: 205,
          min: 190
        },
        oilTemp: {
          max: 235,
          min: 210
        }
      }
    ];

    this.processVehicleHealthData(this.vehicleHealthList);
    this.loading = false;
    this.spinner.hide();
  }

  processVehicleHealthData(data: any[]): void {
    this.vehicleHealthList = data.map(vehicle => {
      // Map API response to component format
      // Helper function to round tire pressure values
      const roundTirePressure = (pressure: any) => {
        if (typeof pressure === 'number') {
          return Math.round(pressure);
        }
        return pressure || 0;
      };

      const tirePressureData = vehicle.tirePressures || vehicle.tirePressure || {};

      const mappedVehicle = {
        vin: vehicle.vin,
        vehicleName: vehicle.vehicleName || vehicle.alias || vehicle.vin,
        odometerReading: vehicle.odometerMiles || vehicle.odometerReading || 0,
        batteryLevel: vehicle.batteryVolts !== undefined && vehicle.batteryVolts !== null ? vehicle.batteryVolts : 'N/A',
        tirePressure: {
          frontRight: roundTirePressure(tirePressureData.frontRight || vehicle.frontRightTirePressure),
          frontLeft: roundTirePressure(tirePressureData.frontLeft || vehicle.frontLeftTirePressure),
          rearLeft: roundTirePressure(tirePressureData.rearLeft || vehicle.rearLeftTirePressure),
          rearRight: roundTirePressure(tirePressureData.rearRight || vehicle.rearRightTirePressure)
        },
        fuelLevel: vehicle.fuelLevelGallons !== undefined && vehicle.fuelLevelGallons !== null ? vehicle.fuelLevelGallons : 'N/A',
        fuelLevelPercent: vehicle.fuelLevelPercent || 0,
        oilLife: vehicle.oilLifePercent === 'N/A' ? 'N/A' : vehicle.oilLifePercent || vehicle.oilLife || 0,
        overallHealth: vehicle.overallHealth || 'N/A',
        healthReason: vehicle.healthReason || '',
        dtcCodes: vehicle.dtcCodes || [],
        coolantTemp: vehicle.coolantTemp || {
          max: vehicle.maxCoolantTemp || 'N/A',
          min: vehicle.minCoolantTemp || 'N/A'
        },
        oilTemp: vehicle.oilTemp || {
          max: vehicle.maxOilTemp || 'N/A',
          min: vehicle.minOilTemp || 'N/A'
        },
        detailsLoaded: false // Flag to track if details have been loaded
      };

      return mappedVehicle;
    });

    // Don't recalculate summary metrics as they come from API
    // this.calculateSummaryMetrics();
    this.applyFilters();
  }

  calculateOverallHealth(vehicle: any): string {
    // RED (Critical) conditions
    if (vehicle.dtcCodes && vehicle.dtcCodes.length > 0) {
      return 'RED';
    }

    if (vehicle.tirePressure) {
      const tires = [
        vehicle.tirePressure.frontRight,
        vehicle.tirePressure.frontLeft,
        vehicle.tirePressure.rearLeft,
        vehicle.tirePressure.rearRight
      ];
      if (tires.some(pressure => pressure < 20)) {
        return 'RED';
      }
    }

    if (vehicle.oilLife === 0) {
      return 'RED';
    }

    // ORANGE (Warning) conditions
    if (vehicle.oilLife < 10) {
      return 'ORANGE';
    }

    if (vehicle.tirePressure) {
      const recommendedPressure = 35; // Default assumption
      const tires = [
        vehicle.tirePressure.frontRight,
        vehicle.tirePressure.frontLeft,
        vehicle.tirePressure.rearLeft,
        vehicle.tirePressure.rearRight
      ];
      if (tires.some(pressure => pressure < (recommendedPressure - 5))) {
        return 'ORANGE';
      }
    }

    if (vehicle.fuelLevel < 2) {
      return 'ORANGE';
    }

    // GREEN (Normal)
    return 'GREEN';
  }

  calculateSummaryMetrics(): void {
    this.totalActiveVehicles = this.vehicleHealthList.length;
    this.vehiclesNeedAttention = this.vehicleHealthList.filter(
      v => v.overallHealth === 'RED' || v.overallHealth === 'ORANGE'
    ).length;
  }

  applyFilters(): void {
    let filtered = [...this.vehicleHealthList];

    // Apply search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(v =>
        v.vin.toLowerCase().includes(search) ||
        v.vehicleName.toLowerCase().includes(search)
      );
    }

    // Apply VIN filter
    if (this.selectedVin) {
      filtered = filtered.filter(v => v.vin === this.selectedVin);
    }

    // Apply health status filter
    if (this.selectedHealthStatus) {
      filtered = filtered.filter(v => v.overallHealth === this.selectedHealthStatus);
    }

    this.filteredVehicleList = filtered;
    this.isDataNotFound = filtered.length === 0;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredVehicleList.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getPaginatedData(): any[] {
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredVehicleList.slice(startIndex, endIndex);
  }

  onFleetChange(event: any): void {
    this.pageNumber = 1;
    this.loadVinList();
    this.loadSummaryMetrics();
    this.loadVehicleHealthData();
  }

  onSearchChange(): void {
    this.pageNumber = 1;
    this.applyFilters();
  }

  onHealthStatusChange(): void {
    this.pageNumber = 1;
    this.applyFilters();
  }

  filterByVin(): void {
    this.pageNumber = 1;
    this.applyFilters();
  }

  toggleRowExpansion(index: number): void {
    if (this.expandedRowIndex === index) {
      // Collapse the row
      this.expandedRowIndex = -1;
    } else {
      // Expand the row and load details
      this.expandedRowIndex = index;
      const vehicle = this.getPaginatedData()[index];
      if (vehicle && !vehicle.detailsLoaded) {
        this.loadVehicleHealthDetails(vehicle, index);
      }
    }
  }

  loadVehicleHealthDetails(vehicle: any, index: number): void {
    const fleetId = this.fleetIdData || this.loginUser || '100224';
    const vin = vehicle.vin;

    this.taxonomyService.getVehicleHealthDetail(fleetId, vin).subscribe({
      next: (response: any) => {
        // Update the vehicle with detailed information
        const paginatedData = this.getPaginatedData();
        const vehicleToUpdate = paginatedData[index];

        if (vehicleToUpdate && response) {
          // Map API response fields: coolantTempFahrenheit, oilLifePercent, dtc[]
          let coolantTemp: any = 'N/A';
          if (response.coolantTempFahrenheit !== undefined && response.coolantTempFahrenheit !== null) {
            // Format to 2 decimal places if it's a number
            if (typeof response.coolantTempFahrenheit === 'number') {
              coolantTemp = parseFloat(response.coolantTempFahrenheit.toFixed(2));
            } else if (response.coolantTempFahrenheit !== 'N/A') {
              coolantTemp = parseFloat(parseFloat(response.coolantTempFahrenheit).toFixed(2));
            } else {
              coolantTemp = response.coolantTempFahrenheit;
            }
          }

          const oilLife = response.oilLifePercent !== undefined && response.oilLifePercent !== null
            ? response.oilLifePercent
            : 'N/A';

          // Map DTC codes from API response
          const dtcCodes = response.dtc && Array.isArray(response.dtc)
            ? response.dtc.map((dtc: any) => ({
                code: dtc.code || '',
                description: dtc.description || 'Description not provided by OEM',
                category: dtc.category || 'N/A'
              }))
            : [];

          // Merge the detail data into the vehicle object
          Object.assign(vehicleToUpdate, {
            coolantTemp: {
              avg: coolantTemp
            },
            oilTemp: {
              max: 'N/A',
              min: 'N/A'
            },
            dtcCodes: dtcCodes,
            oilLife: oilLife,
            detailsLoaded: true
          });
        }
      },
      error: (error) => {
        console.error('Error loading vehicle health details:', error);
      }
    });
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRowIndex === index;
  }

  getHealthStatusClass(status: string): string {
    switch (status) {
      case 'GREEN':
        return 'health-status-green';
      case 'ORANGE':
        return 'health-status-orange';
      case 'RED':
        return 'health-status-red';
      default:
        return '';
    }
  }

  getHealthStatusText(status: string): string {
    switch (status) {
      case 'GREEN':
        return 'Good';
      case 'ORANGE':
        return 'Warning';
      case 'RED':
        return 'Critical';
      default:
        return 'Unknown';
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageNumber = page;
    }
  }

  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
    }
  }

  nextPage(): void {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
    }
  }

  exportData(): void {
    // Implement export functionality
    console.log('Exporting vehicle health data...');
  }

  ngOnDestroy(): void {
    this.subscription$.unsubscribe();
    this.spinner.hide();
  }
}
