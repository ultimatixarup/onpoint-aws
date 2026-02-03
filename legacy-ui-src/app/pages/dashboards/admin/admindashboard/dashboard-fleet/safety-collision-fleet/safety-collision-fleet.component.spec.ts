import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyCollisionFleetComponent } from './safety-collision-fleet.component';

describe('SafetyCollisionFleetComponent', () => {
  let component: SafetyCollisionFleetComponent;
  let fixture: ComponentFixture<SafetyCollisionFleetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SafetyCollisionFleetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafetyCollisionFleetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
