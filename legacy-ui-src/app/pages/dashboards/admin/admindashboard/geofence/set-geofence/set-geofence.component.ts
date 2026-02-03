import { Component, ElementRef, NgZone, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MapsAPILoader } from '@agm/core';
import { FleetVehiclesService, Maps } from '../../../fleet-vehicles.service';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, pluck, shareReplay } from "rxjs/operators";
import { AppService } from 'src/app/app.service';
import { Subscription, of } from "rxjs";
import * as Papa from 'papaparse';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
}
declare var google: any;
@Component({
  selector: 'app-set-geofence',
  templateUrl: './set-geofence.component.html',
  styleUrls: ['./set-geofence.component.scss']
})
export class SetGeofenceComponent implements OnInit {
  @ViewChild('search') public searchElementRef: ElementRef;
  zoomLevel = 10;
  @ViewChild('map') public mapElementRef: ElementRef;
  selectedRadius: number | null = null;
  radiusData = [{ radius: 1 }, { radius: 5 }, { radius: 10 }, { radius: 20 }, { radius: 30 }, { radius: 40 }, { radius: 50 }]; // Example data
  public entries = [];
  geofenceForm: FormGroup;
  address: string = '';
  latitude: number = 0;
  longitude: number = 0;
  zoom = 12;
  consumer: any = "All";
  fleetList: any;
  fleetIdData: any;
  consumerList: any;
  marker: any;
  getTypeList: any;
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  fleetIdValueNew: any;
  mapStyles: any = [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        { color: "#DBECF3" }, // Updated water color
        { lightness: 10 },
      ],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [{ color: "#E2E2E4" }, { lightness: 10 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#E2E2E4" }, { lightness: 10 }, { weight: 0.8 }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      // Adding a second stroke with dashed effect
      stylers: [
        { color: "#ffffff" },
        { weight: 0.5 }, // Thinner line to create a dashed look
        { visibility: "on" },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#E2E2E4" }, { lightness: 4 }],
    },
    {
      featureType: "road.local",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }, { lightness: 5 }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#dedede" }, { lightness: 21 }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }],
    },
    {
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.fill",
      stylers: [{ color: "#fefefe" }, { lightness: 20 }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
    },
  ];
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('search', { static: false }) searchElement!: ElementRef;
  map!: google.maps.Map;
  subscription$: Subscription = new Subscription();
  errorMessages: any;
  constructor(private modalService: NgbModal,private appService: AppService, private fb: FormBuilder, private http: HttpClient, private _vehicleService: TaxonomyService, apiService: FleetVehiclesService, private router: Router, private mapsAPILoader: MapsAPILoader, private ngZone: NgZone) {
    this.getGeofenceType()
    this.showRole()
    this.geofenceForm = this.fb.group({
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      lat: [this.latitude],
      lag: [this.longitude],
      radius: ['', [Validators.required]],
      address: ['', [Validators.required]],
      fleetId: ['', [Validators.required]],
      unit:['m']
    });
    this.geofenceForm.get('radius')?.valueChanges.subscribe(value => {
      this.onRadiusChangeData(value);
    });
  }
  ngOnInit(): void {
    this.getAllConsumers()
    if (this.user == 'role_consumer_fleet') {
      this.selectConsumers()
    }
  }
  ngAfterViewInit() {
    this.initAutocomplete();
  }
  initAutocomplete() {
    const input = document.getElementById('address') as HTMLInputElement;
    this.autocomplete = new google.maps.places.Autocomplete(input);
    this.geocoder = new google.maps.Geocoder();
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      if (place.geometry) {
        this.latitude = place.geometry.location.lat();
        this.longitude = place.geometry.location.lng();
        this.zoom = 15;  // Zoom in when a valid place is selected
        this.geofenceForm.patchValue({
          lat: this.latitude,
          lag: this.longitude,
          address: place.formatted_address // You can also update the address field
        });
      } else {
        alert('Address not found.');
      }
    });
  }

  async getAllConsumers(): Promise<void> {
    try {
      const response = await this._vehicleService
        .getAllConsumers()
        .pipe(
          pluck('data'),
          catchError(() => of([])),
          shareReplay(1)
        )
        .toPromise();

      const excludedConsumers = new Set([
        'Slick', 'OneStep', 'Arvind_insurance', 'HD Fleet LLC', 'GEICO',
        'Forward thinking GPS', 'Geo Toll', 'Matrack',
        'Geico', 'Test fleet', 'Rockingham', 'Axiom', 'GeoToll',
      ]);

      this.consumerList = (response as Consumer[])
        .filter((item) => item.contract && !excludedConsumers.has(item.name))
        .map((item) => ({
          name: item.name,
          startDate: item.contract?.startDate, // Handle optional startDate
        }));
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
      // if (this.consumerList.length > 0) {
      //   this.selectedConsumer = this.consumerList;
      // }
    } catch (error) {
      console.error('Error fetching consumers:', error);
    }
  }
  searchAddress() {
    if (this.address && this.geocoder) {
      this.geocoder.geocode({ address: this.address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          this.latitude = results[0].geometry.location.lat();
          this.longitude = results[0].geometry.location.lng();
          this.zoom = 15;  // Zoom level on the map
          this.geofenceForm.patchValue({
            lat: this.latitude,
            lag: this.longitude,
            address: results[0].formatted_address
          });
        } else {
          alert('Address not found.');
        }
      });
    }
  }

  validateBeforeSubmit(modal: any): void {
    if (this.user === 'admin') {
      if (!this.consumer || this.consumer === 'All') {
        this.errorMessage = 'Please select consumer.';
      } else if (!this.fleetIdData) {
        this.errorMessage = 'Please select fleet ID.';
      } else {
        this.errorMessage = '';
      }
    } else if (this.user === 'role_consumer_fleet') {
      if (!this.fleetIdData) {
        this.errorMessage = 'Please select fleet ID.';
      } else {
        this.errorMessage = '';
      }
    }

    // Show error modal if there's an error message
    if (this.errorMessage) {
      this.modalService.open(modal, { size: 'sm', centered: true });
    } else {
      this.onSubmit(); // Proceed to submit if no errors
    }
  }


  async selectConsumer() {
   this.selectConsumers();
  }

  selectConsumers() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this._vehicleService.getFleetList(this.consumer).subscribe(
          (res: any) => {
            this.fleetList = res;

            this.fleetList = this.fleetList.sort((a, b) => {
              return a.id - b.id;
            });
            this.fleetIdData = null;
          },
          (err) => { }
        )
      );
    }
    else if (this.user === 'role_consumer_fleet') {
      this.subscription$.add(
        this._vehicleService.getFleetList(this.customConsumer).subscribe(
          (res: any) => {
            this.fleetList = res;

            this.fleetList = this.fleetList.sort((a, b) => {
              return a.id - b.id;
            });
            this.fleetIdData = null;
          },
          (err) => { }
        )
      );
    }
  }
  onRadiusChangeData(value: any): void {
  }
  onRadiusChange(): void {
    if (this.selectedRadius) {
      this.zoomLevel = this.getZoomLevel(this.selectedRadius);
    }
  }
  getZoomLevel(radiusInMiles: number): number {
    const radiusInMeters = radiusInMiles * 1609.34
    const zoomLevels = [
      { radius: 1, zoom: 13 },
      { radius: 5, zoom: 11 },
      { radius: 10, zoom: 9 },
      { radius: 20, zoom: 8 },
      { radius: 30, zoom: 7 },
      { radius: 40, zoom: 6 },
      { radius: 50, zoom: 6 },
    ];
    const level = zoomLevels.find((level) => radiusInMeters <= level.radius * 1609.34);
    return level ? level.zoom : 7; // Default to zoom level 7 for very large radii
  }
  private autocomplete: any;
  private geocoder: any;
  navigateToAlert() {
    this.router.navigate(['/adlp/admin/admindashboard/geofence/geofence-alert']);
  }
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
    }
  }
  async getGeofenceType() {
    await this._vehicleService.getGeofenceType().subscribe((res: any) => {
      this.getTypeList = res
    })
  }
  onSubmit(): void {
    const formData = {
      ...this.geofenceForm.value,
    };
    this._vehicleService.createGeofence(formData).subscribe(
      response => {
        this.appService.openSnackBar("Geofence created successfully !", 'Success')
        this.geofenceForm.reset()
        this.router.navigate(['/adlp/admin/admindashboard/geofence/manage-geofence'])
      },
      error => {
        console.error('Error creating geofence:', error);
      }
    );
  }
  pin(color) {
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
      fillColor: color, fillOpacity: 1, strokeColor: '#000', strokeWeight: 2, scale: 1,
    };
  }
  onSearchChange(value: string) {
    this.geofenceForm.get('address')?.setValue(value);
  }
  singleGeofence: boolean = true;
  bulkGeofence: boolean = false;

  bulkGeofenceData(){
    this.bulkGeofence = true;
    this.singleGeofence = false;
    this.router.navigate(['admin/admindashboard/geoFenceSetup/bulk-geofence'])
  }
  showMap: boolean = true;
  addSingleGeofence(){
    this.bulkGeofence = false;
    this.singleGeofence = true;
    this.showMap = false;
    this. initAutocomplete()
  }

  downloadSamples() {
    var link = document.createElement("a");
    link.href = 'assets/data/bulk_geofence_upload.csv';
    link.click();
  }

  uploadedFileName: string | null = null;
  errorMessage: string | null = null;
  selectedFile: File | null = null;

  triggerFileUpload() {
    this.errorMessage = ''; // Reset error message before triggering upload
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Clear the selected file
      fileInput.click();    // Trigger the file input click event to allow the user to select a new file
    }
  }

  cancel() {
    this.uploadedFileName = null;
    this.selectedFile = null;
    this.errorMessage = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }


onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 50 MB.';
        this.uploadedFileName = null;
      } else {
        this.errorMessage = null;
        this.uploadedFileName = file.name;
        this.selectedFile = file;
      }
    }
}

  submitFile() {
    this.errorMessage = ''
    if (!this.selectedFile) {
      this.errorMessage = 'No file selected.';
      return;
    }
    Papa.parse(this.selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data.map((item: any) => ({
          name: item['Geofence Name'] || '',
          type: item['Geofence Type'] || '',
          address: item['Address'] || '',
          lat: parseFloat(item['Latitude']) || 0.0,
          lag: parseFloat(item['Longitude']) || 0.0,
          radius: parseInt(item['Radius']) || 0,
          unit: this.user == 'admin'
          ? 'm'
          : this.user == 'role_consumer_fleet'
              ? 'm'
              : null,
          fleetId: parseInt(item['Fleet Id']) || 0,
          consumer: item['Consumer'] || '',
        }));

        if (data.length === 0) {
          this.errorMessage = 'Invalid CSV file or empty data.';
          return;
        }

        // Call the service to upload data
        this.uploadData(data);
      },
      error: (error) => {
        this.errorMessage = 'Error parsing CSV file. Please try again.';
        console.error('CSV parsing error:', error);
      }
    });
  }

  uploadData(data: any[]) {
    // Check for invalid fields and show specific error messages
    const invalidField = data.find((item) => {
      if (!item.name) {
        this.appService.openSnackBar("Geofence name cannot be empty or null!", 'Error');
        this.uploadedFileName = '';
        return true;
      }
      if (!item.type) {
        this.appService.openSnackBar("Geofence type cannot be empty or null!", 'Error');
        return true;
      }
      if (!item.radius) {
        this.appService.openSnackBar("Radius cannot be null!", 'Error');
        this.uploadedFileName = '';
        return true;
      }

      return false;
    });

    if (invalidField) {
      return; // Prevent further execution if any field is invalid
    }

    // Proceed with sanitizing and processing the data
    const sanitizedData = data.map((item) => ({
      name: item.name || '0',
      type: item.type || '0',
      lat: item.lat || 0.0,
      lag: item.lag || 0.0,
      address: item.address,
      radius: item.radius ? parseFloat(item.radius.toString().replace(',', '.')) : 0.0,
      unit: item.unit || '0',
      fleetId: item.fleetId || '0',
      consumer: this.user === 'admin'
        ? this.consumer
        : this.user === 'role_consumer_fleet'
          ? this.customConsumer
          : null
    }));

    // Fetch addresses for each latitude and longitude
    const geocodingPromises = sanitizedData.map(async (item) => {
      if (item.lat && item.lag) {
        const address = await this.fetchAddressFromCoordinates(item.lat, item.lag);
        item.address = address; // Ensure this line correctly updates the address
      }
      return item;
    });

    Promise.all(geocodingPromises).then((updatedData) => {
      this._vehicleService.uploadDataToAPI(updatedData).subscribe({
        next: (response) => {
          this.uploadedFileName = ''; // Reset the file name after successful upload
          if (Array.isArray(response) && response.some((item) => item.status === 404)) {
            const errorItem = response.find((item) => item.status === 404);
            this.errorMessages = errorItem?.message || 'An error occurred.';
            this.appService.openSnackBar(this.errorMessages, 'Error');
          } else {
            // If no error, redirect and show success message
            this.router.navigate(['/adlp/admin/admindashboard/geofence/manage-geofence']);
            this.appService.openSnackBar('Geofence added successfully!', 'Success');
          }
        },
        error: (error) => {
          this.uploadedFileName = ''; // Reset the file name after upload error
          this.errorMessages = 'Failed to upload data. Please try again.';
          console.error('Upload error:', error);
          this.appService.openSnackBar(this.errorMessages, 'Error');
        }
      });
    });
  }


  // Function to fetch address from latitude and longitude
  fetchAddressFromCoordinates(lat: number, lon: number): Promise<string> {
    const apiKey = 'AIzaSyDySexTXKB3Syxg_1eHOf7cuMljEnKb8us'; // Replace with your geocoding API key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;

    return this.http.get<any>(url).toPromise().then((response) => {
      if (response.status === 'OK') {
        return response.results[0]?.formatted_address || 'Address not found';
      } else {
        return 'Address not found';
      }
    }).catch(() => 'Address not found');
  }

isSidebarHidden = false;
toggleSidebar() {
  this.isSidebarHidden = !this.isSidebarHidden;
}

}
