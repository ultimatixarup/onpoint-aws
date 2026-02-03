import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { TaxonomyService } from '../../../taxonomy.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  @ViewChild('fleetSelect') fleetSelect: NgSelectComponent;
  selectedOption: any = 'REAL_TIME';
  selectedOptionForCollision: any = 'REAL_TIME';
  thresholdValue : number = 65;
  dropdownOpen: boolean = false;
  dropdownOpenForCollision: boolean = false;
  fleetList: any;
  fleetItem: any | null = null;
  collision: any;
  overspeeding: any;
  harshAcceleration: any;
  harshBraking: any
  harshCornering: any;
  idling: any;
  fleetId: any;
  showClose = false;
  toggles = {
    collision: false,
    overspeeding: false,
    harshAcceleration: false,
    harshBraking: false,
    harshCornering: false,
    idling: false
  };
  showEmailInput = false;
  showEmailInputForCollision = false;
  newEmail = '';
  newEmail1 = '';
  emailList: string[] = [];
  newCollisionEmail: string = '';
  collisionEmailList: string[] = [];
  domainSuggestions: string[] = ['gmail.com', 'yahoo.com', 'rediff.com', 'outlook.com', 'hotmail.com', 'cerebrumx.ai'];
  postSpeedLimit: any=false;
  fleetIdValueNew: any;
  constructor(private fleetService: TaxonomyService, private toastr: ToastrService, private spinner: NgxSpinnerService) { }
  ngOnInit(): void {
    this.getAllOrganizationId();
    this.showRole()
    this.selectGroupId()
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleDropdownForCollision() {
    this.dropdownOpenForCollision = !this.dropdownOpenForCollision;
  }

  selectOption(option: string) {
    this.selectedOption = option;
    this.dropdownOpen = false;
  }

  selectOptionForCollision(option: string) {
    this.selectedOptionForCollision = option;
    this.dropdownOpenForCollision = false;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.dropdownOpen = false;
      this.dropdownOpenForCollision = false;
    }
  }
  // toggle
  toggle(key: string) {
    this.toggles[key] = !this.toggles[key];
  }
  toggleEmailInput() {
    this.showEmailInput = !this.showEmailInput;
  }
  toggleEmailInputCollision() {
    this.showEmailInputForCollision = !this.showEmailInputForCollision;
  }
  // Add emaill
  addEmail() {
    const email = this.newEmail1?.trim();
    if (email && this.validateEmail(email)) {
      const isDuplicate = this.emailList.includes(email.toLowerCase());

      if (!isDuplicate) {
        this.emailList.push(email.toLowerCase());
        this.newEmail1 = '';
        this.showEmailInput = false;
      } else {
        this.toastr.error('This email is already exit.','Error');
      }
    } else {
      this.toastr.error('Please enter a valid email.','Error');
    }
  }

  // Email valdaiton
  addEmailForCollision() {
    const email = this.newEmail?.trim();
    if (email && this.validateEmail(email)) {
      const isDuplicate = this.collisionEmailList.includes(email.toLowerCase());

      if (!isDuplicate) {
        this.collisionEmailList.push(email.toLowerCase());
        this.newEmail = '';
        this.showEmailInputForCollision = false;
      } else {
        this.toastr.error('This email is already exit.','Error');
      }
    } else {
      this.toastr.error('Please enter a valid email.','Error');
    }
  }

  removeEmail(index: number) {
    this.emailList.splice(index, 1);
  }
  removeCollisionEmail(index: number) {
    this.collisionEmailList.splice(index, 1);
  }
  selectDomain(domain: string) {
    // const parts = this.newEmail.split('@')[0];
    // this.newEmail = `${parts}@${domain}`;
    const parts1 = this.newEmail1.split('@')[0];
    this.newEmail1 = `${parts1}@${domain}`;
  }
  // Auto domain for collision
  selectDomainForCollision(domain: string, inputRef: HTMLInputElement) {
    const prefix = this.newEmail.split('@')[0];
    this.newEmail = `${prefix}@${domain}`;
    const prefix1 = this.newEmail1.split('@')[0];
    // this.newEmail1 = `${prefix1}@${domain}`;
    inputRef.focus();
    this.addEmailForCollision(); // auto-trigger add
  }

  // Email validation
  validateEmail(email: string): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  }
  // All organization id
  getAllOrganizationId(): void {
    this.fleetService.getAllFleetList().subscribe(
      (response: any) => {
        this.fleetList = response;
      },
      (error) => {
        console.error('Error fetching fleet list:', error);
      }
    );
  }
  groupList: any;
  groupIdData: any;
  selectGroupId() {
    if (!this.fleetIdData) return;
    const fleetId = Number(this.fleetId);
      this.fleetService.getFleetGroups(fleetId, this.customConsumer).subscribe((res: any) => {
        const nestedGroups = res?.groups || [];

        // Flatten groups & subgroups into one list
        this.groupList = this.flattenGroups(nestedGroups);
        console.log(this.groupList )
        // Optionally preselect a default if needed
        // this.groupIdData = this.groupList[0]?.id; // optional
      }, err => {
        console.error('Error fetching sub-groups:', err);
      })
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
}
  // Select fleet Id and onchange toggle false
  selectFleet(selectedFleet: any): void {
    console.log(selectedFleet,'ss');
    this.emailList = [];
    this.collisionEmailList = []
    this.thresholdValue= selectedFleet?.profiling?.postSpeedLimit ? selectedFleet?.profiling?.pslUpperThreshold : selectedFleet?.profiling?.overSpeeding ? selectedFleet?.profiling?.overSpeeding : 65;
    this.postSpeedLimit = selectedFleet?.profiling?.postSpeedLimit ? selectedFleet?.profiling?.postSpeedLimit : false;
    this.fleetId = selectedFleet.id;
    this.toggles.idling = selectedFleet?.profiling?.isIdling ? selectedFleet?.profiling?.isIdling : false;
    this.toggles.harshCornering = selectedFleet?.profiling?.hasHarshCornering ? selectedFleet?.profiling?.hasHarshCornering : false;
    this.toggles.harshBraking = selectedFleet?.profiling?.hasHarshBraking ? selectedFleet?.profiling?.hasHarshBraking : false;
    this.toggles.harshAcceleration = selectedFleet?.profiling?.hasHarshAcceleration ? selectedFleet?.profiling?.hasHarshAcceleration : false;
    this.toggles.overspeeding = selectedFleet?.profiling?.isOverSpeeding ? selectedFleet?.profiling?.isOverSpeeding:false;
    this.toggles.collision = selectedFleet?.profiling?.hasCollision ? selectedFleet?.profiling?.hasCollision : false;
    this.getNotificationEmail(this.toggles.overspeeding,selectedFleet?.profiling?.overSpeedingEventEmails,this.toggles.collision,selectedFleet?.profiling?.collisionEventEmails)
    this.selectGroupId()

  }

  getNotificationEmail(os,osEmails,hc,hcEmails) {
    if(osEmails) {
      let email = osEmails.split(',')
      this.emailList = email
    }
    if(hcEmails) {
      let collisionEmail = hcEmails.split(',')
      this.collisionEmailList = collisionEmail
    }
  }

  showFleetIdError: boolean = false;
  consumer: any = "All";
  consumerList: {name: any; startDate: any }[];
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetIdData: any;
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem("userRole"));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem("multiRole"));
    let customConsumers = JSON.stringify(
      sessionStorage.getItem("custom-consumer")
    );
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === "role_user_fleet") {
      let fleetId = JSON.stringify(sessionStorage.getItem("fleetUserId"));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;
    }
  }
  // Save report
  submitUpdateNotificationAlerts(): void {
    this.spinner.show();

    // ✅ Determine the fleetId based on the role
    const fleetIdRaw = this.user === 'role_user_fleet' ? this.fleetIdData : this.fleetId;
    const fleetId = Number(fleetIdRaw);
    console.log(fleetId,'asda')
    // ❌ Validation: invalid fleetId
    // if (isNaN(fleetId) || fleetId <= 0) {
    //   this.showFleetIdError = true;
    //   this.toastr.error('Please select a valid Fleet ID.', 'Validation Error');
    //   this.spinner.hide();
    //   return;
    // }

    // this.showFleetIdError = false;

    const requestBody: any = {
      collisionSetting: {
        hasCollision: this.toggles.collision,
        collisionEventEmails: [...this.collisionEmailList],
        notificationFrequency: this.selectedOptionForCollision
      },
      overSpeedingSetting: {
        isOverSpeeding: this.toggles.overspeeding,
        overSpeedingEventEmails: [...this.emailList],
        notificationFrequency: this.selectedOption,
        postSpeedLimit: this.postSpeedLimit === true,
        pslUpperThreshold: this.postSpeedLimit ? this.thresholdValue : 5,
        spdLimit: this.postSpeedLimit ? null : this.thresholdValue
      },
      hasHarshAcceleration: this.toggles.harshAcceleration,
      hasHarshBraking: this.toggles.harshBraking,
      hasHarshCornering: this.toggles.harshCornering,
      isIdling: this.toggles.idling
    };

    this.fleetService.updateNotificationAlerts(fleetId, this.groupIdData, requestBody).subscribe(
      (response) => {
        // Reset state
        this.toggles = {
          idling: false,
          harshCornering: false,
          harshBraking: false,
          harshAcceleration: false,
          overspeeding: false,
          collision: false
        };

        this.collisionEmailList = [];
        this.emailList = [];
        this.fleetItem = null;
        this.fleetSelect.clearModel()
        this.fleetId = null;
        this.thresholdValue = 65
        this.postSpeedLimit = false
        this.toastr.success('Notification saved successfully');
        this.spinner.hide();
        this.getAllOrganizationId();
      },
      (error) => {
        this.toastr.error(error?.error?.apierror?.message);
        this.spinner.hide();
      }
    );
  }


  selectThreshold(val) {
    this.thresholdValue = val == 'config' ? 65 : 5
    this.postSpeedLimit = val == 'config' ? false : true
  }


}
