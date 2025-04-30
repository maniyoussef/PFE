import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="client-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .client-layout {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class ClientLayoutComponent {}
