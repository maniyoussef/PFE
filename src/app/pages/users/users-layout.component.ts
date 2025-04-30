import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="users-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .users-layout {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class UsersLayoutComponent {}
