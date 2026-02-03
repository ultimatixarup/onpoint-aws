import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetMaintenanceComponent } from './fleet-maintenance.component';

describe('FleetMaintenanceComponent', () => {
  let component: FleetMaintenanceComponent;
  let fixture: ComponentFixture<FleetMaintenanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FleetMaintenanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
