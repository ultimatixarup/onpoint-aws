import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicTelemetryDashboardComponent } from './basic-telemetry-dashboard.component';

describe('BasicTelemetryDashboardComponent', () => {
  let component: BasicTelemetryDashboardComponent;
  let fixture: ComponentFixture<BasicTelemetryDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasicTelemetryDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicTelemetryDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
