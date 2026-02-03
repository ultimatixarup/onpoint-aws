import { HttpClient,HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class TripReportService {
    _apiUrl = environment.url.SM_API_URL;

    constructor(private http: HttpClient) { }

getSystemTripSummary(vin:string,startDate: string, endDate: string, page: number = 0, size: number = 10, fleetId?: string): Observable<any> {

     const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
     let params = new HttpParams()
     .set('startDate', startDate)
     .set('endDate', endDate)
     .set('page', page.toString())
     .set('size', size.toString());

 // Only add `vin` if it is not empty or undefined
      if (vin) {
          params = params.set('vin', vin);
      }

      // Add fleetId if provided
      if (fleetId) {
          params = params.set('fleetId', fleetId);
      }
        return this.http.get<any>(`${this._apiUrl}/trip-summary/by-date-range?`, { headers, params });
      }

      getScheduledTripSummary(vin:string,startDate: string, endDate: string, page: number = 0, size: number = 10, fleetId?: string): Observable<any> {
        console.log(vin,"df");
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        let params = new HttpParams()
        .set('status', 'COMPLETED')
        .set('customStartDate', startDate)
        .set('customEndDate', endDate)
        .set('page', page.toString())
        .set('size', size.toString());

    // Only add `vin` if it is not empty or undefined
         if (vin) {
             params = params.set('vin', vin);
         }

         // Add fleetId if provided
         if (fleetId) {
             params = params.set('fleetId', fleetId);
         }
           return this.http.get<any>(`${this._apiUrl}/scheduled-trips?dateRange=custom_range`, { headers, params });
         }
        // This API fetches one scheduled trip to merge multiple system trips
        getScheduledTripDetails(vin: string, tripId: number, startDate: any, endDate: any): Observable<any> {
          //

          const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

          let params = new HttpParams()
              .set('startDate', startDate)
              .set('endDate', endDate)
              .set('tripId', tripId);

          // Only add VIN if it's valid
          if (vin) {
              params = params.set('vin', vin);
          }

          return this.http.get<any>(`${this._apiUrl}/trip-details`, { headers, params });
      }
      getFuelTripSummary(vin:string,startDate: string, endDate: string, page: number = 0, size: number = 10, fleetId?: string): Observable<any> {
        console.log(vin,"df");
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        let params = new HttpParams()
        .set('customStartDate', startDate)
        .set('customEndDate', endDate)
        .set('page', page.toString())
        .set('size', size.toString());

    // Only add `vin` if it is not empty or undefined
         if (vin) {
             params = params.set('vin', vin);
         }

         // Add fleetId if provided
         if (fleetId) {
             params = params.set('fleetId', fleetId);
         }
           return this.http.get<any>(`${this._apiUrl}/ice-fuel-management?dateRange=custom_range`, { headers, params });
         }
         getEVTripSummary(vin:string,startDate: string, endDate: string, page: number = 0, size: number = 10, fleetId?: string): Observable<any> {
          console.log(vin,"df");
          const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
          let params = new HttpParams()
          .set('customStartDate', startDate)
          .set('customEndDate', endDate)
          .set('page', page.toString())
          .set('size', size.toString());

      // Only add `vin` if it is not empty or undefined
           if (vin) {
               params = params.set('vin', vin);
           }

           // Add fleetId if provided
           if (fleetId) {
               params = params.set('fleetId', fleetId);
           }
             return this.http.get<any>(`${this._apiUrl}/ev-fuel-management?dateRange=custom_range`, { headers, params });
           }

           getSafetyCarDriverSummary(vin:string,startDate: string, endDate: string, page: number = 0, size: number = 10, fleetId?: string): Observable<any> {

            const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
            let params = new HttpParams()
            .set('customStartDate', startDate)
            .set('customEndDate', endDate)
            .set('page', page.toString())
            .set('size', size.toString());

        // Only add `vin` if it is not empty or undefined
             if (vin) {
                 params = params.set('vin', vin);
             }

        // Add fleetId if provided
             if (fleetId) {
                 params = params.set('fleetId', fleetId);
             }

               return this.http.get<any>(`${this._apiUrl}/safety-metrics/vehicle?dateRange=custom_range`, { headers, params });
             }
             getDriverSummary(driverId: string, startDate: string, endDate: string, page: number = 0, size: number = 10): Observable<any> {
              const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

              let params = new HttpParams()
                  .set('customStartDate', startDate)
                  .set('customEndDate', endDate)
                  .set('page', page.toString())
                  .set('size', size.toString());

              // Ensure driverId is included correctly in the URL
              return this.http.get<any>(`${this._apiUrl}/driver-summary/${driverId}?dateRange=custom_range`, { headers, params });
          }

               getReFuelTripSummary(vin:string,startDate: string, endDate: string, page: number = 0, size: number = 10, fleetId?: string): Observable<any> {
                console.log(vin,"df");
                const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
                let params = new HttpParams()
                .set('customStartDate', startDate)
                .set('customEndDate', endDate)
                .set('page', page.toString())
                .set('size', size.toString());

            // Only add `vin` if it is not empty or undefined
                 if (vin) {
                     params = params.set('vin', vin);
                 }

                 // Add fleetId if provided
                 if (fleetId) {
                     params = params.set('fleetId', fleetId);
                 }
                   return this.http.get<any>(`${this._apiUrl}/ice-fuel-refuel-summary?dateRange=custom_range`, { headers, params });
                 }
                 getEvReFuelTripSummary(vin:string,startDate: string, endDate: string, page: number = 0, size: number = 10): Observable<any> {

                  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
                  let params = new HttpParams()
                  .set('customStartDate', startDate)
                  .set('customEndDate', endDate)
                  .set('page', page.toString())
                  .set('size', size.toString());

              // Only add `vin` if it is not empty or undefined
                   if (vin) {
                       params = params.set('vin', vin);
                   }
                     return this.http.get<any>(`${this._apiUrl}/ev-fuel-recharge-summary?dateRange=custom_range`, { headers, params });
                   }
}
