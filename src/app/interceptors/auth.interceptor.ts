import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  console.log('[AuthInterceptor] 🌐 Processing request:', {
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Skip token for login, register, and refresh token endpoints
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    console.log('[AuthInterceptor] 🔓 Skipping auth for public endpoint');
    return next(req);
  }

  const token = authService.getToken();
  if (token) {
    console.log('[AuthInterceptor] 🔑 Adding token to request');
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  } else {
    console.log('[AuthInterceptor] ⚠️ No token available');
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('[AuthInterceptor] ❌ Request error:', {
        status: error.status,
        url: req.url,
        message: error.message,
      });

      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        console.log('[AuthInterceptor] 🔄 Attempting token refresh');
        // Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap(() => {
            console.log(
              '[AuthInterceptor] ✅ Token refreshed, retrying request'
            );
            // Retry the request with the new token
            const newToken = authService.getToken();
            const newReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`),
            });
            return next(newReq);
          }),
          catchError((refreshError) => {
            console.error(
              '[AuthInterceptor] 🚨 Token refresh failed:',
              refreshError
            );
            // If refresh fails, log out
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
