import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveTrackingsComponent } from './live-trackings.component';

describe('LiveTrackingsComponent', () => {
  let component: LiveTrackingsComponent;
  let fixture: ComponentFixture<LiveTrackingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveTrackingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveTrackingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
