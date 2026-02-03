import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvsustainabilityfleetComponent } from './evsustainabilityfleet.component';

describe('EvsustainabilityfleetComponent', () => {
  let component: EvsustainabilityfleetComponent;
  let fixture: ComponentFixture<EvsustainabilityfleetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EvsustainabilityfleetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvsustainabilityfleetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
