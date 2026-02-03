import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonsidebarExpandComponent } from './commonsidebar-expand.component';

describe('CommonsidebarExpandComponent', () => {
  let component: CommonsidebarExpandComponent;
  let fixture: ComponentFixture<CommonsidebarExpandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonsidebarExpandComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonsidebarExpandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
