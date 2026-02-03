import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
   providedIn: 'root'
})
export class LoginapiService {
   private _authLoginUrl: any = environment.url.BASE_URL;
   private _chatbot: any = environment.url.trip_URL;

   constructor( private http: HttpClient) { }
   // login API
   loginUser(value) {
      return this.http.post(this._authLoginUrl + 'account/login', value);
      // return this.http.post('account/login', value);
   }
   // Chatbot Start API
   dataInsertion(data) {
      return this.http.post(this._chatbot + 'chatbot/chat', data);
   }
   // Chatbot Remove Session End API
   removeSession(sessionId: string): Observable<any> {
      return this.http.post(this._chatbot + 'chat/remove-session/', { session_id: sessionId });
   }


  sendVerificationCode(id) {
   let body:any={
     username: id
   }
   return this.http.post(this._authLoginUrl + 'account/forgot-password/request-verification-code',body)
 }

 resetPassword(data){
   return this.http.post(this._authLoginUrl + 'account/forgot-password/confirm-verification-code', data)
}

getHealthReport() {
   return this.http.get(this._chatbot + 'actuator/health')
}
}
