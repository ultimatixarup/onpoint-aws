import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private router: Router,  private toastr: ToastrService,) { }

  ngOnInit(): void {
    sessionStorage.clear();
    this.router.navigate(['/auth/logout']); // Redirect to login page
  }

  login(){
    this.router.navigate(['/'])
  }

}
