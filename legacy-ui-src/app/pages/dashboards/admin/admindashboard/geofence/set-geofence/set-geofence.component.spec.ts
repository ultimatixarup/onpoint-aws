import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetGeofenceComponent } from './set-geofence.component';

describe('SetGeofenceComponent', () => {
  let component: SetGeofenceComponent;
  let fixture: ComponentFixture<SetGeofenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetGeofenceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetGeofenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
