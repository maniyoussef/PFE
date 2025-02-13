// companies.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CompanyService } from '../../../services/company.service';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss'],
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
    TopBarComponent,
    NavbarComponent,
    MatProgressSpinnerModule,
  ],
})
export class CompaniesComponent implements OnInit {
  societes: any[] = [];
  nouvelleSociete: string = '';
  isLoading = false;
  error: string | null = null;

  constructor(
    private companyService: CompanyService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.isLoading = true;
    this.error = null;

    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        console.log('Loaded companies:', companies);
        this.societes = companies;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.error = 'Failed to load companies';
        this.isLoading = false;
        this.snackBar.open('Error loading companies', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  ajouterSociete() {
    if (this.nouvelleSociete.trim()) {
      const newCompany = {
        name: this.nouvelleSociete.trim(),
        icon: 'business',
        sector: 'Nouveau secteur',
      };

      this.companyService.addCompany(newCompany).subscribe({
        next: (company) => {
          this.societes.push(company);
          this.nouvelleSociete = '';
          this.snackBar.open('Company added successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error adding company:', error);
          this.snackBar.open('Error adding company', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  supprimerSociete(societe: any) {
    if (societe.id) {
      this.companyService.deleteCompany(societe.id).subscribe({
        next: () => {
          this.societes = this.societes.filter((s) => s.id !== societe.id);
          this.snackBar.open('Company deleted successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error deleting company:', error);
          this.snackBar.open('Error deleting company', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }
}
