import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetManageVehiclesComponent } from './fleet-manage-vehicles.component';

describe('FleetManageVehiclesComponent', () => {
  let component: FleetManageVehiclesComponent;
  let fixture: ComponentFixture<FleetManageVehiclesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FleetManageVehiclesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetManageVehiclesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
