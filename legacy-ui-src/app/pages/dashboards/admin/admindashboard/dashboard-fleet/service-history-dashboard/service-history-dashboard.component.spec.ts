import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceHistoryDashboardComponent } from './service-history-dashboard.component';

describe('ServiceHistoryDashboardComponent', () => {
  let component: ServiceHistoryDashboardComponent;
  let fixture: ComponentFixture<ServiceHistoryDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiceHistoryDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceHistoryDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
