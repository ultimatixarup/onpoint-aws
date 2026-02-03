import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentTripHistorysComponent } from './current-trip-historys.component';

describe('CurrentTripHistorysComponent', () => {
  let component: CurrentTripHistorysComponent;
  let fixture: ComponentFixture<CurrentTripHistorysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentTripHistorysComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentTripHistorysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
