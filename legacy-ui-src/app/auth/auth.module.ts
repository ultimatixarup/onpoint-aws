import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { Login2Component } from './login2/login2.component';
import { AuthRoutingModule } from './auth-routing';
import { CoreModule } from 'src/app/core/core.module';
import { IntercepterService } from 'src/app/core/services/intercepter.service';
import { NgxSpinnerModule } from "ngx-spinner";
import { ToastrService } from 'ngx-toastr';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LogoutComponent } from './logout/logout.component';
import { ResetPasswordEmailComponent } from './reset-password-email/reset-password-email.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsconditionsComponent } from './termsconditions/termsconditions.component';
import { ChatBotContentComponent } from './chat-bot-content/chat-bot-content.component';

@NgModule({
  declarations: [ Login2Component, LogoutComponent, ResetPasswordEmailComponent, ResetPasswordComponent, PrivacyPolicyComponent, TermsconditionsComponent, ChatBotContentComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbAlertModule,ReactiveFormsModule,
    CoreModule,
    AuthRoutingModule,
    CarouselModule,
    CoreModule,NgxSpinnerModule,
    // Ng2TelInputModule
  ],
  providers: [ToastrService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: IntercepterService,
      multi: true,
    }
  ],
})
export class AuthModule { }
