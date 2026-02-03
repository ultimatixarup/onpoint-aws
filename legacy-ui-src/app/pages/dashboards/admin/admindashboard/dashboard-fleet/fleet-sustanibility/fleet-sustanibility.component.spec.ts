import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetSustanibilityComponent } from './fleet-sustanibility.component';

describe('FleetSustanibilityComponent', () => {
  let component: FleetSustanibilityComponent;
  let fixture: ComponentFixture<FleetSustanibilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FleetSustanibilityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetSustanibilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
