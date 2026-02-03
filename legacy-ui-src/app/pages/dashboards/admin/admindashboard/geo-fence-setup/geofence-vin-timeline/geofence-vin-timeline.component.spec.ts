import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceVinTimelineComponent } from './geofence-vin-timeline.component';

describe('GeofenceVinTimelineComponent', () => {
  let component: GeofenceVinTimelineComponent;
  let fixture: ComponentFixture<GeofenceVinTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeofenceVinTimelineComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeofenceVinTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
