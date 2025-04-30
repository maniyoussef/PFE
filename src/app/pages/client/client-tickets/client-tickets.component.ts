import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-tickets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tickets-container">
      <h1>My Tickets</h1>
      <div class="tickets-content">
        <p>View and manage your tickets here.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .tickets-container {
        padding: 20px;
      }
      .tickets-content {
        margin-top: 20px;
      }
    `,
  ],
})
export class ClientTicketsComponent {}
