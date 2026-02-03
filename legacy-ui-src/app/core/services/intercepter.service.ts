import { Injectable } from '@angular/core';
import { HttpRequest, HttpInterceptor, HttpHandler, HttpEvent, HttpResponse, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, NavigationExtras } from '@angular/router';



@Injectable({
  providedIn: 'root'
})
export class IntercepterService {

   status:boolean = false
   groupId:any;
  constructor(private http: HttpClient, private router: Router, private toastr: ToastrService, private spinner: NgxSpinnerService, private route: ActivatedRoute) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    let token = JSON.parse(sessionStorage.getItem('access-token'))
     let url :any = req.url.split('?')[0]


    if (token && url != 'https://maps.googleapis.com/maps/api/geocode/json' && url != 'https://maps.googleapis.com/maps/api/timezone/json') {

    // check fleet user role
    if (sessionStorage.getItem('userRole') === 'role_user_fleet' || sessionStorage.getItem('userRole') === 'role_org_group') {
      const customConsumer = sessionStorage.getItem('custom-consumer');
      const fleetId = sessionStorage.getItem('fleetUserId');
      if(sessionStorage.getItem('groupId')) {
        this.groupId = JSON.parse(sessionStorage.getItem('groupId'))
      }
      // If we have consumer or fleetId, let's add them to the request
      if (customConsumer || fleetId) {

        // Create a URLSearchParams object to handle query parameters

        const queryParams = new URLSearchParams(req.url.split('?')[1] || '');
         console.log();

         if (this.groupId && !queryParams.has('groupId')) {
          console.log(this.groupId,'x')
          queryParams.set('groupId', this.groupId);
        }

        // Check if 'consumer' is already in the query, if not, append it
        if (customConsumer && !queryParams.has('consumer')) {
          queryParams.set('consumer', customConsumer);
        }

        // Check if 'fleetId' is already in the query, if not, append it
        if (fleetId && !queryParams.has('fleetId')) {
          queryParams.set('fleetId', fleetId);
        }

        // Rebuild the URL with the new query parameters
        const updatedUrl = `${url}?${queryParams.toString()}`;

        // Clone the request with the updated URL
        req = req.clone({ url: updatedUrl });
        req = req.clone({
          headers: req.headers
            .set('from', 'ftp') // Add custom header here
        });
      }

    }

    // req = req.clone({
    //   headers: req.headers
    //     .set('Authorization', 'Bearer ' + token)
    //     .set('FROM', 'ftp') // Add custom header here
    // });

    // console.log(token)
    return next.handle(req.clone({ headers: req.headers.append('Authorization', 'Bearer ' + token) }))
        .pipe(
          map((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse && ~(event.status / 100) > 3) {
              return event;
            }
            else {
              return event
            }
          }),
          catchError((err: any, caught) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status === 401) {
                if (!this.status) {
                  // this.toastr.error("Session expired ! Try to login again")
                  this.router.navigate(['/auth/logout'], { queryParams: { returnUrl: this.router.routerState.snapshot.url }});
                }
               this.status = true
              }
              if (err.status === 0) {
                this.router.navigate(['/']);
              }
              return throwError(err);
            }
          })
        );
    }
    else {
      return next.handle(req);
    }



  }
}
