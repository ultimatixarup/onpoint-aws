import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarmComponent } from './calendarm.component';

describe('CalendarmComponent', () => {
  let component: CalendarmComponent;
  let fixture: ComponentFixture<CalendarmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CalendarmComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
