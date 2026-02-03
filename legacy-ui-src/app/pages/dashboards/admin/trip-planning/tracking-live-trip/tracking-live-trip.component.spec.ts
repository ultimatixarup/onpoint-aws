import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingLiveTripComponent } from './tracking-live-trip.component';

describe('TrackingLiveTripComponent', () => {
  let component: TrackingLiveTripComponent;
  let fixture: ComponentFixture<TrackingLiveTripComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackingLiveTripComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingLiveTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
