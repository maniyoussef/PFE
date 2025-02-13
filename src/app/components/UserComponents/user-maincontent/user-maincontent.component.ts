// users-main-content.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-users-main-content',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './user-maincontent.component.html',
  styleUrls: ['./user-maincontent.component.scss'],
})
export class UsersMainContentComponent {
  stats = [
    { icon: 'assignment', label: 'Total Tickets', value: 120 },
    { icon: 'check_circle', label: 'Resolved Tickets', value: 90 },
    { icon: 'pending_actions', label: 'Pending Tickets', value: 30 },
  ];
}
