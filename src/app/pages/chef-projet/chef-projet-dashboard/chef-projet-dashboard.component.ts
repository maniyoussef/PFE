// chef-projet-dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-chef-projet-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './chef-projet-dashboard.component.html',
  styleUrls: ['./chef-projet-dashboard.component.scss'],
})
export class ChefProjetDashboardComponent {
  // Data for dashboard metrics - renamed from stats to match the template
  stats = [
    { title: 'Projets', icon: 'work', value: 8 },
    { title: 'Tickets', icon: 'confirmation_number', value: 42 },
    { title: 'Rapports', icon: 'description', value: 24 },
    { title: 'Utilisateurs', icon: 'group', value: 15 },
  ];

  constructor() {
    console.log('ChefProjetDashboardComponent initialized');
  }
}
