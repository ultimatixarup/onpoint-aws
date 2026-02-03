import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Login2Component } from './login2/login2.component';
import { LogoutComponent } from './logout/logout.component';
import { ResetPasswordEmailComponent } from './reset-password-email/reset-password-email.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { TermsconditionsComponent } from './termsconditions/termsconditions.component';
import { ChatBotContentComponent } from './chat-bot-content/chat-bot-content.component';
const routes: Routes = [

    {
        path: '',
        component: Login2Component
    },
    {
        path: 'logout',
        component: LogoutComponent
    },
    {
        path: 'resetPasswordEmail',
        component: ResetPasswordEmailComponent
    },
    {
        path: 'resetPassword',
        component: ResetPasswordComponent
    },
    {
        path: 'privacyPolicy',
        component: PrivacyPolicyComponent
    },
    {
        path: 'chatBotModeup',
        component: ChatBotContentComponent
    },
    {
        path: 'terms&conditions',
        component: TermsconditionsComponent
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthRoutingModule { }
