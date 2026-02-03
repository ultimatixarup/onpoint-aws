import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, Subscription } from 'rxjs';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';

@Component({
  selector: 'app-current-trip-history',
  templateUrl: './current-trip-history.component.html',
  styleUrls: ['./current-trip-history.component.scss']
})
export class CurrentTripHistoryComponent implements OnInit {
  mapStyles: any = [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        { color: "#DBECF3" }, // Updated water color
        { lightness: 17 },
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
      stylers: [{ color: "#E2E2E4" }, { lightness: 10 }, { weight: 0.2 }],
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
  subscription$: Subscription = new Subscription()
  tripId: any;
  model: any
  waypoints: any = []
  start_end_mark = []
  zoom: number = 10;
  latitude = 40.7128;
  longitude = -74.0060;
  currentlatitude: any;
  currentlongitude: any;
  defaultSpeed: number = 0;
  tripHistoryList: any = [];
  startPosition: number = 1;
  monthName: any;
  months = [
    "Jan", "Feb", "Mar", "April", "May", "June",
    "July", "Aug", "Sept", "Oct", "Nov", "Dec"
  ];
  startingAddress: any;
  endAddress: any;
  currentDateTime: any;
  startDateTime: any;
  VIN: any;
  odometer: any;
  fuelLevel: any;
  cxTripDuration: any;
  cxTripDistance: any;
  fuelConsumed: any;
  mileage: any;
  defaultVal: number = 0;
  odometerVal: number = 0;
  mileageVal: number = 0;
  fuelLevelval: number = 0;
  tripDurationnVal: number = 0
  tripDistanceVal: number = 0;
  fuelConsumedval: number = 0;
  make: any
  batteryPercentage: any;
  batteryPercentageVal: number = 0;
  makeVal: any
  frontRightTirePressureVal: number = 0;
  frontRightTirePressure: any;
  frontLeftTirePressure: any;
  rearLeftTirePressure: any;
  rearRightTirePressure: any;
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetIdValueNew: any;
  alerts: any;
  alias: any;
  driver_name: any;
  constructor(private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService, private activatedRoute: ActivatedRoute, private router: Router, private datePipe: DatePipe) {
    this.getParams()
  }

  ngOnInit(): void {
    this.showRole()
   }

   convertToCDT(dateTime: string): string {
    if (!dateTime) return '';
    const utcDateTime = new Date(dateTime);
    const cdtOffset = -5 * 60;
    const cdtDateTime = new Date(utcDateTime.getTime() + (cdtOffset * 60 * 1000));
    cdtDateTime.setMinutes(cdtDateTime.getMinutes());
    const cdtHours = cdtDateTime.getHours().toString().padStart(2, '0');
    const cdtMinutes = cdtDateTime.getMinutes().toString().padStart(2, '0');
    return ` ${cdtHours}:${cdtMinutes}`;
  }


  // Current Trip to Current History
  getParams() {
    this.activatedRoute.queryParams.subscribe((param: any) => {
      if (param.tripId && param.VIN) {
        this.tripId = param.tripId
        this.VIN = param.VIN
        this.historyList()
      } else {
        this.router.navigate(['adlp/admin/admindashboard/tracking'])
      }
    })
  }

convertUtcToCst(utcTimeStr: string): any {
  if(utcTimeStr) {
  // Parse the input UTC time string to a JavaScript Date object
  const utcDate = new Date(utcTimeStr);

  // Calculate the offset for CDT (UTC-5)
  const offsetCdt = -5 * 60; // Offset in minutes

  // Apply the offset to get the CDT time
  const cdtDate = new Date(utcDate.getTime() + offsetCdt * 60000);

  // Return the formatted CDT time as a string (adjust format as needed)
  return cdtDate
  }
  }


showRole() {
  let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
  this.user = JSON.parse(userRolLogin);
  this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
  this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
  let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
  this.customConsumer = JSON.parse(customConsumers);
  if(this.user === 'role_user_fleet'){
    let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
    this.fleetIdValueNew = JSON.parse(fleetId);
    }
}
  // Trip in Reverse Order
  historyList() {
    this.spinner.show();
    this.subscription$.add(
      this.dashboardservice.liveTripHistory(this.tripId).subscribe(
        (res: any) => {
          this.spinner.hide();
          if (res) {
            this.alerts = res.alerts || [];
            this.getStartingAddressDetail(
              res[0]?.latitude,
              res[0]?.longitude,
              true
            );
            this.reverseData(res);
            // this.getStartingAddressDetail(res[res?.length-1]?.latitude,res[res?.length-1]?.longitude,false)
            this.startDateTime = res[0];
            // this.currentDateTime = res[res?.length-1]
          }

          res.map((item: any) => {
            if (item?.latitude) {
              this.waypoints.push(item);
            }
          });
          // this.waypoints = res
          this.start_end_mark.push(this.waypoints[0]);
          this.start_end_mark.push(this.waypoints[this.waypoints?.length - 1]);
          this.latitude = this.waypoints[this.waypoints?.length - 1]?.latitude;
          this.longitude =
            this.waypoints[this.waypoints?.length - 1]?.longitude;
          // this.calculateData(res)
          this.addMarkers();
        },
        (err) => {
          this.spinner.hide();
        }
      )
    );
  }


  addMarkers() {
    this.start_end_mark = [];

    // Add start point marker
    if (this.waypoints.length > 0) {
      this.start_end_mark.push({
        latitude: this.waypoints[0].latitude,
        longitude: this.waypoints[0].longitude,
        type: "start",
        iconUrl: {
          url: "./assets/images/START_POINT.svg",
          scaledSize: { width: 20, height: 20 },
        },
        anchor: { x: 8, y: 8 },
      });
    }

    // Add alert markers from the alerts array
    if (this.waypoints.length > 0 && this.alerts?.length > 0) {
      this.alerts.forEach((alert: any) => {
        if (alert.initialLatitude && alert.initialLongitude) {
          // Determine the alert icon based on alert description
          let alertIcon = "./assets/images/default_alert.svg"; // Default alert icon
          switch (alert.alertDescription) {
            case "harsh_braking":
              alertIcon = "./assets/images/HBTH.svg";
              break;
            case "harsh_acceleration":
              alertIcon = "./assets/images/Harsh_Acceleration_pin.svg";
              break;
            case "harsh_cornering":
              alertIcon = "./assets/images/Harsh_Cornering_pin.svg";
              break;
            case "night_driving":
              alertIcon = "./assets/images/Night_Driving_pin.svg";
              break;
            case "over_speeding":
              alertIcon = "./assets/images/Over_Speeding_pin.svg";
              break;
          }

          // Push the alert marker to the markers array
          this.start_end_mark.push({
            latitude: alert.initialLatitude,
            longitude: alert.initialLongitude,
            type: "alert",
            iconUrl: {
              url: alertIcon,
              scaledSize: { width: 45, height: 55 },
            },
            anchor: { x: 8, y: 8 },
          });
        }
      });
    }

    // Add end point marker
    if (this.waypoints.length > 1) {
      const lastPoint = this.waypoints[this.waypoints.length - 1];
      this.start_end_mark.push({
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
        type: "end",
        iconUrl: {
          url: "./assets/images/END_POINT.svg",
          scaledSize: { width: 20, height: 20 },
        },
        anchor: { x: 8, y: 8 },
      });
    }
  }



  async calculateData(data) {
    for (let index = 0; index < data.length; index++) {
      const record = data[index];
      if (record.speed === 0 && this.defaultSpeed === 0) {
        this.defaultSpeed = 1;
        if (this.startPosition === 1) {
          this.startPosition++;
          await this.getAddress(record?.latitude, record?.longitude).subscribe(
            (address) => {
              record.address = address;
            },
            (error) => {}
          );
          this.tripHistoryList.push(record);
        } else {
          await this.getAddress(
            data[index - 1]?.latitude,
            data[index - 1]?.longitude
          ).subscribe(
            (address) => {
              data[index - 1].address = address;
            },
            (error) => {}
          );
          this.tripHistoryList.push(data[index - 1]);
        }
      } else if (record.speed > 0) {
        this.defaultSpeed = 0;
      }
    }
    this.tripHistoryList.reverse();
  }
reverseData(res) {
    let result = res
    for (let i = res?.length - 1; i > 0; i--) {
      if (result[i].latitude && this.defaultVal == 0) {
        this.defaultVal = 1
        this.getStartingAddressDetail(result[i].latitude, result[i].longitude, false)
        this.currentDateTime = result[i]
      }
      if (result[i]?.odometer && this.odometerVal == 0) {
        this.odometerVal = 1; this.odometer = result[i]?.odometer
      }
      if (result[i]?.fuelLevel && this.fuelLevelval == 0) {
        this.fuelLevelval = 1;
        this.fuelLevel = result[i]?.fuelLevel
      }
      if (result[i]?.fuelConsumed && this.fuelConsumedval == 0) {
        this.fuelConsumedval = 1; this.fuelConsumed = result[i]?.fuelConsumed
      }
      if (result[i]?.cxTripDuration && this.tripDurationnVal == 0) {
        this.tripDurationnVal = 1; this.cxTripDuration = result[i]?.cxTripDuration
      }
      if (result[i]?.cxTripDistance && this.tripDistanceVal == 0) {
        this.tripDistanceVal = 1; this.cxTripDistance = result[i]?.cxTripDistance
      }
      if (result[i]?.mileage && this.mileageVal == 0) {
        this.mileageVal = 1; this.mileage = result[i]?.mileage
      }
      if (result[i]?.batteryPercentage && this.batteryPercentageVal == 0) {
        this.batteryPercentageVal = 1; this.batteryPercentage = result[i]?.batteryPercentage
      }
      if (result[i]?.frontRightTirePressure && this.frontRightTirePressureVal == 0) {
        this.frontRightTirePressureVal = 1
        this.frontRightTirePressure = result[i]?.frontRightTirePressure
        this.frontLeftTirePressure = result[i]?.frontLeftTirePressure
        this.rearLeftTirePressure = result[i]?.rearLeftTirePressure
        this.rearRightTirePressure = result[i]?.rearRightTirePressure
      }
      if (result[i]?.make) {
        this.make = result[i]?.make
      }
      if (result[i]?.model) {
        this.model = result[i]?.model
      }
      if (result[i]?.alias) {
        this.alias = result[i]?.alias
      }
      if (result[i]?.driverName) {
        this.driver_name = result[i]?.driverName
      }
    }
}


  // Date Format
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'dd');
  }

  // Month Format
  formatMonthName(dateString: string): string {
    const date = new Date(dateString);
    const monthIndex = date.getMonth();
    return this.months[monthIndex]
  }


  // Time Format
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const utcDateString = date.toISOString();
    return this.datePipe.transform(utcDateString, 'HH:mm:ss', 'UTC') ?? '';
  }

  // Starting Address
  getStartingAddressDetail(lat, lng, isAddress) {
    this.spinner.show()
    this.dashboardservice.getAddressLatLng(lat, lng).subscribe((res: any) => {
      this.spinner.hide()
      if (isAddress) {
        this.startingAddress = res?.results[0]?.formatted_address
      } else {
        this.endAddress = res?.results[0]?.formatted_address
      }
    }, err => {
      this.spinner.hide()
    })
    // )

  }

  refreshTrip() {
    this.waypoints = [];
    this.start_end_mark = [];
    this.zoom = 12;
    this.latitude = 40.7128;
    this.longitude = -74.006;
    this.currentlatitude = null;
    this.currentlongitude = null;
    this.defaultSpeed = 0;
    this.tripHistoryList = [];
    this.startPosition = 1;
    this.endAddress = null;
    this.currentDateTime = null;
    this.odometer = null;
    this.fuelLevel = null;
    this.cxTripDuration = null;
    this.cxTripDistance = null;
    this.mileage = null;
    this.fuelConsumed = null;
    this.historyList();
  }

  // Get Address
  getAddress(lat: number, lng: number): Observable<string> {
    this.spinner.show();
    return new Observable<string>((observer) => {
      this.dashboardservice.getAddressLatLng(lat, lng).subscribe(
        (res: any) => {
          this.spinner.hide();
          const address = res?.results[0]?.formatted_address;
          if (address) {
            observer.next(address);
            observer.complete();
          } else {
            observer.error('No address found');
          }
        },
        err => {
          this.spinner.hide();
          observer.error(err);
        }
      );
    });
  }

  // VIN Mask Numebr
  maskVinNumber(_vinNumber: any) {
    var mask = "";
    if (_vinNumber) {
      for (let i = 1; i <= _vinNumber.length - 4; i++) {
        mask += "*";
      }
      return mask + _vinNumber.slice(14, 22);
    }
    else {
      return null;
    }
  }

  // Go Back to Live Tracking
  backlivetrip() {
    if (this.tripId) {
      this.router.navigate(['/adlp/admin/admindashboard/livetracking'], {
        queryParams: { tripId: this.tripId, vin: this.VIN, lat: this.latitude, lng: this.longitude }
      })
    }
  }

  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    },10);
    // this.updateDasboard()
  }


  ngOnDestroy() {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
  }
}
