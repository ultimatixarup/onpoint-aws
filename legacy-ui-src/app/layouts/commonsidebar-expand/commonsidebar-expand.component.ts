import { Component, OnInit, ElementRef  } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router,NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-commonsidebar-expand',
  templateUrl: './commonsidebar-expand.component.html',
  styleUrls: ['./commonsidebar-expand.component.scss']
})
export class CommonsidebarExpandComponent implements OnInit {
  activeSection: string | null = null;
  selectedMenuItem: string | null = null;
  subscription$: Subscription = new Subscription();
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  fleetDetails: any;
  consumer: any = 'All'
  isMenuActive = false;
  activeRoute: string = '';
  activeRoutes: string = ''
  constructor(private elementRef: ElementRef, private router: Router, public http: HttpClient, private dashboardservice: TaxonomyService) {}

  ngOnInit() {
    this.showRole();
    const currentUrl = window.location.pathname;

    if (currentUrl.includes('/safetyCollision') || currentUrl.includes('/safety') || currentUrl.includes('/adasDashboard')) {
      this.expandedSections['safety'] = true;
    }

    if (currentUrl.includes('/Sustainibility/Fuel') || currentUrl.includes('/EV')) {
      this.expandedSections['sustainability'] = true;
    }
  }

  expandedSections: { [key: string]: boolean } = {}; // Object to track expanded sections

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section]; // Toggle section state
  }

  isExpanded(section: string): boolean {
    return !!this.expandedSections[section]; // Return true if section is expanded
  }

  selectMenuItem(item: string) {
    this.selectedMenuItem = this.selectedMenuItem === item ? null : item;
  }


  scrollToSection(sectionId: string): void {
    this.activeSection = sectionId;
    const section = this.elementRef.nativeElement.querySelector(`#${sectionId}`);
    section.scrollIntoView({ behavior: 'smooth' });
  }


  toggleMenu() {
    this.isMenuActive = !this.isMenuActive;
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }

  selectConsumers() {
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.consumer).subscribe((res: any) => {
        this.fleetList = res
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        this.fleetIdData = null
      }, err => { })
    )
  }

  viewMore(): void {
    if (this.consumer && this.consumer !== 'All') {
      this.router.navigate(['/adlp/admin/manageVehicle'], { queryParams: { consumer: this.consumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/manageVehicle']);
    }
  }

}
