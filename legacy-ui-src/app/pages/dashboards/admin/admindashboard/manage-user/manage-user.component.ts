import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Subscription, of } from "rxjs";
import { TaxonomyService } from '../../../taxonomy.service';
import { catchError, pluck, shareReplay } from "rxjs/operators";
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: number
}
export interface FlatTreeNode {
  name: string;
  level: number;
  expanded: boolean;
  children?: FlatTreeNode[];
  isEditing?: boolean;
  type?: 'admin' | 'org' | 'fleet' | 'group' | 'email';
  emailId?: string;
  createdBy?: string;     // ✅ Add this
  createdOn?: string;     // ✅ Add this
}

@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit {
  @Output() modelClose:EventEmitter<string> = new EventEmitter<string>();
  isTsp:any='org'
  modalRef: NgbModalRef;
  currentStep = 1;
  userDetails = {
    name: '',
    emailId: ''
  };
  subscription$:Subscription = new Subscription()
  fleetList:any;
  fleetData:any;
  groupData:any;
  groupList:any;
  userList: any;
  selectedBAOption:any;
  editName: any;
  fleetId: any;
  fleetName:any=""
  sortbygrp:boolean=false
  sortDirection: 'asc' | 'desc' = 'asc';
  userGroupListData: any;
    consumer: any = "All";
    fleetIdData: any;
    fleetIdDataAdd: any;
    consumerList: any;
    getTypeList: any;
    user: any;
    multiRoles: any;
    customConsumer: any;
    loginUser: any;
    fleetIdValueNew: any;
    // groupList: any;
    groupIdData: any;
    groupIdDatas: any;
    flatTreeData: FlatTreeNode[] = [];
    selectedReminderId: string;
    selectedReminderVin: string;
    fleetListAdd: any;
    newGroupName: string = '';
    selectedNode: any = null;
      newGroupNames: { name: string }[] = [];
    globalSelectedVINMap: {
      [groupId: string]: {
        VIN: string;
        Alias: string;
        groupId: string;
        fleetId: number;
      }[];
    } = {};
    vinList:any;
    vinDetails:any;
    vinChecked: any;
    selectedfleetId: any;
    errorList: any;
    groupId: any;
    groupName: any;
    filteredGroupList: any[];
    nestedGroup: boolean;
    previousGroupId: any;
    currentGroupId: number;

  userTreeData: FlatTreeNode[] = [];

  constructor(private modalService: NgbModal,private spinner:NgxSpinnerService,private fleetService:TaxonomyService,private toastr : ToastrService) { }

  ngOnInit(): void {
    this.showRole()
    this.getAllConsumers()
    // Load users on init if consumer is set
    if (this.customConsumer || this.consumer !== 'All') {
      this.getAllUser()
    }
  }

    async getAllConsumers(): Promise<void> {
      try {
        const response = await this.fleetService
          .getAllConsumers()
          .pipe(
            pluck('data'),
            catchError(() => of([])),
            shareReplay(1)
          )
          .toPromise();

        const excludedConsumers = new Set([
          'Slick', 'OneStep', 'Arvind_insurance', 'HD Fleet LLC', 'GEICO',
          'Forward thinking GPS', 'Geo Toll', 'Matrack',
          'Geico', 'Test fleet', 'Rockingham', 'Axiom', 'GeoToll',
        ]);

        this.consumerList = (response as Consumer[])
          .filter((item) => item.contract && !excludedConsumers.has(item.name))
          .map((item) => ({
            name: item.name,
            startDate: item.contract?.startDate,
            id: item.id // Handle optional startDate
          }));
        this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error('Error fetching consumers:', error);
      }
    }

  userIdGet() {
   let fleetId =  sessionStorage.getItem('fleetUserId')
   this.fleetData = JSON.parse(fleetId)
   this.groupByFleet(this.fleetData)
   this.getFleetDetail()
  }

  getFleetDetail() {
    this.subscription$.add(
      this.fleetService.getFleetById(this.fleetData).subscribe((res:any)=>{
        let data = this.fleetData;
        if(res) {
          this.fleetName = res[data]
        }
      })
    )
  }

  getAllUser() {
   // Determine which consumer value to use
   const consumerToUse = this.consumer && this.consumer !== 'All' ? this.consumer : this.customConsumer;

   // Only make API call if we have a valid consumer
   if (!consumerToUse) {
     console.warn('No consumer selected');
     this.userTreeData = [];
     return;
   }

   this.fleetService.getUserForadmin(consumerToUse).subscribe({
      next: (res: any) => {
        this.userTreeData = this.buildEmailTree(res);
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.userTreeData = [];
      }
    });


  }

  toggleNode(node: FlatTreeNode): void {
    node.expanded = !node.expanded;
  }

  buildEmailTree(data: any[]): FlatTreeNode[] {
    const tree: FlatTreeNode[] = [];

    // Flatten all users with their roles
    const allUsers = data
      .map(roleBlock =>
        roleBlock.users.map(user => ({
          ...user,
          role: roleBlock.role
        }))
      )
      .reduce((acc, val) => acc.concat(val), []);

    // === ADMIN NODE ===
    const adminUsers = allUsers.filter(u => u.role === 'ROLE_CONSUMER_FLEET');

    if (adminUsers.length > 0) {
      const adminNode: FlatTreeNode = {
        name: 'Admin',
        level: 0,
        expanded: true,
        type: 'admin',
        children: [{
          name: 'All',
          level: 1,
          expanded: false,
          type: 'group',
          children: adminUsers.map(user => ({
            name: user.name,
            emailId: user.emailId,
            createdOn: user.createdOn,
            createdBy: user.createdBy,
            level: 2,
            expanded: false,
            type: 'email',
            children: []
          }))
        }]
      };
      tree.push(adminNode);
    }

    // === ORGANIZATION NODE ===
    const orgNode: FlatTreeNode = {
      name: 'Organization',
      level: 0,
      expanded: false,
      type: 'org',
      children: []
    };

    const orgUsers = allUsers.filter(u =>
      u.role === 'ROLE_ORG_GROUP' || u.role === 'ROLE_USER_FLEET'
    );

    const fleetMap = new Map<string, Map<string, FlatTreeNode[]>>();

    orgUsers.forEach(user => {
      const fleet = user.tagTo?.fleetName?.trim() || 'Unknown Fleet';
      const group = user.tagTo?.groupName?.trim() || 'All';
      const email = user.emailId;

      if (!fleetMap.has(fleet)) fleetMap.set(fleet, new Map());
      const groupMap = fleetMap.get(fleet)!;

      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push({
        name: user.name,                 // <-- show user's name
        emailId: user.emailId,
        createdOn: user.createdOn,
        createdBy: user.createdBy,
        level: 3,
        expanded: false,
        type: 'email',
        children: []
      });
    });

    fleetMap.forEach((groupMap, fleetName) => {
      const fleetNode: FlatTreeNode = {
        name: fleetName,
        level: 1,
        expanded: false,
        type: 'fleet',
        children: []
      };

      groupMap.forEach((emails, groupName) => {
        fleetNode.children!.push({
          name: groupName,
          level: 2,
          expanded: true,
          type: 'group',
          children: emails
        });
      });

      orgNode.children!.push(fleetNode);
    });

    // Only add Organization node if it has children
    if (orgNode.children!.length > 0) {
      tree.push(orgNode);
    }

    return tree;
  }




  transformUserTree(rawData: any[]): any[] {
    const result = [];

    const consumerFleet = rawData.find(r => r.role === 'ROLE_CONSUMER_FLEET');
    const orgGroup = rawData.find(r => r.role === 'ROLE_ORG_GROUP');
    const userFleet = rawData.find(r => r.role === 'ROLE_USER_FLEET');

    if (consumerFleet) {
      result.push({
        label: 'Admin',
        children: [
          {
            label: 'ROLE_CONSUMER_FLEET',
            users: consumerFleet.users
          }
        ]
      });
    }

    if (userFleet) {
      result.push({
        label: 'Fleet Owner',
        children: [
          {
            label: 'ROLE_USER_FLEET',
            users: userFleet.users
          }
        ]
      });
    }

    if (orgGroup) {
      result.push({
        label: 'Organization Fleet',
        children: [
          {
            label: 'ROLE_ORG_GROUP',
            users: orgGroup.users
          }
        ]
      });
    }

    return result;
  }


  sortByLatestCreatedOn(data: any[]): any[] {
    return data.map(roleGroup => {
      const sortedUsers = [...roleGroup.users].sort((a: any, b: any) => {
        const dateA = a.createdOn ? new Date(a.createdOn).getTime() : -Infinity;
        const dateB = b.createdOn ? new Date(b.createdOn).getTime() : -Infinity;

        return dateB - dateA; // Latest date first
      });

      return {
        ...roleGroup,
        users: sortedUsers
      };
    });
  }

  eventsCall: any;
  refuelDetailsData: any;
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem("userRole"));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem("multiRole"));
    let customConsumers = JSON.stringify(
      sessionStorage.getItem("custom-consumer")
    );
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === "role_user_fleet" ) {
      let fleetId = JSON.stringify(sessionStorage.getItem("fleetUserId"));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;
    }
    if (  this.user ==='role_org_group') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
      }
  }

  getAllFleet() {
    this.spinner.show()
    this.subscription$.add(
    this.fleetService.getAllFleetList().subscribe((res:any)=>{
      this.fleetList = res;
     this.fleetList.sort((a, b) => {
           const dateA = new Date(a.createdOn);
           const dateB = new Date(b.createdOn);
           return dateB.getTime() - dateA.getTime();
         });
         this.spinner.hide()
    },err=>{
      this.spinner.hide()
    })
    )

  }

  selectFleet(evt) {
    if(this.fleetData) {
      this.groupByFleet(this.fleetData)

    }
  }
  notification: boolean = true
    // Consumer Change
    async selectConsumer() {
      this.notification = false;
      this.customConsumer = this.consumer && this.consumer !== 'All' ? this.consumer : this.customConsumer;
      this.getAllUser()
    }
    // Get Fleet ID
    selectConsumers() {
 this.subscription$.add(
          this.fleetService.getFleetList(this.customConsumer).subscribe(
            (res: any) => {
              this.fleetList = res;
              this.fleetListAdd = res;

              this.fleetList = this.fleetList.sort((a, b) => {
                return a.id - b.id;
              });
              this.fleetListAdd = this.fleetListAdd.sort((a, b) => {
                return a.id - b.id;
              });

              this.fleetIdData = null;
            },
            (err) => { }
          )
        );

    }


    groupByFleet(fleedId) {
      this.subscription$.add(
        this.fleetService.getGroupList(fleedId).subscribe((res:any)=>{
          this.groupList = res
        },err=>{
          // this.errMsg(err)
        })
      )
    }

    errMsg(err) {
      this.toastr.error(err?.error?.apierror?.message)
    }

    openAddUserModal(addUser) {
      // Load fleet list when modal opens
      this.loadFleetList();
      this.modalRef=this.modalService.open(addUser, { size: 'sl', centered: true });

    }

    loadFleetList() {
      this.spinner.show();
      this.subscription$.add(
        this.fleetService.getFleetList(this.customConsumer).subscribe(
          (res: any) => {
            this.fleetList = res;
            this.fleetList = this.fleetList.sort((a, b) => {
              return a.id - b.id;
            });
            this.spinner.hide();
          },
          (err) => {
            this.spinner.hide();
          }
        )
      );
    }

    submitForm() {
      // Determine fleet ID based on user role
      let fleetIdToUse = this.fleetData;

      // If logged-in user is a fleet user, use their fleet ID
      if (this.user === 'role_user_fleet' || this.user === 'role_org_group') {
        fleetIdToUse = this.fleetIdValueNew;
      }

      const requestBody = {
        ...this.userDetails,
        userRoleType: this.isTsp === 'tspAdmin' ? 'TSP' : 'FLEET'
      };

      // Add fleetId and groupId only if not TSP admin
      if (this.isTsp !== 'tspAdmin') {
        requestBody['fleetId'] = fleetIdToUse;
        if (this.groupData) {
          requestBody['groupId'] = this.groupData;
          requestBody.userRoleType = 'GROUP';
        }
      }

      this.modalRef.close();
      this.subscription$.add(
        this.fleetService.addUser(requestBody).subscribe({
          next: () => {
            this.currentStep = 1;
            this.isTsp = 'tspAdmin';
            this.userDetails = { name: '', emailId: '' };
            this.groupData = null;
            this.fleetData = null;
            this.toastr.success('User Added !')
            this.getAllUser()
                    },
          error: (err) => {
            this.errMsg(err)
          }
        })
      );
    }

    submitFormTSP() {
      const requestBody = {
        emailId: this.userDetails.emailId,
        name: this.userDetails.name,
        userRoleType: 'TSP'
      };

      this.modalRef.close();

      this.subscription$.add(
        this.fleetService.addUser(requestBody).subscribe({
          next: () => {
            this.currentStep = 1;
            this.isTsp = 'tspAdmin';
            this.userDetails = { name: '', emailId: '' };
            this.groupData = null;
            this.fleetData = null;
            this.toastr.success('User Added!');
            this.getAllUser();
          },
          error: (err) => {
            this.errMsg(err);
          }
        })
      );
    }



  getRoleDisplay(role: string): string {
    switch(role) {
      case 'ROLE_CONSUMER_FLEET': return 'Admin';
      case 'ROLE_USER_FLEET': return 'Fleet';
      case 'ROLE_ORG_GROUP': return 'Group';
      default: return role;
    }
  }

  openDeletePopup(deleteData,user) {
    this.selectedBAOption = user;
    this.modalService.open(deleteData, { size: 'sl', centered: true });
  }

  openEditPopup(editData,user) {
    this.selectedBAOption = user;
    this.editName = user?.name
    this.modalService.open(editData, { size: 'sm', centered: true });
  }

  selectedUserDetails: any = null;

  openViewMore(viewMoreTemplate: any, user: any) {
    this.selectedUserDetails = user;
    this.modalService.open(viewMoreTemplate, { size: 'md', centered: true });
  }
  deleteUser() {
    const email = this.selectedBAOption?.emailId || this.selectedBAOption?.name;

    if (!email) return;

    this.subscription$.add(
      this.fleetService.deleteUserData(email).subscribe({
        next: (res) => {
          this.selectedBAOption = null;
          this.toastr.success('User deleted!');
          this.getAllUser();
        },
        error: (err) => {
          this.errMsg(err);
        }
      })
    );
  }


  editUser() {
    let body = {
      name:this.editName
    }
    this.subscription$.add(
      this.fleetService.editUserData(body,this.selectedBAOption?.emailId).subscribe({
        next : (res)=>{
          this.toastr.success('Successfully Updated')
          this.getAllUser()
        },error : (err) =>{
          this.errMsg(err)
        }
      })
    )
  }



  sortByGroup() {
    this.sortbygrp = !this.sortbygrp

    this.sortDirection = this.sortbygrp  ? 'asc' : 'desc';
    this.userList = this.sortByGroupName(this.userGroupListData, this.sortDirection);
  }

  sortByGroupName(data: any[], direction: 'asc' | 'desc' = 'asc'): any[] {
    return data.map(roleGroup => {
      const sortedUsers = [...roleGroup.users].sort((a: any, b: any) => {
        const groupA = a.tagTo.groupName?.toLowerCase() || 'All';
        const groupB = b.tagTo.groupName?.toLowerCase() || 'All';

        if (!groupA && !groupB) return 0;
        if (!groupA) return direction === 'asc' ? 1 : -1;
        if (!groupB) return direction === 'asc' ? -1 : 1;

        return direction === 'asc'
          ? groupA.localeCompare(groupB)
          : groupB.localeCompare(groupA);
      });

      return {
        ...roleGroup,
        users: sortedUsers
      };
    });
  }


  ngOnDestroy() {
    if(this.subscription$) {
      this.subscription$.unsubscribe()
    }
  }

}
