import { Component, OnInit, ViewChild } from '@angular/core';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import { Router,ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms'
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription, of } from 'rxjs';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { RouteOptimzeService } from '../../../../route-optimize.service';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
declare var bootstrap: any;
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-trip-live',
  templateUrl: './trip-live.component.html',
  styleUrls: ['./trip-live.component.scss']
})
export class TripLiveComponent implements OnInit {
  tripData: any;
  subscription$: Subscription = new Subscription();
  interval: any;
  waypoints: any[] = [];
  deliveryLocationPoint: any[]=[];
  selectedLocation: any = {};
  start_end_mark = [];
  latitude = 40.7128;
  longitude = -74.0060;
  currentAddres: any;
  firstAddressPart: any;
  secondAddressPart: any;
  @ViewChild('nodatafound') nodatafound: any
  VIN: string;
  radius = 30;
  // startInterval() {
  //   setTimeout(() => {
  //     this.intervalTme()
  //   }, 10000)
  // }
  ngOnDestroy(): void {
    // if (this.subscription$) {
    //   this.subscription$.unsubscribe()
    // }
    // if (this.interval) {
    //   clearInterval(this.interval)
    // }
  }
  locations: any[] = [
    {
      id: 2951,
      sequence: 0,
      name: 'John Doe',
      latitude: 40.74979, // Starting location
      longitude: -73.80294,
      type: 'START',
      isMoving: true, // Example property to indicate movement
      radius: 200,
      fillOpacity: 0.35,
      strokeOpacity: 0.8,
      speed: 65,  // Speed in km/h
      vin: '1HGCM82633A004352',  // Vehicle Identification Number
      driverName: 'John Doe',
      vehicleName: 'Honda Civic'
    },

  ];

  proofs = [

    { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' } // Example video
  ];
  selectedProof: { type: 'image' | 'video'; url: string } | null = null;
  latitudeMap = 40.73061; // default map latitude
  longitudeMap = -73.935242; // default map longitude
  zoom = 12;
  tripDetailId:any = null;
  i: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private routeOptimzeService:RouteOptimzeService,
    private spinner:NgxSpinnerService,
    private dashboardservice: TaxonomyService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {

    this.tripDetailId = this.route.snapshot.paramMap.get('tripDetailId');
    if (this.tripDetailId ) {
      this.spinner.show();
      this.fetchTripData(this.tripDetailId );
      // setInterval(() => {
      //   this.updateLiveLocations();
      // }, 1000);
    //  setInterval(() => {
    //   this.vehicleList('1G1FZ6S04L4134161');
    //  },6000);

     // this.snapWaypointsToRoads();
    } else {
      console.error('Trip Detail ID is missing from the route.');
    }
  }

  getLiveTrackingLocations() {
    return (this.locations);
  }
   decodePolyline(polyline) {

    let index = 0, len = polyline.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = polyline.charCodeAt(index++) - 63; // 63 is the ASCII value for '?'
            result |= (b & 0x1f) << shift; // Extract 5 bits at a time
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); // Decode latitude
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = polyline.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); // Decode longitude
        lng += dlng;

       this.waypoints.push({ lat: lat / 1e5, lng: lng / 1e5 }); // Convert to decimal
    }
}

showProof(proof) {
  this.selectedProof = proof; // Set the selected proof
  const modalElement = document.getElementById('proofModal');
  // this.routeOptimzeService.getProofDetails(stopId, tripId).subscribe(
  //   (response) => {
  //     this.selectedProof = response; // Assume response contains proof details
  //     this.openModal(); // Open the modal to show proof
  //   },
  //   (error) => {
  //     console.error('Error fetching proof details:', error);
  //   }
  // );
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}
  fetchTripData(tripDetailId: string): void {

    console.log('Fetching trip data for ID:', tripDetailId);
    this.routeOptimzeService.getTripData(tripDetailId).subscribe(
      data => {
        this.tripData = data;
        console.log('Trip Data:', this.tripData); // Debugging purposes

        // Check if geometry exists before decoding
        if (this.tripData.geometry) {
          this.decodePolyline(this.tripData.geometry);
        }

        // Map the delivery locations to waypoints for the map
        if (this.tripData.deliveryLocations && this.tripData.deliveryLocations.length > 0) {
          this.deliveryLocationPoint = this.tripData.deliveryLocations.map(location => ({
            lat: location.latitude,
            lng: location.longitude,
            label: location.sequence,
            type: location.type
          }));
        }

        if (this.waypoints.length > 0) {
          this.latitudeMap = this.waypoints[0].lat; // Center map on first location
          this.longitudeMap = this.waypoints[0].lng;
        }

        this.spinner.hide();
      },
      error => {
        console.error('Error fetching trip data:', error);
        this.spinner.hide(); // Hide spinner on error
        // Optionally show error message to user
        alert('Failed to load trip data. Please check if the trip exists or try again later.');
      }
    );
  }

  drop(event: CdkDragDrop<any[]>) {
    // Ensure "START" and "END" locations are not moved
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    const isStartOrEnd = (location) => location.type === 'START' || location.type === 'END';

    // Check if either the source or destination is START or END
    const previousLocation = this.tripData.deliveryLocations[previousIndex];
    const currentLocation = this.tripData.deliveryLocations[currentIndex];

    if (isStartOrEnd(previousLocation) || isStartOrEnd(currentLocation)) {
      // Do nothing if trying to drag/move "START" or "END"
      return;
    }

    // Move only if both previous and current are allowed to be moved
    moveItemInArray(this.tripData.deliveryLocations, previousIndex, currentIndex);

    // Update sequence numbers
    this.tripData.deliveryLocations.forEach((location, index) => {
      location.sequence = index + 1;
    });

    console.log('Reordered deliveryLocations:', this.tripData.deliveryLocations);
  }

  onSubmit() {
    // Handle form submission logic here
    console.log('Saving route with updated sequence:', this.tripData.deliveryLocations);

    // Navigate to a different route after saving
   // this.router.navigate(['/adlp/admin/admindashboard/trip-planning']);
  }
  saveAndNext() {
    // Handle saving and navigation logic here
    console.log('Saving route with updated sequence:', this.tripData.deliveryLocations);
    console.log('Saving route and proceeding to assign driver');
    this.routeOptimzeService.updateSequence(this.tripData.deliveryLocations,this.tripData.id)
    .subscribe(response => {
      console.log('Sequence updated:', response);
      this.router.navigate(['adlp/admin/admindashboard/trip-planning/pre-optimization-trips']);
    }, error => {
      console.error('Error updating sequence:', error);
    });
    // Navigate to the next page
    //this.router.navigate(['/adlp/admin/admindashboard/trip-planning/assign-trip-driver']);
  }
  onOptimizeTrip() {

    this.routeOptimzeService.getOptimizedTrip(this.tripDetailId).subscribe(
      response => {
        console.log('Optimization Response:', response);
        // Handle the response as needed
      },
      error => {
        console.error('Error optimizing trip:', error);
        // Handle error as needed
      }
    );
  }
  getMarkerUrl(label: number): string {
    let color;

    if (label === 1) {
      // Start Address - Green
      color = '#2CA87F';
    } else if (label === 999) {
      // End Address - Blue
      color = '#007BFF';
    } else {
      // Delivery Address - Coral/Red
      color = '#FF0000';
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="${color}"/>
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="12" dy=".3em">${label}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  getLiveLocationMarkerUrl(liveLocation: any): string {
    if (liveLocation.isMoving) {
      // Wave animation for moving locations
      const waveSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
          <!-- Outer circle for the wave/ripple effect -->
          <circle cx="30" cy="30" r="10" fill="none" stroke="rgba(0, 123, 255, 0.5)" stroke-width="2">
            <animate attributeName="r" from="10" to="30" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>

          <!-- Inner marker icon -->
          <circle cx="30" cy="30" r="12" fill="white" stroke="#007BFF" stroke-width="2"/>
          <image href="assets/images/icons/icon_live.png" x="18" y="18" height="24" width="24"/>
        </svg>
      `;

      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(waveSvg)}`;
    } else {
      // Return standard marker for stationary locations
      return 'assets/images/icons/icon_live.png';
    }
  }


  updateLiveLocations() {
    this.locations.forEach(location => {
      if (location.isMoving) {
        location.latitude += 0.0001; // Simulate north movement
        location.longitude += 0.0001; // Simulate east movement
      }
    });
  }
  focusOnLocation(location: any) {
    console.log(location);
    this.latitudeMap = location.latitude; // Set latitude from the clicked location
    this.longitudeMap = location.longitude; // Set longitude from the clicked location
    this.zoom = 17; // Optional: Zoom in on the selected location
  }
  // getLiveLocationMarkerUrl(liveLocation: any): string {
  //   if (liveLocation.isMoving) {
  //     // Icon for moving locations
  //     return 'https://maps.google.com/mapfiles/kml/shapes/arrow.png';
  //   } else {
  //     // Icon for stationary locations
  //     return 'https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png';
  //   }
  // }


  vehicleList(vin?, colorCode?) {
    this.spinner.show()
    this.subscription$.add(
      this.dashboardservice.getLiveVehicle('','', vin, '').subscribe((res: any) => {
        //this.spinner.hide()
        this.start_end_mark = res
        console.log(this.start_end_mark);
        if (this.start_end_mark?.length > 0) {
          this.latitude = this.start_end_mark[0]?.endLat
          this.longitude = this.start_end_mark[0]?.endLong
             // Determine the trip status and set the marker icon
          const eventType = this.start_end_mark[0]?.eventType; // trip_start, trip_ongoing, trip_end
          const markerIcon = this.getTripStatusIcon(eventType);
        } else {
          this.noDataFounds(this.nodatafound)
        }
      }, err => {
        this.spinner.hide()
      })
    )
  }
  getTripStatusIcon(status: string): string {
    switch (status) {
        case 'trip_start':
            return 'https://maps.google.com/mapfiles/kml/shapes/arrow.png'; // Icon for trip start
        case 'trip_ongoing':
            return 'https://maps.google.com/mapfiles/kml/shapes/road.png'; // Icon for trip ongoing
        case 'trip_end':
            return 'https://maps.google.com/mapfiles/kml/shapes/flag.png'; // Icon for trip end
        default:
            return ''; // Default icon if needed
    }
}
  noDataFounds(nodatafound) {
    if (this.start_end_mark?.length <= 0) {
      this.modalService.open(nodatafound, { centered: true })
    }
  }
  // intervalTme() {
  //   this.interval = setInterval(() => {
  //     this.vehicleList(this.VIN)
  //   }, 10000);
  // }
}
