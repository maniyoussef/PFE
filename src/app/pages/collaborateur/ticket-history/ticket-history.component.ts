import { Component, OnInit } from '@angular/core';
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
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReportDialogComponent } from '../report-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ticket-history',
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
  ],
  templateUrl: './ticket-history.component.html',
  styleUrls: ['./ticket-history.component.scss'],
})
export class TicketHistoryComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = true;
  userId: number | null = null;

  // Statistics
  totalTickets = 0;
  resolvedTickets = 0;
  nonResolvedTickets = 0;
  averageDuration = '00:00:00';

  // Filters
  statusFilter: string = 'all';
  periodFilter: string = 'all';

  // Table columns
  displayedColumns: string[] = [
    'id',
    'title',
    'project',
    'priority',
    'status',
    'createdAt',
    'completedAt',
    'duration',
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
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.userId = user.id || null;
          this.loadTickets();
        } else {
          console.error('User not found');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error fetching user:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  async loadTickets(): Promise<void> {
    if (!this.userId) {
      this.isLoading = false;
      return;
    }

    try {
      const response = await this.http
        .get<Ticket[]>(`/api/Tickets/history/${this.userId}`)
        .toPromise();
      this.tickets = response || [];

      this.updateStatistics();
      this.applyFilters();
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading tickets:', error);
      this.showSnackbar('Erreur lors du chargement des tickets.');
      this.isLoading = false;
    }
  }

  updateStatistics(): void {
    this.totalTickets = this.tickets.length;
    this.resolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === 'Résolu'
    ).length;
    this.nonResolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === 'Non résolu'
    ).length;

    // Calculate average duration
    const totalDuration = this.tickets.reduce((sum, ticket) => {
      if (ticket.startWorkTime && ticket.finishWorkTime) {
        const start = new Date(ticket.startWorkTime);
        const finish = new Date(ticket.finishWorkTime);
        return sum + (finish.getTime() - start.getTime());
      }
      return sum;
    }, 0);

    const averageMs =
      this.totalTickets > 0 ? totalDuration / this.totalTickets : 0;
    const hours = Math.floor(averageMs / (1000 * 60 * 60));
    const minutes = Math.floor((averageMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((averageMs % (1000 * 60)) / 1000);

    this.averageDuration = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  applyFilters(): void {
    let filtered = [...this.tickets];

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(
        (ticket) => ticket.status === this.statusFilter
      );
    }

    // Apply period filter
    if (this.periodFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (this.periodFilter) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter((ticket) => {
        if (!ticket.finishWorkTime) return false;
        const ticketDate = new Date(ticket.finishWorkTime);
        return ticketDate >= startDate;
      });
    }

    this.filteredTickets = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
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

  showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
