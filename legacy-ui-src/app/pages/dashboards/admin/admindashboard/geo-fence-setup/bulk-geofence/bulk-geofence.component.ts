import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { Subscription, of, pluck, catchError, shareReplay } from "rxjs";
import * as Papa from 'papaparse';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { FleetVehiclesService } from '../../../fleet-vehicles.service';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-bulk-geofence',
  templateUrl: './bulk-geofence.component.html',
  styleUrls: ['./bulk-geofence.component.scss']
})
export class BulkGeofenceComponent implements OnInit {
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetIdValueNew: any;
  uploadedFileName: string | null = null;
  errorMessage: string | null = null;
  selectedFile: File | null = null;
  consumer: any ='All';
  consumerList:any;
  subscription$ :Subscription = new Subscription()
  constructor(private modalService: NgbModal,private appService: AppService, private _vehicleService: TaxonomyService, apiService: FleetVehiclesService, private router: Router,private toastr: ToastrService) { }

  ngOnInit(): void {
    this.showRole()
    this.getAllConsumers()

  }

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

      this.consumerList = (response as any)
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
  selectConsumer() {

  }

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

  downloadSamples() {
    var link = document.createElement("a");
    link.href = 'assets/data/bulk_upload_sample_file.xlsx';
    link.click();
  }



  triggerFileUpload() {
    this.errorMessage = ''; // Reset error message before triggering upload
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Clear the selected file
      fileInput.click();    // Trigger the file input click event to allow the user to select a new file
    }
  }

  cancel() {
    this.uploadedFileName = null;
    this.selectedFile = null;
    this.errorMessage = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        this.errorMessage = 'File size exceeds 50 MB.';
        this.uploadedFileName = null;
      } else {
        this.errorMessage = null;
        this.uploadedFileName = file.name;
        this.selectedFile = file;
      }
    }
}

  submitFile() {
    this.errorMessage = ''
    if (!this.selectedFile) {
      this.errorMessage = 'No file selected.';
      return;
    }
    this.uploadData(this.selectedFile)
  }

  uploadData(data: any) {
    let consumer = sessionStorage.getItem('userRole') == 'admin' ? this.consumer : this.customConsumer
    this.subscription$.add(
      this._vehicleService.bulkGeofence(data,consumer).subscribe((res:any)=>{
        this.toastr.success("Successfully Uploaded !")
        this.router.navigate(['adlp/admin/admindashboard/geoFenceSetup/geofence'])
      },err=>{
        this.toastr.error(err?.error?.apierror?.message)
      })
    )
   }

   ngOnDestroy() {
    if(this.subscription$) {
      this.subscription$.unsubscribe()
    }
   }
}
