import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceReportComponent } from './geofence-report.component';

describe('GeofenceReportComponent', () => {
  let component: GeofenceReportComponent;
  let fixture: ComponentFixture<GeofenceReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeofenceReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeofenceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
