import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProblemCategory } from '../models/problem-category.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root', // ✅ Service available globally
})
export class ProblemCategoryService {
  private apiUrl = `${environment.apiUrl}/problem-categories`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<ProblemCategory[]> {
    return this.http.get<ProblemCategory[]>(this.apiUrl);
  }

  addCategory(category: Partial<ProblemCategory>): Observable<ProblemCategory> {
    return this.http.post<ProblemCategory>(this.apiUrl, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateCategory(
    id: number,
    category: ProblemCategory
  ): Observable<ProblemCategory> {
    return this.http.put<ProblemCategory>(`${this.apiUrl}/${id}`, category);
  }
}
