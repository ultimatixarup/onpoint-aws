import { Component, EventEmitter, OnInit, Output, HostListener, ElementRef } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { of } from 'rxjs';
import { catchError, pluck, shareReplay } from 'rxjs/operators';
interface Consumer {
  id: number;
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
  isActive?: boolean; // Add isActive as an optional property
}
@Component({
  selector: 'app-common-consumer',
  templateUrl: './common-consumer.component.html',
  styleUrls: ['./common-consumer.component.scss']
})
export class CommonConsumerComponent implements OnInit {
  consumerList: Consumer[] = [];
  consumer: string = '';
  dateRange: any
  isDropdownOpen = false;
  @Output() consumerChange = new EventEmitter<string>();

  constructor(private dashboardService: TaxonomyService, private eRef: ElementRef) { }
  ngOnInit(): void {
    this.getAllConsumers();
  }
  async getAllConsumers() {
    try {
      const response = await this.dashboardService.getAllConsumers().pipe(pluck('data'), catchError(() => of([])), shareReplay(1)).toPromise();
      const excludedConsumers = new Set(['Slick', 'OneStep', 'Arvind_insurance', 'HD Fleet LLC', 'GEICO', 'Forward thinking GPS', 'Geo Toll', 'Matrack',
        'Geico', 'Test fleet', 'Rockingham', 'Axiom', 'GeoToll',
      ]);
      const activeConsumers = new Set([
        'DPL Telematics','Ecotrack', 'Satrack', 'Guidepoint', 'Onwardfleet', 'Smallboard','GPSInsight'
      ]);
      this.consumerList = (response as Consumer[])
      .filter((item) => item.contract && !excludedConsumers.has(item.name))
      .map((item) => ({
        id: item.id, // Ensure this matches the type definition
        name: item.name,
        startDate: item.contract.startDate,
        isActive: activeConsumers.has(item.name),
        iconColor: activeConsumers.has(item.name) ? 'green' : 'red',
      }));
      this.consumerList.sort((a, b) => {
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
    this.consumerChange.emit(this.consumer);
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }
}
