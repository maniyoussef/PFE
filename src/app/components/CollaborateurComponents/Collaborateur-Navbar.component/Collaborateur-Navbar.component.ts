// collaborateur-navbar.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-collaborateur-navbar',
  templateUrl: './Collaborateur-Navbar.component.html',
  styleUrls: ['./Collaborateur-Navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MaterialModule
  ]
})
export class CollaborateurNavbarComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
  }
}
