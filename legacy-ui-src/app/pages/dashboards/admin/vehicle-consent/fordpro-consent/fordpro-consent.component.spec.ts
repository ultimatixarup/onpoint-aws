import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FordproConsentComponent } from './fordpro-consent.component';

describe('FordproConsentComponent', () => {
  let component: FordproConsentComponent;
  let fixture: ComponentFixture<FordproConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FordproConsentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FordproConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
