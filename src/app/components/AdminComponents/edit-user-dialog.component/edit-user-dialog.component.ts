import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DateAdapter,
  NativeDateAdapter,
  MAT_DATE_FORMATS,
  MAT_NATIVE_DATE_FORMATS,
} from '@angular/material/core';
import { Country } from '../../../models/country.model';
import { Role } from '../../../models/role.model';
import { User } from '../../../models/user.model';

export interface EditUserDialogData {
  user: User;
  countries: Country[];
  roles: Role[];
  companies: any[];
  projects: any[];
}

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        ...MAT_NATIVE_DATE_FORMATS,
        display: { dateInput: 'YYYY-MM-DD' },
      },
    },
  ],
})
export class EditUserDialogComponent implements OnInit {
  editForm = new FormGroup({
    id: new FormControl<number | null>(null),
    name: new FormControl<string | null>('', Validators.required),
    lastName: new FormControl<string | null>('', Validators.required),
    email: new FormControl<string | null>('', [
      Validators.required,
      Validators.email,
    ]),
    countryId: new FormControl<number | null>(null, Validators.required),
    roleId: new FormControl<number | null>(null, Validators.required),
    projectId: new FormControl<number | null>(null),
    companyId: new FormControl<number | null>(null),
    phoneNumber: new FormControl<string | null>(''),
    hasContract: new FormControl<boolean>(false),
    contractStartDate: new FormControl<Date | null>(null),
    contractEndDate: new FormControl<Date | null>(null),
  });

  isEditing = false;

  constructor(
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    this.editForm.get('hasContract')?.valueChanges.subscribe((hasContract) => {
      if (hasContract) {
        this.editForm
          .get('contractStartDate')
          ?.setValidators(Validators.required);
        this.editForm
          .get('contractEndDate')
          ?.setValidators(Validators.required);
      } else {
        this.editForm.get('contractStartDate')?.clearValidators();
        this.editForm.get('contractEndDate')?.clearValidators();
      }
      this.editForm.get('contractStartDate')?.updateValueAndValidity();
      this.editForm.get('contractEndDate')?.updateValueAndValidity();
    });

    this.toggleFormControls(false);
  }

  private initializeForm(): void {
    const user = this.data.user;
    this.editForm.patchValue({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      countryId: user.country?.id || null,
      roleId: user.role?.id || null,
      phoneNumber: user.phoneNumber || '',
      hasContract: user.hasContract || false,
      contractStartDate: user.contractStartDate
        ? new Date(user.contractStartDate)
        : null,
      contractEndDate: user.contractEndDate
        ? new Date(user.contractEndDate)
        : null,
      projectId: user.assignedProjects?.[0]?.id || null,
      companyId: null,
    });
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      const formValue = this.editForm.value;
      const updateData = {
        ...formValue,
        CompanyIds: formValue.companyId ? [formValue.companyId] : [],
      };
      this.dialogRef.close(updateData);
    }
  }

  onEdit(): void {
    this.isEditing = !this.isEditing;
    this.toggleFormControls(this.isEditing);
  }

  private toggleFormControls(enable: boolean): void {
    const controls = this.editForm.controls;
    Object.keys(controls).forEach((controlName) => {
      const key = controlName as keyof typeof controls;
      if (enable) {
        controls[key].enable();
      } else {
        controls[key].disable();
      }
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const dialogContainer = document.querySelector('.dialog-container');
      if (dialogContainer) {
        dialogContainer.scrollTop = dialogContainer.scrollHeight;
      }
    }, 100);
  }
}
