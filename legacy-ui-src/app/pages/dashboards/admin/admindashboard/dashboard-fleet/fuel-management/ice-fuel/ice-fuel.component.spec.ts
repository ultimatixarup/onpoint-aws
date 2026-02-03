import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IceFuelComponent } from './ice-fuel.component';

describe('IceFuelComponent', () => {
  let component: IceFuelComponent;
  let fixture: ComponentFixture<IceFuelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IceFuelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IceFuelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
