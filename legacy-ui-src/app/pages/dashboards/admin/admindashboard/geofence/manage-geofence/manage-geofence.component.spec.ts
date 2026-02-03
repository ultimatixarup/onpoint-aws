import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageGeofenceComponent } from './manage-geofence.component';

describe('ManageGeofenceComponent', () => {
  let component: ManageGeofenceComponent;
  let fixture: ComponentFixture<ManageGeofenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManageGeofenceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageGeofenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
