import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditServiceReminderComponent } from './edit-service-reminder.component';

describe('EditServiceReminderComponent', () => {
  let component: EditServiceReminderComponent;
  let fixture: ComponentFixture<EditServiceReminderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditServiceReminderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditServiceReminderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
