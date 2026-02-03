import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EligibilityRoutingModule } from './eligibility-routing.module';
import { EligibilitycheckComponent } from './eligibilitycheck/eligibilitycheck.component';
import { SearchIdPipe, CapitalizePipe  } from './pipes/vehicle-search.pipe';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
  declarations: [
    EligibilitycheckComponent,
    SearchIdPipe, CapitalizePipe
  ],
  imports: [
    CommonModule,
    NgApexchartsModule,
FormsModule,
ReactiveFormsModule,
    EligibilityRoutingModule,
    NgbModule,
    NgxSpinnerModule
  ],
  providers: [
    // VehicleServiceService,
  ]
})
export class EligibilityModule { }
