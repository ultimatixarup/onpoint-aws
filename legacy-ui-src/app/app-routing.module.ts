import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layouts/layout.component';
import { PagenotFoundComponent } from 'src/app/pages/pagenotfound/pagenot-found/pagenot-found.component'

const routes: Routes = [
  { path: '', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  {
    path: 'adlp',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full', // Ensures empty 'adlp' path lands on PageNotFound
        component: PagenotFoundComponent,
      },
      {
        path: '', // Nested routes under /adlp (if needed)
        component: LayoutComponent,
        loadChildren: () =>
          import('./pages/pages.module').then((m) => m.PagesModule),
      },
    ],
  },
 { path: '**', pathMatch: 'full', component: PagenotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top', relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
