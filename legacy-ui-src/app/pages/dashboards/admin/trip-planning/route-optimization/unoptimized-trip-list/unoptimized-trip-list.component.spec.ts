import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoptimizedTripListComponent } from './unoptimized-trip-list.component';

describe('UnoptimizedTripListComponent', () => {
  let component: UnoptimizedTripListComponent;
  let fixture: ComponentFixture<UnoptimizedTripListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoptimizedTripListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoptimizedTripListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
