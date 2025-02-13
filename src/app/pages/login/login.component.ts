import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData = {
        username: this.loginForm.get('username')?.value,
        password: this.loginForm.get('password')?.value,
      };

      this.http.post<any>('/api/users/login', loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response && response.role) {
            // Convert role name to lowercase for comparison
            const roleName = response.role.name?.toLowerCase() || '';
            switch (roleName) {
              case 'super admin':
                this.router.navigate(['/admin-dashboard']);
                break;
              case 'user':
                this.router.navigate(['/users-dashboard']);
                break;
              default:
                this.router.navigate(['/not-found']);
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.status === 401
              ? 'Invalid credentials. Please try again.'
              : 'An error occurred. Please try again later.';
          console.error('Login error:', error);
        },
      });
    }
  }
}
