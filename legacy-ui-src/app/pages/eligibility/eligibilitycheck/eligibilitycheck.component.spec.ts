import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EligibilitycheckComponent } from './eligibilitycheck.component';

describe('EligibilitycheckComponent', () => {
  let component: EligibilitycheckComponent;
  let fixture: ComponentFixture<EligibilitycheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EligibilitycheckComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EligibilitycheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
