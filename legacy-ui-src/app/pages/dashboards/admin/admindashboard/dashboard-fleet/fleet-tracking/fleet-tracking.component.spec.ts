import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetTrackingComponent } from './fleet-tracking.component';

describe('FleetTrackingComponent', () => {
  let component: FleetTrackingComponent;
  let fixture: ComponentFixture<FleetTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FleetTrackingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
