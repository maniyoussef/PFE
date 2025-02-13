import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { TicketService } from '../../../services/ticket.service';

interface Ticket {
  id: number;
  title: string;
  qualification:
    | 'ticket support'
    | 'demande de formation'
    | "demande d'information";
  projectId: number;
  projectName: string;
  categoryId: number;
  categoryName: string;
  description: string;
  priority: 'urgent' | 'élevé' | 'moyen' | 'faible' | 'amélioration';
}

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    NavbarComponent,
    TopBarComponent,
  ],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
})
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = false;

  constructor(private ticketService: TicketService) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.isLoading = true;
    // Simulated data for now
    this.tickets = [
      {
        id: 1,
        title: 'Problème de connexion',
        qualification: 'ticket support',
        projectId: 1,
        projectName: 'Projet A',
        categoryId: 1,
        categoryName: 'Technique',
        description: 'Utilisateur ne peut pas se connecter au système',
        priority: 'urgent',
      },
      {
        id: 2,
        title: 'Formation sur le nouveau module',
        qualification: 'demande de formation',
        projectId: 2,
        projectName: 'Projet B',
        categoryId: 2,
        categoryName: 'Formation',
        description: 'Besoin de formation sur le module de reporting',
        priority: 'moyen',
      },
      // Add more mock tickets as needed
    ];
    this.isLoading = false;
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      urgent: '#ff0000',
      élevé: '#ff6b6b',
      moyen: '#ffd93d',
      faible: '#6bcb77',
      amélioration: '#4d96ff',
    };
    return colors[priority] || '#000000';
  }
}
