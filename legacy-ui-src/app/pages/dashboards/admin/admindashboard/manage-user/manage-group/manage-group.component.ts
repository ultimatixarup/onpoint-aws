import { Component,OnInit,ViewChild,TemplateRef } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { catchError, pluck, shareReplay } from "rxjs/operators";
import { Subscription, of } from "rxjs";
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { FleetService } from 'src/app/core/services/users-role.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface TreeNode {
  id: number;
  name: string;
  level: number;
  expanded?: boolean;
  children?: TreeNode[];
  isEditing?: boolean; // to track edit state
  parentGroupId?: number | null;
}
export interface FlatTreeNode {
  id: number;
  name: string;
  level: number;
  count: number;
  expanded?: boolean;
  isEditing?: boolean;
  parentGroupId?: number | null;
  children?: FlatTreeNode[];
  expandable: boolean;
  fleetId: number;
  parent?: FlatTreeNode | null; // ✅ Add this line
}


interface GroupNode {
  groupId?: number;
  parentGroupId?: number;
  name: string;
  availableGroups: GroupNode[]; // dropdown options
  selectedGroupId?: number;     // selected group from dropdown
  children?: GroupNode[];
  newInputVisible?: boolean;    // input field visible for new addition
}

interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: number
}
@Component({
  selector: 'app-manage-group',
  templateUrl: './manage-group.component.html',
  styleUrls: ['./manage-group.component.scss']
})
export class ManageGroupComponent implements OnInit {
  @ViewChild('errorModal') errorModal: TemplateRef<any>
  consumer: any = "All";
  fleetList: any;
  fleetIdData: any;
  fleetIdDataAdd: any;
  consumerList: any;
  getTypeList: any;
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  fleetIdValueNew: any;
  subscription$: Subscription = new Subscription();
  // groupList: any;
  groupIdData: any;
  groupIdDatas: any;
  flatTreeData: FlatTreeNode[] = [];
  selectedReminderId: string;
  selectedReminderVin: string;
  fleetListAdd: any;
  fleetId: number;
  newGroupName: string = '';
  selectedNode: any = null;
    newGroupNames: { name: string }[] = [];
    groupList: any[] = []; // assuming this is already populated
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
  constructor(private modalService: NgbModal,private fleetService: FleetService,private _vehicleService: TaxonomyService,private dashboardservice: TaxonomyService,
    private toaster: ToastrService,
    private spinner: NgxSpinnerService,
  ) {
    this.showRole()
  }
  // flatTreeData: TreeNode[] = [];
  ngOnInit(): void {
    this.getAllConsumers()

  }

  // Show Role
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
    }
  }
  // Get Consumer
  async getAllConsumers(): Promise<void> {
    try {
      const response = await this._vehicleService
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
  notification: boolean = true
  // Consumer Change
  async selectConsumer() {
    this.notification = false;
    this.selectConsumers();
    this.apiGetData()
    this.getGroupData()
  }
  // Get Fleet ID
  selectConsumers() {
  this.subscription$.add(
        this._vehicleService.getFleetList(this.customConsumer).subscribe(
          (res: any) => {
            this.fleetList = res;
            this.fleetListAdd = res;

            this.fleetList = this.fleetList.sort((a, b) => {
              return a.id - b.id;
            });
            this.fleetListAdd = this.fleetListAdd.sort((a, b) => {
              return a.id - b.id;
            });
            this.selectGroupId()
            this.fleetIdData = null;
          },
          (err) => { }
        )
      );

  }
  // Fleet Id Change
  selectedFleet: any = null; // Store the full fleet object
  onFleetIdChange() {
    this.selectGroupId();
    this.fleetService.setFleetId(this.fleetIdData);

    this.groupIdData = null;
    this.newGroupNames = [];

    // Filter groupList by selected fleet
    if (this.fleetIdData) {
      const selectedFleet = this.fleetList.find(fleet => fleet.fleetId === this.fleetIdData);
      if (selectedFleet) {
        this.flatTreeData = this.buildFlatTree([selectedFleet]);
      }
    } else {
      this.flatTreeData = this.buildFlatTree(this.fleetList);
    }

    this.apiGetData(this.fleetIdData);
    this.apiGetData()
    this.getGroupData()
  }

  // Get Group id
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

  // Group Id change
  onGroupIdChange(selected: any) {
    this.groupIdData = typeof selected === 'object' ? selected.id : selected;
  }
  onGroupChange(): void {
    this.newGroupNames = this.groupIdData ? [{ name: '' }] : [];
  }

  addNewGroupInput(): void {
    this.newGroupNames.push({ name: '' });
  }

  removeGroupInput(index: number): void {
    this.newGroupNames.splice(index, 1);
  }
  // Tree Hierarchy
  apiGetData(fleetId?: number | string): void {
    const validFleetId = (fleetId && fleetId !== 'All') ? Number(fleetId) : undefined
    const rawConsumer = this.customConsumer;
    const validConsumer = rawConsumer && rawConsumer !== 'All' ? rawConsumer : undefined;
    if (this.user === 'role_consumer_fleet'){
    this.subscription$.add(
     this.dashboardservice.getFleetGroupss(validFleetId, validConsumer).subscribe((res: any) => {
        const fleets = (Array.isArray(res) ? res : [res]).filter(f => f);

        const sortGroupsById = (groups: any[]): any[] =>
          groups.sort((a, b) => b.id - a.id).map(group => ({
            ...group,
            subgroups: group.subgroups ? sortGroupsById(group.subgroups) : []
          }));

        const assignFleetId = (groups: any[], fleetId: number): void => {
          groups.forEach(group => {
            group.fleetId = fleetId;
            if (group.subgroups?.length) {
              assignFleetId(group.subgroups, fleetId);
            }
          });
        };

        fleets.forEach(fleet => {
          if (fleet.groups?.length) {
            fleet.groups = sortGroupsById(fleet.groups);
            assignFleetId(fleet.groups, fleet.fleetId); // 🚨 THIS ensures every group has fleetId
          }
        });

        fleets.sort((a, b) => {
          const getDepthPriority = (fleet: any): number => {
            const hasGroups = fleet.groups?.length > 0;
            const hasSubgroups = fleet.groups?.some((group: any) =>
              group.subgroups?.length > 0 || group.subgroups?.some((sub: any) => sub.subgroups?.length > 0)
            );
            return hasSubgroups ? 2 : hasGroups ? 1 : 0;
          };
          return getDepthPriority(b) - getDepthPriority(a);
        });

        this.fleetList = fleets;
        this.flatTreeData = [...this.buildFlatTree(fleets)];
      }));
    }

    if (this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.subscription$.add(
       this.dashboardservice.getFleetGroups(validFleetId, validConsumer).subscribe((res: any) => {
          const fleets = (Array.isArray(res) ? res : [res]).filter(f => f);

          const sortGroupsById = (groups: any[]): any[] =>
            groups.sort((a, b) => b.id - a.id).map(group => ({
              ...group,
              subgroups: group.subgroups ? sortGroupsById(group.subgroups) : []
            }));

          const assignFleetId = (groups: any[], fleetId: number): void => {
            groups.forEach(group => {
              group.fleetId = fleetId;
              if (group.subgroups?.length) {
                assignFleetId(group.subgroups, fleetId);
              }
            });
          };

          fleets.forEach(fleet => {
            if (fleet.groups?.length) {
              fleet.groups = sortGroupsById(fleet.groups);
              assignFleetId(fleet.groups, fleet.fleetId); // 🚨 THIS ensures every group has fleetId
            }
          });

          fleets.sort((a, b) => {
            const getDepthPriority = (fleet: any): number => {
              const hasGroups = fleet.groups?.length > 0;
              const hasSubgroups = fleet.groups?.some((group: any) =>
                group.subgroups?.length > 0 || group.subgroups?.some((sub: any) => sub.subgroups?.length > 0)
              );
              return hasSubgroups ? 2 : hasGroups ? 1 : 0;
            };
            return getDepthPriority(b) - getDepthPriority(a);
          });

          this.fleetList = fleets;
          this.flatTreeData = [...this.buildFlatTree(fleets)];
        }));
      }
  }

  buildFlatTree(fleets: any[]): FlatTreeNode[] {
    // ✅ Find the fleet with highest fleetId
    const latestFleetId = Math.max(...fleets.map(f => f.fleetId));

    return fleets.map(fleet => {
      const isLatest = fleet.fleetId === latestFleetId;

      const fleetNode: FlatTreeNode = {
        id: fleet.fleetId,
        name: fleet.fleetName,
        count: fleet.count,
        level: 0,
        expandable: fleet.groups?.length > 0,
        expanded: isLatest, // ✅ Only expand the latest-added fleet
        isEditing: false,
        children: [],
        fleetId: fleet.fleetId,
        parent: null
      };

      fleetNode.children = this.buildGroupNodes(fleet.groups || [], 1, fleetNode);
      return fleetNode;
    });
  }

  buildGroupNodes(groups: any[], level: number, parent: FlatTreeNode | null = null): FlatTreeNode[] {
    return groups.map(group => {
      const node: FlatTreeNode = {
        id: group.id,
        name: group.name,
        level,
        count: group.count,
        expandable: group.subgroups?.length > 0,
        expanded: false, // ❌ Always collapsed by default
        isEditing: false,
        parentGroupId: group.parentGroupId ?? null,
        children: [],
        fleetId: group.fleetId,
        parent: parent
      };

      node.children = this.buildGroupNodes(group.subgroups || [], level + 1, node);
      return node;
    });
  }


 getRootNode(node: FlatTreeNode): FlatTreeNode {
    let current = node;
    while (current?.parent) {
      current = current.parent;
    }
    return current;
  }
  selectedFleetNode: any; // add at top of the component
  // Tree Expand
  toggleNode(node: any): void {
    this.selectedFleetNode = node;
    node.expanded = !node.expanded;

    const fleetId = node?.fleetId || node?.id;
  }

  assignFleetIdToGroups(node: any, fleetId: number): void {
    node.fleetId = fleetId; // Assign to current node
    if (node.children && node.children.length) {
      node.children.forEach(child => this.assignFleetIdToGroups(child, fleetId));
    }
  }

  // Edit group and subgroup name
  startEdit(node: any): void {
    node.originalName = node.name; // Save original name
    node.isEditing = true;
  }
  saveEdit(node: any): void {
    const updatedName = (node.name || '').trim();

    // Proceed even if name is same, but avoid empty
    if (!updatedName) {
      this.toaster.error("Group name cannot be empty");
      return;
    }

    this.dashboardservice.updateFleetGroup(node.id, updatedName, node.parentGroupId)
      .subscribe({
        next: () => {
          node.isEditing = false; // stop editing mode after save
          this.toaster.success("Group name updated successfully");
        },
        error: err => {
          console.error('Update failed', err);
          this.toaster.error(err?.error?.apierror?.message);
        }
      });
  }

  // Delete group
  deletePopUp(deleteConfirmationPopup: any, id: string, name: string): void {
    this.selectedReminderId = id;
    this.selectedReminderVin = name;
    this.modalService.open(deleteConfirmationPopup, {
      size: 'sl',
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });
  }
  // Confirm delete popup
  confirmGroupDelete(modalRef: any): void {
    this.dashboardservice.deleteGroup(this.selectedReminderId).subscribe({
      next: () => {
        modalRef.close();
        this.toaster.success('Group successfully deleted.')
        this.apiGetData(); // Refresh the group tree
      },
      error: (err) => {
        modalRef.close();
        console.error('Failed to delete group:', err);
        alert('Error deleting group');
      }
    });
  }
  // Add group and subgroup model
  openAddUserModal(modalRef: TemplateRef<any>, node: FlatTreeNode): void {
    const rootFleetNode = this.getRootNode(node);
    const fleetId = rootFleetNode.fleetId;
    if (!fleetId) {
      alert('Fleet ID not found.');
      return;
    }
    this.fleetIdData = fleetId;
    this.selectedNode = node;
    this.newGroupName = '';
    this.modalService.open(modalRef);
  }
  totalSelectedVINCount: number = 0;
  vinGroupMap: { [groupId: number]: Set<string> } = {};
  vinCountMap: { [groupId: number]: number } = {};
  vinTotalCountMap: { [groupId: number]: number } = {};
  getVinList(fleetId: number, groupId?: number): void {
    this.vinDetails = null;
    this.vinChecked = null;
    this.fleetId = fleetId;
    const consumer =  this.customConsumer;
    this.subscription$.add(
      this.dashboardservice.getgroupVINLists(consumer, fleetId, groupId).subscribe(
        (res: any) => {
          const vinList = res?.vinAliasList || [];
          this.vinTotalCountMap[groupId || 0] = vinList.length;
          vinList.filter((item:any)=>{
            return item.checked = item?.groupId == this.groupIdData ? true : false
          })
          this.vinDetails = vinList
          this.vinChecked = this.vinDetails.filter(v=>v.checked).length;
        },
        err => {
          console.error('Error fetching VIN list:', err);
          this.vinDetails = null;
        }
      )
    );
  }

  // Open vin model
  openVINDetailsModal(vinModel: any, fleetId: number, groupId: number,node?:any): void {
    this.fleetIdData = fleetId;
    this.currentGroupId = groupId
    this.nestedGroup = false
    if (node.level) {
      this.groupIdData = node.id;
      this.previousGroupId = node.parentGroupId;
      this.getVinList(fleetId, this.groupIdData);
    }
    this.modalService.open(vinModel, { size: 'sl', centered: true });
  }

  findLevel2GroupId(node: any): number | null {
    let current = node;
    while (current && current.level > 2) {
      current = current.parent;
    }
    return current && current.level === 2 ? current.id : null;
  }



  getFleetIdFromNode(node: any): number | null {
    if (node.level === 0) return node.id;

    if (node.fleetId) return node.fleetId;

    // Try parent lookup if you're storing the tree
    if (node.parent?.id) return node.parent.id;

    return this.fleetIdData || this.selectedFleetNode?.fleetId || this.selectedFleetNode?.id || null;
  }

  // Update VIN API
  async onSave() {
    this.errorList = null
    const checkedVINs = await this.getCheckedVINs();
    let body = {
      fleetId: this.fleetId,
      groupId: this.currentGroupId,
      vinList: checkedVINs
    }
    this.spinner.show()
    this.subscription$.add(
      this.dashboardservice.assignVIN(body).subscribe((res:any)=>{
        this.spinner.hide()
        this.apiGetData();
        this.fleetIdData = null;

        if(res?.length > 0) {
          this.errorList =res.filter(item=>{return item?.status == "FAILED"})
          if(this.errorList?.length > 0) {
            this.openErrorModal(this.errorModal)
          } else {
            this.toaster.success('VIN assigned to group successfully')
          }
        }
      },err=>{
        this.spinner.hide()
        this.toaster.error(err?.error?.apierror?.message)
      })
    )
    // Do something with the selected VINs (e.g., send to API)
  }

  getCheckedVINs(): string[] {
    return (this.vinDetails || [])
      .filter(v => v.checked && !v.disableCheck)  // ONLY checked AND NOT disabled
      .map(v => v.VIN);
  }

  selectVIN() {
    this.vinChecked = this.vinDetails.filter(v => v.checked).length
  }

  openErrorModal(errModal) {
    this.modalService.open(errModal, { size: 'lg', centered: true });

  }





  onVinToggle(option: any): void {
    // if (!this.groupId) return;

    // if (!this.globalSelectedVINMap[this.groupId]) {
    //   this.globalSelectedVINMap[this.groupId] = [];
    // }

    // if (option.checked) {
    //   const alreadyExists = this.globalSelectedVINMap[this.groupId].some(v => v.VIN === option.VIN);
    //   if (!alreadyExists) {
    //     this.globalSelectedVINMap[this.groupId].push({
    //       VIN: option.VIN,
    //       Alias: option.Alias,
    //       groupId: this.groupId,
    //       fleetId: this.fleetId
    //     });
    //   }
    // } else {
    //   this.globalSelectedVINMap[this.groupId] = this.globalSelectedVINMap[this.groupId].filter(
    //     v => v.VIN !== option.VIN
    //   );
    // }

    this.vinChecked = this.vinDetails.filter(v => v.checked).length;
    // this.updateCheckedMappedVinCount();
  }



  getGroupData() {
    this.subscription$.add(
      this.dashboardservice.getGroups().subscribe((res: any) => {
        this.groupList = res || [];
        this.groupList.sort((a, b) => a.fleetId - b.fleetId);
        this.filteredGroupList = this.groupList.filter(g => g.fleetId === this.fleetIdData);
      })
    );
  }
  updateCheckedMappedVinCount() {
    this.checkedMappedVinCount = {};  // clear previous counts

    if (!this.vinDetails) return;

    this.vinDetails.forEach(vin => {
      if (vin.checked && vin.originalGroupId) {
        this.checkedMappedVinCount[vin.originalGroupId] = (this.checkedMappedVinCount[vin.originalGroupId] || 0) + 1;
      }
    });

    // console.log('Checked & mapped VIN counts per group:', this.checkedMappedVinCount);
  }
  // reloadPage(): void {
  //   window.location.reload();
  // }
  checkedMappedVinCount: { [groupId: number]: number } = {};
  submitGroups(): void {
    if (!this.newGroupName?.trim() || !this.fleetIdData) {
      alert('Please enter a group/subgroup name and select a fleet.');
      return;
    }

    const payload: any = {
      fleetId: this.fleetIdData,
      groups: []
    };

    if (this.selectedNode) {
      // ✅ Adding a subgroup
      payload.groups.push({
        name: this.newGroupName,
        parentGroupId: this.selectedNode.id   // <-- direct parent ID here
      });
    } else {
      // ✅ Adding a top-level group
      payload.groups.push({
        name: this.newGroupName
      });
    }
    this.dashboardservice.addGroups(payload).subscribe(res => {
        // this.reloadPage()
        // this.apiGetData(this.fleetIdData);
        this.apiGetData();
        this.getGroupData()
        this.modalService.dismissAll();    // Close modal
      },
      err => {
        console.error('Error adding group:', err);
      }
    );
  }
}
