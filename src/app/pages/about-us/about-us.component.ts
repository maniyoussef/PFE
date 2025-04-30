// about.component.ts
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from '../../components/AdminComponents/top-bar/top-bar.component';
import { NavbarComponent } from '../../components/AdminComponents/navbar/navbar.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    TopBarComponent,
    NavbarComponent,
  ],
  selector: 'app-about',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss'],
})
export class AboutComponent {}
