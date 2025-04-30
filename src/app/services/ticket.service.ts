import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, throwError, switchMap, retry, timeout, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Ticket } from '../models/ticket.model';
import {
  NotificationService,
  UserRole,
  NotificationType,
} from './notification.service';
import { TICKET_STATUS } from '../constants/ticket-status.constant';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  getTickets(): Observable<Ticket[]> {
    return this.http
      .get<Ticket[]>(this.apiUrl, { headers: this.createHeaders() })
      .pipe(
        tap((tickets) => {
          console.log('Tickets fetched from API:', tickets);
        }),
        retry(2),
        timeout(30000),
        catchError((error) => {
          console.error('Error fetching tickets:', error);
          return throwError(
            () => 'Failed to fetch tickets. Please try again later.'
          );
        })
      );
  }

  getUserTickets(): Observable<Ticket[]> {
    console.log('[TicketService] Fetching user tickets from API...');

    // Add cache-busting parameters
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);

    // Add cache busting headers
    const httpOptions = {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Random': random,
        'X-Timestamp': timestamp.toString(),
      },
    };

    // Implement request with timeout to avoid long-hanging requests
    return this.http
      .get<Ticket[]>(
        `${this.apiUrl}/mes-tickets?_=${timestamp}_${random}`,
        httpOptions
      )
      .pipe(
        tap((tickets) => {
          console.log(
            '[TicketService] User tickets fetched successfully:',
            tickets
          );
          console.log(`[TicketService] Found ${tickets.length} tickets`);
        }),
        retry(2), // Retry twice if it fails
        timeout(30000), // Set 30 second timeout
        catchError((error) => {
          console.error('[TicketService] Error fetching user tickets:', error);

          let errorMessage = 'Unknown error occurred';
          if (error.status === 401) {
            console.error(
              '[TicketService] Authentication error - token may be invalid or expired'
            );
            errorMessage = 'Authentication error - please log in again';
          } else if (error.status === 500) {
            console.error(
              '[TicketService] Server error occurred:',
              error.error
            );
            errorMessage = `Server error: ${
              error.error?.message || 'Internal server error'
            }`;
          } else if (error.name === 'TimeoutError') {
            errorMessage = 'Request timed out - server may be unavailable';
          }

          return throwError(
            () => new Error(`Failed to load tickets: ${errorMessage}`)
          );
        })
      );
  }

  getProjectTickets(projectId: number | string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/project/${projectId}`, {
      headers: this.createHeaders(),
    });
  }

  getTicketsWithReports(): Observable<Ticket[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/with-reports`, {
        headers: this.createHeaders(),
      })
      .pipe(
        tap((response) => console.log('Raw API Response:', response)),
        map((response) =>
          response.map(
            (item) =>
              ({
                id: item.id,
                title: item.title,
                description: item.description,
                priority: item.priority,
                qualification: item.qualification,
                status: item.status,
                createdAt: item.createdDate || item.CreatedDate,
                updatedAt: item.updatedAt || item.UpdatedAt,
                report: item.report || item.Report || '',
                commentaire: item.commentaire || '',
                project:
                  item.project || item.Project
                    ? {
                        id: item.project?.id || item.Project?.id || 0,
                        name: item.project?.name || item.Project?.name || 'N/A',
                      }
                    : undefined,
                problemCategory:
                  item.problemCategory || item.ProblemCategory
                    ? {
                        id:
                          item.problemCategory?.id ||
                          item.ProblemCategory?.id ||
                          0,
                        name:
                          item.problemCategory?.name ||
                          item.ProblemCategory?.name ||
                          'N/A',
                      }
                    : undefined,
                assignedTo:
                  item.assignedTo || item.AssignedTo
                    ? {
                        id: item.assignedTo?.id || item.AssignedTo?.id || 0,
                        name:
                          item.assignedTo?.name ||
                          item.AssignedTo?.name ||
                          'N/A',
                      }
                    : undefined,
              } as Ticket)
          )
        ),
        tap((mapped) => console.log('Mapped Tickets:', mapped)),
        catchError(this.handleError)
      );
  }

  getUserAssignedTickets(userId: number | string): Observable<Ticket[]> {
    console.log(
      `[TicketService] Fetching assigned tickets for user ID: ${userId}`
    );

    // Add cache-busting parameters
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);

    // Add cache busting headers
    const httpOptions = {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Random': random,
        'X-Timestamp': timestamp.toString(),
      },
    };

    return this.http
      .get<Ticket[]>(
        `${this.apiUrl}/assigned/${userId}?_=${timestamp}_${random}`,
        httpOptions
      )
      .pipe(
        tap((tickets) => {
          console.log('[TicketService] Raw response from API:', tickets);
          if (!tickets || tickets.length === 0) {
            console.log('[TicketService] No tickets found for user');
          } else {
            tickets.forEach((ticket) => {
              console.log('[TicketService] Processing ticket:', {
                id: ticket.id,
                title: ticket.title,
                status: ticket.status,
                assignedToId: ticket.assignedToId,
              });
            });
          }
        }),
        retry(2), // Retry twice if it fails
        timeout(30000), // Set 30 second timeout
        catchError((error) => {
          console.error(
            '[TicketService] Error fetching assigned tickets:',
            error
          );
          return throwError(
            () => new Error('Failed to fetch assigned tickets')
          );
        })
      );
  }

  getTicketById(id: number | string): Observable<Ticket> {
    return this.http
      .get<Ticket>(`${this.apiUrl}/${id}`, { headers: this.createHeaders() })
      .pipe(
        tap((ticket) => console.log(`Ticket ${id} fetched:`, ticket)),
        catchError(this.handleError)
      );
  }

  createTicket(ticketData: any): Observable<Ticket> {
    const payload = {
      title: ticketData.title,
      description: ticketData.description,
      qualification: ticketData.qualification,
      projectId: ticketData.projectId,
      problemCategoryId: ticketData.categoryId,
      priority: ticketData.priority,
      attachment: ticketData.attachment || '',
      assignedToId: ticketData.assignedToId,
      commentaire: ticketData.commentaire || '',
    };

    console.log('Creating ticket with payload:', payload);

    return this.http
      .post<Ticket>(this.apiUrl, payload, { headers: this.createHeaders() })
      .pipe(
        tap((response) => {
          console.log('Create ticket response:', response);
          // Notify admin of new ticket
          this.notificationService.notifyNewTicket(response.title, response.id);

          // If the ticket has a project, notify the chef projet as well
          if (response.project && response.project.chefProjetId) {
            this.notificationService.addNotificationForRole(
              UserRole.CHEF_PROJET,
              {
                message: `Nouveau ticket créé pour votre projet ${response.project.name}: ${response.title}`,
                route: `/chef-projet/tickets/${response.id}`,
                type: NotificationType.NEW_TICKET,
                relatedId: response.id,
              }
            );
          }

          this.notificationService.showSuccess('Ticket créé avec succès');
        }),
        catchError(this.handleError)
      );
  }

  updateTicket(ticket: Ticket): Observable<Ticket> {
    const ticketDto = {
      title: ticket.title,
      description: ticket.description,
      qualification: ticket.qualification || '',
      projectId: ticket.project?.id || 0,
      problemCategoryId: ticket.problemCategory?.id || 0,
      priority: ticket.priority,
      assignedToId: ticket.assignedToId,
      attachment: ticket.attachment || '',
      status: ticket.status,
      commentaire: ticket.commentaire,
      report: ticket.report,
      startWorkTime: ticket.startWorkTime,
      finishWorkTime: ticket.finishWorkTime,
      workDuration: ticket.workDuration,
      temporarilyStopped: ticket.temporarilyStopped,
      workFinished: ticket.workFinished,
    };

    console.log(`Updating ticket ${ticket.id} with data:`, ticketDto);

    return this.http.put<Ticket>(`${this.apiUrl}/${ticket.id}`, ticketDto, {
      headers: this.createHeaders(),
    });
  }

  deleteTicket(id: number | string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers: this.createHeaders() })
      .pipe(
        tap(() => console.log(`Ticket ${id} deleted`)),
        catchError(this.handleError)
      );
  }

  updateTicketAssignment(
    ticketId: number | string,
    collaborateurId: number | string
  ): Observable<Ticket> {
    return this.http
      .get<Ticket>(`${this.apiUrl}/${ticketId}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        switchMap((existingTicket) => {
          const ticketDto = {
            assignedToId: collaborateurId,
            title: existingTicket.title,
            description: existingTicket.description,
            qualification: existingTicket.qualification || '',
            projectId: existingTicket.project?.id || 0,
            problemCategoryId: existingTicket.problemCategory?.id || 0,
            priority: existingTicket.priority,
            attachment: existingTicket.attachment || '',
            status: existingTicket.status || 'Assigné',
            commentaire: existingTicket.commentaire || '',
            report: existingTicket.report || '',
          };

          console.log(
            `Updating ticket ${ticketId} assignment to user ${collaborateurId} with complete data:`,
            ticketDto
          );

          return this.http
            .put<Ticket>(`${this.apiUrl}/${ticketId}`, ticketDto, {
              headers: this.createHeaders(),
            })
            .pipe(
              tap((response) => {
                console.log('Assignment response:', response);
                // Notify the assigned collaborateur
                // Convert to number for compatibility with notification service
                const numericTicketId =
                  typeof ticketId === 'string'
                    ? parseInt(ticketId, 10)
                    : ticketId;
                const numericCollaborateurId =
                  typeof collaborateurId === 'string'
                    ? parseInt(collaborateurId, 10)
                    : collaborateurId;
                this.notificationService.notifyTicketAssigned(
                  existingTicket.title,
                  numericTicketId,
                  numericCollaborateurId
                );
              }),
              catchError(this.handleError)
            );
        }),
        catchError((error) => {
          console.error(
            `Error getting ticket ${ticketId} before assignment:`,
            error
          );
          return throwError(
            () =>
              new Error(
                `Impossible de récupérer les détails du ticket avant l'assignation: ${error.message}`
              )
          );
        })
      );
  }

  getResolvedTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/resolved`, {
      headers: this.createHeaders(),
    });
  }

  uploadFile(formData: FormData): Observable<HttpEvent<any>> {
    return this.http
      .post<any>(`${this.apiUrl}/upload`, formData, {
        reportProgress: true,
        observe: 'events',
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getTicketComments(ticketId: number | string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${ticketId}/comments`, {
      headers: this.createHeaders(),
    });
  }

  addComment(ticketId: number | string, content: string): Observable<Comment> {
    const userId = 1;
    return this.http.post<Comment>(
      `${this.apiUrl}/${ticketId}/comments`,
      {
        content,
        userId,
      },
      { headers: this.createHeaders() }
    );
  }

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl, {
      headers: this.createHeaders(),
    });
  }

  updateTicketReport(
    ticketId: number | string,
    report: string
  ): Observable<Ticket> {
    const ticketDto = {
      report: report,
    };

    console.log(`Updating report for ticket ${ticketId}:`, report);

    return this.http
      .patch<Ticket>(`${this.apiUrl}/${ticketId}/comment`, ticketDto, {
        headers: this.createHeaders(),
      })
      .pipe(
        tap((response) => console.log('Report updated:', response)),
        catchError(this.handleError)
      );
  }

  updateTicketComment(
    ticketId: number | string,
    commentaire: string
  ): Observable<Ticket> {
    const ticketDto = {
      commentaire: commentaire,
    };

    console.log(`Updating commentaire for ticket ${ticketId}:`, commentaire);

    return this.http
      .patch<Ticket>(`${this.apiUrl}/${ticketId}/comment`, ticketDto, {
        headers: this.createHeaders(),
      })
      .pipe(
        tap((response) => console.log('Comment updated:', response)),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = `Server error [${error.status}]: ${error.message}`;
    if (error.status === 404) {
      errorMessage = 'Requested resource not found';
    }
    return throwError(() => new Error(errorMessage));
  }

  updateTicketStatus(
    ticketId: number | string,
    status: string,
    report?: string
  ): Observable<Ticket> {
    const dto = {
      status: status,
      report: report,
    };
    console.log(
      `[TicketService] Updating ticket ${ticketId} status to "${status}"`,
      dto
    );

    return this.http
      .patch<Ticket>(`${this.apiUrl}/${ticketId}/status`, dto, {
        headers: this.createHeaders(),
      })
      .pipe(
        tap((response) =>
          console.log(
            `[TicketService] Status update success for ticket ${ticketId}:`,
            response
          )
        ),
        catchError((error) => {
          console.error(
            `[TicketService] Status update error for ticket ${ticketId}:`,
            error
          );
          return throwError(
            () => new Error(`Failed to update ticket status: ${error.message}`)
          );
        })
      );
  }

  updateTicketWorkflow(
    ticketId: number | string,
    workflowData: {
      temporarilyStopped?: boolean;
      workFinished?: boolean;
      startWorkTime?: string;
      finishWorkTime?: string;
      workDuration?: number;
    }
  ): Observable<Ticket> {
    console.log(
      `[TicketService] Updating workflow for ticket ${ticketId}:`,
      workflowData
    );

    return this.http
      .patch<Ticket>(`${this.apiUrl}/${ticketId}/workflow`, workflowData, {
        headers: this.createHeaders(),
      })
      .pipe(
        tap((response) =>
          console.log(
            `[TicketService] Workflow update success for ticket ${ticketId}:`,
            response
          )
        ),
        catchError((error) => {
          console.error(
            `[TicketService] Workflow update error for ticket ${ticketId}:`,
            error
          );
          return throwError(
            () =>
              new Error(`Failed to update ticket workflow: ${error.message}`)
          );
        })
      );
  }

  getProjectTicketsByChefProjetId(
    chefProjetId: number | string | undefined
  ): Observable<any[]> {
    if (chefProjetId === undefined) {
      console.error('Chef projet ID is undefined');
      return of([]);
    }
    return this.http
      .get<any[]>(`${this.apiUrl}/chef-projet/${chefProjetId}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching tickets by chef projet ID:', error);
          return of([]);
        })
      );
  }

  // Specific method for updating work duration
  updateTicketWorkDuration(
    ticketId: number | string,
    workDuration: number
  ): Observable<Ticket> {
    console.log(
      `[TicketService] Updating work duration for ticket ${ticketId} to ${workDuration} seconds`
    );

    // Use the workflow endpoint instead of the duration endpoint
    return this.http
      .patch<Ticket>(
        `${this.apiUrl}/${ticketId}/workflow`,
        {
          workDuration,
        },
        { headers: this.createHeaders() }
      )
      .pipe(
        tap((response) =>
          console.log(`[TicketService] Work duration update success:`, response)
        ),
        catchError((error) => {
          console.error(`[TicketService] Work duration update error:`, error);

          // Fallback to using the standard update endpoint if needed
          console.log(
            `[TicketService] Falling back to standard update for work duration`
          );
          return this.safeUpdateTicket(ticketId, { workDuration });
        })
      );
  }

  // Improved method for direct state update via main endpoint
  directUpdateTicket(
    ticketId: number | string,
    updatedTicket: Partial<Ticket>
  ): Observable<Ticket> {
    console.log(
      `[TicketService] Direct update for ticket ${ticketId}:`,
      updatedTicket
    );

    // Always use the safe update to ensure we have all required fields
    return this.safeUpdateTicket(ticketId, updatedTicket);
  }

  // Safe update method that gets the ticket first to ensure we have all required fields
  private safeUpdateTicket(
    ticketId: number | string,
    partialUpdate: Partial<Ticket>
  ): Observable<Ticket> {
    console.log(
      `[TicketService] Safe update for ticket ${ticketId}:`,
      partialUpdate
    );

    // First get the current ticket to ensure we have all required fields
    return this.getTicketById(ticketId).pipe(
      switchMap((existingTicket) => {
        // Create a proper DTO that matches the backend expectations by combining existing data with updates
        const ticketDto = {
          title: partialUpdate.title || existingTicket.title,
          description: partialUpdate.description || existingTicket.description,
          qualification:
            partialUpdate.qualification || existingTicket.qualification || '',
          projectId:
            partialUpdate.project?.id || existingTicket.project?.id || 0,
          problemCategoryId:
            partialUpdate.problemCategory?.id ||
            existingTicket.problemCategory?.id ||
            0,
          priority: partialUpdate.priority || existingTicket.priority,
          assignedToId:
            partialUpdate.assignedToId || existingTicket.assignedToId,
          attachment:
            partialUpdate.attachment || existingTicket.attachment || '',
          status: partialUpdate.status || existingTicket.status,
          commentaire:
            partialUpdate.commentaire || existingTicket.commentaire || '',
          report: partialUpdate.report || existingTicket.report || '',
          startWorkTime:
            partialUpdate.startWorkTime || existingTicket.startWorkTime,
          finishWorkTime:
            partialUpdate.finishWorkTime || existingTicket.finishWorkTime,
          workDuration:
            partialUpdate.workDuration !== undefined
              ? partialUpdate.workDuration
              : existingTicket.workDuration,
          temporarilyStopped:
            partialUpdate.temporarilyStopped !== undefined
              ? partialUpdate.temporarilyStopped
              : existingTicket.temporarilyStopped,
          workFinished:
            partialUpdate.workFinished !== undefined
              ? partialUpdate.workFinished
              : existingTicket.workFinished,
        };

        console.log(`[TicketService] Complete DTO for backend:`, ticketDto);

        return this.http
          .put<Ticket>(`${this.apiUrl}/${ticketId}`, ticketDto, {
            headers: this.createHeaders(),
          })
          .pipe(
            tap((response) =>
              console.log(
                `[TicketService] Update success for ticket ${ticketId}:`,
                response
              )
            ),
            catchError((error) => {
              console.error(
                `[TicketService] Update error for ticket ${ticketId}:`,
                error
              );
              return throwError(
                () =>
                  new Error(
                    `Failed to directly update ticket: ${error.message}`
                  )
              );
            })
          );
      }),
      catchError((error) => {
        console.error(
          `[TicketService] Failed to get ticket ${ticketId} before update:`,
          error
        );
        return throwError(
          () =>
            new Error(`Failed to get ticket before update: ${error.message}`)
        );
      })
    );
  }

  getAssignedTickets(userId: number | string): Observable<Ticket[]> {
    return this.http
      .get<Ticket[]>(`${this.apiUrl}/assigned/${userId}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        tap((tickets) => console.log('Assigned tickets fetched:', tickets)),
        catchError(this.handleError)
      );
  }

  // Accept a ticket - marks it as accepted in the system
  acceptTicket(ticketId: number | string): Observable<Ticket> {
    console.log(`[TicketService] Accepting ticket ${ticketId}`);

    return this.getTicketById(ticketId).pipe(
      switchMap((ticket) => {
        return this.updateTicketStatus(ticketId, TICKET_STATUS.ACCEPTED).pipe(
          tap((response) => {
            console.log(
              `[TicketService] Ticket ${ticketId} accepted successfully`
            );

            // Convert to number for compatibility with notification service
            const numericTicketId =
              typeof ticketId === 'string' ? parseInt(ticketId, 10) : ticketId;

            // Notify the client - we'll use the notifyTicketAccepted method that handles this
            this.notificationService.notifyTicketAccepted(
              ticket.title,
              numericTicketId
            );

            // Notify chef projet if available
            if (ticket.project && ticket.project.chefProjetId) {
              this.notificationService.addNotificationForRole(
                UserRole.CHEF_PROJET,
                {
                  message: `Le ticket "${ticket.title}" pour le projet ${ticket.project.name} a été accepté`,
                  route: `/chef-projet/tickets/${ticketId}`,
                  type: NotificationType.TICKET_ACCEPTED,
                  relatedId: numericTicketId,
                }
              );
            }

            this.notificationService.showSuccess('Ticket accepté avec succès');
          })
        );
      }),
      catchError((error) => {
        console.error(
          `[TicketService] Failed to accept ticket ${ticketId}:`,
          error
        );
        this.notificationService.showError(
          "Erreur lors de l'acceptation du ticket"
        );
        return throwError(
          () => new Error(`Failed to accept ticket: ${error.message}`)
        );
      })
    );
  }

  // Refuse a ticket with a report explaining the reason
  refuseTicket(ticketId: number | string, report: string): Observable<Ticket> {
    console.log(
      `[TicketService] Refusing ticket ${ticketId} with report:`,
      report
    );

    return this.getTicketById(ticketId).pipe(
      switchMap((ticket) => {
        return this.updateTicketStatus(
          ticketId,
          TICKET_STATUS.REFUSED,
          report
        ).pipe(
          tap((response) => {
            console.log(
              `[TicketService] Ticket ${ticketId} refused successfully`
            );

            // Convert to number for compatibility with notification service
            const numericTicketId =
              typeof ticketId === 'string' ? parseInt(ticketId, 10) : ticketId;

            // Notify the client
            this.notificationService.notifyTicketRefused(
              ticket.title,
              numericTicketId,
              report
            );

            // Notify chef projet if available
            if (ticket.project && ticket.project.chefProjetId) {
              this.notificationService.addNotificationForRole(
                UserRole.CHEF_PROJET,
                {
                  message: `Le ticket "${ticket.title}" pour le projet ${ticket.project.name} a été refusé`,
                  route: `/chef-projet/reports`,
                  type: NotificationType.TICKET_REFUSED,
                  relatedId: numericTicketId,
                }
              );
            }

            this.notificationService.showSuccess('Ticket refusé avec succès');
          })
        );
      }),
      catchError((error) => {
        console.error(
          `[TicketService] Failed to refuse ticket ${ticketId}:`,
          error
        );
        this.notificationService.showError('Erreur lors du refus du ticket');
        return throwError(
          () => new Error(`Failed to refuse ticket: ${error.message}`)
        );
      })
    );
  }

  // Assign ticket to a collaborator
  assignTicket(
    ticketId: number | string,
    userId: number | string
  ): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/${ticketId}/assign/${userId}`,
        {},
        {
          headers: this.createHeaders(),
        }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error assigning ticket ${ticketId} to user ${userId}:`,
            error
          );
          return throwError(
            () => 'Failed to assign ticket. Please try again later.'
          );
        })
      );
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  getTicketsByProjectId(projectId: number | string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/project/${projectId}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error fetching tickets for project ID ${projectId}:`,
            error
          );
          return throwError(
            () => 'Failed to fetch tickets for project. Please try again later.'
          );
        })
      );
  }

  getTicketsByUserId(userId: number | string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/user/${userId}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching tickets for user ID ${userId}:`, error);
          return throwError(
            () => 'Failed to fetch tickets for user. Please try again later.'
          );
        })
      );
  }
}
