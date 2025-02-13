import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

// Child Components
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { MainContentComponent } from '../../../components/main-content/main-content.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './AdminDashboard.component.html',
  styleUrls: ['./AdminDashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // Material Modules
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    // Child Components
    TopBarComponent,

    MainContentComponent,
    NavbarComponent,
  ],
})
export class AdminDashboardComponent {
  constructor() {
    console.log('AdminDashboardComponent initialized');
  }
}
