import { HttpClient,HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';
//import { Location } from '../eligibility/models';

@Injectable({
  providedIn: 'root'
})

export class RouteOptimzeService {
    _apiUrl = environment.url.SM_API_URL;

    constructor(private http: HttpClient) { }
    // private locations: Location[] = [
    //   {
    //     id: 2951,
    //     sequence: 0,
    //     name: 'John Doe',
    //     latitude: 40.560500,
    //     longitude: -74.115748,
    //     type: 'START',
    //   },
    //   {
    //     id: 2967,
    //     sequence: 1,
    //     name: 'Steven Clark',
    //     latitude: 40.714671,
    //     longitude: -74.035729,
    //     type: 'DELIVERY',
    //   },
    //   {
    //     id: 2959,
    //     sequence: 2,
    //     name: 'Eric Thompson',
    //     latitude: 40.752012,
    //     longitude: -74.001438,
    //     type: 'DELIVERY',
    //   },
    // ];

    verifyAddresses(addresses: any[]): Observable<any> {
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      const URL = this._apiUrl + '/trip/address/geo-encode';
      return this.http.post(URL, addresses, { headers });
    }

      searchAddresses(addresses: any[]): Observable<any> {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });

        const url = `${this._apiUrl}/trip/address/search`; // Combine base URL with endpoint

        return this.http.post<any>(url, JSON.stringify(addresses), { headers });
      }
      createTrip(payload: any): Observable<any> {
        const headers = new HttpHeaders({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'routing_strategy': 'distance' // Adding the custom header
        });

        return this.http.post<any>(
          `${this._apiUrl}/trip`,  // Use backticks here for string interpolation
          payload,
          { headers }
        );
      }

      getTripData(tripDetailId: string): Observable<any> {
        return this.http.get<any>(`${this._apiUrl}/trip/${tripDetailId}`);
      }

      updateSequence(deliveryLocations: any[],tripDetailId:String): Observable<any> {
        return this.http.put<any>( `${this._apiUrl}/trip/${tripDetailId}/update-sequence`, { deliveryLocations }, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      }

      fetchTrips(
        page: number = 0,
        size: number = 10,
        filters: any = {}
      ): Observable<any> {
        // Base URL
        let url = `${this._apiUrl}/trip/active?page=${page}&size=${size}`;

        // Add query parameters based on provided filters
        const params: string[] = [];

        if (filters.status) {
          params.push(`status=${encodeURIComponent(filters.status)}`);
        }
        if (filters.driverId) {
          params.push(`driverId=${encodeURIComponent(filters.driverId)}`);
        }
        if (filters.tripName) {
          params.push(`tripName=${encodeURIComponent(filters.tripName)}`);
        }
        if (filters.fromDate) {
          params.push(`from=${filters.fromDate}`); // Corrected syntax for adding fromDate
      }
      if (filters.toDate) {
          params.push(`to=${filters.toDate}`); // Corrected syntax for adding toDate
      }
        if (filters.fleetId) {
          params.push(`fleetId=${encodeURIComponent(filters.fleetId)}`);
        }
        if (filters.groupId) {
          params.push(`groupId=${encodeURIComponent(filters.groupId)}`);
        }

        if (params.length > 0) {
          url += '&' + params.join('&');
        }

        // API call
        return this.http.get<any>(url);
      }

      associateVin(tripId: string, vin: string): Observable<any> {
        const url = `${this._apiUrl}/trip/${tripId}/associate-vin/${vin}`;
        const headers = new HttpHeaders({
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });

        return this.http.put<any>(url, { headers });
      }
      deleteTrip(tripId: number) {
        const url = `${this._apiUrl}/trip/${tripId}`;
        return this.http.delete(url, {
          headers: {
            'accept': 'application/json'
          }
        });
      }
      updateTrip(tripId: number, tripData: any): Observable<any> {
        console.log(tripData,"trip date");
        const url = `${this._apiUrl}/trip/${tripId}`;
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          accept: 'application/json',
        });

        return this.http.put(url, tripData, { headers });
      }
      getOptimizedTrip(tripId: number): Observable<any> {
        const url = `${this._apiUrl}/trip/optimize?tripId=${tripId}`;
        const headers = new HttpHeaders({
          'accept': 'application/json',
          'routing_strategy': 'distance'
        });

        return this.http.get(url, { headers });
      }

      // getProofDetails(stopId: string, tripId: string): Observable<any> {
      //   return this.http.get(`${this.baseUrl}/proofs?stopId=${stopId}&tripId=${tripId}`);
      // }
      // update Trip


      // getLiveTrackingLocations(): Observable<Location[]> {
      //   return of(this.locations);
      // }

      // Optional: Add a method to simulate live updates
      // simulateLiveUpdates(): Observable<Location[]> {
      //   return new Observable((observer) => {
      //     setInterval(() => {
      //       // Simulate moving the locations
      //       this.locations.forEach((location) => {
      //         location.latitude += (Math.random() - 0.5) * 0.001; // Randomly change latitude
      //         location.longitude += (Math.random() - 0.5) * 0.001; // Randomly change longitude
      //       });
      //       observer.next(this.locations);
      //     }, 3000); // Update every 3 seconds
      //   });
      // }

      getLiveTracking(consumer?,fleedId?,vin?,colorCode?) {
        let params = new HttpParams();
        if(vin) {
         params= params.append('vin',vin)
        }
        if(consumer) {
          params=params.append('consumer',consumer)
        }
        return this.http.get('https://devedemo-rfsapi.cerebrumx.ai/api/v1/subscribe/1FMCU0G63MUA48999?tripId=FF_64FF868C847F11EF875012657196BBD1'
        )
        //return this.http.get(this._apiUrl+'subscribe/all/once',{params:params})
      }
      getVINListByFleet(fleetId: number, tripStartDate:any): Observable<any> {
        return this.http.get<any>(`${this._apiUrl}/vin/availability?fleetId=${fleetId}&tripDate=${tripStartDate}`);
      }
      getOilChangeAlerts(fleetId?: string): Observable<any> {
        const apiUrl = `${this._apiUrl}/oil-change-alerts`;
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        });

        let params = new HttpParams();
        if (fleetId) {
          params = params.set('fleetId', fleetId);
        }

        return this.http.get(apiUrl, { headers, params });
      }



}
