import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkGeofenceComponent } from './bulk-geofence.component';

describe('BulkGeofenceComponent', () => {
  let component: BulkGeofenceComponent;
  let fixture: ComponentFixture<BulkGeofenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BulkGeofenceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkGeofenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
