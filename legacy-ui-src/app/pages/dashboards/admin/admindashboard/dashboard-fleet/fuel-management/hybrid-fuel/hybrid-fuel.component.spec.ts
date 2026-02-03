import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HybridFuelComponent } from './hybrid-fuel.component';

describe('HybridFuelComponent', () => {
  let component: HybridFuelComponent;
  let fixture: ComponentFixture<HybridFuelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HybridFuelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HybridFuelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
