import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { TaxonomyService } from '../../taxonomy.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { VinService } from 'src/app/core/services/users-role.service';
import { AppService } from 'src/app/app.service';
import { TimezoneService } from 'src/app/layouts/user-role/users-role.service';
import * as moment from 'moment-timezone';
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}

@Component({
  selector: 'app-fleet-manage-vehicles',
  templateUrl: './fleet-manage-vehicles.component.html',
  styleUrls: ['./fleet-manage-vehicles.component.scss']
})

export class FleetManageVehiclesComponent implements OnInit {
  consumerList: any
  subscription$: Subscription = new Subscription();
  @ViewChild('remarks', { static: true }) remarks!: TemplateRef<any>;
  searchByOem: any
  searchByStatus: any = ''
  btnstatus: boolean = false
  searchText: any
  sortByStatus: boolean = false;
  searchFleets: String
  selectedFailureReason: string | null = null;
  pageSize = 40
  page: number = 1
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  oem: string[];
  allOem: string[]
  selectedPeriod: any;
  manageVehicleList: any[] = [];
  loading: boolean = false
  vins: any = []
  AddFleetIdEnroll: any;
  consumerData: any;
  pageNumber: number = 1;
  pageCount: number = 40
  totalPages: any;
  pages: any;
  failureReason: any
  temp: any[];
  searchByConsumer: any
  fleetList: any;
  fleetIdData: any;
  activeVehicless: any;
  mileDriven: any;
  tripData: any;
  isAscendings = true;
  totalTripsDetails: any;
  displayVehicles: any[];
  totalDistance: any;
  totalTripCounts: any;
  manageList: number;
  totalVinCount: number;
  fleetSumamryTotalData: any;
  isLoading: boolean = false;
  fleetIdValueNew: any;
  isDataNotFound: boolean = false;
  fleetIds: any;
  isEditing: false;
  vehicleDataFailure: any[];
  getFailureReasonsList: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  groupList: any;
  deviceId: any;
  dashcamId: any;
  constructor(private timezoneService: TimezoneService,private appService: AppService,private vinService: VinService, private modalService: NgbModal, private _vehicleService: TaxonomyService, private route: ActivatedRoute, private router: Router, private spinner: NgxSpinnerService) {
    this.route.queryParams.subscribe(params => {
      this.searchByConsumer = params['consumer'];
    });
    this.route.queryParams.subscribe(params => {
      if (params) {
        this.searchFleets = params['fleetId'];
        this.AddFleetIdEnroll = params['fleetId'] ? params['fleetId'] : '';
      }
    });
  }

  maskVinNumberr(vin: string): string {
    return vin.length === 17 ? vin.slice(0, 13).replace(/./g, '*') + vin.slice(13) : vin;
  }

  maskVins(vin: string): string {
    if (vin && vin.length >= 3) { // Add a null check for vin
      return '***' + vin.slice(-3);
    } else {
      return vin;
    }
  }

  validateAlphanumeric(event: KeyboardEvent) {
    const regex = /^[a-zA-Z0-9]*$/;
    const inputChar = String.fromCharCode(event.keyCode);

    if (!regex.test(inputChar)) {
      event.preventDefault();
    }
    if(this.user != 'role_Driver'){
    this.selectConsumerFleetId()
    }
  }

  ngOnInit() {
    this.showRole()
    if(this.user === 'role_user_fleet' || this.user === 'role_org_group'){
      this.selectGroupId()
    }
    this.route.queryParams.subscribe(params => {
      const selectedOem = params['selectedOem'];
      const consumersData = params['customConsumer']
      if (selectedOem) {
        this.searchByOem = selectedOem; // Bind to ng-select
        this.searchByConsumer = consumersData
        this.selectConsumerData(selectedOem);
      }
    });
    this.route.queryParams.subscribe(params => {
      const status = params['selectedStatus'];
      if (status) {
        this.searchByStatus = status;  // Set ng-select
        this.searchbyStates();         // Trigger vehicle loading
      }
    });
    this.topLevelInfo()
    this.getVehicle(this.page, this.pageCount,)

    if(this.user != 'role_Driver'){
    this.getlistStatus()
    this.getAllProviderConsumer()
    this.selectConsumerFleetId()
    this.getFailureReasons()
    }
    if (!this.searchByConsumer) {
      this.searchByConsumer = 'All';
    }
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime(); // Update vehicle data when timezone changes
    });

  }

   updateTime() {
      if (!this.manageVehicleList || this.manageVehicleList.length === 0) return;
      this.manageVehicleList.forEach(vehicle => {
        // Handle Last Drive Date & Time
        if (vehicle.lastDriveTime) {
          vehicle.formattedDate = moment.utc(vehicle.lastDriveTime)
            .tz(this.selectedTimezone)
            .format('MMM D, YYYY');

          vehicle.formattedTime = moment.utc(vehicle.lastDriveTime)
            .tz(this.selectedTimezone)
            .format('HH:mm');
        }
        else {
          vehicle.formattedDate = '--';
          vehicle.formattedTime = '--';
        }
         if (vehicle.lastActivity) {
                  vehicle.formattedDateLastActivity = moment.utc(vehicle.lastActivity)
                    .tz(this.selectedTimezone)
                    .format('MMM D, YYYY');

                  vehicle.formattedTimeLastActivity = moment.utc(vehicle.lastActivity)
                    .tz(this.selectedTimezone)
                    .format('HH:mm');
                }
                else {
                  vehicle.formattedDateLastActivity = '--';
                  vehicle.formattedTimeLastActivity = '--';
                }
        // Handle Creation Date & Time
        if (vehicle.creationDate) {
          vehicle.creationFormattedDate = moment.utc(vehicle.creationDate)
            .tz(this.selectedTimezone)
            .format('MMM D, YYYY');

          vehicle.creationFormattedTime = moment.utc(vehicle.creationDate)
            .tz(this.selectedTimezone)
            .format('HH:mm');
        }
         else {
          vehicle.creationFormattedDate = '--';
          vehicle.creationFormattedTime = '--';
        }
         if (vehicle.collisionData?.collisionTimestamp) {
                const formatted = moment.utc(vehicle.collisionData.collisionTimestamp)
                  .tz(this.selectedTimezone);
                vehicle.formattedCollisionDate = formatted.format('MMM D, YYYY');
                vehicle.formattedCollisionTime = formatted.format('HH:mm');
              } else {
                vehicle.formattedCollisionDate = '--';
                vehicle.formattedCollisionTime = '--';
              }
      });
    }

  // Declartion for Role
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId
    }
    if (this.user === 'role_org_group') {
      const fleetId = sessionStorage.getItem('fleetUserId');
      this.fleetIdValueNew = fleetId;
      this.fleetIdData = fleetId;
      this.searchByConsumer = this.customConsumer
          }
    else if(this.user === 'role_Driver'){
      let fleetId = JSON.stringify(sessionStorage.getItem('fleet-Id'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      }

  }
  numbersOnlyUpto(event: any) {
    const pattern = /[0-9A-Za-z\-_. ]/; // includes -, _, ., and space
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }


  maskVinNumber(_vinNumber: any) {
    var mask = "";
    if (_vinNumber) {
      for (let i = 1; i <= _vinNumber.length - 4; i++) {
        mask += "*";
      }
      return mask + _vinNumber.slice(14, 22);
    }
    else {
      return null;
    }
  }
  maskVinNumbers(vin: string): string {
    if (!vin || vin.length !== 17) {
      throw new Error('VIN must be 17 characters long.');
    }
    const characters = '!@#$%^&*()-_=+ABCDEF!@#$%^&*()-_=+GHIJKLMNOPQR!@#$%^&*()-_=+STUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    let maskedVin = '';
    for (let i = 0; i < vin.length; i++) {
      const randomChar = i % 4 === 0 ? '*' : characters.charAt(Math.floor(Math.random() * characters.length));
      maskedVin += randomChar;
    }

    return maskedVin;
  }
  // Declartion for Role end
  selectPage(val) {
    this.getVehicle(this.page, val)
  }

  isVin(alias: string): boolean {
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/; // VIN is alphanumeric, excluding I, O, and Q
    return vinPattern.test(alias);
  }
  selectPages(val) {
    if (val != '...') {
      this.pageNumber = val
      this.getVehicle(val)
      const breadcrumbElement = document.querySelector('.page-content');
      if (breadcrumbElement) {
        breadcrumbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
      }
    }
  }
  async getlistStatus() {
    let a: any
    await this._vehicleService.getstatusList().subscribe((res: any) => {
      this.consumerData = []
      res.filter((val) => {
        let item = val.toLowerCase().replace(/_/g, " ");
        let status = item.replace(/^(.)|\s+(.)/g, c => c.toUpperCase());
        if (status === 'Active' || status === 'Pending' || status === 'Failed' || status === 'Deactivation Pending' || status === 'Deactivation Failed') {
          this.consumerData.push({ name: status, value: val });
        }
        this.consumerData.sort((a: any, b: any) => {
          if (a.name > b.name) {
            return 1;
          } else if (a.name < b.name) {
            return -1;
          } else {
            return 0;
          }
        });
      })
    })
  }
  // UCT TO CDT Time conversion
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

  convertToCDTS(utcTimestamp: string): string {
    if (!utcTimestamp) return 'Invalid date';

    const utcDateTime = new Date(utcTimestamp);

    // Convert to CDT using America/Chicago timezone
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Chicago', // Automatically adjusts for CST/CDT
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use 24-hour format
    };

    return new Intl.DateTimeFormat('en-US', options).format(utcDateTime) + ' CDT';
}
  // VIN Summary function
  vinSummary(selectedVin: string, consumer: string, fleetId: string, selectedOem: string): void {
    this.vinService.setSelectedVin(selectedVin);

    this._vehicleService.getVinSummaryNew(fleetId, selectedOem, selectedVin, 'TILL_NOW').subscribe(
      (data: any) => {
        const vinLevelStats = data.vinLevelStats?.[0];
        const fleetLevelStats = data.fleetLevelStats;
        const queryParams = {
          vin: selectedVin,
          consumer: this.searchByConsumer,
          vinLevelStats: JSON.stringify(vinLevelStats),
          fleetLevelStats: JSON.stringify(fleetLevelStats)
        };

        this.router.navigate(['/adlp/admin/manageVehicle/vinSummary'], { queryParams });
      },
      (err) => {
        if (err?.error?.apierror?.status === "UNPROCESSABLE_ENTITY") {
          this.appService.openSnackBar(err?.error?.apierror?.message, "Error");
        }
      }
    );

  }
  // VIN Summary function end
  // VIN History function
  viewMore(selectedVin: string, selectedOem: string,): void {
    this.vinService.setSelectedVin(selectedVin);
    this.router.navigate(['/adlp/admin/manageVehicle/vinHistory'], {
      queryParams: { vin: this.maskVinNumbers(selectedVin), provider: selectedOem}
     });
  }
  searchByVin: any;
  searchbyVinNumber: any;
  // VIN History function end
  // OEM Sorting
  sortByProvider() {
    if (this.isAscendings) {
      // Sort the data in ascending order
      this.manageVehicleList.sort((a, b) => {
        const nameA = a.provider.toUpperCase(); // Convert to uppercase for case-insensitive comparison
        const nameB = b.provider.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
    } else {
      // Sort the data in descending order
      this.manageVehicleList.sort((a, b) => {
        const nameA = a.provider.toUpperCase(); // Convert to uppercase for case-insensitive comparison
        const nameB = b.provider.toUpperCase();
        if (nameA < nameB) {
          return 1;
        }
        if (nameA > nameB) {
          return -1;
        }
        return 0;
      });
    }

    // Toggle the sorting direction for the next click
    this.isAscendings = !this.isAscendings;
  }
  // OEM Sorting end
  // failure info
  openRemarkModal(vehicle: any, remarks: any) {
    if (vehicle) {
      this.selectedFailureReason = vehicle.failureReason;
      this.selectedVin = vehicle.vin; // Store the VIN
      this.selectedVehicleName = vehicle.alias; // Store the Vehicle Name
      this.statusData = vehicle.status; // Store the Vehicle Name
      this.createdOn = vehicle.creationFormattedDate
      this.createdOnTime = vehicle.reationFormattedTime
    }
  this.modalService.open(remarks, { size: 'sm', centered: false });
  }

  // failure info end
  // Table data
iceVehicles: any[] = [];
evVehicles: any[] = [];
hybridVehicles: any[] = [];
getVehicle(page: number, pageCount?: any): void {
  this.loading = true;

  if (pageCount) {
    this.pageCount = pageCount;
  }

  this._vehicleService.getConsumerDataList(
    page,
    this.pageCount,
    this.searchByVin,
    this.searchbyVinNumber,
    this.searchByConsumer,
    this.fleetIdData,
    this.groupIdData,
    this.searchByOem,
    this.sortByStatus,
    this.searchByStatus,
    this.failureReason
  ).subscribe(
    (res: any) => {
      const filteredVehicles = (res?.content || []).filter(
        (vehicle: any) => vehicle.vin !== '3TYRX5GN1PT081314'
      );

      this.manageVehicleList = filteredVehicles.map((vehicle: any) => {
        const adjustedActivity = vehicle.lastActivity
          ? new Date(new Date(vehicle.lastActivity).getTime() - 4 * 60 * 60 * 1000)
          : null;

        const driveTime = vehicle.lastDriveTime
          ? new Date(vehicle.lastDriveTime)
          : null;

        return {
          ...vehicle,
          lastActivity: adjustedActivity,
          lastDriveTime: driveTime
        };
      });

      // 👉 Fetch fuel type and merge by VIN
      this._vehicleService.getVehicleBasicInfo().subscribe(
        (basicInfo: any[]) => {
          const basicByVin = new Map(basicInfo.map((x: any) => [x.vin, x]));

          this.manageVehicleList = this.manageVehicleList.map(v => {
            const match = basicByVin.get(v.vin);
            return {
              ...v,
              vehicleType: match?.vehicleType || 'Unknown', // EV / Hybrid / Gasoline / Diesel / etc.
              alias: match?.alias ?? v.alias
            };
          });

          // Group after merge
          this.groupVehiclesByFuelType();

          // Your existing footer logic
          this.updateTime();
          this.totalPages = res.totalPages;
          this.getPagination(page);
          this.temp = [...this.manageVehicleList];
          this.vins = this.manageVehicleList.map((v: any) => v.vin);
          this.oem = [...new Set(this.manageVehicleList.map((v: any) => v.provider).sort())];
          this.loading = false;
        },
        (_err) => {
          // If basic-info fails, continue without vehicleType
          this.groupVehiclesByFuelType();
          this.updateTime();
          this.totalPages = res.totalPages;
          this.getPagination(page);
          this.temp = [...this.manageVehicleList];
          this.vins = this.manageVehicleList.map((v: any) => v.vin);
          this.oem = [...new Set(this.manageVehicleList.map((v: any) => v.provider).sort())];
          this.loading = false;
        }
      );
    },
    (_err: any) => {
      this.manageVehicleList = [];
      this.iceVehicles = [];
      this.evVehicles = [];
      this.hybridVehicles = [];
      this.loading = false;
    }
  );
}


  private groupVehiclesByFuelType(): void {
  const list = Array.isArray(this.manageVehicleList) ? this.manageVehicleList : [];

  // Normalize and group; keep only rows that have a VIN
  this.iceVehicles = list.filter(v =>
    !!v?.vin &&
    ['gasoline', 'petrol', 'diesel', 'ice'].some(k =>
      (v?.vehicleType || '').toString().toLowerCase().includes(k)
    )
  );

  this.evVehicles = list.filter(v =>
    !!v?.vin &&
    ['ev', 'electric'].some(k =>
      (v?.vehicleType || '').toString().toLowerCase().includes(k)
    )
  );

  this.hybridVehicles = list.filter(v =>
    !!v?.vin &&
    ['hybrid'].some(k =>
      (v?.vehicleType || '').toString().toLowerCase().includes(k)
    )
  );
}


  // table data end
  clearFleetSelection() {
    this.getVehicle(this.page)
  }

  searchbyStates(){
    this.getVehicle(this.page)
  }
  // filter by consumer
  setSearchByConsumer(value: string): void {
    this.searchByConsumer = value;
  }
  // filter by consumer end
  selectFleetId() {
    this.loading = true;
    this.selectGroupId()
    this.topLevelInfo()
    this.getVehicle(this.page)

  }
  selectConsumerFleetId() {
      let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
      this.customConsumer = JSON.parse(customConsumers);
      this.subscription$.add(
        this._vehicleService.getFleetList(this.customConsumer).subscribe((res: any) => {
          this.fleetList = res;

          // Check if the customConsumer is "onwardfleet"
          if (this.customConsumer === 'Onwardfleet') {
            // Define disallowed fleet IDs
            const disallowedFleetIds = [100549, 100527, 100528, 100606];
            this.fleetList = this.fleetList.filter((fleet: any) =>
              !disallowedFleetIds.includes(fleet.id)
            );
          }

          if (this.customConsumer === 'EcoTrack') {
            // Define disallowed fleet IDs
            const disallowedFleetIds = [101061, 100867, 100865, 100878,100875 ];
            this.fleetList = this.fleetList.filter((fleet: any) =>
              !disallowedFleetIds.includes(fleet.id)
            );
          }

          // Sort the fleetList by id
          this.fleetList.sort((a, b) => a.id - b.id);

          // Update fleetIds if there are any fleets in the list
          if (this.fleetList && this.fleetList.length > 0) {
            this.fleetIds = this.fleetList.map((fleet: any) => fleet.id).join(', ');
          }

          // Reset fleetIdData
          this.fleetIdData = null;
        }, err => {
          // Handle error
          console.error('Error fetching fleet list:', err);
        })
      );

  }
  getPagination(page) {
    this.pages = []
    for (let i = 1; i <= this.totalPages; i++) {
      if (i < 5 && page < 5) {
        this.pages.push(i)
      }
      else if (i == 5 && page != 5 && page < 6) {
        this.pages.push(i)
        if (this.totalPages > 5) {
          this.pages.push('...')
        }

      } else if (i == this.totalPages && page != i && page != this.totalPages - 4) {
        this.pages.push(i)
      }
      else if (i == this.totalPages && page != i && page != this.totalPages - 3) {
        this.pages.push(i)
      }
      else if (page > 4 && page == i && page < this.totalPages - 3) {
        this.pages.push(1)
        this.pages.push('...')
        this.pages.push(page - 1)
        this.pages.push(page)
        this.pages.push(page + 1)
        this.pages.push('...')
      }
      else if (page > this.totalPages - 4 && this.totalPages != page && i == page) {
        this.pages.push(1)
        this.pages.push('...')
        this.pages.push(this.totalPages - 4)
        this.pages.push(this.totalPages - 3)
        this.pages.push(this.totalPages - 2)
        this.pages.push(this.totalPages - 1)
      } else if (page == i && i == this.totalPages) {
        if (this.totalPages > 5) {
          this.pages.push(1)
          this.pages.push('...')
        }
        this.pages.push(this.totalPages - 4)
        this.pages.push(this.totalPages - 3)
        this.pages.push(this.totalPages - 2)
        this.pages.push(this.totalPages - 1)
        this.pages.push(this.totalPages)
      }
    }
    this.pageNumber = page
  }
  getAllProvider() {
    this.subscription$.add(
      this._vehicleService.oemNewData(this.customConsumer).subscribe((res: any) => {
        this.oem = res[this.customConsumer]
      }, err => {

      })
    )
  }
  getAllProviderConsumer() {
    const apiConsumer = this.customConsumer === "EcoTrack" ? "EcoTrack" : this.customConsumer;
    const internalConsumer = this.customConsumer === "EcoTrack" ? "EcoTrack" : this.customConsumer;

    this.subscription$.add(
      this._vehicleService.oemNewData(apiConsumer).subscribe(
        (res: any) => {
          if (res && res[internalConsumer]) {
            // Keep it as an array of strings like ["STELLANITS", "FORD"]
            this.allOem = res[internalConsumer];
          } else {
            this.allOem = [];
            console.warn('No OEM data found for', internalConsumer);
          }
        },
        (err) => {
          console.error('Failed to load OEM data', err);
          this.allOem = [];
        }
      )
    );
  }

  selectGroupId() {
    if (!this.fleetIdData) return;

    this.subscription$.add(
      this._vehicleService.getOrganizationSubGroups(this.fleetIdData).subscribe((res: any) => {
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
    this.loading = true;
    this.topLevelInfo()
    this.getVehicle(this.page)
  }


  searchQuery: any =''
  selectConsumer(evt) {
    const query = this.searchQuery.trim();

    if (query.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(query)) {
      // Exact 17-character VIN
      this.searchbyVinNumber = query;
      this.searchByVin = '';
    } else {
      // Partial name, license, driver, etc.
      this.searchByVin = query;
      this.searchbyVinNumber = '';
    }

    this.getVehicle(this.page);
  }

  sortbyDated() {
    this.btnstatus = !this.btnstatus
    this.getVehicle(this.page)
  }
  selectConsumerData(evt) {
    this.getVehicle(this.page)
  }
  ngOnDestroy() {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }

  async getAllConsumerss() {
    try {
      // Fetch all consumers
      const response = await this._vehicleService
        .getAllConsumerss(this.searchByConsumer)
        .pipe(
          pluck("data"),
          catchError(() => of([])),  // Return an empty array on error
          shareReplay(1)
        )
        .toPromise();

      // Map and filter the consumer list
      this.consumerList = (response as Consumer[]).filter((item) => item.contract).map((item) => ({
        name: item.name,
        startDate: this.formatDatedForActive(item.contract.startDate)
      }));

      const excludedConsumers = new Set([
        "Slick", "OneStep", "Arvind_insurance", "HD Fleet LLC", "GEICO",
        "Forward thinking GPS", "Geo Toll", "Standard Fleet", "Matrack",
        "Geico", "Test fleet", "Rockingham", "Axiom", "GeoToll", "GPSTrackit",
      ]);

      // Remove excluded consumers
      this.consumerList = this.consumerList.filter(item => !excludedConsumers.has(item.name));

      // Filter consumers by the customConsumer name
      this.consumerList = this.consumerList.filter(item => item.name === this.searchByConsumer);
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error fetching consumers:", error);
    }
  }

  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  // get Failure reason API

  getFailureReasons(){
    this._vehicleService.getAllfailureReason().subscribe((res: any) => {
      this.getFailureReasonsList = res.failureReason
    }, err => {

    })
}


isSidebarHidden = false;
toggleSidebar() {
  this.isSidebarHidden = !this.isSidebarHidden;
}

selectFailureResaon(){
  this.getVehicle(this.page)
}

  update(vehicle: any) {
    this._vehicleService.updateVehicleAlias(vehicle.vin, vehicle.alias).subscribe(
      response => {
         this.appService.openSnackBar('Vehicle name updated successfully', 'Success');
        vehicle.isEditing = false;  // Stop editing mode after update
      },
      error => {
        console.error('Error updating alias:', error);
      }
    );
  }

  selectedVin: string = ''
  selectedVehicleName: string = ''
  statusData: string = ''
  createdOn: any
  createdOnTime: any;
  showRemarks = false;
  setRemarkData(vehicle: any) {
    this.selectedVin = vehicle?.vin || '';
    this.selectedVehicleName = vehicle?.alias || '';
    this.statusData = vehicle?.status || '';
    this.selectedFailureReason = vehicle?.failureReason || '';
    this.createdOn = vehicle?.creationFormattedDate || '';
    this.createdOnTime = vehicle?.creationFormattedTime || '';
  this.deviceId = vehicle?.dongleId || '',
    this.dashcamId = vehicle?.dashCam || ''
    }


  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'ACTIVE': 'status-button active active-tooltip',
      'PENDING': 'pending pending-tooltip',
      'd': 'pending pending-tooltip',
      'PAUSED': 'pending pending-tooltip',
      'AWAITING_CONSENT': 'pending pending-tooltip',
      'FAILED': 'failed failed-tooltip',
      'DEACTIVATED': 'pending pending-tooltip',
      'DEACTIVATION_PENDING': 'pending pending-tooltip',
      'DEACTIVATION_FAILED': 'failed failed-tooltip'
    };
    return statusClasses[status] || 'default-class';
  }

  getStatusStyle(status: string): { [key: string]: string } {
    const styles: { [key: string]: { [key: string]: string } } = {
      'ACTIVE': { 'background-color': '#2CA67E', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
      'PENDING': { 'background-color': '#e19c18', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
      'PAUSED': { 'background-color': '#e19c18', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
      'AWAITING_CONSENT': { 'background-color': '#e19c18', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
      'DEACTIVATED': { 'background-color': '#e19c18', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
      'DEACTIVATION_PENDING': { 'background-color': '#e19c18', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
      'FAILED': { 'background-color': '#ff0000', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
     'DEACTIVATION_FAILED': { 'background-color': '#ff0000', 'color': '#ffffff','border-radius': '10px', 'padding': '4px' },
    };
    return styles[status] || {};
  }

  getTooltip(status: string): string {
    const tooltips: { [key: string]: string } = {
      'ACTIVE': 'Active',
      'PENDING': 'Pending',
      'd': 'Pending',
      'PAUSED': 'Paused',
      'AWAITING_CONSENT': 'Awaiting Consent',
      'FAILED': 'Failed',
      'DEACTIVATED': 'Deactivated',
      'DEACTIVATION_PENDING': 'Deactivation Pending',
      'DEACTIVATION_FAILED': 'Deactivation Failed'
    };
    return tooltips[status] || 'Unknown';
  }

  formatDtcCodes(dtcCodes: string[]): string {
    if (!dtcCodes || dtcCodes.length === 0) return '';

    let formatted = '';
    for (let i = 0; i < dtcCodes.length; i++) {
      formatted += dtcCodes[i];
      if ((i + 1) % 2 === 0) {
        formatted += '<br>'; // New line after two values
      } else if (i !== dtcCodes.length - 1) {
        formatted += ', '; // Add comma if it's not the last value
      }
    }
    return formatted;
  }

  getRemarkBoxColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'ACTIVE': '#2CA67E', // Green
      'PENDING': '#e19c18', // Black
      'PAUSED': '#e19c18', // Black
      'AWAITING_CONSENT': '#e19c18', // Black
      'DEACTIVATED': '#e19c18', // Black
      'DEACTIVATION_PENDING': '#e19c18', // Black
      'FAILED': '#ff0000', // Red
      'DEACTIVATION_FAILED': '#ff0000' // Red
    };

    return statusColors[status] || '#000000'; // Default to black if status is not found
  }

  getIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'ACTIVE': 'bx bx-check-circle',
      'PENDING': 'bx bx-time-five',
      'd': 'bx bx-time-five',
      'PAUSED': 'bx bx-time-five',
      'AWAITING_CONSENT': 'bx bx-time-five',
      'FAILED': 'bx bx-error-circle',
      'DEACTIVATED': 'bx bx-time-five',
      'DEACTIVATION_PENDING': 'bx bx-time-five',
      'DEACTIVATION_FAILED': 'fa fa-warning'
    };
    return icons[status] || 'bx bx-question-mark';
  }


  sortByDateNew: boolean = true; // Default to ascending order
  isActivity: string = 'asc'; // UI class reflects the sorting order

  sortByLastDriveTime() {
    this.sortByDateNew = !this.sortByDateNew; // Toggle sorting order
    this.isActivity = this.sortByDateNew ? 'asc' : 'dsc';

    this.manageVehicleList.sort((a: any, b: any) => {
      const dateA = new Date(a.lastDriveTime).getTime();
      const dateB = new Date(b.lastDriveTime).getTime();
      return this.sortByDateNew ? dateA - dateB : dateB - dateA;
    });
  }

  sortByDateCreatedOn: boolean = true; // Default to ascending order
  isActivitys: string = 'asc'; // UI class reflects the sorting order

  sortByCreatedOn() {
    this.sortByDateCreatedOn = !this.sortByDateCreatedOn; // Toggle sorting order
    this.isActivitys = this.sortByDateCreatedOn ? 'asc' : 'dsc';

    this.manageVehicleList.sort((a: any, b: any) => {
      const dateA = new Date(a.creationDate).getTime();
      const dateB = new Date(b.creationDate).getTime();
      return this.sortByDateCreatedOn ? dateA - dateB : dateB - dateA;
    });
  }


  getFullTooltip(vehicle: any): string {
    if (!vehicle) return 'No Data Available';
    return `
      VIN: ${vehicle.selectedVin || 'N/A'}
      Vehicle Name: ${vehicle.selectedVehicleName || 'N/A'}
      Status: ${this.getTooltip(vehicle.status)}
      Remark: ${vehicle.selectedFailureReason || 'N/A'}
      createdOn: ${vehicle.creationFormattedDate},${vehicle.creationFormattedTime}
    `;
  }

  formatDtcTooltip(dtcCodes: any[], customConsumer: string): string {
    if (!dtcCodes || dtcCodes.length === 0) {
      return 'DTCs Triggered: N/A';
    }

    return `DTCs Triggered:\n${dtcCodes
      .map(dtc => {
        const code = dtc.dtcCode || 'Unknown Code';
        let formattedDate = '--';
        let formattedTime = '--';

        if (dtc.activeTime) {
          const formatted = moment.utc(dtc.activeTime).tz(this.selectedTimezone);
          formattedDate = formatted.format('MMM D, YYYY');
          formattedTime = formatted.format('HH:mm');
        }

        return `${code} (${formattedDate} ${formattedTime})`;
      })
      .join('\n')}`;
  }


formatDtcTime(utcTimestamp: string, customConsumer: string): string {
  if (!utcTimestamp) return 'Invalid date';

  // Convert the UTC timestamp into a Date object correctly
  const utcDate = new Date(utcTimestamp + 'Z'); // Ensure it's interpreted as UTC

  // Determine the target timezone
  const timeZone = customConsumer === 'Onwardfleet' ? 'America/Chicago' : 'UTC';

  // Convert to the desired timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timeZone, // Convert to CDT or keep in UTC
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(utcDate);
  return formattedDate + (timeZone === 'America/Chicago' ? ' CDT' : ' UTC');
}
// New code for top level history
noDataFound: boolean = false;
groupIdData: any;
  topLevelData: any;
  totalActiveVehicled: any;
  totalDistanceTravelled: any;
  totalFuelConsumed: any;
  totalTripsTaken: any;
// top level data
async topLevelInfo() {
  // Reset values to trigger loading states
  this.noDataFound = false;
  this.totalActiveVehicled = undefined;
  this.totalDistanceTravelled = undefined;
  this.totalFuelConsumed = undefined;
  this.totalTripsTaken = undefined;

  this.subscription$.add(
    this._vehicleService.getTopFleetSummary(this.customConsumer, this.fleetIdData, this.groupIdData).subscribe({
      next: (res: any) => {
        // Set data
        this.topLevelData = res;
        this.totalActiveVehicled = this.topLevelData?.totalActiveVehicles;
        this.totalDistanceTravelled = this.topLevelData?.totalDistanceTravelled;
        this.totalFuelConsumed = this.topLevelData?.totalFuelConsumed;
        this.totalTripsTaken = this.topLevelData?.totalTripsTaken;
        this.noDataFound = false;
      },
      error: (err: any) => {
        const errorBody = err?.error?.apierror;

        if (errorBody?.message === 'Data Not Found') {
          this.noDataFound = true;
          this.totalActiveVehicled = null;
          this.totalDistanceTravelled = null;
          this.totalFuelConsumed = null;
          this.totalTripsTaken = null;

        } else {
          console.error('Unexpected error fetching safety data:', err);
        }
      }
    })
  );
}



}
