import { HttpClient,HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';
//import { Location } from '../eligibility/models';

@Injectable({
  providedIn: 'root'
})

export class DashboardsService {
    _apiUrl = environment.url.SM_API_URL;

    constructor(private http: HttpClient) { }
    private buildParams(
            fleetId?: string,
            vin?: string,
            startDate?: string,
            endDate?: string
          ): HttpParams {
            let params = new HttpParams()
              .set('dateRange', 'custom_range');

            if (startDate) {
              params = params.set('customStartDate', startDate);
            }
            if (endDate) {
              params = params.set('customEndDate', endDate);
            }
            if (fleetId) {
              params = params.set('fleetId', fleetId);
            }
            if (vin) {
              params = params.set('vin', vin);
            }

            return params;
          }
    getBasicTelemetry(fleetId: string, periods: number, timePeriod: string): Observable<any> {
        const url = `${this._apiUrl}/dashboard/basic-telemetry`;
        const params = new HttpParams()
          .set('fleetId', fleetId)
          .set('periods', periods.toString())
          .set('timePeriod', timePeriod);
        return this.http.get<any>(url, { params });
      }

      getFuelAnalytics(fleetId: string, periods: number, timePeriod: string): Observable<any> {
        const url = `${this._apiUrl}/dashboard/fuel-analytics`;
        const params = new HttpParams()
          .set('fleetId', fleetId)
          .set('periods', periods.toString())
          .set('timePeriod', timePeriod);
        return this.http.get<any>(url, { params });
      }

      getFleetHealth(fleetId: string, periods: number, timePeriod: string): Observable<any> {
        const url = `${this._apiUrl}/dashboard/fleet-health`;
        const params = new HttpParams()
          .set('fleetId', fleetId)
          .set('periods', periods.toString())
          .set('timePeriod', timePeriod);
        return this.http.get<any>(url, { params });
      }

      getDriverSafety(fleetId: string, periods: number, timePeriod: string): Observable<any> {
        const url = `${this._apiUrl}/dashboard/driver-safety`;
        const params = new HttpParams()
          .set('fleetId', fleetId)
          .set('periods', periods.toString())
          .set('timePeriod', timePeriod);
        return this.http.get<any>(url, { params });
      }
      getDashboardSummary(fleetId: string, periods: number, timePeriod: string): Observable<any> {
        const url = `${this._apiUrl}/dashboard/summary`;
        const params = new HttpParams()
          .set('fleetId', fleetId)
          .set('periods', periods.toString())
          .set('timePeriod', timePeriod);

        return this.http.get<any>(url, { params });
      }
       // ---------------- Fuel Analytics ----------------
  getFuelSummary(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/fuel-analytics/fuel-summary?dateRange=custom_range`;
  console.log(startDate,endDate);
  let params = new HttpParams()
    .set('customStartDate', startDate)
    .set('customEndDate', endDate);

  // ✅ Add fleetId if available
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }

  // ✅ Add vin if available
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}


 getIdlingSummary(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/fuel-analytics/idling-summary?dateRange=custom_range`;

  let params = new HttpParams()
    .set('customStartDate', startDate)
    .set('customEndDate', endDate);

  // ✅ Add fleetId if available
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }

  // ✅ Add vin if available
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}

getRefuelSummary(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/fuel-analytics/refuel-summary?dateRange=custom_range`;

  let params = new HttpParams()
    .set('customStartDate', startDate)
    .set('customEndDate', endDate);

  // ✅ Add fleetId if available
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }

  // ✅ Add vin if available
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}

// Fuel Efficiency API
getFuelEfficiency(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/fuel-analytics/fuel-efficiency`;

  let params = new HttpParams();

  // ✅ Add fleetId if available
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }

  // ✅ Add vin if available
  if (vin) {
    params = params.set('vin', vin);
  }

  // ✅ Add date range if available
  if (startDate) {
    params = params.set('customStartDate', startDate);
  }
  if (endDate) {
    params = params.set('customEndDate', endDate);
  }

  return this.http.get<any>(url, { params });
}


  // ---------------- Safety Summary ----------------
 getOverspeeding(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/safety-summary/overspeeding`;

  let params = new HttpParams()
    .set('customStartDate', startDate)
    .set('customEndDate', endDate)
    .set('dateRange', 'custom_range');

  // ✅ Add optional filters if provided
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}

  getSafetyEvents(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/safety-summary/safety`;

  let params = new HttpParams()
    .set('customStartDate', startDate)
    .set('customEndDate', endDate)
    .set('dateRange', 'custom_range');

  // ✅ Add optional filters if provided
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}



// ---------------- Vehicle Maintenance ----------------


getOilChange(fleetId?: string, vin?: string, startDate?: string, endDate?: string) {
  const params = this.buildParams(fleetId, vin, startDate, endDate);
  return this.http.get(`${this._apiUrl}/vehicle-maintenance/oil-change`, { params });
}

getRepairMaintenance(fleetId?: string, vin?: string, startDate?: string, endDate?: string) {
  const params = this.buildParams(fleetId, vin, startDate, endDate);
  return this.http.get(`${this._apiUrl}/vehicle-maintenance/repair-maintenance`, { params });
}

getTyreService(fleetId?: string, vin?: string, startDate?: string, endDate?: string) {
  const params = this.buildParams(fleetId, vin, startDate, endDate);
  return this.http.get(`${this._apiUrl}/vehicle-maintenance/tyre-service`, { params });
}

getBatteryService(fleetId?: string, vin?: string, startDate?: string, endDate?: string) {
  const params = this.buildParams(fleetId, vin, startDate, endDate);
  return this.http.get(`${this._apiUrl}/vehicle-maintenance/battery-service`, { params });
}

getBrakeService(fleetId?: string, vin?: string, startDate?: string, endDate?: string) {
  const params = this.buildParams(fleetId, vin, startDate, endDate);
  return this.http.get(`${this._apiUrl}/vehicle-maintenance/brake-service`, { params });
}

  getOverspeedTripSummary(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/safety-summary/overspeeding/trips`;

  let params = new HttpParams()
    .set('customStartDate', startDate)
    .set('customEndDate', endDate)
    .set('dateRange', 'custom_range');

  // ✅ Add optional filters if provided
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}
getSafetyTripSummary(fleetId: string, vin: string, startDate: string, endDate: string): Observable<any> {
  const url = `${this._apiUrl}/safety-summary/safety/trips`;

  let params = new HttpParams()
    .set('customStartDate', startDate)
    .set('customEndDate', endDate)
    .set('dateRange', 'custom_range');

  // ✅ Add optional filters if provided
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}
getVehicleUsageSummary(fleetId?: string, vin?: string, startDate?: string, endDate?: string): Observable<any> {
  const url = `${this._apiUrl}/dashboard/vehicle-usage-summary`;

  let params = new HttpParams()
     .set('startTime', startDate)
     .set('endTime', endDate)

   // ✅ Add optional filters if provided
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }
  if (vin) {
    params = params.set('vin', vin);
  }

  return this.http.get<any>(url, { params });
}
getTripSummaryByDateRange(
  vin: string,
  startDate: string,
  endDate: string,
  fleetId?: string   // 👈 optional parameter
): Observable<any> {
  const url = `${this._apiUrl}/trip-summary/by-date-range`;

  let params = new HttpParams()
    .set('vin', vin)
    .set('startDate', startDate)
    .set('endDate', endDate)
  // 👇 only add fleetId if it exists
  if (fleetId) {
    params = params.set('fleetId', fleetId);
  }

  return this.http.get(url, { params });
}

}
