import { Component, OnInit } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Router } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { catchError, pluck, shareReplay } from "rxjs/operators";
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: number
}
@Component({
  selector: 'app-service-history',
  templateUrl: './service-history.component.html',
  styleUrls: ['./service-history.component.scss']
})
export class ServiceHistoryComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  searchbyCategory: number
  searchbyTask: string[] = [];
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  consumer: any = 'All'
  serviceData: any;
  noDataFound: boolean = false;
  totalServiceCount: number | string;
  totalRepairCount: number | string;
  totalPMCount: number | string;
  totalTiresCount: number | string;
  serviceCategory: any;
  serviceTaskList: any;
  categoryErrorMessage: string;
  selectedCategoryId: number;
  selectedConumerId: string | null = null;
  isDropdownOpen: boolean = false;
  getServiceHistorySummaryData: any[] = [];
  selectedReminderId: string | null = null;
  selectedReminderVin: string | null = null;
  searchAlias: string = '';
  totalServiceVehicleCount: any;
  totalRepiarVehicleCount: any;
  totalPMVehicleCount: any;
  totalTireVehicleCount: any;
  fleetIdValueNew: string;
  calendarPosition: { top: number; left: number; };
  showCalendarForItem: number;
  selectedCategoryName: string | null = null;
  searchbyTaskNames: string[] = [];
  // Show calander for patch
  showCalendar = false;
  selectedItem: any = null;
  dayLabels: string[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  currentMonth = new Date(); // Tracks the displayed month
  calendarDays: (Date | null)[] = [];
  openedCalendarId: string | null = null;
  selectedDate: Date | null = null;
  groupList: any;
  constructor(private dashboardservice: TaxonomyService, private appService: AppService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.showRole()
    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }
    this.getServiceHistoryTopData()
    this.getCategory()
    this.generateCalendar(this.currentMonth);
    this.getdata()
    if (this.user === 'admin') {
      this.getAllConsumers()
    }
    if (this.user != 'admin') {
      this.selectConsumers()
      this.getAllConsumers()
    }
  }
  // Show role
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_org_group') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
    }
    if (this.user === 'role_user_fleet') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
    }
  }
  // Consumer Dropdown
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  // All Consumers
  async getAllConsumers() {
    try {
      const response = await this.dashboardservice.getAllConsumers().pipe(pluck('data'), catchError(() => of([])), shareReplay(1)).toPromise();
      const excludedConsumers = new Set(['Slick', 'OneStep', 'Arvind_insurance', 'HD Fleet LLC', 'GEICO', 'Forward thinking GPS', 'Geo Toll', 'Matrack',
        'Geico', 'Test fleet', 'Rockingham', 'Axiom', 'GeoToll',
      ]);
      const activeConsumers = new Set([
        'DPL Telematics', 'Ecotrack', 'Satrack', 'Guidepoint', 'Onwardfleet', 'Smallboard', 'GPSInsight'
      ]);
      this.consumerList = (response as Consumer[])
        .filter((item) => item.contract && !excludedConsumers.has(item.name))
        .map((item) => ({
          id: item.id, // Ensure this matches the type definition
          name: item.name,
          startDate: item.contract.startDate,
          isActive: activeConsumers.has(item.name),
          iconColor: activeConsumers.has(item.name) ? 'green' : 'red',
        }));
      this.consumerList.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error fetching consumers:', error);
    }
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
    await this.getServiceHistoryTopData()
    await this.getdata()
  }
  // fleet id list based on consumer
  selectConsumers() {
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.consumer).subscribe((res: any) => {
        this.fleetList = res
        if (this.customConsumer === 'Onwardfleet') {
          // Define disallowed fleet IDs
          const disallowedFleetIds = [100549, 100527, 100528, 100606];
          this.fleetList = this.fleetList.filter((fleet: any) =>
            !disallowedFleetIds.includes(fleet.id)
          );
        }

        if (this.customConsumer === 'EcoTrack') {
          // Define disallowed fleet IDs
          const disallowedFleetIds = [101061, 100867, 100865, 100878, 100875];
          this.fleetList = this.fleetList.filter((fleet: any) =>
            !disallowedFleetIds.includes(fleet.id)
          );
        }
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        this.fleetIdData = null
      }, err => { })
    )
  }
  // select fleet id for filter table data
  selectFleetId() {
    this.selectGroupId()
    this.getServiceHistoryTopData()
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
    this.getServiceHistoryTopData()
    this.getdata()
  }
  // View top level data
  async getServiceHistoryTopData() {
    this.noDataFound = false;
    this.totalServiceCount = undefined;
    this.totalRepairCount = undefined;
    this.totalPMCount = undefined;
    this.totalTiresCount = undefined;
    this.totalServiceVehicleCount = undefined;
    this.totalRepiarVehicleCount = undefined;
    this.totalPMVehicleCount = undefined;
    this.totalTireVehicleCount = undefined;
    this.subscription$.add(

      this.dashboardservice.getServiceHistorySummary(this.selectedConumerId, this.fleetIdData, this.groupIdData).subscribe({
        next: (res: any) => {
          this.serviceData = res;
          const { totalServiceData, totalRepairData, totalPMData, totalTiresData } = res;
          const allNull =
            totalServiceData === null &&
            totalRepairData === null &&
            totalPMData === null &&
            totalTiresData === null;
          if (allNull) {
            this.noDataFound = true;
            this.totalServiceCount = '--';
            this.totalRepairCount = '--';
            this.totalPMCount = '--';
            this.totalTiresCount = '--';
            this.totalServiceVehicleCount = '--';
            this.totalRepiarVehicleCount = '--';
            this.totalPMVehicleCount = '--';
            this.totalTireVehicleCount = '--';
          } else {
            this.noDataFound = false;
            this.totalServiceCount = totalServiceData?.serviceCount ?? '--';
            this.totalServiceVehicleCount = totalServiceData?.vinCount ?? '--';
            this.totalRepairCount = totalRepairData?.serviceCount ?? '--';
            this.totalRepiarVehicleCount = totalRepairData?.vinCount ?? '--';
            this.totalPMCount = totalPMData?.serviceCount ?? '--';
            this.totalPMVehicleCount = totalPMData?.vinCount ?? '--';
            this.totalTiresCount = totalTiresData?.serviceCount ?? '--';
            this.totalTireVehicleCount = totalTiresData?.vinCount ?? '--';
          }
        },
        error: (err: any) => {
          const errorBody = err?.error?.apierror;
          if (err?.status === 404 || errorBody?.message === 'Data Not Found') {
            this.noDataFound = true;
            this.totalServiceCount = '--';
            this.totalRepairCount = '--';
            this.totalPMCount = '--';
            this.totalTiresCount = '--';
            this.totalServiceVehicleCount = '--';
            this.totalRepiarVehicleCount = '--';
            this.totalPMVehicleCount = '--';
            this.totalTireVehicleCount = '--';
          } else {
            console.error('Unexpected error fetching service reminder summary:', err);
            this.appService.openSnackBar('Technical Issue! Please try again later.', 'Error');
          }
        }
      })

    );
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
            this.serviceCategory = [];
            this.categoryErrorMessage = 'No service categories found.';
          } else {
            console.error('Failed to fetch categories', err);
            this.categoryErrorMessage = 'Something went wrong while fetching categories.';
          }
        }
      )
    );
  }
  // For task based on category
  onCategoryChange(selectedCategory: number | { id: number; name: string }) {
    let categoryId: number;
    if (typeof selectedCategory === 'object' && selectedCategory !== null) {
      categoryId = selectedCategory.id;
      this.selectedCategoryName = selectedCategory.name;
    } else {
      categoryId = selectedCategory as number;
      const foundCategory = this.serviceCategory.find(cat => cat.id === categoryId);
      this.selectedCategoryName = foundCategory?.name || null;
    }
    if (!categoryId) {
      this.serviceTaskList = [];
      this.searchbyCategory = null;
      return;
    }
    this.selectedCategoryId = categoryId;
    this.searchbyCategory = categoryId;
    this.getServiceTasks(categoryId);
  }
  // On Service change Show Task
  onTaskChange() {
    this.searchbyTaskNames = this.serviceTaskList
      .filter(task => this.searchbyTask.includes(task.id))
      .map(task => task.name);
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
      this.dashboardservice.getServiceHistoryData(this.selectedConumerId, fleetIdToSend, this.groupIdData).subscribe(
        (res: any) => {
          this.getServiceHistorySummaryData = res || [];
        },
        (err) => {
          if (err.status === 404) {
            this.appService.openSnackBar('Technical issue, please try after some time', 'Error');
            console.warn('No service categories found for this consumer.');
            this.getServiceHistorySummaryData = [];
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
    return this.getServiceHistorySummaryData.filter(item => {
      const matchesCategory = this.selectedCategoryName
        ? item.serviceCategory?.toLowerCase() === this.selectedCategoryName.toLowerCase()
        : true;
      const matchesTask = this.searchbyTaskNames?.length
        ? item.serviceTaskNames?.some(task =>
          this.searchbyTaskNames.includes(task)
        )
        : true;
      const matchesAlias = this.searchAlias
        ? item.alias?.toLowerCase().includes(this.searchAlias.toLowerCase())
        : true;
      return matchesCategory && matchesTask && matchesAlias;
    });
  }
  // Calander for edit completion date
  toggleCalendar(reminderId: string) {
    if (this.openedCalendarId === reminderId) {
      this.openedCalendarId = null;
    } else {
      this.openedCalendarId = reminderId;
    }
  }
  // Date selection for completion
  selectDate(date: Date) {
    this.selectedDate = date;
  }
  isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }
  isFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }
  // Calander start next and prev
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
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }
    this.calendarDays = days;
  }
  // Date Change with notification
  submitDate(item: any) {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    const isoDate = this.selectedDate
      ? `${this.selectedDate.getFullYear()}-${pad(this.selectedDate.getMonth() + 1)}-${pad(this.selectedDate.getDate())}`
      : '';
    this.dashboardservice.updateHistoryService(item.id, isoDate).subscribe({
      next: (res) => {
        this.openedCalendarId = null;
        this.appService.openSnackBar('Completion date updated successfully.', 'Success');
        this.showCalendar = false;
        this.selectedItem = null;
        this.selectedDate = null;
        item.resolved = true;
        item.completionDate = this.selectedDate;
        this.getdata();

      },
      error: (err) => {
        console.error('Failed to update completeion date.', err);
        this.appService.openSnackBar('Failed to update completion date.', 'Error');
      },
      complete: () => {
        this.openedCalendarId = null;
      }
    });
  }
  // Delete service reminder
  deletePopUp(deleteConfirmationPopup: any, id: string, vin: string) {
    this.selectedReminderId = id;
    this.selectedReminderVin = vin;
    this.modalService.open(deleteConfirmationPopup, { size: 'sl', centered: true, keyboard: false, backdrop: 'static' });
  }

}
