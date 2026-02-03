import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import jwt_decode from "jwt-decode";
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })

export class AuthenticationService implements OnDestroy {
   private _authLoginUrl: any = environment.url.BASE_URL;;
   userData: any;
   isLoggedIn = false;
   adminData: any;
   providerData: any;
   consumerData: any;
   subjectName = new Subject<any>();
   token: any;
   private apiKey = 'AIzaSyDySexTXKB3Syxg_1eHOf7cuMljEnKb8us'; // Replace with your Google Maps API key
   private apiUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
   constructor(private http: HttpClient, private router: Router) {
      window.addEventListener('storage', this.handleStorageEvent, false);
      this.requestSyncSessionStorage();
   }

   getAddress(latitude: number, longitude: number): Observable<any> {
      return this.http.get(`${this.apiUrl}?latlng=${latitude},${longitude}&key=${this.apiKey}`);

    }


   logOut(value) {
      return this.http.post(this._authLoginUrl + 'account/signout', value).subscribe((res) => {
         sessionStorage.clear();
         localStorage.clear()
         window.localStorage.setItem('CREDENTIALS_FLUSH', Date.now().toString())
         window.localStorage.removeItem('CREDENTIALS_FLUSH')
         this.router.navigate(['/']);
      }, err => {
         sessionStorage.clear();
         localStorage.clear()
         window.localStorage.setItem('CREDENTIALS_FLUSH', Date.now().toString())
         window.localStorage.removeItem('CREDENTIALS_FLUSH')
         this.router.navigate(['/']);
      });
   }

   trialVersion(data) {
      return this.http.post(this._authLoginUrl + 'trial-account-request', data);
   }

   getCredential() {
      return this.http.get(this._authLoginUrl + 'app-client-credentials')
   }
   getsessionStorageUser() {
      this.userData = JSON.parse(sessionStorage.getItem("user-token"));
      if (this.userData !== null) {
         var token = this.userData.idToken;
         var User = jwt_decode(token);
         var userLength: any = User["cognito:groups"].length;
         for (let i = 0; i < userLength; i++) {
            if (User["cognito:groups"][i].includes("_CONSUMER")) {
               return true;
            }
            else if (User["cognito:groups"][0].includes("_USER")) {
               return true;

            }
            else if (User["cognito:groups"][0].includes("_ADMIN")) {
               return true;

            }
            else if (User["cognito:groups"][0].includes("_LG")) {
               return true;

            }
            else if (User["cognito:groups"][0].includes("_SALES")) {
               return true;

            } else if (User["cognito:groups"][0].includes("_DRIVER")) {
               return true;

            }else if (User["cognito:groups"][0].includes("_ORG")) {
            return true;

         }
         }

      }

   }
   getsessionStorageAdmin() {
      this.adminData = JSON.parse(sessionStorage.getItem('admin_token'));
      if (this, this.adminData !== null) {
         var token = this.adminData.idToken;
         var loginUser = jwt_decode(token);
         var userLength: any = loginUser["cognito:groups"].length;
         for (let i = 0; i < userLength; i++) {
            if (loginUser["cognito:groups"][i].includes("_ADMIN")) {
               return true;
            }
         }
      }

   }
   getsessionStorageProvider() {
      this.providerData = JSON.parse(sessionStorage.getItem('user-token'));
      if (this, this.providerData !== null) {
         var token = this.providerData.idToken;
         var loginUser: any = jwt_decode(token);
         sessionStorage.setItem('emailid', JSON.stringify(loginUser.email))
         var userLength: any = loginUser["cognito:groups"].length;
         for (let i = 0; i < userLength; i++) {
            if (loginUser["cognito:groups"][i].includes("_PROVIDER")) {
               return true;
            }
         }

      }

   }


   handleStorageEvent = (event: StorageEvent): void => {
      if (event.key === 'requestSyncSessionStorage') {
         localStorage.setItem('sessionStorage', JSON.stringify(sessionStorage));
         localStorage.removeItem('sessionStorage');
      } else if (event.key === 'sessionStorage') {
         const sessionStorage = JSON.parse(event.newValue || '{}');
         for (const key in sessionStorage) {
            window.sessionStorage.setItem(key, sessionStorage[key]);
         }
      } else if(event.key === 'CREDENTIALS_FLUSH'){
         window.sessionStorage.clear()
     }
   };

   requestSyncSessionStorage(): void {
      if (!sessionStorage.length) {
         const current = new Date().toLocaleTimeString();
         localStorage.setItem(
            'requestSyncSessionStorage',
            'request session storage' + current
         );
      }
   }

   ngOnDestroy(): void {
      window.removeEventListener('storage', this.handleStorageEvent, false);
   }



   sendDataToChildComponent(data: any) {

      this.subjectName.next(data);

   }


   addverification(data) {
      return this.http.post(this._authLoginUrl + 'eligibility-reports', data)
   }

   getReported(id) {
      return this.http.get(this._authLoginUrl + `eligibility-reports/${id}/report-items`)
   }

   vinEligibiliyt(provider, vin) {
      return this.http.get(this._authLoginUrl + `vehicle/check-eligibility?provider=${provider}`, vin)
   }

   getBulk() {
      return this.http.get(this._authLoginUrl + 'eligibility-reports')
   }

   bulkvinUpload(data) {
      return this.http.post(this._authLoginUrl + 'eligibility-reports/bulk', data)
   }

   forgotPassword(data){
      return this.http.post(this._authLoginUrl + 'account/forgot-password/request-verification-code', data)
     }

   resetPassword(data){
      return this.http.post(this._authLoginUrl + 'account/forgot-password/confirm-verification-code', data)
   }
   signup(data){
      return this.http.post(this._authLoginUrl + 'account/signup', data)
   }
}
