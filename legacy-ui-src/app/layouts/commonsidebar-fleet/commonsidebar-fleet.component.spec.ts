import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonsidebarFleetComponent } from './commonsidebar-fleet.component';

describe('CommonsidebarFleetComponent', () => {
  let component: CommonsidebarFleetComponent;
  let fixture: ComponentFixture<CommonsidebarFleetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonsidebarFleetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonsidebarFleetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
