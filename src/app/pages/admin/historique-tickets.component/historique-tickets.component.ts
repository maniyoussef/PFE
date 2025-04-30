/* historique-tickets.component.ts */
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';

@Component({
  selector: 'app-historique-tickets',
  templateUrl: './historique-tickets.component.html',
  styleUrls: ['./historique-tickets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class HistoriqueTicketsComponent implements OnInit {
  resolvedTickets: Ticket[] = [];
  isLoading = true;

  constructor(private ticketService: TicketService, public dialog: MatDialog) {}

  ngOnInit() {
    this.loadResolvedTickets();
  }

  loadResolvedTickets() {
    this.isLoading = true;
    this.ticketService.getResolvedTickets().subscribe({
      next: (tickets: Ticket[]) => {
        this.resolvedTickets = tickets;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error('Failed to load resolved tickets:', error);
        this.isLoading = false;
      },
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  showDescription(ticket: Ticket): void {
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket },
    });
  }
}
