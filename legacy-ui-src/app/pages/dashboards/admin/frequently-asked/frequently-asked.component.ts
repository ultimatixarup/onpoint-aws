import { Component, OnInit,TemplateRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TaxonomyService } from '../../taxonomy.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}

@Component({
  selector: 'app-frequently-asked',
  templateUrl: './frequently-asked.component.html',
  styleUrls: ['./frequently-asked.component.scss']
})
export class FrequentlyAskedComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  @ViewChild('remarks', { static: true }) remarks!: TemplateRef<any>;
  @ViewChild('editQuestion', { static: true }) editQuestion!: TemplateRef<any>;
  customConsumer: any;
  loginUser: any;
  multiRoles: any;
  user: any;
  emailId: any;
  addQuestionBtn: boolean = false;
  question: string = '';
  answer: string = '';
  vehicleDataFailure: any;
  allData: any;
  questionData: any;
  answerData: any;
  selectedFaqId: number | null = null;
  constructor(private modalService: NgbModal, private http: HttpClient, private faqService : TaxonomyService,   private toastr: ToastrService,) { }

  ngOnInit(): void {
    this.showRole()
    this.buttonShowHide()
    this.getAllData()
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    this.emailId = this.loginUser?.email
    console.log(this.emailId)
  }

  openRemarkModal(vehicle: any) {
    this.modalService.open(this.remarks, { size: 'sl', centered: true });
  }
  buttonShowHide() {
    if (
      this.emailId === 'sandip.ranjhan@cerebrumx.ai' ||
      this.emailId === 'ravi.bhatia@cerebrumx.ai' ||
      this.emailId === 'parth.bajaj@cerebrumx.ai'
    ) {
      this.addQuestionBtn = true;
    } else {
      this.addQuestionBtn = false;
    }
  }

  submitFaq() {
    if (!this.question.trim() || !this.answer.trim()) {
      alert('Please enter both question and answer.');
      return;
    }

    this.faqService.postFaq(this.question, this.answer).subscribe(
      (response) => {
        this.toastr.success("FAQ submitted successfully!");
        this.question = '';
        this.answer = '';
        this.getAllData()
      },
      (error) => {
        this.toastr.error('Error submitting FAQ:', error)
      }
    );
  }

  getAllData() {
    this.subscription$.add(
      this.faqService.getFaqQuestionAnswer().subscribe((res:any)=>{
        this.allData = res?.responseBody
        console.log( this.questionData)
      },err=>{

      })
    )
  }

  deleteFaq(faqId: number) {
      this.faqService.deleteFaq(faqId).subscribe(
        (res: any) => {
          this.toastr.success('FAQ deleted successfully')
          this.getAllData(); // Refresh data after deletion
        },
        (err) => {
          this.toastr.error('Error deleteing data', err)
        }
      );
  }selectedFaq: any; // Define as a class property

  openEditQuestionModal(modalRef: any, faqId: number) {
    this.selectedFaq = this.allData.find(faq => faq.faqId === faqId);
    if (this.selectedFaq) {
      this.question = this.selectedFaq.question;
      this.answer = this.selectedFaq.answer;
    }
    this.modalService.open(modalRef, { centered: true });
  }

  submitFaqUpdate() {
    // Trim inputs to avoid spaces being considered valid input
    this.isQuestionEmpty = !this.question.trim();
    this.isAnswerEmpty = !this.answer.trim();

    // Prevent submission if either field is empty
    if (this.isQuestionEmpty || this.isAnswerEmpty) {
      this.toastr.error('Please fill in both Question and Answer fields');
      return;
    }

    if (!this.selectedFaq) {
      console.error('No FAQ selected for update');
      return;
    }

    const updatePayload = {
      question: this.question,
      answer: this.answer
    };

    this.faqService.updateFaq(this.selectedFaq.faqId, updatePayload).subscribe({
      next: (response) => {
        if (response.statusCode === 200) {
          this.toastr.success('FAQ updated successfully');
          this.modalService.dismissAll(); // Close modal after update
          this.getAllData();
        }
      },
      error: (error) => {
        console.error('Error updating FAQ:', error);
        this.toastr.error('Failed to update FAQ');
      }
    });
  }


  isQuestionEmpty: boolean = false;
    isAnswerEmpty: boolean = false;
    isUpdateDisabled: boolean = true;

    validateFields() {
      this.isQuestionEmpty = !this.question.trim();
      this.isAnswerEmpty = !this.answer.trim();
      this.isUpdateDisabled = this.isQuestionEmpty || this.isAnswerEmpty;
    }


  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
    setTimeout(() => {
      window.dispatchEvent(new Event("resize")); // Forces chart to adjust width
    },10);
    // this.updateDasboard()
  }


}
