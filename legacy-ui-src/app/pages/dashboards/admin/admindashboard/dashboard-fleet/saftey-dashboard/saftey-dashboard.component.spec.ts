import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafteyDashboardComponent } from './saftey-dashboard.component';

describe('SafteyDashboardComponent', () => {
  let component: SafteyDashboardComponent;
  let fixture: ComponentFixture<SafteyDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SafteyDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafteyDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
