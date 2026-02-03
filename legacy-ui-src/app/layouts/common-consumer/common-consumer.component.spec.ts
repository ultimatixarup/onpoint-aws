import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonConsumerComponent } from './common-consumer.component';

describe('CommonConsumerComponent', () => {
  let component: CommonConsumerComponent;
  let fixture: ComponentFixture<CommonConsumerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommonConsumerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonConsumerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
