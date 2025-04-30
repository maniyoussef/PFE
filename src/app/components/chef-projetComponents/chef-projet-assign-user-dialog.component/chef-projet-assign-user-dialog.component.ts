import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Ticket } from '../../../models/ticket.model';
import { firstValueFrom } from 'rxjs';

interface DialogData {
  ticket: Ticket;
}

@Component({
  selector: 'app-chef-projet-assign-user-dialog',
  templateUrl: './chef-projet-assign-user-dialog.component.html',
  styleUrls: ['./chef-projet-assign-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class ChefAssignUserDialogComponent implements OnInit {
  collaborateurs: User[] = [];
  selectedUser: User | null = null;
  isLoading = false;
  error: string | null = null;
  ticketTitle: string = '';

  constructor(
    public dialogRef: MatDialogRef<ChefAssignUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.ticketTitle = data.ticket.title;
  }

  async ngOnInit() {
    this.isLoading = true;
    try {
      const currentUser = await firstValueFrom(this.authService.getCurrentUser());
      
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      console.log('Loading collaborateurs for chef ID:', currentUser.id);
      
      // Get collaborateurs assigned to this chef
      const collaborateurs = await firstValueFrom(
        this.userService.getCollaborateursByChefId(currentUser.id)
      );
      
      this.collaborateurs = collaborateurs;
      console.log('Loaded collaborateurs:', this.collaborateurs);
    } catch (error) {
      console.error('Error loading collaborateurs:', error);
      this.error = 'Failed to load collaborateurs. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.selectedUser);
  }
} 