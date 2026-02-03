import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingMaintenanceDashboardComponent } from './upcoming-maintenance-dashboard.component';

describe('UpcomingMaintenanceDashboardComponent', () => {
  let component: UpcomingMaintenanceDashboardComponent;
  let fixture: ComponentFixture<UpcomingMaintenanceDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpcomingMaintenanceDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingMaintenanceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
