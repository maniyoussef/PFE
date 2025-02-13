import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { CountryService } from '../../../services/country.service';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { Country } from '../../../models/country.model';

@Component({
  selector: 'app-pays-list',
  templateUrl: './pays-list.component.html',
  styleUrls: ['./pays-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TopBarComponent,
    NavbarComponent,
  ],
})
export class PaysListComponent implements OnInit {
  pays: Country[] = [];
  nouveauPays: Country | null = null;
  isLoading = false;
  countryOptions: Country[] = [];

  constructor(
    private countryService: CountryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCountries();
  }

  loadCountries(): void {
    this.isLoading = true;

    // Load existing countries
    this.countryService.getCountries().subscribe({
      next: (dbCountries) => {
        this.pays = dbCountries;

        // Load available countries
        this.countryService.getAvailableCountries().subscribe({
          next: (availableCountries) => {
            this.countryOptions = availableCountries;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading available countries:', error);
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error loading existing countries:', error);
        this.isLoading = false;
      },
    });
  }

  onCountrySelect(country: Country): void {
    this.nouveauPays = country;
  }

  ajouterPays(): void {
    if (this.nouveauPays) {
      this.countryService.addCountry(this.nouveauPays).subscribe({
        next: (country) => {
          this.pays.push(country);
          this.countryOptions = this.countryOptions.filter(
            (c) => c.code !== country.code
          );
          this.nouveauPays = null;
          this.snackBar.open('Country added successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error adding country:', error);
          this.snackBar.open('Error adding country', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  deleteCountry(country: Country): void {
    if (country.id) {
      this.countryService.deleteCountry(country.id).subscribe({
        next: () => {
          this.pays = this.pays.filter((p) => p.id !== country.id);
          this.countryOptions.push(country);
          this.snackBar.open('Country deleted successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error deleting country:', error);
          this.snackBar.open('Error deleting country', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  handleFlagError(event: any): void {
    const img = event.target;
    if (img.src.includes('flagcdn')) {
      // If flagcdn image fails, try local fallback
      img.src = '/flag.png'; // Path to your public/flag.png
    } else {
      // If local fallback also fails, show empty
      img.style.display = 'none';
    }
  }
}
