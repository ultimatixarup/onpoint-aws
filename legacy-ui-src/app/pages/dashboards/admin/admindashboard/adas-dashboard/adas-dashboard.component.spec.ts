import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdasDashboardComponent } from './adas-dashboard.component';

describe('AdasDashboardComponent', () => {
  let component: AdasDashboardComponent;
  let fixture: ComponentFixture<AdasDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdasDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdasDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
