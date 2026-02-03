import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetSafetyCardComponent } from './fleet-safety-card.component';

describe('FleetSafetyCardComponent', () => {
  let component: FleetSafetyCardComponent;
  let fixture: ComponentFixture<FleetSafetyCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FleetSafetyCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetSafetyCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
