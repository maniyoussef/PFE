import { Component, inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateTicketDialogComponent } from '../../../components/UserComponents/create-ticket-dialog/create-ticket-dialog.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-mes-tickets',
  standalone: true, // ✅ Standalone Component
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
  ], // ✅ Import Required Modules
  providers: [MatDialog], // ✅ Provide MatDialog Service
  templateUrl: './mes-tickets.component.html',
  styleUrls: ['./mes-tickets.component.scss'],
})
export class MesTicketsComponent implements OnInit {
  private dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'id',
    'title',
    'description',
    'status',
    'actions',
  ];
  tickets = new MatTableDataSource<Ticket>([
    {
      id: 1,
      title: 'Bug in Login',
      description: 'User cannot login',
      status: 'Open',
    },
    {
      id: 2,
      title: 'Feature Request',
      description: 'Add dark mode',
      status: 'Pending',
    },
  ]);

  ngOnInit(): void {
    console.log('MesTicketsComponent Loaded');
  }

  openCreateTicketDialog() {
    this.dialog.open(CreateTicketDialogComponent, {
      width: '500px',
      maxHeight: '90vh',
    });
  }

  editTicket(ticket: Ticket) {
    console.log('Edit Ticket:', ticket);
  }

  deleteTicket(ticket: Ticket) {
    console.log('Delete Ticket:', ticket);
  }
}
