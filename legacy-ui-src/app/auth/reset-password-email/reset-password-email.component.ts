import { Component, OnInit, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { LoginapiService } from 'src/app/auth/loginapi.service';


@Component({
  selector: 'app-reset-password-email',
  templateUrl: './reset-password-email.component.html',
  styleUrls: ['./reset-password-email.component.scss']
})
export class ResetPasswordEmailComponent implements OnInit {
   subscription$:Subscription=new Subscription()
   selectrole: boolean = false;
   hide: boolean = true;
   loginResponse: any;
   submitted = false;
   userRoles: any
   forgotForm:FormGroup;
   imageUrl: string
   constructor(public authService: LoginapiService,
      private fb: FormBuilder,private router: Router,private spinner: NgxSpinnerService,private toastr: ToastrService,private route: ActivatedRoute,) { this.createForm()}

   ngOnInit(): void {
      sessionStorage.clear();
      localStorage.clear()
     const currentUrl = window.location.href;
      if (currentUrl.includes('cerebrumx.fleettrack.ai')) {
         this.imageUrl = './assets/images/logo_main.png';
      }
      else if (currentUrl.includes('smallboard.fleettrack.ai')) {
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
      else if (currentUrl.includes('revolv.fleettrack.ai')) {
         this.imageUrl = './assets/images/revol-logo.svg';
      }
      else if (currentUrl.includes('siriusxm.fleettrack.ai')) {
         this.imageUrl = './assets/images/single_connect_logo.png';
      }
      else if (currentUrl.includes('https://onwardconnected.fleettrack.ai')) {
         this.imageUrl = './assets/images/onward_connected_logo.svg';
      }
      else if (currentUrl.includes('onwardconnected.fleettrack.ai')) {
         this.imageUrl = './assets/images/onward_connected_logo.svg';
      }
      else if (currentUrl.includes('dpltelemetics.fleettrack.ai')) {
         this.imageUrl = './assets/images/dpl_logo.png';
      }
      else if (currentUrl.includes('https://dpltelemetics.fleettrack.ai')) {
         this.imageUrl = './assets/images/dpl_logo.png';
      }
      else if (currentUrl.includes('guidepoint.fleettrack.ai')) {
         this.imageUrl = './assets/images/guidepoint-logo.png';
      }
      else if (currentUrl.includes('https://assetworks.fleettrack.ai')) {
         this.imageUrl = './assets/images/assetsWork/AssetWorks.png';
      }
      else if (currentUrl.includes('assetworks.fleettrack.ai')) {
         this.imageUrl = './assets/images/assetsWork/AssetWorks.png';
      }
      else if (currentUrl.includes('btracking.fleettrack.ai')) {
         this.imageUrl = './assets/images/btracking-logo.png';
      }
      else if (currentUrl.includes('orionfi.fleettrack.ai')) {
         this.imageUrl = './assets/images/orionfi-logo.png';
      }
      else if (currentUrl.includes('fleettrack.ai')) {
         this.imageUrl = './assets/images/logo_main.png';
      }
      else {
         this.imageUrl = './assets/images/logo_main.png';
      }
   }
   get f() { return this.forgotForm.controls; }

   createForm() {
      this.forgotForm = this.fb.group({
        email: ['', Validators.required],
      })
    }

    submitForm(frm:any) {
      this.spinner.show()
      this.submitted = true;
      this.subscription$.add(
      this.authService.sendVerificationCode(frm?.email).subscribe((res:any)=>{
         this.spinner.hide()
         if(res?.message == 'Contact your TSP for temporary password.') {
            this.toastr.error(res?.message)
         } else {
            this.toastr.success(res?.message)
            this.router.navigate(['auth/resetPassword'],{queryParams:{email:frm?.email}})
         }


      },err=>{
         this.spinner.hide()
        this.toastr.error(err?.error?.apierror?.message)
      })

      )
    }


   goBackLogin(){
      this.router.navigate(['/'])
   }
 resetPasswordGo(){

 }

   isOnwardConnectedUrl(): boolean {
      const currentUrl = window.location.hostname;

      // Check for both production and local testing scenarios
      return currentUrl === 'onwardconnected.fleettrack.ai';
    }

   myFunction() {
      this.hide = !this.hide;
   }

}
