// assign-user-dialog.component.ts
import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { Ticket } from '../../../models/ticket.model';
import { User } from '../../../models/user.model';
import { ProjectService } from '../../../services/project.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-assign-user-dialog',
  templateUrl: './assign-user-dialog.component.html',
  styleUrls: ['./assign-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatOptionModule,
  ],
})
export class AssignUserDialogComponent {
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  chefProjetId: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssignUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket },
    private projectService: ProjectService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    // Add type assertion and null checks
    const project = this.data.ticket.project as
      | {
          id: number;
          name: string;
          chefProjetId: number;
        }
      | undefined;

    if (project?.chefProjetId) {
      this.chefProjetId = project.chefProjetId;
      await this.loadProjectCollaborateurs(this.chefProjetId);
    } else {
      console.error('No Chef Projet ID found for this ticket');
    }
  }

  async loadProjectCollaborateurs(chefProjetId: number) {
    try {
      const projects = await lastValueFrom(
        this.http.get<Project[]>(
          `/api/projects/chef-projet/${chefProjetId}/projects`
        )
      );

      const collaborateurIds = projects.flatMap(
        (project) => project.collaborateurIds || []
      );
      const uniqueCollaborateurIds = Array.from(new Set(collaborateurIds));

      const users$ = this.http.get<User[]>('/api/users/collaborateurs');
      this.users = await lastValueFrom(users$);

      this.filteredUsers = this.users.filter(
        (user) =>
          user.id &&
          uniqueCollaborateurIds.includes(user.id) &&
          user.role?.name?.toLowerCase() === 'collaborateur'
      );
    } catch (error) {
      console.error('Error fetching project collaborators:', error);
      this.filteredUsers = [];
    }
  }

  onSave(): void {
    this.dialogRef.close(this.selectedUser);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
