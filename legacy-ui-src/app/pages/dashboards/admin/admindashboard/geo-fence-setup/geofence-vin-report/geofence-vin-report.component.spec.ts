import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceVinReportComponent } from './geofence-vin-report.component';

describe('GeofenceVinReportComponent', () => {
  let component: GeofenceVinReportComponent;
  let fixture: ComponentFixture<GeofenceVinReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeofenceVinReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeofenceVinReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
