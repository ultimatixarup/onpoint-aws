import { Component, OnInit, Output, EventEmitter, Inject, } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormGroup } from '@angular/forms';
import jwt_decode from "jwt-decode";
import { AuthenticationService } from '../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { SharedService, SidebarStateService, TimezoneService } from '../user-role/users-role.service';
import { filter } from 'rxjs/operators';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { FleetSelectionService } from 'src/app/core/services/users-role.service';


@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})

export class TopbarComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  selectedType: any;
  passwordChangeForm: FormGroup;
  bulkEnrollmentForm: FormGroup
  loginUserDetail: any
  loginUser: any;
  user: any;
  multiRoles: any;
  userRoleResponse: any;
  data: any = []
  loginResponse: any;
  dataLoginName: any;
  selectUserData: any = []
  vinstatus: boolean;
  eligiblity: any;
  message: string;
  vinId: any;
  fileName: any;
  files: any;
  vinData: any;
  searchId: any
  description: string = ''
  searchName: any = ''
  dataUpload: boolean = true;
  bulkData: any;
  validationVIN: boolean = true
  vinDataMain: any;
  consumerData: any = { opentype: [{ name: 'A***a', value: 'azuga' }, { name: 'I*T', value: 'imt' }, { name: 'R*******M', value: 'rockingham ' }], provider: [{ name: 'S******s', value: 'stellantis' }], admin: [{ name: 'Admin', value: 'admin' }] }
  userDash: any;
  changeRole: boolean;
  IsDisabled: boolean = true
  customConsumer: any;
  enrollMentCheckForm: FormGroup
  loading: boolean = false;
  imageUrl: string
  showTopbarElements = true;
  fleetIds: any;
  dropdownTimezone: string = '';
  selectedTimezone: string = '';
  currentTime: string = '';
  timeZone: string = ''
  fleetList: any;
  fleetIdData: any;
  vinList: any;
  VIN: string;
  therShold: any;
  dataShowThershold: boolean = false;
  timeZoneDetails: any;
  timezones: any[] = []; // Stores all available timezones
  timezonesSelected: any[] = [];
  constructor(public SharedService: SharedService, public sidebarState: SidebarStateService,private timezoneService: TimezoneService,private spinner: NgxSpinnerService, private toastr: ToastrService, private router: Router, private authService: AuthenticationService, private dashboardservice: TaxonomyService, private fleetSelectionService: FleetSelectionService) {
  }
  openMobileMenu: boolean;
  @Output() settingsButtonClicked = new EventEmitter();
  @Output() mobileMenuButtonClicked = new EventEmitter();

  ngOnInit() {
    this.showRole();
    const currentUrlData = this.router.url;
    this.showTopbarElements = !currentUrlData.startsWith('/adlp/admin/admindashboard/chatGPT');
    // Also update on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.showTopbarElements = !url.startsWith('/adlp/admin/admindashboard/chatGPT');
      });
    this.getTimes(); // Load available timezones on component initialization
    this.getNewTimeZone(); // Fetch saved timezone on login
    this.selectConsumers()
    this.spinner.show()
    this.openMobileMenu = false;
    this.loginUserDetail = sessionStorage.getItem('user-token');
    this.decodeToken()
    this.spinner.hide()
    const currentUrl = window.location.href;
     if (this.fleetIdData === '101371' && (currentUrl.includes('onpointsolution.fleettrack.ai') ||
         currentUrl.includes('dev-smallboard.fleettrack.ai'))) {
      this.imageUrl = './assets/images/logo_sr.png';
    } else if  (currentUrl.includes('cerebrumx.fleettrack.ai')) {
      this.imageUrl = './assets/images/logo_main.png';
    }
    else if (currentUrl.includes('onpointsolution.fleettrack.ai')) {
      this.imageUrl = './assets/images/onpointsolution.png';
    }
    else if (currentUrl.includes('dev-smallboard.fleettrack.ai')) {
      this.imageUrl = './assets/images/onpointsolution.png';
    }
    else if (currentUrl.includes('smallboard.fleettrack.ai')) {
      this.imageUrl = './assets/images/onpointsolution.png';
    }
    else if (currentUrl.includes('smallboard-demo.fleettrack.ai')) {
      this.imageUrl = './assets/images/onpointsolution.png';
    }
    else if (currentUrl.includes('guidepoint.fleettrack.ai')) {
      this.imageUrl = './assets/images/guidepoint-logo.png';
    }
    else if (currentUrl.includes('revolv.fleettrack.ai')) {
      this.imageUrl = './assets/images/revol-logo.svg';
    }
    else if (currentUrl.includes('siriusxm.fleettrack.ai')) {
      this.imageUrl = './assets/images/single_connect_logo.png';
    }
    else if (currentUrl.includes('https://dpltelemetics.fleettrack.ai')) {
      this.imageUrl = './assets/images/dpl_logo.png';
    }

    else if (currentUrl.includes('btracking.fleettrack.ai/')) {
      this.imageUrl = './assets/images/btracking-logo.png';
    }
    else if (currentUrl.includes('https://btracking.fleettrack.ai')) {
      this.imageUrl = './assets/images/btracking-logo.png';
    }
    else if (currentUrl.includes('dpltelemetics.fleettrack.ai')) {
      this.imageUrl = './assets/images/dpl_logo.png';
    }
    else if (currentUrl.includes('onwardconnected.fleettrack.ai')) {
      this.imageUrl = './assets/images/onward_connected_logo.svg';
    }
    else if (currentUrl.includes('onwardconnected-demo.fleettrack.ai')) {
      this.imageUrl = './assets/images/onward_connected_logo.svg';
    }
    else if (currentUrl.includes('guidepoint.fleettrack.ai')) {
      this.imageUrl = './assets/images/guidepoint-logo.png';
    }
    else if (currentUrl.includes('assetworks.fleettrack.ai')) {
      this.imageUrl = './assets/images/assetsWork/AssetWorks.png';
    }
    else if (currentUrl.includes('orionfi.fleettrack.ai')) {
      this.imageUrl = './assets/images/orionfi-logo.png';
    }
    else if (currentUrl.includes('ecotrack.fleettrack.ai')) {
      this.imageUrl = './assets/images/logo-1.png';
    }
    else if (currentUrl.includes('gpsinsight.fleettrack.ai')) {
      this.imageUrl = './assets/images/gps_insight.png';
    }
    else if (currentUrl.includes('fleettrack.ai')) {
      this.imageUrl = './assets/images/logo_main.png';
    }
    // else if (currentUrl.includes('localhost')) {
    //   this.imageUrl = './assets/images/logo_sr.png';
    // }
    else {
      this.imageUrl = './assets/images/logo_main.png';
    }
  }
  // All dropdown
  getTimes() {
    this.subscription$.add(
      this.dashboardservice.getTimeZone().subscribe((res: any) => {
        this.timezones = res;

        const savedTimezone = localStorage.getItem('selectedTimezone');
        if (savedTimezone) {
          this.selectedTimezone = savedTimezone;
        } else {
          const systemTz = this.getSystemTimezone();
          const match = this.timezones.find((tz: any) => tz.value === systemTz);
          this.selectedTimezone = match ? match.value : '';
        }

        this.dropdownTimezone = this.selectedTimezone; // Bind selected timezone (value)
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
      })
    );
  }
  // When change dropdown timezone change
  onTimezoneChange(selectedValue: string) {
    this.selectedTimezone = selectedValue;
    this.dropdownTimezone = selectedValue;

    // Find the matching timezone object from list
    const selectedTimezoneObj = this.timezones.find(tz => tz.value === selectedValue);

    if (selectedTimezoneObj) {
      // Save timezone in local storage and service
      this.timezoneService.setTimezone(selectedTimezoneObj.value);
      localStorage.setItem('selectedTimezone', selectedTimezoneObj.value);

      // Now pass BOTH value and label
      const timezoneToSave = {
        value: selectedTimezoneObj.value,
        label: selectedTimezoneObj.label
      };
      this.saveTimezone(timezoneToSave);
    } else {
      console.error('Selected timezone not found in list!');
    }
  }
  // Save selected timezone to backend
  saveTimezone(selectedTimezoneObj: any): void {
    this.dashboardservice.saveTimezone(selectedTimezoneObj).subscribe(
      (response) => {
        this.toastr.success('Timezone saved successfully')
      },
      (error) => {
        console.error('Error saving timezone:', error);
      }
    );
  }
  // Fetch the saved timezone on user login
  getNewTimeZone() {
    this.subscription$.add(
      this.dashboardservice.getTimeZones().subscribe((res: any) => {
        this.timezonesSelected = res;
        const userEmail = res.emailId;
        const userTimezoneValue = res.value;
        const userTimezoneLabel = res.label;
        if (userTimezoneValue) {
          this.selectedTimezone = userTimezoneValue;
          this.dropdownTimezone = userTimezoneValue;
          this.timezoneService.setTimezone(userTimezoneValue);
          localStorage.setItem('selectedTimezone', userTimezoneValue);
        }
      })
    );
  }
  getSystemTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  getTimezoneLabel(tz: string): string {
    switch (tz) {
      case 'America/Los_Angeles':
        return 'Pacific Time';
      case 'America/Chicago':
        return 'Central Time';
      case 'America/Phoenix':
        return 'Mountain Time';
      case 'America/Phoenix':
        return 'Arizona Time';
      case 'America/Anchorage':
        return 'Alaska Time';
      case 'Hawaii Time':
        return 'Hawaii Time';
      default:
        if (tz.startsWith('Asia/')) {
          return 'Asia Time';
        }
        return 'Unknown Timezone';
    }
  }
  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }
  updateTime() {
    const now = new Date();
    const systemTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit',hour12: false });
   if (this.selectedTimezone) {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: this.selectedTimezone,
        hour12: false,
      };
      const timezoneTime = new Intl.DateTimeFormat('en-US', options).format(now);
      this.currentTime = timezoneTime;
    } else {
      this.currentTime = systemTime;
    }
  }
  isMenuCollapsed: boolean = true;
  isMenuExpand: boolean = false;
  toggleMobileMenu(event: Event): void {
    event.preventDefault();

    this.mobileMenuButtonClicked.emit(event);
    this.sidebarState.toggleSidebar();
  }
  toggleMobileMenu1(event: Event): void {
    event.preventDefault();
    this.isMenuExpand = true;
    this.mobileMenuButtonClicked.emit(event);
  }
  fordPro() {
    this.router.navigate(['adlp/admin/vehicleConsent/fordConsent'])
  }
  gm() {
    this.router.navigate(['adlp/admin/vehicleConsent/gmConsent'])
  }
  toyota() {
    this.router.navigate(['adlp/admin/vehicleConsent/toyotaConsent'])
  }
  stellantis() {
    this.router.navigate(['adlp/admin/vehicleConsent/stellantisConsent'])
  }
  logout() {
    let userdata = JSON.parse(this.loginUserDetail);
    let token = userdata.accessToken;
    const logoutToken: any = {
      accessToken: token
    }
    this.authService.logOut(logoutToken);
  }
  // decodeToken() {
  //   var userdetail = JSON.parse(this.loginUserDetail)
  //   if (userdetail)
  //     var token = userdetail.idToken;
  //   this.loginUser = jwt_decode(token);
  //   console.log(this.loginUser, "login user detail");
  // }
  decodeToken() {
  if (!this.loginUserDetail) {
    console.error('loginUserDetail not found');
    return;
  }

  const userdetail = JSON.parse(this.loginUserDetail);
  const token = userdetail?.idToken;

  if (!token) {
    console.error('Token not found');
    return;
  }

  const decoded: any = jwt_decode(token);
  this.loginUser = decoded;

  // ✅ SET fleetIdData
  this.fleetIdData = decoded['custom:fleetId'] || null;
}
  logologout() {
    this.router.navigate(['/']);
  }
  faqSelect() {
    this.router.navigate(['/adlp/admin/frequentlyAsked/frequentlyAsked'])
  }
  selectConsumers() {
    // Retrieve and parse the custom consumers from session storage
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.customConsumer).subscribe((res: any) => {
        this.fleetList = res;
        // Sort the fleetList by id
        this.fleetList.sort((a, b) => a.id - b.id);
        // Update fleetIds if there are any fleets in the list
        if (this.fleetList && this.fleetList.length > 0) {
          this.fleetIds = this.fleetList.map((fleet: any) => fleet.id).join(', ');

          // Set logo ONLY at login time based on user's fleet ID
          // Check if user has only one fleet (non-admin user scenario)
          if (this.fleetList.length === 1) {
            this.fleetIdData = this.fleetList[0].id;
            // Set logo based on the logged-in user's fleet ID at login
          }
        } else {
          // Reset fleetIdData if no fleets
          this.fleetIdData = null;
        }
      }, err => {
        // Handle error
        console.error('Error fetching fleet list:', err);
      })
    );
  }


  onFleetChange() {
    this.SharedService.setFleetId(this.fleetIdData);
    console.log(this.fleetIdData)
    // DO NOT update logo when admin changes fleet in dropdown
  }

  selectFleetId() {
    this.dataShowThershold = true;
    // DO NOT update logo when fleet is selected from dropdown
    if (this.fleetIdData) {
      this.subscription$.add(
        this.dashboardservice.getVINs(this.fleetIdData).subscribe((res: any) => {
          this.vinList = res?.vins
          this.therShold = res?.profiling?.spdLimit
        }, err => {
        })
      )
    }
  }
}
