import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { UserService } from '../../../services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { NgZone } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChefProjetRefuseDialogComponent } from '../../../components/chef-projetComponents/chef-projet-refuse-dialog/chef-projet-refuse-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { ChefAssignUserDialogComponent } from '../../../components/chef-projetComponents/chef-projet-assign-user-dialog.component/chef-projet-assign-user-dialog.component';
import { TICKET_STATUS } from '../../../constants/ticket-status.constant';

@Component({
  selector: 'app-chef-projet-tickets',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    RouterModule, 
    MatDialogModule, 
    MatSnackBarModule,
    MatButtonModule
  ],
  templateUrl: './chef-projet-tickets.component.html',
  styleUrls: ['./chef-projet-tickets.component.scss'],
})
export class ChefProjetTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  loading = true;
  error: string | null = null;
  
  // Add STATUS constant for easier access
  readonly STATUS = TICKET_STATUS;

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private zone: NgZone,
    public dialog: MatDialog
  ) {}

  getAssignedToName(ticket: Ticket): string {
    return ticket.assignedTo?.name || 'Non assigné';
  }

  async ngOnInit() {
    this.loading = true;
    this.error = null;

    try {
      const currentUser = await firstValueFrom(
        this.authService.getCurrentUser()
      );

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const chefProjetId = currentUser.id;
      
      // Use the getProjectTicketsByChefProjetId method which properly maps all fields
      const tickets = await lastValueFrom(
        this.ticketService.getProjectTicketsByChefProjetId(chefProjetId)
      );

      this.zone.run(() => {
        this.tickets = tickets;
        console.log('Loaded tickets with statuses:', tickets.map(t => ({id: t.id, status: t.status, assignedTo: t.assignedTo})));
      });
    } catch (error) {
      console.error('Error loading tickets:', error);
      this.zone.run(() => {
        this.error = 'Failed to load tickets. Please try again later.';
      });
    } finally {
      this.zone.run(() => {
        this.loading = false;
      });
    }
  }

  // chef-projet-tickets.component.ts
  async acceptTicket(ticketId: number) {
    try {
      this.loading = true;
      await lastValueFrom(this.ticketService.acceptTicket(ticketId));
      
      // Update local status using the constant
      this.tickets = this.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: this.STATUS.ACCEPTED } : ticket
      );
    } catch (error) {
      console.error('Error accepting ticket:', error);
      // Error messages are handled by the service
    } finally {
      this.loading = false;
    }
  }

  openRefuseDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ChefProjetRefuseDialogComponent, {
      width: '500px',
      data: { ticket },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.handleRefuseTicket(ticket.id, result.report);
      }
    });
  }

  async handleRefuseTicket(ticketId: number, report: string) {
    try {
      this.loading = true;
      console.log(`Attempting to refuse ticket #${ticketId} with report: "${report.substring(0, 50)}..."`);
      
      // Use the service's refuseTicket method
      const updatedTicket = await lastValueFrom(this.ticketService.refuseTicket(ticketId, report));
      
      console.log('API response from ticket update:', updatedTicket);
      
      // Update local tickets array
      this.tickets = this.tickets.map((ticket) =>
        ticket.id === ticketId 
          ? {
              ...ticket,
              status: 'REFUSED',
              report: report
            }
          : ticket
      );
      
      // Refresh reports in case the user navigates to the reports page
      console.log(`Ticket #${ticketId} refused with report: "${report.substring(0, 50)}..."`);
    } catch (error) {
      console.error('Error refusing ticket:', error);
      // Error messages are handled by the service
    } finally {
      this.loading = false;
    }
  }

  openAssignDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ChefAssignUserDialogComponent, {
      width: '500px',
      data: { ticket },
    });

    dialogRef.afterClosed().subscribe((selectedUser) => {
      if (selectedUser) {
        this.assignTicket(ticket, selectedUser.id);
      }
    });
  }

  async assignTicket(ticket: Ticket, collaborateurId: number) {
    try {
      this.loading = true;
      console.log(`Trying to assign ticket ${ticket.id} to collaborateur ${collaborateurId}`);
      
      // First update the assignment using PUT
      const updatedTicket = await lastValueFrom(
        this.ticketService.updateTicketAssignment(ticket.id, collaborateurId)
      );
      
      console.log('Assignment successful:', updatedTicket);
      
      // Then update the status in a separate call - using updateTicketStatus directly since
      // there's no dedicated service method for assignment status
      await lastValueFrom(
        this.ticketService.updateTicketStatus(ticket.id, TICKET_STATUS.ASSIGNED)
      );
      
      this.snackBar.open('Ticket assigné avec succès', 'Fermer', {
        duration: 3000,
      });

      // Update local tickets array with the information we have
      this.tickets = this.tickets.map((t) =>
        t.id === ticket.id 
          ? {
              ...t,
              status: TICKET_STATUS.ASSIGNED,
              assignedToId: collaborateurId,
              assignedTo: updatedTicket?.assignedTo || {
                id: collaborateurId,
                name: 'Collaborateur',
                lastName: '',
                email: '',
                countryId: 0,
                roleId: 0,
                roles: []
              }
            }
          : t
      );
      
      // Refresh the tickets list to get the latest data
      this.ngOnInit();
      
    } catch (error) {
      console.error('Error assigning ticket:', error);
      let errorMessage = "Erreur lors de l'assignation du ticket";
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      this.snackBar.open(errorMessage, 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }
}
