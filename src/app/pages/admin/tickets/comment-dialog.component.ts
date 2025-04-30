import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Ticket } from '../../../models/ticket.model';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-comment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule, // Add this import
  ],
  template: `
    <h2 mat-dialog-title>{{ data.ticket.title }}</h2>
    <mat-dialog-content>
      <div *ngIf="data.ticket.commentaire" class="comments">
        <p
          *ngFor="
            let comment of data.ticket.commentaire.split(
              '
'
            )
          "
        >
          {{ comment }}
        </p>
      </div>
      <textarea
        matInput
        placeholder="Ajouter un commentaire..."
        [(ngModel)]="newComment"
        rows="4"
        style="width: 100%"
      ></textarea>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-button color="primary" (click)="addComment()">Ajouter</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .comments {
        margin-bottom: 20px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
    `,
  ],
})
export class CommentDialogComponent {
  newComment = '';

  constructor(
    public dialogRef: MatDialogRef<CommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket }
  ) {}

  addComment() {
    if (this.newComment.trim()) {
      const timestamp = new Date().toLocaleString();
      const updatedCommentaire = `${this.data.ticket.commentaire}\n${timestamp} - ${this.newComment}`;

      this.data.ticket.commentaire = updatedCommentaire;
      this.dialogRef.close(this.data.ticket);
    }
  }
}
