import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Project } from '../models/project.model';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Basic CRUD operations
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`).pipe(
      catchError((error) => {
        console.error('Error fetching projects:', error);
        return of([]);
      })
    );
  }

  getProject(id: number): Observable<Project | null> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching project ${id}:`, error);
        return of(null);
      })
    );
  }

  addProject(project: Project): Observable<Project | null> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, project).pipe(
      catchError((error) => {
        console.error('Error creating project:', error);
        return of(null);
      })
    );
  }

  updateProject(id: number, project: Project): Observable<Project | null> {
    return this.http
      .put<Project>(`${this.apiUrl}/projects/${id}`, project)
      .pipe(
        catchError((error) => {
          console.error(`Error updating project ${id}:`, error);
          return of(null);
        })
      );
  }

  deleteProject(id: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/projects/${id}`).pipe(
      map(() => true),
      catchError((error) => {
        console.error(`Error deleting project ${id}:`, error);
        return of(false);
      })
    );
  }

  // Project assignments
  assignProjectToChef(
    projectId: number,
    chefId: number | undefined
  ): Observable<void> {
    if (chefId === undefined) {
      console.error('Chef ID is undefined');
      return of(undefined);
    }
    return this.http
      .post<void>(
        `${this.apiUrl}/projects/assign-to-chef/${projectId}`,
        { chefId },
        { headers: this.createHeaders() }
      )
      .pipe(catchError(this.handleError));
  }

  assignProjectToClient(
    projectId: number,
    clientId: number | undefined
  ): Observable<void> {
    if (clientId === undefined) {
      console.error('Client ID is undefined');
      return of(undefined);
    }

    console.log(`Assigning project ${projectId} to client ${clientId}`);

    // Updated URL to match backend controller endpoint
    return this.http
      .post<void>(
        `${this.apiUrl}/projects/assign-project-to-client`,
        { projectId, clientId },
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error assigning project ${projectId} to client ${clientId}:`,
            error
          );
          return of(undefined);
        })
      );
  }

  // Project queries
  getProjectsByChefId(chefId: number | undefined): Observable<Project[]> {
    if (chefId === undefined) {
      console.error('Chef ID is undefined');
      return of([]);
    }

    return this.http
      .get<Project[]>(
        `${this.apiUrl}/projects/chef-projet/${chefId}/projects`,
        {
          headers: this.createHeaders(),
        }
      )
      .pipe(
        catchError((error) => {
          console.error(`Error fetching projects for chef ${chefId}:`, error);
          return of([]);
        })
      );
  }

  getClientProjects(clientId: number | undefined): Observable<Project[]> {
    if (clientId === undefined) {
      console.error('Client ID is undefined');
      return of([]);
    }

    console.log(`Fetching projects for client ${clientId}`);

    // Updated URL to match backend controller endpoint
    return this.http
      .get<Project[]>(`${this.apiUrl}/projects/client/${clientId}/projects`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error fetching projects for client ${clientId}:`,
            error
          );
          return of([]);
        })
      );
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });
  }

  private handleError(error: any): Observable<any> {
    console.error('Error:', error);
    return of(undefined);
  }
}
