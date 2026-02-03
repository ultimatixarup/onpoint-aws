import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent {
  fromDate: string = '';
  toDate: string = '';
  submitClicked: boolean = false;
  today: Date;
  viewDate: Date;
  numberOfMonths: number = 2;
  @Output() dateRangeSelected = new EventEmitter<{ fromDate: string, toDate: string }>();
  rangeDates: Date[] | null = null;
  constructor(
    private primengConfig: PrimeNGConfig,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {

  }
  ngOnInit(){
    this.today = new Date();
    this.viewDate = new Date();
    this.viewDate.setMonth(this.viewDate.getMonth() - 1);
    this.primengConfig.setTranslation({
      firstDayOfWeek: 1, // Start week on Monday
      dayNames: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      dayNamesShort: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      dayNamesMin: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      monthNames: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      monthNamesShort: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
      today: 'Today',
      weekHeader: 'Wk',
    });
  }
  ngOnChanges(): void {
    if (this.rangeDates && this.rangeDates.length === 2) {
      this.fromDate =
        this.datePipe.transform(this.rangeDates[0], 'MMMM d, yyyy') || '';
      this.toDate =
        this.datePipe.transform(this.rangeDates[1], 'MMMM d, yyyy') || '';
      this.cdr.detectChanges();
      setTimeout(() => this.highlightDates(), 0);
    }
  }

    onSubmit() {
      this.submitClicked = true;
      if (this.rangeDates && this.rangeDates.length === 2) {
        let fromDate = new Date(this.rangeDates[0]);
        fromDate.setDate(fromDate.getDate() + 1);
        const fromDateString = fromDate.toISOString().split('T')[0];

        let toDate = new Date(this.rangeDates[1]);
        toDate.setDate(toDate.getDate() + 1);
        const toDateString = toDate.toISOString().split('T')[0];

        this.dateRangeSelected.emit({ fromDate: fromDateString, toDate: toDateString });
    }

  }

  private highlightDates(): void {
    // Clear previous highlights
    const existingHighlights = document.querySelectorAll(
      '.p-datepicker table td > span'
    );
    existingHighlights.forEach((el: Element) => {
      (el as HTMLElement).style.background = ''; // Reset previous highlights
      (el as HTMLElement).style.color = ''; // Reset previous text color
      (el as HTMLElement).style.borderRadius = '';
    });

    // Get the new highlights
    const highlights = document.querySelectorAll('.p-highlight');

    if (highlights.length > 0) {
      // Highlight the first element
      (highlights[0] as HTMLElement).style.background = '#FA751A';
      (highlights[0] as HTMLElement).style.color = 'white'; // Text color for better visibility
      (highlights[0] as HTMLElement).style.borderRadius = '6px 0px 0px 6px';
      // Highlight the last element if there are more than one
      if (highlights.length > 1) {
        (highlights[highlights.length - 1] as HTMLElement).style.background =
          '#FA751A';
        (highlights[highlights.length - 1] as HTMLElement).style.color =
          'white'; // Text color for better visibility
        (highlights[highlights.length - 1] as HTMLElement).style.borderRadius =
          '0px 6px 6px 0px';
      }
      for (let i = 1; i < highlights.length - 1; i++) {
        (highlights[i] as HTMLElement).style.backgroundColor = '#fa741a4e';
        (highlights[i] as HTMLElement).style.color = 'black'; // Text color for better visibility
      }
    }
  }

  onDateSelect() {
    if (this.rangeDates) {
      this.fromDate = this.formatDate(this.rangeDates[0]);
      this.toDate = this.formatDate(this.rangeDates[1]);
      // Disable dates after today once dates are selected
      this.today = new Date(); // Ensuring `today` stays as the current date
    }
  }

  formatDate(date: Date): string {
    // Format the date as needed, e.g., 'MM/dd/yyyy'
    return date ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` : '';
  }
}
