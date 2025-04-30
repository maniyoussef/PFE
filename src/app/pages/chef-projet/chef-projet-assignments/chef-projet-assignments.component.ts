import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { ProjectService } from '../../../services/project.service';
import { TicketService } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { Project } from '../../../models/project.model';
import { User } from '../../../models/user.model';
import { Ticket } from '../../../models/ticket.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chef-projet-assignments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatListModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './chef-projet-assignments.component.html',
  styleUrls: ['./chef-projet-assignments.component.scss'],
})
export class ChefProjetAssignmentsComponent implements OnInit {
  // View child for collaborateur select
  @ViewChild('collaborateurSelect') collaborateurSelect!: MatSelect;

  // Current user (chef de projet)
  currentUser: User | null = null;

  // API Url
  private apiUrl = environment.apiUrl;

  // Projects assigned to the chef de projet
  assignedProjects: Project[] = [];

  // All collaborateurs
  collaborateurs: User[] = [];

  // Selected collaborateurs for each project
  projectCollaborateursMap: Map<number, number[]> = new Map();

  // Tickets assigned to the chef de projet
  tickets: Ticket[] = [];
  pendingTickets: Ticket[] = [];

  // Loading states
  loading = false;
  assigningCollaborateurs = false;
  processingTicket = false;

  // Display columns for tables
  collaborateursColumns: string[] = ['name', 'email', 'select'];
  ticketsColumns: string[] = [
    'title',
    'project',
    'category',
    'status',
    'actions',
  ];

  // Assignment data
  assignedCollaborateurs: User[] = [];

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private ticketService: TicketService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      if (user) {
        this.currentUser = user;
        this.loadData();
      }
    });
  }

  loadData(): void {
    if (!this.currentUser || !this.currentUser.id) {
      this.showNotification('User information not available');
      this.loading = false;
      return;
    }

    const userId = this.currentUser.id;

    forkJoin({
      projects: this.projectService.getProjectsByChefId(userId).pipe(
        catchError((err) => {
          console.error('Error loading projects:', err);
          return of([]);
        })
      ),
      collaborateurs: this.userService.getCollaborateurs().pipe(
        catchError((err) => {
          console.error('Error loading collaborateurs:', err);
          return of([]);
        })
      ),
      tickets: this.getTicketsByChefProjet(userId).pipe(
        catchError((err) => {
          console.error('Error loading tickets:', err);
          return of([]);
        })
      ),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((result) => {
        this.assignedProjects = result.projects;
        this.collaborateurs = result.collaborateurs;
        this.tickets = result.tickets;
        this.pendingTickets = this.tickets.filter(
          (ticket) => ticket.status === 'Created' || ticket.status === 'Pending'
        );

        // Initialize map of collaborateurs for each project
        this.assignedProjects.forEach((project) => {
          this.projectCollaborateursMap.set(
            project.id,
            project.collaborateurIds || []
          );
        });
      });
  }

  // Helper method to get tickets by chef projet - should be in ticket service
  private getTicketsByChefProjet(chefProjetId: number) {
    return this.ticketService.getTickets().pipe(
      catchError((error) => {
        console.error('Error fetching tickets:', error);
        return of([]);
      }),
      // Filter tickets where project.chefProjetId matches
      // This should be replaced with a proper backend endpoint when available
      // This is just a temporary client-side filter solution
      // which is not ideal for performance with many tickets
      map((tickets: Ticket[]) =>
        tickets.filter(
          (ticket) => ticket.project?.chefProjetId === chefProjetId
        )
      )
    );
  }

  isCollaborateurSelected(projectId: number, collaborateurId: number): boolean {
    const selectedIds = this.projectCollaborateursMap.get(projectId) || [];
    return selectedIds.includes(collaborateurId);
  }

  toggleCollaborateur(projectId: number, collaborateurId: number): void {
    const selectedIds = this.projectCollaborateursMap.get(projectId) || [];

    if (selectedIds.includes(collaborateurId)) {
      // Remove collaborateur
      this.projectCollaborateursMap.set(
        projectId,
        selectedIds.filter((id) => id !== collaborateurId)
      );
    } else {
      // Add collaborateur
      this.projectCollaborateursMap.set(projectId, [
        ...selectedIds,
        collaborateurId,
      ]);
    }
  }

  saveCollaborateursAssignments(projectId: number): void {
    this.assigningCollaborateurs = true;
    const selectedCollaborateurs =
      this.projectCollaborateursMap.get(projectId) || [];

    // Call to update project collaborators
    // This would ideally be a service method but we'll implement it here temporarily
    this.http
      .post(`${this.apiUrl}/projects/${projectId}/assign-collaborateurs`, {
        collaborateurIds: selectedCollaborateurs,
      })
      .pipe(
        finalize(() => (this.assigningCollaborateurs = false)),
        catchError((error) => {
          console.error('Error assigning collaborateurs:', error);
          this.showNotification('Error assigning collaborators');
          return of(null);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.showNotification('Collaborators assigned successfully');
          // Update the project in the local array
          const projectIndex = this.assignedProjects.findIndex(
            (p) => p.id === projectId
          );
          if (projectIndex !== -1) {
            this.assignedProjects[projectIndex].collaborateurIds =
              selectedCollaborateurs;
          }
        }
      });
  }

  acceptTicket(ticket: Ticket): void {
    this.processingTicket = true;
    this.ticketService
      .updateTicketStatus(ticket.id, 'Accepted')
      .pipe(finalize(() => (this.processingTicket = false)))
      .subscribe({
        next: () => {
          this.showNotification('Ticket accepted');
          ticket.status = 'Accepted';
          this.pendingTickets = this.pendingTickets.filter(
            (t) => t.id !== ticket.id
          );
        },
        error: (error: Error) => {
          console.error('Error accepting ticket:', error);
          this.showNotification('Error accepting ticket');
        },
      });
  }

  rejectTicket(ticket: Ticket): void {
    this.processingTicket = true;
    this.ticketService
      .updateTicketStatus(ticket.id, 'Rejected')
      .pipe(finalize(() => (this.processingTicket = false)))
      .subscribe({
        next: () => {
          this.showNotification('Ticket rejected');
          ticket.status = 'Rejected';
          this.pendingTickets = this.pendingTickets.filter(
            (t) => t.id !== ticket.id
          );
        },
        error: (error: Error) => {
          console.error('Error rejecting ticket:', error);
          this.showNotification('Error rejecting ticket');
        },
      });
  }

  assignTicket(ticket: Ticket, collaborateurId: number): void {
    this.processingTicket = true;
    this.ticketService
      .assignTicket(ticket.id, collaborateurId)
      .pipe(finalize(() => (this.processingTicket = false)))
      .subscribe({
        next: () => {
          this.showNotification('Ticket assigned successfully');
          ticket.assignedToId = collaborateurId;
          ticket.status = 'Assigned';
          this.pendingTickets = this.pendingTickets.filter(
            (t) => t.id !== ticket.id
          );
        },
        error: (error: Error) => {
          console.error('Error assigning ticket:', error);
          this.showNotification('Error assigning ticket');
        },
      });
  }

  getProjectCollaborateurs(projectId: number): User[] {
    const collaborateurIds = this.projectCollaborateursMap.get(projectId) || [];
    return this.collaborateurs.filter(
      (c) => c.id !== undefined && collaborateurIds.includes(c.id)
    );
  }

  showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  updateAssignedCollaborateursList(collaborateurIds: number[]): void {
    // Filter the full collaborateurs list to get only the assigned ones
    this.assignedCollaborateurs = this.collaborateurs.filter(
      (c) => c.id !== undefined && collaborateurIds.includes(c.id)
    );
  }
}
