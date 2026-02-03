import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VinHistoryComponent } from './vin-history.component';

describe('VinHistoryComponent', () => {
  let component: VinHistoryComponent;
  let fixture: ComponentFixture<VinHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VinHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VinHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
