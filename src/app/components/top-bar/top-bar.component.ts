import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule],
  template: `
    <mat-toolbar class="top-bar">
      <div class="top-bar-content">
        <div class="top-bar-links">
          <a routerLink="/support" class="top-link">
            <mat-icon>help_outline</mat-icon>
            <span>Support</span>
          </a>
          <a routerLink="/about" class="top-link">
            <mat-icon>info_outline</mat-icon>
            <span>About Us</span>
          </a>
          <a routerLink="/policy" class="top-link">
            <mat-icon>policy</mat-icon>
            <span>Policy</span>
          </a>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--header-height);
      background-color: var(--background-primary);
      border-bottom: 1px solid var(--border-color);
      z-index: 1000;
      transition: all 0.3s ease;
    }

    .top-bar-content {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    .top-bar-links {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .top-link {
      color: var(--text-primary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }

      &:hover {
        color: var(--accent-color);
        background-color: rgba(227, 111, 22, 0.1);
      }
    }

    @media (max-width: 768px) {
      .top-bar-content {
        padding: 0 1rem;
      }

      .top-bar-links {
        gap: 1rem;
      }

      .top-link {
        span {
          display: none;
        }
      }
    }
  `]
})
export class TopBarComponent {} 