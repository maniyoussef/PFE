import { Routes } from '@angular/router';
import { UsersDashboardComponent } from './users-dashboard/users-dashboard.component';
import { MesTicketsComponent } from './mes-tickets/mes-tickets.component';
import { FixUserIdentityComponent } from './fix-user-identity/fix-user-identity.component';
import { authGuard } from '../../guards/auth.guard';
import { UserRole } from '../../core/constants/roles';
import { UsersLayoutComponent } from './users-layout.component';

export const usersRoutes: Routes = [
  {
    path: '',
    component: UsersLayoutComponent,
    canActivate: [() => authGuard([UserRole.USER])],
    canActivateChild: [() => authGuard([UserRole.USER])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: UsersDashboardComponent,
      },
      {
        path: 'mes-tickets',
        component: MesTicketsComponent,
      },
      {
        path: 'fix-identity',
        component: FixUserIdentityComponent,
      },
    ],
  },
];
