import { Component, OnInit, } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { LoginapiService } from 'src/app/auth/loginapi.service';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetform: FormGroup
  selectrole: boolean = false;
  loginResponse: any;
  trialUser: any;
  userRoleResponse: any;
  submitted: boolean = false;
  userRoles: any
  radioChangeValue2: any = '';
  data: any;
  userEmailData: boolean = true;
  confirmedData: boolean = false;
  password: string;
  username: string;
  emailVal: any
  hide: boolean = true;
  hide1: boolean = true;
  error_messages = {
    'email': [
      { type: 'required', message: 'Email Id is required.' },
      { type: 'pattern', message: 'Please enter a valid email Id.' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password length should be greater than 8' },
    ],
    'confirmpassword': [
      { type: 'required', message: 'Password is required.' },
    ],
    'code': [
      { type: 'required', message: 'Verification code is required.' },
      { type: 'maxlength', message: 'Password length should not exceed 6' }
    ]
  }
  imageUrl: string;

  constructor(public authService: LoginapiService, private activatedRoute: ActivatedRoute,
    private fb: FormBuilder, private router: Router, private spinner: NgxSpinnerService, private toastr: ToastrService) { this.resetForm() }
  getParam() {
    this.activatedRoute.queryParams.subscribe((param: any) => {
      if (param) {
        console.log(param);

        this.resetform.controls['email'].setValue(param.email)
      }
    })
  }
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
  get f() { return this.resetform.controls; }

  returnUrl(url) {
    let newUrl = url
    var array = newUrl.split("?");
    if (array) {
      newUrl = array[0];
    }
    this.router.navigate([newUrl])
  }

  goBackLogin() {
    this.router.navigate(['/'])
  }

  isOnwardConnectedUrl(): boolean {
    const currentUrl = window.location.hostname;

    // Check for both production and local testing scenarios
    return currentUrl === 'onwardconnected.fleettrack.ai';
  }


  myFunction() {
    this.hide = !this.hide
  }

  myFunctions() {
    this.hide1 = !this.hide1
  }

  resetForm() {
    this.resetform = this.fb.group({
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(8)
      ])),
      confirmPassword: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(8)
      ])),
      code: new FormControl('', Validators.compose([
        Validators.required,
        Validators.maxLength(6)
      ])),
    }, {
      validators: this.passwordFn.bind(this)
    });
    this.getParam()
  }

  passwordFn(formGroup: FormGroup) {
    const { value: password } = formGroup.get('password');
    const { value: confirmPassword } = formGroup.get('confirmPassword');
    if (confirmPassword.length > 7) {
      return password === confirmPassword ? null : { passwordNotMatch: true };
    }
    else {
      return { passwordNotMatch: true };
    }
  }

  verifycode() {
    this.router.navigate(['/auth/codeverification'])
  }

  numbersOnlyUpto(event: any) {
    const pattern = /[0-9, .]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (event.target.value.length > 5) {
      event.preventDefault();
    }
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  resetPassword(value) {
    let resetData = {
      "userName": value.email,
      "newPassword": value.password,
      "confirmationCodeSentOverMail": value.code
    }
    this.authService.resetPassword(resetData).subscribe((res: any) => {
      if (res.message) {
        this.toastr.success("Account password has been changed successfully!")
        this.loginAccount()
        this.resetform.reset();
      }
    },
      (err) => {
        if (err?.error.apierror?.message == 'User does not exist.') {
          this.toastr.error('Email Id does not exist.')
        }
        else if (err?.error.apierror?.message == 'Attempt limit exceeded, please try after some time.') {
          this.toastr.error('Attempt limit exceeded, please try after some time.')
        }

        else if (err?.error?.apierror?.message == 'Invalid code provided, please request a code again.') {
          this.toastr.error('Invalid cpde, enter valid code.')
        }

        else if (err?.error.apierror?.message == 'Cannot reset password for the user as there is no registered/verified email or phone_number') {
          this.toastr.error('Cannot reset password for the user as there is no registered/verified email or phone_number')
        } else {
          this.toastr.error(err?.error.apierror?.message)
        }
      }
    )
  }

  loginAccount() {
    this.router.navigate(['/'])
  }
}
