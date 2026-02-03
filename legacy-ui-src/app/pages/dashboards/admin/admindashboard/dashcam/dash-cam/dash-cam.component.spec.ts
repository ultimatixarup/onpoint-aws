import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashCamComponent } from './dash-cam.component';

describe('DashCamComponent', () => {
  let component: DashCamComponent;
  let fixture: ComponentFixture<DashCamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashCamComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashCamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
