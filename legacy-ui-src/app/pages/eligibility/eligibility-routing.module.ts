import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EligibilitycheckComponent } from './eligibilitycheck/eligibilitycheck.component';

const routes: Routes = [
  {
    path: 'eligibilityCheck',
    component: EligibilitycheckComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EligibilityRoutingModule { }
