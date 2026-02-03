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
import { FleetService } from 'src/app/core/services/users-role.service';
import { SharedService } from 'src/app/layouts/user-role/users-role.service';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: number
}


declare var google: any;
@Component({
  selector: 'app-add-geofence',
  templateUrl: './add-geofence.component.html',
  styleUrls: ['./add-geofence.component.scss']
})
export class AddGeofenceComponent implements OnInit {
  @ViewChild('search') public searchElementRef: ElementRef;
  currentMapType: 'roadmap' | 'satellite' = 'roadmap';
  zoomLevel = 10;
  @ViewChild('map') public mapElementRef: ElementRef;
  selectedRadius = 1;
  radiusData = [{ radius: 'Circle' }, { radius: 'Reactangle' }, { radius: 'Polygon' }]; // Example data
  public entries = [];
  geofenceForm: FormGroup;
  latitude: number = 37.09024;
  longitude: number = -95.712891;
  zoom = 4.5;
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
  @ViewChild('addressInput') addressInput!: ElementRef;

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
  geofenceTypes = [
    { label: 'Circle', value: 'CIRCLE' },
    { label: 'Rectangle', value: 'RECTANGLE' },
    { label: 'Polygon', value: 'POLYGON' }
  ];
  address: string = '';
  geofenceType: any = ''
  selectedGeofenceType: string
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @ViewChild('search', { static: false }) searchElement!: ElementRef;
  map!: google.maps.Map;
  subscription$: Subscription = new Subscription();
  errorMessages: any;
  groupList: any;
geoLocations: number[][] = [];
groupIdData: any;
  selectConsumerId: void;
locationType: string[] = [];
  constructor(   private SharedService: SharedService,private fleetService: FleetService,private modalService: NgbModal,private appService: AppService, private fb: FormBuilder, private http: HttpClient, private _vehicleService: TaxonomyService, apiService: FleetVehiclesService, private router: Router, private mapsAPILoader: MapsAPILoader, private ngZone: NgZone) {
    this.getGeofenceType()
    this.showRole()
    this.geofenceForm = this.fb.group({
      name: ['', Validators.required],
      geofenceType: [null],
      address: [{ value: '', disabled: true }, Validators.required],
      locationType: [null, Validators.required],
      radius: [],
      speedLimit: ['', [Validators.required, Validators.min(0), Validators.max(199)]],
      fleetId: [null, Validators.required],
      groupId: [null, Validators.required],
      consumerId: [null, Validators.required],
      latlng: ['', Validators.required]
    });
    this.geofenceForm.get('radius')?.valueChanges.subscribe(value => {
      this.onRadiusChangeData(value);
    });
  }
  polygon: any;
  setMapType(type: 'roadmap' | 'satellite') {
    this.currentMapType = type;
  }

  ngOnDestroy(): void {
    if (this.drawnShape) this.drawnShape.setMap(null);
    if (this.drawingManager) this.drawingManager.setMap(null);
    this.drawingManagerInitialized = false;
  }
  ngOnInit(): void {
    this.showRole()
    this.getAllConsumers()
    this.getLocationType()
    this.selectGroupId()

    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }

  // Subscribe to radius changes
  this.geofenceForm.get('radius')?.valueChanges.subscribe(value => {
    this.selectedRadius = Number(value) || 0;
  });

  this.geofenceForm.get('geofenceType')?.valueChanges.subscribe(value => {
    this.selectedGeofenceType = value;
  });

    this.selectedGeofenceType = ''; // or default from form
    if (this.user == 'role_consumer_fleet') {
      this.selectConsumers()
    }
    this.geofenceForm.get('geofenceType')?.valueChanges.subscribe(type => {
      const addressControl = this.geofenceForm.get('address');
      if (type) {
        addressControl?.enable(); // ✅ Enable if geofence type is selected
      } else {
        addressControl?.disable(); // ❌ Disable if nothing is selected
      }
    });


  }
  drawnShape: google.maps.Polygon | google.maps.Circle | google.maps.Rectangle | null = null;

  ngAfterViewInit(): void {
    this.mapsAPILoader.load().then(() => {
      const autocomplete = new google.maps.places.Autocomplete(
        this.addressInput.nativeElement,
        { types: ['address'], componentRestrictions: { country: 'us' } }
      );

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            this.latitude  = place.geometry.location.lat();
            this.longitude = place.geometry.location.lng();
            this.zoom      = 15;
            this.geofenceForm.patchValue({ address: place.formatted_address });
          }
        });
      });
    });
  }


  mapInstance: any;
  drawingManager: any;
  drawingManagerInitialized = false;
  centerMarker: google.maps.Marker | null = null;
  setDrawingModeBasedOnType(type: string): void {
    if (!this.drawingManager || !this.mapInstance) return;

    const modeMap: { [key: string]: google.maps.drawing.OverlayType | null } = {
      CIRCLE: google.maps.drawing.OverlayType.CIRCLE,
      RECTANGLE: google.maps.drawing.OverlayType.RECTANGLE,
      POLYGON: google.maps.drawing.OverlayType.POLYGON,
    };

    const selectedMode = modeMap[type] || null;
    this.drawingManager.setDrawingMode(selectedMode);

    const center = new google.maps.LatLng(this.latitude, this.longitude);

    // Clear previous shape
    if (this.drawnShape) {
      this.drawnShape.setMap(null);
      this.drawnShape = null;
    }

    // Clear previous marker
    if (this.centerMarker) {
      this.centerMarker.setPosition(center);
    } else {
      this.centerMarker = new google.maps.Marker({
        position: center,
        map: this.mapInstance,
      });
    }

    if (type === 'POLYGON') {
      alert('Please draw the polygon');
      return;
    }

    if (type === 'CIRCLE') {
      const circle = new google.maps.Circle({
        center,
        radius: 50,
        ...this.drawingManager.get('circleOptions'),
        map: this.mapInstance,
      });

      this.drawnShape = circle; // Track it
      this.drawingManager.setDrawingMode(null); // stop drawing mode

      // Sync form with values
      this.geofenceForm.get('geofenceType')?.setValue('CIRCLE', { emitEvent: false });
      this.geofenceForm.get('latlng')?.setValue(`${center.lng()}, ${center.lat()}`);
      this.geofenceForm.get('radius')?.setValue(circle.getRadius());
      this.geoLocations = [[center.lng(), center.lat()]];
      this.getAddress(center.lat(), center.lng());

      // Add live listeners
      google.maps.event.addListener(circle, 'radius_changed', () => {
        this.geofenceForm.get('radius')?.setValue(circle.getRadius());
      });

      google.maps.event.addListener(circle, 'center_changed', () => {
        const updatedCenter = circle.getCenter();
        this.geofenceForm.get('latlng')?.setValue(`${updatedCenter.lng()}, ${updatedCenter.lat()}`);
        this.geoLocations = [[updatedCenter.lng(), updatedCenter.lat()]];
        this.getAddress(updatedCenter.lat(), updatedCenter.lng());
      });
    }
  }
  onMapReady(map: any): void {
    this.mapInstance = map;

    if (this.drawingManagerInitialized) return;

    if (!google.maps.drawing || !google.maps.drawing.DrawingManager) {
      console.warn('Drawing library not loaded yet, retrying...');
      setTimeout(() => this.onMapReady(map), 300);
      return;
    }

    google.maps.event.addListenerOnce(map, 'idle', () => {
      this.drawingManagerInitialized = true;

      this.drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          drawingModes: ['polygon', 'circle', 'rectangle'],
          position: google.maps.ControlPosition.TOP_CENTER,
        },
        polygonOptions: {
          draggable: true,
          editable: true,
          strokeColor: '#FA751A',
          strokeOpacity: 0.8,
          strokeWeight: 0.5,
          fillColor: '#FA751A',
          fillOpacity: 0.3,
        },
        circleOptions: {
          draggable: true,
          editable: true,
          strokeColor: '#FA751A',
          strokeOpacity: 0.8,
          strokeWeight: 0.5,
          fillColor: '#FA751A',
          fillOpacity: 0.3,
        },
        rectangleOptions: {
          draggable: true,
          editable: true,
          strokeColor: '#FA751A',
          strokeOpacity: 0.8,
          strokeWeight: 0.5,
          fillColor: '#FA751A',
          fillOpacity: 0.3,
        },
      });

      this.drawingManager.setMap(map);

      // Set initial drawing tool from form
      const currentType = this.geofenceForm.get('geofenceType')?.value;
      if (currentType) this.setDrawingModeBasedOnType(currentType);

      // Sync drawing tool selection with form
      this.geofenceForm.get('geofenceType')?.valueChanges.subscribe(type => {
        this.setDrawingModeBasedOnType(type);
      });

      // Detect completed overlays
      google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
        if (this.drawnShape) {
          this.drawnShape.setMap(null);
        }

        this.drawnShape = event.overlay;
        this.drawnShape.setMap(this.mapInstance);

        event.overlay.setEditable?.(true);
        event.overlay.setDraggable?.(true);

        this.drawingManager.setDrawingMode(null);

        // 🔄 Sync form control based on drawn shape type
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          this.geofenceForm.get('geofenceType')?.setValue('POLYGON', { emitEvent: false });

          const polygonCoords = event.overlay.getPath().getArray();
          this.geoLocations = polygonCoords.map((latLng: any) => [latLng.lng(), latLng.lat()]);
          const formattedCoords = this.geoLocations.map((pair, i, arr) => {
            const line = `${pair[0]}, ${pair[1]}`;
            return i < arr.length - 1 ? line + ',' : line;
          }).join('\n');
          this.geofenceForm?.get('latlng')?.setValue(formattedCoords);
          this.getAddress(this.geoLocations[0][1], this.geoLocations[0][0]);
          this.geofenceForm.get('address')?.enable();

        } else if (event.type === google.maps.drawing.OverlayType.CIRCLE) {
          this.geofenceForm.get('geofenceType')?.setValue('CIRCLE', { emitEvent: false });

          const circle = event.overlay;
          const center = circle.getCenter();
          const radius = circle.getRadius();

          this.geofenceForm?.get('latlng')?.setValue(`${center.lng()}, ${center.lat()}`);
          this.geofenceForm?.get('radius')?.setValue(radius);
          this.geoLocations = [[center.lng(), center.lat()]];
          this.getAddress(center.lat(), center.lng());
          this.geofenceForm.get('address')?.enable();
          google.maps.event.addListener(circle, 'radius_changed', () => {
            this.geofenceForm?.get('radius')?.setValue(circle.getRadius());
          });

          google.maps.event.addListener(circle, 'center_changed', () => {
            const updatedCenter = circle.getCenter();
            this.geofenceForm?.get('latlng')?.setValue(`${updatedCenter.lng()}, ${updatedCenter.lat()}`);
            this.geoLocations = [[updatedCenter.lng(), updatedCenter.lat()]];
            this.getAddress(updatedCenter.lat(), updatedCenter.lng());
          });

        } else if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
          this.geofenceForm.get('geofenceType')?.setValue('RECTANGLE', { emitEvent: false });

          const bounds = event.overlay.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const nw = new google.maps.LatLng(ne.lat(), sw.lng());
          const se = new google.maps.LatLng(sw.lat(), ne.lng());

          this.geoLocations = [
            [nw.lng(), nw.lat()],
            [ne.lng(), ne.lat()],
            [se.lng(), se.lat()],
            [sw.lng(), sw.lat()],
          ];

          const formatted = `${ne.lng()}, ${ne.lat()}\n${sw.lng()}, ${sw.lat()}`;
          this.geofenceForm?.get('latlng')?.setValue(formatted);
          this.getAddress(ne.lat(), ne.lng());
          this.geofenceForm.get('address')?.enable();
        }
      });
    });
  }
  get geofenceTypeSelected(): string {
    return this.geofenceForm.get('geofenceType')?.value;
  }

  getAddress(lat: number, lng: number): void {
    this._vehicleService.getAddressLatLng(lat, lng).subscribe(
      (res: any) => {
        const address = res?.displayName || 'Address not found';
        this.geofenceForm.get('address')?.setValue(address); // Set value to form input
      },
      (error) => {
        console.error('Reverse geocoding failed:', error);
        this.geofenceForm.get('address')?.setValue('Address lookup error');
      }
    );
  }
  initAutocomplete() {
    const input = this.addressInput.nativeElement;
    this.autocomplete = new google.maps.places.Autocomplete(input);
    this.geocoder = new google.maps.Geocoder();

    this.autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place: google.maps.places.PlaceResult = this.autocomplete.getPlace();

        if (place.geometry) {
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.zoom = 12;
          this.geoLocations = [[this.longitude, this.latitude]];

          this.geofenceForm.patchValue({
            address: place.formatted_address,
            lat: this.latitude,
            lag: this.longitude,
            latlng: `${this.latitude}, ${this.longitude}`
          });

          // ✅ Draw 50m circle and marker at new address
          this.setDrawingModeBasedOnType('CIRCLE');

          // ✅ Optionally center map
          this.mapInstance.setCenter(place.geometry.location);
          this.mapInstance.setZoom(17);
        } else {
          alert('Address not found.');
        }
      });
    });
  }

  selectedLatLng: string = '';
  onLatLngChange(value: string): void {
    const [lngStr, latStr] = value.split(',').map(v => v.trim());
    const lng = parseFloat(lngStr);
    const lat = parseFloat(latStr);

    if (!isNaN(lat) && !isNaN(lng)) {
      this.setCoordinates(lat, lng);
    } else {
      this.geoLocations = []; // reset if invalid
      console.warn('Invalid Lat/Lng input');
    }
  }

  setCoordinates(lat: number, lng: number): void {
    this.selectedLatLng = `${lng}, ${lat}`;
    this.geoLocations = [[lng, lat]];
  }
  onSubmit() {
      // 🔴 ADD THIS
  // if (this.geofenceForm.invalid) {
  //   this.geofenceForm.markAllAsTouched(); // 🔥 This triggers display of validation errors
  //   return;
  // }

    const formValue = this.geofenceForm.value;

    const selectedConsumer = this.consumerList.find(c => c.name === formValue.consumerId);
    let consumerId = selectedConsumer?.id || null;

    // Override consumerId for specific roles
    if (this.user === 'role_consumer_fleet') {
    if (this.customConsumer === 'Smallboard') {
        consumerId = '877634';
      }
    }

    // ✅ Set fleetId: form value or fallback to shared value
    let fleetId = formValue.fleetId
    const payload = {
      name: formValue.name,
      type: formValue.geofenceType,
      address: formValue.address,
      locationType: formValue.locationType,
      radius: formValue.radius,
      unit: 'miles',
      speedLimit: formValue.speedLimit,
      fleetId: fleetId, // ✅ Always defined now
      groupId: formValue.groupId,
      consumerId: consumerId,
      geoLocations: this.geoLocations,
      email: this.loginUser.email
    };
    console.log(payload)
    this._vehicleService.createGeofenceNew(payload).subscribe(
      res => {
        this.appService.openSnackBar('Geofence created successfully.', 'Success');
        this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/geofence']);
      },
      err => {
        console.error('Failed to create geofence.', err);
        this.appService.openSnackBar('Failed to create geofence. Please try again later.', 'Error');
      }
    );
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
          startDate: item.contract?.startDate,
          id: item.id // Handle optional startDate
        }));
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
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

  consumerName: string = ''
  async selectConsumer() {
   this.selectConsumers();
     // Get full consumer object based on selected name
  const selectedConsumer = this.consumerList.find(c => c.name === this.consumerName);
  if (selectedConsumer) {
    this.selectConsumerId = this.geofenceForm.patchValue({
      consumerId: selectedConsumer.id // 🔁 patch the id to the form
    });
    this.selectConsumers// Or .id depending on API
  }
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
            this.selectGroupId()
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
            this.selectGroupId()
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
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = this.fleetIdValueNew
    }
    if (this.user === 'role_org_group') {
const fleetId = sessionStorage.getItem('fleetUserId');
this.fleetIdValueNew = fleetId;
this.fleetIdData = fleetId;
    }
  }
  async getGeofenceType() {
    await this._vehicleService.getGeofenceType().subscribe((res: any) => {
      this.getTypeList = res
    })
  }

  onSearchChange(value: string) {
    this.geofenceForm.get('address')?.setValue(value);
  }
  singleGeofence: boolean = true;
  bulkGeofence: boolean = false;

  bulkGeofenceData(){
    this.bulkGeofence = true;
    this.singleGeofence = false;
    this.router.navigate(['adlp/admin/admindashboard/geoFenceSetup/bulk-geofence'])

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
      },
      error: (error) => {
        this.errorMessage = 'Error parsing CSV file. Please try again.';
        console.error('CSV parsing error:', error);
      }
    });
  }

isSidebarHidden = false;
toggleSidebar() {
  this.isSidebarHidden = !this.isSidebarHidden;
}


 initMap() {
  // Safe to access google.maps here
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });
}

selectGroupId(): void {
  if (!this.fleetIdData) return;

  const consumerParam = this.user === 'admin' ? this.consumer : this.customConsumer;
  console.log(consumerParam,this.fleetIdData),
  this._vehicleService.getOrganizationSubGroups(this.fleetIdData, consumerParam).subscribe(
    (res: any) => {
      const nestedGroups = res?.groups || [];
      this.groupList = this.flattenGroups(nestedGroups);
    },
    (err) => {
      console.error('Error fetching sub-groups:', err);
    }
  );
}


// Flatten function to preserve hierarchy with indentation
flattenGroups(groups: any[], level: number = 0): any[] {
  let flatList: any[] = [];

  for (const group of groups) {
    // Add current group with level info
    flatList.push({
      id: group.id,
      name: group.name, // Adds visual indentation
      parentGroupId: group.parentGroupId ?? 0,
      level: level
    });

    // Recursively flatten subgroups (if any)
    if (group.subgroups && group.subgroups.length > 0) {
      flatList = flatList.concat(this.flattenGroups(group.subgroups, level + 1));
    }
  }

  return flatList;
}

onGroupIdChange(selected: any): void {
  // Ensure groupIdData is always the ID (number)
  this.groupIdData = typeof selected === 'object' ? selected.id : selected;

  // Also update the form control directly (if needed)
  if (this.geofenceForm && this.geofenceForm.get('groupId')) {
    this.geofenceForm.get('groupId')?.patchValue(this.groupIdData);
  }

  this.fleetService.setFleetId(this.fleetIdData);
  this.getLocationType();
}

getLocationType(){
  if(this.user === 'admin'){
  this.subscription$.add(
    this.subscription$.add(
      this._vehicleService.getLocationTypes(this.customConsumer, this.fleetIdData, this.groupIdData).subscribe(
        (res: string[]) => {
          this.locationType = res;
        },
        err => {
          console.error('Error fetching location types:', err);
        }
      )
  ))
}
  if(this.user === 'role_consumer_fleet'){
    this.subscription$.add(
      this._vehicleService.getLocationTypes(this.customConsumer, this.fleetIdData, this.groupIdData).subscribe(
        (res: string[]) => {
          this.locationType = res;
        },
        err => {
          console.error('Error fetching location types:', err);
        }
      )
    )}
}

onFleetIdChange(){
this.selectGroupId()
this.fleetService.setFleetId(this.fleetIdData);
this.getLocationType()
}

}
