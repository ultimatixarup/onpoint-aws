import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleTripsComponent } from './schedule-trips.component';

describe('ScheduleTripsComponent', () => {
  let component: ScheduleTripsComponent;
  let fixture: ComponentFixture<ScheduleTripsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleTripsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
