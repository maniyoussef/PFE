import { Component, type OnInit } from '@angular/core';
import { CreateUserDialogComponent } from '../../../components/create-user-dialog.component/create-user-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import type { User } from '../../../models/user.model';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { NavbarComponent } from '../../../components/navbar/navbar.component';

@Component({
  selector: 'app-users-list-creation',
  templateUrl: './users-list&creation.component.html',

  styleUrls: ['./users-list&creation.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    CreateUserDialogComponent,
    TopBarComponent,
    NavbarComponent,
  ],
})
export class UsersListCreationComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = [
    'name',
    'email',
    'phone',
    'country',
    'password',
    'role',
    'active',
    'contract',
    'actions',
  ];

  constructor(private userService: UserService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      },
    });
  }

  openCreateUserDialog() {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User) {
    if (!user.id) return;

    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter((u) => u.id !== user.id);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        },
      });
    }
  }
}
