import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverAlertsComponent } from './driver-alerts.component';

describe('DriverAlertsComponent', () => {
  let component: DriverAlertsComponent;
  let fixture: ComponentFixture<DriverAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DriverAlertsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
