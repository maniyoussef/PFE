import {
  Component,
  OnInit,
  ElementRef,
  Renderer2,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { ExcelService } from '../../../services/excel.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';
import { CommentDialogComponent } from './comment-dialog.component';
import { ExportDialogComponent } from './export-dialog.component';
import { EditTicketDialogComponent } from '../../../components/AdminComponents/edit-ticket-dialog.component/edit-ticket-dialog.component';
import { AssignUserDialogComponent } from '../../../components/AdminComponents/assign-user-dialog.component/assign-user-dialog.component';
import { RefuseDialogComponent } from '../../../components/AdminComponents/refuse-dialog.component/refuse-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.4s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('fadeInList', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class TicketsComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  isLoading = false;
  selectedTicket: Ticket | null = null;
  sortCriteria: 'newest' | 'oldest' | 'status' | 'title' | 'priority' =
    'newest';

  // Lists for filtering
  projects: any[] = [];
  problemCategories: any[] = [];
  statuses: string[] = [];
  priorities: string[] = [];

  openActionMenuId: number | null = null;
  sortDirection = 'desc';
  activeRow: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private ticketService: TicketService,
    private excelService: ExcelService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private el: ElementRef,
    private userService: UserService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTickets();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets() {
    this.isLoading = true;
    this.ticketService.getTickets().subscribe({
      next: (tickets: Ticket[]) => {
        this.tickets = tickets;
        this.sortTickets();
        this.isLoading = false;

        // Extract filter lists from tickets
        this.extractFilterOptions(tickets);
      },
      error: (err: any) => {
        console.error('Failed to load tickets:', err);
        this.isLoading = false;
      },
    });
  }

  // Extract unique filter options from tickets
  private extractFilterOptions(tickets: Ticket[]) {
    // Extract unique projects
    this.projects = this.extractUniqueObjects(
      tickets.filter((t) => t.project).map((t) => t.project)
    );

    // Extract unique problem categories
    this.problemCategories = this.extractUniqueObjects(
      tickets.filter((t) => t.problemCategory).map((t) => t.problemCategory)
    );

    // Extract unique statuses
    this.statuses = this.extractUniqueStrings(
      tickets.map((t) => t.status).filter(Boolean) as string[]
    );

    // Extract unique priorities
    this.priorities = this.extractUniqueStrings(
      tickets.map((t) => t.priority).filter(Boolean) as string[]
    );
  }

  // Helper to extract unique objects by ID
  private extractUniqueObjects(objects: any[]): any[] {
    const uniqueMap = new Map();
    objects.forEach((obj) => {
      if (!uniqueMap.has(obj.id)) {
        uniqueMap.set(obj.id, obj);
      }
    });
    return Array.from(uniqueMap.values());
  }

  // Helper to extract unique strings
  private extractUniqueStrings(strings: string[]): string[] {
    return [...new Set(strings)];
  }

  formatCreatedDate(dateString: string): string {
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

  getStatusColor(status?: string): string {
    if (!status) return '#999999';

    const colors: { [key: string]: string } = {
      'En attente': '#f0ad4e',
      Assigné: '#5bc0de',
      ASSIGNED: '#5bc0de',
      'En cours': '#5cb85c',
      Résolu: '#5cb85c',
      Refusé: '#d9534f',
      REFUSED: '#d9534f',
      OPEN: '#337ab7',
      Open: '#337ab7',
      ACCEPTED: '#5bc0de',
      Accepté: '#5bc0de',
    };
    return colors[status] || '#999999';
  }

  showDescription(ticket: Ticket, event?: Event): void {
    console.log('Opening description dialog for ticket:', ticket.id);

    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Create the dialog directly without timeout
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket },
    });
  }

  openAssignDialog(ticket: Ticket, event?: Event): void {
    console.log('Opening assign dialog for ticket:', ticket.id);

    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const dialogRef = this.dialog.open(AssignUserDialogComponent, {
      width: '500px',
      data: { ticket },
    });

    dialogRef.afterClosed().subscribe((selectedUser) => {
      if (selectedUser) {
        const updatedTicket: Ticket = {
          ...ticket,
          assignedToId: selectedUser.id,
          status: 'ASSIGNED', // Changed from 'Assigné' to 'ASSIGNED'
        };

        this.ticketService.updateTicket(updatedTicket).subscribe({
          next: (result) => {
            this.snackBar.open(
              `Ticket assigné à ${selectedUser.name} ${selectedUser.lastName}`,
              'Fermer',
              { duration: 3000 }
            );
            this.loadTickets();
          },
          error: (err) => {
            console.error('Error assigning ticket:', err);
            this.snackBar.open(
              "Erreur lors de l'assignation du ticket",
              'Fermer',
              { duration: 3000 }
            );
          },
        });
      }
    });
  }

  applySort(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    // Type guard to ensure value is a valid sortCriteria
    if (this.isValidSortCriteria(value)) {
      this.sortCriteria = value;
      this.sortTickets();
    }
  }

  // Type guard for sort criteria
  private isValidSortCriteria(
    value: string
  ): value is 'newest' | 'oldest' | 'status' | 'title' | 'priority' {
    return ['newest', 'oldest', 'status', 'title', 'priority'].includes(value);
  }

  sortTickets() {
    const sortedTickets = [...this.tickets];

    switch (this.sortCriteria) {
      case 'newest':
        sortedTickets.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        sortedTickets.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'status':
        sortedTickets.sort((a, b) => {
          if (!a.status && !b.status) return 0;
          if (!a.status) return 1;
          if (!b.status) return -1;
          return a.status.localeCompare(b.status);
        });
        break;
      case 'title':
        sortedTickets.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'priority':
        sortedTickets.sort((a, b) => {
          if (!a.priority && !b.priority) return 0;
          if (!a.priority) return 1;
          if (!b.priority) return -1;
          return a.priority.localeCompare(b.priority);
        });
        break;
    }

    this.tickets = sortedTickets;
  }

  openCommentDialog(ticket: Ticket, event?: Event): void {
    console.log('Opening comment dialog for ticket:', ticket.id);

    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Create the dialog directly without timeout
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '600px',
      data: { ticket: { ...ticket } },
    });

    dialogRef.afterClosed().subscribe((updatedTicket) => {
      if (updatedTicket) {
        this.ticketService.updateTicket(updatedTicket).subscribe({
          next: (result) => {
            this.snackBar.open('Commentaire ajouté avec succès', 'Fermer', {
              duration: 3000,
            });
            this.loadTickets();
          },
          error: (err) => {
            console.error('Error updating ticket:', err);
            this.snackBar.open(
              "Erreur lors de l'ajout du commentaire",
              'Fermer',
              {
                duration: 3000,
              }
            );
          },
        });
      }
    });
  }

  openEditDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(EditTicketDialogComponent, {
      width: '600px',
      data: { ticket: { ...ticket } },
    });

    dialogRef.afterClosed().subscribe((updatedTicket) => {
      if (updatedTicket) {
        this.ticketService.updateTicket(updatedTicket).subscribe({
          next: (result) => {
            this.snackBar.open('Ticket mis à jour avec succès', 'Fermer', {
              duration: 3000,
            });
            this.loadTickets();
          },
          error: (err) => {
            console.error('Error updating ticket:', err);
            this.snackBar.open(
              'Erreur lors de la mise à jour du ticket',
              'Fermer',
              {
                duration: 3000,
              }
            );
          },
        });
      }
    });
  }

  openRefuseDialog(ticket: Ticket, event?: Event): void {
    console.log('Opening refuse dialog for ticket:', ticket.id);

    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Create the dialog directly without timeout
    const dialogRef = this.dialog.open(RefuseDialogComponent, {
      width: '600px',
      data: { ticketId: ticket.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.handleRefuseTicket(ticket.id, result.report);
      }
    });
  }

  async handleRefuseTicket(ticketId: number, report: string) {
    console.log(`Refusing ticket ${ticketId} with report: "${report}"`);

    if (!report || report.trim() === '') {
      console.error('Cannot refuse ticket: Report is empty');
      this.snackBar.open(
        'Erreur: Le rapport de refus ne peut pas être vide',
        'Fermer',
        { duration: 3000 }
      );
      return;
    }

    try {
      const result = await lastValueFrom(
        this.ticketService.refuseTicket(ticketId, report)
      );
      console.log('Ticket refused successfully:', result);
      this.snackBar.open('Ticket refusé avec succès', 'Fermer', {
        duration: 3000,
      });
      this.loadTickets();
    } catch (err) {
      console.error('Error refusing ticket:', err);
      this.snackBar.open('Erreur lors du refus du ticket', 'Fermer', {
        duration: 3000,
      });
    }
  }

  async acceptTicket(ticket: any, event?: Event) {
    try {
      console.log(`[ADMIN] Starting acceptance of ticket ID: ${ticket.id}`);

      // Stop event propagation if event is provided
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }

      // Close the dropdown immediately
      this.selectedTicket = null;
      this.changeDetectorRef.detectChanges();

      const result = await lastValueFrom(
        this.ticketService.acceptTicket(ticket.id)
      );

      // Update the local ticket directly
      ticket.status = 'ACCEPTED';
      console.log(`[ADMIN] Ticket ${ticket.id} status updated to: "ACCEPTED"`);
      console.log(`[ADMIN] Raw API response status was: "${result?.status}"`);

      this.snackBar.open('Ticket accepté avec succès', 'Fermer', {
        duration: 3000,
      });

      // Reload tickets after a delay
      setTimeout(() => {
        this.loadTickets();
      }, 500);
    } catch (err: any) {
      console.error('[ADMIN] Error accepting ticket:', err);
      this.snackBar.open(
        `Erreur lors de l'acceptation du ticket: ${
          err.message || 'Erreur inconnue'
        }`,
        'Fermer',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  // New method for opening the export dialog
  openExportDialog(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '500px',
      data: {
        projects: this.projects,
        problemCategories: this.problemCategories,
        statuses: this.statuses,
        priorities: this.priorities,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.exportTickets(result);
      }
    });
  }

  // Method to handle the export based on filter selection
  private exportTickets(filterOptions: any): void {
    let filteredTickets: Ticket[] = [];
    let fileName = 'tickets';

    // Filter tickets based on selected criteria
    if (filterOptions.filterType === 'all') {
      filteredTickets = [...this.tickets];
      fileName = 'tous-les-tickets';
    } else if (
      filterOptions.filterType === 'project' &&
      filterOptions.projectId
    ) {
      filteredTickets = this.tickets.filter(
        (t) => t.project?.id === filterOptions.projectId
      );
      const projectName =
        this.projects.find((p) => p.id === filterOptions.projectId)?.name ||
        'projet';
      fileName = `tickets-${projectName}`;
    } else if (
      filterOptions.filterType === 'problemCategory' &&
      filterOptions.problemCategoryId
    ) {
      filteredTickets = this.tickets.filter(
        (t) => t.problemCategory?.id === filterOptions.problemCategoryId
      );
      const categoryName =
        this.problemCategories.find(
          (c) => c.id === filterOptions.problemCategoryId
        )?.name || 'categorie';
      fileName = `tickets-${categoryName}`;
    } else if (filterOptions.filterType === 'status' && filterOptions.status) {
      filteredTickets = this.tickets.filter(
        (t) => t.status === filterOptions.status
      );
      fileName = `tickets-${filterOptions.status}`;
    } else if (
      filterOptions.filterType === 'priority' &&
      filterOptions.priority
    ) {
      filteredTickets = this.tickets.filter(
        (t) => t.priority === filterOptions.priority
      );
      fileName = `tickets-priorite-${filterOptions.priority}`;
    }

    // Export to Excel if we have tickets
    if (filteredTickets.length > 0) {
      this.excelService.exportToExcel(filteredTickets, fileName);
      this.snackBar.open('Export Excel réussi', 'Fermer', { duration: 3000 });
    } else {
      this.snackBar.open('Aucun ticket à exporter', 'Fermer', {
        duration: 3000,
      });
    }
  }

  setSortCriteria(criteria: string) {
    if (this.isValidSortCriteria(criteria)) {
      if (this.sortCriteria === criteria) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortCriteria = criteria;
        this.sortDirection = 'desc';
      }
      this.loadTickets();
    }
  }

  setActiveRow(ticketId: number | null) {
    this.activeRow = ticketId;
  }

  getPriorityClass(priority: string): string {
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

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'opened':
        return 'bg-blue-500';
      case 'in progress':
        return 'bg-orange-500';
      case 'pending':
        return 'bg-purple-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }

  // Handler methods for button clicks - simplified for Material Menu
  handleDescriptionClick(ticket: Ticket, event: Event): void {
    console.log('Description clicked for ticket:', ticket.id);

    // Open dialog immediately
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket },
      panelClass: 'custom-dialog',
    });
  }

  handleCommentClick(ticket: Ticket, event: Event): void {
    console.log('Comment clicked for ticket:', ticket.id);

    // Open dialog immediately
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '600px',
      data: { ticket: { ...ticket } },
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe((updatedTicket) => {
      if (updatedTicket) {
        this.ticketService.updateTicket(updatedTicket).subscribe({
          next: (result) => {
            this.snackBar.open('Commentaire ajouté avec succès', 'Fermer', {
              duration: 3000,
            });
            this.loadTickets();
          },
          error: (err) => {
            console.error('Error updating ticket:', err);
            this.snackBar.open(
              "Erreur lors de l'ajout du commentaire",
              'Fermer',
              {
                duration: 3000,
              }
            );
          },
        });
      }
    });
  }

  handleAssignClick(ticket: Ticket, event: Event): void {
    console.log('Assign clicked for ticket:', ticket.id);

    // Keep a reference to the ticket
    const currentTicket = ticket;

    // Open dialog immediately
    const dialogRef = this.dialog.open(AssignUserDialogComponent, {
      width: '500px',
      data: { ticket: currentTicket },
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe((selectedUser) => {
      if (selectedUser) {
        const updatedTicket: Ticket = {
          ...currentTicket,
          assignedToId: selectedUser.id,
          status: 'ASSIGNED',
        };

        this.ticketService.updateTicket(updatedTicket).subscribe({
          next: (result) => {
            this.snackBar.open(
              `Ticket assigné à ${selectedUser.name} ${selectedUser.lastName}`,
              'Fermer',
              { duration: 3000 }
            );
            this.loadTickets();
          },
          error: (err) => {
            console.error('Error assigning ticket:', err);
            this.snackBar.open(
              "Erreur lors de l'assignation du ticket",
              'Fermer',
              { duration: 3000 }
            );
          },
        });
      }
    });
  }

  handleAcceptClick(ticket: Ticket, event: Event): void {
    console.log('Accept clicked for ticket:', ticket.id);

    // Keep a reference to the ticket
    const ticketId = ticket.id;

    // Call API immediately
    this.ticketService.acceptTicket(ticketId).subscribe({
      next: (result) => {
        this.snackBar.open('Ticket accepté avec succès', 'Fermer', {
          duration: 3000,
        });
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error accepting ticket:', err);
        this.snackBar.open(
          `Erreur lors de l'acceptation du ticket: ${
            err.message || 'Erreur inconnue'
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

  handleRefuseClick(ticket: Ticket, event: Event): void {
    console.log('Refuse clicked for ticket:', ticket.id, ticket);

    // Pass the full ticket, not just the ID
    const dialogRef = this.dialog.open(RefuseDialogComponent, {
      width: '600px',
      data: { ticket: ticket },
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Refuse dialog closed with result:', result);
      if (result) {
        this.handleRefuseTicket(ticket.id, result.report);
      } else {
        console.log('Refuse dialog was cancelled or closed without a report');
      }
    });
  }
}
