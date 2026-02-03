import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssginDriverComponent } from './assgin-driver.component';

describe('AssginDriverComponent', () => {
  let component: AssginDriverComponent;
  let fixture: ComponentFixture<AssginDriverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssginDriverComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssginDriverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
