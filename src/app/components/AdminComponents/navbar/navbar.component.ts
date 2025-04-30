import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import {
  NotificationService,
  UserRole,
} from '../../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    CommonModule,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  notificationCount = 0;
  private notificationSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private auth: AuthService,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to admin notification count
    this.notificationSubscription =
      this.notificationService.adminNotificationCount$.subscribe((count) => {
        this.notificationCount = count;
      });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  navigateTo(route: string): void {
    console.log('[NavbarComponent] 🔄 Navigating to:', route);
    this.router
      .navigate([route], { skipLocationChange: false, replaceUrl: false })
      .then((success) => {
        console.log('[NavbarComponent] ✅ Navigation result:', {
          success,
          targetRoute: route,
          timestamp: new Date().toISOString(),
        });
      })
      .catch((error) => {
        console.error('[NavbarComponent] ❌ Navigation error:', error);
      });
  }

  logout(): void {
    this.auth.logout();
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead(UserRole.ADMIN);
  }

  navigateToNotification(route: string, notificationId: string): void {
    // Mark as read and navigate
    this.notificationService.markAsRead(UserRole.ADMIN, notificationId);
    this.router.navigateByUrl(route);
  }
}
