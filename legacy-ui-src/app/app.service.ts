import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private toastr: ToastrService) { }

  openSnackBar(message,type){

    if(type === 'Success'){
      this.toastr.success(message)
    }
    if(type === 'Error'){
      this.toastr.error(message)
    }
  }
}
