import { TestBed } from '@angular/core/testing';

import { SessionTimeoutServiceService } from './session-timeout-service.service';

describe('SessionTimeoutServiceService', () => {
  let service: SessionTimeoutServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionTimeoutServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
