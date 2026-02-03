import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-google-map',
  template: `<div #mapElement style="height: 600px;"></div>`,
})
export class GoogleMapComponent implements OnInit {
  @ViewChild('mapElement', { static: true }) mapElement: any;

  map: google.maps.Map | undefined;

  ngOnInit(): void {
    const mapOptions = {
      center: { lat: 37.422, lng: -122.084 },
      zoom: 15,
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
console.log(`${location.origin}/assets/vehicle_events.kml`)
    const kmlLayer = new google.maps.KmlLayer({
      url: `${location.origin}/assets/vehicle_events.kml`,
      map: this.map,
    });

  }
}
