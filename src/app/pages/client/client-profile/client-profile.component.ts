import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container">
      <h1>My Profile</h1>
      <div class="profile-content">
        <p>View and edit your profile information here.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-container {
        padding: 20px;
      }
      .profile-content {
        margin-top: 20px;
      }
    `,
  ],
})
export class ClientProfileComponent {}
