import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddServiceReminderComponent } from './add-service-reminder.component';

describe('AddServiceReminderComponent', () => {
  let component: AddServiceReminderComponent;
  let fixture: ComponentFixture<AddServiceReminderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddServiceReminderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddServiceReminderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
