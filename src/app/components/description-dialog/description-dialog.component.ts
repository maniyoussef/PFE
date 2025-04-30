import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-description-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.ticket.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.ticket.description }}</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        padding: 16px;
        margin-bottom: 16px;
        max-height: 400px;
        overflow-y: auto;
      }

      mat-dialog-actions {
        padding: 8px 16px;
        justify-content: flex-end;
      }
    `,
  ],
})
export class DescriptionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DescriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket }
  ) {}
}
