import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { AppService } from "src/app/app.service";
import { catchError, pluck, shareReplay } from "rxjs/operators";
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: number
}

@Component({
  selector: 'app-edit-service-reminder',
  templateUrl: './edit-service-reminder.component.html',
  styleUrls: ['./edit-service-reminder.component.scss']
})
export class EditServiceReminderComponent implements OnInit {
 subscription$: Subscription = new Subscription();
  searchbyStatus: string[] = [];
  searchbyTask: string[] = [];
  vehicleName: string[] = []
  isToggled: boolean = false;
  showEmailInput: boolean = false;
  newEmail: string = '';
  emails: string[] = [];
  vinList: any;
  taskItems: any;
  newTaskName: string = '';
  addedTasks: string[] = [];
  currentMonth: number;
  currentYear: number;
  durationOptions = [
    { label: 'Day(s)', value: 'days' },
    { label: 'Week(s)', value: 'weeks' },
    { label: 'Month(s)', value: 'months' },
    { label: 'Year(s)', value: 'years' },
  ];
  selectedDuration = 'months';
  fleetIdValueNew: any;
  fleetIds: any;
  vinListData: any;
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  customConsumer: any;
  consumer: any = 'All'
  dates: any[] = [];
  serviceCategory: { id: number, name: string }[] = [];
  searchbyCategory: number   // selected category IDs
  selectedCategoryNames: string[] = [];  // selected category names
  serviceTaskList: any[] = [];
  consumerId: number | null = null;
  timeInterval: string = '';
  showInvalidInput: boolean = false;
  timeIntervalUnit: string = 'Day(s)';
  timeIntervalThreshold?: string = '';
  timeIntervalThresholdUnit: string = 'Day(s)';
  odometerInterval?: number;
  odometerThreshold?: number;
  selectedConsumer: string | null = null;
  selectedConumerId: string | null = null
  isDropdownOpen: boolean = false;
  consumerList: any[] = []; // Make sure this is initialized properly
  fleetList: any[] = [];
  selectedCategoryId: number
  categoryErrorMessage: string;
  invalidField: string | null = null;
  isEditMode: boolean = false;
  serviceData: any;
  constructor(
    private router: Router,
    private dashboardservice: TaxonomyService,
    private appService: AppService,
  ) { }

  ngOnInit(): void {
    this.showRole()

    this.serviceData = history.state.data;
    if (this.serviceData) {
      this.vehicleName = this.serviceData.vin ? [this.serviceData.vin] : [];
      this.selectedCategoryId = this.serviceData.serviceCategoryName.toString();
      this.searchbyTask = this.serviceData.serviceTaskName ? [this.serviceData.serviceTaskName] : []; // array of ids
      this.timeInterval = this.serviceData.timeInterval;
      this.timeIntervalUnit = this.serviceData.timeIntervalUnit || 'Day(s)';
      this.timeIntervalThreshold = this.serviceData.timeIntervalThreshold;
      this.timeIntervalThresholdUnit = this.serviceData.timeIntervalThresholdUnit || 'Day(s)';
      this.odometerInterval = this.serviceData.odometerInterval;
      this.odometerThreshold = this.serviceData.odometerThreshold;
      this.isToggled = this.serviceData.notification ?? false;
      this.newEmail = (this.serviceData.emails && this.serviceData.emails.length) ? this.serviceData.emails[0] : '';
    }
    this.getCategory()
    if (this.user != 'admin') {
      this.selectConsumers()
    }
  }


  // Go back button
  goBacktoMaintenance() {
    this.router.navigate(['/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders'])
  }
  // Show Role
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
    }
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
  }
  // Based on consumer fleet Id
  selectConsumers() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this.dashboardservice.getFleetList(this.consumer).subscribe((res: any) => {
          this.fleetList = res
          this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
          this.fleetIdData = null
          this.selectVinList()
        }, err => { })
      )
    }
    if (this.user != 'admin') {
      this.subscription$.add(
        this.dashboardservice.getFleetList(this.customConsumer).subscribe((res: any) => {
          this.fleetList = res
          this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
          this.fleetIdData = null
          this.selectVinList()
        }, err => { })
      )
    }
  }
  // Select fleet Id
  selectFleetId() {
    this.selectVinList()
  }
  // Email validation add or remove multiple box
  addEmail(): void {
    const trimmedEmail = this.newEmail.trim();
    if (trimmedEmail && this.validateEmail(trimmedEmail)) {
      this.emails.push(trimmedEmail);
      this.newEmail = '';
      this.showEmailInput = false;
    } else {
      alert('Please enter a valid email address.');
    }
  }
  removeEmail(index: number): void {
    this.emails.splice(index, 1);
  }
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  // Vehicle List based on consumer and fleet Id
  selectVinList() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this.dashboardservice.vinBasedOnConsumer(this.consumer, this.fleetIdData).subscribe((res: any) => {
          this.vinList = res.vinAliasList
        }, err => { })
      )
    }
    else if (this.user != 'admin') {
      this.subscription$.add(
        this.dashboardservice.vinBasedOnConsumer(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
          this.vinList = res.vinAliasList
        }, err => { })
      )
    }
  }
  // Get Service category basded on consumer and fleet Id

getCategory() {
  const consumer = this.user === 'admin' ? this.consumer : this.customConsumer;
  this.subscription$.add(
    this.dashboardservice.getserviceReminderCategory(consumer, this.fleetIdData).subscribe(
      (res: any) => {
        this.serviceCategory = res?.serviceCategories || [];
        if (this.serviceData) {
          this.selectedCategoryId = this.serviceData.serviceCategoryName.toString();
        }
        // If editing, set selectedCategoryId and load tasks for that category
        if (this.serviceData && this.serviceData.serviceCategory) {
          this.selectedCategoryId = this.serviceData.serviceCategory;
          this.getServiceTasks(this.selectedCategoryId);
        }
      },
      (err) => {
        if (err.status === 404) {
          this.appService.openSnackBar('Technical issue, please try after some time', 'Error');
          this.serviceCategory = [];
          this.categoryErrorMessage = 'No service categories found.';
        } else {
          this.appService.openSnackBar('Failed to fetch category data', 'Error');
          this.categoryErrorMessage = 'Something went wrong while fetching categories.';
        }
      }
    )
  );
}

getServiceTasks(categoryId: number) {
  if (!categoryId) return;

  this.subscription$.add(
    this.dashboardservice.getServiceTasksByCategory(categoryId).subscribe(
      (res: any) => {
        this.serviceTaskList = res?.serviceTasks || [];

        // If editing, set selected tasks by ID array (ng-select multi-select expects an array)
        if (this.serviceData && this.serviceData.serviceTaskId) {
          this.searchbyTask = Array.isArray(this.serviceData.serviceTaskId)
            ? this.serviceData.serviceTaskId
            : [this.serviceData.serviceTaskId];
        }
      },
      (err) => {
        this.appService.openSnackBar('Failed to fetch data', 'Error');
      }
    )
  );
}

onCategoryChange(selectedCategoryId: number | { id: number; name: string }) {
  let categoryId: number;

  if (typeof selectedCategoryId === 'object' && selectedCategoryId !== null) {
    categoryId = selectedCategoryId.id;
  } else {
    categoryId = selectedCategoryId as number;
  }
  if (!categoryId) {
    this.serviceTaskList = [];
    this.searchbyCategory = null; // Clear if invalid
    return;
  }

  this.selectedCategoryId = categoryId;
  this.searchbyCategory = categoryId; // Store it for saving
  this.getServiceTasks(categoryId);

  // Clear any previously selected tasks when category changes
  this.searchbyTask = [];
}
  // Add new reminder
  saveReminder() {
    // Validation for veihcle, service task, category not selected
    if (!this.vehicleName || this.vehicleName.length === 0) {
      this.isDropdownOpen = true;
      return;
    }

    if (!this.searchbyCategory) {
      this.isDropdownOpen = true;
      return;
    }

    if (!this.searchbyTask || this.searchbyTask.length === 0) {
      this.isDropdownOpen = true;
      return;
    }

    const timeInterval = this.timeInterval ?? null;
    const timeIntervalUnit = this.timeIntervalUnit ?? null;
    const timeIntervalThreshold = this.timeIntervalThreshold ?? (timeInterval ? 30 : null);
    const timeIntervalThresholdUnit = this.timeIntervalThresholdUnit ?? (timeInterval ? 'Day(s)' : null);
    const odometerInterval = this.odometerInterval ?? null;
    const odometerThreshold = this.odometerThreshold ?? (odometerInterval ? 200 : null);

    let consumerId: string;
    // Consumer Id filter
    if (this.user === 'admin') {
      consumerId = this.selectedConumerId;
    } else {
      const selected = this.consumerList.find(c =>
        c.name.trim().toLowerCase() === this.customConsumer?.trim().toLowerCase()
      );
      consumerId = selected?.id ?? ''; // Fallback if not found
    }
    // Payload
    const payload = {
      consumerId: consumerId,
      fleetId: this.fleetIdData,
      vins: this.vehicleName,
      serviceCategoryId: this.searchbyCategory,
      serviceTasks: this.searchbyTask,
      timeInterval,
      timeIntervalUnit,
      timeIntervalThreshold,
      timeIntervalThresholdUnit,
      odometerInterval,
      odometerThreshold,
      enableNotification: this.isToggled,
      emails: this.emails,
    };

    this.dashboardservice.addServiceReminder(payload).subscribe({
      next: (res) => {
        this.appService.openSnackBar('Service reminder generated successfully!', 'Success');
        this.router.navigate(['/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders']);
      },
      error: (error) => {
        if (error.status === 404) {
          this.appService.openSnackBar('Technical issue, please try after some time', 'Error');
        } else if (error.status === 'BAD_REQUEST') {
          this.appService.openSnackBar(error.error.apierror.message, 'Error');
        } else if (error.status === 422 && error.error.apierror?.message) {
          const message = error.error.apierror.message.toLowerCase();
          switch (message) {
            case 'consumer id is null':
              this.appService.openSnackBar('Please select consumer', 'Error');
              break;
            case 'the given id must not be null!':
              this.appService.openSnackBar('Please select fleet Id', 'Error');
              break;
            case 'please provide email ids in case you are enabling email notification setting':
              this.appService.openSnackBar('Please provide email IDs for email notifications.', 'Error');
              break;
            default:
              this.appService.openSnackBar(error.error.apierror.message, 'Error');
          }
        } else if (error.message) {
          this.appService.openSnackBar(error.message, 'Error');
        } else {
          this.appService.openSnackBar('An unknown error occurred.', 'Error');
        }
      }
    });

    this.clearFields();
  }
  // Clear complete form
  clearFields() {
    this.timeInterval = null;
    this.timeIntervalThreshold = null;
    this.odometerInterval = null;
    this.odometerThreshold = null;
    this.selectedConumerId = null;
    this.customConsumer = '';
    this.fleetIdData = null;
    this.vehicleName = null;
    this.searchbyCategory = null;
    this.searchbyTask = null;
    this.emails = null;
  }
 // validate day/month value
 isThresholdExceeding: boolean = false;

 validateNumber(event: any, field: string): void {
   let value = event.target.value;
   const isValid = /^[0-9]*$/.test(value);
   let cleaned = value.replace(/[^0-9]/g, '');

   if (cleaned.length > 4) {
     cleaned = cleaned.substring(0, 4);
   }

   if (!isValid) {
     this.invalidField = field;
   } else {
     if (this.invalidField === field) {
       this.invalidField = null;
     }
   }

   if (field === 'timeInterval') {
     this.timeInterval = cleaned;
     // Recheck threshold validity
     if (Number(this.timeIntervalThreshold) > Number(cleaned)) {
       this.isThresholdExceeding = true;
     } else {
       this.isThresholdExceeding = false;
     }
   } else if (field === 'timeIntervalThreshold') {
     this.timeIntervalThreshold = cleaned;

     // Compare threshold to interval
     if (Number(cleaned) > Number(this.timeInterval)) {
       this.isThresholdExceeding = true;
     } else {
       this.isThresholdExceeding = false;
     }
   }

   event.target.value = cleaned;
 }


 // validate odometer value
 validateNumberOdometer(event: any, field: 'odometerInterval' | 'odometerThreshold'): void {
   const input = event.target.value;

   // Allow only numbers
   const isValid = /^\d*$/.test(input);
   if (!isValid) {
     this.invalidField = field;
     return;
   }

   this.invalidField = ''; // Reset error if valid

   const value = Number(input);

   // Extra check for threshold not exceeding interval
   if (field === 'odometerThreshold' && this.odometerInterval) {
     const intervalValue = Number(this.odometerInterval);
     if (!isNaN(intervalValue) && value > intervalValue) {
       this.invalidField = field;
       this.appService.openSnackBar('Threshold should not be greater than interval.', 'Error');
     }
   }
 }

  // updateInterval
  onSubmit() {
    const payload = {
      id: this.serviceData.id,
      vin: this.vehicleName.length > 0 ? this.vehicleName[0] : '',
      serviceCategoryId: this.selectedCategoryId,
      serviceTasks: this.searchbyTask.join(','),  // join array to string if needed
      timeInterval: this.timeInterval,
      timeIntervalUnit: this.timeIntervalUnit.toLowerCase(), // ensure lowercase if API needs it
      timeIntervalThreshold: this.timeIntervalThreshold,
      timeIntervalThresholdUnit: this.timeIntervalThresholdUnit.toUpperCase(), // uppercase as example
      odometerInterval: this.odometerInterval,
      odometerThreshold: this.odometerThreshold,
      notification: this.isToggled, // ✅ included toggle value
      emails: this.newEmail ? [this.newEmail] : []
    };

    this.dashboardservice.updateServiceReminder(payload).subscribe({
      next: (res) => {
     this.appService.openSnackBar('Data update successfully','Success')
     this.router.navigate(['/adlp/admin/admindashboard/maintenance/serviceReminder/serviceReminders'])
        // Optionally notify user or navigate away
      },
      error: (err) => {
        console.error('Update failed', err);
        // Optionally notify user
      }
    });
  }
}
