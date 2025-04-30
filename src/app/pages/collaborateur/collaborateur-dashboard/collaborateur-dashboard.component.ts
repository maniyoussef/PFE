import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { Ticket } from '../../../models/ticket.model';
import { interval, Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReportDialogComponent } from '../report-dialog.component';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';

// Define a new status for the finished state
const TICKET_STATUS = {
  ASSIGNED: 'Assigné',
  IN_PROGRESS: 'En cours',
  FINISHED: 'Terminé',
  RESOLVED: 'Résolu',
  UNRESOLVED: 'Non résolu',
  REFUSED: 'Refusé',
};

@Component({
  selector: 'app-collaborateur-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule,
    DatePipe,
    MatDialogModule,
    RouterLink,
  ],
  templateUrl: './collaborateur-dashboard.component.html',
  styleUrls: ['./collaborateur-dashboard.component.scss'],
})
export class CollaborateurDashboardComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = true;
  userId: number | null = null;

  // Statistics
  totalTickets = 0;
  assignedTickets = 0;
  inProgressTickets = 0;
  resolvedTickets = 0;
  nonResolvedTickets = 0;

  // Filter
  statusFilter: string = 'all';

  // Work timer
  activeTimers: Map<
    number,
    { startTime: Date; subscription: Subscription; elapsed: number }
  > = new Map();

  // Constants for easy reference
  readonly STATUS = TICKET_STATUS;

  // Table columns
  displayedColumns: string[] = [
    'id',
    'title',
    'project',
    'priority',
    'status',
    'createdAt',
    'timer',
    'duration',
  ];

  stats = [
    { title: 'Assignés', icon: 'assignment', value: 0 },
    { title: 'En cours', icon: 'engineering', value: 0 },
    { title: 'Terminés', icon: 'timer_off', value: 0 },
    { title: 'Résolus', icon: 'check_circle', value: 0 },
    { title: 'Non résolus', icon: 'report_problem', value: 0 },
  ];

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('[CollaborateurDashboard] 🏁 Dashboard component initialized');
    this.loadUserId();
  }

  ngOnDestroy(): void {
    // Clean up all active timers
    this.activeTimers.forEach((timer) => {
      if (timer.subscription) {
        timer.subscription.unsubscribe();
      }
    });
  }

  async loadUserId(): Promise<void> {
    console.log('[CollaborateurDashboard] 👤 Loading user ID');
    try {
      // First try to get user from localStorage as a fallback
      let storedUser: User | null = null;
      try {
        // Read from 'user' to match the key used in auth.service.ts storeTokenData method
        const userString = localStorage.getItem('user');
        if (userString) {
          storedUser = JSON.parse(userString) as User;
          console.log(
            '[CollaborateurDashboard] 📋 User from localStorage:',
            storedUser
          );
        }
      } catch (e) {
        console.error(
          '[CollaborateurDashboard] ❌ Error parsing stored user:',
          e
        );
      }

      // Attempt to force the authService to load user from localStorage
      if (!this.authService.user() && storedUser) {
        console.log(
          '[CollaborateurDashboard] 🔄 Forcing authService to load stored user'
        );
        // This will load the user from localStorage
        this.authService.isLoggedIn();
      }

      // Call debug method to log detailed role information
      this.authService.debugRoleInfo();

      // Get the user from the auth service
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          if (user) {
            console.log(
              '[CollaborateurDashboard] ✅ User loaded from service:',
              user.id
            );
            this.userId = user.id || null;
            this.loadTickets();
          } else if (storedUser && storedUser.id) {
            // Fallback to the stored user if the service didn't return a user
            console.log(
              '[CollaborateurDashboard] ⚠️ Using stored user as fallback:',
              storedUser.id
            );
            this.userId = storedUser.id;

            // Restore the user to the service
            this.authService.restoreUserFromStorage();

            this.loadTickets();
          } else {
            console.error(
              '[CollaborateurDashboard] ❌ User not found or not authenticated'
            );
            this.router.navigate(['/login']);
          }
        },
        error: (error) => {
          if (storedUser && storedUser.id) {
            // Fallback to the stored user if there was an error
            console.log(
              '[CollaborateurDashboard] ⚠️ Error but using stored user as fallback:',
              storedUser.id
            );
            this.userId = storedUser.id;
            this.loadTickets();
          } else {
            console.error(
              '[CollaborateurDashboard] ❌ Error getting current user:',
              error
            );
            this.router.navigate(['/login']);
          }
        },
      });
    } catch (error) {
      console.error('[CollaborateurDashboard] ❌ Error in loadUserId:', error);
      this.showSnackbar(
        'Erreur lors du chargement des informations utilisateur.'
      );
      this.isLoading = false;
    }
  }

  async loadTickets(): Promise<void> {
    if (!this.userId) {
      this.isLoading = false;
      return;
    }

    try {
      // Use ticketService instead of direct HTTP call
      this.ticketService.getAssignedTickets(this.userId).subscribe({
        next: (tickets) => {
          console.log('Received tickets:', tickets);

          // Debug: Log each ticket status
          tickets.forEach((ticket) => {
            console.log(
              `Ticket #${ticket.id} - Status: "${
                ticket.status
              }" - Type: ${typeof ticket.status}`
            );
          });

          // Filter to only show tickets with status "Assigné" or "En cours"
          this.tickets = tickets.filter(
            (ticket) =>
              ticket.status === 'Assigné' ||
              ticket.status === this.STATUS.ASSIGNED ||
              ticket.status === 'En cours' ||
              ticket.status === this.STATUS.IN_PROGRESS
          );

          // Check for active tickets and restore timers
          this.tickets.forEach((ticket) => {
            if (ticket.status === 'En cours' && ticket.startTime) {
              this.restoreTimer(ticket);
            }
          });

          this.updateStatistics();
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading tickets:', error);
          this.showSnackbar('Erreur lors du chargement des tickets.');
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Error in loadTickets:', error);
      this.showSnackbar('Erreur lors du chargement des tickets.');
      this.isLoading = false;
    }
  }

  updateStatistics(): void {
    this.totalTickets = this.tickets.length;
    this.assignedTickets = this.tickets.filter(
      (ticket) => ticket.status === 'Assigné'
    ).length;
    this.inProgressTickets = this.tickets.filter(
      (ticket) => ticket.status === 'En cours'
    ).length;
    this.resolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === 'Résolu'
    ).length;
    this.nonResolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === 'Non résolu'
    ).length;

    // Update stats array for UI
    this.stats[0].value = this.assignedTickets;
    this.stats[1].value = this.inProgressTickets;
    this.stats[2].value = this.tickets.filter(
      (ticket) => ticket.status === 'Terminé'
    ).length;
    this.stats[3].value = this.resolvedTickets;
    this.stats[4].value = this.nonResolvedTickets;
  }

  applyFilters(): void {
    if (this.statusFilter === 'all') {
      // Only include assigned or in progress tickets
      this.filteredTickets = [...this.tickets];
    } else {
      this.filteredTickets = this.tickets.filter(
        (ticket) =>
          ticket.status &&
          ticket.status.toLowerCase() === this.statusFilter.toLowerCase()
      );
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  async startWork(ticket: Ticket): Promise<void> {
    if (!this.userId) return;

    try {
      // Update ticket status to 'En cours'
      const startTime = new Date();
      ticket.status = 'En cours';
      ticket.startTime = startTime;
      ticket.temporarilyStopped = false;

      await this.http
        .put<Ticket>(`/api/Tickets/${ticket.id}`, {
          ...ticket,
          status: 'En cours',
          startWorkTime: startTime.toISOString(),
          temporarilyStopped: false,
        })
        .toPromise();

      // Start the timer
      this.startTimer(ticket);

      this.updateStatistics();
      this.showSnackbar('Ticket marqué comme "En cours"');
    } catch (error) {
      console.error('Error starting work:', error);
      this.showSnackbar('Erreur lors du démarrage du travail sur le ticket.');
    }
  }

  async pauseWork(ticket: Ticket): Promise<void> {
    if (!this.userId) return;

    try {
      // Update temporarilyStopped flag
      ticket.temporarilyStopped = true;

      await this.http
        .put<Ticket>(`/api/Tickets/${ticket.id}`, {
          ...ticket,
          temporarilyStopped: true,
        })
        .toPromise();

      // Stop the timer temporarily
      this.stopTimer(ticket.id);

      this.updateStatistics();
      this.showSnackbar('Travail temporairement arrêté');
    } catch (error) {
      console.error('Error pausing work:', error);
      this.showSnackbar('Erreur lors de la pause du travail sur le ticket.');
    }
  }

  async resumeWork(ticket: Ticket): Promise<void> {
    if (!this.userId) return;

    try {
      // Update temporarilyStopped flag
      ticket.temporarilyStopped = false;

      await this.http
        .put<Ticket>(`/api/Tickets/${ticket.id}`, {
          ...ticket,
          temporarilyStopped: false,
        })
        .toPromise();

      // Restart the timer
      this.startTimer(ticket);

      this.updateStatistics();
      this.showSnackbar('Travail repris');
    } catch (error) {
      console.error('Error resuming work:', error);
      this.showSnackbar('Erreur lors de la reprise du travail sur le ticket.');
    }
  }

  async finishWork(ticket: Ticket): Promise<void> {
    if (!this.userId) return;

    try {
      // Update ticket status to 'Terminé'
      const finishTime = new Date();
      ticket.status = 'Terminé';
      ticket.finishWorkTime = finishTime.toISOString();
      ticket.workFinished = true;

      await this.http
        .put<Ticket>(`/api/Tickets/${ticket.id}`, {
          ...ticket,
          status: 'Terminé',
          finishWorkTime: finishTime.toISOString(),
          workFinished: true,
        })
        .toPromise();

      // Stop the timer
      this.stopTimer(ticket.id);

      this.updateStatistics();
      this.showSnackbar('Ticket marqué comme "Terminé"');
    } catch (error) {
      console.error('Error finishing work:', error);
      this.showSnackbar(
        'Erreur lors de la finalisation du travail sur le ticket.'
      );
    }
  }

  openResolveDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '500px',
      data: {
        title: 'Rapport de résolution',
        action: 'résolvez',
        isRequired: false,
        placeholder: 'Fournir un rapport de résolution (optionnel)...',
      },
    });

    dialogRef.afterClosed().subscribe((report) => {
      if (report !== undefined) {
        // User confirmed with report or empty report
        this.resolveTicket(ticket, report);
      }
    });
  }

  openUnresolveDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '500px',
      data: {
        title: 'Rapport de non-résolution',
        action: 'ne parvenez pas à résoudre',
        isRequired: true, // Non-resolution report is required
        placeholder:
          'Veuillez expliquer pourquoi le ticket ne peut pas être résolu...',
      },
    });

    dialogRef.afterClosed().subscribe((report) => {
      if (report) {
        // Only proceed if report provided (required)
        this.unresolveTicket(ticket, report);
      }
    });
  }

  async resolveTicket(ticket: Ticket, report?: string): Promise<void> {
    if (!this.userId) return;

    try {
      // Update ticket status to 'Résolu'
      ticket.status = 'Résolu';
      if (report) {
        ticket.report = report;
      }

      await this.http
        .put<Ticket>(`/api/Tickets/${ticket.id}`, {
          ...ticket,
          status: 'Résolu',
          report: report || ticket.report,
        })
        .toPromise();

      this.updateStatistics();
      this.applyFilters();
      this.showSnackbar('Ticket marqué comme "Résolu"');
    } catch (error) {
      console.error('Error resolving ticket:', error);
      this.showSnackbar('Erreur lors de la résolution du ticket.');
    }
  }

  async unresolveTicket(ticket: Ticket, report: string): Promise<void> {
    if (!this.userId) return;

    try {
      // Update ticket status to 'Non résolu'
      ticket.status = 'Non résolu';
      ticket.report = report;

      await this.http
        .put<Ticket>(`/api/Tickets/${ticket.id}`, {
          ...ticket,
          status: 'Non résolu',
          report: report,
        })
        .toPromise();

      this.updateStatistics();
      this.applyFilters();
      this.showSnackbar('Ticket marqué comme "Non résolu"');
    } catch (error) {
      console.error('Error marking ticket as unresolved:', error);
      this.showSnackbar('Erreur lors de la modification du statut du ticket.');
    }
  }

  startTimer(ticket: Ticket): void {
    if (this.activeTimers.has(ticket.id)) {
      return;
    }

    const startTime = new Date();
    const subscription = interval(1000).subscribe(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      this.activeTimers.get(ticket.id)!.elapsed = elapsed;
    });

    this.activeTimers.set(ticket.id, {
      startTime,
      subscription,
      elapsed: 0,
    });
  }

  stopTimer(ticketId: number): void {
    const timer = this.activeTimers.get(ticketId);
    if (timer && timer.subscription) {
      timer.subscription.unsubscribe();
      this.activeTimers.delete(ticketId);
    }
  }

  restoreTimer(ticket: Ticket): void {
    if (!ticket.startTime) return;

    const startTime = new Date(ticket.startTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const subscription = interval(1000).subscribe(() => {
      const currentTime = new Date();
      const newElapsed = Math.floor(
        (currentTime.getTime() - startTime.getTime()) / 1000
      );
      this.activeTimers.get(ticket.id)!.elapsed = newElapsed;
    });

    this.activeTimers.set(ticket.id, {
      startTime,
      subscription,
      elapsed,
    });
  }

  getElapsedTime(ticketId: number): string {
    const timer = this.activeTimers.get(ticketId);
    if (!timer) return '00:00:00';

    const hours = Math.floor(timer.elapsed / 3600);
    const minutes = Math.floor((timer.elapsed % 3600) / 60);
    const seconds = timer.elapsed % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getWorkDuration(ticket: Ticket): string {
    if (!ticket.startWorkTime || !ticket.finishWorkTime) return '00:00:00';

    const start = new Date(ticket.startWorkTime);
    const finish = new Date(ticket.finishWorkTime);
    const duration = Math.floor((finish.getTime() - start.getTime()) / 1000);

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'priority-normal';

    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'priority-urgent';
      case 'élevée':
      case 'elevee':
      case 'high':
        return 'priority-high';
      case 'normale':
      case 'normal':
      case 'medium':
        return 'priority-normal';
      case 'basse':
      case 'low':
        return 'priority-low';
      default:
        return 'priority-normal';
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'assigné':
        return 'status-assigned';
      case 'en cours':
        return 'status-in-progress';
      case 'terminé':
        return 'status-finished';
      case 'résolu':
        return 'status-resolved';
      case 'non résolu':
        return 'status-unresolved';
      default:
        return '';
    }
  }

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
