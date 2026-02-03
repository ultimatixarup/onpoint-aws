import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripLiveComponent } from './trip-live.component';

describe('TripLiveComponent', () => {
  let component: TripLiveComponent;
  let fixture: ComponentFixture<TripLiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TripLiveComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripLiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
