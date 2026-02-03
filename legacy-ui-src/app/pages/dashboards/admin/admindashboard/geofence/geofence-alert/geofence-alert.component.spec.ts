import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceAlertComponent } from './geofence-alert.component';

describe('GeofenceAlertComponent', () => {
  let component: GeofenceAlertComponent;
  let fixture: ComponentFixture<GeofenceAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeofenceAlertComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeofenceAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
