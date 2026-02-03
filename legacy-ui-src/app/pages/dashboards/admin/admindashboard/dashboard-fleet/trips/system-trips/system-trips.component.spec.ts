import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemTripsComponent } from './system-trips.component';

describe('SystemTripsComponent', () => {
  let component: SystemTripsComponent;
  let fixture: ComponentFixture<SystemTripsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SystemTripsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
