import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceReminderComponent } from './service-reminder.component';

describe('ServiceReminderComponent', () => {
  let component: ServiceReminderComponent;
  let fixture: ComponentFixture<ServiceReminderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiceReminderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceReminderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
