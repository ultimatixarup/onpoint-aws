import {Component,OnInit, ElementRef, ViewChild} from "@angular/core";
import { TaxonomyService } from "src/app/pages/dashboards/taxonomy.service";
import { Subscription, of } from "rxjs";
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Router } from "@angular/router";
import { catchError, pluck, shareReplay } from "rxjs/operators";
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dash-cam',
  templateUrl: './dash-cam.component.html',
  styleUrls: ['./dash-cam.component.scss']
})
export class DashCamComponent implements OnInit {
  averageFuelCostPerMile: any;
  avgFuelCost: any;
  averageFuelCost: string;
  user: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  fleetIdValueNew: any;
  consumer: any = "All";
  subscription$: Subscription = new Subscription();
  fleetList: any;
  fleetIdData: any;
  monthData: string = 'monthly';
  consumerList: any;
  selectedConsumerName: string = '';
  selectedConsumer: any;
  contractStartDate: string | null = null;
  token:any;
  iframeSrc: any | undefined;
  pwd = '#t3ve2024@ON'
  @ViewChild('myIframe', { static: false }) iframe: ElementRef;
  iframeSrc1: boolean;
  constructor(
    public router: Router,
    public http: HttpClient,
    private dashboardservice: TaxonomyService,
    private handler : HttpBackend,
    private sanitizer: DomSanitizer
  ) {
  }
dateRange: any
  ngOnInit(): void {
    this.showRole()
    this.getT()
    if(this.user === 'role_consumer_fleet'){
      this.roleConsumerFleet()
    }
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

  async selectConsumer(consumer: string) {
    this.consumer = consumer
    await this.selectFleeIdBasedonConsumer();
    if (this.consumer) {
      const normalizedConsumer = this.consumer.trim().toLowerCase();
      const selected = this.consumerList.find((item) =>
          item.name.trim().toLowerCase() === normalizedConsumer
      );
      if (selected) {
        this.dateRange = this.formatDatedForActive(selected.startDate); // Update the dateRange with the selected consumer's start date
      }
      else {
        this.dateRange = null; // Reset dateRange as no consumer is found
      }
    }
  }

  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }


  selectFleeIdBasedonConsumer() {
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.consumer).subscribe(
        (res: any) => {
          this.fleetList = res;
          this.fleetList = this.fleetList.sort((a, b) => {
            return a.id - b.id;
          });
          this.fleetIdData = null;
          this.monthData = null;
        },
        (err) => {}
      )
    );
  }

  roleConsumerFleet(){
      this.subscription$.add(
        this.dashboardservice.getFleetList(this.customConsumer).subscribe(
          (res: any) => {
            this.fleetList = res;
            if (this.customConsumer === 'Onwardfleet') {
              // Define disallowed fleet IDs
              const disallowedFleetIds = [100549, 100527, 100528, 100606];
              this.fleetList = this.fleetList.filter((fleet: any) =>
                !disallowedFleetIds.includes(fleet.id)
              );
            }
            this.fleetList = this.fleetList.sort((a, b) => {
              return a.id - b.id;
            });
            this.fleetIdData = null;
            this.monthData = null;
          },
          (err) => {}
        )
      );

  }
  selectFleetId() {}

  getT() {
    this.dashboardservice.getLoginToken().subscribe((res:any)=>{
      this.token = res?.accessToken
      this.iframeSrc1 = true
      this.pwd = '#t3ve2024@ON'
      this.iframeSrc=`https://uat.hdfleet.net/hdfleet/ui/login/${this.token}`
      this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.iframeSrc);
    })
  }

  getIframeSrc(tkn): void {
    this.pwd = '#t3ve2024@ON'
    this.token = tkn
  }

  ngOnDestroy() {
    if (this.iframeSrc) {
      URL.revokeObjectURL(this.iframeSrc as string);
    }
  }

  isSidebarHidden = false;
    toggleSidebar() {
      this.isSidebarHidden = !this.isSidebarHidden;
    }

}
