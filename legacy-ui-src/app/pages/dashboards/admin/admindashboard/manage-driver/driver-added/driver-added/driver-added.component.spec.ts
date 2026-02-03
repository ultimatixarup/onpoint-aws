import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverAddedComponent } from './driver-added.component';

describe('DriverAddedComponent', () => {
  let component: DriverAddedComponent;
  let fixture: ComponentFixture<DriverAddedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DriverAddedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverAddedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
