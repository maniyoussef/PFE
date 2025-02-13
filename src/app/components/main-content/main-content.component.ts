import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
    MatSnackBarModule, // ✅ Ajouter ceci
  ],
})
export class MainContentComponent {
  stats = [
    {
      title: 'Pays',
      icon: 'public',
      value: 3,
      link: '/admin-dashboard/pays-list',
    },
    {
      title: 'Projets',
      icon: 'work',
      value: 8,
      link: '/admin-dashboard/projects',
    },
    {
      title: 'Sociétés',
      icon: 'business',
      value: 12,
      link: '/admin-dashboard/societes',
    },
    {
      title: 'Utilisateurs',
      icon: 'group',
      value: 24,
      link: '/admin-dashboard/app-users-list-creation', // Ensure this matches the routing path
    },
  ];
}
