import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverSafetyScoreComponent } from './driver-safety-score.component';

describe('DriverSafetyScoreComponent', () => {
  let component: DriverSafetyScoreComponent;
  let fixture: ComponentFixture<DriverSafetyScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DriverSafetyScoreComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverSafetyScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate total correctly', () => {
    component.tempWeights = {
      overSpeeding: 17,
      excessiveOverSpeeding: 21,
      harshAcceleration: 3,
      harshBraking: 21,
      harshCornering: 17,
      nightDriving: 7,
      seatbeltCompliance: 14
    };
    expect(component.calculateTotal()).toBe(100);
  });

  it('should reset to default values', () => {
    component.tempWeights = {
      overSpeeding: 10,
      excessiveOverSpeeding: 10,
      harshAcceleration: 10,
      harshBraking: 10,
      harshCornering: 10,
      nightDriving: 10,
      seatbeltCompliance: 10
    };
    component.resetToDefaults();
    expect(component.tempWeights.overSpeeding).toBe(17);
    expect(component.tempWeights.excessiveOverSpeeding).toBe(21);
    expect(component.calculateTotal()).toBe(100);
  });
});
