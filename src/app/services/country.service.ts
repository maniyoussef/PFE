import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Country } from '../models/country.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  private apiUrl = `${environment.apiUrl}/countries`;

  constructor(private http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http
      .get<Country[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  addCountry(country: Country): Observable<Country> {
    const formattedCountry = {
      ...country,
      code: country.code.toLowerCase(),
    };
    return this.http
      .post<Country>(this.apiUrl, formattedCountry)
      .pipe(catchError(this.handleError));
  }

  deleteCountry(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getAvailableCountries(): Observable<Country[]> {
    return this.http
      .get<Country[]>(`${this.apiUrl}/available`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
