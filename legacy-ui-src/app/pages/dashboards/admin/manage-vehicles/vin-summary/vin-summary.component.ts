import { Component, OnInit, ViewChild, Injectable } from '@angular/core';
import { TaxonomyService } from '../../../taxonomy.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppService } from 'src/app/app.service';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import {
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { VinService } from 'src/app/core/services/users-role.service';
@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    if (value) {
      const dateParts = value.trim().split('/');
      if (dateParts.length === 3) {
        return {
          month: Number(dateParts[0]),
          day: Number(dateParts[1]),
          year: Number(dateParts[2])
        };
      }
    }
    return null;
  }

  format(date: NgbDateStruct | null): string {
    return date ?
      `${this.padNumber(date.month)}/${this.padNumber(date.day)}/${date.year}` : '';
  }

  private padNumber(value: number | null): string {
    if (!isNaN(value) && value !== null) {
      return `0${value}`.slice(-2);
    }
    return '';
  }
}


@Component({
  selector: 'app-vin-summary',
  templateUrl: './vin-summary.component.html',
  styleUrls: ['./vin-summary.component.scss'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
})
export class VinSummaryComponent implements OnInit {
  model2: string;
  chartOptions: any;
  selectedPeriod: any =''
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;
  show: boolean = true;
  hide: boolean = false;
  selectedVIN: string = ''
  totalTrips: number = 0;
  selectedMenuItem: string | null = null;
  subscription$: Subscription = new Subscription();
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  getData: any;
  selectedVin: string;
  selectedConsumer: string
  startingAddress: any;
  totalHours: string;
  totalMinutes: string;
  endAddress: any;
  fleetId: string
  selectedOem: string;
  driverScore: any
  tripData: any;
  startingAddresses: string[] = []; // Change to array to store multiple addresses
  endAddresses: string[] = [];
  vin: string;
  data: any;
  months = [
    "Jan", "Feb", "Mar", "Apr", "May", "June",
    "July", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  dataShow: boolean = false;
  dataShowTrip: boolean = false
  dataHide: boolean = false;
  isExpand: false
  fleetIdData: any;
  tableExpand: false;
  newSummary: any;
  tripDataNew: any;
  tripIds: string[] = [];
  getData1: any;
  driverScoreChartValue: any;
  oemSelection: any;
  expandedRowIndex: number = -1;
  expandedRow1Index: number = -1;
  @ViewChild('nodatafound') nodatafound: any
  lat: any;
  lng: any;
  zoom = 14; // Example zoom level
  wayPoints: any;
  start_end_mark = [];
  dataMake: any;
  getDataVinSumamry: any;
  hours: string;
  minutes: string;
  hoursTotal: string;
  minuteTotal: string;
  hoursTotalAvg: string;
  minuteTotalAvg: string;
  newTimeData: any;
  totalTimeNewData: string;
  averageTimeNewData: string;
  distance: any;
  fuelConsumed: any;
  fuelLevel: any;
  totalDistanceCovered: number;
  maxDistanceCovered: number;
  averageTripDistance: number;
  averageSpeed: number;
  topSpeed: number;
  harshAcc: any;
  harshCor: any;
  harshBrak: any;
  overSpeed: number;
  distanceTravelled: number;
  averageMileage: any;
  averageCostperMile: any;
  averageIdlingPercent: any;
  driverScoreNew: any;
  fltirepress: any;
  frtirepress: any;
  rltirepress: any;
  rrtirepress: any;
  batteryStatus: any;
  averageFuelCostPerMile: any;
  fleetIdValueNew: any;
  selectedVins: string;
  fleetIdForVIN: any;
  oem: any;
  fleetIdFromParam: any;
  consumer: string;

  constructor(private ngbCalendar: NgbCalendar,private vinService: VinService,
    private dateAdapter: NgbDateAdapter<string>, private router: Router, private route: ActivatedRoute, private modalService: NgbModal, private http: HttpClient, private datePipe: DatePipe, private _vehicleService: TaxonomyService, private appService: AppService, private spinner: NgxSpinnerService) {
      this.selectedVins = this.vinService.getSelectedVin();
      this.route.queryParams.subscribe(params => {
        // Parse vinLevelStats if available (for statistics data)
        const vinLevelStats = params['vinLevelStats'] ? JSON.parse(params['vinLevelStats']) : {};

        // Parse data parameter (for vehicle details like make, model, year, etc.)
        const vehicleData = params['data'] ? JSON.parse(decodeURIComponent(params['data'])) : {};

        const vin = params['vin'];
        this.consumer = params['consumer'];

        // Normalize property names to match template expectations
        if (vehicleData.year && !vehicleData.modelYear) {
          vehicleData.modelYear = vehicleData.year;
        }
        if (vehicleData.primaryFuelType && !vehicleData.fuelType) {
          vehicleData.fuelType = vehicleData.primaryFuelType;
        }

        // Merge vehicle data with vinLevelStats
        this.data = { ...vehicleData, ...vinLevelStats };

        this.fleetIdFromParam = vinLevelStats.fleetId || this.data.fleetId;
        this.fuelLevel = vinLevelStats.fuelConsumed || 0;
        this.driverScoreChartValue = vinLevelStats.driverBehaviourScore || 0;
        this.hoursTotal = this.convertSecondsToHours(vinLevelStats.totalDuration || 0);
        this.minuteTotal = this.convertSecondsToMinutes(vinLevelStats.totalDuration || 0);
        this.hours = this.convertSecondsToHours(vinLevelStats.maxDuration || 0);
        this.minutes = this.convertSecondsToMinutes(vinLevelStats.maxDuration || 0);
        this.averageTripDistance = vinLevelStats.averageDistance || 0;
        this.hoursTotalAvg = this.convertSecondsToHours(vinLevelStats.averageTime || 0);
        this.minuteTotalAvg = this.convertSecondsToMinutes(vinLevelStats.averageTime || 0);
        this.averageFuelCostPerMile = vinLevelStats.averageCostPerMile || 0;
        this.totalHours = this.convertSecondsToHours(vinLevelStats.idlingDuration || 0);
        this.totalMinutes = this.convertSecondsToMinutes(vinLevelStats.idlingDuration || 0);

        // Initialize additional data properties from vehicleData
        this.fltirepress = vinLevelStats.flTirepress || this.data.flTirepress || 0;
        this.frtirepress = vinLevelStats.frTirepress || this.data.frTirepress || 0;
        this.rltirepress = vinLevelStats.rlTirepress || this.data.rlTirepress || 0;
        this.rrtirepress = vinLevelStats.rrTirepress || this.data.rrTirepress || 0;
        this.batteryStatus = vinLevelStats.batteryStatus || this.data.batteryStatus || 'N/A';

        this.fuelLevelChart();
        this.driverScoreChart()
      });
}

  get today() {
    return this.dateAdapter.toModel(this.ngbCalendar.getToday())!;
  }

  ngOnInit() {
    this.showRole()
  }
  // Show Role and Consumer Details
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.loginUser = JSON.parse(sessionStorage.getItem('Useremail'));
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if(this.user === 'role_user_fleet'){
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      }
  }

  capitalizeFirstLetter(value: string): string {
    if (!value) return '';
    value = value.toLowerCase();
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  isValidSpeed(speed: any): boolean {
    return !(speed === -1  || speed === null || isNaN(speed) || speed === undefined || speed === '');
  }

  onPeriodChange(event: any) {
    this.selectedPeriod = event.target.value;
    this.spinner.show();
    this._vehicleService.getVinSummaryNew(  this.consumer,  this.fleetIdFromParam,this.selectedVins, this.selectedPeriod).subscribe(
      (res: any) => {
    if (res && Array.isArray(res.vinLevelStats) && res.vinLevelStats.length > 0) {
          const vinStats = res.vinLevelStats[0];
          this.data = vinStats;
          this.driverScoreChartValue = vinStats.driverBehaviourScore || 0;
          this.fuelLevel = vinStats.fuelConsumed || 0;
          this.fltirepress = vinStats.flTirepress || 0;
          this.frtirepress = vinStats.frTirepress || 0;
          this.rltirepress = vinStats.rlTirepress || 0;
          this.rrtirepress = vinStats.rrTirepress || 0;
          this.batteryStatus = vinStats.batteryStatus || 'N/A';
          this.totalDistanceCovered = vinStats.tripDistance || 0;
          this.hoursTotal = this.convertSecondsToHours(vinStats.totalDuration || 0);
          this.minuteTotal = this.convertSecondsToMinutes(vinStats.totalDuration || 0);
          this.maxDistanceCovered = vinStats.maxDistance || 0;
          this.hours = this.convertSecondsToHours(vinStats.maxDuration || 0);
          this.minutes = this.convertSecondsToMinutes(vinStats.maxDuration || 0);
          this.averageTripDistance = vinStats.averageDistance || 0;
          this.hoursTotalAvg = this.convertSecondsToHours(vinStats.averageTime || 0);
          this.minuteTotalAvg = this.convertSecondsToMinutes(vinStats.averageTime || 0);
          this.averageSpeed = vinStats.avgVehicleSpeed || 0;
          this.topSpeed = vinStats.maxSpeed || 0;
          this.harshAcc = vinStats.harshAcc || 0;
          this.harshCor = vinStats.harshCornering || 0;
          this.harshBrak = vinStats.harshBrake || 0;
          this.overSpeed = vinStats.overspeedingDistance || 0;
          this.distanceTravelled = vinStats.nightDistance || 0;
          this.averageMileage = vinStats.avgMileage || 0;
          this.totalHours = this.convertSecondsToHours(vinStats.idlingDuration || 0);
          this.totalMinutes = this.convertSecondsToMinutes(vinStats.idlingDuration || 0);
          this.averageIdlingPercent = vinStats.idlingPercentage || 0;
          this.averageFuelCostPerMile = vinStats.averageCostPerMile || 0;
          this.driverScoreChart();
          this.fuelLevelChart();
        }

        setTimeout(() => {
          this.spinner.hide();
        }, 1000);
      },
      (err) => {
        const errorMessage = err?.apierror?.message || "Data not found";
        if (errorMessage === "Data not found") {
          this.noDataFound(this.nodatafound);
          this.selectedPeriod = 'TILL_NOW'; // Set to 'Till Date' when no data is found
          setTimeout(() => {
            this.spinner.hide();
          }, 1000);
        }
      }
    );
  }

  removeDecimal(val) {
    if(val) {
      return Math.floor(val)

    }
  }

  noDataFound(nodatafound) {
    this.modalService.open(nodatafound, { size: "sm", centered: true });
  }

  convertNgbDateToMoment(date: NgbDateStruct): moment.Moment {
    return moment([date.year, date.month - 1, date.day]);
  }

  numbersOnlyUpto(event: any) {
    const pattern = /[0-9, A-Z, a-z]/;
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

  viewMorefleet(): void {
    if (this.customConsumer) {
      this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { consumer: this.customConsumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/fleetManageVehicles']);
    }
  }

  // getTripHistorySummary(selectedVin: string, selectedOem: string): void {
  //   this.spinner.show();
  //   this._vehicleService.getVinSummaryNew(this.fleetIdForVIN,this.oem,  this.selectedVins, 'TILL_NOW', ).subscribe(
  //     (res: any) => {
  //       if (res && Array.isArray(res.vinLevelStats) && res.vinLevelStats.length > 0) {
  //         const vinStats = res.vinLevelStats[0]; // Access the first object in the array

  //         this.getDataVinSumamry = vinStats;

  //         this.driverScoreChartValue = vinStats.driverBehaviourScore || 0;
  //         this.fuelLevel = vinStats.fuelConsumed || 0;
  //         this.fltirepress = vinStats.flTirepress || 0;
  //         this.frtirepress = vinStats.frTirepress || 0;
  //         this.rltirepress = vinStats.rlTirepress || 0;
  //         this.rrtirepress = vinStats.rrTirepress || 0;
  //         this.batteryStatus = vinStats.batteryStatus || 'N/A';
  //         this.totalDistanceCovered = vinStats.tripDistance || 0;
  //         this.hoursTotal = this.convertSecondsToHours(vinStats.totalDuration || 0);
  //         this.minuteTotal = this.convertSecondsToMinutes(vinStats.totalDuration || 0);
  //         this.maxDistanceCovered = vinStats.maxDistance || 0;
  //         this.hours = this.convertSecondsToHours(vinStats.maxDuration || 0);
  //         this.minutes = this.convertSecondsToMinutes(vinStats.maxDuration || 0);
  //         this.averageTripDistance = vinStats.averageDistance || 0;
  //         this.hoursTotalAvg = this.convertSecondsToHours(vinStats.averageTime || 0);
  //         this.minuteTotalAvg = this.convertSecondsToMinutes(vinStats.averageTime || 0);
  //         this.averageSpeed = vinStats.avgVehicleSpeed || 0;
  //         this.topSpeed = vinStats.maxSpeed || 0;
  //         this.harshAcc = vinStats.harshAcc || 0;
  //         this.harshCor = vinStats.harshCornering || 0;
  //         this.harshBrak = vinStats.harshBrake || 0;
  //         this.overSpeed = vinStats.overspeedingDistance || 0;
  //         this.distanceTravelled = vinStats.nightDistance || 0;
  //         this.averageMileage = vinStats.avgMileage || 0;
  //         this.totalHours = this.convertSecondsToHours(vinStats.idlingDuration || 0);
  //         this.totalMinutes = this.convertSecondsToMinutes(vinStats.idlingDuration || 0);
  //         this.averageIdlingPercent = vinStats.idlingPercentage || 0;
  //         this.averageFuelCostPerMile = vinStats.averageCostPerMile || 0;
  //         this.driverScoreChart();
  //         this.fuelLevelChart();
  //       }

  //       else {
  //         // Show popup or message indicating no data
  //         this.noDataFounds(this.nodatafound);

  //         setTimeout(() => {
  //           this.router.navigate(['/adlp/admin/manageVehicle']);
  //         }, 5000);
  //       }
  //       setTimeout(() => {
  //         this.spinner.hide();
  //       }, 1000);
  //     },
  //    (err) => {
  //     this.spinner.hide();
  //     // Check for specific API error response
  //     if (err?.error?.apierror?.status === "UNPROCESSABLE_ENTITY") {
  //       this.appService.openSnackBar("Data not found for selected VIN.", "Error");
  //     } else {
  //       this.showErrorPopup("An error occurred while fetching data. Please try again.");
  //     }
  //   }
  //   );
  // }

  // isTrimAvailable(): boolean {
  //   return !('trim' in this.data) || this.data?.trim == null || this.data?.trim == '';
  // }

  // Move to trip summary
  viewMore(selectedVin: string, selectedOem: string): void {
    // Map specific OEM values to standardized providers
    const provider =
    (selectedOem === 'GMC' || selectedOem === 'CHEVROLET') ? 'GM' :
  (selectedOem === 'FORD') ? 'FORDPRO' :
  (
    selectedOem === 'ABARTH' || selectedOem === 'ALFAROMEO' ||
    selectedOem === 'CHRYSLER' || selectedOem === 'CITROEN' ||
    selectedOem === 'DODGE' || selectedOem === 'DS Automobiles' ||
    selectedOem === 'FIAT' || selectedOem === 'JEEP' ||
    selectedOem === 'LANCIA' || selectedOem === 'MASERATI' ||
    selectedOem === 'OPEN' || selectedOem === 'PEUGEOAT' ||
    selectedOem === 'RAM' || selectedOem === 'VAUXHALL' ||
    selectedOem === 'FREE2MOVE' || selectedOem === 'LEASYS'
  ) ? 'STELLANTIS' :
  selectedOem;

    // Perform eligibility check and navigate with parameters
    this._vehicleService.eligibilityCheck(selectedVin).subscribe(
      (data: any) => {
        this.router.navigate(['/adlp/admin/manageVehicle/vinHistory'], {
          queryParams: {
            vin: this.maskVinNumbers(selectedVin),
            provider, // Use the mapped provider
            // data: JSON.stringify(data)
          }
        });
      },
      (error: any) => {
        console.error('Error occurred during eligibility check:', error);
      }
    );
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

  getTripHistoryDetails(selectedVin: string, selectedOem: string, tripId: string): void {
    this.tripDataNew = []
    this._vehicleService.gettripSummaryHistory(this.selectedVins, selectedOem, tripId).subscribe((res: any) => {
      this.tripDataNew = res;
      this.wayPoints = res.cxSnappedCoords.filter(coords => !isNaN(coords[0]) && !isNaN(coords[1]));
      this.start_end_mark = [];
      this.start_end_mark.push([this.wayPoints[0], this.wayPoints[1], { 'iconUrl': 'assets/mapIcon/marker.png' }]);
      this.start_end_mark.push([this.wayPoints[this.wayPoints.length - 1][0], this.wayPoints[this.wayPoints.length - 1][1], { 'iconUrl': 'assets/mapIcon/marker.png' }]);
      this.lat = this.wayPoints[this.wayPoints.length - 1][0]
      this.lng = this.wayPoints[this.wayPoints.length - 1][1]
      this.distance = ((this.tripDataNew?.cxTripDistance)).toFixed(2)
      this.fuelConsumed = (this.tripDataNew?.cxFuelConsumed).toFixed(2)
    });
  }

  showNoDataPopup(): void {

  }

  showErrorPopup(error: any): void {
    // Implement the logic to show a popup or message indicating an error
    alert(`An error occurred: ${error.message}`);
  }

  convertSecondsToHours(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    return `${this.padZero1(hours)}${hours !== 1 ? '' : ''}`;
  }

  convertSecondsToMinutes(seconds: number): string {
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${this.padZero1(minutes)} `;
  }

  padZero1(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
  // Format time zone HH:MM, MM-DD-YYYY, HH:MM:SS
  convertSecondsToHoursMinutes(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${this.padZero1(hours)}:${this.padZero1(minutes)}`;

  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'HH:mm');
  }
  formatTimes(timestamp: string): string {
    const date = new Date(timestamp);
    const hours = this.padZero(date.getHours());
    const minutes = this.padZero(date.getMinutes());
    return `${hours}:${minutes}`;
  }
  padZero(value: number): string {
    return value < 10 ? '0' + value : '' + value;
  }
  formatDate(date: NgbDateStruct): string {
    if (!date) {
      return '';
    }
    const month = date.month < 10 ? `0${date.month}` : date.month;
    const day = date.day < 10 ? `0${date.day}` : date.day;
    return `${date.year}-${month}-${day}`;
  }
  formattDate(dateString: string): string {
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'dd');
  }
  formatMonthName(dateString: string): string {
    const date = new Date(dateString);
    const monthIndex = date.getMonth();
    return this.months[monthIndex]
  }
  noDataFounds(nodatafound) {
    this.modalService.open(nodatafound, { centered: true })
  }
  backManageVehicle() {
    if (this.customConsumer) {
      this.router.navigate(['/adlp/admin/fleetManageVehicles'], { queryParams: { consumer: this.customConsumer } })
    }
  }

  fuelLevelChart() {

    this.chartOptions = {
      series: [this.fuelLevel],
      chart: {
        height: 250,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          startAngle: -145,
          endAngle: 145,
          hollow: {
            margin: 20,
            size: "70%", // Increase this value to reduce the gap
            background: "#fff",
            image: undefined,
            position: "front",
            dropShadow: {
              enabled: true,
              top: 0,
              left: 0,
              blur: 23,
              opacity: 0.07,
              color: '#000000'
            }
          },
          track: {
            background: "#E2E7F3",
            strokeWidth: "100%", // Decrease this value to reduce the gap
            margin: 0,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },
          dataLabels: {
            show: true,
            offsetY: 10,
            name: {
              show: false, // Hide the name label
              color: "#2C50A0",
              fontSize: "17px"
            },
            value: {
              formatter: function (val) {
                return `${parseInt(val.toString(), 10)}`; // Show value as percentage
              },
              color: "#2C50A0",
              fontSize: "24px",
              show: true,
              fontWeight: '600',
              fontFamily: 'Poppins',
              margin: {
                top: -10,
              },
            }
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: 'light',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#6793F0'], // End color
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
          colorStops: [
            {
              offset: 0,
              color: '#6793F0',
              opacity: 1
            },
            {
              offset: 100,
              color: '#6793F0',
              opacity: 1
            }
          ]
        }
      },
      stroke: {
        lineCap: ""
      },
    };
  }

  driverScoreChart() {
    let fillColor = '#2CA87F'; // Default color for 81-100 range

    if (this.driverScoreChartValue >= 1 && this.driverScoreChartValue <= 20) {
      fillColor = '#FF0000';
    } else if (this.driverScoreChartValue >= 21 && this.driverScoreChartValue <= 40) {
      fillColor = '#FF5050';
    } else if (this.driverScoreChartValue >= 41 && this.driverScoreChartValue <= 60) {
      fillColor = '#FA751A';
    } else if (this.driverScoreChartValue >= 61 && this.driverScoreChartValue <= 80) {
      fillColor = '#CAE9DF';
    } else if (this.driverScoreChartValue >= 81 && this.driverScoreChartValue <= 100) {
      fillColor = '#2CA87F';
    }

    this.driverScore = {
      series: [this.driverScoreChartValue],
      chart: {
        height: 270,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          startAngle: -145,
          endAngle: 145,
          hollow: {
            margin: 20,
            size: "70%",
            background: "#fff",
            position: "front",
            dropShadow: {
              enabled: true,
              top: 0,
              left: 0,
              blur: 12,
              opacity: 0.1,
              color: '#000000'
            }
          },
          track: {
            background: "#F6F6F6",
            strokeWidth: "100%",
            margin: 0,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },
          dataLabels: {
            show: true,
            offsetY: 30,
            name: {
              show: false,
              color: "#2C50A0",
              fontSize: "17px"
            },
            value: {
              formatter: function (val) {
                return `${parseInt(val.toString(), 10)}`;
              },
              color: "#000000",
              fontSize: "24px",
              fontWeight: '600',
              fontFamily: 'Poppins',
              show: true
            }
          }
        }
      },
      fill: {
        type: "solid",
        colors: [fillColor]
      },
      stroke: {
        lineCap: ""
      },
    };
  }

downloadVehicleStatistics() {
  // Define the column headers
  const headers = [
    'VIN',
    'Make',
    'Model',
    'Trim',
    'Year',
    'Class',
    'Fuel Type',
    'Front Left TirePressure (psi)',
    'Front Right TirePressure (psi)',
    'Rare Left TirePressure (psi)',
    'Rare Right TirePressure (psi)',
    'Battery Status (volts)',
    'Total Distance Covered (miles)',
    'Total Time Travelled (hrs:min)',
    'Maximum Distance Covered (miles)',
    'Maximum Duration (hrs:min)',
    'Average Trip Distance (miles)',
    'Average Trip Duration (hrs:min)',
    'Average Speed (miles)',
    'Top Speed (miles)',
    'Harsh Acceleration (count)',
    'Harsh Cornering (count)',
    'Harsh Braking (count)',
    'Overspeeding Distance (miles)',
    'Distance Travelled in Night (miles)',
    'Driver Score',
    'Fuel Level (%)',
    'Average Mileage (mpg)',
    'Total Idling Duration (hrs:mm)',
    'Average Cost Per Mile ($)',
    'Average Idling Percentage (%)',
  ];

  // Additional information rows
  const additionalInfo = [
    [`Consumer: ${this.selectedConsumer}`], // Row 1
    [`Make: ${this.data?.make}`],         // Row 2
    [`VIN: ${this.maskVinNumber(this.selectedVins)}`],
    [`Time Period: ${this.selectedPeriod}`], // Row 4
    []                                    // Blank row
  ];

  // Prepare the data
  const data = [
    [
      this.maskVinNumber(this.selectedVins),
      this.data?.make,
      this.data?.model,
      this.data?.trim,
      this.data?.year,
      this.data?.bodyClass,
      this.data?.primaryFuelType,
      this.fltirepress === -1 ? 'NA' : this.fltirepress.toFixed(0),
      this.frtirepress === -1 ? 'NA' : this.frtirepress.toFixed(0),
      this.rltirepress === -1 ? 'NA' : this.rltirepress.toFixed(0),
      this.rrtirepress === -1 ? 'NA' : this.rrtirepress.toFixed(0),
      this.batteryStatus,
      this.totalDistanceCovered.toFixed(2),
      `${this.hoursTotal}:${this.minuteTotal}`,
      this.maxDistanceCovered.toFixed(2),
      `${this.hours}:${this.minutes}`,
      this.averageTripDistance.toFixed(2),
      `${this.hoursTotalAvg}:${this.minuteTotalAvg}`,
      this.averageSpeed.toFixed(2),
      this.topSpeed.toFixed(2),
      this.harshAcc,
      this.harshCor,
      this.harshBrak,
      this.overSpeed.toFixed(2),
      this.distanceTravelled.toFixed(2),
      this.driverScoreNew,
      this.fuelLevel.toFixed(2),
      this.averageMileage.toFixed(2),
      `${this.totalHours}:${this.totalMinutes}`,
      Number(this.averageFuelCostPerMile).toFixed(2), // Assuming this is a placeholder for a calculated value
      this.averageIdlingPercent.toFixed(2),
    ],
  ];

  // Create a worksheet and add data
  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([...additionalInfo, headers, ...data]);

  // Merging the cells for the additional info rows across all columns
  const totalColumns = headers.length;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } }, // Merge for 'Consumer:'
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalColumns - 1 } }, // Merge for 'Make:'
    { s: { r: 2, c: 0 }, e: { r: 2, c: totalColumns - 1 } }, // Merge for 'VIN:'
    { s: { r: 3, c: 0 }, e: { r: 3, c: totalColumns - 1 } }, // Merge for 'VIN:'
  ];

  // Create a workbook and add the worksheet
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Summary');

  // Generate the file and trigger download
  XLSX.writeFile(wb, 'Vehicle_Summary.xlsx');
}


  ngOnDestroy() {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }

  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
  }

  // update fuel tank capacity

  updateFuelSize(vehicle: any): void {
    this._vehicleService.updateFuelCapacity(this.selectedVins, vehicle.fuelTankSize).subscribe({
      next: (res) => {
        vehicle.isFuelEditing = false;
        this.appService.openSnackBar('Fuel tank capacity updated successfully', 'Success');
      },
      error: (err) => {
        this.appService.openSnackBar('Vehicle name not updated', 'error');
      }
    });
  }



}
