import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EltTripsComponent } from './elt-trips.component';

describe('EltTripsComponent', () => {
  let component: EltTripsComponent;
  let fixture: ComponentFixture<EltTripsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EltTripsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EltTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
