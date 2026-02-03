import { Component, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toyota-consent',
  templateUrl: './toyota-consent.component.html',
  styleUrls: ['./toyota-consent.component.scss']
})
export class ToyotaConsentComponent implements OnInit {

  subscription$: Subscription = new Subscription();
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  fleetIdValueNew: any;
  constructor() {

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
    if (this.user === 'role_user_fleet') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
    }
  }
  ngOnDestroy() {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }
}
