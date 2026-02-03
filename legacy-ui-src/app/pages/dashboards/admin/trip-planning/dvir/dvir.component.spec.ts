import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DvirComponent } from './dvir.component';

describe('DvirComponent', () => {
  let component: DvirComponent;
  let fixture: ComponentFixture<DvirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DvirComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DvirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
