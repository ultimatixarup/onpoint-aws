import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoFenceSetupComponent } from './geo-fence-setup.component';

describe('GeoFenceSetupComponent', () => {
  let component: GeoFenceSetupComponent;
  let fixture: ComponentFixture<GeoFenceSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeoFenceSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeoFenceSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
