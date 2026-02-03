import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignTripDriverComponent } from './assign-trip-driver.component';

describe('AssignTripDriverComponent', () => {
  let component: AssignTripDriverComponent;
  let fixture: ComponentFixture<AssignTripDriverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignTripDriverComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignTripDriverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
