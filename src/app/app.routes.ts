// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { UserRole } from './core/constants/roles';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'direct-collab',
    redirectTo: '/collaborateur',
    pathMatch: 'full',
  },
  {
    path: 'test-admin',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'support',
    loadComponent: () =>
      import('./pages/support/support.component').then(
        (m) => m.SupportComponent
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about-us/about-us.component').then(
        (m) => m.AboutComponent
      ),
  },
  {
    path: 'policy',
    loadComponent: () =>
      import('./pages/policy/policy.component').then((m) => m.PolicyComponent),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        console.log('[Router] ⭐ Admin guard check');
        return authGuard([UserRole.ADMIN])(route, state);
      },
    ],
  },
  {
    path: 'chef-projet',
    loadChildren: () =>
      import('./pages/chef-projet/chef-projet.routes').then(
        (m) => m.CHEF_PROJET_ROUTES
      ),
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        console.log('[Router] ⭐ Chef projet guard check');
        return authGuard([UserRole.CHEF_PROJET])(route, state);
      },
    ],
  },
  {
    path: 'client',
    loadChildren: () =>
      import('./pages/client/client.routes').then((m) => m.CLIENT_ROUTES),
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        console.log('[Router] ⭐ Client guard check');
        return authGuard([UserRole.CLIENT])(route, state);
      },
    ],
  },
  {
    path: 'collaborateur',
    loadChildren: () =>
      import('./pages/collaborateur/collaborateur.routes').then((m) => {
        console.log('[Router] 📦 COLLABORATEUR_ROUTES loaded successfully');
        return m.COLLABORATEUR_ROUTES;
      }),
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        console.log('[Router] ⭐ Direct collaborateur guard check');
        return authGuard([UserRole.COLLABORATEUR])(route, state);
      },
    ],
  },
  {
    path: 'user',
    loadChildren: () =>
      import('./pages/users/users.routes').then((m) => m.usersRoutes),
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        console.log('[Router] ⭐ User guard check');
        return authGuard([UserRole.USER])(route, state);
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
