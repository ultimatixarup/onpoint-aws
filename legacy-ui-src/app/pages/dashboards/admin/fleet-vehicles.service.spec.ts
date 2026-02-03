import { TestBed } from '@angular/core/testing';

import { FleetVehiclesService } from './fleet-vehicles.service';

describe('FleetVehiclesService', () => {
  let service: FleetVehiclesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FleetVehiclesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
