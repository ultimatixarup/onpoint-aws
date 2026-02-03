import { Component, OnInit } from '@angular/core';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import { Router,ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms'
import { RouteOptimzeService } from '../../../route-optimize.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-route-optimization',
  templateUrl: './route-optimization.component.html',
  styleUrls: ['./route-optimization.component.scss'],

})
export class RouteOptimizationComponent implements OnInit {
  tripData: any;
  waypoints: any[] = [];
  deliveryLocationPoint: any[]=[];
  latitudeMap = 40.73061; // default map latitude
  longitudeMap = -73.935242; // default map longitude
  zoom = 12;
  tripDetailId:any = null
i: number;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private routeOptimzeService:RouteOptimzeService,
    private spinner:NgxSpinnerService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {

    this.tripDetailId = this.route.snapshot.paramMap.get('tripDetailId');
    if (this.tripDetailId ) {
      this.spinner.show();
      this.fetchTripData(this.tripDetailId );
     // this.snapWaypointsToRoads();
    } else {
      console.error('Trip Detail ID is missing from the route.');
    }
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

  fetchTripData(tripDetailId: string): void {

    console.log('Fetching trip data for ID:', tripDetailId);
    this.routeOptimzeService.getTripData(tripDetailId).subscribe(
      data => {
        this.tripData = data;
        console.log('Trip Data:', this.tripData); // Debugging purposes

        // Only decode polyline if geometry exists
        if (this.tripData.geometry) {
          this.decodePolyline(this.tripData.geometry);
        } else {
          console.warn('No geometry data found for this trip');
        }

        // Map the delivery locations to waypoints for the map
        this.deliveryLocationPoint = this.tripData.deliveryLocations.map(location => ({
          lat: location.latitude,
          lng: location.longitude,
          label: location.sequence + 1,
          type: location.type

        }));

        if (this.waypoints.length > 0) {
          this.latitudeMap = this.waypoints[0].lat; // Center map on first location
          this.longitudeMap = this.waypoints[0].lng;
        } else if (this.deliveryLocationPoint.length > 0) {
          // If no waypoints from polyline, center on first delivery location
          this.latitudeMap = this.deliveryLocationPoint[0].lat;
          this.longitudeMap = this.deliveryLocationPoint[0].lng;
        }
        this.spinner.hide();
      },
      error => {
        this.spinner.hide();
        console.error('Error fetching trip data:', error);
        this.toastr.error('Error fetching trip data. Please try again.', 'Error');
      }
    );
  }

  drop(event: CdkDragDrop<any[]>) {
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    const isStart = (location) => location.type === 'START';

    // Get previous and current locations
    const previousLocation = this.tripData.deliveryLocations[previousIndex];
    const currentLocation = this.tripData.deliveryLocations[currentIndex];

    // Check if the source is START or if the destination is START
    if (isStart(previousLocation) || isStart(currentLocation)) {
      // Do nothing if trying to drag/move "START"
      return;
    }

    // Move the item in the array only if "START" is not involved
    moveItemInArray(this.tripData.deliveryLocations, previousIndex, currentIndex);

    // Update the sequence numbers after rearrangement
    this.tripData.deliveryLocations.forEach((location, index) => {
      location.sequence = index;
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
    this.spinner.show();

    // Handle saving and navigation logic here
    const deliveryLocations = this.tripData.deliveryLocations;
    console.log('Saving route with updated sequence:', deliveryLocations);
    console.log('Saving route and proceeding to assign driver');

    // Find the indices of the START and END locations
    const startIndex = deliveryLocations.findIndex(location => location.type === 'START');
    const endIndex = deliveryLocations.findIndex(location => location.type === 'END');
    // Update the type of locations in between START and END to DELIVERY
    if (startIndex !== -1 && endIndex !== -1) {
        for (let i = startIndex + 1; i < deliveryLocations.length; i++) {
            if (deliveryLocations[i]) {
                deliveryLocations[i].type = 'DELIVERY';
            }
        }
    }
   console.log("deliveryLocations",deliveryLocations)
    // Change the type of the last location in the array to END
    if (deliveryLocations.length > 0) {
        deliveryLocations[deliveryLocations.length - 1].type = 'END';
    }

    // Log updated locations for debugging
    console.log('Updated delivery locations:', deliveryLocations);

    this.routeOptimzeService.updateSequence(deliveryLocations, this.tripData.id)
        .subscribe(response => {
            this.spinner.hide();
            console.log('Sequence updated:', response);
            this.toastr.success('Route sequence saved successfully!', 'Success'); // Show success message
            this.router.navigate(['adlp/admin/admindashboard/trip-planning/pre-optimization-trips']);
        }, error => {
            this.spinner.hide();
            if (error.error && error.error.apierror) {
                const apiError = error.error.apierror;
                this.toastr.error(apiError.message, 'Error');
            } else {
                this.toastr.error('Error updating route sequence. Please try again.', 'Error'); // Show error message
            }
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
  // getMarkerUrl(label: number): string {
  //   const svg = `
  //     <svg width="50" height="50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ee8f31"/>
  //       <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="8" fill="white" text-anchor="middle" dy=".3em">
  //         ${label}
  //       </text>
  //     </svg>
  //   `;
  //   return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  // }
  // getMarkerUrl(label: string): string {
  //   switch (label) {
  //     case 'START':
  //     return 'assets/images/start.png'; // Add your custom START marker URL
  //     case 'END':
  //       return 'assets/images/end_location.png';   // Add your custom END marker URL
  //     case 'DELIVERY':
  //     default:
  //       return 'assets/images/locaiton-icon-green.png'; // Add your custom DELIVERY marker URL
  //   }
  // }
  getMarkerUrl(label: number): string {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#FF0000"/>
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="12" dy=".3em">${label}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
}
