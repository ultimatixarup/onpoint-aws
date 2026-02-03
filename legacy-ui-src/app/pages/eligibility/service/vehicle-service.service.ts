import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehicleServiceService {
  _apiUrl = environment.url.BASE_URL
  _bulkUrl = environment.url.Bululk_eligibility

  constructor(private http: HttpClient) { }

  eligibilityCheck(vin){
    return this.http.post(this._apiUrl + `enroll/check-eligibility/${vin}`,{})
  }

  // for ford pro bulk

getConditions() {
  return this.http.get(this._apiUrl + 'voyo-test/ford-pro-eligible')
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

  vinDecode(data) {
    const payload = new HttpParams()
      .set('DATA', data)
      .set('format', 'JSON');

    // Replace the following URL with your actual endpoint for decoding VINs
    const decodeURL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVINValuesBatch/';

    // Make the HTTP post request to the NHTSA API
    return this.http.post(decodeURL, payload, { responseType: 'json' });
  }

}
