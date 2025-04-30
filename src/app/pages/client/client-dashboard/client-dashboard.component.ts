import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h1>Client Dashboard</h1>
      <div class="dashboard-content">
        <p>Welcome to your client dashboard.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 20px;
      }
      .dashboard-content {
        margin-top: 20px;
      }
    `,
  ],
})
export class ClientDashboardComponent {}
