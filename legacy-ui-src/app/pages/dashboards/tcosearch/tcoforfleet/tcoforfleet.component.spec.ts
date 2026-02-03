import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TcoforfleetComponent } from './tcoforfleet.component';

describe('TcoforfleetComponent', () => {
  let component: TcoforfleetComponent;
  let fixture: ComponentFixture<TcoforfleetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TcoforfleetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TcoforfleetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
