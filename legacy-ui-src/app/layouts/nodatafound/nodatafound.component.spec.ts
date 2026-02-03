import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodatafoundComponent } from './nodatafound.component';

describe('NodatafoundComponent', () => {
  let component: NodatafoundComponent;
  let fixture: ComponentFixture<NodatafoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodatafoundComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodatafoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
