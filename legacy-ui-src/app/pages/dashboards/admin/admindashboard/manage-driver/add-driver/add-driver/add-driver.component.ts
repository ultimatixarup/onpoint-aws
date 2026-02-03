import { Component, OnInit } from "@angular/core";
import { Router , ActivatedRoute} from "@angular/router";
import { AppService } from "src/app/app.service";
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription,} from "rxjs";
import { LocationTypeService } from "src/app/core/services/users-role.service";
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { RouteOptimzeService } from '../../../../../route-optimize.service';
interface Consumer {
  id: string;
  name: string;
  contract: {
    startDate?: string;
  };
}
@Component({
  selector: 'app-add-driver',
  templateUrl: './add-driver.component.html',
  styleUrls: ['./add-driver.component.scss']
})
export class AddDriverComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  fleetId: number = 0; // Assign a fleetId value
  consumer: any = "All";
  consumerList: {
    id: any;
    name: any; startDate: any; // Include the start date
  }[];
  user: any;
  loginUser: any;
  mode: 'add' | 'edit' = 'add'; // Add or edit mode
  driverId:  any; // Driver ID for edit mode
  multiRoles: any;
  customConsumer: any;
  fleetIdData: any; // Changed from string to any to support both string and number
  fleetIdValueNew: any
  fleetList: any;
  driverData = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNo: '',
    status: 'active',
    consumer: '',
    fleetId: null, // Changed from hardcoded '100224' to null - now mandatory field
    vin: null,
    licenceNo:'',
    issueState:null,
    expiryDate: '',
    licenceImage: null, // Add this for the uploaded licence file

  };
  uploadedlicenceImage: File | null = null;
  uploadedFileName: string | null = null;
  errorMessage: string | null = null;
  selectedFile: File | null = null;
  selectedButton: string = 'single';
  fileData: any[] = [];
  jsonData: string;
  availableVin: any[] = []; // List of available VINs
  selectedVinId!: any; // Holds the selected driver ID
  tripStartDate:any; //
  associatedVins: any[] = []; // List of VINs associated with driver
  selectedAssociationId: any; // Selected association ID for dissociation
  usaStates = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];


  constructor(public locationTypeService: LocationTypeService, private appService: AppService, private router: Router, private _vehicleService: TaxonomyService,private spinner: NgxSpinnerService,private route: ActivatedRoute,
    private toastr: ToastrService,
    private routeOptimizeService: RouteOptimzeService,
    ) { }

  ngOnInit(): void {

    const segments = this.route.snapshot.url;
    if (segments.length > 0) {
     const lastSegment = segments[segments.length - 1].path; // Last segment is the driverId
         // Validate that the last segment is an integer
    if (/^\d+$/.test(lastSegment)) {
      this.driverId = parseInt(lastSegment, 10); // Convert to integer
    } else {
      this.driverId = null; // Set to null if not a valid integer
    }
    }
    if (this.driverId) {
      // If driverId is found, we're in edit mode
      this.mode = 'edit';
      //this.spinner.show();
      this.loadDriverData(this.driverId); // Load the driver data for editing
      //this.spinner.hide();
    } else {
      // If no driverId, we're in add mode
      this.mode = 'add';
    }

    this.showRole()
      this.selectConsumers()
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
  async selectConsumer() {
    this.selectConsumers();
  }
  selectConsumers() {
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

  selectButton(button: string): void {
    this.selectedButton = button;
  }
  submitDriver(): void {
    // Validate all required fields including fleetId
    if (!this.driverData.firstName || !this.driverData.lastName || !this.driverData.email || !this.driverData.fleetId) {
      this.toastr.error('Please fill all required fields including Fleet ID!', 'Validation Error');
      return;
    }

    const driverCreateRequest = {
      firstName: this.driverData.firstName,
      lastName: this.driverData.lastName,
      email: this.driverData.email,
      phoneNo: this.driverData.phoneNo,
      status: this.driverData.status,
      fleetId: this.driverData.fleetId,
      consumer: this.driverData.consumer,
      licenceNo: this.driverData.licenceNo,
      issueState: this.driverData.issueState,
      expiryDate: this.formatDate(this.driverData.expiryDate)
    };

    if (this.mode === 'add') {
      // Check if there's a file to upload
      if (this.uploadedlicenceImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append(
          'driverCreateRequest',
          new Blob([JSON.stringify(driverCreateRequest)], { type: 'application/json' })
        );
        formData.append('file', this.uploadedlicenceImage);

        this._vehicleService.addDriverWithFile(formData).subscribe(
          (response) => {
            this.appService.openSnackBar('Driver added successfully!', 'Success');
            this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
          },
          (error) => {
            this.handleApiError(error);
          }
        );
      } else {
        // No file, send JSON only
        this._vehicleService.addDriver(driverCreateRequest).subscribe(
          (response) => {
            this.appService.openSnackBar('Driver added successfully!', 'Success');
            this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
          },
          (error) => {
            this.handleApiError(error);
          }
        );
      }
    } else if (this.mode === 'edit' && this.driverId) {
      // Check if there's a file to upload
      if (this.uploadedlicenceImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append(
          'changeDto',
          new Blob([JSON.stringify(driverCreateRequest)], { type: 'application/json' })
        );
        formData.append('file', this.uploadedlicenceImage);

        this._vehicleService.updateDriverWithFile(this.driverId, formData).subscribe(
          (response) => {
            this.appService.openSnackBar('Driver updated successfully!', 'Success');
            this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
          },
          (error) => {
            this.handleApiError(error);
          }
        );
      } else {
        // No file, send JSON only
        this._vehicleService.updateDriver(this.driverId, driverCreateRequest).subscribe(
          (response) => {
            this.appService.openSnackBar('Driver updated successfully!', 'Success');
            this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
          },
          (error) => {
            this.handleApiError(error);
          }
        );
      }
    }
  }
  handleApiError(error: any): void {
    if (error.status === 404) {
      this.appService.openSnackBar('URL Not Found', 'Error');
    } else if (error.status === 422 && error.error.apierror?.message) {
      this.appService.openSnackBar(error.error.apierror.message, 'Error');
    } else {
      this.appService.openSnackBar('An unexpected error occurred!', 'Error');
    }
  }

  downloadSamples() {
    var link = document.createElement("a");
    link.href = 'assets/data/add_driver_bulk.csv';
    link.click();
  }

  onPhoneNumberChange(event: any) {
    const digits = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    if (digits.length <= 10) {
      this.driverData.phoneNo = digits;  // Prepend '+' and limit to 10 digits
    }
  }
  cancelForm() {
    this.driverData = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNo: '',
      status: 'active',
      consumer: null,
      fleetId: null,
      vin: null,
      licenceNo:'',
      issueState:'',
      expiryDate: '',
      licenceImage: null, // Add this for the uploaded licence file


    };
    this.fleetIdData = null;
  }
  triggerFileUpload(): void {
    this.errorMessage = '';
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }
  isFileSelected: boolean = false;
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.uploadedFileName = file.name
      this.isFileSelected = true;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fileData = this.parseCSV(e.target.result);  // Example function to parse CSV
      };
      reader.readAsText(file);
    }
  }
  parseCSV(data: string): any[] {
    const rows = data.split('\n').filter(row => row.trim() !== '');  // Filter out empty rows
    const header = rows[0].split(',');
    const dataRows = rows.slice(1);
    return dataRows.map((row) => {
      const [Driver_First_Name, Driver_Last_Name, Email_Id, Phone_No] = row.split(',');
      return {
        firstName: Driver_First_Name.trim(),
        lastName: Driver_Last_Name.trim(),
        email: Email_Id.trim(),
        phoneNo: Phone_No.replace(/\r/g, '').trim(),
        fleetIdData: ''
      };
    });
  }

  setConsumer(): string {
    if (this.user === 'admin') {
      return this.consumer.id ? this.consumer.id : '';
    }
      if (this.customConsumer === 'Smallboard') {
        return '877634';
      }
    return '';
  }
  onSubmit(): void {
    if (!this.fleetIdData) {
      this.appService.openSnackBar("Please select fleet Id", "Error");
      return;
    }
    if (this.fileData.length > 0) {
      const jsonData = this.fileData.map((item: any) => ({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        phoneNo: item.phoneNo.replace(/\r/g, '').trim(),
        fleetId: this.fleetIdData || '',
        status: 'Active',
        consumer: this.setConsumer(),
      }));
      this.uploadedFileName = '';

      this._vehicleService.uploadDriverToAPI(jsonData).subscribe(
        (response) => {
          if (response.statusCode === 200) {
            this.appService.openSnackBar(response.message, "Success");
            this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
          }
        },
        (error) => {
          if (error.status === 404) {
            this.appService.openSnackBar("URL Not Found", "Error");
          } else if (error.status === 422 && error.error.apierror && error.error.apierror.message) {
            if (error.error.apierror.message === "consumer id is null") {
              this.appService.openSnackBar("Please select consumer", "Error");
            } else if (error.error.apierror.message === "The given id must not be null!") {
              this.appService.openSnackBar("Please select fleet Id", "Error");
            } else {
              this.appService.openSnackBar(error.error.apierror.message, "Error");
            }
          }
          else if (error.status === 500) {
            this.appService.openSnackBar("Technical error, please check after some time.", "Error");
          } else {
            this.appService.openSnackBar("Please upload file in csv format.", "Error");
          }
        }
      );
    } else {
      this.errorMessage = 'Please upload file in csv format.';
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
  onlicenceImageSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validate the file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validImageTypes.includes(file.type)) {
        this.errorMessage = 'Invalid file type. Please upload a JPEG or PNG image.';
        return;
      }

      this.errorMessage = null; // Clear any previous errors
      this.uploadedlicenceImage = file; // Save the uploaded file
    } else {
      this.errorMessage = 'No file selected. Please upload an image.';
    }
  }
  loadDriverData(driverId: string): void {
    this._vehicleService.getDriverById(driverId).subscribe(
      (response: any) => {
        this.driverData = {
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          phoneNo: response.phoneNo,
          status: 'active',
          consumer: null,
          fleetId: response.fleet ? response.fleet.id : null, // Preselect fleet from API response
          vin: null,
          licenceNo:response.licenceNo,
          issueState:response.issueState,
          expiryDate: response.expiryDate,
          licenceImage: response.licenceImage, // Add this for the uploaded licence file
        };

        // Store associated VINs from response
        if (response.vins && Array.isArray(response.vins)) {
          this.associatedVins = response.vins;
        }

        // Also set fleetIdData for the top filter dropdown and Association section if fleet exists
        if (response.fleet && response.fleet.id) {
          this.fleetIdData = response.fleet.id; // Set as number for proper binding
          // Load VIN list for the preselected fleet (for Association section)
          this.selectFleetId(response.fleet.id);
        }
      },
      (error) => {
        this.appService.openSnackBar('Failed to load driver data', 'Error');
        this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);
      }
    );
  }
  onFocus(): void {
    const input = document.getElementById('expiryDate') as HTMLInputElement;
    if (input) {
      input.setAttribute('placeholder', '');
    }
  }

  onBlur(): void {
    const input = document.getElementById('expiryDate') as HTMLInputElement;
    if (input) {
      input.setAttribute('placeholder', this.driverData.expiryDate ? '' : 'MM/DD/YYYY');
    }
  }
    // Convert NgbDateStruct to "YYYY-MM-DD"
    formatDate(date: { year: number; month: number; day: number } | string): string {
      if (!date) return ''; // Handle null or undefined case

      if (typeof date === 'string') {
        return date; // Already formatted, return as is
      }

      const year = date.year;
      const month = String(date.month).padStart(2, '0'); // Ensure two digits
      const day = String(date.day).padStart(2, '0'); // Ensure two digits
      return `${year}-${month}-${day}`;
    }
    tripFinalSubmit(): void {
      if (!this.driverId || !this.selectedVinId) {
        console.error('Trip ID or Driver ID is missing');
        return;
      }

    console.log(this.selectedVinId);
      this.routeOptimizeService.associateVin(this.driverId, this.selectedVinId).subscribe(
        response => {
         this.spinner.show();
         this.toastr.success('VIN successfully assigned to the trip!', 'Success');
          this.router.navigate(['adlp/admin/admindashboard/trip-planning/planning']);
        },
        error => {
          this.spinner.hide();
          if (error.error && error.error.apierror) {
            const apiError = error.error.apierror;
            this.toastr.error(apiError.message, 'Error');
          } else {
            this.toastr.error('Failed to create trip. Please try again.', 'Error');
          }
        }
      );
    }
     saveAssociation() {
    const vin = this.selectedVinId;
     if (!this.driverId || !this.selectedVinId) {
        console.error('Driver ID is missing');
        return;
      }

            const now = new Date();
          // No need to calculate dates - API will handle it
      this._vehicleService.saveDriverVinAssociation(this.driverId, vin).subscribe(
        response => {
            this.appService.openSnackBar("Driver assigned successfully", "Success");
            //this.getDriverDataNew();
            this.router.navigate(['/adlp/admin/admindashboard/manageDriver/viewDriver']);

        },
        (error) => {
          const apiMessage = error?.error?.apierror?.message || 'Failed to associate driver mapping.';
          this.appService.openSnackBar(apiMessage, 'Error');
        }
      );
  }
    selectFleetId(fleetId: number): void {
      if (!fleetId) {
        console.warn('No Fleet ID provided. Resetting available VIN list.');
        this.availableVin = []; // Clear the list if no Fleet ID is selected
        return;
      }

      this.routeOptimizeService.getVINListByFleet(fleetId,'2025-04-20').subscribe(
        (response: any[]) => {
          console.log('Fleet Data:', response);
          this.availableVin = response;
        },
        (error) => {
          console.error('Error fetching available VINs:', error);
          this.availableVin = []; // Clear the list on error
        }
      );
    }
    removeVinAssociation() {
      if (!this.selectedAssociationId) {
        this.toastr.error('Please select a VIN to dissociate', 'Error');
        return;
      }

      if (confirm('Are you sure you want to dissociate this VIN from the driver?')) {
        this.spinner.show();
        this._vehicleService.deleteDriverVinAssociation(this.selectedAssociationId).subscribe({
          next: (response) => {
            this.spinner.hide();
            this.toastr.success('VIN successfully dissociated from driver', 'Success');
            // Reload driver data to refresh associated VINs list
            this.loadDriverData(this.driverId);
            // Reset selection
            this.selectedAssociationId = null;
          },
          error: (error) => {
            this.spinner.hide();
            this.toastr.error('Error while dissociating VIN', 'Error');
            console.error('Dissociation error:', error);
          }
        });
      }
    }


}
