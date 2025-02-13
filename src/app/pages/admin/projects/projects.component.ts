import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
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
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];

  constructor(
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (data: Project[]) => (this.projects = data),
      error: (error) =>
        console.error('Erreur lors du chargement des projets:', error),
    });
  }

  addProject() {
    if (this.newProject.name?.trim()) {
      this.projectService.addProject(this.newProject as Project).subscribe({
        next: (project: Project) => {
          this.projects = [...this.projects, project]; // ✅ Ensures reactivity
          this.resetNewProject(); // ✅ Reset form after success
          this.snackBar.open('Projet ajouté avec succès!', 'Fermer', {
            duration: 3000,
          });
        },
        error: (error) =>
          console.error("Erreur lors de l'ajout du projet:", error),
      });
    }
  }

  deleteProject(id: number) {
    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.projects = this.projects.filter((p) => p.id !== id);
        this.snackBar.open('Projet supprimé avec succès!', 'Fermer', {
          duration: 3000,
        });
      },
      error: (error) =>
        console.error('Erreur lors de la suppression du projet:', error),
    });
  }

  private resetNewProject() {
    this.newProject = { name: '', description: '', status: 'En attente' };
  }
}
