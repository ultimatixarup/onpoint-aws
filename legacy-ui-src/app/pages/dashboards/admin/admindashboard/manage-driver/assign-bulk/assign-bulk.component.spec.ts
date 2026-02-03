import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignBulkComponent } from './assign-bulk.component';

describe('AssignBulkComponent', () => {
  let component: AssignBulkComponent;
  let fixture: ComponentFixture<AssignBulkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignBulkComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignBulkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
