import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StellantisComponent } from './stellantis.component';

describe('StellantisComponent', () => {
  let component: StellantisComponent;
  let fixture: ComponentFixture<StellantisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StellantisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StellantisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
