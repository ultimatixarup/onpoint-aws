import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GmConsentComponent } from './gm-consent.component';

describe('GmConsentComponent', () => {
  let component: GmConsentComponent;
  let fixture: ComponentFixture<GmConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GmConsentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GmConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
