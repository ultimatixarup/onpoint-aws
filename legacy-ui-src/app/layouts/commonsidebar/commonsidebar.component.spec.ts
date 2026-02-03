import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonsidebarComponent } from './commonsidebar.component';

describe('CommonsidebarComponent', () => {
  let component: CommonsidebarComponent;
  let fixture: ComponentFixture<CommonsidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonsidebarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonsidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
