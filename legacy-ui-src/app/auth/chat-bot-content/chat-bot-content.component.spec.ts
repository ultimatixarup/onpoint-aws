import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatBotContentComponent } from './chat-bot-content.component';

describe('ChatBotContentComponent', () => {
  let component: ChatBotContentComponent;
  let fixture: ComponentFixture<ChatBotContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatBotContentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatBotContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
