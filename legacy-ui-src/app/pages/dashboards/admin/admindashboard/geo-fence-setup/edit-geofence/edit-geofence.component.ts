import { Component, ElementRef, NgZone, ViewChild, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MapsAPILoader } from '@agm/core';
import { FleetVehiclesService, Maps } from '../../../fleet-vehicles.service';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppService } from 'src/app/app.service';
import { Subscription } from "rxjs";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FleetService } from 'src/app/core/services/users-role.service';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: number
}
declare var google: any;
@Component({
  selector: 'app-edit-geofence',
  templateUrl: './edit-geofence.component.html',
  styleUrls: ['./edit-geofence.component.scss']
})
export class EditGeofenceComponent implements OnInit {
  @ViewChild('search') public searchElementRef: ElementRef;
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
  geofence: any;
  selectConsumerId: void;
  polygon: any;
  selectedLatLng: string = '';
  drawnShape: google.maps.Polygon | google.maps.Circle | google.maps.Rectangle | null = null;
  constructor(private route: ActivatedRoute, private fleetService: FleetService, private modalService: NgbModal, private appService: AppService, private fb: FormBuilder, private http: HttpClient, private _vehicleService: TaxonomyService, apiService: FleetVehiclesService, private router: Router, private mapsAPILoader: MapsAPILoader, private ngZone: NgZone) {
    this.getGeofenceType()
    this.showRole()
    this.route.queryParams.subscribe(params => {
      if (params['data']) {
        const decoded = decodeURIComponent(params['data']);
        this.geofence = JSON.parse(decoded); // 👈 Store it here!
        this.populateForm(this.geofence);
      }
    });
    this.geofenceForm = this.fb.group({
      name: ['', Validators.required],
      locationType: ['', Validators.required],
      geofenceType: [null, Validators.required],
      radius: [null],
      address: [''],
      latlng: [''],
      speedLimit: [null, [Validators.max(199)]],
      consumerId: [null],
      fleetId: [null],
      groupId: [null]
    });
    this.geofenceForm.get('radius')?.valueChanges.subscribe(value => {
      this.onRadiusChangeData(value);
    });
  }
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['data']) {
        const decoded = decodeURIComponent(params['data']);
        const geofence = JSON.parse(decoded);
        this.populateForm(geofence);
      }
    });
    // Subscribe to radius changes
    this.geofenceForm.get('radius')?.valueChanges.subscribe(value => {
      this.selectedRadius = Number(value) || 0;
    });
    this.geofenceForm.get('geofenceType')?.valueChanges.subscribe(value => {
      this.selectedGeofenceType = value;
    });
  }
  populateForm(geofence: any): void {
    this.consumer = geofence.consumerId;
    this.fleetIdData = geofence.fleetId;
    this.groupIdData = geofence.groupId;

    this.geofenceForm.patchValue({
      id: geofence.id,
      name: geofence.name,
      locationType: geofence.locationType,
      geofenceType: geofence.geofenceType,
      radius: geofence.radius,
      address: geofence.address,
      latlng: geofence.geoLocations?.map(loc => `${loc[1]},${loc[0]}`).join(' | ') || '',
      speedLimit: geofence.speedLimit,
      consumerId: geofence.consumerId,
      fleetId: geofence.fleetId,
      groupId: geofence.groupId
    });

    this.geoLocations = geofence.geoLocations ?? [];
    this.selectedGeofenceType = geofence.geofenceType;
    this.latitude = geofence.geoLocations?.[0]?.[1]; // center latitude
    this.longitude = geofence.geoLocations?.[0]?.[0];
    setTimeout(() => this.drawShapeOnMap(), 300);
  }
  onMapReady(map: any): void {
    this.map = map;
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: ['polygon', 'circle', 'rectangle'],
        position: google.maps.ControlPosition.TOP_CENTER,
      },
      polygonOptions: {
        draggable: true,
        editable: true
      },
      circleOptions: {
        draggable: true,
        editable: true
      },
      rectangleOptions: {
        draggable: true,
        editable: true
      }
    });

    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: any) => {
      // ✅ Remove the previous shape
      if (this.drawnShape) {
        this.drawnShape.setMap(null);
      }

      // ✅ Store new shape
      this.drawnShape = event.overlay;

      // ✅ Make it editable and draggable if not already
      event.overlay.setEditable?.(true);
      event.overlay.setDraggable?.(true);
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygonCoords = event.overlay.getPath().getArray();
        this.geoLocations = polygonCoords.map((latLng: any) => [
          latLng.lng(),
          latLng.lat()
        ]);

        const formattedCoords = this.geoLocations.map((pair, index, arr) => {
          const line = `${pair[0]}, ${pair[1]}`;
          return index < arr.length - 1 ? line + ',' : line;
        })
          .join('\n');

        this.geofenceForm.get('latlng')?.setValue(formattedCoords);
        const [lng, lat] = this.geoLocations[0];
        this.getAddress(lat, lng);
      }

      // ✅ Handle Circle
      if (event.type === google.maps.drawing.OverlayType.CIRCLE) {
        const center = event.overlay.getCenter();
        const radius = event.overlay.getRadius();
        const formatted = `${center.lng()}, ${center.lat()}\n;`
        this.geofenceForm.get('latlng')?.setValue(formatted);
        this.geofenceForm.get('radius')?.setValue(radius)
        const lat = center.lat();
        const lng = center.lng();
        this.geoLocations = [[lng, lat]];
        this.getAddress(lat, lng);
      }

      // ✅ Handle Rectangle
      if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
        const bounds = event.overlay.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const nw = new google.maps.LatLng(ne.lat(), sw.lng()); // top-left
        const se = new google.maps.LatLng(sw.lat(), ne.lng()); // bottom-right
        const formatted = `${ne.lng()}, ${ne.lat()}\n ${sw.lng()}, ${sw.lat()}`;
        this.geofenceForm.get('latlng')?.setValue(formatted);

        const lat = ne.lat(); // latitude
        const lng = ne.lng(); // longitude
        const neLat = ne.lat();
        const neLng = ne.lng();
        const swLat = sw.lat();
        const swLng = sw.lng();


        this.geoLocations = [
          [nw.lng(), nw.lat()],
          [ne.lng(), ne.lat()],
          [se.lng(), se.lat()],
          [sw.lng(), sw.lat()],
        ];
        this.getAddress(lat, lng);
      }
    });
  }
  drawShapeOnMap(): void {
    if (!this.map || !this.geoLocations || !this.geoLocations.length) return;
    if (this.drawnShape) {
      this.drawnShape.setMap(null);
    }
    const count = this.geoLocations.length;
    if (count === 1) {
      // 🎯 Draw Circle
      const [lng, lat] = this.geoLocations[0];
      const radius = this.geofenceForm.get('radius')?.value || 50;
      const circle = new google.maps.Circle({
        center: { lat, lng },
        radius,
        map: this.map,
        editable: true,
        draggable: true
      });
      this.drawnShape = circle;
    } else if (count === 4) {
      // 🟥 Draw Rectangle
      const [nw, ne, se, sw] = this.geoLocations;
      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(sw[1], sw[0]),
        new google.maps.LatLng(ne[1], ne[0])
      );
      const rectangle = new google.maps.Rectangle({
        bounds,
        map: this.map,
        editable: true,
        draggable: true
      });
      this.drawnShape = rectangle;
    }
    else if (count > 4) {
      // 🔺 Draw Polygon
      const path = this.geoLocations.map(([lng, lat]) => ({ lat, lng }));
      const polygon = new google.maps.Polygon({
        paths: path,
        map: this.map,
        editable: true,
        draggable: true
      });
      this.drawnShape = polygon;
    }
    const [lng, lat] = this.geoLocations[0];
    this.map.setCenter({ lat, lng });
    this.map.setZoom(12);
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
  onSubmit(geofence: any) {
    const id = this.geofenceForm.value.id;
    const formValue = this.geofenceForm.value;
    const updatedGeofenceData = {
      name: formValue.name,
      type: formValue.geofenceType?.toUpperCase(),
      address: formValue.address,
      locationType: formValue.locationType,
      radius: formValue.radius,
      unit: 'miles',
      speedLimit: formValue.speedLimit,
      fleetId: formValue.fleetId,
      groupId: formValue.groupId,
      consumerId: formValue.consumerId,
      geoLocations: this.geoLocations,
      email: this.loginUser.email
    };
    this._vehicleService.updateGeofenceNew(this.geofence?.id, updatedGeofenceData).subscribe(
      (response) => {
        this.appService.openSnackBar("Geofence updated successfully !", 'Success')
        this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/geofence'])
      },
      (error) => {
        console.error('Error updating geofence:', error);
      }
    );
  }
  errorMessage: any;
  validateBeforeSubmit(modal: any): void {
    // Validate admin and fleet logic
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

    // Trigger form validation
    this.geofenceForm.markAllAsTouched();

    const nameControl = this.geofenceForm.get('name');
    const locationTypeControl = this.geofenceForm.get('locationType');
    const geofenceTypeControl = this.geofenceForm.get('geofenceType');
    const speedLimitControl = this.geofenceForm.get('speedLimit');
    const latLngControl = this.geofenceForm.get('latlng');


if (this.geofenceForm.invalid) {
  if (nameControl?.hasError('required')) {
    this.errorMessage = 'Geofence name is required.';
  } else if (locationTypeControl?.hasError('required')) {
    this.errorMessage = 'Location type is required.';
  } else if (geofenceTypeControl?.hasError('required')) {
    this.errorMessage = 'Geofence type is required.';
  } else if (latLngControl?.hasError('required')) {
    this.errorMessage = 'Create geofence on map.';
  } else if (speedLimitControl?.hasError('max')) {
    this.errorMessage = 'Speed should be less than 200.';
  }
}

    if (this.errorMessage) {
      this.modalService.open(modal, { size: 'sm', centered: true });
    }
    else {
      this.onSubmit('');
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
  onSearchChange(value: string) {
    this.geofenceForm.get('address')?.setValue(value);
  }
  initMap() {
    // Safe to access google.maps here
    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -34.397, lng: 150.644 },
      zoom: 8,
    });
  }
}
