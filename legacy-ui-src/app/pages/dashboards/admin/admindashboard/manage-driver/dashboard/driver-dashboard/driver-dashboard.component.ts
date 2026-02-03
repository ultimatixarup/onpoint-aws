import { Component,OnInit, ViewChild} from "@angular/core";
import { Router } from "@angular/router";
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription, of } from "rxjs";
import { FleetService, LocationTypeService} from "src/app/core/services/users-role.service";
import { VinService } from 'src/app/core/services/users-role.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from "src/app/app.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import moment from 'moment';
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
  id: string;
}
interface Vehicle {
  vin:string;
  drivers: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    emailId: string;
    id: number;
    associatedStart: string;
    associatedEnd: string }[];
}
@Component({
  selector: 'app-driver-dashboard',
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.scss']
})
export class DriverDashboardComponent implements OnInit {
  @ViewChild('modalConfirm') modalConfirm: any;
  selectedDriverName: string = '';
  selectedDriverData: any;
  selectedVehicle: any;
  subscription$: Subscription = new Subscription();
  fleetId: number = 0;
  consumer: any = "All";
  consumerList: {name: any; startDate: any}[];
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetList: any;
  fleetIdData: any;
  fleetIdValueNew: any;
  searchByVin: string = '';
  vehicle_names = [ ];
  filteredVehicles = this.vehicle_names;
  consumerName: any;
  consumerId: any;
  totalItems = 10000;
  itemsPerPage = 30;
  currentPage = 1;
  items = Array.from({ length: this.totalItems }, (_, i) => `Item ${i + 1}`);
  paginatedItems = this.items.slice(0, this.itemsPerPage);
  totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
  pageNumbers: (number | string)[] = [];
  selectedConsumer: { name: string, id: string }
  dataName: any;
  dataId: any;
  selectedDriverLastName: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  groupList: any;
  constructor(private timezoneService: TimezoneService,private modalService: NgbModal,private vinService: VinService,private appService: AppService, private spinner: NgxSpinnerService,private fleetService: FleetService, public locationTypeService: LocationTypeService,private router: Router, private _vehicleService: TaxonomyService) {
    this.updatePageNumbers();
  }
  ngOnInit(): void {
    this.showRole()
    this.getDriverData()
    // this.selectGroupId()
    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime(); // Update vehicle data when timezone changes
    });
    if(this.user == 'role_consumer_fleet'){
      this.selectConsumer()
      this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
      this.timezoneService.timezone$.subscribe((tz) => {
        this.selectedTimezone = tz;
        this.updateTime(); // Update vehicle data when timezone changes
      });
    }
  }

   updateTime() {
            if (!this.vehicle_names || this.vehicle_names.length === 0) return;

            this.vehicle_names.forEach(vehicle => {
              // Handle Refuel SummaryDate & Time
              if (vehicle.timestamp) {
                vehicle.formattedDate = moment.utc(vehicle.timestamp)
                  .tz(this.selectedTimezone)
                  .format('MMM D, YYYY');

                vehicle.formattedTime = moment.utc(vehicle.timestamp)
                  .tz(this.selectedTimezone)
                  .format('HH:mm');
              } else {
                vehicle.formattedDate = '--';
                vehicle.formattedTime = '--';
              }

             console.log(vehicle.creationFormattedDateNew, vehicle.creationFormattedTimeNew)
            });
          }
  // Show Role
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
  // Route to add driver component
  addDriver() {
    this.router.navigate(['/adlp/admin/admindashboard/manageDriver/addDriver']);
  }
  // Route to view driver component
  viewDriver(){
    this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver'])
  }

  topConsumers: string[] = [ 'Smallboard',];
  selectConsumer(): void {

   this.selectConsumers()
    if (this.customConsumer) {
     const consumerName = this.consumer.name;
      const consumerId = this.consumer.id;
      console.log(consumerId)
    }
     else {
    }
    this.getDriverData()
  }

  get sortedConsumers() {
    const top = this.consumerList
      .filter(c => this.topConsumers.includes(c.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    const others = this.consumerList
      .filter(c => !this.topConsumers.includes(c.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [...top, ...others];
  }
  // Get All Fleet Id List based on Consumer
  selectConsumers() {
    if (this.user === 'admin') {
      this.subscription$.add(
        this._vehicleService.getFleetList(this.consumer.name).subscribe(
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
          },(err) => { }
        ))}
  }
  // On select of Fleet Id
  onFleetIdChange() {
    this.getDriverData()
    // this.selectGroupId()
  }


  groupIdData: any;
  /* selectGroupId() {
    console.log(this.user, this.fleetIdData, this.consumer)
    if(this.user === 'admin'){
    this.subscription$.add(
      this._vehicleService.getFleetGroups(this.fleetIdData,this.consumer, this.groupIdData).subscribe((res: any) => {
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
  else if(this.user != 'admin'){
    this.subscription$.add(
      this._vehicleService.getFleetGroups(this.fleetIdData,this.customConsumer,this.groupIdData).subscribe((res: any) => {
        const nestedGroups = res?.groups || [];
        console.log('asdasd')
        // Flatten groups & subgroups into one list
        this.groupList = this.flattenGroups(nestedGroups);

        // Optionally preselect a default if needed
        // this.groupIdData = this.groupList[0]?.id; // optional
      }, err => {
        console.error('Error fetching sub-groups:', err);
      })
    );
  }
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
  this.getDriverData()
}
*/
  // Main table Data
  getDriverData(pageNo: number = 1): void {
    this.spinner.show();
    console.log(this.user, this.customConsumer)
    if (this.user === 'admin') {
      this._vehicleService.getManageDriver(this.consumer.id, this.fleetIdData, this.groupIdData, pageNo).subscribe((data: Vehicle[]) => {
        this.vehicle_names = data;
        this.totalItems = data.length;

        this.spinner.hide();
      });
    }
    else if (this.user != 'admin') {
      this._vehicleService.getManageDriver(this.customConsumer.id, this.fleetIdData, this.groupIdData, pageNo).subscribe((data: Vehicle[]) => {
        this.vehicle_names = data;
        this.totalItems = data.length;
        this.spinner.hide();
      });
    }
    else {
      this.spinner.hide();
    }
  }

  getLatestVinTime(vins: any[], format: 'date' | 'time'): string | null {
    if (!vins || vins.length === 0) {
      return null;
    }
    const latestVin = vins.reduce((latest, current) =>
      new Date(current.associatedStart) > new Date(latest.associatedStart)
        ? current
        : latest
    );
    const latestDate = new Date(latestVin.associatedStart);
    if (format === 'date') {
      const month = (latestDate.getMonth() + 1).toString().padStart(2, '0');
      const day = latestDate.getDate().toString().padStart(2, '0');
      const year = latestDate.getFullYear();
      return `${month}-${day}-${year}`;
    } else if (format === 'time') {
      const hours = latestDate.getHours().toString().padStart(2, '0');
      const minutes = latestDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return null;
  }
  getLatestVinRange(vins: any[]): { date: string | null; time: string | null } {
    if (!vins || vins.length === 0) {
      return { date: null, time: null };
    }
    const latestVin = vins.reduce((latest, current) =>
      new Date(current.associatedStart) > new Date(latest.associatedStart)
        ? current
        : latest
    );
    const startDate = new Date(latestVin.associatedStart);
    const endDate = new Date(latestVin.associatedEnd);
    const formatDate = (date: Date) => {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    };
    const formatTime = (date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    return {
      date: `${formatDate(startDate)} To ${formatDate(endDate)}`,
      time: `${formatTime(startDate)} To ${formatTime(endDate)}`
    };
  }
  calculatePageNumbers(): void {
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  updatePageNumbers(): void {
    const pageGroupSize = 8;
    this.pageNumbers = [];
    if (this.totalPages <= pageGroupSize) {
      for (let i = 1; i <= this.totalPages; i++) {
        this.pageNumbers.push(i);
      }
      return;
    }
    const startPage = Math.floor((this.currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
    const endPage = Math.min(startPage + pageGroupSize - 1, this.totalPages);
    if (startPage > 1) {
      this.pageNumbers.push(1);
      if (startPage > 2) {
        this.pageNumbers.push('...');
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      this.pageNumbers.push(i);
    }
    if (endPage < this.totalPages) {
      this.pageNumbers.push('...');
      this.pageNumbers.push(this.totalPages);
    }
  }
  onPageChange(page: number | string): void {
    if (page === 'prev' && this.currentPage > 1) {
      this.currentPage = Math.max(1, this.currentPage - 8);
    } else if (page === 'next' && this.currentPage < this.totalPages) {
      this.currentPage = Math.min(this.totalPages, this.currentPage + 8);
    } else if (typeof page === 'number') {
      this.currentPage = page;
    }
    this.updatePageNumbers();
    this.getDriverData(this.currentPage);
  }
  groupDriversByVehicle(vehicles) {
    const groupedVehicles = [];
    vehicles.forEach(vehicle => {
      const vehicleExists = groupedVehicles.find(v => v.alias === vehicle.alias);
      if (!vehicleExists) {
        groupedVehicles.push(vehicle);
      }
      vehicle.drivers.forEach(driver => {
        const vehicleWithDriver = groupedVehicles.find(v => v.alias === vehicle.alias);
        if (!vehicleWithDriver.drivers.some(d => d.firstName === driver.firstName && d.lastName === driver.lastName)) {
          vehicleWithDriver.drivers.push(driver);
        }
      });
    });
    return groupedVehicles;
  }
  // Assign multiple driver
  assignDriver(vin: string): void {
    if (this.vehicle_names && this.vehicle_names.length > 0) {
      this.vehicle_names.forEach(vehicle => {
        if (vehicle.vin === vin) {
          let alias = vehicle.alias
          const fleetIdData = vehicle.fleetId;
          let consumerId = this.consumer.id;
          if (this.user === 'admin') {
            consumerId = this.consumer.id;
          } else if (this.user === 'role_consumer_fleet' && this.customConsumer === 'Guidepoint') {
            consumerId = 85193;
          } else if (this.user === 'role_consumer_fleet' && this.customConsumer === 'Onwardfleet') {
            consumerId = 897360;
          } else if (this.user === 'role_consumer_fleet' && this.customConsumer === 'Smallboard') {
            consumerId = 877634;
          } else if (this.user === 'role_consumer_fleet' && this.customConsumer === 'Orionfi') {
            consumerId = 4281039;
          } else if (this.user === 'role_consumer_fleet' && this.customConsumer === 'DPL Telemetics') {
            consumerId = 1785440;
          }
          else if (this.user === 'role_consumer_fleet' && this.customConsumer === 'Satrack') {
            consumerId = 4609361;
          }
          else if (this.user === 'role_consumer_fleet' && this.customConsumer === 'GPSInsight') {
            consumerId = 4622623;
          }

          const consumerName = this.consumer ? this.consumer.name : null;
          this.vinService.setSelectedVin(vin);
          this.router.navigate(['/adlp/admin/admindashboard/manageDriver/assignDriver'], {
            queryParams: {vin: this.maskVinNumbers(vin),unmaskedVin: vin,consumerId: consumerId,fleetId: fleetIdData,consumerName: consumerName,alias: alias}
          });
        }})}
  }
  // VIN Masking
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
  // Delete drvier vin association
  // deleteDriver(driverId: number, vin: string, associatedStart: string, associatedEnd: string): void {
  //   const body = {
  //     driver: {
  //       id: driverId
  //     },
  //     vin: {
  //       vin: vin
  //     },
  //     associatedStart: associatedStart,
  //     associatedEnd: associatedEnd
  //   };
  //   this._vehicleService.deleteDriverVinAssociation(body).subscribe(
  //     (response) => {
  //       this.appService.openSnackBar("Vehicle associated driver deleted successfully", "Success");
  //       this.getDriverData();
  //     },
  //     (error) => {
  //         this.appService.openSnackBar(error.error.apierror.message, 'Error');
  //       }
  //   );
  // }

    // Delete driver
    async deleteDriver(id: string) {
      try {
        await this._vehicleService.deleteDriverAssociation(id).toPromise();
        this.appService.openSnackBar("Vehicle associated driver deleted successfully", "Success")
        this.getDriverData();
      } catch (error) {
        this.appService.openSnackBar(error.error.apierror.message, 'Error');
      }
    }
  openConfirmModal(driverData: any, vehicleData: any) {
    this.selectedDriverName = driverData?.firstName;
    this.selectedDriverLastName = driverData?.lastName;
    this.selectedDriverData = driverData;
    this.selectedVehicle = vehicleData;
    this.modalService.open(this.modalConfirm, { size: "sm", centered: true });
  }

  getAssociatedColor(associatedStart: string | null, associatedEnd: string | null): string {
    const currentTime = new Date();

    const start = associatedStart ? new Date(associatedStart) : null;
    const end = associatedEnd ? new Date(associatedEnd) : null;

    if (start && end) {
      if (start <= currentTime && end >= currentTime) {
        return 'green'; // Current time
      } else if (end < currentTime) {
        return 'red'; // Past time
      } else if (start > currentTime) {
        return 'blue'; // Future time
      }
    }

    return 'default-color'; // Fallback
  }

  // Button enable logic
isButtonEnabled(associatedStart: string | null, associatedEnd: string | null): boolean {
  const currentTime = new Date();

  const start = associatedStart ? new Date(associatedStart) : null;
  const end = associatedEnd ? new Date(associatedEnd) : null;

  // Enable the button only when both start and end dates are in the future
  if (start && end && start > currentTime && end > currentTime) {
    return true;
  }

  return false;
}

isSidebarHidden = false;
toggleSidebar() {
  this.isSidebarHidden = !this.isSidebarHidden;
}


bulkDriver() {
  this.router.navigate(['adlp/admin/admindashboard/manageDriver/assign-bulk'])
}
}
