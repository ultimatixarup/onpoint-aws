import { Component, OnInit} from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
type AOA = any[][];
import { FormBuilder, FormGroup, Validators, FormArray,AbstractControl }  from '@angular/forms';
declare var bootstrap: any;
import { RouteOptimzeService } from '../../../route-optimize.service';
import { validAddressType } from '../../../../../core/validators/address-validators'
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-add-trip',
  templateUrl: './add-trip.component.html',
  styleUrls: ['./add-trip.component.scss']
})
export class AddTripComponent implements OnInit {
  waypoints: any[]=[];
  isFormSubmitting: boolean = true; // Initially true to disable the buttons
  tripDate: string | null = null;
  isFileSelected: boolean = false;
  uploadIconClass: any;
  uploadHeading: any;
  uplodMainBox: any;
  noOfError: any = [];
  fileName: string = '';
  files: any;
  errorvinList: any = [];
  data: any = [];
  eligibleUploadData: any;
  bulkEnrollmentForm: FormGroup;
  IsDisabled: boolean = true;
  temp: any[];
  searchByConsumer: any
  selectedDriver: any;
  searchText: string;
  searchFleets: String;
  tripForm: FormGroup;
  isProcessing = false; // Optionally handle processing state
  fleetIdValueNew: string = '';
  user: string = '';
  constructor(private toastr: ToastrService,private route: ActivatedRoute, private router: Router,private formBuilder: FormBuilder,private routeOptimzeService:RouteOptimzeService,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    ) {
      this.tripForm = this.fb.group({
        tripName: ['', Validators.required],
        tripDate: ['', Validators.required],
        timeZone: ['', Validators.required],
        startTime: ['', Validators.required],
        haltTime: ['', Validators.required],
        addresses: this.fb.array([this.createAddress()])  //
      });

    this.route.queryParams.subscribe(params => {
      this.searchByConsumer = params['consumer'];

  });
    this.addNewAddress();
  }
  get addresses(): FormArray {
    return this.tripForm.get('addresses') as FormArray;
  }
  latitudeMap: number = 39.8283; // Center of the US
  longitudeMap: number = -98.5795; // Center of the US
  zoom: number = 4;

  get addressControls() {
    return (this.tripForm.get('addresses') as FormArray).controls;
  }
  // 20 waypoints with coordinates
  // waypoints: { lat: number, lng: number, label: number }[] = [
  //   { lat: 40.712776, lng: -74.005974, label: 1 }, // New York, NY
  //   { lat: 34.052235, lng: -118.243683, label: 2 }, // Los Angeles, CA
  //   { lat: 41.878113, lng: -87.629799, label: 3 }, // Chicago, IL
  //   { lat: 29.760427, lng: -95.369804, label: 4 }, // Houston, TX
  //   { lat: 33.448376, lng: -112.074036, label: 5 }, // Phoenix, AZ
  //   { lat: 39.952583, lng: -75.165222, label: 6 }, // Philadelphia, PA
  //   { lat: 29.424122, lng: -98.493629, label: 7 }, // San Antonio, TX
  //   { lat: 32.715736, lng: -117.161087, label: 8 }, // San Diego, CA
  // ];
  convertToWaypoints(addressDetails: any[]): { lat: number, lng: number, label: number }[] {
    return addressDetails.map((item, index) => ({
      lat: parseFloat(item.latitude),
      lng: parseFloat(item.longitude),
      label: index + 1, // Assign a label based on the index (starting from 1)
    }));
  }
  createAddress(address?: any): FormGroup {
    return this.fb.group({
      type: [address?.type || '', [Validators.required, validAddressType()]],
      name: [address?.name || '', Validators.required],
      phone: [address?.phone || '', Validators.required],
      email: [address?.email || '', Validators.required],
      street: [address?.street || '', Validators.required],
      city: [address?.city || '', Validators.required],
      state: [address?.state || '', Validators.required],
      haltTime: [address?.haltTime || ''],
      postalcode: [address?.postalcode || '', Validators.required],
      additionalInfo: [address?.additionalInfo || ''],
      latitude: [address?.latitude || ''],
      longitude: [address?.longitude || ''],
      isVerified: [address?.isVerified || false],
      endAddress: ['true']  // Ensure this control is included
    });
  }
  setInitialEndAddress() {
    const endAddressIndex = this.addresses.controls.findIndex(control => control.get('type')?.value === 'END');
    if (endAddressIndex !== -1) {
      this.tripForm.get('endAddress')?.setValue(endAddressIndex);
    }
  }
  onFocus(): void {
    const input = document.getElementById('tripDate') as HTMLInputElement;
    input.setAttribute('placeholder', '');
  }
  onBlur(): void {
    const input = document.getElementById('tripDate') as HTMLInputElement;
    input.setAttribute('placeholder', this.tripDate ? '' : 'MM/DD/YYYY');
  }
  // Center for the circle, for demonstration
  latitude: number = 40.712776;
  longitude: number = -74.005974;
  selectedEndAddress: number | null = null; //
  endAddress: boolean = true;
  ngOnInit(): void {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))
    this.addNewAddress();
    endAddress: [''] // This will store the index of the END address
   // this.setEndAddressControlState(); // Call
    this.getFleetId();
  }

  getFleetId(): void {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    if(this.user === 'role_user_fleet'){
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
    }
  }
  downloadSamples() {
    var link = document.createElement("a");
    link.href = 'assets/data/Trip_Halt_Details.csv';
    link.click();
  }
  get f() {
    return this.tripForm.controls;
  }
  addNewAddress() {
    this.addresses.push(this.createAddress());
  }
  setAddresses(addresses: any[]) {
    const addressFormArray = this.tripForm.get('addresses') as FormArray;
    addressFormArray.clear(); // Clear existing form controls
    addresses.forEach(address => {
      addressFormArray.push(this.createAddress(address));
    });
  }

  removeAddress(index: number) {
    if (this.addresses.length > 1) {
      this.addresses.removeAt(index);
    }
  }
  async uploadFiles(evt: any) {
    // this.spinner.show();
    this.errorvinList = [];
    this.noOfError = [];
    this.data = [];
    this.eligibleUploadData = [];

    const files: FileList = evt.target.files;
    const allowedFileTypes = ['csv'];

    if (files.length > 0) {
      this.fileName = files[0].name;
      const fileExtension = this.fileName.split('.').pop().toLowerCase();
      const isAllowedFileType = allowedFileTypes.includes(fileExtension);

      if (isAllowedFileType) {
        this.files = files.item(0);

        try {
          const target: DataTransfer = <DataTransfer>(evt.target);
          const reader: FileReader = new FileReader();

          reader.onload = (e: any) => {
            const binaryString: string = e.target.result;
            const workbook: XLSX.WorkBook = XLSX.read(binaryString, { type: 'binary' });

            const sheetName: string = workbook.SheetNames[0];
            const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

            // Expected CSV headers
            const expectedHeaders = [
              'type',
              'name',
              'phone',
              'email',
              'street_address',
              'additional_info',
              'city',
              'state',
              'zip_code',
              'halt_time'
            ];

            // Convert the first row to headers
            const headers: string[] = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })[0];
            const lowercaseHeaders: string[] = headers.map(header => header.toLowerCase());
            console.log(headers);
            console.log(lowercaseHeaders);
            // Ensure headers match expected format
            const headersMatch = expectedHeaders.every(header => lowercaseHeaders.includes(header));
            if (!headersMatch) {
              console.error('CSV headers do not match the expected format.');
              // Handle incorrect headers (e.g., show an error message)
              return;
            }

            // Skip the header row when converting the rest of the sheet to JSON
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            range.s.r += 1; // Skip the header row
            worksheet['!ref'] = XLSX.utils.encode_range(range);

            // Convert the sheet data to JSON with lowercase headers
            const parsedData = XLSX.utils.sheet_to_json(worksheet, {
              header: lowercaseHeaders,
              defval: '', // Default value for empty cells
            });


            this.data = <AOA>parsedData;

            // Filter out rows that contain "__EMPTY_1" as the first key (if necessary)
            this.eligibleUploadData = parsedData.map((row,index) => ({
              id: index+1, // Default value for ID, or you can dynamically generate it if necessary
              type:row['type'],
              name:row['name'],
              phone:row['phone'],
              email:row['email'],
              street: row['street_address'],
              additionalInfo: row['additional_info'],
              city: row['city'],
              state: row['state'],
              haltTime:row['halt_time'],
              country: 'USA', // Add appropriate country value or map it from the CSV if available
              postalcode: row['zip_code'],

            }));

            const totalRows = this.eligibleUploadData.length;
            // this.totalVins = totalRows
            console.log(this.eligibleUploadData);
            this.changeIconAndHeading(); // Update UI after processing

            this.sendDataToBackend(this.eligibleUploadData);
          };

          reader.readAsBinaryString(target.files[0]);
        } catch (error) {
          console.error('Error reading the file:', error);
          // Handle any errors that occur during file reading
        } finally {
          // Hide spinner after processing is complete
          this.spinner.hide();
          // this.IsDisabled = false;
        }
      } else {
        // Invalid file type
        this.files = null;
        this.fileName = null;
        this.spinner.hide(); // Hide spinner if file type is invalid
      }
    } else {
      // No file selected
      this.fileName = null;
      this.spinner.hide();
    }
  }

  sendDataToBackend(data: any[]): void {
    this.spinner.show();
    this.routeOptimzeService.verifyAddresses(data).subscribe(
      (response) => {
        console.log('API Response:', response);
        // Handle the response from the backend
        if (response && response.addressDetails) {
           this.waypoints = this.convertToWaypoints(response.addressDetails);
           console.log('Waypoints:', this.waypoints);
          this.setAddresses(response.addressDetails);
          this.spinner.hide();
        } else {
          console.error('Unexpected API Response format:', response);
        }
      },
      (error) => {
        console.error('API Error:', error);
        // Handle any errors from the API
      }
    );
  }

  verifyAddress(index: number): void {
    const address = this.addresses.at(index).value;

    // Format the address data for API
    const addressPayload = {
      id: address.id || index + 1,
      type: address.type,
      name: address.name,
      email: address.email,
      phone: address.phone,
      street: address.street,
      additionalInfo: address.additionalInfo,
      state: address.state,
      country: 'USA',
      city: address.city,
      haltTime:address.haltTime,
      postalcode: address.postalcode,
    };

    this.routeOptimzeService.verifyAddresses([addressPayload]).subscribe(
      (response) => {
        if (response && response.addressDetails && response.addressDetails.length > 0) {
          this.addresses.at(index).patchValue({
            ...response.addressDetails[0],
            isVerified: response.addressDetails[0].isVerified
          });
          console.log('Address verified:', this.addresses.at(index).value);
        } else {
          console.error('Unexpected API Response format:', response);
        }
      },
      (error) => {
        console.error('Verification failed:', error);
      }
    );
  }
  allAddressesVerified(): boolean {
    return this.tripForm.get('addresses')?.value.every((address: any) => address.isVerified);
  }

  isFieldInvalid(group: FormGroup, fieldName: string): boolean {
    const control = group.get(fieldName);
    return control?.invalid && (control?.touched || control?.dirty);
  }

  changeIconAndHeading() {
    this.uploadIconClass = 'new-icon-class';
    this.uploadHeading = 'File Uploaded Successfully';
  }

  changeBoxAndHeading() {
    this.uplodMainBox = 'new-box';
  }

  getMarkerUrl(label: number): string {
    // SVG for a location pin icon with a label
    const svg = `
      <svg width="50" height="50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <!-- Pin Icon -->
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ee8f31"/>

        <!-- Label Text -->
        <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="8" fill="white" text-anchor="middle" dy=".3em">
          ${label}
        </text>
      </svg>
    `;
    // Return the encoded SVG as a data URI
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  onEndAddressSelected(selectedIndex: number): void {
    this.addresses.controls.forEach((group, index) => {
      const currentType = group.get('type').value;

      // If the current address is START, leave it unchanged
      if (currentType === 'START') {
        return;
      }

      // For other addresses, change them to DELIVERY if they aren't selected as END
      if (index !== selectedIndex) {
        group.patchValue({ type: 'DELIVERY' });
      }
    });

    // Set the selected address type to END
    this.addresses.at(selectedIndex).patchValue({ type: 'END' });
  }

  onSave(isNext: boolean): void {
    if (!this.allAddressesVerified()) {
      this.toastr.error('Please verify all addresses before submitting.', 'Validation Error');
      return;
    }
     this.isFormSubmitting = true;
      const formValues = this.tripForm.value;
      console.log("Before converting to UTC:", {
        tripDate: formValues.tripDate,
        startTime: formValues.startTime,
        timeZone: formValues.timeZone
    });
      console.log(formValues);
      console.log(formValues.addresses);
      if (formValues.addresses[0].type === "END") {
        // Duplicate and modify the first entry
        const duplicateEntry = { ...formValues.addresses[0]}; // Change type to "START"

        // Update the original entry and push the duplicate
        formValues.addresses[0].type= "START";
        formValues.addresses.push(duplicateEntry); // Add duplicate at the end
    }

      // Preparing dynamic delivery locations
      const deliveryLocations = formValues.addresses.map((location, index) => {

        return {
              name: location.name || '',
              phone: location.phone || '',
              email: location.email || '',
              streetAddress: location.street || '',
              city: location.city || '',
              state: location.state || '',
              zipcode: location.postalcode || '',
              type: location.type || 'START',
              sequence: index + 1, // Adjust sequence numbering
              latitude: location.latitude,
              longitude: location.longitude,
              additionalInfo: location.additionalInfo || ''
           };
      });
      const endAddresses = deliveryLocations.filter(loc => loc.type === 'END');
      if (endAddresses.length > 1) {
        this.toastr.error('There can only be one END address.', 'Validation Error');
        return;
      }
       // Convert NgbDatepicker format to string "YYYY-MM-DD"
    const tripDateStr = `${formValues.tripDate.year}-${String(formValues.tripDate.month).padStart(2, '0')}-${String(formValues.tripDate.day).padStart(2, '0')}`;
     // Call convertToUTC with formatted date
     const utcDateTime = this.convertToUTC(tripDateStr, formValues.startTime, formValues.timeZone);
     if (!utcDateTime) {
      this.toastr.error("Invalid trip start date or time.", "Error");
      return;
  }

      const payload = {
        tripDetails: {
          tripName: formValues.tripName,
          tripStartDateTime: utcDateTime,
          timeZone: formValues.timeZone,
          defaultHaltTime: formValues.haltTime || 0,
          fleetId: this.fleetIdValueNew ? parseInt(this.fleetIdValueNew) : null
        },
        deliveryLocations: deliveryLocations,
      };

      this.routeOptimzeService.createTrip(payload).subscribe(
        response => {
          this.isFormSubmitting = false;
          console.log('Trip created successfully:', response);
          if (isNext) {
            this.router.navigate(['adlp/admin/admindashboard/trip-planning/assign-vehicle-to-trip', response.id]);
          } else {
           this.toastr.success('Trip saved successfully!', 'Success');
            this.router.navigate(['adlp/admin/admindashboard/trip-planning']);
          }

          // this.router.navigate(['adlp/admin/admindashboard/trip-planning/route-optimization', response.tripDetailId]);
        },
        error => {
          this.isFormSubmitting = false;
          if (error.error && error.error.apierror) {
            const apiError = error.error.apierror;
            this.toastr.error(apiError.message, 'Error');
          } else {
            this.toastr.error('Failed to create trip. Please try again.', 'Error');
          }
        }
      );
  }
  setEndAddress(index: number) {
    this.addresses.controls.forEach((control, i) => {
      if (control.get('type')?.value === 'END' && i !== index) {
        (this.addresses.at(i) as FormGroup).patchValue({ type: 'DELIVERY' });
      }
    });
    (this.addresses.at(index) as FormGroup).patchValue({ type: 'END' });
  }

  // onSubmit() {
  //   this.submitted = true;

  //   // Stop if the form is invalid
  //   if (this.tripForm.invalid) {
  //     return;
  //   }

  //   // Proceed with form submission logic
  //   console.log(this.tripForm.value);
  //   this.router.navigate(['/adlp/admin/admindashboard/trip-planning/route-optimization']);
  // }

  convertToUTC(tripDate: string, startTime: string, timeZone: string): string {
    const timeZoneOffsets: { [key: string]: number } = {
        "PST": -8,
        "MST": -7,
        "CST": -6,
        "EST": -5,
        "AKST": -9,
        "HST": -10
    };

    if (!tripDate || !startTime || !timeZoneOffsets.hasOwnProperty(timeZone)) {
        throw new Error("Invalid input values.");
    }

    // Ensure tripDate is properly formatted (YYYY-MM-DD)
    const [year, month, day] = tripDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);

    // Create local date-time as UTC (to avoid browser-dependent parsing issues)
    const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    // Adjust for timezone offset
    const utcDate = new Date(localDate.getTime() - timeZoneOffsets[timeZone] * 60 * 60 * 1000);

    return utcDate.toISOString(); // Returns properly formatted UTC time
}

}
