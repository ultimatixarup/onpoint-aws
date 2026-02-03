import { TestBed } from '@angular/core/testing';

import { UsersRoleService } from './users-role.service';

describe('UsersRoleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UsersRoleService = TestBed.get(UsersRoleService);
    expect(service).toBeTruthy();
  });
});
