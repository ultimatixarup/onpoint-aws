import { Component, OnInit } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription,of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, pluck, shareReplay } from "rxjs/operators";
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: number
}
@Component({
  selector: 'app-service-reminder',
  templateUrl: './service-reminder.component.html',
  styleUrls: ['./service-reminder.component.scss']
})
export class ServiceReminderComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  searchbyCategory: number   // selected category IDs
  searchbyStatus: string[] = [];
  searchbyTask: string[] = [];
  toggleValue = false;
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  vehicleName: string[] = []
  consumer: any = 'All'
  dateRange: any
  serviceData: any;
  noDataFound: boolean = false;
  dueSoonVehiclesReminder: any;
  overdueVechiclesReminder: any;
  avgCompleteOnTimePercentage: any;
  categoryErrorMessage: string;
  selectedCategoryId: number;
  selectedConumerId: string | null = null;
  isDropdownOpen: boolean = false;
  getSummaryData: any[] = [];
  selectedReminderId: string | null = null;
  selectedReminderVin: string | null = null;
  searchAlias: string = '';
  fleetIdValueNew: string;
  groupList: any;
  constructor(
    private dashboardservice: TaxonomyService,
    private router: Router,
    private appService: AppService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.showRole()
    this.getServiceReminderTopData()
    this.getCategory()
    this.getdata()
    this.generateCalendar(this.currentMonth);
      this.selectConsumers()

  }


  toggleResolve(reminder: any) {
    reminder.resolved = true;
    // Optionally call API or perform other logic here
  }
  // Show role
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }
    // Consumer Dropdown
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    }
  // Select Consumer
  async selectConsumer(consumer: { id: string; name: string }) {
    this.consumer = consumer.name;
    this.selectedConumerId = consumer.id;
    if (this.customConsumer) {
      this.selectedConumerId = consumer.id;
    }
    this.isDropdownOpen = false;
    await this.selectConsumers();
    await this.getServiceReminderTopData()
    await this.getdata()
  }
  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }
  // fleet id list based on consumer
  selectConsumers() {
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.consumer).subscribe((res: any) => {
        this.fleetList = res

        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        this.fleetIdData = null
      }, err => { })
    )
  }
  // select fleet id for filter table data
  selectFleetId() {
    this.selectGroupId()
    this.getServiceReminderTopData()
    this.getdata()
  }

  groupIdData: any;
  selectGroupId() {
    if (!this.fleetIdData) return;

    this.subscription$.add(
      this.dashboardservice.getOrganizationSubGroups(this.fleetIdData,this.consumer).subscribe((res: any) => {
        const nestedGroups = res?.groups || [];

        // Flatten groups & subgroups into one list
        this.groupList = this.flattenGroups(nestedGroups);

        // Optionally preselect a default if needed
        // this.groupIdData = this.groupList[0]?.id; // optional
      }, err => {
        console.error('Error fetching sub-groups:', err);
      })
    );
  }

  // Flatten function to preserve hierarchy with indentation
  flattenGroups(groups: any[], level: number = 0): any[] {
    let flatList: any[] = [];

    for (const group of groups) {
      // Add current group with level info
      flatList.push({
        id: group.id,
        name: group.name, // Adds visual indentation
        parentGroupId: group.parentGroupId ?? 0,
        level: level
      });

      // Recursively flatten subgroups (if any)
      if (group.subgroups && group.subgroups.length > 0) {
        flatList = flatList.concat(this.flattenGroups(group.subgroups, level + 1));
      }
    }

    return flatList;
  }

  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
    this.getServiceReminderTopData()
    this.getdata()
  }

  // Add new reminder service btn
  addReminder() {
    this.router.navigate(['/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders/addSrviceReminder'])

  }
  // View top level data
  async getServiceReminderTopData() {
    if (this.user === 'admin') {
      this.noDataFound = false;
      this.dueSoonVehiclesReminder = undefined;
      this.overdueVechiclesReminder = undefined;
      this.avgCompleteOnTimePercentage = undefined;
      this.subscription$.add(
        this.dashboardservice.getServiceRemindersSummary(this.selectedConumerId, this.fleetIdData, this.groupIdData).subscribe({
          next: (res: any) => {
            // Set data
            this.serviceData = res
            this.dueSoonVehiclesReminder = this.serviceData?.dueSoonVehicles;
            this.overdueVechiclesReminder = this.serviceData?.overdueVechicles;
            this.avgCompleteOnTimePercentage = this.serviceData?.avgCompleteOnTimePerc;
            this.noDataFound = false;
          },
          error: (err: any) => {
            const errorBody = err?.error?.apierror;

            if (err?.status === 404 || errorBody?.message === 'Data Not Found') {
              this.noDataFound = true;

              // Show '--' by resetting relevant data to null or fallback
              this.dueSoonVehiclesReminder = '--';
              this.overdueVechiclesReminder = '--';
              this.avgCompleteOnTimePercentage = '--';

              // Show snackbar
              // this.appService.openSnackBar('Technical Issue ! Please try after some time', 'Error')
            } else {
              console.error('Unexpected error fetching service reminder summary:', err);
              this.appService.openSnackBar('Technical Issue ! Please try after some time', 'Error') // fallback for unexpected errors
            }
          }
        }))
    }
    if (this.user != 'admin') {
      this.noDataFound = false;
      this.dueSoonVehiclesReminder = undefined;
      this.overdueVechiclesReminder = undefined;
      this.avgCompleteOnTimePercentage = undefined;
      this.subscription$.add(
        this.dashboardservice.getServiceRemindersSummary(this.selectedConumerId, this.fleetIdData, this.groupIdData).subscribe({
          next: (res: any) => {
            // Set data
            this.serviceData = res
            this.dueSoonVehiclesReminder = this.serviceData?.dueSoonVehicles;
            this.overdueVechiclesReminder = this.serviceData?.overdueVechicles;
            this.avgCompleteOnTimePercentage = this.serviceData?.avgCompleteOnTimePerc;
            this.noDataFound = false;
          },
          error: (err: any) => {
            const errorBody = err?.error?.apierror;

            if (err?.status === 404 || errorBody?.message === 'Data Not Found') {
              this.noDataFound = true;

              // Show '--' by resetting relevant data to null or fallback
              this.dueSoonVehiclesReminder = '--';
              this.overdueVechiclesReminder = '--';
              this.avgCompleteOnTimePercentage = '--';

              // Show snackbar
              // this.appService.openSnackBar('Technical Issue ! Please try after some time', 'Error')
            } else {
              console.error('Unexpected error fetching service reminder summary:', err);
              this.appService.openSnackBar('Technical Issue ! Please try after some time', 'Error') // fallback for unexpected errors
            }
          }
        }))
    }
  }
  // For category
  getCategory() {
    const consumer = this.user === 'admin' ? this.consumer : this.customConsumer;
    this.subscription$.add(
      this.dashboardservice.getserviceReminderCategory(this.selectedConumerId, this.fleetIdData).subscribe(
        (res: any) => {
          this.serviceCategory = res?.serviceCategories || [];
        },
        (err) => {
          if (err.status === 404) {
            this.appService.openSnackBar('URL not found, please try after some time', 'Error')
            console.warn('No service categories found for this consumer.');
            this.serviceCategory = []; // Optional: Clear the list
            this.categoryErrorMessage = 'No service categories found.'; // Show this in UI
          } else {
            console.error('Failed to fetch categories', err);
            this.categoryErrorMessage = 'Something went wrong while fetching categories.';
          }
        }
      )
    );
  }
  // For task based on category
  onCategoryChange(selectedCategoryId: number | { id: number, name: string }) {
    let categoryId: number;

    if (typeof selectedCategoryId === 'object' && selectedCategoryId !== null) {
      categoryId = selectedCategoryId.id;
    } else {
      categoryId = selectedCategoryId as number;
    }
    if (!categoryId) {
      this.serviceTaskList = [];
      this.searchbyCategory = null; // Clear it if invalid
      return;
    }

    this.selectedCategoryId = categoryId;
    this.searchbyCategory = categoryId; // ✅ Store it for saveReminder
    this.getServiceTasks(categoryId);
  }
  getServiceTasks(categoryId: number) {
    if (!categoryId) return;

    this.subscription$.add(
      this.dashboardservice.getServiceTasksByCategory(categoryId).subscribe(
        (res: any) => {
          this.serviceTaskList = res?.serviceTasks || [];
        },
        (err) => {
          this.appService.openSnackBar('Failed to fetch data', err)
        }
      )
    );
  }
  // For table data
  getdata() {
    const consumer = this.user === 'admin' ? this.consumer : this.customConsumer;

    const consumerToSend = consumer !== 'All' ? consumer : null;
    const fleetIdToSend = this.fleetIdData || null;

    this.subscription$.add(
      this.dashboardservice.getServiceReminderData(this.selectedConumerId, fleetIdToSend, this.groupIdData).subscribe(
        (res: any) => {
          this.getSummaryData = res?.reminderResponses  || [];
          this.getSummaryData = (res?.reminderResponses || []).map(item => ({
            ...item,
            active: item.enableNotification === true
          }))
        },
        (err) => {
          if (err.status === 404) {
            this.appService.openSnackBar('Technical issue, please try after some time', 'Error');
            console.warn('No service categories found for this consumer.');
            this.getSummaryData  = [];
            this.categoryErrorMessage = 'No service categories found.';
          } else {
            console.error('Failed to fetch categories', err);
            this.categoryErrorMessage = 'Something went wrong while fetching categories.';
          }
        }
      )
    );
  }

  // Table filter
  getFilteredSummaryData() {
    return this.getSummaryData.filter(item => {
      const matchesCategory = this.selectedCategoryId ? item.serviceCategory == this.selectedCategoryId : true;

      const matchesTask = this.searchbyTask?.length
        ? this.searchbyTask.includes(item.serviceTaskId)
        : true;

        const matchesAlias = this.searchAlias
        ? item.alias?.toLowerCase().includes(this.searchAlias.toLowerCase()) ||
          this.searchAlias.toLowerCase().includes(item.alias?.toLowerCase() || '')
        : true;

      return matchesCategory && matchesTask && matchesAlias;
    });
  }

  // Delete service reminder
  deletePopUp(deleteConfirmationPopup:any,id: string, alias: string) {
    this.selectedReminderId = id;
    this.selectedReminderVin = alias;
    this.modalService.open(deleteConfirmationPopup, { size: 'sl',centered: true, keyboard: false, backdrop: 'static'});
  }

  confirmDelete() {
    if (!this.selectedReminderId) return;

    // Optional: trigger spinner immediately
    this.dueSoonVehiclesReminder = undefined;
    this.noDataFound = false;

    this.dashboardservice.deleterReminder(this.selectedReminderId).subscribe({
      next: (res) => {
        this.appService.openSnackBar('Reminder deleted successfully', 'Success');
        this.modalService.dismissAll();

        // 🔥 Actually CALL the method here with ()
        this.getServiceReminderTopData();

        this.getdata();
      },
      error: (err) => {
        this.appService.openSnackBar('Failed to delete reminder', 'Error');
        this.modalService.dismissAll();
      }
    });
  }

  //edit service reminder
  serviceCategory: any[] = [];
  serviceTaskList: any[] = [];

editServiceReminder(item) {
  const category = this.serviceCategory?.find(c => c.id == item.serviceCategory);
  item.serviceCategoryName = category ? category.name : '--';

  const task = this.serviceTaskList?.find(t => t.id == item.serviceTaskId);
  item.serviceTaskName = task ? task.name : '--';

  item.notification = item.active;

  this.router.navigate(['/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders/editSrviceReminder'], {
    state: { data: item }
  });
}


  // Show calander for patch
  showCalendar = false;
  selectedItem: any = null;
  selectedDate: Date | null = null;

  dayLabels: string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  currentMonth = new Date(); // Tracks the displayed month
  calendarDays: (Date | null)[] = [];

  toggleCalendar(item: any) {
    this.selectedItem = item;
    this.showCalendar = !this.showCalendar;
    this.selectedDate = null;
  }

  selectDate(date: Date) {
    this.selectedDate = date;
  }

  isSameDate(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  formatNextDueInfo(text: string): string {
    if (!text) return '';
    const parts = text.split(/,(.+)/); // split at first comma only
    if (parts.length === 3) {
      return `${parts[0]},<br><span style="font-size: 8px !important; font-family: '' !important;">${parts[1]}</span>`;
    }
    return text;
  }


  isFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
    return date > today;
  }

  submitDate(item: any) {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    const isoDate = this.selectedDate
      ? `${this.selectedDate.getFullYear()}-${pad(this.selectedDate.getMonth() + 1)}-${pad(this.selectedDate.getDate())}`
      : '';

    this.dashboardservice.resolveService(item.id, isoDate).subscribe({
      next: (res) => {
        this.appService.openSnackBar('Issue resolved successfully', 'Success');
        item.resolved = true; // Update UI
        this.getdata()
      },
      error: (err) => {
        console.error('Failed to resolve service', err);
        this.appService.openSnackBar('Failed to resolve issue', 'Error');
      },
      complete: () => {
        // Always close the calendar
        this.showCalendar = false;
        this.selectedItem = null;
        this.selectedDate = null;
      }
    });
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.setMonth(this.currentMonth.getMonth() - 1));
    this.generateCalendar(this.currentMonth);
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.setMonth(this.currentMonth.getMonth() + 1));
    this.generateCalendar(this.currentMonth);
  }

  generateCalendar(month: Date) {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const days: (Date | null)[] = [];

    // Fill empty cells before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Fill actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }

    this.calendarDays = days;
  }
  isLoading = false;
  // notification send api

  onToggle(item: any): void {
    const newStatus = item.active;
    this.isLoading = true;

    this.dashboardservice.toggleNotification(item.id, newStatus)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.appService.openSnackBar(res.message, 'Success'); // Show message from API
          }
          this.getdata();
        },
        error: (error) => {
          item.active = !newStatus; // Revert state
          this.appService.openSnackBar(`Failed to update notification.`, error);
        }
      });
  }


}
