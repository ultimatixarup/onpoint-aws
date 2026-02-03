import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvChargeComponent } from './ev-charge.component';

describe('EvChargeComponent', () => {
  let component: EvChargeComponent;
  let fixture: ComponentFixture<EvChargeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EvChargeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvChargeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
