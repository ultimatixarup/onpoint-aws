import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-termsconditions',
  templateUrl: './termsconditions.component.html',
  styleUrls: ['./termsconditions.component.scss']
})
export class TermsconditionsComponent implements OnInit {

  constructor(private router: Router,) { }

  ngOnInit(): void {
  }

  loginAccount() {
    this.router.navigate(['/'])
  }

}
