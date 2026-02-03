import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentTripHistoryComponent } from './current-trip-history.component';

describe('CurrentTripHistoryComponent', () => {
  let component: CurrentTripHistoryComponent;
  let fixture: ComponentFixture<CurrentTripHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrentTripHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentTripHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
