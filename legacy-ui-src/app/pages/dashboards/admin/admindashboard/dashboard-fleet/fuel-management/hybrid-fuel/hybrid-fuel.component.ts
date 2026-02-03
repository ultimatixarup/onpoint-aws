import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';


@Component({
  selector: 'app-hybrid-fuel',
  templateUrl: './hybrid-fuel.component.html',
  styleUrls: ['./hybrid-fuel.component.scss']
})
export class HybridFuelComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  @ViewChild('remarks', { static: true }) remarks!: TemplateRef<any>;
  searchByOem: any
  searchByStatus: any
  btnstatus: boolean = false
  searchText: string
  sortByStatus: boolean = false;
  searchFleets: String
  selectedFailureReason: string | null = null;
  pageSize = 40
  page: number = 1
  user: any;
  multiRoles: any;
  customConsumer: any;
  loginUser: any;
  oem: string[];
  allOem: string[]
  selectedPeriod: any;
  manageVehicleList: any[] = [];
  loading: boolean = false
  vins: any = []
  AddFleetIdEnroll: any;
  consumerData: any;
  pageNumber: number = 1;
  pageCount: number = 40
  totalPages: any;
  pages: any;
  temp: any[];
  searchByConsumer: any
  fleetList: any;
  fleetIdData: null;
  activeVehicless: any;
  mileDriven: any;
  tripData: any;
  isAscendings = true;
  totalTripsDetails: any;
  displayVehicles: any[];
  totalDistance: any;
  totalTripCounts: any;
  manageList: number;
  totalVinCount: number;
  fleetSumamryTotalData: any;
  isLoading: boolean = false;
  fleetIdValueNew: any;
  isDataNotFound: boolean = false;
  totalFuelConsumedCost: any;
  totalFuelConsumed: any;
  totalTimePeriods:any;
  totalMileage:any;
  avgFuelCost:any
  isloading2:boolean = false;
  timePeriods = [
    // { label: 'Till Date', value: 'tilldate' },
    { label: 'Today', value: 'today' },
    { label: 'Current Week', value: 'weekly' },
    { label: 'Current Month', value: 'monthly' },
    { label: 'Previous Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'customRange' },
  ];
  constructor(private modalService: NgbModal, private _vehicleService: TaxonomyService, private route: ActivatedRoute, private router: Router, private spinner: NgxSpinnerService,  public http: HttpClient) {
    this.route.queryParams.subscribe(params => {
      this.searchByConsumer = params['consumer'];
    });
    this.route.queryParams.subscribe(params => {
      if (params) {
        this.searchFleets = params['fleetId'];
        this.AddFleetIdEnroll = params['fleetId'] ? params['fleetId'] : '';
      }
    });
  }

  ngOnInit() {

    this.getVehicle(this.page, this.pageCount,)
    this.showRole()
    this.getlistStatus()
    this.getAllProvider()
    this.getAllProviderConsumer()
    this.selectConsumerFleetId()
    //this.fleetSummaryDownloadReport()
    this.selectedPeriod = 'tilldate';
    this.onTimePeriodChangeData(this.selectedPeriod);
    if (!this.searchByConsumer) {
      this.searchByConsumer = 'All';
    }
  }
  // Declartion for Role
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
  // Declartion for Role end
  selectPage(val) {
    this.getVehicle(this.page, val)
  }
  selectPages(val) {
    if (val != '...') {
      this.pageNumber = val
      this.getVehicle(val)
      const breadcrumbElement = document.querySelector('.page-content');
      if (breadcrumbElement) {
        breadcrumbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
      }
    }
  }
  async getlistStatus() {
    let a: any
    await this._vehicleService.getstatusList().subscribe((res: any) => {
      this.consumerData = []
      res.filter((val) => {
        let item = val.toLowerCase().replace(/_/g, " ");
        let status = item.replace(/^(.)|\s+(.)/g, c => c.toUpperCase());
        if (status === 'Active' || status === 'Pending' || status === 'Failed' || status === 'Deactivation Pending' || status === 'Deactivation Failed') {
          this.consumerData.push({ name: status, value: val });
        }
        this.consumerData.sort((a: any, b: any) => {
          if (a.name > b.name) {
            return 1;
          } else if (a.name < b.name) {
            return -1;
          } else {
            return 0;
          }
        });
      })
    })
  }
  // UCT TO CDT Time conversion
  convertToCDT(dateTime: string): string {
    if (!dateTime) return '';
    const utcDateTime = new Date(dateTime);
    const cdtOffset = -5 * 60;
    const cdtDateTime = new Date(utcDateTime.getTime() + (cdtOffset * 60 * 1000));
    cdtDateTime.setMinutes(cdtDateTime.getMinutes());
    const cdtYear = cdtDateTime.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const cdtMonth = monthNames[cdtDateTime.getMonth()];
    const cdtDay = cdtDateTime.getDate().toString().padStart(2, '0');
    const cdtHours = cdtDateTime.getHours().toString().padStart(2, '0');
    const cdtMinutes = cdtDateTime.getMinutes().toString().padStart(2, '0');
    const cdtSeconds = cdtDateTime.getSeconds().toString().padStart(2, '0');
    return `${cdtMonth} ${cdtDay},${cdtYear} ${cdtHours}:${cdtMinutes}`;
  }

//   convertToCDT(dateTime: string): string {
//     if (!dateTime) return '';
//     const utcDateTime = new Date(dateTime);

//     // Get the user's local time zone
//     const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

//     // Convert UTC to local time string
//     const localDateTime = utcDateTime.toLocaleString('en-US', { timeZone: userTimeZone });

//     // Create a new Date object from the local time string
//     const localDate = new Date(localDateTime);

//     // Format the date components
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
//     const localMonth = monthNames[localDate.getMonth()];
//     const localDay = localDate.getDate().toString().padStart(2, '0');
//     const localHours = localDate.getHours().toString().padStart(2, '0');
//     const localMinutes = localDate.getMinutes().toString().padStart(2, '0');
//     const localSeconds = localDate.getSeconds().toString().padStart(2, '0');

//     // Return the formatted date string (for example: "Jan 05, 2024 14:30:00")
//     return `${localMonth} ${localDay}, ${localDate.getFullYear()} ${localHours}:${localMinutes}:${localSeconds}`;
// }


  // UCT TO CDT Time conversion end
  // fleet Summary data
  // fleetSummaryDownloadReport() {
  //   this.isLoading = true; // Set loading state to true at the start
  //   this.subscription$.add(
  //     this._vehicleService
  //       .downloadReportFleetSummary(this.selectedPeriod, this.searchByConsumer, this.fleetIdData)
  //       .subscribe(
  //         (res: any) => {
  //           this.isLoading = false; // Remove loading state when API call completes
  //           this.isDataNotFound = res?.status === 'UNPROCESSABLE_ENTITY' && res?.message === 'Data Not Found';

  //           if (this.isDataNotFound) {
  //             // Set all fields to 0 when no data is found
  //             this.fleetSumamryTotalData = {
  //               totalActiveVehicles: 0,
  //               totalDistanceTravelled: 0,
  //               totalTripsTaken: 0,
  //               totalFuelConsumed: 0,
  //             };
  //           } else {
  //             // Set fields based on the response, or default to 0 if not present
  //             this.fleetSumamryTotalData = {
  //               totalActiveVehicles: res.fleetLevelStats?.totalActiveVehicles || 0,
  //               totalDistanceTravelled: res.fleetLevelStats?.totalDistanceTravelled || 0,
  //               totalTripsTaken: res.fleetLevelStats?.totalTripsTaken || 0,
  //               totalFuelConsumed: res.fleetLevelStats?.totalFuelConsumed || 0,
  //             };
  //           }
  //         },
  //         (error) => {
  //           this.isLoading = false; // Remove loading state on error
  //           console.error('Error fetching data:', error);
  //           this.isDataNotFound = true;
  //           // Set all fields to 0 on error
  //           this.fleetSumamryTotalData = {
  //             totalActiveVehicles: 0,
  //             totalDistanceTravelled: 0,
  //             totalTripsTaken: 0,
  //             totalFuelConsumed: 0,
  //           };
  //         }
  //       )
  //   );
  // }
  // fleet Summary data end
  // VIN Summary function
  vinSummary(selectedVin: string, selectedOem: string): void {
    this.spinner.show()
    this._vehicleService.eligibilityCheck(selectedVin).subscribe((data: any) => {
      this.router.navigate(['/adlp/admin/manageVehicle/vinSummary'], {
        queryParams: { vin: selectedVin, provider: selectedOem, data: JSON.stringify(data) }
      });
      this.spinner.hide()
    }, (error: any) => {
    });
  }
  // VIN Summary function end
  // VIN History function
  viewMore(selectedVin: string, selectedOem: string): void {
    this.spinner.show()
    this._vehicleService.eligibilityCheck(selectedVin).subscribe((data: any) => {
      this.router.navigate(['/adlp/admin/manageVehicle/vinHistory'], {
        queryParams: { vin: selectedVin, provider: selectedOem, data: JSON.stringify(data) }
      });
      this.spinner.hide()
    }, (error: any) => {
    });
  }
  // VIN History function end
  // OEM Sorting
  sortByProvider() {
    if (this.isAscendings) {
      // Sort the data in ascending order
      this.manageVehicleList.sort((a, b) => {
        const nameA = a.provider.toUpperCase(); // Convert to uppercase for case-insensitive comparison
        const nameB = b.provider.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
    } else {
      // Sort the data in descending order
      this.manageVehicleList.sort((a, b) => {
        const nameA = a.provider.toUpperCase(); // Convert to uppercase for case-insensitive comparison
        const nameB = b.provider.toUpperCase();
        if (nameA < nameB) {
          return 1;
        }
        if (nameA > nameB) {
          return -1;
        }
        return 0;
      });
    }

    // Toggle the sorting direction for the next click
    this.isAscendings = !this.isAscendings;
  }
  // OEM Sorting end
  // failure info
  openRemarkModal(vehicle: any) {
    this.selectedFailureReason = vehicle.failureReason;
    this.modalService.open(this.remarks, { size: 'sm', centered: true });
  }
  // failure info end
  // Table data
  getVehicle(page: number, pageCount?: any) {
    this.spinner.show();
    this.loading = false;
    if (pageCount) { this.pageCount = pageCount; }
    this._vehicleService.getConsumerDataLists(page, this.pageCount, this.searchText, this.searchByConsumer, this.fleetIdData, this.searchByOem, this.sortByStatus).subscribe(
      (res: any) => {
        this.manageVehicleList = res.content.map((vehicle: any) => ({
          ...vehicle,
          vehicleName: this.generateRandomVehicleName(), // Add random vehicle name
          connectionType: this.generateRandomConnectionType(), // Add random connection type
        }));
        this.totalPages = res.totalPages;
        this.getPagination(page);
        this.temp = [...this.manageVehicleList];
        this.vins = this.manageVehicleList.map(res => res.vin);
        this.oem = this.manageVehicleList.map(res => res.provider);
        this.oem.sort((a: any, b: any) => (a > b ? 1 : a < b ? -1 : 0));
        this.oem = [...new Set(this.oem)];
        this.loading = true;
        this.spinner.hide();
      },
      (err => {
        this.loading = true;
        this.spinner.hide();
      })
    );
  }
  // Generate a random vehicle name
generateRandomVehicleName(): string {
  const vehicleNames = ['Corolla', 'Camry', 'Rav4', '4Runner', 'Tacoma', 'Tundra', 'Highlander', 'Prius'];
  const randomIndex = Math.floor(Math.random() * vehicleNames.length);
  return vehicleNames[randomIndex];
}

// Generate a random connection type
generateRandomConnectionType(): string {
  const connectionTypes = ['OEM Cloud', 'Dongles'];
  const randomIndex = Math.floor(Math.random() * connectionTypes.length);
  return connectionTypes[randomIndex];
}
  // table data end
  clearFleetSelection() {
    this.getVehicle(this.page)
  }
  // filter by consumer
  setSearchByConsumer(value: string): void {
    this.searchByConsumer = value;
  }
  // filter by consumer end
  selectFleetId() {
    this.getVehicle(this.page)
    //this.fleetSummaryDownloadReport()
  }
  selectConsumerFleetId() {
    this.subscription$.add(
      this._vehicleService.getFleetList(this.searchByConsumer).subscribe((res: any) => {
        this.fleetList = res
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        this.fleetIdData = null
      }, err => { })
    )
  }
  getPagination(page) {
    this.pages = []
    for (let i = 1; i <= this.totalPages; i++) {
      if (i < 5 && page < 5) {
        this.pages.push(i)
      }
      else if (i == 5 && page != 5 && page < 6) {
        this.pages.push(i)
        if (this.totalPages > 5) {
          this.pages.push('...')
        }

      } else if (i == this.totalPages && page != i && page != this.totalPages - 4) {
        this.pages.push(i)
      }
      else if (i == this.totalPages && page != i && page != this.totalPages - 3) {
        this.pages.push(i)
      }
      else if (page > 4 && page == i && page < this.totalPages - 3) {
        this.pages.push(1)
        this.pages.push('...')
        this.pages.push(page - 1)
        this.pages.push(page)
        this.pages.push(page + 1)
        this.pages.push('...')
      }
      else if (page > this.totalPages - 4 && this.totalPages != page && i == page) {
        this.pages.push(1)
        this.pages.push('...')
        this.pages.push(this.totalPages - 4)
        this.pages.push(this.totalPages - 3)
        this.pages.push(this.totalPages - 2)
        this.pages.push(this.totalPages - 1)
      } else if (page == i && i == this.totalPages) {
        if (this.totalPages > 5) {
          this.pages.push(1)
          this.pages.push('...')
        }
        this.pages.push(this.totalPages - 4)
        this.pages.push(this.totalPages - 3)
        this.pages.push(this.totalPages - 2)
        this.pages.push(this.totalPages - 1)
        this.pages.push(this.totalPages)
      }
    }
    this.pageNumber = page
  }
  getAllProvider() {
    this.subscription$.add(
      this._vehicleService.oemNewData(this.customConsumer).subscribe((res: any) => {
        this.oem = res[this.customConsumer]
      }, err => {
        this.spinner.hide()
      })
    )
  }
  getAllProviderConsumer() {
    this.subscription$.add(
      this._vehicleService.oemNewData(this.customConsumer).subscribe((res: any) => {
        this.allOem = res[this.customConsumer]
      }, err => {
        this.spinner.hide()
      })
    )
  }
  selectConsumer() {
    this.getVehicle(this.page)
  }
  sortbyDated() {
    this.btnstatus = !this.btnstatus
    this.getVehicle(this.page)
  }
  selectConsumerData(evt) {
    this.getVehicle(this.page)
  }
  ngOnDestroy() {
    if (this.subscription$)
      this.subscription$.unsubscribe()
  }

  selectedTimePeriod: string = '';
  isCardOpen = false;

  openCard() {
    this.isCardOpen = true;
  }

  closeCard() {
    this.isCardOpen = false;
  }
  onTimePeriodChangeData(selectedPeriod: string): void {
    console.log('Selected Period:', selectedPeriod);
    this.selectedTimePeriod = selectedPeriod;
    this.isCardOpen = selectedPeriod === 'customRange'; // When custom range is selected, show custom date input
    this.loadData();  // Load data for the selected time period
  }

  selectedOption: string = 'customRange';
  fromDate: string = '';
  toDate: string = '';
  cards: any[] = []; // Declare cards here to hold the data

  // Handles the selection of the time period and updates the displayed data accordingly
  handleOption(option: string): void {
    this.selectedOption = option;
    this.selectedPeriod = this.timePeriods.find(period => period.value === option)?.value || '';
    this.onTimePeriodChangeData(this.selectedPeriod);
  }

  // Handles the custom date range selection
  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {
    console.log('onDateRangeSelected', dateRange);
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
    const dateDifference = this.calculateDateDifference(this.fromDate, this.toDate);
    // When custom range is selected, update the card values accordingly
    this.updateCardValuesBasedOnRange(this.cards, dateDifference);// Pass the cards to the function
  }
  calculateDateDifference(fromDate: string, toDate: string): any {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffInMs = to.getTime() - from.getTime();

    // Convert milliseconds to days, hours, minutes
    const days = Math.floor(diffInMs / (1000 * 3600 * 24));
    const hours = Math.floor((diffInMs % (1000 * 3600 * 24)) / (1000 * 3600));
    const minutes = Math.floor((diffInMs % (1000 * 3600)) / (1000 * 60));

    return { days, hours, minutes };
  }


  // Updates card values based on the selected date range
  updateCardValues(cards: any[]): void {
    cards.forEach(card => {
      switch (card.title) {
        case 'Total Duration':
          this.totalTimePeriods = card.values[this.selectedTimePeriod] || null;
          break;
        case 'Fuel Consumed':
          this.totalFuelConsumed = card.values[this.selectedTimePeriod] || null;
          this.isDataNotFound = this.totalFuelConsumed === null;
          break;
        case 'Mileage':
          this.totalMileage = card.values[this.selectedTimePeriod] || null;
          break;
        case 'Fuel Cost':
          this.totalFuelConsumedCost = card.values[this.selectedTimePeriod] || null;
          break;
        case 'Avg. Fuel Cost Per Mile':
          this.avgFuelCost = card.values[this.selectedTimePeriod] || null;
          break;
        default:
          break;
      }
    });
  }

  // Update values dynamically for custom range
  updateCardValuesBasedOnRange(cards: any[],dateDifference: any): void {
    console.log('Updating data for custom range', this.fromDate, this.toDate);

    // Example dummy logic for custom range calculation
    const customDuration = this.calculateDurationBasedOnDateDiff(dateDifference);
  const customFuelConsumed = this.calculateFuelConsumedBasedOnDateDiff(dateDifference);
  const customMileage = this.calculateMileageBasedOnDateDiff(dateDifference);
  const customFuelCost = this.calculateFuelCostBasedOnDateDiff(dateDifference);
  const customAvgFuelCost = this.calculateAvgFuelCostBasedOnDateDiff(dateDifference);

    // Update the customRange values in the cards
    cards.forEach(card => {
      switch (card.title) {
        case 'Total Duration':
          card.values['customRange'] = customDuration;
          break;
        case 'Fuel Consumed':
          card.values['customRange'] = customFuelConsumed;
          break;
        case 'Mileage':
          card.values['customRange'] = customMileage;
          break;
        case 'Fuel Cost':
          card.values['customRange'] = customFuelCost;
          break;
        case 'Avg. Fuel Cost Per Mile':
          card.values['customRange'] = customAvgFuelCost;
          break;
        default:
          break;
      }
    });

    // After updating, refresh the view with the updated data
    this.updateCardValues(cards);
  }

  // Dummy calculation methods (replace with actual logic)
  // Calculate duration based on the date difference (e.g., hours:minutes)
calculateDurationBasedOnDateDiff(dateDifference: any): string {
  const totalHours = (dateDifference.days * 24) + dateDifference.hours;
  return `${totalHours}:${dateDifference.minutes}`;
}

// Calculate fuel consumed based on the date difference
calculateFuelConsumedBasedOnDateDiff(dateDifference: any): number {
  // Assuming average consumption per day
  const averageFuelPerDay = 20; // Example: 20 gallons per day
  const totalFuelConsumed = averageFuelPerDay * dateDifference.days + (averageFuelPerDay / 24) * dateDifference.hours;
  return totalFuelConsumed;
}

// Calculate mileage based on the date difference
calculateMileageBasedOnDateDiff(dateDifference: any): number {
  // Assuming average mileage per day
  const averageMileagePerDay = 18; // Example: 18 miles per day
  const totalMileage = averageMileagePerDay * dateDifference.days + (averageMileagePerDay / 24) * dateDifference.hours;
  return totalMileage;
}

// Calculate fuel cost based on the date difference
calculateFuelCostBasedOnDateDiff(dateDifference: any): number {
  // Assuming an average cost per gallon
  const averageCostPerGallon = 3.5; // Example: $3.5 per gallon
  const totalFuelConsumed = this.calculateFuelConsumedBasedOnDateDiff(dateDifference);
  return totalFuelConsumed * averageCostPerGallon;
}

// Calculate average fuel cost per mile based on the date difference
calculateAvgFuelCostBasedOnDateDiff(dateDifference: any): number {
  // Use total fuel cost and mileage to calculate average fuel cost per mile
  const totalFuelCost = this.calculateFuelCostBasedOnDateDiff(dateDifference);
  const totalMileage = this.calculateMileageBasedOnDateDiff(dateDifference);
  return totalFuelCost / totalMileage;
}

  // Load data (API or static file, you can modify this as needed)
  loadData(): void {
    this.http.get('assets/data/sm-fuel-data-dummy.json').subscribe((data: any) => {
      this.timePeriods = data.timePeriods;
      this.cards = data.cards; // Assign the cards from the API to the local cards array
      this.updateCardValues(this.cards); // Ensure the cards are updated when the data is loaded
    });
  }

}
