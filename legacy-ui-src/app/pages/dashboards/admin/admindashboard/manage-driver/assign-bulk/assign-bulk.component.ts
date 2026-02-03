import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "src/app/app.service";
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription, of } from "rxjs";
import { LocationTypeService } from "src/app/core/services/users-role.service";
interface Consumer {
  id: string;
  name: string;
  contract: {
    startDate?: string;
  };
}
@Component({
  selector: 'app-assign-bulk',
  templateUrl: './assign-bulk.component.html',
  styleUrls: ['./assign-bulk.component.scss']
})
export class AssignBulkComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  fleetId: number = 0;
  consumer: any = "All";
  consumerList: { id: any; name: any; startDate: any }[];
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetIdData: string;
  fleetIdValueNew: any
  fleetList: any;

  uploadedFileName: string | null = null;
  errorMessage: string | null = null;
  selectedFile: File | null = null;
  fileData: any[] = [];
  jsonData: string;
  constructor(public locationTypeService: LocationTypeService, private appService: AppService, private router: Router, private _vehicleService: TaxonomyService) { }
  ngOnInit(): void {
    this.showRole()
    this.getAllConsumers()
    if (this.user === 'role_consumer_fleet') {
      this.selectConsumers()
    }
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
  // Get all consumer list
  async getAllConsumers(): Promise<void> {
    try {
      const response = await this._vehicleService
        .getAllConsumers().pipe(pluck('data'), catchError(() => of([])), shareReplay(1)).toPromise();
      const excludedConsumers = new Set([
        'Slick', 'OneStep', 'Arvind_insurance', 'HD Fleet LLC', 'GEICO', 'Forward thinking GPS',
        'Geo Toll', 'Matrack', 'Geico', 'Test fleet', 'Rockingham', 'Axiom', 'GeoToll',
      ]);
      this.consumerList = (response as Consumer[])
        .filter((item) => item.contract && !excludedConsumers.has(item.name))
        .map((item) => ({ id: item.id, name: item.name, startDate: item.contract?.startDate }));
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching consumers:', error);
    }
  }
  async selectConsumer() {
    this.selectConsumers();
  }
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

  // Download sample file for bulk
  downloadSamples() {
    var link = document.createElement("a");
    link.href = 'assets/data/Bulk_Driver_Vehicle_Association.csv';
    link.click();
  }

  triggerFileUpload(): void {
    this.errorMessage = '';
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }
  // Bulk file upload and trigger
  isFileSelected: boolean = false;
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.uploadedFileName = file.name;
      this.isFileSelected = true;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const csvText = e.target.result as string;
        this.fileData = this.parseCSV(csvText);
        console.log('Parsed CSV:', this.fileData);
      };
      reader.readAsText(file);
    }
  }

  parseCSV(data: string): any[] {
    const rows = data.trim().split(/\r?\n/).filter(row => row.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim());
    const dataRows = rows.slice(1);

    return dataRows.map(row => {
      const values = row.split(',').map(v => v.trim());
      const record: any = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });

      const startDate = record['Start date']?.split('-').reverse().join('-') + 'T' + record['Start time'];
      const endDate = record['End date']?.split('-').reverse().join('-') + 'T' + record['End time'];

      return {
        vehicleName: record['Vehicle name'] || '',
        driverEmail: record['Driver email'] || '',
        startDate: startDate,
        endDate: endDate,
        consumerName: this.customConsumer
      };
    });
  }

  // Submit bulk driver
  onSubmit(): void {
    // if (!this.fleetIdData) {
    //   this.appService.openSnackBar("Please select fleet Id", "Error");
    //   return;
    // }
    if (this.fileData.length > 0) {
      this.uploadedFileName = '';
      let consumer:any = (this.consumer != 'All' && this.consumer) ? this.consumer?.name : this.customConsumer
      this._vehicleService.uploadAssignDriver(this.fileData,consumer).subscribe(
        (response) => {
          if (response.statusCode === 200) {
            this.appService.openSnackBar(response.message, "Success");
            this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
          }
        },
        (error) => {
          this.appService.openSnackBar(error?.error?.apierror?.message,"Error");
          // if (error.status === 404) {
          //   this.appService.openSnackBar("URL Not Found", "Error");
          // } else if (error.status === 422 && error.error.apierror && error.error.apierror.message) {
          //   if (error.error.apierror.message === "consumer id is null") {
          //     this.appService.openSnackBar("Please select consumer", "Error");
          //   } else if (error.error.apierror.message === "The given id must not be null!") {
          //     this.appService.openSnackBar("Please select fleet Id", "Error");
          //   } else {
          //     this.appService.openSnackBar(error.error.apierror.message, "Error");
          //   }
          // }
          // else if (error.status === 500) {
          //   this.appService.openSnackBar("Technical error, please check after some time.", "Error");
          // } else {
          // }
        }
      );
    } else {
      this.errorMessage = 'Please upload file in csv format.';
    }
  }
  // Cancel bulk driver
  cancel() {
    this.uploadedFileName = null;
    this.selectedFile = null;
    this.errorMessage = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

isSidebarHidden = false;
toggleSidebar() {
  this.isSidebarHidden = !this.isSidebarHidden;
}

}
