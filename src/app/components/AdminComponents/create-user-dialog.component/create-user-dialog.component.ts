import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Country } from '../../../models/country.model';
import { Role } from '../../../models/role.model';
import { User } from '../../../models/user.model';
import { CountryService } from '../../../services/country.service';
import { NotificationService } from '../../../services/notification.service';
import { RoleService } from '../../../services/role.service';

interface DialogData {
  isEdit: boolean;
  user?: User;
}

@Component({
  selector: 'app-user-dialog',
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
})
export class UserDialogComponent implements OnInit {
  userForm!: FormGroup;
  countries: Country[] = [];
  roles: Role[] = [];
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private countryService: CountryService,
    private roleService: RoleService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadCountries();
    this.loadRoles();
  }

  createForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      countryId: [null, [Validators.required]],
      roleId: [null, [Validators.required]],
    });

    if (this.data.isEdit && this.data.user) {
      this.userForm.patchValue(this.data.user);
    }
  }

  loadCountries(): void {
    this.countryService.getCountries().subscribe({
      next: (data) => {
        this.countries = data;
        this.checkDataLoaded();
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.checkDataLoaded();
      },
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.checkDataLoaded();
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.checkDataLoaded();
      },
    });
  }

  checkDataLoaded(): void {
    if (this.countries.length > 0 && this.roles.length > 0) {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const user: User = this.userForm.value;
      this.dialogRef.close(user);

      // Remove this line to stop notification
      // this.notificationService.notifyNewTicket(user.name);
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
