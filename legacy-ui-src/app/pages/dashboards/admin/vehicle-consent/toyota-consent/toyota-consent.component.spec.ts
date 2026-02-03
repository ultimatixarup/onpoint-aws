import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToyotaConsentComponent } from './toyota-consent.component';

describe('ToyotaConsentComponent', () => {
  let component: ToyotaConsentComponent;
  let fixture: ComponentFixture<ToyotaConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToyotaConsentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToyotaConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
