import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TcoforvinComponent } from './tcoforvin.component';

describe('TcoforvinComponent', () => {
  let component: TcoforvinComponent;
  let fixture: ComponentFixture<TcoforvinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TcoforvinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TcoforvinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
