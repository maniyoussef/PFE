// client.routes.ts
import { Routes } from '@angular/router';
import { ClientDashboardComponent } from './client-dashboard/client-dashboard.component';
import { ClientTicketsComponent } from './client-tickets/client-tickets.component';
import { ClientProfileComponent } from './client-profile/client-profile.component';
import { ClientReportsComponent } from './client-reports/client-reports.component';
import { ClientLayoutComponent } from './client-layout.component';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      { path: '', component: ClientDashboardComponent },
      { path: 'tickets', component: ClientTicketsComponent },
      { path: 'profile', component: ClientProfileComponent },
      { path: 'reports', component: ClientReportsComponent },
    ],
  },
];
