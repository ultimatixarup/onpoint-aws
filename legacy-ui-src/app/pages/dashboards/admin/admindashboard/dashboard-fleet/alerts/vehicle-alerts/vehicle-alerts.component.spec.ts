import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAlertsComponent } from './vehicle-alerts.component';

describe('VehicleAlertsComponent', () => {
  let component: VehicleAlertsComponent;
  let fixture: ComponentFixture<VehicleAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VehicleAlertsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
