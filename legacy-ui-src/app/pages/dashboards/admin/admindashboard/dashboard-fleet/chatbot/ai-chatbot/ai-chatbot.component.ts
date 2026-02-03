import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';

@Component({
  selector: 'app-ai-chatbot',
  templateUrl: './ai-chatbot.component.html',
  styleUrls: ['./ai-chatbot.component.scss']
})
export class AiChatbotComponent implements OnInit {
  chatInput: string = '';
  messages: { type: 'user' | 'bot'; text: string }[] = [];
  nextQuestions: string[] = [];

  constructor(
    private spinner: NgxSpinnerService,
    private _vehicleService: TaxonomyService
  ) {}

  ngOnInit(): void {
    this.addBotMessage('Hello! How can I assist you today?');
  }

  sendMessage() {
    const query = this.chatInput.trim();
    if (!query) return;

    this.messages.push({ type: 'user', text: query });
    this.chatInput = '';
    this.spinner.show();

    this._vehicleService.aiChatBot(query).subscribe(
      (response) => {
        this.spinner.hide();

        // Add bot message
        if (response.summary) {
          this.messages.push({ type: 'bot', text: response.summary });
        } else {
          this.messages.push({ type: 'bot', text: 'No summary found in response.' });
        }

        // Update next questions
        this.nextQuestions = response.nextQuestions || [];
      },
      (error) => {
        this.spinner.hide();
        this.messages.push({ type: 'bot', text: 'Something went wrong. Please try again.' });
      }
    );
  }


  addBotMessage(text: string): void {
    this.messages.push({ type: 'bot', text });
  }

  handleSuggestionClick(question: string) {
    this.chatInput = question;
    this.sendMessage();
  }
}
