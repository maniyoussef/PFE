// src/app/pages/admin/companies/companies.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Company, CompanyService } from '../../../services/company.service';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';

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
  societes: Company[] = [];
  nouvelleSociete = '';
  contactPerson = ''; // New property
  email = ''; // New property
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
    if (
      this.nouvelleSociete.trim() &&
      this.contactPerson.trim() &&
      this.email.trim()
    ) {
      const newCompany: Company = {
        name: this.nouvelleSociete.trim(),
        contactPerson: this.contactPerson.trim(), // DYNAMIC VALUE
        email: this.email.trim(), // DYNAMIC VALUE
        phone: '',
        address: '',
      };

      this.companyService.addCompany(newCompany).subscribe({
        next: (company) => {
          this.societes.push(company);
          this.resetForm(); // Reset fields
          this.snackBar.open('Company added!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error:', error);
          this.snackBar.open(
            `Error: ${error.error.errors.Email?.[0] || error.message}`,
            'Close'
          );
        },
      });
    }
  }

  supprimerSociete(societe: Company) {
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

  private resetForm() {
    this.nouvelleSociete = '';
    this.contactPerson = '';
    this.email = '';
  }
}
