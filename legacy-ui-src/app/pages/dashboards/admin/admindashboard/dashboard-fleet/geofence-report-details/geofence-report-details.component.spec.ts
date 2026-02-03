import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceReportDetailsComponent } from './geofence-report-details.component';

describe('GeofenceReportDetailsComponent', () => {
  let component: GeofenceReportDetailsComponent;
  let fixture: ComponentFixture<GeofenceReportDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeofenceReportDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeofenceReportDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
