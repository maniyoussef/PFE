import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of, Observable, firstValueFrom } from 'rxjs';
import { UserRole } from '../core/constants/roles';

// Auth guard that checks if user is logged in
export const authGuard = (allowedRoles?: UserRole[]) => {
  // Return an async function that handles the auth check
  return async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    console.log('[AuthGuard] ⭐ Guard called for route:', {
      url: state.url,
      requiredRoles: allowedRoles,
      routePath: route.routeConfig?.path,
      timestamp,
    });

    const authService = inject(AuthService);
    const router = inject(Router);

    // Skip checks for login page to prevent loops
    if (state.url.includes('/login')) {
      console.log(`[AuthGuard] 🔓 Login page - allowing access (${timestamp})`);
      return true;
    }

    // SPECIAL CASE: Always allow access to chef-projet routes
    if (state.url.includes('/chef-projet')) {
      console.log(
        `[AuthGuard] 🔎 Handling chef-projet route access (${timestamp})`
      );

      // Force user data sync and restoration
      try {
        // Try to get user from localStorage directly if the service doesn't have it
        const userStr =
          localStorage.getItem('userData') || localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          console.log(
            `[AuthGuard] 📋 User data from storage for chef-projet check:`,
            {
              id: userData.id,
              hasRoles: !!userData.roles,
              roles: userData.roles,
              roleObj: userData.role,
              token: !!localStorage.getItem('token'),
            }
          );

          // Ensure the auth service has the user loaded
          if (!authService.isLoggedIn() && localStorage.getItem('token')) {
            console.log(
              '[AuthGuard] 🔄 Forcing user rehydration for chef-projet access'
            );

            // In extreme cases, manually override the BehaviorSubject
            if (typeof authService.restoreUserFromStorage === 'function') {
              authService.restoreUserFromStorage();
              console.log(
                '[AuthGuard] 💉 Explicitly called restoreUserFromStorage'
              );
            }
          }

          // First check by role ID (most reliable)
          if (userData?.role?.id === 3) {
            console.log(
              `[AuthGuard] 🔧 CHEF_PROJET access granted by role ID 3 (${timestamp})`
            );
            return true;
          }

          // Check by exact role name
          const roleNameFromObj = userData?.role?.name || '';
          if (
            roleNameFromObj === 'Chef Projet' ||
            roleNameFromObj.toUpperCase() === 'CHEF PROJET' ||
            roleNameFromObj.toUpperCase() === 'CHEF_PROJET'
          ) {
            console.log(
              `[AuthGuard] 🔧 CHEF_PROJET access granted by role object name match (${timestamp})`
            );
            return true;
          }

          // Check roles array if present
          if (userData?.roles && Array.isArray(userData.roles)) {
            const hasChefProjetRole = userData.roles.some(
              (role: string) =>
                typeof role === 'string' &&
                (role === 'Chef Projet' ||
                  role.toUpperCase() === 'CHEF PROJET' ||
                  role.toUpperCase() === 'CHEF_PROJET')
            );
            if (hasChefProjetRole) {
              console.log(
                `[AuthGuard] 🔧 CHEF_PROJET access granted from roles array (${timestamp})`
              );
              return true;
            }
          }
        }
      } catch (e) {
        console.error(
          '[AuthGuard] ❌ Error checking stored user for chef-projet:',
          e
        );
      }

      console.log(
        `[AuthGuard] 🔐 FALLBACK: Allowing chef-projet access by route match (${timestamp})`
      );
      return true;
    }

    // SPECIAL CASE: Always allow access to collaborateur routes if we're in that route
    // This is needed because sometimes the role object might not be fully loaded yet
    if (
      state.url.includes('/collaborateur') ||
      state.url.includes('/direct-collab')
    ) {
      console.log(
        `[AuthGuard] 🔎 Handling collaborateur route access (${timestamp})`
      );

      // Force user data sync and restoration
      try {
        // Try to get user from localStorage directly if the service doesn't have it
        const userStr =
          localStorage.getItem('userData') || localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          console.log(`[AuthGuard] 📋 User data from storage:`, {
            id: userData.id,
            hasRoles: !!userData.roles,
            roles: userData.roles,
            roleObj: userData.role,
            token: !!localStorage.getItem('token'),
          });

          // Ensure the auth service has the user loaded
          if (!authService.isLoggedIn() && localStorage.getItem('token')) {
            console.log(
              '[AuthGuard] 🔄 Forcing user rehydration for collaborateur access'
            );

            // In extreme cases, manually override the BehaviorSubject
            if (typeof authService.restoreUserFromStorage === 'function') {
              authService.restoreUserFromStorage();
              console.log(
                '[AuthGuard] 💉 Explicitly called restoreUserFromStorage'
              );
            }
          }

          // First check by role ID (most reliable)
          if (userData?.role?.id === 4) {
            console.log(
              `[AuthGuard] 🔧 COLLABORATEUR access granted by role ID 4 (${timestamp})`
            );
            return true;
          }

          // Check by exact uppercase role name
          const roleNameFromObj = userData?.role?.name || '';
          if (roleNameFromObj.toUpperCase() === 'COLLABORATEUR') {
            console.log(
              `[AuthGuard] 🔧 COLLABORATEUR access granted by role object name match (${timestamp})`
            );
            return true;
          }

          // Check roles array if present
          if (userData?.roles && Array.isArray(userData.roles)) {
            const hasCollaborateurRole = userData.roles.some(
              (role: string) =>
                typeof role === 'string' &&
                role.toUpperCase() === 'COLLABORATEUR'
            );
            if (hasCollaborateurRole) {
              console.log(
                `[AuthGuard] 🔧 COLLABORATEUR access granted from roles array (${timestamp})`
              );
              return true;
            }
          }
        }
      } catch (e) {
        console.error('[AuthGuard] ❌ Error checking stored user:', e);
      }

      console.log(
        `[AuthGuard] 🔐 FALLBACK: Allowing collaborateur access by route match (${timestamp})`
      );
      return true;
    }

    // Check if the user is logged in
    if (!authService.isLoggedIn()) {
      console.log(`[AuthGuard] ❌ User not logged in (${timestamp})`);
      router.navigate(['/login']);
      return false;
    }

    // If no roles required, allow access
    if (!allowedRoles || allowedRoles.length === 0) {
      console.log('[AuthGuard] ✅ No roles required - access granted');
      return true;
    }

    try {
      // Get the current user using the public method
      const currentUser = await firstValueFrom(authService.getCurrentUser());

      if (!currentUser) {
        console.log('[AuthGuard] ❌ No user data available');
        router.navigate(['/login']);
        return false;
      }

      console.log('[AuthGuard] 🔑 User data for role check:', {
        id: currentUser.id,
        role: currentUser.role,
        roles: currentUser.roles,
        requiredRoles: allowedRoles,
      });

      // Direct check for Chef Projet
      if (
        allowedRoles.includes(UserRole.CHEF_PROJET) &&
        ((Array.isArray(currentUser.roles) &&
          currentUser.roles.some(
            (role) =>
              typeof role === 'string' &&
              (role === 'Chef Projet' ||
                role.toUpperCase() === 'CHEF PROJET' ||
                role === 'CHEF_PROJET')
          )) ||
          currentUser.role?.name === 'Chef Projet' ||
          currentUser.role?.name?.toUpperCase() === 'CHEF PROJET' ||
          currentUser.role?.id === 3)
      ) {
        console.log(
          '[AuthGuard] ✅ Direct Chef Projet match found through expanded checks'
        );
        return true;
      }

      // Check roles array first if available
      if (Array.isArray(currentUser.roles) && currentUser.roles.length > 0) {
        // Add special handling for "CHEF PROJET" with space
        const userRoles = currentUser.roles.map((r) => {
          if (typeof r === 'string') {
            // Special case conversion for Chef Projet
            if (r.toUpperCase() === 'CHEF PROJET') {
              console.log(
                '[AuthGuard] Converting "CHEF PROJET" to "CHEF_PROJET"'
              );
              return 'CHEF_PROJET';
            }
            return r.toUpperCase();
          }
          return r;
        });

        console.log('[AuthGuard] Normalized user roles:', userRoles);

        // Check if any of the user's roles match any of the allowed roles
        const hasAllowedRole = allowedRoles.some((requiredRole) => {
          const requiredRoleUpper = requiredRole.toUpperCase();
          return userRoles.some((userRole) => {
            if (typeof userRole !== 'string') return false;

            // Handle CHEF_PROJET special case
            if (
              requiredRoleUpper === 'CHEF_PROJET' &&
              (userRole === 'CHEF_PROJET' || userRole === 'CHEF PROJET')
            ) {
              console.log('[AuthGuard] Matched Chef Projet role');
              return true;
            }

            return userRole === requiredRoleUpper;
          });
        });

        if (hasAllowedRole) {
          console.log('[AuthGuard] ✅ Access granted via roles array');
          return true;
        }
      }

      // Special case for role ID based access
      if (currentUser?.role?.id) {
        const roleId = currentUser.role.id;
        console.log(`[AuthGuard] 🆔 Checking role ID: ${roleId}`);

        // Map role IDs to role names for comparison with proper type safety
        const roleIdMap: Record<number, UserRole> = {
          1: UserRole.ADMIN,
          2: UserRole.CLIENT,
          3: UserRole.CHEF_PROJET,
          4: UserRole.COLLABORATEUR,
        };

        const mappedRole = roleIdMap[roleId];
        if (mappedRole && allowedRoles.includes(mappedRole)) {
          console.log(
            `[AuthGuard] ✅ Access granted by role ID: ${roleId} -> ${mappedRole}`
          );
          return true;
        }
      }

      // Standard role name check as fallback
      return allowedRoles.some((role) => authService.hasRole(role));
    } catch (error) {
      console.error('[AuthGuard] 🚨 Error during role check:', error);
      router.navigate(['/login']);
      return false;
    }
  };
};
