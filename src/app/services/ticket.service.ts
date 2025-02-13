// services/ticket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ticket {
  id: number;
  title: string;
  qualification:
    | 'ticket support'
    | 'demande de formation'
    | "demande d'information";
  projectId: number;
  projectName: string;
  categoryId: number;
  categoryName: string;
  description: string;
  priority: 'urgent' | 'élevé' | 'moyen' | 'faible' | 'amélioration';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl);
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket);
  }

  updateTicket(id: number, ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}`, ticket);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Additional methods for filtering tickets
  getTicketsByProject(projectId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getTicketsByCategory(categoryId: number): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  getTicketsByPriority(priority: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/priority/${priority}`);
  }
}
