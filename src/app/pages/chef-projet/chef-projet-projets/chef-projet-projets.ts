import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Project } from '../../../models/project.model';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { ProjectService } from '../../../services/project.service';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { Router } from '@angular/router';
import { take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ChefProjetNavbarComponent } from '../../../components/chef-projetComponents/chef-projet-navbar/chef-projet-navbar.component';

@Component({
  selector: 'app-project',
  templateUrl: './chef-projet-projets.html',
  styleUrls: ['./chef-projet-projets.scss'],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterModule,
    TopBarComponent,
    ChefProjetNavbarComponent,
  ],
  standalone: true,
})
export class ProjectComponent implements OnInit {
  projects: Project[] = [];
  currentUser!: User;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(
        take(1),
        catchError((error) => {
          console.error('Error fetching current user:', error);
          return of(null);
        })
      )
      .subscribe((user) => {
        if (!user) {
          console.error('No user found in authentication service');
          return;
        }

        console.log('Current user:', user); // For comprehensive debugging

        // More flexible role checking
        const userRole = user.role?.name
          ? user.role.name.toLowerCase()
          : undefined;
        const userRoleId = user.role?.id;

        console.log('Detected User Role:', userRole, 'Role ID:', userRoleId);

        // Accept any variation of chef projet or role ID 3
        if (
          userRoleId === 3 ||
          (userRole &&
            ((userRole.includes('chef') && userRole.includes('projet')) ||
              userRole === 'chef_projet' ||
              userRole === 'chefprojet'))
        ) {
          this.currentUser = user;
          this.loadAssignedProjects();
        } else {
          console.error(
            'User role mismatch. Expected "Chef Projet", got:',
            userRole
          );
        }
      });
  }

  private loadAssignedProjects(): void {
    this.isLoading = true;
    this.projectService.getProjectsByChefId(this.currentUser.id).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.isLoading = false;
        // Don't navigate away on error, just show empty state
      },
    });
  }
}
