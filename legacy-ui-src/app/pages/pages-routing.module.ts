import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
const routes: Routes = [
  {path: 'adlp', redirectTo: 'dashboard' },
  {path: '', loadChildren: () => import('./dashboards/dashboards.module').then(m => m.DashboardsModule) },
  {path:'eligibility', loadChildren:() => import('./eligibility/eligibility.module').then(m=>m.EligibilityModule)},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
