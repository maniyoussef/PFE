import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog'; // Add if using dialogs
import { MatFormFieldModule } from '@angular/material/form-field'; // Add if using form fields
import { MatInputModule } from '@angular/material/input'; // Add if using inputs
import { MatSelectModule } from '@angular/material/select'; // Add if using selects
import { MatCheckboxModule } from '@angular/material/checkbox'; // Add if using checkboxes
import { MatButtonModule } from '@angular/material/button'; // Add if using buttons
import { MatIconModule } from '@angular/material/icon'; // Add if using icons

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule,
    MatDialogModule, // Add if using dialogs
    MatFormFieldModule, // Add if using form fields
    MatInputModule, // Add if using inputs
    MatSelectModule, // Add if using selects
    MatCheckboxModule, // Add if using checkboxes
    MatButtonModule, // Add if using buttons
    MatIconModule, // Add if using icons
  ],
})
export class AppComponent implements OnInit {
  isAdminRoute = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        this.isAdminRoute = event.url.startsWith('/admin-dashboard');
        console.log(
          'Current Route:',
          event.url,
          '| isAdminRoute:',
          this.isAdminRoute
        );
      });
  }
}
