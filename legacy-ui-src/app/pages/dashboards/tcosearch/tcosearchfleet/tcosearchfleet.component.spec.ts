import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TcosearchfleetComponent } from './tcosearchfleet.component';

describe('TcosearchfleetComponent', () => {
  let component: TcosearchfleetComponent;
  let fixture: ComponentFixture<TcosearchfleetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TcosearchfleetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TcosearchfleetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
