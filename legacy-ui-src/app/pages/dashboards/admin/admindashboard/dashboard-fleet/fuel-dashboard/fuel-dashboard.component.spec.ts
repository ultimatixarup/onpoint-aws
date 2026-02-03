import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuelDashboardComponent } from './fuel-dashboard.component';

describe('FuelDashboardComponent', () => {
  let component: FuelDashboardComponent;
  let fixture: ComponentFixture<FuelDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FuelDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuelDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
