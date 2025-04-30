import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    NavbarComponent,
    TopBarComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  newProject: Partial<Project> = {
    name: '',
    description: '',
    status: 'En attente',
  };
  isLoading = false;
  errorMessage = '';
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];

  constructor(
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.errorMessage = 'Error loading projects';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', {
          duration: 3000,
        });
      },
    });
  }

  addProject(): void {
    if (this.newProject.name?.trim()) {
      this.isLoading = true;
      this.projectService.addProject(this.newProject as Project).subscribe({
        next: (project: Project | null) => {
          if (project) {
            this.projects.push(project);
            this.newProject = {
              name: '',
              description: '',
              status: 'En attente',
            };
            this.isLoading = false;
            this.snackBar.open('Project added successfully', 'Close', {
              duration: 3000,
            });
          }
        },
        error: (error: any) => {
          console.error('Error creating project:', error);
          this.errorMessage = 'Error creating project';
          this.isLoading = false;
          this.snackBar.open(this.errorMessage, 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  deleteProject(id: number) {
    this.isLoading = true;
    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.projects = this.projects.filter((p) => p.id !== id);
        this.snackBar.open('Projet supprimé avec succès!', 'Fermer', {
          duration: 3000,
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error deleting project:', error);
        this.errorMessage = 'Error deleting project';
        this.isLoading = false;
      },
    });
  }
}
