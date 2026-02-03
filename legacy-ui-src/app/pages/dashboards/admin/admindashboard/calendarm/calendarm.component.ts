import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-calendarm',
  templateUrl: './calendarm.component.html',
  styleUrls: ['./calendarm.component.scss']
})
export class CalendarmComponent{
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
    this.minDate = new Date(); // Set the minimum date to today
    this.viewDate = new Date(); // Set the view date to today
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
  minDate: Date;
  ngOnChanges(): void {
    if (this.rangeDates && this.rangeDates.length === 2) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison

      // Validate and sanitize rangeDates
      if (this.rangeDates[0] && this.rangeDates[0] < today) {
        this.rangeDates[0] = today; // Adjust start date to today
      }
      if (this.rangeDates[1] && this.rangeDates[1] < today) {
        this.rangeDates[1] = today; // Adjust end date to today
      }

      // Format the dates for display
      this.fromDate =
        this.datePipe.transform(this.rangeDates[0], 'MMMM d, yyyy') || '';
      this.toDate =
        this.datePipe.transform(this.rangeDates[1], 'MMMM d, yyyy') || '';

      // Trigger change detection and highlight updates
      this.cdr.detectChanges();
      setTimeout(() => this.highlightDates(), 0);
    }
  }


    onSubmit() {
      this.dateRangeSelected.emit({
        fromDate: this.fromDate,
        toDate: this.toDate
      });
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
    const start = this.rangeDates[0];
    const end = this.rangeDates[1];

    if (start && !end) {
      // 👇 Only one date selected — assign same value to both
      this.fromDate = this.formatDate(start);
      this.toDate = this.formatDate(start);
    } else if (start && end) {
      // 👇 Date range selected
      this.fromDate = this.formatDate(start);
      this.toDate = this.formatDate(end);
    }

    // Optional: lock out future dates
    this.today = new Date();
  }
}

  formatDate(date: Date): string {
    // Format the date as needed, e.g., 'MM/dd/yyyy'
    return date ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` : '';
  }




}
