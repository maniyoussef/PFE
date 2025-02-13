import { Component, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import type { Country } from '../../models/country.model';
import type { Role } from '../../models/role.model';
import type { User } from '../../models/user.model';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { CountryService } from '../../services/country.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-create-user-dialog',
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
})
export class CreateUserDialogComponent implements OnInit {
  countries: Country[] = [];
  roles: Role[] = [];
  newUser: User = {
    name: '',
    email: '',
    phoneNumber: '',
    isActive: true,
    hasContract: false,
    countryId: 0,
    roleId: 0,
  };

  constructor(
    private dialogRef: MatDialogRef<CreateUserDialogComponent>,
    private userService: UserService,
    private countryService: CountryService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.loadRoles();
  }

  loadCountries() {
    this.countryService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      },
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      },
    });
  }

  createUser() {
    if (this.validateForm()) {
      this.userService.addUser(this.newUser).subscribe({
        next: (createdUser) => {
          this.dialogRef.close(createdUser);
        },
        error: (error) => {
          console.error('Error creating user:', error);
        },
      });
    }
  }

  validateForm(): boolean {
    return !!(
      this.newUser.name &&
      this.newUser.email &&
      this.newUser.phoneNumber &&
      this.newUser.countryId &&
      this.newUser.roleId
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
