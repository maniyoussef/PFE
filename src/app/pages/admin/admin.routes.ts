import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './AdminDashboard/AdminDashboard.component';
import { PaysListComponent } from './pays-list/pays-list.component';
import { CompaniesComponent } from './companies/companies.component';
import { ProjectsComponent } from './projects/projects.component';
import { NotFoundComponent } from '../not-found/not-found.component';
import { ProblemCategoryComponent } from './problem-category/problem-category.component';
import { TicketsComponent } from './tickets/tickets.component';
import { UsersListCreationComponent } from './users-list&creation/users-list&creation.component';

export const ADMIN_ROUTES: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'pays-list', component: PaysListComponent },
  { path: 'societes', component: CompaniesComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'problems', component: ProblemCategoryComponent }, // Add this route
  { path: 'tickets', component: TicketsComponent }, // Add this route
  { path: 'app-users-list-creation', component: UsersListCreationComponent }, // Correct path for users
  { path: '**', component: NotFoundComponent }, // Always last
];
