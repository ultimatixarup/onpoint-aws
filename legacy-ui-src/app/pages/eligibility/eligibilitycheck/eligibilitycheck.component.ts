import { Component, OnInit, NgZone, HostListener, ViewChild, TemplateRef, ElementRef, ChangeDetectorRef } from '@angular/core';
import { NgbModal, NgbModalConfig, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { VehicleServiceService } from '../service/vehicle-service.service';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { AppService } from 'src/app/app.service';
import { switchMap } from 'rxjs/operators';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { initialMVErrorState, MVErrorState } from '../models';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { TimezoneService } from "src/app/layouts/user-role/users-role.service";
import * as moment from 'moment-timezone';
type AOA = any[][];
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexYAxis, ApexFill, ApexTooltip, ApexTitleSubtitle, ApexLegend } from "ng-apexcharts";
import { threadId } from 'worker_threads';
export type ChartOptions = {
  series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis; stroke: ApexStroke; dataLabels: ApexDataLabels; fill: ApexFill;
  tooltip: ApexTooltip; yaxis: ApexYAxis | ApexYAxis[]; title: ApexTitleSubtitle; labels: string[]; legend: ApexLegend; subtitle: ApexTitleSubtitle;
};
@Component({
  selector: 'app-eligibilitycheck',
  templateUrl: './eligibilitycheck.component.html',
  styleUrls: ['./eligibilitycheck.component.scss'],
})
export class EligibilitycheckComponent implements OnInit {
  @ViewChild('statusSection') statusSectionRef: ElementRef;
  @ViewChild('vineligibilityModel') vineligibilityModel: TemplateRef<any>
  @ViewChild('refreshSection') refreshSection: ElementRef;
  @ViewChild('content') content: ElementRef;
  @ViewChild('alertModel') alertModel:any
  @HostListener('window:resize', ['$event'])
  newUpload: boolean = false;
  oldUpload: boolean = true;
  currentStatus: string = '';
  conditioning: boolean = true;
  chartOptions: any
  model: NgbDateStruct;
  filterData = []
  enrollmentForm: FormGroup
  updateEnrollmentForm: FormGroup
  consumerDetailUpdate: any
  vins: any = []
  oem: string[]
  consumerData: any[]
  consumerData1: any[]
  dataNew: boolean = true;
  consumerDetail: any = ''
  active = 1;
  fileName: string = '';
  files: any;
  providerData: any[]
  selectedEnroll: any
  name: any;
  names: any = []
  pages: any = ''
  dateFormat: any = "dd/mm/yyyy"
  subscription$: Subscription = new Subscription();
  currentDate = new Date().toISOString().slice(0, 10);
  pageSize = 50
  page: number = 1
  uploadEnabled: true;
  vehicleData: any = [];
  searchByVin: any = null;
  datadata: any
  searchByOem: any = null;
  searchByConsumer: any = null;
  consumerUnenroll: any = null
  minDateCal: any = {}
  minDateData: { year: number; month: number; day: number; };
  sortByDate: boolean = false
  updateStartDate: any;
  // id:string
  updateEndDate: any;
  StartYear: any;
  StartMonth: any;
  StartDay: any;
  selectedStartDay: number;
  selectedStartMonth: number;
  endYear: any;
  endMonth: any;
  provider: any = ''
  endDay: any;
  submitBtn: boolean = false;
  updatedStartYear: any;
  updatedStartMonth: any;
  updatedStartDay: any;
  updatedEndYear: any;
  updatedEndMonth: any;
  updatedEndDay: any;
  country: any;
  state: any = [];
  stateList: any = []
  donutchart2: any
  progressBarColor: string = 'black'
  bulkEnrollmentForm: FormGroup
  enrollMentCheckForm: FormGroup
  vinId: any;
  eligiblity: any;
  message: string;
  vinstatus: boolean = false;
  data: any = [];
  vinData: any;
  vinDataMain: any;
  bulkData: any;
  searchId: any = ''
  searchName: any = ''
  userRole: any;
  description: string = ''
  counter: any = 0;
  fordCount: number = 0;
  selectedVINid: number;
  customConsumer: any;
  selectConsumervalue: any = null
  fleetsSumamry: any
  bulkUnEnroll: any = []
  dateEndUpdate: NgbDateStruct = { year: 1789, month: 7, day: 14 };
  validationVIN: boolean = true
  isDisabledCDate: any
  activateStatus: any;
  dataform: boolean = true;
  dataUnform: boolean = false;
  statesName: any;
  selectedVehicle: any;
  checkStatus: boolean = false;
  submit: boolean = true;
  successVinList: any;
  disbaleSubmit: boolean = false;
  errorvinList: any = [];
  fleetsSumamryBulk: any;
  packagesData: any;
  packagesDetails: any
  nodataLoading: boolean = false
  dataNewOne: boolean = true;
  uploadIconClass: any
  uploadHeading: any
  uplodMainBox: any
  temp: any;
  validateFileArray: MVErrorState = initialMVErrorState
  dataUpload: boolean = true;
  providerList: any[];
  stateNameList: unknown[];
  fleets: unknown[];
  packageList: unknown[];
  noOfError: any = [];
  searchByVinBulk: ''
  oemSort: any;
  vinSort: any;
  progresschart: any;
  consumerSort: any
  sortByStatus: boolean = false;
  loginUser: any;
  multiRoles: any;
  user: any;
  IsDisabled: boolean = true
  pageNumber: number = 1;
  pageCount: number = 40
  paginationCount: any;
  totalPages: any;
  isButtonRefreshed: boolean = false;
  providerDataFilter: any;
  consumers: any;
  pagination: any[];
  loading: boolean = false;
  vehicleDataBulk: any = [];
  loadingBulk: boolean = false;
  eligiblityData: any;
  insertVIN: any;
  insertDeaVIN: any;
  anonymizationVIN: any;
  deanonymizationVIN: any;
  activeButton: number | null = null;
  fileSubmitted: boolean = false;
  selectedId: any;
  reports: any;
  oemData: any[] = [];
  showChart: boolean = false;
  lastSelectedId: string | undefined;
  private intervalSubscription: any;
  databreakup: boolean = false;
  totalVins: any;
  status: any;
  invalidVinCount: any;
  validVinCount: any
  pending: any;
  dataHideShow: boolean = false;
  dataHideShowMore: boolean = false;
  pendingCount: any;
  dateGenerated: void;
  filteredBulkData: any;
  timeStamp: any;
  newData: any;
  invalidCounts: any;
  newVinCount: number;
  otherNewVinCount: number;
  eligibleUploadData: any;
  validateEligibleFileArray: any
  totalComplaintsVinPending: number;
  uploadSuccessMessage: string;
  newVinCountCompliant: number;
  stellantis: any;
  TOYOTA: any;
  GM: any;
  TESLA: any;
  eligibile: any;
  eligible: any;
  oemData1: any[];
  tableData: any;
  invalidVinCounts: any;
  oemMakeCount: any;
  totalVinCountUplaoded: any;
  duplicateVin: any;
  nonAddressableVin: any;
  nonComplaintVin: any;
  complaintVin: any;
  eligibleVin: any;
  totalVinCounts: any;
  totalComplaintVinCounts: any;
  totalEigibleVinCounts: any;
  dataOem: any;
  uploadedDate: any;
  reportGeneratedDate: any;
  statusNew: string = '';
  timeLeft: number = 30; // Initial time
  interval: any;
  showCounter: boolean = false;
  fleetIdValueNew: any;
  condition: any;
  localTime!: string;
  selectedTimezone!: string;
  neTimeZone: any;
  constructor(private modalService: NgbModal,
    private timezoneService: TimezoneService,
    private _vehicleService: VehicleServiceService,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private ElementRef: ElementRef,
    private toastr: ToastrService, private appService: AppService, private zone: NgZone) {
    this.bulkEnrollmentsForm()
    this.createvinEligibility()
  }

  toggleContent(buttonNumber: number): void {
    this.activeButton = this.activeButton === buttonNumber ? null : buttonNumber;
  }

  ngOnInit(): void {
    this.showRole();
    this.bulkEnrollmentsForm();
    this.getBulkdata()
    this.selectedTimezone = this.timezoneService.getTimezone(); // Get the initial timezone
    this.timezoneService.timezone$.subscribe((tz) => {
      this.selectedTimezone = tz;
      this.updateTime()
    });
    this.IsDisabled = false;
    if (this.status === 'COMPLETED') {
      this.showCounter = true;
      this.interval = setInterval(() => {
        this.updateTimer();
      }, 1000);
    }

  }



  updateTime(){
    if (this.reportGeneratedDate) {
      const formatted = moment.utc(this.reportGeneratedDate)
        .tz(this.selectedTimezone);
      this.formattedDate = formatted.format('MMM D, YYYY');
      this.formattedTime = formatted.format('HH:mm');
    } else {
      this.formattedDate = '--';
      this.formattedTime = '--';
    }
  }


  ngAfterViewInit() {
      this.getCondition(this.alertModel)
  }

  updateTimer(): void {
    this.timeLeft--;

    if (this.timeLeft <= 0) {
      clearInterval(this.interval);
    }
  }

  bulkEnrollmentsForm() {
    this.bulkEnrollmentForm = this.fb.group({
      description: ['', Validators.required],
      oem: ['2', Validators.required],
    })
  }

  closeAll(): void {
    this.activeButton = null;
  }

  simulateCompletion() {
    // Simulate an asynchronous operation
    setTimeout(() => {
      this.status === 'COMPLETED' // Update currentStatus to 'completed'
    }, 1000); // Simulating a delay of 2 seconds
  }

  createvinEligibility() {
    this.enrollMentCheckForm = this.fb.group({
      vins: ['', [Validators.required, Validators.pattern("^(?=.*[0-9])(?=.*[A-z])[0-9A-z-]{17}$")]],
      oems: ['',],
    })
  }

  checkVin1(evt) {
    let vin = evt.toUpperCase()
    if (this.validateVin(vin)) {
      this.validationVIN = true
    } else {
      this.validationVIN = false
    }
  }

  validateVin(vin) {
    return this.validate(vin);
  }

  get_check_digit(vin) {
    var map = '0123456789X';
    var weights = '8765432X098765432';
    var sum = 0;
    for (var i = 0; i < 17; ++i)
      sum += this.transliterate(vin[i]) * map.indexOf(weights[i]);
    return map[sum % 11];
  }

  validate(vin) {
    if (vin.length !== 17) return false;
    return this.get_check_digit(vin) === vin[8];
  }

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

  transliterate(c) {
    return '0123456789.ABCDEFGH..JKLMN.P.R..STUVWXYZ'.indexOf(c) % 10;
  }

  async uploadFiles(evt: any) {
    // ;
    this.errorvinList = [];
    this.noOfError = [];
    this.data = [];
    this.eligibleUploadData = [];
    const files1 = evt.target.files;
    const fileTypes = ['csv'];
    if (files1.length > 0) {
      this.fileName = evt.target.files[0].name;
      const fileExtension = evt.target.files[0].name.split('.').pop().toLowerCase();
      const isSuccess = fileTypes.indexOf(fileExtension) > -1;
      if (isSuccess) {
        this.files = evt.target.files.item(0);
        const target: DataTransfer = <DataTransfer>(evt.target);
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];
          const headers: string[] = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })[0];
          const lowercaseHeaders: string[] = headers.map(header => header.toLowerCase());
          const range = XLSX.utils.decode_range(ws['!ref']);
          range.s.r += 1;
          ws['!ref'] = XLSX.utils.encode_range(range);
          const dataWithLowercaseHeaders = XLSX.utils.sheet_to_json(ws, {
            header: lowercaseHeaders,
            defval: '',
          });
          this.data = <AOA>dataWithLowercaseHeaders;
          this.eligibleUploadData = this.data.filter(item =>
            Object.keys(item)[0] !== '__EMPTY_1'
          );
          const totalRows = this.eligibleUploadData.length;
          this.totalVins = totalRows
          this.changeIconAndHeading();
        };
        ;
        this.IsDisabled = false;
        reader.readAsBinaryString(target.files[0]);
      } else {
        this.files = null;
        this.fileName = null;
        ;
      }
    } else {
      this.fileName = null;
      ;
    }
  }

  changeIconAndHeading() {
    this.uploadIconClass = 'new-icon-class';
    this.uploadHeading = 'File Uploaded Successfully';
  }

  changeBoxAndHeading() {
    this.uplodMainBox = 'new-box';
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  numbersOnlyUpto(event: any) {
    const pattern = /[0-9, A-Z, a-z]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
  vinDataLoad: boolean = false;
  checkVin(form) {
    this.vinDataLoad = true;
    this.subscription$.add(
      this._vehicleService.eligibilityCheck(form.vins).subscribe(
        (res: any) => {
          this.vinId = res.vin.toUpperCase();
          this.eligiblity = res.isEligible ? 'True' : 'False';
          this.eligiblityData = res;
          this.message = res.isEligible
            ? "VIN Eligible for Enrollment"
            : "VIN not Eligible for Enrollment";
          this.vinDataLoad = false;  // hides spinner after handling both cases
        },
        (err) => {
          console.error("API error:", err);
          this.message = "An error occurred while checking the VIN.";
          this.vinDataLoad = false;
          console.log("Spinner hidden (error)");
        }
      )
    );
  }



  geteligibleVin(id) {
    console.log('981092')
      if(this.customConsumer == 'Azuga' ){
        this.dataNew = true;

      this.subscription$.add(
        this._vehicleService.getReported(id).subscribe((res: any) => {
          let reports: any = res
          this.downloadFile(reports)

        }, err => {

        }))
      }
      else if(this.multiRoles == 'ROLE_ADMIN' || this.customConsumer == 'Onwardfleet' || this.customConsumer == 'Smallboard' ){
        console.log('213123')
        this.subscription$.add(
          this._vehicleService.getReported(id).subscribe((res: any) => {
            let reports: any = res;
            let totalVinUploaded = reports.length;
            this.downloadVinReport(reports, "VIN_Eligibility", id, totalVinUploaded,
            );
          }, err => {
          }
          ))
      }

  }

  validateMaskIng(el, e) {
    var regex = /^[a-zA-Z0-9]*$/;
    var key = e.clipboardData.getData('text')
    if (!regex.test(key)) {
      e.preventDefault();
      return false;
    }
  }

  setupInterval(): void {
    this._vehicleService.gettData(this.selectedId).subscribe((initialData: any) => {
      this.invalidCounts = initialData?.invalidVinCount ?? 0;
      if (initialData && initialData.oemVinsReport) {
        this.chartShow(initialData.oemVinsReport);
        this.chartprogress(initialData.oemVinsReport)
        this.processData(initialData);
        this.summaryCollection()
      }
    });
  }


  setUpIntervalData(): void {
    this.counter = 0
    this.intervalSubscription = interval(5000).pipe(
      switchMap(() => this._vehicleService.gettData(this.selectedId))
    ).subscribe((res: any) => {
      this.invalidCounts = res?.invalidVinCount

      if (res && (res.oemVinsReport?.length > 0)) {
        if (this.counter >= 0 && this.counter <= 1) {
          this.chartShow(res.oemVinsReport);
          this.chartprogress(res.oemVinsReport)
          this.summaryCollection()
          this.counter++
        }
        this.processData(res, false);

      }
      this.removeInterval(res.oemVinsReport)
    });
  }

  removeInterval(data) {
    // Check the total pending count and unsubscribe after 30 seconds
    const totalPending = data.reduce((sum, item) => sum + item.pendingCount, 0);

    // Timeout logic to automatically unsubscribe after 30 seconds if condition is met
    setTimeout(() => {
      if (totalPending === 0) {
        this.summaryCollection();
        this.intervalSubscription.unsubscribe();
        console.log('Interval unsubscribed because all pending items are processed after 30 seconds');
      }
    }, 200000); // 30 seconds timeout
  }

  processData(data: any, updateChart: boolean = true): void {
    if (data && data.oemVinsReport) {
      this.oemData = data.oemVinsReport;
      this.oemData.sort((a, b) => {
        if (a.oem === "OTHERS") return 1; // "OTHERS" should come last
        if (b.oem === "OTHERS") return -1; // "OTHERS" should come last
        return a.oem.localeCompare(b.oem); // Sort alphabetically for other values
      });
      this.invalidVinCount = data.invalidVinCount;
      this.validVinCount = data.validVinCount
      const totalVinCount = this.oemData.reduce((acc, oem) => acc + oem.totalVinCount, 0);
      this.oemData1 = this.oemData.filter((oem: any) => {
        return oem.totalVinCount > 0;
      });

      this.databreakup = true;
      if (updateChart) {
        this.chartShow(data.oemVinsReport);
        this.chartprogress(data.oemVinsReport)
      }

      const { successCount, failedCount, pendingCount } = data;
      const totalPendingCount = this.oemData.reduce((total, report) => total + report.pendingCount, 0);
      const othersIndex = this.oemData.findIndex((oem) => oem.oem === 'Others');
      if (othersIndex !== -1) {
        const othersOEM = this.oemData.splice(othersIndex, 1)[0];
        othersOEM.oem = 'OTHERS';
        this.oemData.push(othersOEM);
      }
      if (this.invalidVinCount > 0 || this.validVinCount > 0) {
        this.updateProgressBar(successCount, failedCount, totalPendingCount);
      }
      const allPendingZero = totalPendingCount === 0;

      // Determine if the button should be refreshed
      const shouldRefreshButton = allPendingZero;

      if (shouldRefreshButton) {
        // Refresh the button
        this.refreshButton();
      }
      if (this.invalidVinCount >= 0 && this.validVinCount === null && this.oemData) {
        this.dataHideShow = true;
        this.dataHideShowMore = false;
      }

      else if (this.invalidVinCount >= 0 && this.validVinCount === null && totalPendingCount == 0) {
        this.dataHideShow = true;
        this.dataHideShowMore = false;
      }
      else if (this.invalidVinCount === null && this.validVinCount >= 0 && totalPendingCount == 0) {
        this.dataHideShow = false;
        this.dataHideShowMore = true;
      }
      else if (this.invalidVinCount > 0 && this.validVinCount >= 0 && totalPendingCount == 0) {
        this.dataHideShow = false;
        this.dataHideShowMore = true;
      }
      else if (this.invalidVinCount === null || this.validVinCount === null) {
        this.dataHideShow = true;
        this.dataHideShowMore = false;
      }

      else if (this.invalidVinCount > 0 && this.validVinCount >= 0 && totalPendingCount == 0) {
        this.dataHideShow = false;
        this.dataHideShowMore = true;
      }
      else if (this.invalidVinCount >= 0 && this.validVinCount >= 0) {
        this.dataHideShow = true;
        this.dataHideShowMore = false;
      }
      else {
        this.dataHideShow = false;
        this.dataHideShowMore = true;
      }

      this.updateProgressBar(successCount, failedCount, totalPendingCount);
    }
  }

  refreshButton() {
    // Assuming there's a method to update the button state, implement it accordingly
    // For example:
    this.isButtonRefreshed = true;
  }

  updateProgressBar(successCount: number, failedCount: number, pendingCount: number): void {
    this.zone.run(() => {
      if (successCount > 0) {
        this.setProgressBarColor('#45B01F');
      } else if (failedCount > 0) {
        this.setProgressBarColor('#ff0000');
      } else if (pendingCount > 0) {
        this.setProgressBarColor('#f2f2f2');
      } else {
        this.setProgressBarColor('#000000');
      }
    });
  }

  setProgressBarColor(color: string): void {
    this.progressBarColor = color;
    this.cdr.detectChanges();
  }

  getColorForOEM(oem: string): string {
    // Add logic here to map each OEM to a specific color
    switch (oem) {
      case 'FORDPRO':
        return '#616177';
      case 'FORD':
        return '#616177';
      case 'STELLANTIS':
        return '#BEB5B5';
      case 'TOYOTA':
        return '#C37E68';
      case 'GM':
        return '#657EA3';
      case 'TESLA':
        return '#73787D';
      case 'OTHERS':
        return '#6C757E';// Default color if no match is found
    }
  }

  async chartShow(oemVinsReport: any) {
    // if(typeof oemVinsReport)
    let othersIndex: any = ''
    if (oemVinsReport?.length > 0) {
      othersIndex = oemVinsReport.findIndex(report => report.oem === 'Others');
    }
    let othersOEM = null;
    if (othersIndex !== -1 && oemVinsReport?.length > 0) {
      othersOEM = oemVinsReport.splice(othersIndex, 1)[0];
      othersOEM.oem = 'OTHERS';
    }
    let seriesData: any[] = [];
    let totalVinCount = 0;
    if (oemVinsReport?.length > 0) {
      seriesData = oemVinsReport.map(report => report.totalVinCount);
      totalVinCount = seriesData.reduce((acc, curr) => acc + curr, 0);
    }

    if (othersOEM) {
      totalVinCount -= othersOEM.totalVinCount || 0;
      seriesData.push(othersOEM.totalVinCount || 0);
      oemVinsReport.push(othersOEM);
    }
    this.donutchart2 = {
      chart: {
        height: 320,
        type: 'pie',
      },
      series: seriesData,
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        floating: false,
        fontSize: '10px', // Adjusted font size to 10px
        offsetX: 4,
        itemWrap: true,
        labels: {
          colors: '#000000', // Changed legend color to #000000
          useSeriesColors: false
        },
      },
      dataLabels: {
        enabled: true,
      },
      labels: oemVinsReport.map(report => report.oem),
      colors: oemVinsReport.map(report => this.getColorForOEM(report.oem)),
      // style: {
      //   fontFamily: 'poppins',
      // }
    };

    // Modify legend entry for 'Others'
    if (othersOEM) {
      this.donutchart2.legend.labels = {
        colors: this.getColorForOEM(othersOEM.oem),
        useSeriesColors: false,
      };
    }

    this.showChart = true;
  }

  onTabButtonClick() {
    this.setupInterval()
  }


  async chartprogress(oemVinsReport: any[]) {
    const failedCount = oemVinsReport.map(report => report.failedCount);
    const validVinCounts = oemVinsReport.map(report => report.successCount);
    const pendingCounts = oemVinsReport.map(report => report.pendingCount);
    this.chartOptions = {
      series: [
        {
          name: 'Valid Vin Count',
          data: validVinCounts,
          color: '#00FF00' // Green for validVinCount
        },
        {
          name: 'Failed Count',
          data: failedCount,
          color: '#FF0000' // Red for failedCount
        },
        {
          name: 'Pending Count',
          data: pendingCounts,
          color: '#FFFF00' // Yellow for pendingCount
        },
      ],
      chart: {
        type: "bar",
        height: "300",
        stacked: true,
        toolbar: {
          show: false // Set this to false to hide the toolbar
        },
        tooltip: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: 15, // Adjust this value to set the bar height as a fraction of the available space
          dataLabels: {
            show: false, // Set this to false to hide numbers within the bars
          }
        }
      },
      stroke: {
        width: 1,
        colors: ["#fff"]
      },
      xaxis: {
        categories: oemVinsReport.map(report => report.oem),
        labels: {
          show: false // Set this to false to hide bottom labels
        },
        axisBorder: {
          show: false // Set this to false to hide x-axis lines
        }
      },
      yaxis: {
        labels: {
          show: false // Set this to false to hide y-axis labels
        },
        axisBorder: {
          show: false // Set this to false to hide y-axis lines
        },
        show: false, // Set this to false to hide the y-axis
      },
      grid: {
        show: false, // Set this to false to hide grid lines
      },
      tooltip: {
        show: false,
      },
      fill: {
        opacity: 1
      },
      legend: {
        show: false,
        position: "bottom",
        horizontalAlign: "left",
        offsetX: 40
      }
    };
  }

  summaryCollection() {
    this._vehicleService.downloadgettData(this.selectedId).subscribe((initialData: any) => {
      this.tableData = initialData
      this.totalVinCountUplaoded = this.tableData?.totalVinCountUploaded
      this.duplicateVin = this.tableData?.duplicateVinCount
      this.invalidVinCounts = this.tableData?.invalidCount
      this.nonAddressableVin = this.tableData?.nonAddressableVinCount
      this.oemMakeCount = this.tableData?.cxMakeOemVinCount
      this.nonComplaintVin = this.tableData?.nonCompliantVin
      this.complaintVin = this.tableData?.totalOemCompliantVinCount
      this.eligibleVin = this.tableData?.totalEligibilityVinCount;
      this.dataOem = this.tableData?.oem
    })
      , err => {
      }

  }

  summaryDownload(id) {
    console.log('123')
    this._vehicleService.downloadgettData(id).subscribe((initialData: any) => {
      this.tableData = initialData
      this.totalVinCountUplaoded = this.tableData?.totalVinCountUploaded
      this.duplicateVin = this.tableData?.duplicateVinCount
      this.invalidVinCounts = this.tableData?.invalidCount
      this.nonAddressableVin = this.tableData?.nonAddressableVinCount
      this.oemMakeCount = this.tableData?.cxMakeOemVinCount
      this.nonComplaintVin = this.tableData?.nonCompliantVin
      this.complaintVin = this.tableData?.totalOemCompliantVinCount
      this.eligibleVin = this.tableData?.totalEligibilityVinCount;
      this.dataOem = this.tableData?.oem
    })
      , err => {
      }

  }

  // refreshEligibleVin() {
  //   setInterval(() => {
  //     this._vehicleService.downloadgettData(this.selectedId).subscribe((data: any) => {
  //       this.eligibleVin = data?.totalEligibilityVinCount;

  //     });
  //   }, 10000); // 10 seconds interval
  // }

  async downloadVinReport(data, item, id, oemData) {
    // data = data.filter(row => row.year > 2018);
    const listItem: any = this.filteredBulkData.find(item => item.id === id) ? this.filteredBulkData.find(item => item.id === id) : {};
    if (Object.keys(listItem).length == 0) {
      listItem.reportGenerateDate = this.dateGenerated
    }
    const replacer = (key, value) => {
      if (value === null) {
        return '';
      } else if (value === 'VIN validation failed.Invalid checksum') {
        return 'VIN Invalid';
      }
      else if (value === 'Blue Button Key Press, ask for a fleet advisor and request a reactivation') {
        return 'Blue Button Key Press';
      }
      else if (value === 'LE, SE, XLE, LE w/Convenience Tech pkg, LE w/Premium pkg, SE w/Premium pkg, SE w/Nightshade pkg') {
        return 'LE';
      }
      else if (value === 'VIN validation failed. Character at index 1 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 2 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 3 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 4 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 5 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 6 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 7 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 8 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 9 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 10 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 11 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 12 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 13 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 14 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 15 is invalid.') {
        return 'VIN validation failed';
      }
      else if(value === 'Firmware Version needs an upgrade'){
        return 'Version Upgrade'
      }
      else if (value === 'VIN validation failed. Character at index 16 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 17 is invalid.') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Invalid length') {
        return 'VIN validation failed';
      }
      else if (value === 'VIN validation failed. Character at index 0 is invalid') {
        return 'VIN validation failed';
      }
      else if (value === 'Standard, Convertible, & Convertible Sport') {
        return 'Standard';
      }
      else if (value === 'Work Truck/LS/Fleet/Base') {
        return 'Work Truck';
      }
      else if (value === 'Work Truck/Fleet/Base') {
        return 'Work Truck';
      }
      else if (value === ',') {
        return '';
      }
      else if (value === 'ARISING INDUSTRIES, INC') {
        return 'Arising Industries';
      }
      else if (value === 'JLG Industries, Inc.') {
        return 'JLG Industries';
      }
      else if (value === 'HAULMARK INDUSTRIES INC') {
        return 'Haulmark Industries';
      }

      else if (value === 'F Sport Base, AWD F Sport Base') {
        return 'F Sport Base'
      }
      else if (value === 'Super Duty - Dual Rear Wheel - Diesel') {
        return 'Super Duty'
      }
      else {
        return value
      }
    };
    const header = ['vin', 'make', 'model', 'trim', 'year', 'eligibilityStatus', 'validationFailureReason','action', 'serviceCodes', 'vehicleFleetType'];
    const alignedHeader = header.map(value => JSON.stringify(value, replacer) + '||');
    let csv = data.map((row) => {
      return header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',');
    });
    csv.unshift(alignedHeader.join(','));
    csv.shift()
    const MAX_ROWS_PER_PAGE = 27
    const totalPages = Math.ceil(csv.length / MAX_ROWS_PER_PAGE);
    const pagesData = Array.from({ length: totalPages }, (_, i) =>
      csv.slice(i * MAX_ROWS_PER_PAGE)
    );
    const pdfDoc = await PDFDocument.create();
    function drawRow(x, y, texts, lineHeight, page) {
      for (let i = 0; i < texts.length; i++) {
        const { text, size, color } = texts[i];
        page.drawText(text, {
          x: x + i * 100,
          y: y,
          size: size,
          color: color,
        });
      }
    }

    function drawTable(x, y, data, page) {
      const cellHeight = 25;
      const borderWidth = 0.5;
      const leftMargin = 0;
      const topMargin = 2;
      function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px Poppins`;
        return context.measureText(text).width;
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowY = y - i * cellHeight;
        let bgColor;
        switch (i % 7) {
          case 0:
          case 2:
          case 4:
          case 6:
            bgColor = rgb(0.851, 0.851, 0.851);
            break;
          case 1:
          case 3:
          case 5:
            bgColor = rgb(0.949, 0.949, 0.949);
            break;
          default:
            bgColor = rgb(1, 1, 1);
        }
        let currentX = x;
        for (let j = 0; j < row.length; j++) {
          const text = row[j];
          let cellWidth;
          let align = ""; // Default alignment
          let xOffset = 0; // Default xOffset
          if (j === 0) {
            cellWidth = 340;
            align = "left"; // Align left for the first column
            xOffset = 0; // Apply left margin
          } else if (j === 1) {
            cellWidth = 120;
            align = "center"; // Default alignment
          } else if (j === 2) {
            cellWidth = 520;
            align = "left"; // Align left for the first column
            xOffset = 0; // Apply left margin
          } else {
            cellWidth = 210; // Default width
          }

          const cellX = currentX;
          const cellY = rowY;

          page.drawRectangle({
            x: cellX,
            y: cellY,
            width: cellWidth,
            height: cellHeight,
            borderColor: rgb(1, 1, 1),
            borderWidth: borderWidth,
            color: bgColor,
          });
          const maxLineWidth = cellWidth - 2 * borderWidth;
          let lines = [];
          let currentLine = '';
          let words = text.split(" ");
          for (let word of words) {
            const lineWidth = getTextWidth(currentLine + word, 10);
            if (lineWidth <= maxLineWidth) {
              currentLine += (currentLine ? " " : "") + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);
          let lineHeight = cellHeight - 10 - topMargin;
          for (let line of lines) {
            const textWidth = getTextWidth(line, 10);
            let xOffset;
            if (align === "left") {
              xOffset = leftMargin;
            } else {
              xOffset = (cellWidth - textWidth) / 2;
            }
            page.drawText(line, {
              x: cellX + xOffset,
              y: cellY + lineHeight,
              size: 10,
              color: rgb(0, 0, 0),
              bold: (i === 0 && j === 0),
            });
            lineHeight -= 12;
          }
          currentX += cellWidth;
        }
      }
    }

    function drawTableNew(x, y, data, page) {
      const cellWidth = 330;
      const headerCellHeight = 30;
      const otherCellHeight = 25;
      const leftMargin = 7;
      const topMargin = 3;
      const borderWidth = 0.5;
      function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px Poppins`;
        return context.measureText(text).width;
      }
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowY = y - i * (i === 0 ? headerCellHeight : otherCellHeight);
        let bgColor;
        let textColor = "black";
        let isBold = false;
        if (i === data.length - 1) {
          bgColor = rgb(1, 0, 0);
          textColor = "white";
        } else {
          switch (i % 7) {
            case 0:
              bgColor = rgb(0.980, 0.796, 0.671);
              isBold = true;
              break;
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              bgColor = rgb(0.984, 0.890, 0.827);
              break;
            case 6:
              bgColor = rgb(0.769, 0.361, 0.078);
              isBold = true;
              break;
            default:
              bgColor = rgb(1, 1, 1);
          }
        }

        for (let j = 0; j < row.length; j++) {
          const text = row[j];
          const cellX = x + j * cellWidth;
          const cellY = y - i * (i === 0 ? headerCellHeight : otherCellHeight);

          page.drawRectangle({
            x: cellX,
            y: cellY,
            width: cellWidth,
            borderColor: rgb(1, 1, 1),
            borderWidth: borderWidth,
            height: (i === 0 ? headerCellHeight : otherCellHeight),
            color: (i === data.length - 1 ? rgb(0.769, 0.361, 0.078) : bgColor), // Set red background color only for the last row
          });

          const maxLineWidth = cellWidth - 2
          let lines = [];
          let currentLine = '';
          for (let char of text) {
            const lineWidth = getTextWidth(currentLine + char, 10);
            if (lineWidth <= maxLineWidth) {
              currentLine += char;
            } else {
              lines.push(currentLine);
              currentLine = char;
            }
          }
          lines.push(currentLine);

          let lineHeight = (i === 0 ? headerCellHeight : otherCellHeight) - 10 - topMargin;
          for (let line of lines) {
            const textWidth = getTextWidth(line, 8.5);
            const xOffset = (cellWidth - textWidth) / 2;
            page.drawText(line, {
              x: cellX + leftMargin,
              y: cellY + lineHeight,
              size: 10,
              bold: isBold,
              color: rgb(0, 0, 0),
            });
            lineHeight -= 12;
          }
        }
      }
    }
    const pageWidth = 1090;
    const pageHeight = 592;
    for (let i = 0; i < totalPages; i++) {


      if (i === 0) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { width, height } = page.getSize();
        let logoUrl;
      if (this.customConsumer === 'Onwardfleet') {
       logoUrl = 'assets/images/onward_connected.png';
      }

      else if (this.customConsumer === 'Smallboard') {
        logoUrl = 'assets/images/smallboardcom_logo.png';
       }

       else if (this.customConsumer === 'Siriusxm') {
        logoUrl = 'assets/images/single_connect_logo.png';
       }

       else if (this.customConsumer === 'Revolv') {
        logoUrl = 'assets/images/revolv-logo-dark.png';
       }

      else {
       logoUrl = 'assets/images/logo_developer_workspace.png';
      }

        const logoArrayBuffer = await this.http.get(logoUrl, { responseType: 'arraybuffer' }).toPromise();
        const logoUint8Array = new Uint8Array(logoArrayBuffer);
        const logoImage = await pdfDoc.embedPng(logoUint8Array);
        const logoDims = logoImage.scale(0.5);
        page.drawImage(logoImage, {
          x: 40,
          y: height - 50,
          width: logoDims.width,
          height: logoDims.height,
        });

        // Add watermark
        let watermarkText: string;

        if (this.customConsumer === 'Onwardfleet') {
          watermarkText = 'Onward Connected';
        }

        else if (this.customConsumer === 'Smallboard') {
          watermarkText = 'Smallboard';
         }

         else if (this.customConsumer === 'Siriusxm') {
          watermarkText = 'SiriusXM Connect';
         }

         else if (this.customConsumer === 'Revolv') {
          watermarkText = '';
         }


        else {
          watermarkText = 'CerebrumX Workspace';
        }
        page.drawText(watermarkText, {
          x: 220,
          y: 60,
          size: 60,
          rotate: degrees(45),
          color: rgb(0.8, 0.8, 0.8),
        });

        const headingText = 'Bulk VIN Eligibility Report';
        page.drawText(headingText, {
          x: 320,
          y: height - 60,
          size: 16,
          color: rgb(0, 0, 0),
        });
        const createdOnText = `Created on: ${this.formattedDate}, ${this.formattedTime}`;
        page.drawText(createdOnText,
          {
            x: 50,
            y: height - 100,
            size: 11,
            color: rgb(0, 0, 0),
          });
        const createdOntextFile = `File Name: ${id}`;
        page.drawText(createdOntextFile, {
          x: 50,
          y: height - 120,
          size: 11,
          color: rgb(0, 0, 0),
        });
        const headingtextSummary = 'Summary';
        page.drawText(headingtextSummary, {
          x: 500,
          y: height - 140,
          size: 16,
          color: rgb(0, 0, 0),
        });
        const invalidVinCountss = this.invalidVinCounts !== null ? this.invalidVinCounts.toString() : '0';
        const duplicateVins = this.duplicateVin !== null ? this.duplicateVin.toString() : '0';
        const nonAddressableVins = this.nonAddressableVin !== null ? this.nonAddressableVin.toString() : '0';
        const oemMakeCounts = this.oemMakeCount !== null ? this.oemMakeCount.toString() : '0';
        const nonComplaintVins = this.nonComplaintVin !== null ? this.nonComplaintVin.toString() : '0';
        const complaintVins = this.complaintVin !== null ? this.complaintVin.toString() : '0';

        let tableData: string[][];

        if (this.customConsumer === 'Onwardfleet') {
          tableData = [
            ['Total VINs uploaded', `${this.totalVinCountUplaoded}`, ''],
            ['Duplicate VINs', `${this.duplicateVin}`, 'VINs with multiple entries'],
            ['Invalid/Incorrect VINs', `${invalidVinCountss}`, 'VINs that are not as per the NHTSA guidelines'],
            ['Non-Addressable VINs by Onward Connected', `${nonAddressableVins}`, 'VINs outside of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Addressable VINs by Onward Connected', `${oemMakeCounts}`, 'VINs part of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Non-Compliant VINs', `${nonComplaintVins}`, 'VINs outside the (Model/Year) compatibility guidelines of the OEMs'],
            ['Compliant VINs', `${complaintVins}`, 'VINs within the compatibility guidelines of the OEMs'],
            ['Eligible VINs', `${this.eligibleVin}`, 'VINs that are connected and eligible for data onboarding'],
          ];
        }
        else if (this.customConsumer === 'Smallboard') {
          tableData = [
            ['Total VINs uploaded', `${this.totalVinCountUplaoded}`, ''],
            ['Duplicate VINs', `${this.duplicateVin}`, 'VINs with multiple entries'],
            ['Invalid/Incorrect VINs', `${invalidVinCountss}`, 'VINs that are not as per the NHTSA guidelines'],
            ['Non-Addressable VINs by Smallboard', `${nonAddressableVins}`, 'VINs outside of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Addressable VINs by Smallboard', `${oemMakeCounts}`, 'VINs part of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Non-Compliant VINs', `${nonComplaintVins}`, 'VINs outside the (Model/Year) compatibility guidelines of the OEMs'],
            ['Compliant VINs', `${complaintVins}`, 'VINs within the compatibility guidelines of the OEMs'],
            ['Eligible VINs', `${this.eligibleVin}`, 'VINs that are connected and eligible for data onboarding'],
          ];
        }
        else if (this.customConsumer === 'Siriusxm') {
          tableData = [
            ['Total VINs uploaded', `${this.totalVinCountUplaoded}`, ''],
            ['Duplicate VINs', `${this.duplicateVin}`, 'VINs with multiple entries'],
            ['Invalid/Incorrect VINs', `${invalidVinCountss}`, 'VINs that are not as per the NHTSA guidelines'],
            ['Non-Addressable VINs by Siriusxm', `${nonAddressableVins}`, 'VINs outside of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Addressable VINs by Siriusxm', `${oemMakeCounts}`, 'VINs part of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Non-Compliant VINs', `${nonComplaintVins}`, 'VINs outside the (Model/Year) compatibility guidelines of the OEMs'],
            ['Compliant VINs', `${complaintVins}`, 'VINs within the compatibility guidelines of the OEMs'],
            ['Eligible VINs', `${this.eligibleVin}`, 'VINs that are connected and eligible for data onboarding'],
          ];
        }
        else if (this.customConsumer === 'Revolv') {
          tableData = [
            ['Total VINs uploaded', `${this.totalVinCountUplaoded}`, ''],
            ['Duplicate VINs', `${this.duplicateVin}`, 'VINs with multiple entries'],
            ['Invalid/Incorrect VINs', `${invalidVinCountss}`, 'VINs that are not as per the NHTSA guidelines'],
            ['Non-Addressable VINs by Revolv', `${nonAddressableVins}`, 'VINs outside of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Addressable VINs by Revolv', `${oemMakeCounts}`, 'VINs part of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Non-Compliant VINs', `${nonComplaintVins}`, 'VINs outside the (Model/Year) compatibility guidelines of the OEMs'],
            ['Compliant VINs', `${complaintVins}`, 'VINs within the compatibility guidelines of the OEMs'],
            ['Eligible VINs', `${this.eligibleVin}`, 'VINs that are connected and eligible for data onboarding'],
          ];
        }
        else {
          tableData = [
            ['Total VINs uploaded', `${this.totalVinCountUplaoded}`, ''],
            ['Duplicate VINs', `${this.duplicateVin}`, 'VINs with multiple entries'],
            ['Invalid/Incorrect VINs', `${invalidVinCountss}`, 'VINs that are not as per the NHTSA guidelines'],
            ['Non-Addressable VINs by CerebrumX', `${nonAddressableVins}`, 'VINs outside of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Addressable VINs by CerebrumX', `${oemMakeCounts}`, 'VINs part of Ford Pro, GM, Stellantis, Toyota & Tesla'],
            ['Non-Compliant VINs', `${nonComplaintVins}`, 'VINs outside the (Model/Year) compatibility guidelines of the OEMs'],
            ['Compliant VINs', `${complaintVins}`, 'VINs within the compatibility guidelines of the OEMs'],
            ['Eligible VINs', `${this.eligibleVin}`, 'VINs that are connected and eligible for data onboarding'],
          ];
        }


        drawTable(40, height - 180, tableData, page);
        const headingtextVinSplit = 'OEM Split';
        page.drawText(headingtextVinSplit, {
          x: 500,
          y: height - 380,
          size: 16,
          color: rgb(0, 0, 0),
        });
        const oemDataTable = [
          ['OEM', 'Compliant VINs', 'Eligible VINs'],
        ];
        this.dataOem.forEach((oem: any) => {
          oemDataTable.push([oem.cxMake, oem.compliantVinCount.toString(), oem.eligibilityVinCount.toString()]);
        });
        oemDataTable.push([
          'Total',
          this.complaintVin.toString(),
          this.eligibleVin.toString(),
        ]);
        drawTableNew(40, height - 420, oemDataTable, page);

      }
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const { width, height } = page.getSize();
      let logoUrl
      if (this.customConsumer === 'Onwardfleet') {
        logoUrl = 'assets/images/onward_connected.png';
       }

       else if (this.customConsumer === 'Smallboard') {
        logoUrl = 'assets/images/smallboardcom_logo.png';
       }

       else if (this.customConsumer === 'Siriusxm') {
        logoUrl = 'assets/images/single_connect_logo.png';
       }

       else if (this.customConsumer === 'Revolv') {
        logoUrl = 'assets/images/revolv-logo-dark.png';
       }

       else {
        logoUrl = 'assets/images/logo_developer_workspace.png';
       }
      const logoArrayBuffer = await this.http.get(logoUrl, { responseType: 'arraybuffer' }).toPromise();
      const logoUint8Array = new Uint8Array(logoArrayBuffer);
      const logoImage = await pdfDoc.embedPng(logoUint8Array);
      const logoDims = logoImage.scale(0.5);
      page.drawImage(logoImage, {
        x: 40,
        y: height - 50,
        width: logoDims.width,
        height: logoDims.height,
      });

      // Add watermark
      let watermarkText: string;
      if (this.customConsumer === 'Onwardfleet') {
        watermarkText = 'Onward Connected';
      }

      else if (this.customConsumer === 'Smallboard') {
        watermarkText = 'Smallboard';
       }

       else if (this.customConsumer === 'Siriusxm') {
        watermarkText = 'SiriusXM Connect';
       }

       else if (this.customConsumer === 'Revolv') {
        watermarkText = '';
       }

      else {
        watermarkText = 'CerebrumX Workspace';
      }
      page.drawText(watermarkText, {
        x: 220,
        y: 60,
        size: 60,
        rotate: degrees(45),
        color: rgb(0.8, 0.8, 0.8),
      });
      // else {
      drawRow(50, height - 80, header.map((text, index) => ({ text: index === 0 ? text.toUpperCase() : capitalizeFirstLetter(text), size: 7, color: rgb(0, 0, 0) })), 10, page);
      const startY = height - 100;
      const startX = 50;
      const lineHeight = 16;
      const linesPerPage = Math.floor((height));
      const startIdx = i * MAX_ROWS_PER_PAGE;
      const endIdx = Math.min(startIdx + MAX_ROWS_PER_PAGE, csv.length);
      const pageData = pagesData[i];
      const cellWidth = (width - 2 * startX) / header.length;
      const rowsPerPage = 27 // Number of rows per page
      const borderWidth = 1; // Width of the border
      const textMarginY = (lineHeight - 7) / 2;
      const marginLeft = 5;

      for (let j = 0; j < rowsPerPage && startIdx + j < endIdx; j++) {
        const line = pageData[j].split(',');
        for (let k = 0; k < line.length; k++) {
          let text = k === 0 ? line[k].toUpperCase() : capitalizeFirstLetter(line[k]);
          text = text.replace(/"/g, '');
          const textX = startX + k * cellWidth + marginLeft;
          const textY = startY - j * lineHeight + textMarginY;
          const rectX = startX + k * cellWidth;
          const rectY = startY - j * lineHeight;
          const rectWidth = cellWidth;
          const rectHeight = lineHeight;
          page.drawRectangle({
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight,
            borderColor: rgb(0, 0, 0), // Border color (black)
            borderWidth: borderWidth, // Border width
          });
          page.drawText(text, {
            x: textX,
            y: textY,
            size: 7.6,
            color: rgb(0, 0, 0),
          });
        }
      }

      function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }



      if (i == totalPages - 1) {
        // Add copyright footer
        let copyrightText: string
        if (this.customConsumer === 'Onwardfleet') {
          copyrightText = 'Copyright © 2024 Onward Connected. All rights reserved.';
         }

         else if (this.customConsumer === 'Smallboard') {
          copyrightText = 'Copyright © 2024 Smallbaord. All rights reserved.';
         }

         else if (this.customConsumer === 'Siriusxm') {
          copyrightText = 'Copyright © 2024 SiriusXM Connect. All rights reserved.';
         }

         else if (this.customConsumer === 'Revolv') {
          copyrightText = 'Copyright © 2024 Revolv. All rights reserved.';
         }

         else {
          copyrightText = 'Copyright © 2024 CerebrumX Labs Inc. All rights reserved.';
         }
        page.drawText(copyrightText, {
          x: 270,
          y: 20,
          size: 12,
          color: rgb(0.5, 0.5, 0.5),
        });
        // Saving the PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

        // Saving the PDF file
        if (item == "entrollment_report") {
          saveAs(pdfBlob, "entrollment_report.pdf");
        }
        if (item == "VIN_Eligibility") {
          saveAs(pdfBlob, "VIN_Eligibility.pdf");
        }
      }
    }


  }

  getHistoryData(id: string) {
    this.subscription$.add(
      this._vehicleService.gettData(id).subscribe((res: any) => {
        this.reports = res
        this.invalidCounts = res?.invalidVinCount
        this.pending = this.reports.pendingCount
        if (res && res.oemVinsReport) {
          this.oemData = res.oemVinsReport;
          this.invalidVinCount = res.invalidVinCount
        }
        else {
          this.oemData = [];
        }
        this.chartShow(res.oemVinsReport);
        this.chartprogress(res.oemVinsReport)
      }, err => {
      }))

  }

  vinUplaod(form) {
    if (this.data.length > 5000) {
      this.appService.openSnackBar("It seems like you've exceeded the maximum limit for VINs requested. Please upload a file with maximum 5000 VINs.", 'Error');
      this.submit = false;
      this.fileName = ''
      this.checkStatus = false;
      return; // Prevent further execution
    }
    this.totalVinCountUplaoded = 0;
    this.duplicateVin = 0;
    this.invalidVinCounts = 0;
    this.nonAddressableVin = 0;
    this.oemMakeCount = 0;
    this.nonComplaintVin = 0;
    this.complaintVin = 0;
    this.eligibleVin = 0;
    this.scrollToTarget();
    this.submitBtn = true;
    this.dataform = false;
    this.dataHideShow = true;
    this.dataHideShowMore = false;
    this.uploadIconClass = true;
    let data = [];
    let modifiedCSVData = this.data.map((element, index) => {
      let processedVin = element.vin ? String(element.vin).trim() : '';

      // Check if the VIN is blank, all numbers, or not within the valid length range
      const isBlank = !processedVin;
      const isAllNumbers = /^\d+$/.test(processedVin);
      const isInvalidLength = processedVin.length < 16 || processedVin.length > 17;

      if (isBlank || (isAllNumbers && isInvalidLength)) {
        data.push({ "vin": processedVin });
        return { ...element, error: 'Invalid VIN, please input correct VIN' };
      } else if (this.isValidVIN(processedVin)) {
        data.push({ "vin": processedVin });
        return { ...element, error: '' };
      } else {
        data.push({ "vin": processedVin });
        return { ...element, error: 'Invalid VIN, please input correct VIN' };
      }
    });
    let headerRow = {};
    let modifiedData = [];
    data.forEach(element => {
      let row = {};
      Object.keys(element).forEach(key => {
        row[key.toLowerCase()] = element[key];
        headerRow[key.toLowerCase()] = key.toLowerCase(); // Change here
      });
      modifiedData.push(row);
    });
    let bulkData = {
      'name': form.description,
      "vinStateCountryList": data ? modifiedData : ''
    };
    this.donutchart2 = null

    this.subscription$.add(
      this._vehicleService.bulkvinUpload(bulkData).subscribe(
        (res: any) => {
          this.vinData = res;
          this.uploadedDate = res?.submissionTime
          this.vinDataMain = res.reportId;
          this.selectedId = res.reportId;
          this.dateGenerated = res.completionTime
          this.toastr.success(res.reportId, "File successfully uploaded.");
          this.uplodMainBox = true;
          this.submit = false;
          this.checkStatus = true;
          this.getHistoryData(res.reportId);
          this.setUpIntervalData()
          this.cdr.detectChanges();
          this.uploadSuccessMessage = "File Successfully Submitted";
          setTimeout(() => {
            ;
            // Set the success message
            this.uploadSuccessMessage = ''
            this.uplodMainBox = true;
          }, 8000);
          this.summaryCollection();
          // this.refreshEligibleVin()
        },
        err => {
          this.appService.openSnackBar(err?.error?.apierror?.subErrors?.message, 'Error in file')
          this.submit = false;
          this.checkStatus = false;
          ;

        }
      )
    );

    this.changeBoxAndHeading()
    this.fileSubmitted = true;
    this.enrollMentCheckForm.reset();
    this.bulkEnrollmentForm.reset();
    this.vinstatus = false;
    this.fileName = "";
    this.IsDisabled = true;
    // this.refreshSection.nativeElement.innerHTML = this.refreshSection.nativeElement.innerHTML;
  }

  scrollToTarget() {
    const targetElement = this.ElementRef.nativeElement.querySelector('#scrollTarget');
    if (targetElement) {
      const boundingRect = targetElement.getBoundingClientRect();
      const yPosition = boundingRect.top + window.scrollY;
      targetElement.scrollIntoView({ top: yPosition - 400, behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }

  refreshStatusSection() {
    // Access the native element and reload its content here
    const statusSectionElement: HTMLElement = this.statusSectionRef.nativeElement;
    // For example, you can reset the status variables or fetch updated data
  }
  isValidVIN(vin: string): boolean {
    return vin && vin.length === 17;
  }

  showInvalidVINPopup(invalidVINs: any[]): void {
    let errorMessage = "Invalid VINs detected in the CSV file. Please correct and try again.<br>";
    this.toastr.error(errorMessage, "Invalid VIN 1212, please input correct VIN");
  }

  filterBulkDataById(id: any) {
    this.filteredBulkData = this.bulkData.filter(item => item.id === id);
  }
  formattedDate: string = '--';
  formattedTime: string = '--';

  getBulkdata() {
    this.loading = false;

    this.subscription$.add(
      this._vehicleService.getBulk().subscribe((res: any) => {
        this.bulkData = res;

        // Sort descending by reportGenerateDate
        this.bulkData.sort((a, b) => {
          const dateA = new Date(a.reportGenerateDate);
          const dateB = new Date(b.reportGenerateDate);
          return dateB.getTime() - dateA.getTime();
        });

        // Prepare filtered data
        this.filteredBulkData = this.bulkData.map((data: any) => {
          return {
            id: data.id,
            reportGenerateDate: data.reportGenerationDate
          };
        });

        // Assign first item's values
        this.selectedId = this.bulkData[0]?.id;
        this.status = this.bulkData[0]?.state;
        this.reportGeneratedDate = this.bulkData[0]?.reportGenerationDate;
          if (this.reportGeneratedDate) {
          const momentObj = moment.utc(this.reportGeneratedDate).tz(this.selectedTimezone);
          this.formattedDate = momentObj.format('MMM D, YYYY');
          this.formattedTime = momentObj.format('HH:mm');
        } else {
          this.formattedDate = '--';
          this.formattedTime = '--';
        }

        this.loading = true;
        this.setupInterval();

      }, err => {
        // handle error if needed
      })
    );
  }


  downloadSamples() {
    var link = document.createElement("a");
    link.href = 'assets/data/ELIGIBILITY-CHECK1.csv';
    link.click();
  }

  vinCheck(vineligibilityModel: any) {
    this.fileName = null
    this.modalService.open(vineligibilityModel, { size: 'lg', centered: true });
  }

  ngOnDestroy(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    this.subscription$.unsubscribe();
    clearInterval(this.interval);
  }


  bulkModel(bulkVinCheckModel: any) {
    this.getBulkdata();
   this.dataNew = true;
    this.modalService.open(bulkVinCheckModel, { size: 'xl', centered: true });

  }

  downloadFile(data: any) {
    const replacer = (key, value) => value === null ? 'N/A' : value; // specify how you want to handle null values here
    const header = ['vin','make','model','trim','year','eligibilityStatus', 'validationFailureReason','action','serviceCodes', 'vehicleFleetType'];

    let csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    let csvArray = csv.join('\r\n');

    var blob = new Blob([csvArray], { type: 'text/csv' })
    saveAs(blob, "VIN Eligibility.csv");
  }


  eligibilityStatus(eligibilityDetails: any) {
    this.modalService.open(eligibilityDetails, { size: 'lg', centered: true });
  }

  alertStatus(alertModel: any) {
    this.modalService.open(alertModel, { size: 'sl', centered: true });
  }

  // for fordpro conditions
  async getCondition(alertModel: any) {
    const res: any = await this._vehicleService.getConditions().toPromise();
    this.condition = res;
    if (this.condition[0]?.isEligibleEnable === false) {
      this.alertStatus(alertModel);
    }
  }

}
