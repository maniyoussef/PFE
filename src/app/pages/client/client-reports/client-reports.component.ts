import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-container">
      <h1>My Reports</h1>
      <div class="reports-content">
        <p>View your reports and statistics here.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .reports-container {
        padding: 20px;
      }
      .reports-content {
        margin-top: 20px;
      }
    `,
  ],
})
export class ClientReportsComponent {}
