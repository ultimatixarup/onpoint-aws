import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersRoleService {
  userRoleResourse: any = `${environment.url.BASE_URL}dash-view/role`
  userRole:any;

  constructor(private http: HttpClient) { }

  getUserRole(){
    this.userRole=sessionStorage.getItem('userlogin')
    let params = new HttpParams().set("role",this.userRole);
    return this.http.post(this.userRoleResourse , params);
  }

}

@Injectable({
  providedIn: 'root',
})
export class LocationTypeService {
  private _selectedTypeIds: any[] = [];

  constructor() {
    // Load saved data from local storage when the service is initialized
    const savedTypes = localStorage.getItem('selectedTypeIds');
    this._selectedTypeIds = savedTypes ? JSON.parse(savedTypes) : [];
  }

  get selectedTypeIds(): any[] {
    return this._selectedTypeIds;
  }

  set selectedTypeIds(types: any[]) {
    this._selectedTypeIds = types;

    // Save the selected types to local storage
    localStorage.setItem('selectedTypeIds', JSON.stringify(types));
  }
}


@Injectable({
  providedIn: 'root',
})
export class FleetService {
  private storageKey = 'selectedFleetId'; // Key for storing in localStorage

  setFleetId(fleetId: string) {
    localStorage.setItem(this.storageKey, fleetId); // Save fleetId to localStorage
  }

  getFleetId(): string | null {
    return localStorage.getItem(this.storageKey); // Retrieve fleetId from localStorage
  }
}

@Injectable({
  providedIn: 'root'
})
export class SelectedPeriodService {
  private storageKey = 'selectedPeriod';

  setSelectedPeriod(selectedPeriod: string): void {
   localStorage.setItem(this.storageKey,selectedPeriod)
  }

  getSelectedPeriod(): string | null {
    return localStorage.getItem(this.storageKey);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SelectedLocationService {
  private storageKey = 'selectedLocationPeriod'; // Key for storing in localStorage

  // Store the selected location period (which seems to be a 2D array)
  setSelectedLocationPeriod(locationType: any[][]): void {
    try {
      // Store as stringified JSON
      localStorage.setItem(this.storageKey, JSON.stringify(locationType));
    } catch (error) {
      console.error('Error saving selected location period to localStorage:', error);
    }
  }

  // Retrieve the selected location period from localStorage
  getSelectedLocationPeriod(): any[][] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      // Parse the JSON or return an empty array if not found or invalid
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error parsing selected location period from localStorage:', error);
      return []; // Return empty array if there's a parsing error
    }
  }

}

@Injectable({
  providedIn: 'root'
})
export class TimePeriodService {
  // Using BehaviorSubject to allow components to listen to changes
  private selectedPeriodSubject = new BehaviorSubject<any>(null);
  selectedPeriod$ = this.selectedPeriodSubject.asObservable();

  // Method to set the selected period
  setSelectedPeriod(period: any) {
    this.selectedPeriodSubject.next(period);
  }

  // Method to get the current selected period value
  getSelectedPeriod() {
    return this.selectedPeriodSubject.getValue();
  }
}

@Injectable({
  providedIn: 'root'
})
export class VinService {
  private storageKey = 'selectedVin';

  setSelectedVin(vin: string): void {
    // Store vin in both the variable and localStorage
    localStorage.setItem(this.storageKey, vin);
  }

  getSelectedVin(): string {
    // Retrieve vin from localStorage (even after refresh)
    return localStorage.getItem(this.storageKey) || '';
  }


}

@Injectable({
  providedIn: 'root',
})
export class LocationTypeServices {
  selectedTypeIds: any[] = []; // Holds the selected type IDs
}


@Injectable({ providedIn: 'root' })
export class ConsumerService {
  private selectedConsumerSubject = new BehaviorSubject<string | null>(null);
  selectedConsumer$ = this.selectedConsumerSubject.asObservable();

  setSelectedConsumer(consumer: string | null) {
    this.selectedConsumerSubject.next(consumer);
  }
}

@Injectable({
  providedIn: 'root'
})
export class FleetSelectionService {
  private fleetIdSubject = new BehaviorSubject<number | null>(null);
  fleetId$ = this.fleetIdSubject.asObservable();
  selectFleetId(fleetId: number) {
    this.fleetIdSubject.next(fleetId);
  }
  getSelectedFleetId(): number | null {
    return this.fleetIdSubject.value;
  }
}
