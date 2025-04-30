import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-navbar',
  templateUrl: './user-navbar.component.html',
  styleUrls: ['./user-navbar.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    CommonModule,
    RouterLink,
    MatIconModule,
    RouterModule,
  ],
})
export class UserNavbarComponent {
  constructor(private router: Router, private auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
