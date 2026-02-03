import { HttpClient } from "@angular/common/http";
import { Component, ElementRef, HostListener, OnInit, Renderer2, } from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "src/app/app.service";
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription } from "rxjs";
import { FleetService, LocationTypeService, SelectedLocationService, SelectedPeriodService, TimePeriodService } from "src/app/core/services/users-role.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as XLSX from 'xlsx';
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import moment from 'moment';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
}
@Component({
  selector: 'app-geo-fence-setup',
  templateUrl: './geo-fence-setup.component.html',
  styleUrls: ['./geo-fence-setup.component.scss']
})
export class GeoFenceSetupComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  searchTerm: string = "";
  timePeriods = [
    { label: "Till Date", value: "till_date" },
    { label: "Today", value: "daily" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Current Week", value: "weekly" },
    { label: "Current Month", value: "monthly" },
    { label: "Previous Month", value: "lastmonth" },
    // { label: "Custom Range", value: "CUSTOM_RANGE" },
  ];
  fromDate: string;
  toDate: string;
  selectedTimePeriod: string = "";
  selectedPeriod: string | null = null;
  isCardOpen = false;
  selectedOption: string = "customRange";
  geoFenceList: any[] = [];
  getTypeList: any;
  selectedTypes: any[][] = [];
  fleetId: number = 0;
  start: string = '2024-10-01';
  end: string = '2024-10-01';
  dataShow: any;
  IdData: any;
  consumer: any = "All";
  consumerList: {name: any; startDate: any }[];
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetList: any;
  fleetIdData: any;
  showFullAddress = false;
  hoveredIndex: number = -1;
  fleetIdValueNew: any;
  selectedLocationTypeData: any[][] = [];
  newFilteredGeofenceData = [];
  selectedGeofence: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  associatedData: any = [];
  groupList: any;
  selectedFleetDisplay: string = '';
  constructor( private timezoneService: TimezoneService,private modalService: NgbModal,private timePeriodService: TimePeriodService, private selectedLocationServiceData: SelectedLocationService, private selectedPeriodService: SelectedPeriodService, private fleetService: FleetService, public locationTypeService: LocationTypeService, private appService: AppService, private http: HttpClient, private elRef: ElementRef, private renderer: Renderer2, private router: Router, private _vehicleService: TaxonomyService) {
    this.newFilteredGeofenceData = this.geoFenceList;
  }
  @HostListener("document:click", ["$event"])
  onTimePeriodChangeData(selectedPeriod: string) {
    this.selectedTimePeriod = selectedPeriod;
    if (this.selectedPeriod === "CUSTOM_RANGE") {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
    }
    if (this.selectedPeriod === "till_date") {

    }
    this.timePeriodService.setSelectedPeriod(this.selectedPeriod);
    this.selectedPeriodService.setSelectedPeriod(this.selectedPeriod);
  }
  openCard() {
    this.isCardOpen = true;
  }
  closeCard() {
    this.isCardOpen = false;
  }
  onFleetIdChange() {
    this.selectGroupId()
    this.fleetService.setFleetId(this.fleetIdData);
    this.manageGeofenceLists()
  }

  groupIdData: any;
  selectGroupId() {
    if (!this.fleetIdData) return;

    this.subscription$.add(
      this._vehicleService.getOrganizationSubGroups(this.fleetIdData, this.consumer).subscribe((res: any) => {
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
  this.fleetService.setFleetId(this.fleetIdData);
    this.manageGeofenceLists()
}
  selectOption(dropdownId: string) {
    const dropdown = this.elRef.nativeElement
      .querySelector(`#${dropdownId}`) as HTMLElement; dropdown.style.display = "none";
  }

  onDateRangeSelected(dateRange: { fromDate: string; toDate: string }) {
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
  }
  handleOption(option: string) {
    this.selectedOption = option;
    this.selectedPeriod =
      this.timePeriods.find((period) => period.value === option)?.value || "";
    this.onTimePeriodChangeData(this.selectedPeriod);
  }
  navigateToGeofence() {
    this.router.navigate(['/adlp/admin/admindashboard/geoFenceSetup/addGeofence'])
   }

  viewGeofenceReport() {
    this.router.navigate(['/adlp/admin/admindashboard/geofence/manage-geofence'])
  }

  ngOnInit(): void {
    this.geoFenceList = []; // Initialize as empty array
    this.getGeofenceType()
    this.showRole()

    const savedFleetId = this.fleetService.getFleetId();
    if (savedFleetId) {
      this.fleetIdData = savedFleetId;
    }
    const savedPeriod = this.selectedPeriodService.getSelectedPeriod();
    if (savedPeriod) {
      this.selectedPeriod = savedPeriod;
    }
    const savedLocationType = this.selectedLocationServiceData.getSelectedLocationPeriod();
    if (savedLocationType && savedLocationType.length) {
      this.selectedTypes = savedLocationType;
    }

    // Reset filters for fresh load
    this.selectedPeriod = null;
    this.fleetIdData = null;
    this.selectedTypes = null;

    if (this.user == 'role_consumer_fleet') {
      this.selectConsumers()
    }

    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime(); // Update vehicle data when timezone changes
    });

    // Load geofence data after initialization
    this.manageGeofenceLists()
  }

    updateTime() {
      if (this.geoFenceList && this.geoFenceList.length > 0) {
        this.geoFenceList.forEach(geofence => {
          if (geofence.creationDate) {
            geofence.creationFormattedDate = moment.utc(geofence.creationDate)
              .tz(this.selectedTimezone)
              .format('MMM D, YYYY');

            geofence.creationFormattedTime = moment.utc(geofence.creationDate)
              .tz(this.selectedTimezone)
              .format('HH:mm');
          } else {
            geofence.creationFormattedDate = '--';
            geofence.creationFormattedTime = '--';
          }
        })}
        if (this.geoFenceList && this.geoFenceList.length > 0) {
          this.geoFenceList.forEach(geofence => {
            if (geofence.modifiedDate) {
              geofence.creationFormattedDatemodifiedDate = moment.utc(geofence.modifiedDate)
                .tz(this.selectedTimezone)
                .format('MMM D, YYYY');

              geofence.creationFormattedTimemodifiedDate = moment.utc(geofence.modifiedDate)
                .tz(this.selectedTimezone)
                .format('HH:mm');
            } else {
              geofence.creationFormattedDatemodifiedDate = '--';
              geofence.creationFormattedTimemodifiedDate = '--';
            }
          })}
          }

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
  async selectConsumer(consumer:string) {
    this.consumer = consumer
    await this.selectConsumers();
    this.manageGeofenceLists()
  }
  selectConsumers() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this._vehicleService.getFleetList(this.consumer).subscribe(
          (res: any) => {
            this.fleetList = res;
            this.fleetList = this.fleetList.sort((a, b) => {
              return a.id - b.id;
            });
            this.fleetIdData = null;
          },
          (err) => { }
        )
      );
    }
    else if (this.user === 'role_consumer_fleet') {
      this.subscription$.add(
        this._vehicleService.getFleetList(this.customConsumer).subscribe(
          (res: any) => {
            this.fleetList = res;
            this.fleetList = this.fleetList.sort((a, b) => {
              return a.id - b.id;
            });
            this.fleetIdData = null;
          },
          (err) => { }
        )

      );
    }
  }
  checkFleetId(tooltip: any) {
    if (!this.fleetId) {
      tooltip.open();
    } else {
      tooltip.close();
    }
  }
  async getGeofenceType() {
    await this._vehicleService.getGeofenceType().subscribe((res: any) => {
      this.getTypeList = res

    })
  }
  isButtonEnabled(): boolean {
    return Boolean(this.selectedPeriod) && Boolean(this.selectedTypes) && Boolean(this.fleetIdData);
  }
  navigateToGeofenceReport(taskId: string) {
    const queryParams = new URLSearchParams({
      selectedTypes: JSON.stringify(this.selectedTypes),
      selectedPeriod: this.selectedPeriod,
      selectedTypeNames: JSON.stringify(this.selectedLocationTypeNames)
    });
    this.router.navigate(['/adlp/admin/admindashboard/geofence/geofence-report', { taskId }],{ queryParams })
      .then(() => {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
  }
  // Onward time convertion CDT
  convertToCDT(dateTime: string): string {
    if (!dateTime) return '';
    const utcDateTime = new Date(dateTime);
    const cdtOffset = -6 * 60;
    const cdtDateTime = new Date(utcDateTime.getTime() + (cdtOffset * 60 * 1000));
    cdtDateTime.setMinutes(cdtDateTime.getMinutes());
    const cdtYear = cdtDateTime.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const cdtMonth = monthNames[cdtDateTime.getMonth()];
    const cdtDay = cdtDateTime.getDate().toString().padStart(2, '0');
    const cdtHours = cdtDateTime.getHours().toString().padStart(2, '0');
    const cdtMinutes = cdtDateTime.getMinutes().toString().padStart(2, '0');
    const cdtSeconds = cdtDateTime.getSeconds().toString().padStart(2, '0');
    return `${cdtMonth} ${cdtDay},${cdtYear} ${cdtHours}:${cdtMinutes}`;
  }
  formatDated(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${mm}-${dd}-${yyyy} ${hours}:${minutes}`;
  }
  // Route to report
  navigateToNewComponent(taskId) {
    const queryParams = new URLSearchParams({
      selectedTypes: JSON.stringify(this.selectedTypes),
      selectedPeriod: this.selectedPeriod,
      selectedTypeNames: JSON.stringify(this.selectedLocationTypeNames)

    });
    const fullPath = `/adlp/admin/admindashboard/geofence/geofence-report/${taskId}}`;
    window.location.href = fullPath;
  }
  // Geofence List consuemr
  async manageGeofenceList() {
    if(this.user === 'admin'){
    await this._vehicleService.getAllGeoFence(this.consumer, this.fleetIdData).subscribe((res: any) => {
      // Handle paginated response - extract content array
      const dataArray = res?.content ? res.content : (Array.isArray(res) ? res : []);
      this.geoFenceList = dataArray.sort((a: any, b: any) => {
        if (a.creationDate > b.creationDate) {
          return -1;
        } else if (a.creationDate < b.creationDate) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
      this.getTypeList = [...new Set(this.geoFenceList.map((item: any) => item.type))]
        .map((type: string) => {
          const matchedItem = this.geoFenceList.find((item: any) => item.type === type);
          return { id: matchedItem.id, name: type };
        });
    });
  }
  else if(this.user === 'role_consumer_fleet'){
    await this._vehicleService.getAllGeoFence(this.customConsumer, this.fleetIdData).subscribe((res: any) => {
      // Handle paginated response - extract content array
      const dataArray = res?.content ? res.content : (Array.isArray(res) ? res : []);
      this.geoFenceList = dataArray.sort((a: any, b: any) => {
        if (a.creationDate > b.creationDate) {
          return -1;
        } else if (a.creationDate < b.creationDate) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      });
      this.getTypeList = [...new Set(this.geoFenceList.map((item: any) => item.type))]
        .map((type: string) => {
          const matchedItem = this.geoFenceList.find((item: any) => item.type === type);
          return { id: matchedItem.id, name: type };
        });
    });
  }
  }
  // Geofence List without consumer
  isLoading = true;
  loading = true;
  async manageGeofenceLists() {
    this.isLoading = true;
    console.log('manageGeofenceLists called - user:', this.user, 'consumer:', this.consumer, 'fleetId:', this.fleetIdData, 'groupId:', this.groupIdData);

    if(this.user === 'admin'){
    await this._vehicleService.getGeofence(this.consumer, this.fleetIdData, this.groupIdData).subscribe((res: any) => {
      console.log('API Response:', res);
      // Handle paginated response - extract content array
      const dataArray = res?.content ? res.content : (Array.isArray(res) ? res : []);
      console.log('Extracted dataArray:', dataArray, 'Length:', dataArray.length);

      this.geoFenceList = dataArray.sort((a: any, b: any) => {
        if (a.creationDate > b.creationDate) {
          return -1;
        } else if (a.creationDate < b.creationDate) {
          return 1;
        }
        return a.name.localeCompare(b.name);

      });
      console.log('geoFenceList after sort:', this.geoFenceList);

      this.getTypeList = [...new Set(this.geoFenceList.map((item: any) => item.type))]
        .map((type: string) => {
          const matchedItem = this.geoFenceList.find((item: any) => item.type === type);
          return { id: matchedItem.id, name: type };
        });
        this.updateTime();
        this.isLoading = false;
        console.log('Loading complete. geoFenceList length:', this.geoFenceList.length, 'filteredGeofenceData length:', this.filteredGeofenceData?.length);
    }, (err) => {
      console.error('Error fetching geofence data:', err);
      this.geoFenceList = [];
      this.isLoading = false;
    });
  }
    if(this.user != 'admin'){
      await this._vehicleService.getGeofence(this.customConsumer, this.fleetIdData, this.groupIdData).subscribe((res: any) => {
        console.log('API Response (non-admin):', res);
        // Handle paginated response - extract content array
        const dataArray = res?.content ? res.content : (Array.isArray(res) ? res : []);
        console.log('Extracted dataArray (non-admin):', dataArray, 'Length:', dataArray.length);

        this.geoFenceList = dataArray.sort((a: any, b: any) => {
          if (a.creationDate > b.creationDate) {
            return -1;
          } else if (a.creationDate < b.creationDate) {
            return 1;
          }
          return a.name.localeCompare(b.name);

        });
        console.log('geoFenceList after sort (non-admin):', this.geoFenceList);

        this.getTypeList = [...new Set(this.geoFenceList.map((item: any) => item.type))]
          .map((type: string) => {
            const matchedItem = this.geoFenceList.find((item: any) => item.type === type);
            return { id: matchedItem.id, name: type };
          });
          this.updateTime();
          this.isLoading = false;
          console.log('Loading complete (non-admin). geoFenceList length:', this.geoFenceList.length, 'filteredGeofenceData length:', this.filteredGeofenceData?.length);
      }, (err) => {
        console.error('Error fetching geofence data:', err);
        this.geoFenceList = [];
        this.isLoading = false;
      });
  }
}
selectedLocationTypeNames: string[]
  // Selected data api call
  callApiWithSelectedData() {
    if (this.fleetIdData) {
      const fleetIdNumber = Number(this.fleetIdData);
      if (isNaN(fleetIdNumber)) {
        console.error("Invalid fleetId");
        return;
      }

      const payload: any = {
        ids: this.selectedTypes,
        fleetId: fleetIdNumber,
        locationTypeNames: this.selectedLocationTypeNames,
        timeFrame: this.selectedPeriod
      };

      if (this.selectedPeriod === "CUSTOM_RANGE") {
        payload.start = this.fromDate;
        payload.end = this.toDate;
        delete payload.timeFrame;
      }

      if (this.selectedPeriod === "till_date") {
        payload.start = "2022-01-01";
        payload.end = new Date().toISOString().split("T")[0];
        delete payload.timeFrame;
      }

      this._vehicleService.idFilter(payload).subscribe(
        response => {
          this.dataShow = response;
          this.IdData = this.dataShow?.task_id;
          this.navigateToGeofenceReport(this.IdData);
          this.appService.openSnackBar("Generating Report!", 'Success');
        },
        error => {
          console.error('API Error:', error);
        }
      );
    } else {
      console.error('fleetIdData is missing or invalid');
    }
  }

  // Delete geofence
  async deleteGeofenceById(id: string) {
    try {
      await this._vehicleService.deleteGeofenceNew(id).toPromise();
      this.appService.openSnackBar("Geofence deleted successfully !", 'Success')
      this.manageGeofenceLists();

    } catch (error) {
      console.error(`Error deleting geofence with id ${id}`, error);
    }
  }
  // field editable
  editGeofencebyId(geofence: any): void {
    geofence.isEditing = true;
  }
  // Edit geofence list
  updateGeofence(geofence: any): void {
    const updatedGeofenceData = {
      name: geofence.name,
      type: geofence.type,
      radius: geofence.radius,
      fleetId: geofence.fleetId,
      creationDate: geofence.creationDate,
      modifiedDate: geofence.modifiedDate,
      address: geofence.address,
    };
    this._vehicleService.editGeofence(geofence.id, updatedGeofenceData).subscribe(
      (response) => {
        this.appService.openSnackBar("Geofence updated successfully !", 'Success')
        geofence.isEditing = false;
        this.manageGeofenceLists()
      },
      (error) => {
        console.error('Error updating geofence:', error);
      }
    );
  }
  get filteredGeofenceData() {
    if (!this.geoFenceList || this.geoFenceList.length === 0) {
      return [];
    }

    let filtered = this.geoFenceList;

    // Filter by fleet ID if selected
    if (this.fleetIdData) {
      filtered = filtered.filter(
        (geofence) => String(geofence.fleetId) === String(this.fleetIdData)
      );
    }

    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (geofence) => geofence.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    return filtered;
  }
  // Geofence List
  filterGeofences() {
    if (this.fleetIdData) {
      this.newFilteredGeofenceData = this.geoFenceList.filter(geofence => String(geofence.fleetId) === String(this.fleetIdData));
    } else {
      this.newFilteredGeofenceData = this.geoFenceList;
    }
  }
  onTypeChange() {
    this.locationTypeService.selectedTypeIds = this.selectedTypes; // Update the service with selected types
  this.selectedLocationTypeNames = this.filteredGeofenceData
  .filter(type => this.selectedTypes.includes(type.id))
  .map(type => type.locationType);
  }
  // Delete model popup
  openDeleteModal(geofence: any, modalTemplate: any): void {
    this.selectedGeofence = geofence;
    this.modalService.open(modalTemplate, { size: "sm", centered: true });
  }

    downloadFilteredGeofenceData() {
      if (!this.geoFenceList || this.geoFenceList.length === 0) {
        console.error("No geofence data available to download.");
        return;
      }
      const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        };
        return new Intl.DateTimeFormat('en-US', options).format(date).replace(',', '');
      }
      const radiusLabel = this.customConsumer === 'Onwardfleet' ? 'Radius (miles)' : 'Radius (miles)';
      const formattedData = this.geoFenceList.map((item: any) => {
        const getFormattedDate = (date: any) => {
          if (!date) return 'N/A';
          const dateTimeUTC = moment.utc(date);
          return dateTimeUTC.tz(this.selectedTimezone).format('MM-DD-YYYY, HH:mm');
        };

        return {
          'Geofence Name': item.name || 'N/A',
          'Fleet Id': item.fleetId || 'N/A',
          'Created On (mm-dd-yyyy, hh:mm)': getFormattedDate(item.creationDate),
          'Updated On (mm-dd-yyyy, hh:mm)': getFormattedDate(item.modifiedDate),
          'Location Type': item.type || 'N/A',
          'Address': item.address || 'N/A',
          [radiusLabel]: item.radius || 'N/A',
          'Created By': item.createdBy || 'N/A',
        };
      });

      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'GeoFenceData');
      XLSX.writeFile(workbook, 'GeofenceData.csv');
    }

searchQuery: any;
selectedGeofenceId: number;
data: any[] = [];
selectAllChecked = false; // Ensure default is false

MappedVehicles(modalRef: any, geofenceId: number): void {
  this.selectedGeofenceId = geofenceId;
  this.modalService.open(modalRef, { size: "sm", centered: true });
  this._vehicleService.getGeofenceAssociations(geofenceId).subscribe((res: any) => {
    this.data = res?.vin?.map((item: any) => ({
      ...item,
      checked: item.notificationType === 'IN' || item.notificationType === 'OUT' || item.notificationType === 'BOTH'
    }));
    this.updateSelectAllStatus();

  });
}

get checkedCount(): number {
  return this.data?.filter(item => item.checked)?.length || 0;
}

toggleSelectAll() {
  this.data.forEach(item => item.checked = this.selectAllChecked);
}

updateSelectAllStatus() {
  this.selectAllChecked = this.data.every(item => item.checked);
}

// Update Associated
saveSelectedVehicles() {
  const selected = this.data
    .filter(item => item.checked)
    .map(item => ({ vinId: item.id }));
  if (selected.length === 0) {
    console.warn('No vehicles selected.');
    return;
  }

  this._vehicleService
    .addGeofenceAssociations(this.selectedGeofenceId, selected)
    .subscribe(
      res => {

        this.associatedData = res;
        this.appService.openSnackBar("Mapped vehicles successfully with selected geofence.", 'Success');
        this.modalService.dismissAll();
      },
      err => {
        console.error('API error:', err);
      }
    );
}

viewMappedVehicle(mappedVinListData: any, geofenceId: number): void {
  this.selectedGeofenceId = geofenceId;
  this.modalService.open(mappedVinListData, { size: "sm", centered: true });
  this._vehicleService.getAllAssociatedVin(geofenceId).subscribe((res: any) => {
    this.associatedData = res.vin || [];
  });
}

editGeofence(geofence: any): void {
  const encodedData = encodeURIComponent(JSON.stringify(geofence));
  this.router.navigate(['/adlp/admin/admindashboard/geofence/edit-geofence'], {
    queryParams: { data: encodedData }
  });
}


}
