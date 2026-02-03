import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparetcoComponent } from './comparetco.component';

describe('ComparetcoComponent', () => {
  let component: ComparetcoComponent;
  let fixture: ComponentFixture<ComparetcoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ComparetcoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparetcoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
