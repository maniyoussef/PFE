import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router'; // ✅ Import RouterModule

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
export class UserNavbarComponent {} // ✅ Ensure this is correctly exported
