import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VinSummaryComponent } from './vin-summary.component';

describe('VinSummaryComponent', () => {
  let component: VinSummaryComponent;
  let fixture: ComponentFixture<VinSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VinSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VinSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
