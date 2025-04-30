import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket } from '../../../core/models/ticket.model';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { UserNavbarComponent } from '../../../components/UserComponents/user-navbar/user-navbar.component';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';
import { CommentDialogComponent } from '../../admin/tickets/comment-dialog.component';
import { CreateTicketDialogComponent } from '../../../components/UserComponents/create-ticket-dialog/create-ticket-dialog.component';

@Component({
  selector: 'app-mes-tickets',
  templateUrl: './mes-tickets.component.html',
  styleUrls: ['./mes-tickets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    TopBarComponent,
    UserNavbarComponent,
  ],
})
export class MesTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = false;
  error: string | null = null;
  selectedTicket: Ticket | null = null;
  currentUserId: number | null = null;

  constructor(
    private authService: AuthService,
    private ticketService: TicketService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.error = null;
    this.tickets = [];

    const currentUser = this.authService.user();
    if (!currentUser || !currentUser.id) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUserId = parseInt(currentUser.id, 10);
    if (isNaN(this.currentUserId)) {
      this.error = 'Invalid user ID';
      this.isLoading = false;
      return;
    }

    this.ticketService.getTicketsByUserId(this.currentUserId).subscribe({
      next: (tickets: Ticket[]) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.error = 'Failed to load tickets. Please try again later.';
        this.isLoading = false;
        console.error('Error loading tickets:', error);
      },
    });
  }

  refreshTickets(): void {
    this.loadTickets();
  }

  openCreateTicketDialog(): void {
    const dialogRef = this.dialog.open(CreateTicketDialogComponent, {
      width: '600px',
      data: {
        clientId: this.currentUserId,
        priorities: ['Low', 'Medium', 'High'],
        qualifications: ['Low', 'Medium', 'High'],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTickets();
      }
    });
  }

  getStatusColor(status?: string): string {
    if (!status) return '#999999';
    const colors: { [key: string]: string } = {
      'En attente': '#f0ad4e',
      Assigné: '#5bc0de',
      'En cours': '#5cb85c',
      Résolu: '#5cb85c',
      Refusé: '#d9534f',
    };
    return colors[status] || '#999999';
  }

  formatCreatedDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'Date invalide'
      : date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  }

  showDescription(ticket: Ticket): void {
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket: ticket },
    });
  }

  openCommentDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '600px',
      data: { ticket: { ...ticket } },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTickets();
      }
    });
  }
}
