import { Component, OnInit, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import jwt_decode from "jwt-decode";
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { LoginapiService } from 'src/app/auth/loginapi.service';
import { interval, Subscription } from 'rxjs';
import { TokenService } from 'src/app/core/services/event.service';

@Component({
   selector: 'app-login2',
   templateUrl: './login2.component.html',
   styleUrls: ['./login2.component.scss']
})

export class Login2Component implements OnInit {
   loginForm: FormGroup;
   selectrole: boolean = false;
   hide: boolean = true;
   hideNew = true
   loginResponse: any;
   submitted = false;
   userRoles: any
   imageUrl: string
   isMaintenance:boolean = false
   private statusSubscription: Subscription;
   accessToken: any;
   isTempPassword:boolean = false
   newPassword:any;
   constructor(public authService: LoginapiService,private tokenService: TokenService,
      private fb: FormBuilder,private router: Router,private spinner: NgxSpinnerService,private toastr: ToastrService,private route: ActivatedRoute,) {
         this.statusCheck()
         this.statusSubscription = interval(120000).subscribe(() => {
           this.statusCheck();
         });
       }

   ngOnInit(): void {
      // document.addEventListener('contextmenu', this.disableRightClick);
      this.loginForm = this.fb.group({
         username: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
         password: ['', [Validators.required, Validators.minLength(8)]]
      })
      sessionStorage.clear();
      localStorage.clear()
     const currentUrl = window.location.href;
    if (currentUrl.includes('smallboard.fleettrack.ai')) {
         this.imageUrl = './assets/images/onpointsolution.png';
      }
      else if (currentUrl.includes('onpointsolution.fleettrack.ai')) {
         this.imageUrl = './assets/images/onpointsolution.png';
      }
      else if (currentUrl.includes('smallboard-dev.fleettrack.ai')) {
         this.imageUrl = './assets/images/onpointsolution.png';
      }
      else if (currentUrl.includes('smallboard-demo.fleettrack.ai')) {
         this.imageUrl = './assets/images/onpointsolution.png';

      }
      else {
         this.imageUrl = './assets/images/onpointsolution.png';
      }


   }

   get f() { return this.loginForm.controls; }

   login(value: any) {
      this.spinner.show()
      this.submitted = true;
      this.selectrole = true;
      sessionStorage.clear()
      let body:any = {
         username:value?.username,
         password:value?.password
      }
      if(this.isTempPassword) {
         body.newPassword = this.newPassword
      }
      this.authService.loginUser(body).subscribe((res: any) => {
         window.sessionStorage.clear()
         localStorage.clear()
         this.loginResponse = res;
         this.accessToken = res?.accessToken
         this.tokenService.setToken(res?.accessToken);
         var userdetail = JSON.parse(JSON.stringify((this.loginResponse)));
         var token = userdetail.idToken;
         var loginUser = jwt_decode(token);
         sessionStorage.setItem('Useremail', JSON.stringify(loginUser))
         sessionStorage.setItem('multiRole', JSON.stringify(loginUser["cognito:groups"]))
         loginUser["cognito:groups"] = JSON.stringify(loginUser["cognito:groups"])
         let loggedUser = JSON.parse(loginUser["cognito:groups"])
         //Role Admin
         if (loginUser["cognito:groups"].includes("ROLE_ADMIN")) {
            sessionStorage.setItem('admin_token', JSON.stringify(this.loginResponse));
            sessionStorage.setItem('user-token', JSON.stringify(this.loginResponse));
            sessionStorage.setItem('access-token', JSON.stringify(this.loginResponse.accessToken))
            sessionStorage.setItem('userRole', 'admin')
            const roleIndex = loggedUser.indexOf('ROLE_ADMIN');
            sessionStorage.setItem('userlogin', loginUser["cognito:groups"][roleIndex]);
            let url = this.route.snapshot.queryParams['returnUrl'] || 'adlp/admin/dashboardAdmin'
            this.returnUrl(url)
         }
         else if (loginUser["cognito:groups"].includes("ROLE_ORG_GROUP")) {
            sessionStorage.setItem('admin_token', JSON.stringify(this.loginResponse));
            sessionStorage.setItem('user-token', JSON.stringify(this.loginResponse));
            sessionStorage.setItem('access-token', JSON.stringify(this.loginResponse.accessToken))
            sessionStorage.setItem('userRole', 'role_org_group')
            sessionStorage.setItem('userlogin', loginUser["cognito:groups"][0])
            sessionStorage.setItem('custom-consumer', loginUser["custom:consumer"])
            sessionStorage.setItem('fleetUserId', loginUser["custom:fleetId"])
            sessionStorage.setItem('groupId', loginUser["custom:groupId"])
            let url = this.route.snapshot.queryParams['returnUrl'] || 'adlp/admin/admindashboard/dashboardfleet'
            this.returnUrl(url)
         }
         // Role Role_Consumer_Fleet
         else if (loggedUser.includes('ROLE_CONSUMER_FLEET')) {
            sessionStorage.setItem('user-token', JSON.stringify(this.loginResponse));
            sessionStorage.setItem('access-token', JSON.stringify(this.loginResponse.accessToken));
            sessionStorage.setItem('custom-consumer', loginUser["custom:consumer"]);
            sessionStorage.setItem('userRole', 'role_consumer_fleet');

            // Set userlogin based on the position of ROLE_CONSUMER_FLEET
            const roleIndex = loggedUser.indexOf('ROLE_CONSUMER_FLEET');
            sessionStorage.setItem('userlogin', loginUser["cognito:groups"][roleIndex]);

            // Get consumer
            const customConsumer = loginUser["custom:consumer"];

            // Check if EcoTrack
            let url = this.route.snapshot.queryParams['returnUrl'] ||
                      (customConsumer === 'EcoTrack' ? '/adlp/admin/admindashboard/tracking'
                                                     : 'adlp/admin/admindashboard/dashboardfleet');

            this.returnUrl(url);
          }

        else if (loggedUser.includes('ROLE_DRIVER')) {
         sessionStorage.setItem('user-token', JSON.stringify(this.loginResponse));
         sessionStorage.setItem('access-token', JSON.stringify(this.loginResponse.accessToken));
         sessionStorage.setItem('userRole', 'role_Driver');
         const roleIndex = loggedUser.indexOf('ROLE_DRIVER');
         sessionStorage.setItem('userlogin', loginUser["cognito:groups"][roleIndex]);
         sessionStorage.setItem('custom-consumer', loginUser["custom:consumer"])
         sessionStorage.setItem('fleet-Id', loginUser["custom:fleetId"])
         let url = this.route.snapshot.queryParams['returnUrl'] || 'adlp/admin/fleetManageVehicles';
         this.returnUrl(url);
     }
        else if (loggedUser.includes('READ_ONLY')) {
         sessionStorage.setItem('user-token', JSON.stringify(this.loginResponse));
         sessionStorage.setItem('access-token', JSON.stringify(this.loginResponse.accessToken));
         sessionStorage.setItem('custom-consumer', loginUser["custom:consumer"]);
         sessionStorage.setItem('userRole', 'read_only');
         const roleIndex = loggedUser.indexOf('READ_ONLY');
         sessionStorage.setItem('userlogin', loginUser["cognito:groups"][roleIndex]);
         let url = this.route.snapshot.queryParams['returnUrl'] || 'adlp/admin/admindashboard/dashboardfleet';
         this.returnUrl(url);
     }

         else if (loginUser["cognito:groups"].includes('ROLE_USER_FLEET')) {
            sessionStorage.setItem('user-token', JSON.stringify(this.loginResponse));
            sessionStorage.setItem('access-token', JSON.stringify(this.loginResponse.accessToken))
            sessionStorage.setItem('userRole', 'role_user_fleet')
            sessionStorage.setItem('userlogin', loginUser["cognito:groups"][0])
            sessionStorage.setItem('custom-consumer', loginUser["custom:consumer"])
            sessionStorage.setItem('fleetUserId', loginUser["custom:fleetId"])
            let url = this.route.snapshot.queryParams['returnUrl'] || 'adlp/admin/admindashboard/dashboardfleet'
            this.returnUrl(url)
         }

         this.spinner.hide()
      },
         err => {
            this.spinner.hide()
            this.isTempPassword = false
            if (err.status === 0) {
               this.isMaintenance = true
               interval(120000).subscribe(() => {
                  this.statusCheck();
                });
             }

            if (err.error.apierror.message == 'Missing required parameter PASSWORD') {
               this.toastr.error('Password is required.')
            }
            else if (err.error.apierror.message == 'Request not allowed') {
               this.toastr.error('This account doesnot exist. Please contact CerebrumX sales team to login.')
            }
            else if (err.error.apierror.message == 'Missing required parameter USERNAME') {
               this.toastr.error('Username is required.')
            }
            else if (err.error.apierror.message == 'User does not exist.') {
               this.toastr.error('Username does not exist.')
            }
            else if (err.error.apierror.message == 'Incorrect username or password.') {
               this.toastr.error('Incorrect username or password.')
            }
            else if (err.error.apierror.debugMessage == 'Admin created user must provide new password at first login attempt. Changing temporary password is mandatory.'
                     || (err.error.apierror.message && err.error.apierror.message.includes('New password cannot be empty.'))) {
               // Don't show toaster for temporary password cases
               this.isTempPassword = true
            }
            else {
               this.toastr.error('Usernamd and password is required.')
            }
         });
   }

   disableRightClick(event: MouseEvent): void {
      event.preventDefault();
    }

   returnUrl(url) {
      let newUrl = url
      var array = newUrl.split("?");
      if (array) {
         newUrl = array[0];
      }
      this.router.navigate([newUrl])
   }

   forgotPassword(){
      this.router.navigate(['/resetPasswordEmail'])
   }

   openChatBot(){
      this.router.navigate(['/chatBotModeup'])
   }
   privacyPolicy(){
      this.router.navigate(['/privacyPolicy'])
   }


   termsConditions(){
      this.router.navigate(['/terms&conditions'])
   }

   isOnwardConnectedUrl(): boolean {
      const currentUrl = window.location.hostname;
      return currentUrl === 'onwardconnected.fleettrack.ai';
    }

   myFunction() {
      this.hide = !this.hide;
   }
   myFunctionN() {
      this.hideNew = !this.hideNew;
   }

   statusCheck() {
      this.authService.getHealthReport().subscribe((res:any)=>{
        if(res.status == 'UP') {
          this.isMaintenance = false
          if (this.statusSubscription) {
            this.statusSubscription.unsubscribe();
          }
        } else {
         this.isMaintenance = true
        }
      },err=>{
         if (err.status === 0) {
            this.isMaintenance = true
          }
      })
    }

    ngOnDestroy(): void {
      // Prevent memory leaks
      if (this.statusSubscription) {
        this.statusSubscription.unsubscribe();
      }
    }

}
