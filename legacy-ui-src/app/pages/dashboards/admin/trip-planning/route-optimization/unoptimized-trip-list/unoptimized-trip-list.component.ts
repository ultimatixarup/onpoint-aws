import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouteOptimzeService } from 'src/app/pages/dashboards/route-optimize.service';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';

@Component({
  selector: 'app-unoptimized-trip-list',
  templateUrl: './unoptimized-trip-list.component.html',
  styleUrls: ['./unoptimized-trip-list.component.scss']
})
export class UnoptimizedTripListComponent implements OnInit {

  loading: boolean = false;
  trips: any[] = [];
  pageSize: number = 10;
  pageNumber: number = 1;
  totalPages: number = 5;
  pages: any[] = [];
  filters = {
    tripName:  null,
    status: 'UNDER_PLANNED,DRIVER_ASSOCIATED',
    fromDate:  null,
    toDate:  null,
    fleetId: null as number | string | null,
  };
  // Fleet filter state
  fleetList: any[] = [];
  fleetIdData: number | string | null = null;
  user: string = '';
  customConsumer: string = '';
  fleetIdValueNew: string = '';
  selectedFleetDisplay: string = '';

  constructor(
    private router: Router,
    private routeOptimzeService: RouteOptimzeService,
    private dashboardservice: TaxonomyService,
  ) {}

  ngOnInit(): void {
    this.showRole();
    this.fetchTrips(this.pageNumber, this.pageSize);
    this.loadFleets();
  }

  showRole(): void {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if(this.user === 'role_user_fleet'){
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew
    }
  }


  fetchTrips(page: number, size: number): void {
    this.loading = true;
    this.routeOptimzeService.fetchTrips(page - 1, size,this.filters).subscribe(
      (response) => {
        console.log(response);
        this.trips = response.content || [];
        this.totalPages = response.totalPages
        console.log(this.totalPages);
        this.getPagination(this.pageNumber);
        this.loading = false;
      },
      (error) => {
        console.error('Error fetching trips:', error);
        this.loading = false;
      }
    );
  }

  getPagination(page: number): void {
    this.pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      if (i < 5 || i > this.totalPages - 4 || (i >= page - 2 && i <= page + 2)) {
        this.pages.push(i);
      } else if (i === page - 3 || i === page + 3) {
        this.pages.push('...');
      }
    }
  }

  selectPages(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.pageNumber = page;
      this.fetchTrips(page, this.pageSize);
      this.scrollToTop();
    }
  }

  selectPage(size: number): void {
    this.pageSize = size;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  scrollToTop(): void {
    const breadcrumbElement = document.querySelector('.page-content');
    if (breadcrumbElement) {
      breadcrumbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Load fleet list
  loadFleets(consumer?: string | null): void {
    this.dashboardservice.getFleetList(consumer ?? null).subscribe(
      (res: any) => {
        if (Array.isArray(res)) {
          this.fleetList = res.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
        } else {
          const list = (res && (res.data || res.items)) ? (res.data || res.items) : [];
          this.fleetList = Array.isArray(list) ? list.sort((a: any, b: any) => (a.id || 0) - (b.id || 0)) : [];
        }
      },
      (err) => {
        console.error('Error loading fleet list', err);
        this.fleetList = [];
      }
    );
  }

  // Select/clear fleet handlers
  selectFleetId(): void {
    this.filters.fleetId = this.fleetIdData || null;
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  clearFleetSelection(): void {
    this.fleetIdData = null;
    this.filters.fleetId = null;
    this.pageNumber = 1;
    this.fetchTrips(this.pageNumber, this.pageSize);
  }

  confirmDelete(): void {
    // Redirect or show confirmation dialog
    // Example: this.router.navigate(['/adlp/admin/admindashboard/trip-planning/delete']);
  }
  formatStatus(status: string): string {
    if (status === 'DRIVER_ASSOCIATED') {
      return 'Planned Trip';
    }

    return status
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ') // Split the string into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(' '); // Join the words back into a string
  }
}
