import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';

@Component({
  selector: 'app-driver-safety-score',
  templateUrl: './driver-safety-score.component.html',
  styleUrls: ['./driver-safety-score.component.scss']
})
export class DriverSafetyScoreComponent implements OnInit {

  searchByConsumer: any;
  searchFleets: String;
  currentUserEmail: string = '';

  // User role and fleet management
  user: any;
  multiRoles: any;
  customConsumer: any;
  fleetList: any[] = [];
  fleetIdData: any;
  selectedFleet: any;
  fleetIdValueNew: any;

  // Safety score weights
  safetyScoreWeights = {
    overSpeeding: 17,
    excessiveOverSpeeding: 21,
    harshAcceleration: 3,
    harshBraking: 21,
    harshCornering: 17,
    nightDriving: 7,
    seatbeltCompliance: 14
  };

  // Temporary storage for editing
  tempWeights = { ...this.safetyScoreWeights };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private _vehicleService: TaxonomyService
  ) {
    this.route.queryParams.subscribe(params => {
      this.searchByConsumer = params['consumer'];
      this.searchFleets = params['fleetId'];
    });
  }

  ngOnInit() {
    if (!this.searchByConsumer) {
      this.searchByConsumer = 'All';
    }

    // Get current user email from session storage or local storage
    const user = JSON.parse(sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser') || '{}');
    this.currentUserEmail = user.email || 'admin@smallboard.com';

    // Check user role and set fleet
    this.showRole();

    // Load fleet list
    this.loadFleetList();

    // Load safety score weights from API
    this.loadSafetyScoreWeights();
  }

  // Get user role and set fleet based on login
  showRole(): void {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);

    if (this.user === 'role_user_fleet') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
      this.searchFleets = fleetId;
    }
    if (this.user === 'role_org_group') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
      this.searchFleets = fleetId;
      this.searchByConsumer = this.customConsumer;
    }
    else if (this.user === 'role_Driver') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleet-Id'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.searchFleets = this.fleetIdValueNew;
    }
  }

  // Load fleet list for Organization Id/Name dropdown
  loadFleetList(): void {
    this.spinner.show();
    this._vehicleService.getFleetList(this.customConsumer).subscribe({
      next: (res: any) => {
        this.fleetList = Array.isArray(res) ? res : [];

        // Check if the customConsumer is "onwardfleet" and filter
        if (this.customConsumer === 'Onwardfleet') {
          const disallowedFleetIds = [100549, 100527, 100528, 100606];
          this.fleetList = this.fleetList.filter((fleet: any) =>
            !disallowedFleetIds.includes(fleet.id)
          );
        }

        if (this.customConsumer === 'EcoTrack') {
          const disallowedFleetIds = [101061, 100867, 100865, 100878, 100875];
          this.fleetList = this.fleetList.filter((fleet: any) =>
            !disallowedFleetIds.includes(fleet.id)
          );
        }

        this.fleetList = this.fleetList.sort((a, b) => a.id - b.id);

        // For fleet users, the fleetIdData is already set in showRole()
        if (this.user !== 'role_user_fleet' && this.user !== 'role_org_group') {
          this.fleetIdData = null;
        }

        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading fleet list:', error);
        this.fleetList = [];
        this.spinner.hide();
      }
    });
  }

  // Handle fleet selection change
  onFleetChange(event: any): void {
    // fleetIdData is already set by ngModel binding
    // Find the selected fleet object for reference if needed
    this.selectedFleet = this.fleetList?.find(fleet => fleet.id === this.fleetIdData);

    // Update searchFleets with the selected fleet ID
    this.searchFleets = this.fleetIdData;

    // Reload safety score weights for the selected fleet
    this.loadSafetyScoreWeights();
  }

  loadSafetyScoreWeights(): void {
    if (!this.searchFleets) {
      console.warn('No fleet ID available to load weights');
      return;
    }

    this.spinner.show();

    // Try to get existing fleet weights
    this._vehicleService.getFleetWeights(this.searchFleets.toString()).subscribe(
      (response) => {
        this.spinner.hide();
        if (response && response.fleet) {
          // Map API response to component weights
          this.safetyScoreWeights = {
            overSpeeding: response.os || 17,
            excessiveOverSpeeding: response.os2 || 21,
            harshAcceleration: response.ha || 3,
            harshBraking: response.hb || 21,
            harshCornering: response.hc || 17,
            nightDriving: response.np || 7,
            seatbeltCompliance: response.seatbelt || 14
          };
          this.tempWeights = { ...this.safetyScoreWeights };
          console.log('Fleet weights loaded successfully', response);
        }
      },
      (error) => {
        this.spinner.hide();
        console.log('Fleet weights not found, using default values', error);
        // Use default values if no weights exist
      }
    );
  }

  saveSafetyScoreWeights(): void {
    this.spinner.show();

    // Validate that total is 100
    const total = this.calculateTotal();
    if (total !== 100) {
      alert(`Total must equal 100%. Current total: ${total}%`);
      this.spinner.hide();
      return;
    }

    if (!this.searchFleets) {
      alert('Fleet ID is required to save weights');
      this.spinner.hide();
      return;
    }

    // Update the actual weights
    this.safetyScoreWeights = { ...this.tempWeights };

    // Prepare payload matching API structure
    const payload = {
      os: this.tempWeights.overSpeeding,
      os2: this.tempWeights.excessiveOverSpeeding,
      ha: this.tempWeights.harshAcceleration,
      hb: this.tempWeights.harshBraking,
      hc: this.tempWeights.harshCornering,
      np: this.tempWeights.nightDriving,
      seatbelt: this.tempWeights.seatbeltCompliance,
      createdBy: this.currentUserEmail
    };

    // Call the API to initialize/save fleet weights
    this._vehicleService.initializeFleetWeights(
      this.searchFleets.toString(),
      payload
    ).subscribe(
      (response) => {
        this.spinner.hide();
        console.log('Safety score weights saved successfully!', response);
        alert('Safety score weights saved successfully!');

        // Reload the weights to confirm
        this.loadSafetyScoreWeights();
      },
      (error) => {
        this.spinner.hide();
        console.error('Error saving safety score weights:', error);
        alert('Error saving safety score weights. Please try again.');
      }
    );
  }

  calculateTotal(): number {
    return Object.values(this.tempWeights).reduce((sum, value) => sum + value, 0);
  }

  calculateSavedTotal(): number {
    return Object.values(this.safetyScoreWeights).reduce((sum, value) => sum + value, 0);
  }

  resetToDefaults(): void {
    this.tempWeights = {
      overSpeeding: 17,
      excessiveOverSpeeding: 21,
      harshAcceleration: 3,
      harshBraking: 21,
      harshCornering: 17,
      nightDriving: 7,
      seatbeltCompliance: 14
    };
  }

  navigateBack(): void {
    this.router.navigate(['/adlp/admin/admindashboard/dashboardfleet']);
  }
}
