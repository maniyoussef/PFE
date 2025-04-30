import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService, UserRole, Notification } from '../../../services/notification.service';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-chef-projet-navbar',
  templateUrl: './chef-projet-navbar.component.html',
  styleUrls: ['./chef-projet-navbar.component.scss'],
  imports: [
    MatToolbarModule,
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
  ],
})
export class ChefProjetNavbarComponent implements OnInit, OnDestroy {
  notificationCount = 0;
  private notificationSubscription: Subscription | null = null;

  constructor(
    public notificationService: NotificationService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to chef projet notification count
    this.notificationSubscription = this.notificationService.chefProjetNotificationCount$
      .subscribe(count => {
        this.notificationCount = count;
      });
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead(UserRole.CHEF_PROJET);
  }
  
  navigateToNotification(route: string, notificationId: string): void {
    // Mark as read and navigate
    this.notificationService.markAsRead(UserRole.CHEF_PROJET, notificationId);
    this.router.navigateByUrl(route);
  }

  logout(): void {
    this.auth.logout();
  }
}
