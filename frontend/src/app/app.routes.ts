import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';

export const routes: Routes = [
  // Public landing page
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full'
  },

  // Superadmin CMS — not linked anywhere in the app (security through obscurity)
  {
    path: 'superadmin',
    loadChildren: () => import('./superadmin/superadmin.module').then(m => m.SuperadminModule)
  },

  // University-scoped routes — /:slug/login, /:slug/dashboard, etc.
  {
    path: ':slug',
    loadChildren: () => import('./university/university.module').then(m => m.UniversityModule)
  },

  { path: '**', redirectTo: '/' }
];
