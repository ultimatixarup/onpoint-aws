import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-geofence-alert',
  templateUrl: './geofence-alert.component.html',
  styleUrls: ['./geofence-alert.component.scss']
})
export class GeofenceAlertComponent implements OnInit {
  consumer: any = "All";
  fleetList: any;
  fleetIdData: any;
  consumerList: any;
  constructor() { }

  ngOnInit(): void {
  }

}
