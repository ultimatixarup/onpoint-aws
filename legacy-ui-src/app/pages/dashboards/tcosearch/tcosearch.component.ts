import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, of } from 'rxjs';
import { TaxonomyService } from '../taxonomy.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { filter, pairwise } from 'rxjs/operators';
import { catchError, pluck, shareReplay } from "rxjs/operators";
import { ToastrService } from 'ngx-toastr';
interface VehicleData {
  count: number;
  provider: string;
  model: string;
  primaryFuelType: string;
  make: string;
  vehicleType: string;
  bodyClass: string;
  modelYear: string;
  state: string
}
interface Consumer {
  name: string;
  contract?: {
    startDate?: string; // Adjust type if needed
  };
}

@Component({
  selector: 'app-tcosearch',
  templateUrl: './tcosearch.component.html',
  styleUrls: ['./tcosearch.component.scss']
})
export class TcosearchComponent implements OnInit {
  vinData: any
  consumer: any = 'All'
  providerData: any[];
  provderList: any[];
  fleetSummary: any = []
  subscription$: Subscription = new Subscription()
  details: boolean = false;
  vinList: any;
  fleetList: any;
  isTcoForVinActive: boolean = false;
  fleets: any;
  VINsummary: any;
  providerData1: any;
  isOpen: boolean = false;
  isOpens: boolean = false;
  modelData: any = []
  modelData1: any = []
  yearData: any = [];
  yearData1: any = [];
  consumerList: any[] = [];
  defaultConsumer: string | null = null;
  searchTco: boolean = false
  realFleetData: boolean = true
  previousUrl: any;
  byMakeData: boolean = false;
  byModelData: boolean = false;
  byYearData: boolean = false;
  consumerDetails: any;
  user: any;
  multiRoles: any;
  customConsumer: any;
  allVehicleData: VehicleData[] = []; // Holds the raw API data
  providerList: string[] = [];
  makeList: { make: string, totalCount: number }[] = [];
  modelList: { model: string, totalCount: number }[] = [];
  fuelList: { fuel: string, totalCount: number }[] = [];
  yearList: { year: string, totalCount: number }[] = [];
   stateList: Array<{ state: string }> = [];
   stateIdData: string = '';
  makeCount?: number;
  modelCount?: number;
  yearCount?: number;
  oemData: any = '';
  companyIdData: string = '';
  modelIdData: string = '';
  yearIdData: string = '';
  fuelIdData: string = '';
  totalCount: number = 0;
  selectedProvider: string;
  selectedMake: string;
  selectedModel: string;
  selectedYear: string;
  fuelTypeList: { fuelType: string, totalCount: number }[] = [];

  primaryFuelTypeIdData: string = '';
  fleetIdData: string; // Initialize as needed
  makeIdData: string;  // Initialize as needed
  makeCounts: [string, number][];

  constructor(
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private router: Router,
    private userService: TaxonomyService,
    private toaster: ToastrService
  ) {
    router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      pairwise()
    ).subscribe((x: any) => {
      let url = x[0].urlAfterRedirects;
      this.previousUrl = url?.split('?')[0]
      if (this.previousUrl == '/adlp/dashboards/tcosearch/tcoforfleet') { } else if (this.previousUrl == '/adlp/dashboards/tcosearch/tcoforvin') { } else if (this.previousUrl == '/adlp/dashboards/tcosearch') { } else {
        sessionStorage.removeItem('tcoDetails')
      }
    })

  }


  ngOnInit(): void {
    // this.getAllProvider()
    this.showRole()
    this.getConsumers()
    this.showDetails()
    this.getMakeCount(this.VINsummary)
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };

    if (sessionStorage.getItem('tcoDetails')) {
      let tcoBody = JSON.parse(sessionStorage.getItem('tcoDetails'))
      this.consumer = tcoBody?.consumer
      this.realFleetData = tcoBody?.fleetType
      this.fleetIdData = tcoBody?.fleetId
    }
  }

  viewMore(): void {
    if (this.consumer && this.consumer !== 'All') {
      this.router.navigate(['/adlp/admin/manageVehicle'], { queryParams: { consumer: this.consumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/manageVehicle']);
    }
  }

  async fetchVehicleData() {
    this.spinner.show();
    try {
      const response = await this.userService.getFleetSummaryTCO({ fleetId: this.fleetIdData }).toPromise();
      this.allVehicleData = response as VehicleData[]; // Assert the type to VehicleData[]
      this.providerList = Array.from(new Set(this.allVehicleData.map(data => data.provider)));
    } finally {
      this.spinner.hide();
    }
  }

  onStateChange(event: any) {
    this.getAllData(); // Fetch or filter data based on selected state
  }

  onClear() {
    this.stateIdData = ''; // Reset the selected state
    this.getAllData(); // Optionally refetch or reset data
  }


  getMakeCount(obj: any) {
    this.subscription$.add(
      this.userService.getFleetSummaryTCO(obj).subscribe((res: any) => {
        this.VINsummary = res;

        // Populate stateList without filtering out states
        this.stateList = this.VINsummary.map(item => ({ state: item.state }));

        // Remove duplicates if necessary
        this.stateList = this.stateList.filter((item, index, self) =>
          index === self.findIndex((t) => (
            t.state === item.state
          ))
        );
      })
    );
  }




  async getAllData() {
    if (!this.fleetIdData) {
    this.toaster.error('Please select fleet Id')
      return;
    }
    try {
      let queryParams: any = {
        fleetId: this.fleetIdData
      };

      if (this.oemData) {
        queryParams.provider = this.oemData;
      }
      if (this.companyIdData) {
        queryParams.makeList = this.companyIdData;
      }
      if (this.modelIdData) {
        queryParams.model = this.modelIdData;
      }
      if (this.yearIdData) {
        queryParams.modelYear = this.yearIdData;
      }

      if(this.stateIdData){
        queryParams.state = this.stateIdData;
      }

      const response = await this.userService.getFleetSummaryTCO(queryParams).toPromise();
      this.allVehicleData = response as VehicleData[];
      this.updateDropdownLists();
    } finally {
      this.spinner.hide();
    }
  }

  private updateDropdownLists() {
    // Define maps to organize data
    const providerMakesMap = new Map<string, { count: number, makes: Set<string> }>();
    const makeModelsMap = new Map<string, { count: number, models: Set<string> }>();
    const modelYearsMap = new Map<string, { count: number, years: Set<string> }>();
    const yearFuelTypesMap = new Map<string, { count: number, fuelTypes: Set<string> }>();
    const stateCountMap = new Map<string, { count: number, states: Set<string> }>();
    // Iterate over all vehicle data to organize providers, makes, models, years, and fuel types
    this.allVehicleData.forEach(vehicle => {
      const provider = vehicle.provider;
      const make = vehicle.make;
      const model = vehicle.model;
      const year = vehicle.modelYear;
      const fuelType = vehicle.primaryFuelType;
      const state = vehicle.state;

      if (!providerMakesMap.has(provider)) {
        providerMakesMap.set(provider, { count: 0, makes: new Set<string>() });
      }
      providerMakesMap.get(provider)!.makes.add(make);
      providerMakesMap.get(provider)!.count++;

      if (this.oemData === provider) {
        if (!makeModelsMap.has(make)) {
          makeModelsMap.set(make, { count: 0, models: new Set<string>() });
        }
        makeModelsMap.get(make)!.models.add(model);
        makeModelsMap.get(make)!.count++;

        if (this.companyIdData === make) {
          if (!modelYearsMap.has(model)) {
            modelYearsMap.set(model, { count: 0, years: new Set<string>() });
          }
          modelYearsMap.get(model)!.years.add(year);
          modelYearsMap.get(model)!.count++;

          if (this.modelIdData === model) {
            if (!yearFuelTypesMap.has(year)) {
              yearFuelTypesMap.set(year, { count: 0, fuelTypes: new Set<string>() });
            }
            yearFuelTypesMap.get(year)!.fuelTypes.add(fuelType);
            yearFuelTypesMap.get(year)!.count++;
          }
        }
      }
        // Organize data for states and fuel types
    if (!stateCountMap.has(state)) {
      stateCountMap.set(state, { count: 0, states: new Set<string>() });
    }
    stateCountMap.get(state)!.states.add(state);
    stateCountMap.get(state)!.count++;
    });

    // Update makeList
    this.makeList = Array.from(providerMakesMap.get(this.oemData)?.makes || []).map(make => ({
      make,
      totalCount: [...this.allVehicleData].filter(v => v.provider === this.oemData && v.make === make)
        .reduce((sum, v) => sum + v.count, 0)
    }));

    // Update modelList
    this.modelList = Array.from(makeModelsMap.get(this.companyIdData)?.models || []).map(model => ({
      model,
      totalCount: [...this.allVehicleData].filter(v => v.provider === this.oemData && v.make === this.companyIdData && v.model === model)
        .reduce((sum, v) => sum + v.count, 0)
    }));

    // Update yearList
    this.yearList = Array.from(modelYearsMap.get(this.modelIdData)?.years || []).map(year => ({
      year,
      totalCount: [...this.allVehicleData].filter(v => v.provider === this.oemData && v.make === this.companyIdData && v.model === this.modelIdData && v.modelYear === year)
        .reduce((sum, v) => sum + v.count, 0)
    }));
    this.fuelTypeList = Array.from(yearFuelTypesMap.get(this.yearIdData)?.fuelTypes || []).map(fuelType => ({
      fuelType,
      totalCount: [...this.allVehicleData].filter(v => v.provider === this.oemData && v.make === this.companyIdData && v.model === this.modelIdData && v.modelYear === this.yearIdData && v.primaryFuelType === fuelType)
        .reduce((sum, v) => sum + v.count, 0)
    }));

    this.stateList = Array.from(stateCountMap.get(this.stateIdData)?.states || []).map(state => ({
      state,
      totalCount: [...this.allVehicleData].filter(v => v.provider === this.oemData && v.make === this.companyIdData && v.model === this.modelIdData && v.modelYear === this.yearIdData && v.primaryFuelType === this.fuelIdData && v.state == state)
        .reduce((sum, v) => sum + v.count, 0)
    }));
    this.totalCount = this.allVehicleData.filter(vehicle => {
      const matchesProvider = this.oemData ? vehicle.provider === this.oemData : true;
      const matchesMake = this.companyIdData ? vehicle.make === this.companyIdData : true;
      const matchesModel = this.modelIdData ? vehicle.model === this.modelIdData : true;
      const matchesYear = this.yearIdData ? vehicle.modelYear === this.yearIdData : true;
      const matchesFuelType = this.fuelIdData ? vehicle.primaryFuelType === this.fuelIdData : true;
      const matchesState= this.stateIdData ? vehicle.state === this.stateIdData : true;
      return matchesProvider && matchesMake && matchesModel && matchesYear && matchesFuelType && matchesState;
    }).reduce((sum, vehicle) => sum + vehicle.count, 0);
  }

  getFleetSummaryData() {
    this.getAllData();
  }

  getFLeetList() {
    this.spinner.show()
    this.subscription$.add(
      this.userService.getFleetList(this.consumer).subscribe((res: any) => {
        this.fleetList = res
        this.spinner.hide()
      }, err => { this.spinner.hide() })
    )
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if(this.user != 'admin') {
      this.selectConsumer(this.customConsumer)
    }
  }


  async getConsumers() {
    try {
      // Fetch all consumers
      const response = await this.userService
        .getAllConsumers()
        .pipe(
          pluck("data"),
          catchError(() => of([])),  // Return an empty array on error
          shareReplay(1)
        )
        .toPromise();

      this.consumerList = (response as Consumer[]).filter((item) => item.contract).map((item) => ({
        name: item.name,
        startDate: item.contract.startDate // Include the start date
      }));
      const excludedConsumers = new Set([
        "Slick", "OneStep", "Arvind_insurance", "HD Fleet LLC", "GEICO",
        "Forward thinking GPS", "Geo Toll", "Matrack",
        "Geico", "Test fleet", "Rockingham", "Axiom", "GeoToll"
      ]);

      this.consumerList = this.consumerList.filter(item => !excludedConsumers.has(item.name));

      // Sort consumer names
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
    }
  }

  noLoadData() {
    this.realFleetData = false;
    this.virtualFleet()
    this.virtualProvider()

  }

  largeModal(tcocalculate) {
    this.modalService.open(tcocalculate, { size: 'sm', centered: true });
  }

  tcoforFleet() {
    this.router.navigate(['adlp/dashboards/tcosearch/tcoforfleet'], { queryParams: { fleetId: this.fleetIdData } })
    let tcoBody: any = {
      fleetType: this.realFleetData,
      consumer: this.consumer,
      fleetId: this.fleetIdData
    }
    this.searchTco = true
    sessionStorage.setItem('tcoDetails', JSON.stringify(tcoBody))
  }


  tcoforFleets() {
    this.isTcoForVinActive = false;
    this.router.navigate(['adlp/dashboards/tcosearch/tcoforfleet'], { queryParams: { fleetId: this.fleetIdData} })
    let tcoBody: any = {
      // fleetType: this.realFleetData,
      // consumer: this.defaultConsumer,
      fleetId: ''
    }
    this.searchTco = true
    sessionStorage.setItem('tcoDetails', JSON.stringify(tcoBody))
  }

  tcoforVin() {
    this.router.navigate(['adlp/dashboards/tcosearch/tcoforvin'], { queryParams: { vin: this.vinData, fleetId: this.fleetIdData } })
    let tcoBody: any = {
      fleetType: this.realFleetData,
      consumer: this.consumer,
      fleetId: this.fleetIdData
    }
    this.searchTco = true
    sessionStorage.setItem('tcoDetails', JSON.stringify(tcoBody))
  }

  onTcoForVinClick(tcocalculate: any) {
    // Your logic for calculating TCO for VIN
    this.isTcoForVinActive = true;
    this.largeModal(tcocalculate); // Assuming this is your method
  }

  tcoforVirtual() {
    this.router.navigate(['adlp/dashboards/tcosearch/tcoforvin'], { queryParams: { vin: this.vinData, fleetId: this.fleetIdData} })
    let tcoBody: any = {
      consumer:this.consumer,
      fleetId: this.fleetIdData
    }
    this.searchTco = true
    sessionStorage.setItem('tcoDetails', JSON.stringify(tcoBody))
  }

  resetConsumer(): void {
    this.consumer = null; // Reset the ng-select value to null
  }

  getAllProvider() {
    this.subscription$.add(
      this.userService.getProviderListTCO(this.fleetIdData).subscribe((res: any) => {
        this.modelList = res.modelList
        this.yearList = res.modelYear
        this.provderList = res.providerList
        this.makeList = res.makeList
      }
      ))
  }



  showDetails() {
    if (this.fleetIdData) {
      this.spinner.show()
      this.details = true;
      this.subscription$.add(
        this.userService.getFleetProvider(this.fleetIdData).subscribe((res: any) => {
          this.providerData = res
          this.totalCount = this.providerData.reduce((acc, provider) => acc + provider.count, 0);
          this.providerData = this.providerData.map(res => {
            return { ...res, 'IsOpenMenu': false }
          })
          setTimeout(() => {
            this.spinner.hide()
          }, 1000)
          const obj = { fleetId: this.fleetIdData}; // Replace `this.otherData` with the necessary data for getMakeCount
          this.getMakeCount(obj)
        }))
    } else {
      this.subscription$.add(
        this.userService.getFleetProvider(this.fleetIdData).subscribe((res: any) => {
          this.providerData = res
          this.totalCount = this.providerData.reduce((acc, provider) => acc + provider.count, 0);
          this.providerData = this.providerData.map(res => {
            return { ...res, 'IsOpenMenu': false }
          })
          setTimeout(() => {
            this.spinner.hide()
          }, 1000)
                // Call getMakeCount after fetching provider data

        }))
    }
    this.subscription$.add(
      this.userService.getVINlist( this.consumer,this.fleetIdData).subscribe((res: any) => {
        this.vinList = res?.vins
      }))


  }

  // For Virtual Fleet

  virtualFleet() {
    this.subscription$.add(
      this.userService.getVINlists().subscribe((res: any) => {
        this.vinList = res?.vins
      }))
  }

  virtualProvider() {
    // if(this.fleetIdData) {
    this.spinner.show()
    // this.details = true;
    this.subscription$.add(
      this.userService.getFleetProviders().subscribe((res: any) => {
        this.providerData1 = res
        this.providerData1 = this.providerData1.map(res => {
          return { ...res, 'IsOpenMenu': false }
        })
        setTimeout(() => {
          this.spinner.hide()
        }, 1000)
      }))
  }
  dateRange: any;
  selectConsumer(consumer:string) {
    this.consumer = consumer
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
    if (consumer) {
      this.providerData = null
      this.spinner.show()
      this.subscription$.add(
        this.userService.getFleetList(consumer).subscribe((res: any) => {
          this.fleetList = res
          this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
          this.fleetIdData = null
          this.spinner.hide()

        }, err => { this.spinner.hide() })
      )
    } else {
      this.fleetIdData = null
      this.providerData = null
    }
    this.subscription$.add(
      this.userService.getFleetProviderConsumer(consumer).subscribe((res: any) => {
        this.providerData = res
        this.totalCount = this.providerData.reduce((acc, provider) => acc + provider.count, 0);
      }))

  }

  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  selectOemsProvider(provider) {
    this.spinner.show()
    this.modelData = []
    this.providerData.map(item => {
      if (item.providerName == provider) {
        item.IsOpenMenu = !item.IsOpenMenu
      }
      else {
        item.IsOpenMenu = false
      }
    })
    this.userService.getTcoModelList(this.fleetIdData, provider).subscribe((res: any) => {
      this.modelData = res
      this.modelData = this.modelData.map(item => {
        return { ...item, 'IsOpenChild': false }
      })
      this.spinner.hide()
    }, err => { this.spinner.hide() })
  }

  selectOemsProviders(provider) {
    this.spinner.show()
    this.modelData1 = []
    this.providerData1.map(item => {
      if (item.providerName == provider) {
        item.IsOpenMenu = !item.IsOpenMenu
      }
      else {
        item.IsOpenMenu = false
      }
    })
    this.userService.getTcoModelLists(provider).subscribe((res: any) => {
      this.modelData1 = res
      this.modelData1 = this.modelData1.map(item => {
        return { ...item, 'IsOpenChild': false }
      })
      this.spinner.hide()
    }, err => { this.spinner.hide() })
  }

  selectmodelList(provider, model) {
    this.spinner.show()
    this.yearData = []
    this.modelData.map(item => {
      if (item.model == model) {
        item.IsOpenChild = !item.IsOpenChild
      } else {
        item.IsOpenChild = false
      }
    })
    this.userService.getTcoYearList(this.fleetIdData, provider, model).subscribe((res: any) => {
      this.yearData = res
      this.spinner.hide()
    }, err => { this.spinner.hide() })
  }

  selectmodelLists(provider, model) {
    this.spinner.show()
    this.yearData1 = []
    this.modelData1.map(item => {
      if (item.model == model) {
        item.IsOpenChild = !item.IsOpenChild
      } else {
        item.IsOpenChild = false
      }
    })
    this.userService.getTcoYearLists(provider, model).subscribe((res: any) => {
      this.yearData1 = res
      this.spinner.hide()
    }, err => { this.spinner.hide() })
  }

  byMake(){
    this.byMakeData = true;
  }

  byModel(){
    this.byModelData = true;
  }

  byYear(){
    this.byYearData = true;
  }

  ngOnDestroy() {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    !this.searchTco ? sessionStorage.removeItem('tcoDetails') : true
    // if(this.previousUrl != '/adlp/developer-corner/tcosearch')
  }
  isSidebarHidden = false;
toggleSidebar() {
  this.isSidebarHidden = !this.isSidebarHidden;
}

}
