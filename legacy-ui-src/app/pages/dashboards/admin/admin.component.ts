import { Component, OnInit,ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})

export class AdminComponent implements OnInit {
  url: string;
  buttonSelected: number = 1;
  buttonSelected1: number = 1;
  buttonSelected2: number = 1;
  telemetreyData: boolean = true;
  driverBehaviourData:boolean = false;
  vehicleHealthbasics:boolean = false;
  basic: boolean = true;
  advance:boolean = false;
  premium:boolean = false;
 advancedTelemetreyData:boolean = true;
 fuelData:boolean = false;
 vehicleHealth:boolean = false;
 adasData:boolean = true;
 CollisionData:boolean = false
 evData:boolean = false;
 safetyData:boolean = false;
 vehicleProfileData:boolean = false;
 tcoData:boolean = false;
  // buttonSelected: number | null = null;
  selectedMenuItem: string | null = null;
  user: any;
  multiRoles: any;
  customConsumer: any;
  constructor(private router: Router,) {}

  ngOnInit() {
    this.showRole();
  }


  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }

  swaggerApi(){
    this.router.navigate(['/adlp/admin/swagger/Fleet'])
  }

  selectMenuItem(item: string) {
    // Toggle the selected state
    this.selectedMenuItem = this.selectedMenuItem === item ? null : item;
  }

  tools(){
    this.router.navigate(['adlp/admin/tools'])
  }



  selectButton(buttonNumber: number): void {
    this.buttonSelected = this.buttonSelected === buttonNumber ? null : buttonNumber;
  }


  selectButton1(buttonNumber1: number): void {
    this.buttonSelected1 = this.buttonSelected1 === buttonNumber1 ? null : buttonNumber1;
  }

  selectButton2(buttonNumber2: number): void {
    this.buttonSelected2 = this.buttonSelected2 === buttonNumber2? null : buttonNumber2;
  }

  telemetrey(){
    this.telemetreyData = true;
    this.driverBehaviourData = false;
    this.vehicleHealthbasics = false
  }

  driverBehaviour(){
    this.telemetreyData = false;
    this.driverBehaviourData = true;
    this.vehicleHealthbasics = false;
  }

  vehicleHealthbasic(){
    this.telemetreyData = false;
    this.driverBehaviourData = false;
    this.vehicleHealthbasics = true;
  }

  advancedTelemetrey(){
    this.advancedTelemetreyData = true;
    this.fuelData = false;
    this.vehicleHealth = false;
  }

  fuel(){
    this.advancedTelemetreyData = false;
    this.fuelData = true;
    this.vehicleHealth = false;
  }

  VehicleHealth(){
    this.advancedTelemetreyData = false;
    this.fuelData = false;
    this.vehicleHealth = true;
  }

  adas(){
    this.adasData = true;
    this.CollisionData = false
    this.evData = false;
    this.safetyData = false;
    this.vehicleProfileData = false;
    this.tcoData = false;
  }

  collision(){
    this.adasData = false;
    this.CollisionData = true
    this.evData = false;
    this.safetyData = false;
    this.vehicleProfileData = false;
    this.tcoData = false;
  }

  ev(){
    this.adasData = false;
    this.CollisionData = false
    this.evData = true;
    this.safetyData = false;
    this.vehicleProfileData = false;
    this.tcoData = false;
  }

  safety(){
    this.adasData = false;
    this.CollisionData = false
    this.evData = false;
    this.safetyData = true;
    this.vehicleProfileData = false;
    this.tcoData = false;
  }

  vehicleProfile(){
    this.adasData = false;
    this.CollisionData = false
    this.evData = false;
    this.safetyData = false;
    this.vehicleProfileData = true;
    this.tcoData = false;
  }

  tco(){
    this.adasData = false;
    this.CollisionData = false
    this.evData = false;
    this.safetyData = false;
    this.vehicleProfileData = false;
    this.tcoData = true;
  }

  basicPackage(){
    this.basic = true;
    this.advance = false;
    this.premium = false;
  }

  advancePackage(){
    this.basic = false;
    this.advance = true;
    this.premium = false;
  }

  premiumPackage(){
    this.basic = false;
    this.advance = false;
    this.premium = true;
  }

  downloadSamples() {
    const link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'assets/00_user-guide.pdf');
    link.setAttribute('download', `fleetApiDownload.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  cxtaxonomy(){
    this.router.navigate(['/adlp/admin/cxtaxonomy'])
  }

  adminPage(){
    this.router.navigate(['/adlp/admin'])
  }

  htmlGenerator(){
    this.router.navigate(['/adlp/admin/htmlgenerator'])
  }

  vehicleApi(){
    this.router.navigate(['/adlp/admin/swagger/Fleet'])
  }

  documents(){
    this.router.navigate(['/adlp/vehicleApi/documents'])
  }

}
