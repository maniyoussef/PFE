import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';
import { AssignUserDialogComponent } from '../../../components/AdminComponents/assign-user-dialog.component/assign-user-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { ChefAssignUserDialogComponent } from '../../../components/chef-projetComponents/chef-projet-assign-user-dialog.component/chef-projet-assign-user-dialog.component';

@Component({
  standalone: true,
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterModule,
  ],
})
export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  loading = true;
  error: string | null = null;
  assignmentLoading = false;

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    public dialog: MatDialog,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.error = 'Invalid ticket ID';
      this.loading = false;
      return;
    }

    const id = Number(idParam);
    if (isNaN(id)) {
      this.error = 'Invalid ticket ID';
      this.loading = false;
      return;
    }

    try {
      const result = await this.ticketService.getTicketById(id).toPromise();
      if (!result) {
        this.error = `Ticket with ID ${id} not found`;
      } else {
        this.ticket = result;
      }
      this.loading = false;
    } catch (err) {
      console.error('Error loading ticket:', err);
      this.error = 'Failed to load ticket details';
      this.loading = false;
    }
  }

  openAssignDialog() {
    if (!this.ticket) return;

    // Check if the current user is a Chef Projet
    const isChefProjet =
      this.authService.getCurrentUserRole() === 'Chef Projet';

    if (isChefProjet) {
      const dialogRef = this.dialog.open(ChefAssignUserDialogComponent, {
        width: '500px',
        data: { ticket: this.ticket },
      });
      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          this.assignmentLoading = true;
          try {
            const updatedTicket = await lastValueFrom(
              this.ticketService.updateTicketAssignment(
                this.ticket!.id,
                result.id
              )
            );
            this.ticket = updatedTicket;
          } catch (error) {
            console.error('Error assigning ticket:', error);
            this.error = 'Failed to assign ticket';
          } finally {
            this.assignmentLoading = false;
          }
        }
      });
    } else {
      // For Admin or other roles, use the original dialog
      const dialogRef = this.dialog.open(AssignUserDialogComponent, {
        width: '500px',
        data: { ticket: this.ticket },
      });
      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          this.assignmentLoading = true;
          try {
            const updatedTicket = await lastValueFrom(
              this.ticketService.updateTicketAssignment(
                this.ticket!.id,
                result.id
              )
            );
            this.ticket = updatedTicket;
          } catch (error) {
            console.error('Error assigning ticket:', error);
            this.error = 'Failed to assign ticket';
          } finally {
            this.assignmentLoading = false;
          }
        }
      });
    }
  }
}
