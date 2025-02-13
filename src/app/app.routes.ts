import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { SupportComponent } from './pages/support/support.component';
import { PolicyComponent } from './pages/policy/policy.component';
import { AboutComponent } from './pages/about-us/about-us.component';
import { RolesComponent } from './pages/admin/roles/roles.component';
import { MesTicketsComponent } from './pages/users/mes-tickets/mes-tickets.component';
import { UsersDashboardComponent } from './pages/users/users-dashboard/users-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'support', component: SupportComponent },
  { path: 'about', component: AboutComponent },
  { path: 'policy', component: PolicyComponent },
  { path: 'roles', component: RolesComponent },
  { path: 'mes-tickets', component: MesTicketsComponent },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  { path: 'users-dashboard', component: UsersDashboardComponent },

  {
    path: 'admin-dashboard',
    loadChildren: () =>
      import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  { path: '**', component: NotFoundComponent, pathMatch: 'full' },
];
