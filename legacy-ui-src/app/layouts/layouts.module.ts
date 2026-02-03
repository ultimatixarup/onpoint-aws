import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NgbDropdownModule, NgbNavModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ClickOutsideModule } from 'ng-click-outside';
import { LayoutComponent } from './layout.component';
import { TopbarComponent } from './topbar/topbar.component';
import { FooterComponent } from './footer/footer.component';
import { VerticalComponent } from './vertical/vertical.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NgSelectModule } from '@ng-select/ng-select';
@NgModule({
  declarations: [LayoutComponent,SidebarComponent, TopbarComponent, FooterComponent, VerticalComponent],
  imports: [
    CommonModule,
    NgSelectModule,
    NgbNavModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    NgbDropdownModule,
    ClickOutsideModule,
    SimplebarAngularModule,
    NgbModule
  ],
  providers: [
  ]
})
export class LayoutsModule { }
