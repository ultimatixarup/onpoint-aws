import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';

@Component({
  selector: 'app-live-tracking',
  templateUrl: './live-tracking.component.html',
  styleUrls: ['./live-tracking.component.scss']
})
export class LiveTrackingComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  loginUser: any;
  user: any;
  vin: String;
  multiRoles: any;
  customConsumer: any;
  consumer: any = 'All'
  start_end_mark = []
  zoom: number = 8;
  latitude = 40.7128;
  longitude = -74.0060;
  tripId: any;
  isLive: boolean = false;
  alertTip: any;
  LatLng: any;
  currentAddres: any;
  firstAddressPart: any;
  secondAddressPart: any;
  waypoints = []
  speedVal: any;
  selectedVins: string;
  snappedWaypoints: any[];
  alertMarkers: any;
  mapStyles: any = [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        { color: "#DBECF3" },
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
      stylers: [
        { color: "#ffffff" },
        { weight: 0.5 },
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
  alias: any;
  driver_name: any;
  currentMapType: string = 'roadmap';
  constructor(public http: HttpClient, private dashboardservice: TaxonomyService, private activatedRoute: ActivatedRoute, private router: Router) { }

  toggleMapType(): void {
    this.currentMapType = this.currentMapType === 'roadmap' ? 'satellite' : 'roadmap';
  }

  ngOnInit() {
    this.showRole();
    this.getParams()
  }
  // Show Role
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }
  // Tracking to Live Tracking Param
  getParams() {
    this.activatedRoute.queryParams.subscribe((param: any) => {
      if (param.tripId) {
        this.tripId = param.tripId
        this.zoom = 13
        let data: any = {
          endLat: Number(param.lat),
          endLong: Number(param.lng),
          speed: Number(param?.speed),
          acceleration: param?.acceleration,
          vin: param?.vin,
          alias: param?.alias,
          driverName: param?.driverName
        }
        this.vin = param?.vin;
        this.alias = param?.alias;
        this.driver_name = param?.driverName;
        this.LatLng = data
        this.latitude = Number(param.lat)
        this.longitude = Number(param.lng)
        this.getStremingData()
      } else {
        this.router.navigate(['adlp/admin/admindashboard/tracking'])
      }
    })
  }
  // Streaming Live Data
  getStremingData() {
    let dataReceived = false;
    const timeout = setTimeout(() => {
      if (!dataReceived) {
        console.log('Data not found within 60 seconds');
      }
    }, 60000);
    this.dashboardservice.getServerSentEvent(this.vin, this.tripId,).subscribe((res: any) => {
      this.isLive = true
      let data = JSON.parse(res?.data)
      this.getLiveData(data)
      if (data) {
        this.alertTip = data
        this.getAddress(data)
        clearTimeout(timeout);
      }
    }, err => {
      clearTimeout(timeout);
    })
  }
  // Latitude and Longitude on Map
  // getLiveData(liveData) {
  //   this.LatLng = liveData;
  //   if (liveData && liveData.cxTelemetryDataList) {
  //     liveData.cxTelemetryDataList.forEach((data) => {
  //       this.latitude = data.latitude;
  //       this.longitude = data.longitude;
  //       if (this.latitude && this.longitude) {
  //         this.waypoints.push({ lat: this.latitude, lng: this.longitude });
  //       }
  //     });
  //   }
  //   const iconMap = {
  //     "rapid_acceleration": "./assets/images/HA_TH.svg",
  //     "harsh_acceleration": "./assets/images/HA_TH.svg",
  //     "harsh_braking": "./assets/images/HB_TH.svg",
  //     "harsh_cornering": "./assets/images/HC_TH.svg",
  //     "overspeeding": "./assets/images/OS_TH.svg",
  //     "night_driving": "./assets/images/ND_TH.svg",
  //   };
  //   const alertNames = {
  //     "harsh_acceleration": "Harsh Acceleration",
  //     "harsh_braking": "Harsh Braking",
  //     "harsh_cornering": "Harsh Cornering",
  //     "overspeeding": "Over Speeding",
  //     "night_driving": "Night Driving"
  //   };
  //   this.alertMarkers = liveData.alerts?.filter(alert => alert.initialLatitude && alert.initialLongitude)
  //     .map(alert => ({
  //       id: alert.alertId, description: alert.alertDescription, lat: alert.initialLatitude, lng: alert.initialLongitude,
  //       icon: {
  //         url: iconMap[alert.alertDescription],
  //         scaledSize: { width: 25, height: 25 }
  //       },
  //       title: alertNames[alert.alertDescription]
  //     })) || [];
  //   if (this.waypoints.length > 0) {
  //     const path = this.waypoints.map((point) => `${point.lat},${point.lng}`).join('|');
  //     this.getSnappedPoints(path).then((snappedPoints) => {
  //       if (snappedPoints && snappedPoints.length > 0) {
  //         this.snappedWaypoints = snappedPoints;
  //       } else {
  //         console.error('No snapped points returned by Google Roads API.');
  //       }
  //     }).catch((error) => console.error('Error fetching snapped points:', error));
  //   }
  // }

  polylines: {
    path: { lat: number; lng: number }[];
    strokeColor: string;
    strokeWeight: number;
    strokeOpacity: number;
  }[] = []; // Declare the property

  getLiveData(liveData: any): void {
    // Store raw live data
    this.LatLng = liveData;

    // Extract and populate waypoints from telemetry data
    if (liveData?.cxTelemetryDataList?.length) {
      liveData.cxTelemetryDataList.forEach((data: any) => {
        if (data.latitude && data.longitude) {
          this.waypoints.push({ lat: data.latitude, lng: data.longitude });
        }
      });
    }

    // Define icons and alert descriptions
    const iconMap: { [key: string]: string } = {
      "rapid_acceleration": "./assets/images/HA_TH.svg",
      "harsh_acceleration": "./assets/images/HA_TH.svg",
      "harsh_braking": "./assets/images/HB_TH.svg",
      "harsh_cornering": "./assets/images/HC_TH.svg",
      "night_driving": "./assets/images/ND_TH.svg",
      "idling": "./assets/images/ND_TH.svg",
    };

    const alertNames: { [key: string]: string } = {
      "harsh_acceleration": "Harsh Acceleration",
      "harsh_braking": "Harsh Braking",
      "harsh_cornering": "Harsh Cornering",
      "night_driving": "Night Driving",
    };

    // Add alert markers
    this.alertMarkers = this.alertMarkers || [];
    const newAlerts = liveData?.alerts?.filter(
      (alert: any) => alert.initialLatitude && alert.initialLongitude
    ) || [];
    newAlerts.forEach((alert: any) => {
      if (!this.alertMarkers.some((marker) => marker.id === alert.alertId)) {
        this.alertMarkers.push({
          id: alert.alertId,
          description: alert.alertDescription,
          lat: alert.initialLatitude,
          lng: alert.initialLongitude,
          icon: {
            url: iconMap[alert.alertDescription] || "./assets/images/ND_TH.svg",
            scaledSize: { width: 15, height: 15 },
          },
          title: alertNames[alert.alertDescription] || "Alert",
        });
      }
    });

// Generate polylines with red or green segments
this.polylines = this.waypoints.reduce((result, current, index, array) => {
  if (index === array.length - 1) return result; // Skip the last point

  const next = array[index + 1];
  const isOverspeeding = this.checkIfOverspeeding(current, next, liveData?.alerts);

  // Determine stroke color based on overspeeding
  const strokeColor = isOverspeeding ? "#FF0000" : "#07b57a"; // Red for overspeeding, green otherwise
 // Add polyline to the result
  result.push({
    path: [current, next],
    strokeColor: strokeColor,
    strokeWeight: 2,
    strokeOpacity: 0.8,
  });

  return result;
}, []);
if (this.waypoints.length > 0) {
  const path = this.waypoints.map((point) => `${point.lat},${point.lng}`).join("|");
  this.getSnappedPoints(path)
    .then((snappedPoints) => {
      if (snappedPoints?.length > 0) {
        this.snappedWaypoints = snappedPoints;
      } else {
        console.error("No snapped points returned by Google Roads API.");
      }
    })
    .catch((error) => console.error("Error fetching snapped points:", error));
}

  }

  // Helper function to check if a segment is overspeeding
  checkIfOverspeeding(
    startPoint: { lat: number; lng: number },
    endPoint: { lat: number; lng: number },
    alerts: any[]
  ): boolean {
    return alerts?.some(
      (alert) =>
        alert.alertDescription === "overspeeding" &&
        alert.initialLatitude === startPoint.lat &&
        alert.initialLongitude === startPoint.lng &&
        alert.finalLatitude === endPoint.lat &&
        alert.finalLongitude === endPoint.lng
    );
  }

  // Fetch snapped points from Google Roads API
  async getSnappedPoints(path: string): Promise<any[]> {
    const apiKey = 'AIzaSyDySexTXKB3Syxg_1eHOf7cuMljEnKb8us';
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.snappedPoints.map((point) => ({
      lat: point.location.latitude,
      lng: point.location.longitude,
    }));
  }
  // Trip History Page
  currentTripHistory() {
    this.router.navigate(['/adlp/admin/admindashboard/dashboardfleet/currentTripHistory'], { queryParams: { tripId: this.tripId, VIN: this.vin } })
  }
  // Get Current Address
  getAddress(data) {
    this.subscription$.add(
      this.dashboardservice.getAddressLatLng(data?.endLat, data?.endLong).subscribe((res: any) => {
        this.currentAddres = res?.results[0]?.formatted_address
        this.addressSplit(this.currentAddres)
      }, err => {
      })
    )
  }
  // Get Current Address Split
  addressSplit(address) {
    const firstCommaIndex = address.indexOf(',');
    if (firstCommaIndex !== -1) {
      this.firstAddressPart = address.substring(0, firstCommaIndex).trim();
      this.secondAddressPart = address.substring(firstCommaIndex + 1).trim();
    } else {
      this.firstAddressPart = address
    }
  }
  // Mask VIN Number
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
  ngOnDestroy(): void {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    if (this.isLive) {
      this.dashboardservice.stopUpdates();
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

}
