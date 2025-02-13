import { Component, inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ProblemCategoryService } from '../../../services/problem-category.service';
import { ProjectService } from '../../../services/project.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import type { Country } from '../../../models/country.model';
import type { Role } from '../../../models/role.model';
import type { User } from '../../../models/user.model';
import { CountryService } from '../../../services/country.service';

@Component({
  selector: 'app-create-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  templateUrl: './create-ticket-dialog.component.html',
  styleUrls: ['./create-ticket-dialog.component.scss'],
})
export class CreateTicketDialogComponent implements OnInit {
  form!: FormGroup;
  qualifications = [
    'Ticket Support',
    'Demande de Formation',
    "Demande d'Information",
  ];
  priorities = ['Urgent', 'Élevé', 'Moyen', 'Faible', 'Amélioration'];
  projects: any[] = [];
  categories: any[] = [];

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private categoryService = inject(ProblemCategoryService);
  private dialogRef = inject(MatDialogRef<CreateTicketDialogComponent>);

  ngOnInit(): void {
    this.form = this.fb.group({
      qualification: [''],
      project: [''],
      category: [''],
      priority: [''],
      title: [''],
      description: [''],
      attachment: [null],
    });

    this.loadProjects();
    this.loadCategories();
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        console.log('Projects loaded:', projects);
        this.projects = projects;
      },
      error: (err) => console.error('Failed to load projects:', err),
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded:', categories);
        this.categories = categories;
      },
      error: (err) => console.error('Failed to load categories:', err),
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.form.patchValue({ attachment: file });
  }

  submit() {
    if (this.form.valid) {
      console.log('Ticket Created:', this.form.value);
      this.dialogRef.close();
    }
  }

  close() {
    this.dialogRef.close();
  }
}
