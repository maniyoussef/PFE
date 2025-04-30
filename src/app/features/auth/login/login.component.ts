import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Login</h2>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              [class.is-invalid]="email?.invalid && email?.touched"
            />
            <div
              class="invalid-feedback"
              *ngIf="email?.invalid && email?.touched"
            >
              <span *ngIf="email?.errors?.['required']">Email is required</span>
              <span *ngIf="email?.errors?.['email']"
                >Please enter a valid email</span
              >
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              [class.is-invalid]="password?.invalid && password?.touched"
            />
            <div
              class="invalid-feedback"
              *ngIf="password?.invalid && password?.touched"
            >
              <span *ngIf="password?.errors?.['required']"
                >Password is required</span
              >
              <span *ngIf="password?.errors?.['minlength']">
                Password must be at least 6 characters
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" formControlName="rememberMe" /> Remember me
            </label>
          </div>

          <div class="alert alert-danger" *ngIf="error()">
            {{ error() }}
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="loginForm.invalid || isLoading()"
          >
            {{ isLoading() ? 'Logging in...' : 'Login' }}
          </button>

          <!-- Debug buttons -->
          <div class="debug-buttons">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="navigateToAdmin()"
            >
              Test Admin Nav
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              (click)="navigateToTestAdmin()"
            >
              Test Direct Nav
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f5f5f5;
      }

      .login-card {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 400px;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .btn {
        width: 100%;
        padding: 0.75rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 0.5rem;
      }

      .btn:disabled {
        background-color: #ccc;
      }

      .btn-secondary {
        background-color: #6c757d;
      }

      .invalid-feedback {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }

      .alert {
        padding: 0.75rem;
        margin-bottom: 1rem;
        border-radius: 4px;
      }

      .alert-danger {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }

      .debug-buttons {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  isLoading = this.authService.isLoading;
  error = this.authService.error;

  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: () => {
          // Error is handled by the service
          this.loginForm.get('password')?.reset();
        },
      });
    } else {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  navigateToAdmin(): void {
    console.log('[LoginComponent] 🔄 Test navigating to /admin');

    // First check if we're authenticated
    if (!this.authService.isLoggedIn()) {
      console.log(
        '[LoginComponent] ⚠️ Not logged in, cannot navigate to admin area'
      );
      return;
    }

    // Log current user role
    const role = this.authService.userRole();
    console.log('[LoginComponent] 👤 Current user role:', role);

    // Try direct navigation to admin dashboard
    this.router.navigateByUrl('/admin/dashboard').then(
      (success) => {
        console.log('[LoginComponent] ✅ Admin navigation result:', success, {
          currentUrl: this.router.url,
          timestamp: new Date().toISOString(),
        });

        if (!success) {
          // Try alternative navigation strategies
          setTimeout(() => {
            console.log('[LoginComponent] 🔄 Trying test-admin route');
            this.router.navigateByUrl('/test-admin');
          }, 200);
        }
      },
      (error) =>
        console.error('[LoginComponent] ❌ Admin navigation error:', error)
    );
  }

  navigateToTestAdmin(): void {
    console.log('[LoginComponent] 🔄 Test navigating to /test-admin');

    // Log current user data
    console.log('[LoginComponent] 📊 Auth state:', {
      isLoggedIn: this.authService.isLoggedIn(),
      userData: localStorage.getItem('userData'),
      token: !!localStorage.getItem('token'),
      userRole: this.authService.userRole(),
      timestamp: new Date().toISOString(),
    });

    this.router.navigateByUrl('/test-admin').then(
      (success) =>
        console.log(
          '[LoginComponent] ✅ Test-admin navigation result:',
          success
        ),
      (error) =>
        console.error('[LoginComponent] ❌ Test-admin navigation error:', error)
    );
  }
}
