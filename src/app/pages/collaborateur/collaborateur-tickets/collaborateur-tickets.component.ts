import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ticket } from '../../../models/ticket.model';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { lastValueFrom } from 'rxjs';
import { ReportDialogComponent } from '../report-dialog.component';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';
import { CommentDialogComponent } from './comment-dialog.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { TicketService } from '../../../services/ticket.service';
import { TicketDebugService } from '../../../services/ticket-debug.service';
import {
  interval,
  Subscription,
  Subject,
  takeUntil,
  map,
  finalize,
  switchMap,
  take,
} from 'rxjs';
import { TICKET_STATUS } from '../../../constants/ticket-status.constant';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RouterLink } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-collaborateur-tickets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './collaborateur-tickets.component.html',
  styleUrls: ['./collaborateur-tickets.component.scss'],
})
export class CollaborateurTicketsComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  displayedColumns: string[] = [
    'title',
    'project',
    'priority',
    'status',
    'workDuration',
    'actions',
  ];
  isLoading = true;
  error: string | null = null;
  currentUserId!: number;
  private destroy$ = new Subject<void>();
  activeTimer: { ticketId: number; subscription: Subscription } | null = null;
  private lastServerUpdate: { [key: number]: number } = {};
  private readonly UPDATE_INTERVAL = 60000; // 1 minute in milliseconds
  currentDurations: { [key: number]: string } = {};

  // Statistics properties
  totalTickets = 0;
  resolvedTickets = 0;
  nonResolvedTickets = 0;
  inProgressTickets = 0;
  averageDuration = '0m';

  // Constants for easy reference
  readonly STATUS = TICKET_STATUS;

  // Common variables moved to class level for better tracking and debugging
  private timerStartedAt: Date | null = null;
  private baseAccumulatedDuration = 0; // Tracks duration already saved in DB

  dataSource!: MatTableDataSource<Ticket>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private ticketService: TicketService,
    private ticketDebugService: TicketDebugService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.auth.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id !== undefined) {
          this.currentUserId = user.id as number; // Force type assertion after null check
          this.loadTickets();
        } else {
          console.error('User not found or ID is undefined');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error fetching current user:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.activeTimer) {
      this.activeTimer.subscription.unsubscribe();
    }
  }

  loadTickets(): void {
    this.isLoading = true;

    this.auth
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user || user.id === undefined) {
            throw new Error('User not found or ID is undefined');
          }

          this.currentUserId = user.id;
          console.log(
            `[CollaborateurTicketsComponent] Loading tickets for user ID: ${this.currentUserId}`
          );

          // Get tickets explicitly assigned to the current user using the dedicated endpoint
          return this.ticketService.getUserAssignedTickets(this.currentUserId);
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (tickets) => {
          console.log(
            `[CollaborateurTicketsComponent] Retrieved ${tickets.length} tickets assigned to collaborateur`
          );

          // Normalize ticket status to use the standard format
          this.tickets = tickets.map((ticket) => {
            // If status is in uppercase or lowercase format, convert to standard format
            if (
              ticket.status?.toUpperCase() === 'ASSIGNED' ||
              ticket.status === 'assigné'
            ) {
              return { ...ticket, status: this.STATUS.ASSIGNED };
            }
            return ticket;
          });

          // Initialize table data source
          this.dataSource = new MatTableDataSource(this.tickets);
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }

          // Update statistics
          this.updateStatistics();

          // Restore timer state if there's an active ticket
          this.restoreTimerStateIfNeeded();
        },
        error: (error) => {
          console.error(
            '[CollaborateurTicketsComponent] Error loading tickets',
            error
          );
          this.error =
            'Erreur lors du chargement des tickets. Veuillez réessayer.';
          this.snackBar.open(
            'Erreur lors du chargement des tickets',
            'Fermer',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            }
          );
        },
      });
  }

  private restoreTimerStateIfNeeded(): void {
    // If we already have an active timer, don't do anything
    if (this.activeTimer) return;

    // Check for active tickets that need timer restoration
    const activeTicket = this.tickets.find(
      (ticket) =>
        ticket.status === this.STATUS.IN_PROGRESS &&
        !ticket.temporarilyStopped &&
        !ticket.workFinished &&
        ticket.workDuration !== undefined
    );

    if (activeTicket) {
      console.log(
        '[TIMER] Found active ticket that was in progress:',
        activeTicket
      );

      // Don't auto-start the timer, just notify the user they have an active ticket
      this.snackBar.open(
        `Le ticket "${activeTicket.title}" est en cours. Cliquez sur "Commencer" pour reprendre le travail.`,
        'Fermer',
        { duration: 5000 }
      );

      // We don't automatically start the timer anymore
      // Just log for debugging purposes
      console.log(
        '[TIMER] Timer NOT auto-started, waiting for user to click "Commencer":',
        {
          ticketId: activeTicket.id,
          baseAccumulatedDuration: activeTicket.workDuration || 0,
        }
      );
    }
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  private updateActiveTimers(): void {
    if (!this.activeTimer) return;

    const ticket = this.tickets.find(
      (t) => t.id === this.activeTimer?.ticketId
    );
    if (!ticket) return;

    // Calculate current session duration in seconds with actual time checks
    const now = new Date();
    const currentSessionDuration = this.calculateExactSessionDuration(now);

    // Total duration = what was in DB (baseAccumulatedDuration) + current session duration
    const totalDuration = this.baseAccumulatedDuration + currentSessionDuration;

    // Debug log (only every 5 seconds to reduce noise)
    if (currentSessionDuration % 5 === 0) {
      console.log(`[TIMER DEBUG] Update for ticket ${ticket.id}:`, {
        baseAccumulatedDuration: this.baseAccumulatedDuration,
        currentSessionDuration,
        totalDuration,
        timerStartedAt: this.timerStartedAt?.toISOString(),
        nowTime: now.toISOString(),
        diff_ms: this.timerStartedAt
          ? now.getTime() - this.timerStartedAt.getTime()
          : 0,
      });
    }

    // IMPORTANT: Update UI with correct total
    const index = this.tickets.findIndex((t) => t.id === ticket.id);
    if (index !== -1) {
      // Create a new array reference to force change detection
      this.tickets = [
        ...this.tickets.slice(0, index),
        {
          ...ticket,
          workDuration: totalDuration,
          // Store currentSession separately to avoid calculation errors with the data model
          currentSessionDuration: currentSessionDuration,
        },
        ...this.tickets.slice(index + 1),
      ];
    }

    // Save to server periodically
    const nowTime = now.getTime();
    if (
      !this.lastServerUpdate[ticket.id] ||
      nowTime - this.lastServerUpdate[ticket.id] >= this.UPDATE_INTERVAL
    ) {
      console.log(
        `[TIMER] Saving to DB: ${totalDuration} seconds for ticket ${ticket.id}`
      );

      // CRITICAL: Send only the minimum necessary data to update the work duration
      // This prevents 400 Bad Request errors by not sending incomplete data
      this.ticketService
        .updateTicketWorkDuration(ticket.id, totalDuration)
        .subscribe({
          next: (response) => {
            console.log(
              `[TIMER] Saved duration ${totalDuration} to DB`,
              response
            );
            this.lastServerUpdate[ticket.id] = nowTime;
            // IMPORTANT: Update our base with the value we just saved
            this.baseAccumulatedDuration = totalDuration;
          },
          error: (err) => {
            console.error('[TIMER] Error saving duration to DB:', err);
            // Don't show error to the user to avoid excessive notifications
          },
        });
    }
  }

  // Precise calculation function for duration
  private calculateExactSessionDuration(now: Date): number {
    if (!this.timerStartedAt) return 0;

    // Use exact millisecond calculations then convert to seconds
    const exact_ms = now.getTime() - this.timerStartedAt.getTime();
    return Math.floor(exact_ms / 1000); // Use floor to avoid rounding up prematurely
  }

  private updateStatistics(): void {
    this.totalTickets = this.tickets.length;
    this.resolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === this.STATUS.RESOLVED
    ).length;
    this.nonResolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === this.STATUS.UNRESOLVED
    ).length;
    this.inProgressTickets = this.tickets.filter(
      (ticket) => ticket.status === this.STATUS.IN_PROGRESS
    ).length;

    // Calculate average duration
    const totalDuration = this.tickets.reduce(
      (sum, ticket) => sum + (ticket.workDuration || 0),
      0
    );

    if (this.totalTickets > 0) {
      const averageSeconds = Math.round(totalDuration / this.totalTickets);
      this.averageDuration = this.formatDurationHumanReadable(averageSeconds);
    } else {
      this.averageDuration = '00:00:00';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case this.STATUS.ASSIGNED:
        return 'assignment';
      case this.STATUS.IN_PROGRESS:
        return 'engineering';
      case this.STATUS.RESOLVED:
        return 'check_circle';
      case this.STATUS.UNRESOLVED:
        return 'report_problem';
      default:
        return 'help';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case this.STATUS.ASSIGNED:
        return 'status-assigned';
      case this.STATUS.IN_PROGRESS:
        return 'status-in-progress';
      case this.STATUS.RESOLVED:
        return 'status-resolved';
      case this.STATUS.UNRESOLVED:
        return 'status-unresolved';
      default:
        return '';
    }
  }

  onStartWork(ticket: Ticket): void {
    // Don't allow starting work on a different ticket if one is already active
    if (this.activeTimer && this.activeTimer.ticketId !== ticket.id) {
      this.showError(
        "Veuillez arrêter le travail sur le ticket actif avant d'en démarrer un autre"
      );
      return;
    }

    // Handle resuming work on a paused ticket
    const wasTemporarilyStopped = ticket.temporarilyStopped;

    // Store the base accumulated duration (either current or 0 if starting fresh)
    // For 'in progress' tickets, always use the existing duration
    if (ticket.status === this.STATUS.IN_PROGRESS) {
      this.baseAccumulatedDuration = ticket.workDuration || 0;
      console.log(
        '[TIMER] Using saved duration for IN_PROGRESS ticket:',
        this.baseAccumulatedDuration
      );
    } else {
      // For new tickets (assigned status), start from 0
      this.baseAccumulatedDuration = wasTemporarilyStopped
        ? ticket.workDuration || 0
        : 0;
      console.log(
        '[TIMER] Using duration for new/paused ticket:',
        this.baseAccumulatedDuration
      );
    }

    const timestamp = new Date();
    this.timerStartedAt = timestamp;

    console.log('[TIMER] STARTING work on ticket:', ticket.id, {
      timestamp: timestamp.toISOString(),
      wasTemporarilyStopped,
      baseAccumulatedDuration: this.baseAccumulatedDuration,
      currentStatus: ticket.status,
    });

    // Set the ticket to in-progress status (2)
    const index = this.tickets.findIndex((t) => t.id === ticket.id);
    if (index !== -1) {
      this.tickets[index] = {
        ...this.tickets[index],
        status: this.STATUS.IN_PROGRESS,
        temporarilyStopped: false,
        startWorkTime: wasTemporarilyStopped
          ? this.tickets[index].startWorkTime
          : timestamp.toISOString(),
        currentSessionDuration: 0, // Initialize session duration
      };

      // Force change detection
      this.tickets = [...this.tickets];
    }

    // Create a timer that updates the UI every second
    const timer = interval(1000).pipe(
      map(() => {
        const now = new Date();
        const sessionDuration = this.calculateExactSessionDuration(now);

        // Update the UI with the new duration
        const ticketIndex = this.tickets.findIndex((t) => t.id === ticket.id);
        if (ticketIndex !== -1) {
          this.tickets[ticketIndex] = {
            ...this.tickets[ticketIndex],
            currentSessionDuration: sessionDuration,
            workDuration: this.baseAccumulatedDuration + sessionDuration,
          };

          // Force change detection for the tickets array
          this.tickets = [...this.tickets];
        }

        return now;
      })
    );

    // Subscribe to the timer and save the subscription so we can unsubscribe later
    const subscription = timer.subscribe({
      next: (now) => {
        // Save the timer details for this ticket
        this.activeTimer = {
          ticketId: ticket.id,
          subscription,
        };
      },
      error: (err) => {
        console.error('[TIMER] Error in timer:', err);
        this.showError('Erreur avec le timer');
      },
    });

    // Initial subscription so we don't have to wait 1 second for the first update
    this.activeTimer = {
      ticketId: ticket.id,
      subscription,
    };

    // Initialize tracking for server updates (important for periodic saves)
    this.lastServerUpdate[ticket.id] = timestamp.getTime();

    // First update the workflow properties
    this.ticketService
      .updateTicketWorkflow(ticket.id, {
        temporarilyStopped: false,
        startWorkTime: wasTemporarilyStopped
          ? ticket.startWorkTime
          : timestamp.toISOString(),
      })
      .subscribe({
        next: (response) => {
          // Then update the status separately
          this.ticketService
            .directUpdateTicket(ticket.id, {
              status: this.STATUS.IN_PROGRESS,
            })
            .subscribe({
              next: () => {
                console.log(
                  '[TIMER] Successfully updated ticket workflow and status'
                );
                this.snackBar.open(
                  wasTemporarilyStopped
                    ? `Reprise du travail sur le ticket #${
                        ticket.id
                      } à partir de ${this.formatDurationHumanReadable(
                        this.baseAccumulatedDuration
                      )}`
                    : `Début du travail sur le ticket #${ticket.id}`,
                  'Fermer',
                  { duration: 3000 }
                );
              },
              error: (err) => {
                console.error('[TIMER] Failed to update ticket status:', err);
                // Still show success because the workflow was updated
                this.snackBar.open(
                  wasTemporarilyStopped
                    ? `Reprise du travail sur le ticket #${ticket.id}`
                    : `Début du travail sur le ticket #${ticket.id}`,
                  'Fermer',
                  { duration: 3000 }
                );
              },
            });
        },
        error: (err) => {
          console.error('[TIMER] Failed to start work:', err);
          this.showError(
            'Erreur: Impossible de démarrer le travail sur ce ticket'
          );
          this.loadTickets();

          // Clean up the timer if we couldn't update the backend
          if (this.activeTimer?.ticketId === ticket.id) {
            this.activeTimer.subscription.unsubscribe();
            this.activeTimer = null;
            this.timerStartedAt = null;
          }
        },
      });
  }

  onStopTemporarily(ticket: Ticket): void {
    if (!this.activeTimer || this.activeTimer.ticketId !== ticket.id) {
      this.showError('Aucun timer actif pour ce ticket');
      return;
    }

    console.log('[TIMER] PAUSING work on ticket:', ticket.id);

    // Stop the timer subscription
    this.activeTimer.subscription.unsubscribe();

    // Calculate final duration for this session
    const now = new Date();
    const currentSessionDuration = this.calculateExactSessionDuration(now);
    const totalDuration = this.baseAccumulatedDuration + currentSessionDuration;

    console.log('[TIMER] Pausing with calculated duration:', {
      baseAccumulatedDuration: this.baseAccumulatedDuration,
      currentSessionDuration,
      totalDuration,
      startedAt: this.timerStartedAt?.toISOString(),
      now: now.toISOString(),
    });

    // Clean up timer state
    this.activeTimer = null;
    this.timerStartedAt = null;

    // Update UI
    const index = this.tickets.findIndex((t) => t.id === ticket.id);
    if (index !== -1) {
      this.tickets[index] = {
        ...this.tickets[index],
        temporarilyStopped: true,
        workDuration: totalDuration,
        finishWorkTime: now.toISOString(),
        currentSessionDuration: 0, // Reset session counter
      };

      // Force change detection
      this.tickets = [...this.tickets];
    }

    // Update both workflow properties in a single API call
    this.ticketService
      .updateTicketWorkflow(ticket.id, {
        temporarilyStopped: true,
        workDuration: totalDuration,
        finishWorkTime: now.toISOString(),
      })
      .subscribe({
        next: (response) => {
          console.log(
            '[TIMER] Successfully saved paused timer data:',
            response
          );
          this.snackBar.open(
            `Travail arrêté temporairement à ${this.formatDurationHumanReadable(
              totalDuration
            )}`,
            'Fermer',
            { duration: 3000 }
          );
        },
        error: (err) => {
          console.error('[TIMER] Failed to stop work:', err);
          this.showError(
            "Erreur: Impossible d'arrêter le travail sur ce ticket"
          );
          this.loadTickets();
        },
      });
  }

  getWorkDuration(ticket: Ticket): string {
    // Only recalculate for the active timer
    if (this.activeTimer?.ticketId === ticket.id && this.timerStartedAt) {
      // Calculate real-time duration based on activeTimer
      const now = new Date();
      const currentSessionDuration = this.calculateExactSessionDuration(now);
      const totalDuration =
        this.baseAccumulatedDuration + currentSessionDuration;

      return `⏱️ ${this.formatDurationHumanReadable(totalDuration)}`;
    }
    // Use stored values for all other cases
    else if (ticket.temporarilyStopped) {
      return `⏸️ ${this.formatDurationHumanReadable(ticket.workDuration || 0)}`;
    } else if (ticket.workFinished) {
      return `✓ ${this.formatDurationHumanReadable(ticket.workDuration || 0)}`;
    } else if (ticket.workDuration && ticket.workDuration > 0) {
      // Show stored duration even if not active
      return `⏲️ ${this.formatDurationHumanReadable(ticket.workDuration)}`;
    } else {
      return '⏲️ 00:00:00';
    }
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '00:00:00';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours.toString().padStart(2, '0')}:${remainingMinutes
      .toString()
      .padStart(2, '0')}:00`;
  }

  openResolveReportDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '500px',
      data: {
        title: 'Marquer comme résolu',
        action: 'résolvez',
        isRequired: true,
        placeholder: 'Veuillez décrire comment vous avez résolu ce ticket...',
      },
    });

    dialogRef.afterClosed().subscribe((report) => {
      if (report) {
        console.log('[WorkflowAction] Resolve ticket with report:', ticket.id);

        // STEP 1: Immediate UI update
        const index = this.tickets.findIndex((t) => t.id === ticket.id);
        if (index !== -1) {
          this.tickets[index] = {
            ...this.tickets[index],
            status: this.STATUS.RESOLVED,
            report: report,
            workFinished: true,
          };

          // Force change detection
          this.tickets = [...this.tickets];
        }

        // STEP 2: Server-side update - direct update
        const updatedTicket: Partial<Ticket> = {
          title: ticket.title,
          description: ticket.description,
          qualification: ticket.qualification || '',
          project: ticket.project,
          problemCategory: ticket.problemCategory,
          priority: ticket.priority,
          assignedToId: ticket.assignedToId,
          attachment: ticket.attachment || '',
          status: this.STATUS.RESOLVED,
          report: report,
          temporarilyStopped: false,
          workFinished: true,
        };

        this.ticketService
          .directUpdateTicket(ticket.id, updatedTicket)
          .subscribe({
            next: (response) => {
              console.log(
                '[WorkflowSuccess] Resolved ticket with report:',
                response
              );
              this.snackBar.open(
                'Ticket marqué comme résolu avec rapport',
                'Fermer',
                { duration: 3000 }
              );
            },
            error: (err) => {
              console.error(
                '[WorkflowError] Failed to resolve ticket with report:',
                err
              );
              this.snackBar.open(
                'Erreur: Impossible de résoudre le ticket',
                'Fermer',
                { duration: 5000, panelClass: ['error-snackbar'] }
              );

              // Reload tickets to restore correct state
              this.loadTickets();
            },
          });
      }
    });
  }

  onUnresolve(ticket: Ticket): void {
    // Make sure the work is finished
    if (!ticket.workFinished) {
      this.snackBar.open(
        "Vous devez d'abord terminer votre travail sur ce ticket",
        'Fermer',
        { duration: 3000 }
      );
      return;
    }

    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '500px',
      data: {
        title: 'Marquer comme non résolu',
        action: 'marquez comme non résolu',
        isRequired: true,
        placeholder:
          'Veuillez expliquer pourquoi le ticket ne peut pas être résolu...',
      },
    });

    dialogRef.afterClosed().subscribe((report) => {
      if (report) {
        console.log('[WorkflowAction] Mark ticket as unresolved:', ticket.id);

        // STEP 1: Immediate UI update
        const index = this.tickets.findIndex((t) => t.id === ticket.id);
        if (index !== -1) {
          this.tickets[index] = {
            ...this.tickets[index],
            status: this.STATUS.UNRESOLVED,
            report: report,
            workFinished: true,
          };

          // Force change detection
          this.tickets = [...this.tickets];
        }

        // STEP 2: Server-side update - direct update
        const updatedTicket: Partial<Ticket> = {
          title: ticket.title,
          description: ticket.description,
          qualification: ticket.qualification || '',
          project: ticket.project,
          problemCategory: ticket.problemCategory,
          priority: ticket.priority,
          assignedToId: ticket.assignedToId,
          attachment: ticket.attachment || '',
          status: this.STATUS.UNRESOLVED,
          report: report,
          temporarilyStopped: false,
          workFinished: true,
        };

        this.ticketService
          .directUpdateTicket(ticket.id, updatedTicket)
          .subscribe({
            next: (response) => {
              console.log(
                '[WorkflowSuccess] Marked ticket as unresolved:',
                response
              );
              this.snackBar.open('Ticket marqué comme non résolu', 'Fermer', {
                duration: 3000,
              });
            },
            error: (err) => {
              console.error(
                '[WorkflowError] Failed to mark ticket as unresolved:',
                err
              );
              this.snackBar.open(
                'Erreur: Impossible de marquer le ticket comme non résolu',
                'Fermer',
                { duration: 5000, panelClass: ['error-snackbar'] }
              );

              // Reload tickets to restore correct state
              this.loadTickets();
            },
          });
      }
    });
  }

  updateTicket(updatedTicket: Ticket, successMessage: string): void {
    console.log('updateTicket called with:', updatedTicket);

    this.ticketService.updateTicket(updatedTicket).subscribe({
      next: (response) => {
        console.log('Server response for updateTicket:', response);

        // Find the ticket in the array and update it
        const index = this.tickets.findIndex((t) => t.id === updatedTicket.id);
        if (index !== -1) {
          // Create a new reference to ensure change detection
          this.tickets = [
            ...this.tickets.slice(0, index),
            { ...updatedTicket, ...response }, // Merge response with local changes
            ...this.tickets.slice(index + 1),
          ];

          console.log('Updated tickets array:', this.tickets);
        }

        this.snackBar.open(successMessage, 'Fermer', {
          duration: 3000,
        });

        // Force the component to refresh
        setTimeout(() => this.loadTickets(), 500);
      },
      error: (err) => {
        console.error('Error updating ticket:', err);
        this.snackBar.open(
          `Erreur lors de la mise à jour du ticket: ${
            err.message || 'Unknown error'
          }`,
          'Fermer',
          {
            duration: 5000,
            panelClass: ['error-snackbar'],
          }
        );
      },
    });
  }

  openCommentDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '500px',
      data: { ticket },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.updated) {
        this.loadTickets();
      }
    });
  }

  showDescription(ticket: Ticket): void {
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket },
    });
  }

  formatDurationHumanReadable(seconds: number): string {
    // Ensure seconds is a valid number
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      console.warn('[Timer] Invalid duration value:', seconds);
      return '00:00:00';
    }

    // Ensure seconds is a positive integer
    seconds = Math.max(0, Math.round(seconds));

    // Convert to hours, minutes, seconds
    const hours = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;

    // Format as HH:MM:SS
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = secs.toString().padStart(2, '0');

    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  // For backward compatibility, remove after full refactoring
  onPauseWorking(ticket: Ticket): void {
    this.onStopTemporarily(ticket);
  }

  // For backward compatibility, remove after full refactoring
  onWorkCompleted(ticket: Ticket): void {
    this.onFinish(ticket);
  }

  // For backward compatibility, remove after full refactoring
  onFinishWorking(ticket: Ticket): void {
    this.onFinish(ticket);
  }

  onResolve(ticket: Ticket): void {
    console.log('[WorkflowAction] Resolve ticket:', ticket.id);

    // Open confirmation dialog to ask if the user wants to add a report
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Résolution de ticket',
        message:
          'Souhaitez-vous ajouter un rapport détaillé pour expliquer la résolution?',
        confirmText: 'Oui, ajouter un rapport',
        cancelText: 'Non, résoudre sans rapport',
      },
    });

    confirmDialog.afterClosed().subscribe((result) => {
      if (result === true) {
        // User wants to add a report
        this.openResolveReportDialog(ticket);
      } else if (result === false) {
        // User doesn't want to add a report
        this.resolveTicketWithoutReport(ticket);
      }
      // If dialog was dismissed (undefined), do nothing
    });
  }

  resolveTicketWithoutReport(ticket: Ticket): void {
    console.log('[WorkflowAction] Resolve ticket without report:', ticket.id);

    // Add a simple comment
    const comment = `${new Date().toLocaleString()} - Résolu sans rapport détaillé`;
    const updatedCommentaire = `${ticket.commentaire || ''}\n${comment}`;

    // STEP 1: Immediate UI update
    const index = this.tickets.findIndex((t) => t.id === ticket.id);
    if (index !== -1) {
      this.tickets[index] = {
        ...this.tickets[index],
        status: this.STATUS.RESOLVED,
        commentaire: updatedCommentaire,
        workFinished: true,
      };

      // Force change detection
      this.tickets = [...this.tickets];
    }

    // STEP 2: Server-side update - direct update
    const updatedTicket: Partial<Ticket> = {
      title: ticket.title,
      description: ticket.description,
      qualification: ticket.qualification || '',
      project: ticket.project,
      problemCategory: ticket.problemCategory,
      priority: ticket.priority,
      assignedToId: ticket.assignedToId,
      attachment: ticket.attachment || '',
      status: this.STATUS.RESOLVED,
      commentaire: updatedCommentaire,
      temporarilyStopped: false,
      workFinished: true,
    };

    this.ticketService.directUpdateTicket(ticket.id, updatedTicket).subscribe({
      next: (response) => {
        console.log(
          '[WorkflowSuccess] Resolved ticket without report:',
          response
        );
        this.snackBar.open('Ticket marqué comme résolu', 'Fermer', {
          duration: 3000,
        });
      },
      error: (err) => {
        console.error(
          '[WorkflowError] Failed to resolve ticket without report:',
          err
        );
        this.snackBar.open(
          'Erreur: Impossible de résoudre le ticket',
          'Fermer',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );

        // Reload tickets to restore correct state
        this.loadTickets();
      },
    });
  }

  onResumeWorking(ticket: Ticket): void {
    this.onStartWork(ticket);
  }

  // Add onFinish method with critical fixes
  onFinish(ticket: Ticket): void {
    // Check if there's an active timer for this ticket
    const hasActiveTimer = this.activeTimer?.ticketId === ticket.id;

    // Calculate final duration
    let totalDuration = ticket.workDuration || 0;

    // If there's an active timer, stop it and add its duration
    if (hasActiveTimer && this.activeTimer) {
      this.activeTimer.subscription.unsubscribe();

      // Calculate final session duration
      const now = new Date();
      const currentSessionDuration = this.calculateExactSessionDuration(now);
      totalDuration = this.baseAccumulatedDuration + currentSessionDuration;

      console.log('[TIMER] FINISHING with calculated duration:', {
        baseAccumulatedDuration: this.baseAccumulatedDuration,
        currentSessionDuration,
        totalDuration,
        startedAt: this.timerStartedAt?.toISOString(),
        now: now.toISOString(),
      });

      // Clean up timer state
      this.activeTimer = null;
      this.timerStartedAt = null;
    }

    const now = new Date();

    // Update UI immediately
    const index = this.tickets.findIndex((t) => t.id === ticket.id);
    if (index !== -1) {
      this.tickets[index] = {
        ...this.tickets[index],
        workFinished: true,
        workDuration: totalDuration,
        finishWorkTime: now.toISOString(),
        currentSessionDuration: 0, // Reset session counter
      };

      // Force change detection
      this.tickets = [...this.tickets];
    }

    // Use a two-step save process to avoid validation errors
    // Step 1: Update the duration first
    this.ticketService
      .updateTicketWorkDuration(ticket.id, totalDuration)
      .subscribe({
        next: () => {
          // Step 2: Update the status fields
          this.ticketService
            .directUpdateTicket(ticket.id, {
              workFinished: true,
              finishWorkTime: now.toISOString(),
            })
            .subscribe({
              next: () => {
                this.snackBar.open(
                  `Travail terminé sur ce ticket (${this.formatDurationHumanReadable(
                    totalDuration
                  )})`,
                  'Fermer',
                  { duration: 3000 }
                );
              },
              error: (err) => {
                // Still show success if at least the duration was saved
                console.error('[TIMER] Error updating finish status:', err);
                this.snackBar.open(
                  `Travail terminé sur ce ticket (${this.formatDurationHumanReadable(
                    totalDuration
                  )})`,
                  'Fermer',
                  { duration: 3000 }
                );
              },
            });
        },
        error: (err) => {
          console.error('[TIMER] Failed to save final duration:', err);
          this.showError(
            'Erreur: Impossible de terminer le travail sur ce ticket'
          );
          this.loadTickets();
        },
      });
  }

  // Add a manual refresh function for the user to try again
  refreshTickets(): void {
    console.log('[CollaborateurTicketsComponent] Manual refresh requested');

    // Show loading indicator
    this.isLoading = true;

    // Show a snackbar to indicate refresh is happening
    this.snackBar.open('Actualisation des tickets en cours...', '', {
      duration: 2000,
    });

    // Force clear any cached data
    this.tickets = [];

    // Load fresh data with delay to ensure UI updates
    setTimeout(() => {
      this.loadTickets();
    }, 500);
  }
}
