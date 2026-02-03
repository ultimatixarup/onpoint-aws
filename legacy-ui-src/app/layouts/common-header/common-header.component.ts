import { Component, EventEmitter, OnInit, Output, HostListener, ElementRef } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { of } from 'rxjs';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
import { ConsumerService } from 'src/app/core/services/users-role.service';
interface Consumer {
  id: number;
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
  isActive?: boolean; // Add isActive as an optional property
}
@Component({
  selector: 'app-common-header',
  templateUrl: './common-header.component.html',
  styleUrls: ['./common-header.component.scss']
})
export class CommonHeaderComponent implements OnInit {
  user: any;
  multiRoles: any;
  customConsumer: any;
  fleetIdValueNew: any;
  fleetIdData: any;
  consumerList: any[] = [];
  consumer: string | null = null;
  dateRange: any
  isDropdownOpen = false;
  loginUserDetail: any
  loginUser: any;
  @Output() consumerChange = new EventEmitter<string>();
  constructor(private dashboardService: TaxonomyService, private eRef: ElementRef, private userRoleService: ConsumerService ) { }

  ngOnInit(): void {
    this. showRole()
    this.getAllConsumers();

  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem("userRole"));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem("multiRole"));
    this.loginUserDetail = sessionStorage.getItem('user-token');
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

  async getAllConsumers() {
    try {
      const response = await this.dashboardService.getAllConsumers()
        .pipe(pluck('data'), catchError(() => of([])), shareReplay(1))
        .toPromise();

      const excludedConsumers = new Set(['Slick', 'OneStep', 'Arvind_insurance', 'HD Fleet LLC', 'GEICO', 'Forward thinking GPS', 'Geo Toll', 'Matrack',
        'Geico', 'Test fleet', 'Rockingham', 'Axiom', 'GeoToll']);
      const activeConsumers = new Set([
        'DPL Telematics', 'Ecotrack', 'Satrack', 'Guidepoint', 'Onwardfleet', 'Smallboard', 'GPSInsight'
      ]);

      this.consumerList = (response as any[])
        .filter((item) => item.contract && !excludedConsumers.has(item.name))
        .map((item) => ({
          id: item.id,
          name: item.name,
          startDate: item.contract.startDate,
          isActive: activeConsumers.has(item.name),
        }))
        .sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return a.name.localeCompare(b.name);
        });
    } catch (error) {
      console.error('Error fetching consumers:', error);
    }
  }

    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    }

    selectConsumer(consumerName: string,) {
      this.consumer = consumerName;
      this.userRoleService.setSelectedConsumer(consumerName);
      this.isDropdownOpen = false;
    }
    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-dropdown')) {
        this.isDropdownOpen = false;
      }
    }
}
