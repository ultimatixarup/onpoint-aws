import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
export interface ReverseGeocodeResponse {
  displayName: string;
}
export interface Timezone {
  value: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaxonomyService {
  _apiUrl = environment.url.BASE_URL
  api_url = environment.url.BASE_URL_1
  event_url = environment.url.trip_URL
  liveurl = environment.url.liveTripUrl
  _bulkUrl = environment.url.Bululk_eligibility
  eventsCall: string;
  eventSource;
  smApiUrl = environment.url.SM_API_URL; // this url for vrp application
  constructor(private http: HttpClient, private _zone: NgZone) { }
  getAllConsumers() {
    return this.http.get(this._apiUrl + 'consumers')
  }

  createGeofence(formData: any): Observable<any> {
    return this.http.post(this._apiUrl + 'places/geofence', formData);
  }

  idFilter(payload: any): Observable<any> {
    return this.http.post(this._apiUrl + 'places/geofence/geo-fence-events', payload);
  }

  getTaskStatus(taskId: string): Observable<any> {
    const url = `${this._apiUrl}places/geofence/task-status?taskId=${taskId}`;
    return this.http.get<any>(url);
  }

  getAllConsumerss(consumer) {
    return this.http.get(this._apiUrl + `consumers?consumer=${consumer}`)
  }

  getFleetList(consumer: string | null) {
    let apiUrl = this._apiUrl + 'fleets';

    if (consumer && consumer !== 'All') {
      const params = new HttpParams().set('consumer', consumer);
      return this.http.get(apiUrl, { params });
    } else {
      return this.http.get(apiUrl);
    }
  }

  getOrganizationSubGroups(orgId: number | null,consumer?) {
    let apiUrl = this._apiUrl + 'cms/fleet/get-groups';

    if (orgId) {
      apiUrl += `/${orgId}`;
    }
    if (consumer) {
      apiUrl +=`?consumer=${consumer}`;
    }
    return this.http.get(apiUrl);
  }

  getAllProvidersAdmin(consumer?) {
    if (consumer != 'All') {
      return this.http.get(this._apiUrl + `providers?consumer=${consumer}`)
    }
    else {
      return this.http.get(this._apiUrl + 'providers')
    }
  }
  getstatusList() {
    return this.http.get(this._apiUrl + 'enrollments/states')
  }
  getProviderList() {
    return this.http.get(this._apiUrl + 'providers')
  }
  oemNewData(consumer) {
    return this.http.get(this._apiUrl + `vehicle/enrollment/consumer/oem?consumer=${consumer}`)
  }

  // Active Vehicle API
  getTotalVehicles(consumer: string | null, fleetId: string, groupId:string, noOfMonths, ) {
    let apiUrl = `${this._apiUrl}vehicle/enrollment/activated-vehicles`;

    // If consumer is null/undefined/empty or explicitly 'All', do not send consumer param
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    } else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }

    return this.http.get(apiUrl);
  }

  // Vehicle Health Status API (with pagination for table data)
  getVehicleHealthSummary(fleetId: string, pageNumber: number, pageSize: number): Observable<any> {
    const params = new HttpParams()
      .set('fleetId', fleetId)
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get(this.smApiUrl + '/vehicle/health-status', { params });
  }

  // Vehicle Health Summary Metrics Only (without pagination)
  getVehicleHealthMetrics(fleetId: string): Observable<any> {
    const params = new HttpParams()
      .set('fleetId', fleetId);

    return this.http.get(this.smApiUrl + '/vehicle/health-summary', { params });
  }

  // Vehicle Health Detail API
  getVehicleHealthDetail(fleetId: string, vin: string): Observable<any> {
    const params = new HttpParams()
      .set('fleetId', fleetId)
      .set('vin', vin);

    return this.http.get(this.smApiUrl + '/vehicle/health-detail', { params });
  }

  // Total Trip API
  getTotalTripCounts(consumer: string | null, fleetId: string,groupId:string, noOfMonths) {
    let apiUrl = `${this.api_url}vin-summary/trip-count-month-wise`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }

  // Miles Driven API
  getMilesDrivens(consumer: string | null, fleetId: string,groupId:string, noOfMonths) {
    let apiUrl = `${this.event_url}vin-summary/mile-driven-month-wise`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }

  // Trip Found or Not Found
  tripSummaryFounds(consumer: string | null, fleetId: string,groupId:string,  noOfMonths) {
    let apiUrl = `${this.api_url}vin-summary/data/record`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  // Ideling Time
  getIdlingTime(consumer: string | null, fleetId: string, noOfMonths) {
    let apiUrl = `${this.api_url}vin-summary/month-wise-idling`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  getIdlingTimeData(consumer: string | null, fleetId: string,groupId:string, noOfMonths) {
    let apiUrl = `${this.api_url}vin-summary/month-wise-idling`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  getIdlingTimeWeeks(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/week-wise-idling')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/week-wise-idling?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }
  getIdlingTimeDays(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/day-wise-idling')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/day-wise-idling?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  // Fuel Mileage and Consumed
  getFuelMileagandConsumed(consumer: string | null, fleetId: string, noOfMonths) {
    let apiUrl = `${this._apiUrl}tco/mileage/prediction`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  getFuelMileagandConsumeds(consumer: string | null, fleetId: string, groupId:string, noOfMonths) {
    let apiUrl = `${this._apiUrl}tco/mileage/prediction`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  getFuelMileagandConsumedWeek(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/mileage-week-prediction')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/mileage-week-prediction?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }
  getFuelMileagandConsumedDay(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/mileage-day-prediction')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/mileage-day-prediction?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  // For Driver Safety Scorecard
  totalDriverScores(consumer: string | null, fleetId: string, groupId:string, noOfMonths) {
    let apiUrl = `${this.api_url}v1/insurance/driver-behaviour-range-wise/model`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  totalDriverScoresWeeks(consumer, fleetId, groupId) {
    if (consumer == 'All') {
      return this.http.get(this.api_url + 'v1/insurance/driver-behaviour-range-wise/week')
    }
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `v1/insurance/driver-behaviour-range-wise/week?consumer=${consumer}&fleetId=${fleetId}`)
    }
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `v1/insurance/driver-behaviour-range-wise/week?consumer=${consumer}&fleetId=${fleetId}&groupId=${groupId}`)
    }
  }
  totalDriverScoresDays(consumer, fleetId,groupId) {
    if (consumer == 'All') {
      return this.http.get(this.api_url + 'v1/insurance/driver-behaviour-range-wise/day')
    }
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `v1/insurance/driver-behaviour-range-wise/day?consumer=${consumer}&fleetId=${fleetId}`)
    }
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `v1/insurance/driver-behaviour-range-wise/day?consumer=${consumer}&fleetId=${fleetId}&groupId=${groupId}`)
    }
  }

  totalDriverScoreAdmin(consumer) {
    if (consumer == 'All') {
      return this.http.get(this.api_url + 'v1/insurance/driver-behaviour-range-wise/model')
    }
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `v1/insurance/driver-behaviour-range-wise/model?consumer=${consumer}`)
    }
  }

  // totalDriverScoreFleets(consumer, fleetId) {
  //   if (fleetId) {
  //     return this.http.get(this.api_url + `v1/insurance/driver-behaviour-range-wise/model?consumer=${consumer}&fleetId=${fleetId}`)
  //   }
  // }

  totalDriverScoreFleets(consumer: string, fleetId: string, groupId: string): Observable<any> {
    let url = `${this.api_url}v1/insurance/driver-behaviour-range-wise/model`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }

      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getSeatBeltUsageSafety(consumer: string, fleetId: string, groupId: string): Observable<any> {
    let url = `${this._apiUrl}insurance/driver-seatbelt`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }

      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getSeatBeltUsageweeksFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this._apiUrl}insurance/driver-seatbelt/week`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getSeatBeltUsagedaysFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this._apiUrl}insurance/driver-seatbelt/day`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }


  // For Seatbelt Violation
  getSeatBeltUsage(consumer: string | null, fleetId: string,groupId:string, noOfMonths) {
    let apiUrl = `${this._apiUrl}insurance/driver-seatbelt`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  getSeatBeltUsageweeks(consumer, fleetId, groupId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-seatbelt/week')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt/week?consumer=${consumer}&fleetId=${fleetId}`)
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt/week?consumer=${consumer}&fleetId=${fleetId}&groupId=${groupId}`)
    }
  }
  getSeatBeltUsagedays(consumer, fleetId, groupId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-seatbelt/day')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt/day?consumer=${consumer}&fleetId=${fleetId}`)
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt/day?consumer=${consumer}&fleetId=${fleetId}&groupId=${groupId}`)
    }
  }

  // Get Aggresive Driver
  getAggresiveDriver(consumer, fleetId, groupId, monthYear) {
    let apiUrl = `${this._apiUrl}insurance/prediction`;
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getAggresiveDriverWeekUser(consumer, fleetId, monthYear?) {
    let apiUrl = `${this._apiUrl}insurance/risky-driver/week`;
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getAggresiveDriverDayUser(consumer, fleetId, monthYear?) {
    let apiUrl = `${this._apiUrl}insurance/risky-driver/day`;
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  // Overall vehicle Splits
  getTotalOem(consumer: string | null, fleetId: string | null, groupId: string | null, monthYear: string | null) {
    let apiUrl = `${this._apiUrl}vehicle/enrollment/consumer/vehicles/vehicle-split-by-make`;
    const queryParams: string[] = [];
    if (consumer && consumer !== 'All') {
      queryParams.push(`consumer=${consumer}`);
    }
    if (monthYear) {
      queryParams.push(`yearMonth=${monthYear}`);
    }
    if (fleetId) {
      queryParams.push(`fleetId=${fleetId}`);
    }
    if (groupId) {
      queryParams.push(`groupId=${groupId}`);
    }
    if (queryParams.length > 0) {
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  // By Fuel
  getTotalFuelType(consumer: string | null, fleetId: string, groupId: string, noOfMonths) {
    let apiUrl = `${this._apiUrl}vindetails/vin-count-by-fuel-type`;
    if (!consumer || consumer === 'All') {
      const queryParams: string[] = [];
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      if (queryParams.length) {
        apiUrl += `?${queryParams.join('&')}`;
      }
    }
    else {
      // Consumer is selected
      const queryParams: string[] = [`consumer=${encodeURIComponent(consumer)}`];
      if (fleetId) {
        queryParams.push(`fleetId=${fleetId}`);
      }
      if (groupId) {
        queryParams.push(`groupId=${groupId}`);
      }
      if (noOfMonths) {
        queryParams.push(`noOfMonths=${noOfMonths}`);
      }
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }
  // Get Body Class
  getBodyClass(consumer: string | null, fleetId: string | null, groupId: string | null, monthYear: string | null) {
    let apiUrl = `${this._apiUrl}vindetails/vin-count-by-body-class`;
    const queryParams: string[] = [];
    if (consumer && consumer !== 'All') {
      queryParams.push(`consumer=${consumer}`);
    }
    if (monthYear) {
      queryParams.push(`yearMonth=${monthYear}`);
    }
    if (fleetId) {
      queryParams.push(`fleetId=${fleetId}`);
    }
    if (groupId) {
      queryParams.push(`groupId=${groupId}`);
    }
    if (queryParams.length > 0) {
      apiUrl += `?${queryParams.join('&')}`;
    }
    return this.http.get(apiUrl);
  }

  // VIN Summary List, and Filter API
  getManageList(page?, size?, alias?,vin?, consumer?, fleetId?, groupId?, oem?, failureReason?, enrollmentState?, sortDate?, sortStatus?) {
    let param = new HttpParams().set('page', page - 1).set('size', size)
    if (alias) {
      param = param.append('alias', alias);
    }
    if (vin) {
      param = param.append('vin', vin);
    }
    if (consumer) {
      param = param.append('consumer', consumer);
    }
    if (fleetId) {
      param = param.append('fleetId', fleetId);
    }
    if (groupId) {
      param = param.append('groupId', groupId);
    }
    if (oem) {
      param = param.append('provider', oem);
    }
    if (failureReason) {
      param = param.append('failureReason', failureReason);
    }

    if (enrollmentState) {
      param = param.append('enrollmentState', enrollmentState);
    }

    if (sortStatus) {
      param = param.append('sort', 'status,asc');
    }
    if (sortDate) {
      param = param.append('sort', 'creationDate,desc');
    }
    return this.http.get(this._apiUrl + 'manage-vehicle/enrollment', { params: param })
  }
  getManageListData() {
    let param = new HttpParams().set('size', 400)
    return this.http.get(this._apiUrl + 'manage-vehicle/enrollment', { params: param })
  }
  getManageListViaOem(page, size, consumer, alias, oem, status,) {
    let param = new HttpParams().set('page', page - 1).set('size', size);
    if (consumer) { param = param.append('consumer', consumer); }
    if (alias) { param = param.append('alias', alias); }
    if (oem) { param = param.append('provider', oem); }
    if (status) { param = param.append('enrollmentState', status); }
    return this.http.get(this._apiUrl + 'manage-vehicle/enrollment', { params: param });
  }

  // Trip Summary API
  getVinSummarys(vin: string, cadence: string): Observable<any> {
    return this.http.get<any>(`${this.event_url}us-summary/vin-stats?vin=${vin}&cadence=${cadence}`);
  }
  gettripSummary(Id: string, oem: string) {
    let param = new HttpParams()
      .set('vin', Id)
      // .set('provider', oem)
      .set('fillAddress', 'true'); // Add this line

    return this.http.get(this.event_url + 'us-summary/new-trip-detail', { params: param });
  }
  gettripSummaryHistory(Id: string, oem: string, tripId: string): Observable<any> {
    let param = new HttpParams();
    param = param.append('vin', Id);
    param = param.append('provider', oem); // Ensure that `oem` is not undefined
    param = param.append('tripId', tripId);
    return this.http.get(this.event_url + 'us-summary/snap-coords', { params: param });
  }


  gettripSummaryHistorys(Id: string, tripId: string): Observable<any> {
    let param = new HttpParams();
    param = param.append('vin', Id);
    param = param.append('tripId', tripId);
    return this.http.get(this.event_url + 'us-summary/snap-coords', { params: param });
  }

  // Tracking and Live Tracking or Current Trip History API
  getVINs(fleetId) {
    let param = new HttpParams().set('fleetId', fleetId)
    return this.http.get(this._apiUrl + 'tco/vin/list', { params: param })
  }
  getLiveVehicle(consumer?, fleedId?, groupId?, vin?, colorCode?, alias?) {
    let params = new HttpParams();

    if (consumer && consumer !== 'All') {
      params = params.append('consumer', consumer)
    }
    if (fleedId) {
      params = params.append('fleetId', fleedId)
    }
    if (groupId) {
      params = params.append('groupId', groupId)
    }
    if (vin) {
      params = params.append('vin', vin)
    }
    if (colorCode) {
      params = params.append('colorCode', colorCode)
    }
    if (alias) {
      params = params.append('alias', alias)
    }
    return this.http.get(this._apiUrl + 'subscribe/all/once?fillMmy=true', { params: params })
  }
  getAddressLatLng(lat: number, lng: number) {
    const url = this._apiUrl + `location/from-coordinates?latitude=${lat}&longitude=${lng}`;
    return this.http.get(url);
  }

  getAddressLatLngs(lat: number, lng: number) {
    const url = this._apiUrl + `location/from-coordinates?latitude=${lat}&longitude=${lng}`;
    return this.http.get<ReverseGeocodeResponse>(url); // 👈 type the response
  }
  getSnappedPoints(startLat: number, startLng: number, endLat: number, endLng: number) {
    const url = this._apiUrl + `route?osrm=${startLng},${startLat};${endLng},${endLat}?overview=full%26geometries=geojson`
    return this.http.get<any>(url);  // no explicit type used here
  }

  getSnappedPointss(startLat: number, startLng: number, endLat: number, endLng: number, timestamp: number) {
    const url = this._apiUrl + `route?osrm=${startLng},${startLat};${endLng},${endLat}?overview=full%26geometries=geojson&timestamps=${timestamp}`
    return this.http.get<any>(url);  // no explicit type used here
  }

  liveTripHistory(tripId) {
    return this.http.get(this._apiUrl + `subscribe/history/${tripId}?fillMmy=true`)
  }
  getServerSentEvent(vin, tripId): Observable<any> {
    return new Observable(observer => {
      this.eventSource = this.getEventSource(this.liveurl + `subscribe/${vin}/${tripId}`);

      // listen to default 'message' event
      this.eventSource.addEventListener('message', event => {
        this._zone.run(() => {
          observer.next(event);
        });
      });

      this.eventSource.onerror = error => {
        this._zone.run(() => {
          observer.error(error);
        });
      };

      // Cleanup on unsubscribe
      return () => this.eventSource.close();
    });
  }




  private getEventSource(url: string): EventSource {
    return new EventSource(url,);
  }
  stopUpdates() {
    this.eventSource.close();
  }

  // Sustainability Furl Cost API

  getFuelCostPerMonth(consumer, fleetId, groupId, monthYear) {
    let apiUrl = `${this._apiUrl}tco/mileage/prediction`;
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getFuelCostPerMonthWeek(consumer, fleetId, groupId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/mileage-week-prediction')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/mileage-week-prediction?consumer=${consumer}&fleetId=${fleetId}&groupId=${groupId}`)
    }
  }
  getFuelCostPerMonthDay(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/mileage-day-prediction')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/mileage-day-prediction?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  // Average FuelCost
  getAvgFuelCost(consumer, fleetId, monthYear) {
    let apiUrl = `${this._apiUrl}tco/avg-fuelcost-permiles-month`;
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getMonthAvgCost(consumer, fleetId,groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}tco/avg-fuelcost-permiles-week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getdailyAvgCost(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}tco/avg-fuelcost-permiles-day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  allRechargeEvetnFleet(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.event_url}vin-summary/recharge-event`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  // EV Releated API EV Breadkdown
  breakDownMonth(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}vindetails/ev-count`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  // EV Emission
  emissionMonth(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}vehicle/dashboard/emission/month`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  emissionWeek(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}vehicle/dashboard/emission/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  emissionDay(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}vehicle/dashboard/emission/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  // EV Distance
  distanceKwn(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.api_url}vin-summary/distance-per-kwh/month`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  distanceKwnWeek(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.api_url}vin-summary/distance-per-kwh/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  distanceKwnDay(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.api_url}vin-summary/distance-per-kwh/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  // Refueling

  getRefuling(consumer, fleetId, monthYear) {
    let apiUrl = `${this.api_url}vin-summary/refuel-details`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getRefulingWeek(consumer, fleetId, monthYear) {
    let apiUrl = `${this.event_url}vin-summary/refuel-details/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getRefuleingDay(consumer, fleetId, monthYear) {
    let apiUrl = `${this.event_url}vin-summary/refuel-details/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  // Maintenance
  vehicleMaintenance(consumer, fleetId,groupId, monthYear,) {
    let apiUrl = `${this.event_url}vin-summary/vehicle-maintenance-info`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  DownloadmaintenanceVin(consumer, fleetId, monthYear,) {
    let apiUrl = `${this.event_url}vin-summary/vehicle-maintenance-info`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  vinBasedOnConsumer(consumer?: string, fleetId?: string) {
    const params = [];

    if (consumer) {
      params.push(`consumer=${consumer}`);
    }

    if (fleetId) {
      params.push(`fleetId=${fleetId}`);
    }

    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    const url = `${this._apiUrl}vindetails/consumer${queryString}`;

    return this.http.get(url);
  }


  getEfficiencyCoachFleetNew(consumer: string, fleetId: string, groupId: string): Observable<any> {
    let url = `${this._apiUrl}insurance/driver-efficiency-coach/monthly`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }


  getWrostMileageFleetNews(consumer: string, fleetId: string): Observable<any> {
    return this.http.get<any>(this.api_url + `vin-summary/expensive-vins?consumer=${consumer}&fleetId=${fleetId}`);
  }


  getespensiceDriverFleetNew(consumer: string, fleetId: string, groupId: string): Observable<any> {
    let url = `${this.api_url}vin-summary/expensive-vins`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }
  getespensiceDriverFleetNews(consumer: string, fleetId: string | null,groupId: string | null) {
    let apiUrl = this.api_url + `vin-summary/expensive-vins`;
    if (consumer && consumer !== 'All') {
      apiUrl += `?consumer=${consumer}`;
    }
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }
    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }
    return this.http.get(apiUrl);
  }
  downloadRefulingReport(vin) {
    return this.http.get(this.event_url + `vin-summary/all-refuel-details?vin=${vin}`)
  }
  allRechargeEvetnConsumerAll() {
    return this.http.get(this.event_url + `vin-summary/recharge-event`)
  }
  DownloadallRechargeEvetnConsumerAll(vin) {
    return this.http.get(this.event_url + `vin-summary/recharge-event?vin=${vin}`)
  }
  DownloadallRechargeEvetnConsumerAllDate(startDate: string, endDate: string,): Observable<any> {
    return this.http.get<any>(`${this.event_url}vin-summary/recharge-event?startDate=${startDate}&endDate=${endDate}`);
  }
  DownloadallRechargeEvetnConsumerAllVINDate(vin: string, startDate: string, endDate: string,): Observable<any> {
    return this.http.get<any>(`${this.event_url}vin-summary/recharge-event?vin=${vin}&startDate=${startDate}&endDate=${endDate}`);
  }
  allRechargeEvetnConsumer(consumer) {
    if (consumer != 'All') {
      return this.http.get(this.event_url + `vin-summary/recharge-event?consumer=${consumer}`)
    }
    else {
      return this.http.get(this.event_url + `vin-summary/recharge-event`)
    }
  }
  downloadRefulingReports(vin: string, startDate: string, endDate: string,): Observable<any> {
    return this.http.get<any>(`${this.event_url}vin-summary/all-refuel-details?vin=${vin}&startDate=${startDate}&endDate=${endDate}`);
  }

  // TCO API
  getProviderListTCO(fleetId) {
    let param = new HttpParams();
    param = param.append('fleetId', fleetId);
    return this.http.get(this._apiUrl + 'tco/fleet-provider-make', { params: param })
  }

  getTcoModelList(fleetId, oem) {
    // let param = new HttpParams().set('provider','TOYOTA')
    let param = new HttpParams();
    param = param.append('provider', oem);
    return this.http.get(this._apiUrl + `tco/model-count/${fleetId}`, { params: param })
  }
  getTcoYearList(fleetId, oem, model) {
    let param = new HttpParams();
    param = param.append('provider', oem);
    param = param.append('model', model);
    return this.http.get(this._apiUrl + `tco/year-count/${fleetId}`, { params: param })
  }
  getFleetDetail(fleetId) {
    return this.http.get(this._apiUrl + `tco/fleet?fleetId=${fleetId}`)
  }

  getFleetDetailTCO(reqObj) {
    return this.http.post(this._apiUrl + `tco/by-filters`, reqObj)
  }

  getVINlist(consumer, fleetId) {
    return this.http.get(this._apiUrl + `tco/vin/list?consumer=${consumer}&fleetId=${fleetId}`)
  }

  // getVehileList(consumer?: string, fleetId?: string) {
  //   let url = `${this._apiUrl}tco/vin/list?`;

  //   if (consumer) {
  //     url += `consumer=${consumer}`;
  //   }

  //   if (fleetId) {
  //     url += consumer ? `&fleetId=${fleetId}` : `fleetId=${fleetId}`;
  //   }

  //   return this.http.get(url);
  // }


  getFleetSummaryTCO(reqObj) {

    return this.http.post(this._apiUrl + 'tco/fleet-make-count', reqObj)
  }

  vinDetails(oem) {
    let param = new HttpParams();
    param = param.append('providerName', oem);
    return this.http.get(this._apiUrl + 'vehicle/enrollment/consumer/oem/vin', { params: param })
  }

  vinDecode(data) {
    const payload = new HttpParams()
      .set('DATA', data)
      .set('format', 'JSON');
    return this.http.post('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/', payload, { responseType: "text" })
  }

  getAllVehicles() {
    return this.http.get(this._apiUrl + 'vehicle/enrollment/manage-vehicle');
  }

  getFleetMileageData(vin, mileage) {
    let param = new HttpParams().set('mileage', mileage)
    return this.http.get(this._apiUrl + `tco/fleet/${vin}`, { params: param })
  }

  getAllFleets() {
    return this.http.get(this._apiUrl + 'fleets')
  }

  getTcoModelLists(oem) {
    // let param = new HttpParams().set('provider','TOYOTA')
    let param = new HttpParams();
    param = param.append('provider', oem);
    return this.http.get(this._apiUrl + `tco/model-count/-1`, { params: param })
  }

  getTcoYearLists(oem, model) {
    let param = new HttpParams();
    param = param.append('provider', oem);
    param = param.append('model', model);
    return this.http.get(this._apiUrl + `tco/year-count/-1`, { params: param })
  }

  getTcoDetails(vin) {
    return this.http.get(this.event_url + `vin-summary/vin-details/${vin}`)
  }

  getCompareVinList() {
    return this.http.get(this._apiUrl + `tco/vin/list`)
  }
  getFleetDetails(fleetId) {
    let param = new HttpParams();
    param = param.append('fleetId', fleetId);
    return this.http.get(this._apiUrl + `tco/fleet`, { params: param })
  }

  getConsumerList() {
    return this.http.get(this._apiUrl + 'consumers')
  }

  getVINlistDataNew(fleetId) {
    return this.http.get(this._apiUrl + `tco/vin/list?fleetId=${fleetId}`)

  }

  // For Virtual Fleet
  getTcoDatas(vin) {
    return this.http.get(this._apiUrl + `tco/vin?vin=${vin}`)
  }
  getFleetProviders() {
    return this.http.get(this._apiUrl + `tco/provider-count/-1`)
  }
  getVINlists() {
    return this.http.get(this._apiUrl + `tco/vin/list?fleetId=-1`)
  }

  getFleetProvider(fleetId?: string,) {
    const url = fleetId
      ? `${this._apiUrl}tco/provider-count?fleetId=${fleetId}`
      : `${this._apiUrl}tco/provider-count`;

    return this.http.get(url);
  }

  getFleetProviderData(consumer?: string, fleetId?: string,) {
    const url = fleetId
      ? `${this._apiUrl}tco/provider-count?fleetId=${fleetId}`
      : `${this._apiUrl}tco/provider-count?consumer=${consumer}`;

    return this.http.get(url);
  }

  getConsumerDataList(page?, size?, alias?, vin?, consumer?, fleetId?, groupId?, oem?, sortStatus?,enrollmentState?, failureReason?, ) {
    let param = new HttpParams().set('page', page - 1).set('size', size)
    if (alias) {
      param = param.append('alias', alias);
    }
    if (vin) {
      param = param.append('vin', vin);
    }
    if (consumer) {
      param = param.append('consumer', consumer);
    }
    if (fleetId) {
      param = param.append('fleetId', fleetId);
    }
    if (groupId) {
      param = param.append('groupId', groupId);
    }
    if (oem) {
      param = param.append('provider', oem);
    }
    if (failureReason) {
      param = param.append('failureReason', failureReason);
    }
    if (enrollmentState) {
      param = param.append('enrollmentState', enrollmentState);
    }
    if (sortStatus) {
      param = param.append('status', sortStatus);
    }
    return this.http.get(this._apiUrl + 'manage-vehicle/enrollment', { params: param })
  }



















  getdailyFueLCost(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}tco/mileage-day-prediction`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getefficinecyVinMonthly(consumer: string, fleetId: string | null,groupId: string | null) {
    let apiUrl = this._apiUrl + `insurance/driver-efficiency-coach/monthly`;
    if (consumer && consumer !== 'All') {
      apiUrl += `?consumer=${consumer}`;
    }
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }
    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }
    return this.http.get(apiUrl);
  }

  getFuelConsumeFleets(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `tco/mileage/prediction?fleetId=${fleetId}`)
    }
  }

  getFuelConsumeFleet(consumer, fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `tco/mileage/prediction?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getFuelConsumeweekFleets(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `tco/mileage-week-prediction?fleetId=${fleetId}`)
    }
  }
  getFuelConsumeDailyFleets(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `tco/mileage-day-prediction?fleetId=${fleetId}`)
    }
  }

  getAvgdriverScore(consumer) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'vehicle/dashboard/driver-behaviour-score/month')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `vehicle/dashboard/driver-behaviour-score/month?consumer=${consumer}`)
    }
  }

  getAvgDriverScores(consumer, fleetId) {
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `vehicle/dashboard/driver-behaviour-score/month?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getDrivingEventFleetsUser(consumer, fleetId) {
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `vehicle/dashboard/driver-behaviour-score/month?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getweekAvgDriverScore(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}vehicle/dashboard/driver-behaviour-score/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getdailyAvgDriverScore(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}vehicle/dashboard/driver-behaviour-score/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getmonthFuelMileage(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}tco/mileage-week-prediction`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getMonthFueLconsumed(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}tco/mileage-week-prediction`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getMonthFueLconsumedFleetUser(fleetId, monthYear) {
    let apiUrl = `${this._apiUrl}tco/mileage-week-prediction?`;

    if (fleetId) {
      apiUrl += `fleetId=${fleetId}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
    } else {
      if (monthYear) {
        apiUrl += `yearMonth=${monthYear}`;
      }
    }

    return this.http.get(apiUrl);
  }


  getDrivingEvents(consumer) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/harsh-event/month')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/harsh-event/month?consumer=${consumer}`)
    }
  }

  getDrivingEventsWeek(consumer, fleetId, monthYear,) {
    let apiUrl = `${this.event_url}vin-summary/harsh-event/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getDrivingEventsday(consumer, fleetId, monthYear,) {
    let apiUrl = `${this.event_url}vin-summary/harsh-event/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getDrivingEventsdays(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/harsh-event/day')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/harsh-event/day?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getDrivingEventsWeeks(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/harsh-event/week')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/harsh-event/week?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }


  getDrivingEventFleets(consumer, fleetId) {
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/harsh-event/month?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }



  // Risk Coach
  getRiskCoach(consumer) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-risk-coach/monthly')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-risk-coach/monthly?consumer=${consumer}`)
    }
  }

  getRiskCoachs(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-risk-coach/monthly')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-risk-coach/monthly?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getRiskCoachnEW(fleetId: string, timePeriod: string): Observable<any> {
    // Replace the URL with the actual endpoint and pass fleetId and timePeriod as query parameters
    return this.http.get<any>(`insurance/driver-risk-coach/monthly?fleetId=${fleetId}&timePeriod=${timePeriod}`);
  }


  getVinSummaryRefuelDetails(consumer, fleetId, groupId, monthYear) {
    let apiUrl = `${this.event_url}vin-summary/refuel-details`;

    if (monthYear) {
      apiUrl += `?yearMonth=${monthYear}`;
    }

    if (consumer && consumer !== 'All') {
      apiUrl += `?consumer=${consumer}`;
    }

    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }

    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }

    return this.http.get(apiUrl);
  }




  getRiskCoachedweekUser(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-risk-coaching/week')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-risk-coaching/week?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getRiskCoachedDayUUser(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-risk-coaching/day')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-risk-coaching/day?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getRiskCoachedweek(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}insurance/driver-risk-coaching/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }



    return this.http.get(apiUrl);
  }

  getRiskCoachedDay(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}insurance/driver-risk-coaching/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getRiskCoachFleet(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-risk-coach/monthly?fleetId=${fleetId}`)
    }
  }

  getRiskCoachFleets(consumer, fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-risk-coach/monthly?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }


  getEfficiencyweek(consumer) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-efficiency-coaching/week')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-efficiency-coaching/week?consumer=${consumer}`)
    }
  }
  getEfficiencyweekData(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}insurance/driver-efficiency-coaching/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getEfficiencyDayData(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}insurance/driver-efficiency-coaching/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getEfficiencyDay(consumer) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-efficiency-coaching/day')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-efficiency-coaching/day?consumer=${consumer}`)
    }
  }

  getEfficiencyCoachFleet(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-efficiency-coach/monthly?fleetId=${fleetId}`)
    }
  }

  getEfficiencyCoachFleetData(fleetId, consumer) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-efficiency-coach/monthly?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getEfficiencyCoachFleetWeek(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-efficiency-coaching/week?fleetId=${fleetId}`)
    }
  }

  getEfficiencyCoachFleetDay(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-efficiency-coaching/day?fleetId=${fleetId}`)
    }
  }


  //Driver Behaviour


  getSeatBeltUsagedayNew(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'insurance/driver-seatbelt/day')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt/day?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getSeatBeltUsageweek(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}insurance/driver-seatbelt/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getSeatBeltUsageday(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}insurance/driver-seatbelt/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getSeatBeltUsageFleet(fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt?fleetId=${fleetId}`)
    }
  }

  getSeatBeltUsageFleetNew(consumer, fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getSeatBeltUsageFleets(consumer, fleetId) {
    if (fleetId) {
      return this.http.get(this._apiUrl + `insurance/driver-seatbelt?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  // top 5 wrost driver by mile



  getWrostVinMonthly(consumer, fleetId) {
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `vin-summary/lowest-mileage-month-wise?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getWrostMileageWeek(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.api_url}vin-summary/lowest-mileage/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getRefulingleetAll(consumer: string, fleetId: string, groupId: string): Observable<any> {
    let url = `${this.event_url}vin-summary/refuel-details`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }


  getwrostMileageFleetDay(consumer: string, fleetId: string, groupId: string): Observable<any> {
    let url = `${this.api_url}vin-summary/lowest-mileage/week`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getwrostMileageFleetDays(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.api_url}vin-summary/lowest-mileage/day`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getWrostMileageday(consumer, fleetId, monthYear) {
    let apiUrl = `${this.api_url}vin-summary/lowest-mileage/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }


  getwrostweekData(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}vin-summary/lowest-mileage/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getwrostDayData(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}vin-summary/lowest-mileage/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getExpensiveVinMonthly(consumer, fleetId) {
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `vin-summary/expensive-vins?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getespensiceDriver(consumer, fleetId,groupId, monthYear) {
    let apiUrl = `${this.api_url}vin-summary/expensive-vins`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  // getespensiceDriverWeek(consumer) {
  //   if (consumer == 'All') {
  //     return this.http.get(this.api_url + 'vin-summary/expensive-vins/week')
  //   }
  //   if (consumer !== 'All') {
  //     return this.http.get(this.api_url + `vin-summary/expensive-vins/week?consumer=${consumer}`)
  //   }
  // }


  // getespensiceDriversDays(consumer) {
  //   if (consumer == 'All') {
  //     return this.http.get(this.api_url + 'vin-summary/expensive-vins/day')
  //   }
  //   if (consumer !== 'All') {
  //     return this.http.get(this.api_url + `vin-summary/expensive-vins/day?consumer=${consumer}`)
  //   }
  // }

  getespensiceDriverWeek(consumer, fleetId, groupId, monthYear) {
    let apiUrl = `${this.api_url}vin-summary/expensive-vins/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getespensiceDriverWeeks(consumer: string, fleetId: string, groupId: string,): Observable<any> {
    let url = `${this.api_url}vin-summary/expensive-vins/week`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getespensiceDriversDays(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.api_url}vin-summary/expensive-vins/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }


  getespensiceDriverFleet(fleetId) {
    if (fleetId) {
      return this.http.get(this.api_url + `vin-summary/expensive-vins?fleetId=${fleetId}`)
    }
  }

  getexpensiveweekData(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}vin-summary/expensive-vins/week`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getespensiveDayData(consumer, fleetId, monthYear,) {
    let apiUrl = `${this._apiUrl}vin-summary/expensive-vins/day`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getDownloadVinSummarys(vin: string, startDate: string, endDate: string,): Observable<any> {
    return this.http.get<any>(`${this.api_url}vin-summary/trip-details?vin=${vin}&startDate=${startDate}&endDate=${endDate}`);
  }
  tirePressure(consumer) {
    if (consumer == 'All') {
      return this.http.get(this.api_url + 'vin-summary/tire-pressure-distribution')
    }
    if (consumer !== 'All') {
      return this.http.get(this.api_url + `vin-summary/tire-pressure-distribution?consumer=${consumer}`)
    }
  }

  tirePressureFleet(fleetId) {
    if (fleetId) {
      return this.http.get(this.api_url + `vin-summary/tire-pressure-distribution?fleetId=${fleetId}`)
    }
  }


  tirePressureFleetNew(consumer: string, fleetId: string, groupId: string,): Observable<any> {
    let url = `${this.api_url}vin-summary/tire-pressure-distribution`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getLowPressurePercentage(consumer) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/lowpressure-miles-driven-percentage')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/lowpressure-miles-driven-percentage?consumer=${consumer}`)
    }
  }

  getLowPressurefleet(fleetId) {
    if (fleetId) {
      return this.http.get(this.api_url + `vin-summary/lowpressure-miles-driven-percentage?fleetId=${fleetId}`)
    }
  }

  getLowPressurefleetNew(consumer, fleetId) {
    if (fleetId) {
      return this.http.get(this.api_url + `vin-summary/lowpressure-miles-driven-percentage?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getLowbattery(consumer) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/battery-status')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/battery-status?consumer=${consumer}`)
    }
  }

  getLowBatteryFleet(consumer: string, fleetId: string, groupId: string,): Observable<any> {
    let url = `${this.api_url}vin-summary/battery-status`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }


  getAllConsumer() {
    return this.http.get(this._apiUrl + 'consumers');
  }

  eligibilityCheck(vin) {
    return this.http.post(this._apiUrl + `enroll/check-eligibility/${vin}`, {})
  }

  getLowPressurefleetsNew(consumer: string, fleetId: string, groupId: string,): Observable<any> {
    let url = `${this.api_url}vin-summary/lowpressure-miles-driven-percentage`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        url += `&groupId=${groupId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getVinSummary(Id, cadence) {
    let param = new HttpParams();
    param = param.append('vin', Id);
    param = param.append('cadence', cadence);
    return this.http.get(this.event_url + 'us-summary/vin-stats', { params: param })
  }

  fleetSummaryData(consumer: string, fleetId: string, groupId: string, timeFrame: string,) {
    let apiUrl = this._apiUrl + `vindetails/vin-status-history`;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }
    if (timeFrame) {
      params.timeFrame = timeFrame;
    }
    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }
  getVinSummaryNew(consumer: string, fleetId: string, vin: string, cadence: string,): Observable<any> {
    return this.http.get<any>(`${this.event_url}us-summary/vin-stats-2?consumer=${consumer}&fleetId=${fleetId}&vin=${vin}&cadence=${cadence}`);
  }
  getVinSummaryNews(consumer: string, fleetId: string, vin: string): Observable<any> {
    return this.http.get<any>(`${this.event_url}us-summary/vin-stats-2?consumer=${consumer}&fleetId=${fleetId}&vin=${vin}`);
  }
  downloadReportFleetSummary(cadence: string | null, consumer: string, fleetId: string | null, groupId: string | null) {
    let apiUrl = this.event_url + `us-summary/vin-stats-2?cadence=TILL_NOW`;
    if (consumer && consumer !== 'All') {
      apiUrl += `&consumer=${consumer}`;
    }
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }
    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }
    if (cadence && cadence !== 'TILL_NOW') {
      apiUrl = apiUrl.replace('cadence=TILL_NOW', `cadence=${cadence}`);
    }
    return this.http.get(apiUrl);
  }

  generateReport(data: any) {
    return this.http.post(this._apiUrl + 'reports', data);
  }

  fleetSummaryDataNoTimeFrame(consumer: string, fleetId: string, timeFrame: string,) {
    let apiUrl = this._apiUrl + `vindetails/vin-status-history`;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (timeFrame) {
      params.timeFrame = timeFrame;
    }
    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }

  fleetSummaryDatatillDate(consumer: string, fleetId: string,groupId: string) {
    let apiUrl = this._apiUrl + `vindetails/vin-status-history`;
    const params: { [key: string]: string } = {};

    // Check if the consumer is 'All'
    if (consumer === 'All') {
      params.startDate = '2022-01-01';
      params.endDate = new Date().toISOString().split('T')[0]; // Current system date
    } else {
      // If consumer is not 'All', use the provided start date and fleet ID
      params.startDate = '2022-01-01'; // Fixed start date
      params.endDate = new Date().toISOString().split('T')[0]; // Current system date
      params.consumer = consumer;

      if (fleetId) {
        params.fleetId = fleetId;
      }
      if (groupId) {
        params.groupId = groupId;
      }
    }

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }

  fleetSummaryDatatillDates(consumer: string, fleetId: string, groupId) {
    let apiUrl = this._apiUrl + `vindetails/vin-status-history`;
    const params: { [key: string]: string } = {};

    // Get today's date and the date 7 days ago
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);

    // Format the dates as strings (YYYY-MM-DD)
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = today.toISOString().split('T')[0];

    // Check if the consumer is 'All'
    if (consumer === 'All') {
      params.startDate = formattedStartDate;
      params.endDate = formattedEndDate;
    } else {
      // If consumer is not 'All', use the provided start date and fleet ID
      params.startDate = formattedStartDate;
      params.endDate = formattedEndDate;
      params.consumer = consumer;

      if (fleetId) {
        params.fleetId = fleetId;
      }

      if (groupId) {
        params.groupId = groupId;
      }
    }

    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }

  fleetSummaryDataDateWise(consumer: string, fleetId: string, groupId: string, startDate: string = '', endDate: string = '') {
    let apiUrl = this._apiUrl + `vindetails/vin-status-history`;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }
    // Ensuring startDate and endDate are always included
    if (startDate) {
      params.startDate = encodeURIComponent(startDate); // URL-encode the date
    }
    if (endDate) {
      params.endDate = encodeURIComponent(endDate); // URL-encode the date
    }

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }

  fleetSummaryDataDateWiseOnly(startDate: string = '', endDate: string = '') {
    let apiUrl = this._apiUrl + `vindetails/vin-status-history`;

    const params: { [key: string]: string } = {};

    // Ensuring startDate and endDate are always included
    if (startDate) {
      params.startDate = encodeURIComponent(startDate); // URL-encode the date
    }
    if (endDate) {
      params.endDate = encodeURIComponent(endDate); // URL-encode the date
    }

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }

  getVINlistReportSection(consumer: string, fleetId: string, groupId:string) {
    let apiUrl = this._apiUrl + `vindetails/consumer`;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }
    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }

  getManageListDownloadReort(consumer: string, fleetId: string, startDate: string, endDate: string) {
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    params.startDate = encodeURIComponent(finalStartDate);
    params.endDate = encodeURIComponent(finalEndDate);

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = `https://developer-api.cerebrumx.ai/api/v1/vindetails/vin-status-history?${queryString}`;

    return this.http.get(url);
  }

  getManageListDownloadConsumerDnd(startDate: string, endDate: string) {
    // Set default values if startDate or endDate are empty or undefined
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Use default values if parameters are not provided
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Ensure startDate and endDate are properly encoded in the URL
    const url = `https://developer-api.cerebrumx.ai/api/v1/manage-vehicle/vin-status-history?startDate=${encodeURIComponent(finalStartDate)}&endDate=${encodeURIComponent(finalEndDate)}`;

    return this.http.get(url);
  }

  getSafetyDataNewReport(consumer: string, fleetId: string, startDate: string, endDate: string) {
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    params.startDate = encodeURIComponent(finalStartDate);
    params.endDate = encodeURIComponent(finalEndDate);

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = `https://developer-api.cerebrumx.ai/api/us-summary/vin-stats-2?cadence=CUSTOM_RANGE&${queryString}`;

    return this.http.get(url);
  }

  vehicleListSummarys(consumer) {
    return this.http.get(this._apiUrl + `fleets/vins?consumer=${consumer}`)
  }

  getTotalVehicleWeekFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this._apiUrl}vehicle/dashboard/activated-vehicles-week`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getTotalVehicleDayFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this._apiUrl}vehicle/dashboard/activated-vehicles-day`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }
  getTotalTripCountWeekFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.api_url}vin-summary/trip-count-week-wise`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getTotalTripCountDayFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.api_url}vin-summary/trip-count-day-wise`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getMilesDrivenWeekFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.event_url}vin-summary/mile-driven-week-wise`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getMilesDrivenDayFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.event_url}vin-summary/mile-driven-day-wise`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  TripFoundorNofoundWeekFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.api_url}vin-summary/data/record-week`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  TripFoundorNofoundDayFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.api_url}vin-summary/data/record-day`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getIdlingTimeWeeksFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.event_url}vin-summary/week-wise-idling`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getIdlingTimeDayFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this.event_url}vin-summary/day-wise-idling`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }


  getFuelConsume(consumer) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/mileage/prediction')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/mileage/prediction?consumer=${consumer}`)
    }
  }

  getFuelConsumeWeek(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/mileage-week-prediction')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/mileage-week-prediction?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }
  getFuelConsumeDay(consumer, fleetId) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/mileage-day-prediction')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/mileage-day-prediction?consumer=${consumer}&fleetId=${fleetId}`)
    }
  }

  getFuelConsumeWeekFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this._apiUrl}tco/mileage-week-prediction`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getFuelConsumeDayFleet(consumer: string, fleetId: string): Observable<any> {
    let url = `${this._apiUrl}tco/mileage-day-prediction`;
    if (consumer) {
      url += `?consumer=${consumer}`;

      if (fleetId) {
        url += `&fleetId=${fleetId}`;
      }
    }
    return this.http.get<any>(url);
  }

  getFuelConsumeFleetsMain(consumer: any, fleetId: any): Observable<any> {
    return this.http.get<any>(`${this._apiUrl}tco/mileage/prediction`, {
      params: {
        consumer,
        fleetId
      }
    });
  }

  // Download Enrollment

  getManageListDownload(startDate: string, endDate: string) {
    // Set default values if startDate or endDate are empty or undefined
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Use default values if parameters are not provided
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Ensure startDate and endDate are properly encoded in the URL
    const url = this._apiUrl + `manage-vehicle/enrollment-summary-report?startDate=${encodeURIComponent(finalStartDate)}&endDate=${encodeURIComponent(finalEndDate)}`;

    return this.http.get(url);
  }
  getManageListDownloads(consumer: string, fleetId: string, groupId: string, startDate: string, endDate: string) {
    // Set default values if startDate or endDate are empty or undefined
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Use default values if parameters are not provided
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Initialize params object
    let params: { [key: string]: string } = {
      startDate: encodeURIComponent(finalStartDate),
      endDate: encodeURIComponent(finalEndDate),
    };

    // Add consumer and fleetId to the params if they are provided
    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }

    if (groupId) {
      params.groupId = groupId;
    }

    // Build the URL with the query parameters
    const url = `${this._apiUrl}manage-vehicle/enrollment-summary-report?${new URLSearchParams(params).toString()}`;

    return this.http.get(url);
  }

  getManageListDownloadConsumer(consumer: string, startDate: string, endDate: string) {
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    params.startDate = encodeURIComponent(finalStartDate);
    params.endDate = encodeURIComponent(finalEndDate);

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = this._apiUrl + `manage-vehicle/enrollment-summary-report?${queryString}`;

    return this.http.get(url);
  }
  getManageListDownloadConsumers(consumer: string, fleetId: string, startDate: string, endDate: string) {
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    params.startDate = encodeURIComponent(finalStartDate);
    params.endDate = encodeURIComponent(finalEndDate);

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = this._apiUrl + `manage-vehicle/enrollment-summary-report?${queryString}`;

    return this.http.get(url);
  }
  getManageListDownloadConsumerFleet(consumer: string, fleetId: string, groupId: string, startDate: string, endDate: string) {
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }
    params.startDate = encodeURIComponent(finalStartDate);
    params.endDate = encodeURIComponent(finalEndDate);

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = this._apiUrl + `manage-vehicle/enrollment-summary-report?${queryString}`;

    return this.http.get(url);
  }
  getManageListDownloadS(consumer: string, fleetId: string, groupId: string, timeFrame: string) {
    let apiUrl = this._apiUrl + `manage-vehicle/enrollment-summary-report`;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }
    if (timeFrame) {
      params.timeFrame = timeFrame;
    }

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }
  // Download History
  getHistoryAllDate(startDate: string, endDate: string) {
    // Set default values if startDate or endDate are empty or undefined
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Use default values if parameters are not provided
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Ensure startDate and endDate are properly encoded in the URL
    const url = this._apiUrl + `vindetails/vin-status-report?startDate=${encodeURIComponent(finalStartDate)}&endDate=${encodeURIComponent(finalEndDate)}`;

    return this.http.get(url);
  }

  getHistoryAllDates(consumer: string, fleetId: string, startDate: string, endDate: string) {
    // Set default values if startDate or endDate are empty or undefined
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Use default values if parameters are not provided
    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    // Initialize params object
    let params: { [key: string]: string } = {
      startDate: encodeURIComponent(finalStartDate),
      endDate: encodeURIComponent(finalEndDate),
    };

    // Add consumer and fleetId to the params if they are provided
    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }

    // Build the URL with the query parameters
    const url = `${this._apiUrl}vindetails/vin-status-report?${new URLSearchParams(params).toString()}`;

    return this.http.get(url);
  }

  getHistoryConsumer(consumer: string, startDate: string, endDate: string) {
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    params.startDate = encodeURIComponent(finalStartDate);
    params.endDate = encodeURIComponent(finalEndDate);

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = this._apiUrl + `vindetails/vin-status-report?${queryString}`;

    return this.http.get(url);
  }
  gerHustoryAll(consumer: string, fleetId: string, groupId:string, startDate: string, endDate: string) {
    const defaultStartDate = '2022-01-01';
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const finalStartDate = startDate || defaultStartDate;
    const finalEndDate = endDate || defaultEndDate;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }
    params.startDate = encodeURIComponent(finalStartDate);
    params.endDate = encodeURIComponent(finalEndDate);

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const url = this._apiUrl + `vindetails/vin-status-report?${queryString}`;

    return this.http.get(url);
  }
  getHistoryDownlaod(consumer: string, fleetId: string, gropId:string, timeFrame: string) {
    let apiUrl = this._apiUrl + `vindetails/vin-status-report`;

    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (gropId) {
      params.gropId = gropId;
    }
    if (timeFrame) {
      params.timeFrame = timeFrame;
    }

    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    apiUrl += `?${queryString}`;

    return this.http.get(apiUrl);
  }
  downloadDriverSafetyReportAll(consumer: string, fleetId: string | null,groupId: string | null, cadence: string | null,) {
    let apiUrl = this.event_url + `us-summary/vin-stats-2`;
    if (consumer && consumer !== 'All') {
      apiUrl += `?consumer=${consumer}`;
    }
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }
    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }
    if (cadence) {
      apiUrl += `&cadence=${cadence}`;
    }
    return this.http.get(apiUrl);
  }
  downloadDriverSafetyReportAlls(consumer: string, fleetId: string | null,groupId: string | null, ) {
    let apiUrl = this.event_url + `us-summary/vin-stats-2`;
    if (consumer && consumer !== 'All') {
      apiUrl += `?consumer=${consumer}`;
    }
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }
    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }
    return this.http.get(apiUrl);
  }

  getAggresiveDriverNew(consumer: string, fleetId: string, groupId: string) {
    let apiUrl = this._apiUrl + 'insurance/prediction';
    let params = [];

    // Add consumer if it's not 'All'
    if (consumer && consumer !== 'All') {
        params.push(`?consumer=${consumer}`);
    }

    // Add fleetId if provided
    if (fleetId) {
        params.push(`fleetId=${fleetId}`);
    }

    if (groupId) {
      params.push(`groupId=${groupId}`);
  }

    // Append parameters to API URL
    if (params.length > 0) {
        apiUrl += params.join('&');
    }

    return this.http.get(apiUrl);
}


  getAggresiveDriverNewSafety(consumer: string, fleetId: string, yearMonth: string) {
    let apiUrl = this._apiUrl + 'insurance/prediction?';

    // Add consumer if it's not 'All'
    if (consumer && consumer !== 'All') {
      apiUrl += `consumer=${consumer}&`;
    }

    // Add fleetId if provided
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}&`;
    }

    if (yearMonth) {
      apiUrl += `yearMonth=${yearMonth}`;
    }


    return this.http.get(apiUrl);
  }


  getAllVinList(consumer: string, fleetId: string,) {
    let apiUrl = this._apiUrl + `vindetails/consumer`;

    // Add consumer if it's not 'All'
    if (consumer && consumer !== 'All') {
      apiUrl += `consumer=${consumer}`;
    }

    // Add fleetId if provided
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }

    return this.http.get(apiUrl);
  }

  getSafetyDataNew(consumer: string, fleetId: string, startDate: Date, endDate: Date) {
    let apiUrl = this.event_url + `us-summary/vin-stats-2?cadence=CURRENT_MONTH`;

    // Add consumer if it's not 'All'
    if (consumer && consumer !== 'All') {
      apiUrl += `&consumer=${consumer}`;
    }

    // Add fleetId if provided
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }

    // Add startDate and endDate parameters
    if (startDate) {
      apiUrl += `&startDate=${encodeURIComponent(this.formatDate(startDate))}`;
    }
    if (endDate) {
      apiUrl += `&endDate=${encodeURIComponent(this.formatDate(endDate))}`;
    }

    return this.http.get(apiUrl);
  }

  getSafetyDataNewCurrentMonth(consumer: string, fleetId: string, groupId: string) {
    let apiUrl = this.event_url + `us-summary/vin-stats-2?cadence=CURRENT_MONTH`;

    // Add consumer if it's not 'All'
    if (consumer && consumer !== 'All') {
      apiUrl += `&consumer=${consumer}`;
    }

    // Add fleetId if provided
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }
    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }
    return this.http.get(apiUrl);
  }



  // Helper method to format the date as 'YYYY-MM-DD'
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  downloadReportFleetSummaryCustomRangeAll(
    consumer: string,
    fleetId: string | null,
    startDate: string,
    endDate: string,

  ) {
    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const apiUrl = this.event_url + `us-summary/vin-stats-2?cadence=MONTHLY&${queryString}`;

    return this.http.get(apiUrl);
  }


  getRefulings(consumer,) {
    if (consumer == 'All') {
      return this.http.get(this.event_url + 'vin-summary/refuel-details')
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/refuel-details?consumer=${consumer}`)
    }
    if (consumer !== 'All') {
      return this.http.get(this.event_url + `vin-summary/refuel-details?consumer=${consumer}`)
    }
  }

  getAvgFuelCosts(consumer) {
    if (consumer == 'All') {
      return this.http.get(this._apiUrl + 'tco/avg-fuelcost-permiles-month')
    }
    if (consumer !== 'All') {
      return this.http.get(this._apiUrl + `tco/avg-fuelcost-permiles-month?consumer=${consumer}`)
    }
  }


  getIdlingTimefleetAll(
    consumer: string,
    fleetId: string | null,
    groupId: string | null,
  ) {
    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const apiUrl = this.event_url + `vin-summary/month-wise-idling?${queryString}`;

    return this.http.get(apiUrl);
  }

  getFuelConsumedMonthly(
    consumer: string,
    fleetId: string | null,
    groupId: string | null,
  ) {
    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const apiUrl = this._apiUrl + `tco/mileage/prediction?${queryString}`;

    return this.http.get(apiUrl);
  }

  getFuelConsumedMonthlys(
    consumer: string,
    fleetId: string | null,

  ) {
    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const apiUrl = this._apiUrl + `tco/mileage/prediction?${queryString}`;

    return this.http.get(apiUrl);
  }


  getFleetProviderConsumer(consumer?: string) {
    const url = consumer
      ? `${this._apiUrl}tco/provider-count?consumer=${consumer}`
      : `${this._apiUrl}tco/provider-count`;

    return this.http.get(url);
  }

  reChargingCostReport(consumer: string, fleetId: string) {
    const startDate = '2022-01-01';
    const endDate = new Date().toISOString().split('T')[0];  // Current date in 'YYYY-MM-DD' format

    let apiUrl = `${this.api_url}vin-summary/recharge-event`;

    // Build query parameters using HttpParams for cleaner URL construction
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    // Add consumer if it's not 'All'
    if (consumer && consumer !== 'All') {
      params = params.set('consumer', consumer);
    }

    // Add fleetId if provided
    if (fleetId) {
      params = params.set('fleetId', fleetId);
    }

    // Make the HTTP GET request with the constructed URL and parameters
    return this.http.get(apiUrl, { params });
  }

  getIdlingTimeWeek(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.event_url}vin-summary/week-wise-idling`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getIdlingTimeDay(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this.event_url}vin-summary/day-wise-idling`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }   if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getFuelMileagandConsumedWeeks(consumer, fleetId, monthYear) {
    let apiUrl = `${this._apiUrl}tco/mileage-week-prediction`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }
  getFuelMileagandConsumedDays(consumer, fleetId, monthYear) {
    let apiUrl = `${this._apiUrl}tco/mileage-day-prediction`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
    }

    return this.http.get(apiUrl);
  }


  getGeofenceTypeWithoutConsumer() {
    return this.http.get(this._apiUrl + 'places/geofence')
  }

  // getGeofence() {
  //   return this.http.get(this._apiUrl + 'geofence-new')
  // }

  getGeofence(
    consumer: string,
    fleetId: string,
    groupId: string,
    page: number = 0,
    size: number = 1000
  ) {
    let apiUrl = `${this._apiUrl}geofence-new?page=${page}&size=${size}`;
    const params: string[] = [];

    if (consumer) params.push(`consumer=${consumer}`);
    if (fleetId) params.push(`fleetId=${fleetId}`);
    if (groupId) params.push(`groupId=${groupId}`);
    if (params.length) apiUrl += '&' + params.join('&');

    return this.http.get(apiUrl);
  }


  getGeofences(consumer?: string, fleetId?: string,groupId?: string, geofenceId?:string) {
    let apiUrl = `${this._apiUrl}geofence-new?page=0&size=10000&`;
    const params = [];

    if (consumer && consumer !== 'All') {
      params.push(`consumer=${consumer}`);
    }

    if (fleetId) {
      params.push(`fleetId=${fleetId}`);
    }


    if (groupId) {
      params.push(`groupId=${groupId}`);
    }

    if (geofenceId) {
      params.push(`geofenceId=${geofenceId}`);
    }

    if (params.length > 0) {
      apiUrl += `${params.join('&')}`;
    }

    return this.http.get(apiUrl);
  }

  createGeofenceNew(data: any): Observable<any> {
  return this.http.post(`${this._apiUrl}geofence-new`, data);
}


updateGeofenceNew(id: string, updatedData: any) {
  const url = `${this._apiUrl}geofence-new/edit/${id}`;
  return this.http.put(url, updatedData);
}



  getGeofenceType() {
    return this.http.get(this._apiUrl + 'places/geofence-type')
  }

  getAllReport() {
    return this.http.get(this._apiUrl + 'places/geofence/all-task');
  }

  deleteGeofence(id: string) {
    const url = `${this._apiUrl}places/geofence/${id}`;
    return this.http.delete(url);
  }

  deleteGeofenceCascade(id: string | number): Observable<any> {
    const url = `${this.smApiUrl}/geofence/${id}/cascade`;
    return this.http.delete(url);
  }

  updateGeofenceStatus(id: string | number, active: boolean): Observable<any> {
    const url = `${this.smApiUrl}/geofence/${id}/status`;
    return this.http.put(url, { active });
  }



  updateVehicleAlias(vin: string, alias: string): Observable<any> {
    const url = `${this._apiUrl + 'enrollments/updateVehicle/'}${vin}`;
    const body = { alias };
    return this.http.put(url, body);  // Sends the PUT request
  }

  updateFuelCapacity(vin: string, fuelTankSize: number): Observable<any> {
    const url = `${this.event_url}us-summary/update-tank-size`;
    const body = {
      vin,
      fuelTankSize
    };
    return this.http.put(url, body);
  }


  editGeofence(id: string, updatedData: any) {
    const url = `${this._apiUrl}places/geofence/update/geo-fence/${id}`;
    return this.http.put(url, updatedData);
  }

  getBodyClassMileage(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}vehicles/mileage-by-body-class`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getBodyClassEV(consumer, fleetId,groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}evs/distance-per-kwh-by-body-class`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getCityHighwayFuel(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}mileage/city-highway/non-ev`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }

  getIdlingTimes(consumer: string, fleetId: string, groupId, monthYear: string) {
    let apiUrl = `${this.event_url}vin-summary/month-wise-idling`;

    // Construct the API URL based on provided parameters
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    // Perform the HTTP GET request and return the observable
    return this.http.get(apiUrl);
  }

  getCityHighwayEV(consumer, fleetId, groupId, monthYear,) {
    let apiUrl = `${this._apiUrl}mileage/city-highway/ev`;

    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    return this.http.get(apiUrl);
  }


  getAvgFuelCostFleet(consumer: string, fleetId: string, groupId:string, monthYear: string) {
    let apiUrl = `${this._apiUrl}tco/avg-fuelcost-permiles-month`;

    // Construct the API URL based on provided parameters
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    // Perform the HTTP GET request and return the observable
    return this.http.get(apiUrl);
  }



  getEfficiencyCoach(consumer: string, fleetId: string, groupId: string, monthYear: string) {
    let apiUrl = `${this._apiUrl}insurance/driver-efficiency-coach/monthly`;

    // Construct the API URL based on provided parameters
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    // Perform the HTTP GET request and return the observable
    return this.http.get(apiUrl);
  }
  getWrostMileageFleetNew(consumer: string, fleetId: string, groupId: string, monthYear: string) {
    let apiUrl = `${this.api_url}vin-summary/lowest-mileage-month-wise`;

    // Construct the API URL based on provided parameters
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    // Perform the HTTP GET request and return the observable
    return this.http.get(apiUrl);
  }

  getWrostMileage(consumer: string, fleetId: string, groupId: string, monthYear: string) {
    let apiUrl = `${this.api_url}vin-summary/lowest-mileage-month-wise`;

    // Construct the API URL based on provided parameters
    if (consumer === 'All') {
      if (monthYear) {
        apiUrl += `?yearMonth=${monthYear}`;
      }
    } else {
      apiUrl += `?consumer=${consumer}`;
      if (monthYear) {
        apiUrl += `&yearMonth=${monthYear}`;
      }
      if (fleetId) {
        apiUrl += `&fleetId=${fleetId}`;
      }
      if (groupId) {
        apiUrl += `&groupId=${groupId}`;
      }
    }

    // Perform the HTTP GET request and return the observable
    return this.http.get(apiUrl);
  }
  getLoginToken() {
    let body = { "email": "steve.grigsby@onwardconnected.com", "password": "#t3ve2024@ON" }
    return this.http.post('https://uat.hdfleet.net/hdfleet/auth/login', body)
  }

  uploadDataToAPI(data: any[]): Observable<any> {
    let apiUrl = `${this._apiUrl}places/geofence/bulk`;
    return this.http.post(apiUrl, data);
  }

  addDriver(driverData: any): Observable<any> {
    let apiUrl = `${this._apiUrl}driver`;
    return this.http.post(apiUrl, driverData);
  }

  addDriverWithFile(formData: FormData): Observable<any> {
    let apiUrl = `${this._apiUrl}driver/upload`;
    return this.http.post(apiUrl, formData);
  }

  updateDriverWithFile(id: string, formData: FormData): Observable<any> {
    const apiUrl = `${this._apiUrl}driver/${id}/upload`;
    return this.http.put(apiUrl, formData);
  }

  // Delete driver-VIN association (uses v2 API with transId)
  deleteDriverVinAssociation(transId: number): Observable<any> {
    const apiUrl = `${this.api_url}v2/driver-vin-association/delete/${transId}`;
    return this.http.delete(apiUrl);
  }

  // Get all driver-vin associations (both ASSIGNED and UNASSIGNED)
  getDriverVinAssociationByStatus(status: string, consumerId?: string): Observable<any> {
    let apiUrl = `${this.smApiUrl}/driver-vin-association`;

    const params: string[] = [];

    // Add status as query parameter if provided
    if (status) {
      params.push(`status=${status}`);
    }

    // Add consumerId as query parameter if provided
    if (consumerId) {
      params.push(`consumerId=${consumerId}`);
    }

    // Append query parameters
    if (params.length > 0) {
      apiUrl += `?${params.join('&')}`;
    }

    return this.http.get(apiUrl);
  }

  getAssignDrivers(consumerId?: string, fleetId?: string, groupid?: string) {
    // Base API URL
    let url = `${this._apiUrl}driver`;
    const params: { [key: string]: string } = {};
    if (consumerId) {
      params['consumerId'] = consumerId;
    }
    if (fleetId) {
      params['fleetId'] = fleetId;
    }
    if (groupid) {
      params['groupid'] = groupid;
    }
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return this.http.get(url);
  }
  getManageDriver(
    consumerid?: string,
    fleetId?: string,
    groupId?: string,
    pageNo: number = 1,
    pageSize: number = 30
  ) {
    let url = `${this._apiUrl}driver-vin-association`;
    const params: { [key: string]: string } = {};

    if (consumerid) params['consumerId'] = consumerid;
    if (fleetId) params['fleetId'] = fleetId;
    if (groupId) params['groupId'] = groupId;

    params['pageNo'] = pageNo.toString();
    params['pageSize'] = pageSize.toString(); // <-- added

    const queryString = new URLSearchParams(params).toString();
    if (queryString) url += `?${queryString}`;

    return this.http.get(url);
  }



  getAssignDriverOnly(consumerId?: string, fleetId?: string) {
    return this.http.get(this._apiUrl + `driver?consumerId=${consumerId}&fleetId=${fleetId}`)
  }
  saveDriverVinAssociation(driverId: number, vin: string): Observable<any> {
    const requestBody = {
      driverId: driverId,
      vin: vin
    };

    // Send the request to the backend API
    return this.http.post(this.smApiUrl + '/driver-vin-association', requestBody);
  }

  uploadDriverToAPI(data: any[]): Observable<any> {
    let apiUrl = `${this._apiUrl}driver/bulk`;
    return this.http.post(apiUrl, data);
  }

  uploadAssignDriver(data: any[],consumer): Observable<any> {
    let apiUrl ;
    if(consumer) {
      apiUrl = `${this._apiUrl}driver-vin-association/bulk?consumerName=${consumer}`
    } else {
      apiUrl = `${this._apiUrl}driver/bulk`
    }
    return this.http.post(apiUrl, data);
  }
  // Update driver method
  updateDriver(id: string, payload: any): Observable<any> {
    const apiUrl = `${this._apiUrl}driver/${id}`;
    return this.http.put(apiUrl, payload);
  }

  deleteDriver(id: string) {
    const url = `${this._apiUrl}driver/delete/${id}`;
    return this.http.delete(url);
  }

  deleteDriverAssociation(id: string) {
    const url = `${this._apiUrl}driver-vin-association/delete/${id}`;
    return this.http.delete(url);
  }
  getAllfailureReason() {
    return this.http.get(this._apiUrl + 'manage-vehicle/enrollment-failure-reason')
  }

  postFaq(question: string, answer: string): Observable<any> {
    const body = { question, answer };
    return this.http.post<any>(`${this._apiUrl}faq`, body);
  }

  getFaqQuestionAnswer() {
    return this.http.get(this._apiUrl + 'faq/all')
  }

  deleteFaq(faqId: number) {
    return this.http.delete(this._apiUrl+ `faq/${faqId}`);
  }

    // Update FAQ
    updateFaq(faqId: number, payload: any): Observable<any> {
      return this.http.put(this._apiUrl + `faq/${faqId}`, payload);
    }

// Collision First API
collsionReportData(consumer: string, fleetId: string, groupId: string, timeFrame?: string){
  const apiUrl = this._apiUrl + `collision-summary`;
  const body: { [key: string]: string } = {
    timeFrame: timeFrame || 'monthly',
  };
  if (consumer && consumer !== 'All') {
    body.consumer = consumer;
  }
  if (fleetId) {
    body.fleetId = fleetId;
  }
  if (groupId) {
    body.groupId = groupId;
  }
  return this.http.post(apiUrl, body);
}

collisionMonthlyTrends(consumer, fleetId, groupId, noOfMonths) {
  let apiUrl = `${this._apiUrl}monthly/collision-summary-trend`;
  if (consumer === 'All') {
    if (noOfMonths) {
      apiUrl += `?noOfMonths=${noOfMonths}`;
    }
  } else {
    apiUrl += `?consumer=${consumer}`;
    if (fleetId) {
      apiUrl += `&fleetId=${fleetId}`;
    }
    if (groupId) {
      apiUrl += `&groupId=${groupId}`;
    }
    if (noOfMonths) {
      apiUrl += `&noOfMonths=${noOfMonths}`;
    }
  }

  return this.http.get(apiUrl);
}
collsionReportDownload(
  consumer: string,
  vin: string,
  eventDate: string,
  eventTime: string,
  tripId: string,
  eventType: string,
  eventLocation: string,
  eventLat: number,
  eventLong: number
) {
  const apiUrl = this._apiUrl + `collision-event-report`;
  const body = {
    consumer,
    vin,
    eventDate,
    eventTime,
    tripId,
    eventType, // Make sure this corresponds to "event" in your JSON
    eventLocation,
    eventLat, // Ensure it's sent correctly
    eventLong  // Ensure it's sent correctly
  };
  return this.http.post(apiUrl, body);
}

  maintenanceSummaryData(consumer: string, fleetId: string, groupId:string, noOfMonths?: string) {
    const apiUrl = this._apiUrl + `dtc-summary`;
    const body: { [key: string]: string } = {
      noOfMonths: noOfMonths || '1',
    };
    if (consumer && consumer !== 'All') {
      body.consumer = consumer;
    }
    if (fleetId) {
      body.fleetId = fleetId;
    }
    if (groupId) {
      body.groupId = groupId;
    }
    return this.http.post(apiUrl, body);
  }
  dtccountbyVehicleData(consumer: string, fleetId: string, groupId:string, noOfMonths) {
    const apiUrl = this._apiUrl + `dtc-count-by-vehicle  `;
    const body: { [key: string]: string } = {
      noOfMonths: noOfMonths,
    };
    if (consumer && consumer !== 'All') {
      body.consumer = consumer;
    }
    if (fleetId) {
      body.fleetId = fleetId;
    }
    if (groupId) {
      body.groupId = groupId;
    }

    return this.http.post(apiUrl, body);
  }
  dtcTypeData(consumer: string, fleetId: string, groupId:string, noOfMonths) {
    const apiUrl = this._apiUrl + `dtc-type/count`;
    const body: { [key: string]: string } = {
      noOfMonths: noOfMonths,
    };
    if (consumer && consumer !== 'All') {
      body.consumer = consumer;
    }
    if (fleetId) {
      body.fleetId = fleetId;
    }

    if (groupId) {
      body.groupId = groupId;
    }

    return this.http.post(apiUrl, body);
  }
  dtceventCount(consumer: string, fleetId: string, groupId: string, noOfMonths) {
    const apiUrl = this._apiUrl + `dtc-status-count-trend`;
    const body: { [key: string]: string } = {
      noOfMonths: noOfMonths,
    };
    if (consumer && consumer !== 'All') {
      body.consumer = consumer;
    }
    if (fleetId) {
      body.fleetId = fleetId;
    }
    if (groupId) {
      body.groupId = groupId;
    }

    return this.http.post(apiUrl, body);
  }
    dtcEventRate(consumer: string, fleetId: string, groupId:string, noOfMonths) {
      const apiUrl = this._apiUrl + `dtc-count-by-miles-driven`;
      const body: { [key: string]: string } = {
        noOfMonths: noOfMonths,
      };
      if (consumer && consumer !== 'All') {
        body.consumer = consumer;
      }
      if (fleetId) {
        body.fleetId = fleetId;
      }
      if (groupId) {
        body.groupId = groupId;
      }
      return this.http.post(apiUrl, body);
    }

  adasDetailCount(consumer: string, fleetId: string, groupId:string, noOfMonths) {
    const apiUrl = this._apiUrl + `ADAS/warning/count`;
    const body: { [key: string]: string } = {
      noOfMonths: noOfMonths,
    };
    if (consumer && consumer !== 'All') {
      body.consumer = consumer;
    }
    if (fleetId) {
      body.fleetId = fleetId;
    }

    if (groupId) {
      body.groupId = groupId;
    }

    return this.http.post(apiUrl, body);
  }

  monthlyTrendsForAdasWarning(consumer: string, fleetId: string, groupId:string, noOfMonths) {
    const apiUrl = this._apiUrl + `ADAS/warning/summary/count/month`;
    const body: { [key: string]: string } = {
      noOfMonths: noOfMonths,
    };
    if (consumer && consumer !== 'All') {
      body.consumer = consumer;
    }
    if (fleetId) {
      body.fleetId = fleetId;
    }
    if (groupId) {
      body.groupId = groupId;
    }
    return this.http.post(apiUrl, body);
  }

  monthlyTrendsForAdasWarningPerMile(consumer: string, fleetId: string, groupId:string, noOfMonths) {
    const apiUrl = this._apiUrl + `ADAS/warning/per-miles/count/month`;
    const body: { [key: string]: string } = {
      noOfMonths: noOfMonths,
    };
    if (consumer && consumer !== 'All') {
      body.consumer = consumer;
    }
    if (fleetId) {
      body.fleetId = fleetId;
    }
    if (groupId) {
      body.groupId = groupId;
    }
    return this.http.post(apiUrl, body);
  }
  // Function to make the POST request
  getWarningSummary(
    consumer: string,
    fleetId: string,
    groupId: string,
    noOfMonths: number,
    currentPage?: number,
    pageSize?: number
  ): Observable<any> {
    let apiUrl = `${this._apiUrl}ADAS/warning/summary`;

    // Add pagination parameters to the URL if provided
    if (currentPage !== undefined && pageSize !== undefined) {
      apiUrl += `?currentPage=${currentPage}&pageSize=${pageSize}`;
    }

    // Prepare request body with other parameters
    const body = {
      noOfMonths: noOfMonths,
      consumer: consumer !== 'All' ? consumer : undefined,
      fleetId: fleetId || undefined,
      groupId: groupId,
    };

    return this.http.post(apiUrl, body);
  }

  // In Fuel Summary Top Level View
  getFuelTopSummary(
    consumer: string,
    fleetId: string | null,
    groupId: string | null,
  ) {
    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const apiUrl = this.event_url + `us-summary/fuel-summary?${queryString}`;

    return this.http.get(apiUrl);
  }

  // In Safety Card Top Level View
  getSafetyTopLevel(
    consumer: string,
    fleetId: string | null,
    groupId: string | null,
  ) {
    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }

    if (groupId) {
      params.groupId = groupId;
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const apiUrl = this.event_url + `us-summary/safety/driver-behaviour/event-summary?${queryString}`;

    return this.http.get(apiUrl);
  }

   // In Safety Card Top Level View
   getTopFleetSummary(
    consumer: string,
    fleetId: string | null,
    groupId: string | null,
  ) {
    const params: { [key: string]: string } = {};

    if (consumer && consumer !== 'All') {
      params.consumer = consumer;
    }
    if (fleetId) {
      params.fleetId = fleetId;
    }
    if (groupId) {
      params.groupId = groupId;
    }

    const queryString = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const apiUrl = this.event_url + `us-summary/fleet-stats?${queryString}`;

    return this.http.get(apiUrl);
  }

  // TimeZone API
  getTimeZone() {
      return this.http.get(this._apiUrl + 'timezone/all')
  }
  saveTimezone(formData: any): Observable<any> {
    return this.http.post(this._apiUrl + 'timezone', formData);
  }
  getTimeZones() {
    return this.http.get(this._apiUrl + 'timezone/emailId')
}

getserviceCategory(
  consumer: string,
  fleetId: string | null,

) {
  const params: { [key: string]: string } = {};

  if (consumer && consumer !== 'All') {
    params.consumer = consumer;
  }
  if (fleetId) {
    params.fleetId = fleetId;
  }

  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const apiUrl = this.event_url + `us-summary/fleet-stats?${queryString}`;

  return this.http.get(apiUrl);
}

// Srvice Reminder API

getServiceRemindersSummary(consumerId: string | null, fleetId: string, groupId: null,) {
  const body: any = {};

  if (consumerId && consumerId !== 'All') {
    body.consumerId = consumerId;
  }
  if (fleetId) {
    body.fleetId = fleetId;
  }
  if (groupId) {
    body.groupId = groupId;
  }
  const apiUrl = this._apiUrl + 'service-reminders-summary';

  return this.http.post(apiUrl, body);
}


// Get Service Category

getserviceReminderCategory(
  consumer: string,
  fleetId: string | null,
) {
  const params: { [key: string]: string } = {};

  if (consumer && consumer !== 'All') {
    params.consumer = consumer;
  }
  if (fleetId) {
    params.fleetId = fleetId;
  }

  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const apiUrl = this._apiUrl + 'service-category' + (queryString ? `?${queryString}` : '');

  return this.http.get(apiUrl);
}


getServiceTasksByCategory(categoryId: number) {
  const apiUrl = this._apiUrl + 'service-task';
  const params = new HttpParams().set('categoryId', categoryId.toString());
  return this.http.get<{ serviceTasks: { id: number; name: string }[] }>(apiUrl, { params });
}

// add service
addServiceReminder(payload: any) {
  return this.http.post(`${this._apiUrl}service-reminder`, payload);
}

// get all the list
createServiceReminder(data: any) {
  let params = new HttpParams();

  if (data.consumerId) {
    params = params.set('consumerId', data.consumerId);
  }
  if (data.fleetId) {
    params = params.set('fleetId', data.fleetId);
  }
  if (data.categoryId) {
    params = params.set('categoryId', data.categoryId);
  }
  if (data.taskId) {
    params = params.set('taskId', data.taskId);
  }
  if (data.status) {
    params = params.set('status', data.status);
  }

  const url = `${this._apiUrl}service-reminders`;

  return this.http.post(url, null, { params });
}

getServiceReminderData(
  consumerId: string,
  fleetId: string | null,
  groupId: string | null,
) {
  const body: any = {};

  if (consumerId && consumerId !== 'All') {
    body.consumerId = consumerId;
  }
  if (fleetId) {
    body.fleetId = fleetId;
  }

  if (groupId) {
    body.groupId = groupId;
  }
  const apiUrl = this._apiUrl + 'service-reminders';

  return this.http.post(apiUrl, body);
}

// Service History Count
getServiceHistorySummary(consumerId: string | null, fleetId: string | null,groupId: string | null) {
  const apiUrl = this._apiUrl + 'service-history-summary';
  const body: { [key: string]: any } = {};

  if (consumerId && consumerId !== 'All') {
    body.consumerId = consumerId;
  }

  if (fleetId) {
    body.fleetId = fleetId;
  }
  if (groupId) {
    body.groupId = groupId;
  }

  return this.http.post(apiUrl, body);
}

// PATCH API RESOLVE
resolveService(id: string, resolveDateTime?: string) {
  const body = {
    resolveDateTime: resolveDateTime || ''
  };

  return this.http.post(`${this._apiUrl}resolve-service/${id}`, body);
}

// Deliete reminders API
deleterReminder(id: string) {
  const url = `${this._apiUrl}delete-service-reminder/${id}`;
  return this.http.delete(url);
}

//update service reminder
updateServiceReminder(payload: any): Observable<any> {
  return this.http.put(`${this._apiUrl}update/service-reminder`, payload);
}


toggleNotification(id: number, enable: boolean): Observable<any> {
  const url = `${this._apiUrl}service-reminders/notification/${id}?enable=${enable}`;
  return this.http.put(url, {}); // empty body
}

getServiceHistoryData(
  consumerId: string,
  fleetId: string | null,
  groupId: string | null,
) {
  const body: any = {};

  if (consumerId && consumerId !== 'All') {
    body.consumerId = consumerId;
  }
  if (fleetId) {
    body.fleetId = fleetId;
  }
  if (groupId) {
    body.groupId = groupId;
  }
  const apiUrl = this._apiUrl + 'service-history';

  return this.http.post(apiUrl, body);
}

  getReportList() {
    return this.http.get(this._apiUrl + 'get-schedule-report' )
  }

  addFilteredReport(body) {
    return this.http.post(this._apiUrl + 'save-schedule-report',body)

  }
    updateFilteredReport(body,id) {
      return this.http.put(this._apiUrl + `update-schedule-report/${id}`,body)

    }

    deleteScheduleReport(id: string) {
      const url = `${this._apiUrl}delete-schedule-report/${id}`;
      return this.http.delete(url);
    }

updateReportService(payload: any): Observable<any> {
  return this.http.put(`${this._apiUrl}update/service-reminder`, payload);
}
updateHistoryService(id: number, date: string): Observable<any> {
  const body = { resolveDateTime: date };
  return this.http.put(`${this._apiUrl}service-history/completion-date/${id}`, body);
}

// Individual ping API
getTripData(vin: string, tripId: string) {
  const body = { vin,tripId};
  return this.http.post(`${this.event_url}us-summary/trip-data`, body);
}

getUser() {
  return this.http.get(this._apiUrl + `cms/user/all-users`)
}
getUserForadmin(consumer: any) {
  return this.http.get(this._apiUrl + `cms/user/all-users?consumer=${consumer}`)
}
getGroupList(groupId) {
  return this.http.get(this._apiUrl + `fleets/organization-sub-group/${groupId}`)
}
getGroupLists() {
  return this.http.get(this._apiUrl + `fleets/organization-sub-group}`)
}

getGroupListData(consumer: string = '', fleetId: string = '', groupId: string = '') {
  const url = `${this._apiUrl}fleets/organization-sub-group`;

  const params = {
    consumer,
    fleetId,
    groupId
  };

  return this.http.get(url, { params });
}


addUser(body) {
  return this.http.post(this._apiUrl + `cms/user/create-user`,body)
}

deleteUserData(emailId) {
  return this.http.delete(this._apiUrl + `account/user/${emailId}`)
}

editUserData(body,emailId) {
  let param = new HttpParams().set('emailId',emailId)
  return this.http.put(this._apiUrl + 'cms/user/update-name',body,{params:param})
}

getFleetById(fleetId) {
  return this.http.get(this._apiUrl + `fleets/get-name/${fleetId}`)
}

// Delete new geofence by Id
  // for geofence
  getAllGeoFence(consumer?: string, fleetId?: string, groupId?:string) {
    // Base API URL
    let url = `${this._apiUrl}places/geofence`;

    // Object to hold query parameters
    const params: { [key: string]: string } = {};

    // Add 'consumer' to params if it's provided and not 'All'
    if (consumer && consumer !== 'All') {
      params['consumer'] = consumer;
    }

    // Add 'fleetId' to params if it's provided
    if (fleetId) {
      params['fleetId'] = fleetId;
    }
    if (groupId) {
      params['groupId'] = groupId;
    }
    // Construct the query string if there are parameters
    const queryString = new URLSearchParams(params).toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    // Make the HTTP GET call
    return this.http.get(url);
  }
  // Get All VIN
  getGeofenceAssociations(geofenceId: number): Observable<any> {
    const url = `${this._apiUrl}geofence-association/all/${geofenceId}/vins`;
    return this.http.get(url);
  }

  // Get Associated VIN
  addGeofenceAssociations(geofenceId: number, vehicles: { vinId: number }[]) {
    const url = `${this._apiUrl}geofence-association/add/${geofenceId}`;
    return this.http.post(url, vehicles);
  }

  // Get Associated VIN
  getAllAssociatedVin(geofenceId: number): Observable<any> {
    const url = `${this._apiUrl}geofence-association/associated/${geofenceId}/vins`;
    return this.http.get(url);
  }

  // Get Standalone Geofences
  getStandaloneGeofences(fleetId: string): Observable<any> {
    const url = `${this.smApiUrl}/geofence/standalone?fleetId=${fleetId}`;
    return this.http.get(url);
  }

  // Map VIN to Standalone Geofence
  mapVinToGeofence(payload: any): Observable<any> {
    const url = `${this.smApiUrl}/geofence/vin/mapping`;
    return this.http.post(url, payload);
  }

  // Get Geofence Events with Pagination
  getGeofenceEvents(geofenceId: number, page: number = 0, size: number = 20): Observable<any> {
    const url = `${this.smApiUrl}/geofence/${geofenceId}/events?page=${page}&size=${size}`;
    return this.http.get(url);
  }

  // Get Geofence Events filtered by VIN (optional date range) with pagination
  getGeofenceEventsByVin(
    geofenceId: number,
    vin: string,
    startDate?: string,
    endDate?: string,
    page: number = 0,
    size: number = 20
  ): Observable<any> {
    const url = `${this.smApiUrl}/geofence/${geofenceId}/events`;
    let params = new HttpParams()
      .set('vin', vin)
      .set('page', page.toString())
      .set('size', size.toString());
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get(url, { params });
  }

  // Get Geofence Vehicle Statistics (with optional VIN filter)
  getGeofenceVehicleStatistics(
    geofenceId: number,
    startDate?: string,
    endDate?: string,
    vin?: string
  ): Observable<any> {
    const url = `${this.smApiUrl}/geofence-tracking/${geofenceId}/vehicle-statistics`;
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (vin) {
      params = params.set('vin', vin);
    }
    return this.http.get(url, { params });
  }

  // Create Standalone Geofence
  createStandaloneGeofence(data: any): Observable<any> {
    const url = `${this.smApiUrl}/geofence`;
    return this.http.post(url, data);
  }

  // Delete GEOFENCE

deleteGeofenceNew(id: string) {
  const url = `${this._apiUrl}geofence-new/${id}`;
  return this.http.delete(url);
}

getFleetGroups(fleetId?: number, consumer?: string, groupId?: string): Observable<any> {
  let url = `${this._apiUrl}cms/fleet/get-groups`;

  const queryParams: string[] = [];
  if(sessionStorage.getItem('userRole') == 'role_user_fleet') {
    let fleetId=JSON.parse(sessionStorage.getItem('fleetUserId'))
    url = url+'/'+fleetId
  }

  if (fleetId) {
    queryParams.push(`fleetId=${fleetId}`);
  }
  if (groupId) {
    queryParams.push(`groupId=${groupId}`);
  }

  if (consumer) {
    queryParams.push(`consumer=${encodeURIComponent(consumer)}`);
  }

  if (queryParams.length) {
    url += `?${queryParams.join('&')}`;
  }

  return this.http.get(url);
}
getFleetGroupss(fleetId?: number, consumer?: string): Observable<any> {
  let url = `${this._apiUrl}cms/fleet/group-hierarchy`;

  const queryParams: string[] = [];
  if(sessionStorage.getItem('userRole') == 'role_user_fleet') {
    let fleetId=JSON.parse(sessionStorage.getItem('fleetUserId'))
    url = url+'/'+fleetId
  }

  if (fleetId) {
    queryParams.push(`fleetId=${fleetId}`);
  }

  if (consumer) {
    queryParams.push(`consumer=${encodeURIComponent(consumer)}`);
  }

  if (queryParams.length) {
    url += `?${queryParams.join('&')}`;
  }

  return this.http.get(url);
}

updateFleetGroup(groupId: number, name: string, parentGroupId: number | null): Observable<any> {
  const url = `${this._apiUrl}cms/fleet/update-group/${groupId}`;
  const body = { name, parentGroupId };
  return this.http.put(url, body);
}

deleteGroup(groupId: string): Observable<any> {
  const url = `${this._apiUrl}cms/fleet/delete-sub-group/${groupId}`;
  return this.http.delete(url);
}

getgroupVINLists(consumer: string, fleetId: number, groupId?: number) {
  let url = `${this._apiUrl}vindetails/by-fleet-group?consumer=${consumer}&fleetId=${fleetId}`;
  if (groupId) {
    url += `&groupId=${groupId}`;
  }
  return this.http.get(url);
}

assignVIN(body) {
  return this.http.post(this._apiUrl + 'cms/fleet/assign-vin-to-groups',body)
}

getGroups() {
  console.log(sessionStorage.getItem('userRole'),'dckjfbehbfvhvhuvsy')
  if(sessionStorage.getItem('userRole') == 'role_user_fleet') {
    let fleetId=JSON.parse(sessionStorage.getItem('fleetUserId'))
    console.log(fleetId)
    return this.http.get(this._apiUrl + 'cms/fleet/get-groups/'+fleetId)

  } else {
    return this.http.get(this._apiUrl + 'cms/fleet/get-groups')
  }
}


addGroups(payload: any): Observable<any> {
  return this.http.post(this._apiUrl + 'cms/fleet/add-groups', payload);
}

getImage() {
  return this.http.get(this._apiUrl + 'cms/fleet/consumer/logo')
}

getReported(id) {
  return this.http.get(this._apiUrl + `eligibility-reports/${id}/report-items`)
}

getBulk() {
  return this.http.get(this._apiUrl + 'eligibility-reports')
}

bulkvinUpload(data) {
  return this.http.post(this._bulkUrl + 'bulk-eligibility-check', data)
}

gettData(id) {
  return this.http.get(this._bulkUrl + `vin/count/report/${id}`)
}

downloadgettData(id) {
  return this.http.get(this._apiUrl + `eligibility-reports/bulk-vin-summary/${id}`)
}


downLoadEligibleReport(reportId) {
  return this.http.get(this._bulkUrl +  `eligibility-reports/${reportId}`)
}

getAllFleetList(searchData?:any) {
  if(searchData) {
    let param = new HttpParams().set('request',searchData);
    return this.http.get(this._apiUrl + 'cms/fleet',{params:param})
  } else {
    return this.http.get(this._apiUrl + 'cms/fleet')
  }
}

updateNotificationAlerts(fleetId: number, groupId: number, body: any): Observable<any> {
  const endpoint = `${this._apiUrl}cms/fleet/setting`;

  let params = new HttpParams();
  if(fleetId) {
    params = params.append('fleetId', fleetId)
  }
  if(groupId) {
    params = params.append('groupId', groupId)
  }
    // .set('fleetId', fleetId)
    // .set('groupId', groupId); // If groupId is same as fleetId; change if different

  return this.http.put<any>(endpoint, body, { params });
}

// getGeofencebyVIN(body){
//     return this.http.get(this._apiUrl + 'geofence-new/filter-by-vin',body)
// }

getGeofencebyVIN(vin: string) {
  const apiUrl = `${this._apiUrl}geofence-new/filter-by-vin`;
  const body = { vin };
  return this.http.post(apiUrl, body);
}
getAlerts(customer) {
  let url = `${this._apiUrl}alert`
  if(customer) {
    url += `?consumer=${customer}`
  }
  return this.http.get(url)
}
getEvents(page,size,customer?,vins?,alertDescriptions?,groupId?,fleetId?) {
  let url = `${this._apiUrl}alert`
  let body:any = {
    "page": page,
    "size": size
  }
  if(vins) {
    body['vinList'] = [vins]
  }
  if(alertDescriptions) {
    body['alertDescriptions'] = [alertDescriptions]
  }
  if(customer) {
    body['consumer']=customer
  }
  if(groupId) {
    body['groupId']=groupId
  }
  if(fleetId) {
    body['fleetId']=fleetId
  }
  return this.http.post(url,body)
}
bulkGeofence(file,consumer?) {
  let fileUpload = new FormData();
  fileUpload.append('file',file);
  let url = `${this._apiUrl}geofence-new/upload-excel`;
  if(consumer && consumer != 'All') {
    url += `?consumer=${consumer}`
  }
  return this.http.post(url, fileUpload);
}

getTripId(vin,time) {
  return this.http.get(`${this._apiUrl}light-metrics/${vin}/${time}`)
}

// get Location type
getLocationTypes(consumer: string, fleetId?: string, groupId?: string) {
  let url = `${this._apiUrl}geofence-new/location-type`;

  if (consumer === 'All') {
    return this.http.get(url);
  }

  let params = new HttpParams().set('consumer', consumer);
  if (fleetId) params = params.set('fleetId', fleetId);
  if (groupId) params = params.set('groupId', groupId);

  return this.http.get(url, { params });
}
//add by vinod this method
getDriverById(driverId: any): Observable<any> {
  return this.http.get(this._apiUrl + `driver/${driverId}`)
}
fetchAlertList(
  filters: any = {},
  fromDate:any,
  toDate:any,
  categories: string[] = [], // default to driver
  page: number = 0,
  size: number = 10,
): Observable<any> {
  // Start building the base URL

  let url = `${this.smApiUrl}/alerts-v2?page=${page}&size=${size}`;

  // Append categories if provided
  if (categories.length > 0) {
    const categoryParams = categories.map(cat => `category=${encodeURIComponent(cat)}`);
    url += `&${categoryParams.join('&')}`;
  }

  // Add filter-based parameters
  const params: string[] = [];

  if (filters.status) {
    params.push(`status=${encodeURIComponent(filters.status)}`);
  }
  if (filters.driverId) {
    params.push(`driverId=${encodeURIComponent(filters.driverId)}`);
  }
  if (filters.fleetId) {
    params.push(`fleetId=${encodeURIComponent(filters.fleetId)}`);
  }
  if (filters.vin) {
    params.push(`vin=${encodeURIComponent(filters.vin)}`);
  }

  if (fromDate) {
    params.push(`from=${fromDate}`);
  }
  if (toDate) {
    params.push(`to=${toDate}`);
  }

  if (params.length > 0) {
    url += '&' + params.join('&');
  }

  // Perform GET request
  return this.http.get<any>(url);
}
aiChatBot(
  userQuery: string
): Observable<any> {
  const smApiUrl = environment.url.SM_API_URL;
  let apiUrl = `${smApiUrl}/chatbot-alert/query`;
  // Prepare request body with other parameters
  const body = {
    userQuery: userQuery,

  };

  return this.http.post(apiUrl, body);
}
// new


acknowledgeAlert(alertId: string): Observable<any> {
  const url = `${this.smApiUrl}/alerts-v2/${alertId}/status`;
  const body = {"status": "acknowledge"};
  return this.http.put(url, body);
}
getConsumerDataLists(page?, size?,vin?, consumer?, fleetId?, oem?, sortStatus?,) {
  //   let param = new HttpParams()
  //     .set('page', (page ? page - 1 : 0).toString())
  //     .set('size', (size ? size.toString() : '10'))
  //     .set('consumer', consumer ? consumer : '')
  //     .set('fleetId', fleetId ? fleetId : '')
  //     .set('provider', oem ? oem : '')

  //   return this.http.get<any>(`${this._apiUrl}manage-vehicle/enrollment`, { params: param });
  // }
  let param = new HttpParams().set('page', page - 1).set('size', size)
  if (vin) {
    param = param.append('vin', vin);
  }
  if (consumer) {
    param = param.append('consumer', consumer);
  }
  if (fleetId) {
    param = param.append('fleetId', fleetId);
  }
  if (oem) {
    param = param.append('provider', oem);
  }
  if (sortStatus) {
    param = param.append('status', sortStatus);
  }
  return this.http.get(this._apiUrl + 'manage-vehicle/enrollment', { params: param })
  }
getVehicleBasicInfo() {
  return this.http.get<any[]>(`${this.smApiUrl}/vehicle/basic-info`);
}

// Fleet Weights API for Driver Safety Score
initializeFleetWeights(fleetId: string, payload: any): Observable<any> {
  const url = `${this.smApiUrl}/fleet-weights/initialize?fleetId=${fleetId}`;
  return this.http.post<any>(url, payload);
}

getFleetWeights(fleetId: string): Observable<any> {
  const url = `${this.smApiUrl}/fleet-weights/${fleetId}`;
  return this.http.get<any>(url);
}
deleteAssociation(transitionId: number): Observable<any> {
    // Using v2 API for driver-vin disassociation
    return this.http.delete(`${this.api_url}v2/driver-vin-association/delete/${transitionId}`, {
    });
  }

  // Disassociate driver from vehicle by vinId
  disassociateDriverFromVehicle(vin: string): Observable<any> {
    // Using v1 API endpoint for disassociation by VIN
    return this.http.delete(`${this.smApiUrl}/driver-vin-association/vin/${vin}`);
  }

  // DVIR API Methods

  /**
   * Get DVIR list with optional filters
   * @param fleetId - Fleet ID
   * @param page - Page number (default: 1)
   * @param pageSize - Page size (default: 20)
   * @param vin - Optional VIN filter
   * @param inspectionType - Optional inspection type filter (pre-trip, post-trip)
   * @param linkingStatus - Optional linking status filter (linked, unlinked)
   */
  getDVIRList(
    fleetId: string,
    page: number = 1,
    pageSize: number = 20,
    vin?: string,
    inspectionType?: string,
    linkingStatus?: string,
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    let params = `?fleetId=${fleetId}&page=${page}&pageSize=${pageSize}`;

    if (vin) {
      params += `&vin=${vin}`;
    }
    if (inspectionType) {
      params += `&inspectionType=${inspectionType}`;
    }
    if (linkingStatus) {
      params += `&linkingStatus=${linkingStatus}`;
    }
    // if (startDate) {
    //   params += `&startDate=${startDate}`;
    // }
    // if (endDate) {
    //   params += `&endDate=${endDate}`;
    // }

    return this.http.get(`${this.smApiUrl}/dvir${params}`);
  }

  /**
   * Get DVIR checklist items
   */
  getDVIRChecklistItems(): Observable<any> {
    return this.http.get(`${this.smApiUrl}/dvir/checklist-items`);
  }

  /**
   * Get DVIR detail by ID
   * @param dvirId - DVIR ID
   */
  getDVIRDetail(dvirId: string): Observable<any> {
    return this.http.get(`${this.smApiUrl}/dvir/${dvirId}`);
  }

  /**
   * Get DVIR video view URL
   * @param dvirId - DVIR ID
   */
  getDVIRVideoUrl(dvirId: string): Observable<any> {
    return this.http.get(`${this.smApiUrl}/dvir/${dvirId}/video/view-url`);
  }

  /**
   * Create a new DVIR
   * @param payload - DVIR data
   */
  createDVIR(payload: any): Observable<any> {
    return this.http.post(`${this.smApiUrl}/dvir`, payload);
  }

  /**
   * Update DVIR
   * @param dvirId - DVIR ID
   * @param payload - Updated DVIR data
   */
  updateDVIR(dvirId: string, payload: any): Observable<any> {
    return this.http.put(`${this.smApiUrl}/dvir/${dvirId}`, payload);
  }

  /**
   * Delete DVIR
   * @param dvirId - DVIR ID
   */
  deleteDVIR(dvirId: string): Observable<any> {
    return this.http.delete(`${this.smApiUrl}/dvir/${dvirId}`);
  }

  /**
   * Link DVIR to trip
   * @param dvirId - DVIR ID
   * @param tripId - Trip ID
   */
  linkDVIRToTrip(dvirId: string, tripId: string): Observable<any> {
    return this.http.post(`${this.smApiUrl}/dvir/${dvirId}/link`, { tripId });
  }

  /**
   * Unlink DVIR from trip
   * @param dvirId - DVIR ID
   */
  unlinkDVIRFromTrip(dvirId: string): Observable<any> {
    return this.http.post(`${this.smApiUrl}/dvir/${dvirId}/unlink`, {});
  }

}
