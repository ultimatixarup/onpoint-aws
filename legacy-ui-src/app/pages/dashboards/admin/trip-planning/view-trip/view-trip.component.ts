import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouteOptimzeService } from '../../../route-optimize.service';
import { NgxSpinnerService } from 'ngx-spinner';
import moment from 'moment';
@Component({
  selector: 'app-view-trip',
  templateUrl: './view-trip.component.html',
  styleUrls: ['./view-trip.component.scss']
})
export class ViewTripComponent implements OnInit {
  tripData: any = null; // This will hold your fetched trip data
  deliveryLocations: any[] = []; // Array to store delivery locations
  deliveryLocationsNew: any[] = [];
  haltTime:any; //
  tripDate:any;
  tripTime:any;
  isLoading: boolean = false;
  availableDrivers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Michael Johnson' },
    { id: 4, name: 'Emily Davis' },
    { id: 5, name: 'David Martinez' }
  ];
  tripId:any

  constructor(private route: ActivatedRoute,
     private router: Router,
     private routeOptimzeService:RouteOptimzeService,
     private spinner: NgxSpinnerService,)
     { }

  ngOnInit(): void {
    const tripDetailId = this.route.snapshot.paramMap.get('tripDetailId');
    this.tripId=tripDetailId;
    if (tripDetailId) {
      this.spinner.show();
      this.fetchTripData(tripDetailId);
    } else {
      console.error('Trip Detail ID is missing from the route.');
    }
  }
  fetchTripData(tripDetailId: string): void {
    console.log('Fetching trip data for ID:', tripDetailId);
    this.isLoading = true;
    this.spinner.show(); // Show spinner while loading data
    this.routeOptimzeService.getTripData(tripDetailId).subscribe(
      data => {
        console.log('Trip data received:', data);
        this.tripData = data;
        this.haltTime = this.tripData?.defaultHaltTime || 0;
        this.deliveryLocations = this.tripData?.deliveryLocations || [];
        this.calculateETA(); // Call the function to calculate ETA
        this.isLoading = false;
        this.spinner.hide();

        // Convert tripStartDateTime to local time
        if (this.tripData?.tripStartDateTime) {
          const tripStartDate = new Date(this.tripData.tripStartDateTime); // Ensure it's a Date object
          this.tripDate = tripStartDate.toISOString().split('T')[0]; // Date in yyyy-mm-dd format
          this.tripTime = tripStartDate.toTimeString().split(' ')[0];
          console.log('Trip time:', this.tripTime);
        }

        // Convert timeOfArrival and timeOfDeparture for each delivery location
        this.deliveryLocationsNew = this.deliveryLocations.map(location => ({
          ...location,
          localTimeOfArrival: this.convertToTimeZone(location.timeOfArrival, this.tripData?.timeZone),
          localTimeOfDeparture: this.convertToTimeZone(location.timeOfDeparture, this.tripData?.timeZone),
        }));

      },
      error => {
        console.error('Error fetching trip data:', error);
        this.isLoading = false;
        this.spinner.hide();
        // You might want to show an error message to the user here
      }
    );
  }


  // Method to convert UTC time to local time based on the timeZone
 // Method to convert UTC time to local time based on the timeZone
 convertToLocalTime(utcTime: string): string {
  const date = new Date(utcTime); // Convert UTC string to Date object

  // Format the date and time
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short', // 'short' gives you the abbreviated month
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true, // Use 12-hour format
    timeZone: this.tripData.timeZone, // Use the trip's timeZone
    timeZoneName: 'short', // Include timezone abbreviation (e.g., CST)
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const formattedDate = formatter.format(date);

  return formattedDate; // Returns in format: Feb 5, 2025, 8:27 PM (CST)
}


    // Function to calculate ETA
    calculateETA(): void {
      if (!this.tripData || !this.tripData.tripStartDateTime || this.deliveryLocations.length === 0) return;

      let currentETA = new Date(this.tripData.tripStartDateTime); // Starting time
      console.log('Initial ETA:', currentETA);

      this.deliveryLocations.forEach((location, index) => {
        if (index === 0) {
          // For the first location (Start location), add the default halt time
          const defaultHaltTime = this.tripData.defaultHaltTime || 0; // Default halt time for the start location
          currentETA.setMinutes(currentETA.getMinutes()); // Add halt time to the start time
        } else {
          // For subsequent locations, calculate travel time from the previous location
          const travelTime = this.getTravelTime(index - 1); // Get travel time for the previous index
          console.log(travelTime);
         // const previousHaltTime = this.deliveryLocations[index - 1].haltTime || this.tripData.defaultHaltTime; // Get the previous location's halt time

          // Update the current ETA with previous location's halt time and travel time
          currentETA.setMinutes(currentETA.getMinutes()  + travelTime);
        }

        // Save ETA for the current location
        location.etaTime = new Date(currentETA); // Store ETA for the current location
        console.log(`ETA for location ${index + 1} (${location.name}):`, location.etaTime);

        // Additional halt time for the current location

        //currentETA.setMinutes(currentETA.getMinutes() +); // Add current location's halt time to the current ETA
      });
    }
    getTravelTime(index: number): number {
      const etaInSeconds = this.deliveryLocations[index].nextNodeEta || 0; // Fallback to 0 if nextNodeEta is null or undefined

      // Get the halt time for the current location
      const haltTimeAddress = this.deliveryLocations[index].haltTime || this.tripData.defaultHaltTime;

      // Convert seconds to minutes
      const etaInMinutes = Math.ceil(etaInSeconds / 60);
      console.log(haltTimeAddress, etaInMinutes);
      console.log("eta calculation took ");
      console.log(etaInMinutes + haltTimeAddress);

      // Return the total time (ETA + halt time)
      return etaInMinutes + haltTimeAddress; // Total time in minutes
    }


  getDriverName(driverId: number | null): string {
    if (driverId === null) {
      return 'No Driver Assigned';
    }
    const driver = this.availableDrivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  }
   // Method to combine date, time, and time zone
   getFormattedTripStart(): string {
    if (!this.tripData || !this.tripData.tripStartDateTime || !this.tripData.timeZone) return '';

    const tripStartDate = new Date(this.tripData.tripStartDateTime);

    // Formatting the date and time based on the time zone
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZone: this.tripData.timeZone, // Use the time zone from the trip data
    };

    const formattedDateTime = new Intl.DateTimeFormat('en-US', options).format(tripStartDate);

    // Include the time zone in the formatted string
    return `${formattedDateTime} (${this.tripData.timeZone})`;
  }
  convertToTimeZone(utcDateStr, timeZoneAbbr) {
    console.log(utcDateStr, "Received Date String");
    console.log(timeZoneAbbr, "Received TimeZone");

    // Return 'NA' if utcDateStr is null, undefined, or an empty string
    if (!utcDateStr || !timeZoneAbbr) {
        console.error("Invalid Input: utcDateStr or timeZoneAbbr is null or empty");
        return "N/A";
    }

    // Ensure the input is correctly formatted as UTC
    let utcDate;
    try {
      if (utcDateStr.includes("Z") || utcDateStr.endsWith("+00:00")) {
          utcDate = new Date(utcDateStr); // Already in UTC
      } else {
          utcDate = new Date(`${utcDateStr}Z`); // Force UTC
      }

      // Check if the date is valid
      if (isNaN(utcDate.getTime())) {
          console.error("Invalid UTC Date:", utcDateStr);
          return "N/A";
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      return "N/A";
    }

    // Map timezone abbreviations to IANA timezone names
    const timeZoneMap = {
        "PST": "America/Los_Angeles",
        "PDT": "America/Los_Angeles",
        "EST": "America/New_York",
        "EDT": "America/New_York",
        "CST": "America/Chicago",
        "CDT": "America/Chicago",
        "MST": "America/Denver",
        "MDT": "America/Denver"
    };

    const ianaTimeZone = timeZoneMap[timeZoneAbbr] || timeZoneAbbr; // Default to given timezone if not mapped

    try {
      // Format the date using the correct timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: ianaTimeZone,
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short'
      });

      return formatter.format(utcDate);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
}



}
