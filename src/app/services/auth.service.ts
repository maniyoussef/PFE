import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenExpirationTimer: any;
  private refreshTokenInProgress = false;
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private tokenExpirationTime = 15 * 60 * 1000; // 15 minutes

  constructor(private http: HttpClient, private router: Router) {
    console.log('[AuthService] Service initialized');
    this.loadStoredUser();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private loadStoredUser(): void {
    console.log('[AuthService] Loading stored user');
    // Check both storage keys used by the different auth services
    const storedUser =
      localStorage.getItem('user') || localStorage.getItem('userData');
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    console.log('[AuthService] Stored data:', {
      hasUser: !!storedUser,
      hasToken: !!token,
      tokenExpiration,
      userDataKey: !!localStorage.getItem('userData'),
      userKey: !!localStorage.getItem('user'),
    });

    if (storedUser && token && tokenExpiration) {
      const user = JSON.parse(storedUser);
      const expirationDate = new Date(tokenExpiration);
      const now = new Date();

      console.log('[AuthService] Token expiration check:', {
        expirationDate,
        now,
        isExpired: expirationDate <= now,
      });

      if (expirationDate > now) {
        // Also ensure both storage keys are set for cross-service compatibility
        if (!localStorage.getItem('user')) {
          localStorage.setItem('user', storedUser);
        }
        if (!localStorage.getItem('userData')) {
          localStorage.setItem('userData', storedUser);
        }

        this.currentUserSubject.next(user);
        const timeUntilExpiration = expirationDate.getTime() - now.getTime();
        console.log(
          '[AuthService] Setting up auto refresh, time until expiration:',
          timeUntilExpiration
        );
        this.autoRefreshToken(timeUntilExpiration);
      } else {
        console.log('[AuthService] Token expired, attempting refresh');
        this.refreshToken().subscribe({
          next: () => {
            console.log('[AuthService] Token refresh successful');
            // Re-emit the current user to trigger any subscriptions
            if (this.currentUserSubject.value) {
              this.currentUserSubject.next(this.currentUserSubject.value);
            }
          },
          error: (error) => {
            console.log('[AuthService] Token refresh failed:', error);
            this.logout();
          },
        });
      }
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  user(): Observable<User | null> {
    return this.currentUser$;
  }

  getCurrentUserRole(): string | null {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser?.role?.name) {
      console.log('[AuthService] No current user or role found');
      return null;
    }
    console.log('[AuthService] Current user role:', currentUser.role);
    return currentUser.role.name.toUpperCase();
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/change-password`, { oldPassword, newPassword })
      .pipe(
        catchError((error) => {
          console.error('Password change error:', error);
          return throwError(() => error);
        })
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Login request initiated');
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          console.log('Login response received:', {
            hasToken: !!response.token,
            user: response.user,
            fullResponse: response,
          });
          if (!response.token || !response.user) {
            throw new Error('Invalid response format');
          }

          // CRITICAL FIX: Check all role formats for Chef Projet
          const hasChefProjetRole =
            (Array.isArray(response.user.roles) &&
              response.user.roles.some(
                (role) =>
                  typeof role === 'string' &&
                  (role === 'Chef Projet' ||
                    role.toUpperCase() === 'CHEF PROJET')
              )) ||
            (response.user.role &&
              (response.user.role.name === 'Chef Projet' ||
                response.user.role.name?.toUpperCase() === 'CHEF PROJET' ||
                response.user.role.id === 3));

          if (hasChefProjetRole) {
            console.log(
              '[AuthService] 🔒 CRITICAL: Chef Projet role detected - direct handling'
            );

            // Store token data
            this.storeTokenData(response);

            // Navigate directly to chef-projet dashboard with a delay to ensure storage completes
            setTimeout(() => {
              console.log(
                '[AuthService] 👨‍💼 CRITICAL: Force navigation to chef-projet dashboard'
              );
              this.router.navigate(['/chef-projet'], {
                replaceUrl: true,
                state: { source: 'critical-chef-projet-fix' },
              });
            }, 100);

            return;
          }

          this.handleAuthentication(response);
        }),
        catchError((error) => {
          console.error('Login pipeline error:', error);
          return throwError(() => error);
        })
      );
  }

  private handleAuthentication(response: AuthResponse): void {
    console.log('[AuthService] Handling authentication response', {
      user: response.user,
      hasRole: !!response.user.role,
      hasRoles: !!response.user.roles,
      roleDetails: response.user.role,
      rolesArray: response.user.roles,
      fullUser: response.user,
    });

    try {
      // Store all token data using the dedicated method
      this.storeTokenData(response);

      // CRITICAL CHECK: Handle Chef Projet role specifically to bypass all other logic
      const isChefProjet =
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (role) =>
              typeof role === 'string' &&
              (role === 'Chef Projet' || role.toUpperCase() === 'CHEF PROJET')
          )) ||
        (response.user.role &&
          (response.user.role.name === 'Chef Projet' ||
            response.user.role.name === 'CHEF PROJET' ||
            response.user.role.id === 3));

      if (isChefProjet) {
        console.log(
          '[AuthService] 🚨 CRITICAL CHEF PROJET MATCH - Direct navigation'
        );
        // Force navigation to chef-projet dashboard
        setTimeout(() => {
          this.router.navigate(['/chef-projet'], { replaceUrl: true });
        }, 100);
        return;
      }

      // PRIORITY CHECK: Check for Chef Projet role in any format first
      // This ensures Chef Projet routing always works correctly
      if (
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (role) =>
              typeof role === 'string' &&
              (role === 'Chef Projet' ||
                role.toUpperCase() === 'CHEF PROJET' ||
                role.toUpperCase() === 'CHEF_PROJET')
          )) ||
        (response.user.role &&
          (response.user.role.name === 'Chef Projet' ||
            response.user.role.name?.toUpperCase() === 'CHEF PROJET' ||
            response.user.role.id === 3))
      ) {
        console.log(
          '[AuthService] 🎯 Chef Projet role detected - immediate navigation'
        );
        setTimeout(() => {
          this.router.navigate(['/chef-projet'], { replaceUrl: true });
        }, 100);
        return;
      }

      // If role is found in roles array, use that directly for navigation
      if (
        Array.isArray(response.user.roles) &&
        response.user.roles.length > 0
      ) {
        const role = response.user.roles[0];
        console.log('[AuthService] Using first role from roles array:', role);

        // Use direct role string comparison without transformations
        if (role === 'COLLABORATEUR' || role === 'Collaborateur') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👷 Navigating to collaborateur dashboard (direct match)'
            );
            this.router.navigate(['/collaborateur'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (role === 'ADMIN' || role === 'Admin') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👑 Navigating to admin dashboard (direct match)'
            );
            this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (role === 'CLIENT' || role === 'Client') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👤 Navigating to client dashboard (direct match)'
            );
            this.router.navigate(['/client'], { replaceUrl: true });
          }, 100);
          return;
        }

        // Additional Chef Projet check for roles array
        if (role === 'Chef Projet' || role === 'CHEF PROJET') {
          setTimeout(() => {
            console.log(
              '[AuthService] 🔐 Chef Projet role detected in roles array'
            );
            this.router.navigate(['/chef-projet'], { replaceUrl: true });
          }, 100);
          return;
        }
      }

      // Fallback to role object if available
      if (response.user.role) {
        const roleName =
          typeof response.user.role === 'string'
            ? response.user.role
            : response.user.role.name || '';

        console.log('[AuthService] Using role from role object:', roleName);

        // Direct role check by role ID (most reliable)
        if (response.user.role.id) {
          switch (response.user.role.id) {
            case 1: // Admin
              setTimeout(() => {
                console.log(
                  '[AuthService] 👑 Navigating to admin dashboard (by ID 1)'
                );
                this.router.navigate(['/admin/dashboard'], {
                  replaceUrl: true,
                });
              }, 100);
              return;
            case 2: // Client
              setTimeout(() => {
                console.log(
                  '[AuthService] 👤 Navigating to client dashboard (by ID 2)'
                );
                this.router.navigate(['/client'], { replaceUrl: true });
              }, 100);
              return;
            case 3: // Chef Projet
              setTimeout(() => {
                console.log(
                  '[AuthService] 👨‍💼 Navigating to chef projet dashboard (by ID 3)'
                );
                this.router.navigate(['/chef-projet'], { replaceUrl: true });
              }, 100);
              return;
            case 4: // Collaborateur
              setTimeout(() => {
                console.log(
                  '[AuthService] 👷 Navigating to collaborateur dashboard (by ID 4)'
                );
                this.router.navigate(['/collaborateur'], { replaceUrl: true });
              }, 100);
              return;
          }
        }

        // CHEF PROJET DIRECT CHECK
        if (roleName === 'CHEF PROJET') {
          console.log(
            '[AuthService] 💥 Critical case: CHEF PROJET exact match'
          );
          setTimeout(() => {
            this.router.navigate(['/chef-projet'], { replaceUrl: true });
          }, 100);
          return;
        }

        // Direct role name matching as final fallback
        if (roleName === 'ADMIN' || roleName === 'Admin') {
          setTimeout(() => {
            this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (roleName === 'CLIENT' || roleName === 'Client') {
          setTimeout(() => {
            this.router.navigate(['/client'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (roleName === 'Chef Projet' || roleName === 'CHEF PROJET') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👨‍💼 Navigating to chef projet dashboard (by name match)'
            );
            this.router.navigate(['/chef-projet'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (roleName === 'COLLABORATEUR' || roleName === 'Collaborateur') {
          setTimeout(() => {
            this.router.navigate(['/collaborateur'], { replaceUrl: true });
          }, 100);
          return;
        }
      }

      // FINAL FALLBACK FOR CHEF PROJET
      if (
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (r) =>
              typeof r === 'string' &&
              (r.includes('CHEF') ||
                r.includes('Chef') ||
                r.includes('PROJET') ||
                r.includes('Projet'))
          )) ||
        (response.user.role?.name &&
          (response.user.role.name.includes('CHEF') ||
            response.user.role.name.includes('Chef') ||
            response.user.role.name.includes('PROJET') ||
            response.user.role.name.includes('Projet')))
      ) {
        console.log(
          '[AuthService] 🔄 Final fallback for Chef Projet - attempting navigation'
        );
        setTimeout(() => {
          this.router.navigate(['/chef-projet'], { replaceUrl: true });
        }, 100);
        return;
      }

      console.log(
        '[AuthService] ⚠️ No role match found, navigate to chef-projet as fallback'
      );
      // Changed from unauthorized to chef-projet as final fallback
      this.router.navigate(['/chef-projet'], { replaceUrl: true });
    } catch (error) {
      console.error('[AuthService] Error during authentication:', error);
      this.logout();
    }
  }

  private autoRefreshToken(expirationDuration: number): void {
    console.log('[AuthService] ⚙️ Setting up auto refresh:', {
      expirationDuration,
      currentTime: new Date(),
      nextRefreshIn:
        Math.floor((expirationDuration * 0.75) / 1000) + ' seconds',
    });

    if (this.tokenExpirationTimer) {
      console.log('[AuthService] 🔄 Clearing existing refresh timer');
      clearTimeout(this.tokenExpirationTimer);
    }

    const refreshTime = Math.floor(expirationDuration * 0.75);

    if (refreshTime <= 0) {
      console.log(
        '[AuthService] ⚠️ Token too close to expiration, refreshing now'
      );
      this.refreshToken().subscribe();
      return;
    }

    this.tokenExpirationTimer = setTimeout(() => {
      console.log('[AuthService] 🔄 Auto refresh timer triggered:', {
        currentTime: new Date(),
        isLoggedIn: this.isLoggedIn(),
      });

      if (this.isLoggedIn()) {
        this.refreshToken().subscribe({
          next: () => console.log('[AuthService] ✅ Auto refresh successful'),
          error: (error) => {
            console.error('[AuthService] ❌ Auto refresh failed:', error);
            if (error.status === 401) {
              console.log(
                '[AuthService] 🚫 Unauthorized during refresh, logging out'
              );
              this.logout();
            }
          },
        });
      } else {
        console.log('[AuthService] ⚠️ User not logged in during auto refresh');
        this.logout();
      }
    }, refreshTime);
  }

  public refreshToken(): Observable<any> {
    console.log('[AuthService] 🔄 Starting token refresh');
    const refreshToken = localStorage.getItem('refreshToken');
    const currentToken = localStorage.getItem('token');

    console.log('[AuthService] 🎫 Token refresh state:', {
      hasRefreshToken: !!refreshToken,
      hasCurrentToken: !!currentToken,
      refreshInProgress: this.refreshTokenInProgress,
    });

    if (!refreshToken) {
      console.log('[AuthService] ❌ No refresh token found');
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.refreshTokenInProgress) {
      console.log('[AuthService] ⏳ Refresh already in progress');
      return of(null);
    }

    this.refreshTokenInProgress = true;

    return this.http.post(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((response: any) => {
        console.log('[AuthService] ✅ Refresh response received:', {
          hasToken: !!response.token,
          hasRefreshToken: !!response.refreshToken,
          timestamp: new Date(),
        });
        this.refreshTokenInProgress = false;

        if (response.token && response.refreshToken) {
          this.storeTokenData(response);
        } else {
          console.error('[AuthService] ❌ Invalid refresh response format');
          this.logout();
        }
      }),
      catchError((error) => {
        console.error('[AuthService] ❌ Token refresh failed:', error);
        this.refreshTokenInProgress = false;
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    console.log('[AuthService] Logging out user');
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('tokenExpiration');

    // Clear timers
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    // Reset user state
    this.currentUserSubject.next(null);
    this.refreshTokenInProgress = false;

    console.log('[AuthService] User logged out, navigating to login');
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    const user = this.currentUserSubject.value;
    const refreshToken = localStorage.getItem('refreshToken');

    console.log('[AuthService] 🔍 Checking login state:', {
      hasToken: !!token,
      hasUser: !!user,
      hasRefreshToken: !!refreshToken,
      tokenExpiration: tokenExpiration ? new Date(tokenExpiration) : null,
      currentTime: new Date(),
      userDetails: user ? { id: user.id, role: user.role } : null,
    });

    if (!token || !tokenExpiration || !user) {
      console.log('[AuthService] ❌ Login check failed:', {
        missingToken: !token,
        missingExpiration: !tokenExpiration,
        missingUser: !user,
      });
      return false;
    }

    const expirationDate = new Date(tokenExpiration);
    const now = new Date();
    const isValid = expirationDate > now;
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();

    console.log('[AuthService] ⏰ Token expiration check:', {
      isValid,
      timeUntilExpiration: Math.floor(timeUntilExpiration / 1000) + ' seconds',
      shouldRefresh: timeUntilExpiration < this.tokenExpirationTime * 0.75,
    });

    return isValid;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private normalizeRoleName(role: string): string {
    if (!role) return '';

    // CRITICAL FIX: Direct Chef Projet detection for any format
    if (
      role.trim().toUpperCase() === 'CHEF PROJET' ||
      role.trim().toUpperCase() === 'CHEF_PROJET'
    ) {
      console.log(
        `[AuthService] 🔐 Critical Chef Projet role normalization: "${role}" -> "CHEF_PROJET"`
      );
      return 'CHEF_PROJET';
    }

    // Normalize by removing spaces, converting to uppercase, and handling French accents
    const normalized = role
      .trim()
      .replace(/\s+/g, '_')
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
      .toUpperCase();

    console.log(`[AuthService] Normalized role: "${role}" -> "${normalized}"`);
    return normalized;
  }

  hasRole(requiredRole: string): boolean {
    const currentUser = this.currentUserSubject.getValue();
    console.log('[AuthService] 🎭 Checking role access:', {
      requiredRole,
      currentUser: currentUser
        ? {
            id: currentUser.id,
            role: currentUser.role,
            roles: currentUser.roles,
          }
        : null,
      hasCurrentUser: !!currentUser,
      hasRole: !!currentUser?.role,
      hasRoles: !!currentUser?.roles,
    });

    if (!currentUser) {
      console.log('[AuthService] ❌ Role check failed: No user');
      return false;
    }

    // CRITICAL FIX: Direct check for Chef Projet role
    if (
      requiredRole.toUpperCase() === 'CHEF_PROJET' ||
      requiredRole.toUpperCase() === 'CHEF PROJET'
    ) {
      // Check if the user has a "CHEF PROJET" role in any format
      if (Array.isArray(currentUser.roles)) {
        const hasChefProjetInRoles = currentUser.roles.some(
          (role) =>
            typeof role === 'string' &&
            (role === 'Chef Projet' || role.toUpperCase() === 'CHEF PROJET')
        );

        if (hasChefProjetInRoles) {
          console.log('[AuthService] ✅ CHEF PROJET found in roles array');
          return true;
        }
      }

      // Check for Chef Projet in role object
      if (currentUser.role) {
        if (currentUser.role.id === 3) {
          console.log('[AuthService] ✅ CHEF PROJET matched by role ID (3)');
          return true;
        }

        if (
          currentUser.role.name === 'Chef Projet' ||
          currentUser.role.name === 'CHEF PROJET'
        ) {
          console.log('[AuthService] ✅ CHEF PROJET matched by name');
          return true;
        }

        // Partial match check
        const roleName = currentUser.role.name || '';
        if (
          roleName.includes('Chef') ||
          roleName.includes('CHEF') ||
          roleName.includes('Projet') ||
          roleName.includes('PROJET')
        ) {
          console.log('[AuthService] ✅ CHEF PROJET matched by partial name');
          return true;
        }
      }
    }

    // Special case for Chef Projet
    if (requiredRole.toUpperCase() === 'CHEF_PROJET') {
      // Check in roles array
      if (currentUser.roles && Array.isArray(currentUser.roles)) {
        const hasChefProjetRole = currentUser.roles.some(
          (role) =>
            typeof role === 'string' &&
            (role.toUpperCase() === 'CHEF PROJET' ||
              role.toUpperCase() === 'CHEF_PROJET')
        );

        if (hasChefProjetRole) {
          console.log(
            '[AuthService] ✅ Chef Projet role matched directly from roles array'
          );
          return true;
        }
      }

      // Check in role object
      if (currentUser.role && currentUser.role.name) {
        const roleName = currentUser.role.name.toUpperCase();
        if (roleName === 'CHEF PROJET' || roleName === 'CHEF_PROJET') {
          console.log(
            '[AuthService] ✅ Chef Projet role matched from role object'
          );
          return true;
        }
      }

      // Check by role ID (3 for Chef Projet)
      if (currentUser.role && currentUser.role.id === 3) {
        console.log('[AuthService] ✅ Chef Projet role matched by ID (3)');
        return true;
      }
    }

    // First try checking the roles array (which is the format from the backend)
    if (currentUser.roles && Array.isArray(currentUser.roles)) {
      const normalizedRequiredRole = this.normalizeRoleName(requiredRole);

      const hasMatchingRole = currentUser.roles.some(
        (role) => this.normalizeRoleName(role) === normalizedRequiredRole
      );

      if (hasMatchingRole) {
        console.log(
          `[AuthService] ✅ Role matched from roles array: ${requiredRole}`
        );
        return true;
      }
    }

    // Then try checking the role object
    if (currentUser.role) {
      // Check if the role is matching by ID
      // For collaborateur, we expect role ID 4 from the database
      if (
        requiredRole.toUpperCase() === 'COLLABORATEUR' &&
        currentUser.role.id === 4
      ) {
        console.log(
          '[AuthService] ✅ Role matched by ID: Collaborateur (ID: 4)'
        );
        return true;
      }

      // Get the user's role name, handling both string and object formats
      const userRoleName = currentUser.role.name || '';
      const userRole = this.normalizeRoleName(userRoleName);
      const requiredRoleNormalized = this.normalizeRoleName(requiredRole);

      console.log('[AuthService] ✅ Role comparison:', {
        userRole,
        requiredRole: requiredRoleNormalized,
        exactMatch: userRole === requiredRoleNormalized,
        partialMatch:
          userRole.includes(requiredRoleNormalized) ||
          requiredRoleNormalized.includes(userRole),
        roleDetails: currentUser.role,
      });

      // First try exact match, then try partial match in either direction
      const isExactMatch = userRole === requiredRoleNormalized;
      const isPartialMatch =
        userRole.includes(requiredRoleNormalized) ||
        requiredRoleNormalized.includes(userRole);

      return isExactMatch || isPartialMatch;
    }

    console.log(
      '[AuthService] ❌ Role check failed: No valid role information found'
    );
    return false;
  }

  navigateByRole(role: any): void {
    // More detailed logging to track the role navigation process
    const timestamp = new Date().toISOString();

    console.log('[AuthService] 🧭 Navigating by role:', {
      roleInput: role,
      roleType: typeof role,
      roleProperties: role ? Object.keys(role) : [],
      currentUrl: this.router.url,
      timestamp,
    });

    // CRITICAL IMMEDIATE FIX - Direct check for "CHEF PROJET" string
    const roleName = role?.name || '';
    if (roleName === 'CHEF PROJET') {
      console.log(
        '[AuthService] ⚡ CHEF PROJET detected - emergency direct navigation'
      );
      this.router.navigate(['/chef-projet'], { replaceUrl: true });
      return;
    }

    // First check for role by ID (from database)
    if (role && typeof role.id === 'number') {
      switch (role.id) {
        case 1: // Admin role ID
          console.log('[AuthService] 👑 Navigating to admin dashboard by ID');
          this.router.navigate(['/admin/dashboard'], {
            replaceUrl: true,
            state: { source: 'login', timestamp },
          });
          return;
        case 2: // User/Client role ID
          console.log('[AuthService] 👤 Navigating to client dashboard by ID');
          this.router.navigate(['/client'], {
            replaceUrl: true,
            state: { source: 'login', timestamp },
          });
          return;
        case 3: // Chef Projet role ID
          console.log(
            '[AuthService] 👷 Navigating to chef projet dashboard by ID'
          );
          this.router.navigate(['/chef-projet'], {
            replaceUrl: true,
            state: { source: 'login', timestamp },
          });
          return;
        case 4: // Collaborateur role ID
          console.log(
            '[AuthService] 👷 Navigating to collaborateur dashboard by ID'
          );
          this.router.navigate(['/collaborateur'], {
            replaceUrl: true,
            state: { source: 'login', timestamp },
          });
          return;
      }
    }

    // Extract role name from the role object
    const normalizedRole = this.normalizeRoleName(roleName);

    console.log('[AuthService] 🎯 Role resolution:', {
      originalRole: role,
      extractedName: roleName,
      normalizedRole,
      timestamp,
    });

    // DIRECT CHECK for Chef Projet - check this first
    if (
      roleName === 'Chef Projet' ||
      roleName === 'CHEF PROJET' ||
      normalizedRole === 'CHEF_PROJET'
    ) {
      console.log(
        '[AuthService] 👨‍💼 Direct match for Chef Projet - navigating to chef-projet dashboard'
      );
      this.router.navigate(['/chef-projet'], {
        replaceUrl: true,
        state: { source: 'login', timestamp },
      });
      return;
    }

    // Special handling for collaborateur
    if (
      normalizedRole.includes('COLLABORATEUR') ||
      normalizedRole.includes('COLLABORATOR')
    ) {
      console.log(
        '[AuthService] 👷 Navigating to collaborateur dashboard with direct routing'
      );
      // Use replaceUrl to avoid history stacking
      this.router.navigate(['/collaborateur'], {
        replaceUrl: true,
        state: { source: 'login', timestamp },
      });
      return;
    }

    // Use a more flexible approach with includes() for partial matches
    if (normalizedRole.includes('ADMIN')) {
      console.log('[AuthService] 👑 Navigating to admin dashboard');
      this.router
        .navigate(['/admin/dashboard'], {
          replaceUrl: true,
          state: { source: 'login' },
        })
        .then((success) => {
          console.log('[AuthService] 🚀 Admin navigation result:', {
            success,
            targetUrl: '/admin/dashboard',
            timestamp,
          });
        });
    } else if (
      normalizedRole.includes('USER') ||
      normalizedRole.includes('CLIENT')
    ) {
      this.router.navigate(['/client'], { replaceUrl: true });
    } else if (
      normalizedRole.includes('CHEF') ||
      normalizedRole.includes('PROJET')
    ) {
      this.router.navigate(['/chef-projet'], { replaceUrl: true });
    } else {
      // Direct error handling - If we see "CHEF PROJET", go directly to chef-projet
      // Log for diagnosis but don't let it fail
      console.log('[AuthService] 🔍 Final role check:', role);

      if (
        Array.isArray(role.roles) &&
        role.roles.some((r: string) => r === 'CHEF PROJET')
      ) {
        console.log(
          '[AuthService] 🚨 CRITICAL ARRAY FIX: Found CHEF PROJET in roles array'
        );
        this.router.navigate(['/chef-projet'], { replaceUrl: true });
        return;
      }

      console.log(
        '[AuthService] ⚠️ Role not recognized, defaulting to chef-projet'
      );
      // Log navigating to login instead of unauthorized for "CHEF PROJET"
      console.log('[AuthService] 🚀 Navigating to chef-projet as fallback');
      this.router.navigate(['/chef-projet'], { replaceUrl: true });
    }
  }

  private setupTokenRefresh(): void {
    console.log('[AuthService] Setting up token refresh');
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Check token every minute
    this.refreshInterval = setInterval(() => {
      if (this.isLoggedIn()) {
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        if (tokenExpiration) {
          const expirationDate = new Date(tokenExpiration);
          const now = new Date();
          const timeUntilExpiration = expirationDate.getTime() - now.getTime();

          // If token expires in less than 5 minutes, refresh it
          if (timeUntilExpiration < 5 * 60 * 1000) {
            console.log('[AuthService] Token close to expiration, refreshing');
            this.refreshToken().subscribe({
              next: () =>
                console.log('[AuthService] Token refreshed successfully'),
              error: (error) => {
                console.error('[AuthService] Token refresh failed:', error);
                if (error.status === 401) {
                  this.logout();
                }
              },
            });
          }
        }
      }
    }, 60000); // Check every minute
  }

  // Helper method to ensure ID is a number
  private ensureNumberId(id: string | number): number {
    return typeof id === 'string' ? parseInt(id, 10) : id;
  }

  // Add the missing resetUserIdentity method
  resetUserIdentity(newUserId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-identity`, { newUserId }).pipe(
      tap((response: any) => {
        if (response.success) {
          // Update the stored user data with the new ID
          const currentUser = this.currentUserSubject.getValue();
          if (currentUser) {
            currentUser.id = newUserId;
            localStorage.setItem('user', JSON.stringify(currentUser));
            this.currentUserSubject.next(currentUser);
          }
        }
      }),
      catchError((error) => {
        console.error('[AuthService] Reset identity error:', error);
        return throwError(() => error);
      })
    );
  }

  storeTokenData(response: AuthResponse): void {
    if (!response.token || !response.user) {
      console.error('[AuthService] Invalid response format for token storage');
      throw new Error('Invalid response format');
    }

    try {
      const now = new Date();
      const expirationDate = new Date(now.getTime() + this.tokenExpirationTime);

      // Validate the expiration date
      if (isNaN(expirationDate.getTime())) {
        throw new Error('Invalid expiration date calculated');
      }

      // Ensure consistent role formats
      let userToStore = { ...response.user };

      // Special handling for Chef Projet role
      if (Array.isArray(userToStore.roles)) {
        for (let i = 0; i < userToStore.roles.length; i++) {
          const role = userToStore.roles[i];
          if (
            typeof role === 'string' &&
            role.toUpperCase() === 'CHEF PROJET'
          ) {
            console.log(
              '[AuthService] Preserving Chef Projet role in roles array'
            );
            // Don't uppercase Chef Projet to preserve exact format
          } else if (typeof role === 'string') {
            userToStore.roles[i] = role.toUpperCase();
          }
        }
        console.log(
          '[AuthService] Normalized roles array for storage:',
          userToStore.roles
        );
      }

      if (userToStore.role && typeof userToStore.role.name === 'string') {
        // Special handling for Chef Projet role
        if (userToStore.role.name.toUpperCase() === 'CHEF PROJET') {
          console.log(
            '[AuthService] Preserving Chef Projet role in role object'
          );
          // Keep original format
        } else {
          userToStore.role.name = userToStore.role.name.toUpperCase();
          console.log(
            '[AuthService] Normalized role name for storage:',
            userToStore.role.name
          );
        }
      }

      // Serialize user data once to ensure consistency
      const userData = JSON.stringify(userToStore);

      // Store all auth-related data
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('tokenExpiration', expirationDate.toISOString());

      // Store in both keys for cross-service compatibility
      localStorage.setItem('user', userData);
      localStorage.setItem('userData', userData);

      console.log(
        '[AuthService] User data stored in both storage keys for compatibility'
      );

      // Update the current user subject
      this.currentUserSubject.next(userToStore);

      // Setup auto refresh
      this.autoRefreshToken(this.tokenExpirationTime);

      console.log('[AuthService] Stored auth data:', {
        hasToken: true,
        expiration: expirationDate,
        user: {
          id: userToStore.id,
          role: userToStore.role,
          roles: userToStore.roles,
        },
      });
    } catch (error) {
      console.error('[AuthService] Error storing token data:', error);
      throw error;
    }
  }

  mapUserResponse(response: any): User {
    return {
      id: response.user.id,
      name: response.user.name,
      lastName: response.user.lastName,
      email: response.user.email,
      role: {
        id: response.user.role?.id || 0,
        name: response.user.role?.name || 'USER',
      },
      country: response.user.country,
      company: response.user.company,
      // Include any other properties as needed
    };
  }

  /**
   * Debug method to help diagnose role issues
   */
  debugRoleInfo(): void {
    const user = this.currentUserSubject.getValue();
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    console.log('[AuthService] 🔍 ROLE DEBUG INFO:', {
      timestamp: new Date().toISOString(),
      currentUser: user
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
            rawRole: JSON.stringify(user.role),
          }
        : null,
      localStorage: {
        hasToken: !!token,
        hasUser: !!storedUser,
        userParsed: storedUser ? JSON.parse(storedUser) : null,
      },
      isLoggedIn: this.isLoggedIn(),
    });
  }

  /**
   * Restore user from localStorage if BehaviorSubject is empty
   * Useful when components are loaded before auth service has fully initialized
   */
  restoreUserFromStorage(): void {
    const currentUser = this.currentUserSubject.getValue();

    // Only restore if there's no current user
    if (!currentUser) {
      try {
        console.log('[AuthService] 🔄 Attempting to restore user from storage');
        // First try to rerun the loadStoredUser method
        this.loadStoredUser();

        // If that didn't work, try direct approach
        if (!this.currentUserSubject.getValue()) {
          const storedUserString = localStorage.getItem('user');

          if (storedUserString) {
            const storedUser = JSON.parse(storedUserString);
            console.log(
              '[AuthService] 🔄 Manual restore of user from storage:',
              {
                id: storedUser.id,
                hasRole: !!storedUser.role,
                role: storedUser.role,
                timestamp: new Date().toISOString(),
              }
            );

            // Update the BehaviorSubject with the stored user
            this.currentUserSubject.next(storedUser);

            // Make sure the token is valid
            if (!this.isLoggedIn()) {
              console.warn(
                '[AuthService] ⚠️ Restored user but token is invalid or expired'
              );

              // Try to refresh the token if we have a refresh token
              const refreshToken = localStorage.getItem('refreshToken');
              if (refreshToken) {
                console.log(
                  '[AuthService] 🔄 Attempting token refresh during restore'
                );
                this.refreshToken().subscribe({
                  next: () =>
                    console.log(
                      '[AuthService] ✅ Token refreshed during restore'
                    ),
                  error: (error) =>
                    console.error(
                      '[AuthService] ❌ Token refresh failed during restore:',
                      error
                    ),
                });
              }
            }
          } else {
            console.warn(
              '[AuthService] ⚠️ No stored user found in localStorage'
            );
          }
        } else {
          console.log(
            '[AuthService] ✅ User successfully restored via loadStoredUser'
          );
        }
      } catch (error) {
        console.error(
          '[AuthService] ❌ Error restoring user from storage:',
          error
        );
      }
    } else {
      console.log(
        '[AuthService] ✅ User already in memory, no need to restore'
      );
    }
  }
}
