import { Component, type OnInit } from '@angular/core';

import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { ReportDialogComponent } from '../../../components/AdminComponents/report-dialog/report-dialog.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
    TopBarComponent,
    NavbarComponent,
  ],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = true;

  constructor(
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.isLoading = true;
    this.ticketService.getTicketsWithReports().subscribe({
      next: (tickets) => {
        console.log('Raw tickets with reports:', tickets);
        
        // Filter out tickets without actual reports (empty strings or null)
        this.tickets = tickets.filter(ticket => {
          const hasReport = ticket.report && ticket.report.trim() !== '';
          if (!hasReport) {
            console.log('Filtered out ticket without report:', ticket.id);
          }
          return hasReport;
        });
        
        console.log('Filtered tickets with reports:', this.tickets);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.snackBar.open('Failed to load reports', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        this.isLoading = false;
      },
    });
  }

  openReportDialog(ticket: Ticket) {
    this.dialog.open(ReportDialogComponent, {
      width: '600px',
      data: ticket,
      panelClass: 'report-dialog-container',
    });
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return '';

    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'open':
        return 'status-open';
      case 'in progress':
        return 'status-in-progress';
      case 'closed':
        return 'status-closed';
      default:
        return '';
    }
  }
}
