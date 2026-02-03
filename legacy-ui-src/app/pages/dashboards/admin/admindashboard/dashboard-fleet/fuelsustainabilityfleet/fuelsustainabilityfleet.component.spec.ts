import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuelsustainabilityfleetComponent } from './fuelsustainabilityfleet.component';

describe('FuelsustainabilityfleetComponent', () => {
  let component: FuelsustainabilityfleetComponent;
  let fixture: ComponentFixture<FuelsustainabilityfleetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FuelsustainabilityfleetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuelsustainabilityfleetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
