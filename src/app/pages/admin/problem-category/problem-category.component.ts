// problem-category.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { ProblemCategory } from '../../../models/problem-category.model';
import { ProblemCategoryService } from '../../../services/problem-category.service';

@Component({
  selector: 'app-problem-category',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TopBarComponent,
    NavbarComponent,
  ],
  templateUrl: './problem-category.component.html',
  styleUrls: ['./problem-category.component.scss'],
})
export class ProblemCategoryComponent implements OnInit {
  categories: ProblemCategory[] = [];
  newCategoryName = '';
  isLoading = false;

  constructor(
    private categoryService: ProblemCategoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
        this.snackBar.open('Error loading categories', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  addCategory() {
    if (!this.newCategoryName.trim()) return;
    this.categoryService.addCategory({ name: this.newCategoryName }).subscribe({
      next: (category) => {
        this.categories.push(category);
        this.newCategoryName = '';
        this.snackBar.open('Category added successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error adding category:', error);
        this.snackBar.open('Error adding category', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  deleteCategory(id: number) {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter((cat) => cat.id !== id);
        this.snackBar.open('Category deleted successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.snackBar.open('Error deleting category', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
