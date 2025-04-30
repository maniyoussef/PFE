import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule],
})
export class AdminProfileComponent implements OnInit {
  user: User | null = null;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', Validators.required],
        newPassword: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
          ]),
        ],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  passwordMatchValidator(fg: FormGroup) {
    return fg.get('newPassword')?.value === fg.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    if (!this.user) {
      this.snackBar.open('Utilisateur non trouvé', 'Fermer');
      return;
    }

    const { oldPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.snackBar.open('Mot de passe mis à jour!', 'Fermer');
        this.passwordForm.reset();
      },
      error: (err: any) =>
        this.snackBar.open(err.error.message || 'Error', 'Fermer'),
    });
  }
}
