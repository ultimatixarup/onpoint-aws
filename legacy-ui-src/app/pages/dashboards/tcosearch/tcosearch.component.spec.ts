import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TcosearchComponent } from './tcosearch.component';

describe('TcosearchComponent', () => {
  let component: TcosearchComponent;
  let fixture: ComponentFixture<TcosearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TcosearchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TcosearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
