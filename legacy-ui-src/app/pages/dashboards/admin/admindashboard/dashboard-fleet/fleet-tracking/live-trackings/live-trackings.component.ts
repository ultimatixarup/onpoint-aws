import { Component, OnInit } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-live-trackings',
  templateUrl: './live-trackings.component.html',
  styleUrls: ['./live-trackings.component.scss']
})
export class LiveTrackingsComponent implements OnInit {
  activeSection: string | null = null;
  subscription$: Subscription = new Subscription();
  selectedMenuItem: string | null = null;
  fleetIdData: any;
  loginUser: any;
  user: any;
  vin: String;
  latitudeMap: Number;
  longitudeMap: Number;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  consumer: any = 'All'
  start_end_mark = []
  zoom:number=8;
  latitude = 40.7128;
  longitude = -74.0060;
  tripId: any;
  isLive: boolean=false;
  alertTip: any;
  alertMarkers: any;
  LatLng: any;
  isOpen: boolean=false;
  currentAddres: any;
  firstAddressPart: any;
  secondAddressPart: any;
  waypoints =[]
  speedVal: any;
  currentPositionIndex = 0;
  interval;
  snappedWaypoints: any[];
  driver_name: any;
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
  alias: any;
  currentMapType: string = 'roadmap';
  constructor(public http: HttpClient, private spinner: NgxSpinnerService, private dashboardservice: TaxonomyService,private activatedRoute:ActivatedRoute,private router:Router) {
    this.getParams()
  }


 toggleMapType(): void {
  this.currentMapType = this.currentMapType === 'roadmap' ? 'satellite' : 'roadmap';
}

  ngOnInit() {
    this.showRole();
  }

  getParams() {
    this.activatedRoute.queryParams.subscribe((param:any)=>{
        if(param.tripId) {
        this.tripId = param.tripId
        this.zoom = 13
        let data:any = {
          endLat :Number(param.lat),
          endLong:Number(param.lng),
          speed:Number(param?.speed),
          acceleration:param?.acceleration,
          vin:param?.vin,
          alias: param?.alias,
          driverName: param?.driverName
        }
        this.vin = param.vin;
        this.alias = param.alias
        this.driver_name = param?.driverName;
        this.LatLng=data
        this.latitude = Number(param.lat)
        this.longitude = Number(param.lng)
        this.getStremingData()
      } else {
        this.router.navigate(['adlp/admin/admindashboard/tracking'])
      }
    })
  }

  getStremingData() {
    // this.spinner.show()
    let dataReceived = false;
    const timeout = setTimeout(() => {
    if (!dataReceived) {
      // this.spinner.hide();
      console.log('Data not found within 60 seconds');
    }
  }, 60000);
    this.dashboardservice.getServerSentEvent(this.vin, this.tripId).subscribe((res:any)=>{
      this.isLive = true
      // this.spinner.hide()
      let data = JSON.parse(res?.data)
      this.getLiveData(data)
      if (data) {
        this.alertTip = data
        this.getAddress(data)
        clearTimeout(timeout); // Clear the timeout since data has been received
      }
    },err=>{
      // this.spinner.hide()
      clearTimeout(timeout); // Clear the timeout since data has been received
    })
  }

  getLiveData(liveData) {
    this.LatLng = liveData;
    if (liveData && liveData.cxTelemetryDataList) {
      liveData.cxTelemetryDataList.forEach((data) => {
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        if (this.latitude && this.longitude) {
          this.waypoints.push({ lat: this.latitude, lng: this.longitude }); // Update to AGM format
        }
      });
    }

    // Extract alerts and their positions
    const iconMap = {
      "rapid_acceleration": "./assets/images/HA_TH.svg",
      "harsh_acceleration": "./assets/images/HA_TH.svg",
      "harsh_braking": "./assets/images/HB_TH.svg",
      "harsh_cornering": "./assets/images/HC_TH.svg",
      "overspeeding": "./assets/images/OS_TH.svg",
      "night_driving": "./assets/images/ND_TH.svg",
    };
    const alertNames = {
      "harsh_acceleration": "Harsh Acceleration",
      "harsh_braking": "Harsh Braking",
      "harsh_cornering": "Harsh Cornering",
      "overspeeding": "Overspeeding",
      "night_driving": "Night Driving"
    };
    this.alertMarkers = liveData.alerts
      .filter(alert => alert.initialLatitude && alert.initialLongitude)
      .map(alert => ({
        id: alert.alertId,
        description: alert.alertDescription,
        lat: alert.initialLatitude,
        lng: alert.initialLongitude,
        iconUrl: iconMap[alert.alertDescription],
        title:alertNames[alert.alertDescription]
      }));
    // Get snapped points and update the polyline
    if (this.waypoints.length > 0) {
      const path = this.waypoints.map((point) => `${point.lat},${point.lng}`).join('|'); // Prepare path string
      this.getSnappedPoints(path).then((snappedPoints) => {
        if (snappedPoints && snappedPoints.length > 0) {
          this.snappedWaypoints = snappedPoints;
        } else {
          console.error('No snapped points returned by Google Roads API.');
        }
      }).catch((error) => console.error('Error fetching snapped points:', error));
    }
  }
  onAlertMarkerClick(alert) {
    alert(`Alert: ${alert.description}`);
  }

  // Fetch snapped points from Google Roads API
  async getSnappedPoints(path: string): Promise<any[]> {
    const apiKey = 'AIzaSyDySexTXKB3Syxg_1eHOf7cuMljEnKb8us';
    const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.snappedPoints.map((point) => ({
      lat: point.location.latitude,
      lng: point.location.longitude, // AGM format
    }));
  }

  ngOnDestroy(): void {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    if(this.isLive) {
      this.dashboardservice.stopUpdates();

    }
  }


  currentTripHistory(){
    this.router.navigate(['/adlp/admin/admindashboard/dashboardfleet/fleet-tracking/currentriphistory'],{queryParams:{tripId:this.tripId,VIN:this.vin}})
  }

  showHistory(): void {
    const historyTab = document.getElementById('history');
    if (historyTab) {
      historyTab.classList.add('active');
    }
  }

  selectMenuItem(item: string) {
    this.selectedMenuItem = this.selectedMenuItem === item ? null : item;
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }

  async getAllConsumerss() {
    this.consumerList = await this.dashboardservice.getAllConsumers()
      .pipe(pluck('data'), catchError(_ => of([])), shareReplay(1)).toPromise();
    this.consumerList = this.consumerList.map((item: any) => item.name);
    this.consumerList = this.consumerList.filter(item => item !== 'Slick' && item !== 'OneStep' && item !== 'Arvind_insurance' && item !== 'HD Fleet LLC' && item !== 'GEICO' && item !== 'Forward thinking GPS' && item !== 'Geo Toll' && item !== 'Standard Fleet' && item !== 'Matrack' && item !== 'Geico' && item !== 'Test fleet' && item !== 'Rockingham' && item !== 'Axiom' && item !== 'GeoToll' && item !== 'GPSTrackit');
    this.consumerList.sort((a: any, b: any) => a.localeCompare(b));
  }

  selectConsumers() {
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.consumer).subscribe((res: any) => {
        this.fleetList = res
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        this.fleetIdData = null
      }, err => { })
    )
  }

  async selectConsumer() {
    this.selectConsumers();
  }

  selectFleetId() {
    this.getAllConsumerss();
  }

  toggleInfoWindow(data: any, infoWindow): void {
    infoWindow.open()
    if (data) {
      this.alertTip = data
      this.speedVal = this.alertTip?.speed
      this.getAddress(data)
    }
  }

  getAddress(data) {
    // this.spinner.show()
    this.subscription$.add(
    this.dashboardservice.getAddressLatLng(data?.endLat,data?.endLong).subscribe((res:any)=>{
      // this.spinner.hide()
      this.currentAddres = res?.results[0]?.formatted_address
      this.addressSplit(this.currentAddres)
    },err=>{
      // this.spinner.hide()
    })
    )
  }

  addressSplit(address) {
    const firstCommaIndex = address.indexOf(',');

if (firstCommaIndex !== -1) {
  this.firstAddressPart = address.substring(0, firstCommaIndex).trim();
  this.secondAddressPart = address.substring(firstCommaIndex + 1).trim();
} else {
  this.firstAddressPart = address
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

  onMouseOut(infoWindow) {
      if(infoWindow.open()) {
      this.isOpen = false
      }
    }

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
    viewMore(): void {
      if (this.customConsumer) {
        this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { consumer: this.customConsumer, fleetId: this.fleetIdData } })
      } else {
        this.router.navigate(['/adlp/admin/fleetManageVehicles']);
      }
    }
}
