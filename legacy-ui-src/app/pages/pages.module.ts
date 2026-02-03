import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbNavModule, NgbDropdownModule, NgbModalModule, NgbTooltipModule , NgbCollapseModule} from '@ng-bootstrap/ng-bootstrap';
import { FullCalendarModule } from '@fullcalendar/angular';
import { PagesRoutingModule } from './pages-routing.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { NgxSpinnerModule } from "ngx-spinner";
import { CoreModule } from '../core/core.module';
import { PagenotFoundComponent } from './pagenotfound/pagenot-found/pagenot-found.component';
import { AppService } from '../app.service';
@NgModule({
  declarations: [
    PagenotFoundComponent
  ],
  exports:[NgxSpinnerModule],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbDropdownModule,
    NgbModalModule,
    PagesRoutingModule,
    NgSelectModule,
    NgxSpinnerModule,
    DashboardsModule,
    FullCalendarModule,
    NgbNavModule,
    NgbTooltipModule,
    NgbCollapseModule,
    CoreModule,
  ],schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  providers:[
    AppService,
    DatePipe
  ]

})
export class PagesModule { }
