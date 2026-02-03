import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyEventsComponent } from './safety-events.component';

describe('SafetyEventsComponent', () => {
  let component: SafetyEventsComponent;
  let fixture: ComponentFixture<SafetyEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SafetyEventsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafetyEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
