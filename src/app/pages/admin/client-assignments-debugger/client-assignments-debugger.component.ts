import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../services/project.service';
import { ProblemCategoryService } from '../../../services/problem-category.service';
import { UserService } from '../../../services/user.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Project } from '../../../models/project.model';
import { ProblemCategory } from '../../../models/problem-category.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-client-assignments-debugger',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatIconModule,
    MatTableModule,
    RouterModule,
  ],
  template: `
    <div class="container mt-4">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Client Assignments Debugger</mat-card-title>
          <mat-card-subtitle
            >Outil de diagnostic pour les problèmes d'assignation de projets et
            catégories</mat-card-subtitle
          >
        </mat-card-header>
        <mat-card-content>
          <div class="alert alert-info">
            <p>
              Cet outil permet de déboguer les assignations
              clients/projets/catégories.
            </p>
            <p>
              Si les utilisateurs ne peuvent pas voir leurs projets ou
              catégories, utilisez cet outil pour vérifier les assignations.
            </p>
          </div>

          <div class="row mb-3">
            <div class="col">
              <button
                mat-raised-button
                color="primary"
                (click)="loadAllData()"
                [disabled]="loading"
              >
                <mat-icon>refresh</mat-icon> Charger toutes les données
              </button>
            </div>
          </div>

          <div *ngIf="loading" class="text-center my-3">
            <mat-spinner diameter="40" class="mx-auto"></mat-spinner>
            <p>Chargement des données...</p>
          </div>

          <mat-expansion-panel *ngIf="clients.length">
            <mat-expansion-panel-header>
              <mat-panel-title>Clients ({{ clients.length }})</mat-panel-title>
            </mat-expansion-panel-header>

            <mat-list>
              <ng-container *ngFor="let client of clients">
                <mat-list-item>
                  <div class="d-flex justify-content-between w-100">
                    <span>{{ client.name }} (ID: {{ client.id }})</span>
                    <button
                      mat-stroked-button
                      color="primary"
                      (click)="debugClientAssignments(client.id)"
                    >
                      Déboguer
                    </button>
                  </div>
                </mat-list-item>
                <mat-divider></mat-divider>
              </ng-container>
            </mat-list>
          </mat-expansion-panel>

          <div *ngIf="debugResults" class="mt-4">
            <mat-card>
              <mat-card-header>
                <mat-card-title
                  >Résultats du débogage pour Client ID:
                  {{ debugClientId }}</mat-card-title
                >
              </mat-card-header>
              <mat-card-content>
                <div
                  class="alert"
                  [ngClass]="{
                    'alert-success': debugResults.projectsFound,
                    'alert-danger': !debugResults.projectsFound
                  }"
                >
                  <strong>Projets:</strong>
                  <span *ngIf="debugResults.projectsFound"
                    >{{ debugResults.projects.length }} projets trouvés</span
                  >
                  <span *ngIf="!debugResults.projectsFound"
                    >Aucun projet trouvé</span
                  >
                </div>

                <div
                  class="alert"
                  [ngClass]="{
                    'alert-success': debugResults.categoriesFound,
                    'alert-danger': !debugResults.categoriesFound
                  }"
                >
                  <strong>Catégories:</strong>
                  <span *ngIf="debugResults.categoriesFound"
                    >{{ debugResults.categories.length }} catégories
                    trouvées</span
                  >
                  <span *ngIf="!debugResults.categoriesFound"
                    >Aucune catégorie trouvée</span
                  >
                </div>

                <h4 class="mt-3">Projets</h4>
                <div *ngIf="debugResults.projects.length">
                  <mat-table
                    [dataSource]="debugResults.projects"
                    class="mat-elevation-z2"
                  >
                    <ng-container matColumnDef="id">
                      <mat-header-cell *matHeaderCellDef>ID</mat-header-cell>
                      <mat-cell *matCellDef="let project">{{
                        project.id
                      }}</mat-cell>
                    </ng-container>

                    <ng-container matColumnDef="name">
                      <mat-header-cell *matHeaderCellDef>Nom</mat-header-cell>
                      <mat-cell *matCellDef="let project">{{
                        project.name
                      }}</mat-cell>
                    </ng-container>

                    <ng-container matColumnDef="clientId">
                      <mat-header-cell *matHeaderCellDef
                        >Client ID</mat-header-cell
                      >
                      <mat-cell *matCellDef="let project">{{
                        project.clientId
                      }}</mat-cell>
                    </ng-container>

                    <mat-header-row
                      *matHeaderRowDef="['id', 'name', 'clientId']"
                    ></mat-header-row>
                    <mat-row
                      *matRowDef="let row; columns: ['id', 'name', 'clientId']"
                    ></mat-row>
                  </mat-table>
                </div>
                <div
                  *ngIf="!debugResults.projects.length"
                  class="alert alert-warning"
                >
                  Aucun projet trouvé pour ce client
                </div>

                <h4 class="mt-3">Catégories</h4>
                <div *ngIf="debugResults.categories.length">
                  <mat-table
                    [dataSource]="debugResults.categories"
                    class="mat-elevation-z2"
                  >
                    <ng-container matColumnDef="id">
                      <mat-header-cell *matHeaderCellDef>ID</mat-header-cell>
                      <mat-cell *matCellDef="let category">{{
                        category.id
                      }}</mat-cell>
                    </ng-container>

                    <ng-container matColumnDef="name">
                      <mat-header-cell *matHeaderCellDef>Nom</mat-header-cell>
                      <mat-cell *matCellDef="let category">{{
                        category.name
                      }}</mat-cell>
                    </ng-container>

                    <ng-container matColumnDef="clientId">
                      <mat-header-cell *matHeaderCellDef
                        >Client ID</mat-header-cell
                      >
                      <mat-cell *matCellDef="let category">{{
                        category.clientId
                      }}</mat-cell>
                    </ng-container>

                    <mat-header-row
                      *matHeaderRowDef="['id', 'name', 'clientId']"
                    ></mat-header-row>
                    <mat-row
                      *matRowDef="let row; columns: ['id', 'name', 'clientId']"
                    ></mat-row>
                  </mat-table>
                </div>
                <div
                  *ngIf="!debugResults.categories.length"
                  class="alert alert-warning"
                >
                  Aucune catégorie trouvée pour ce client
                </div>

                <div class="mt-3">
                  <button
                    mat-raised-button
                    color="accent"
                    [disabled]="fixing || !debugClientId"
                    (click)="
                      debugClientId && fixClientAssignments(debugClientId)
                    "
                  >
                    <mat-icon>build</mat-icon> Réparer les assignations
                  </button>
                  <span *ngIf="fixing" class="ml-2">
                    <mat-spinner
                      diameter="20"
                      class="d-inline-block"
                    ></mat-spinner>
                    Réparation en cours...
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/admin-dashboard" color="primary">
            <mat-icon>arrow_back</mat-icon> Retour au tableau de bord
          </a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1200px;
      }
      mat-spinner {
        margin: 0 auto;
      }
    `,
  ],
})
export class ClientAssignmentsDebuggerComponent implements OnInit, OnDestroy {
  clients: User[] = [];
  loading = false;
  fixing = false;
  debugClientId: number | null = null;
  debugResults: {
    projectsFound: boolean;
    categoriesFound: boolean;
    projects: Project[];
    categories: ProblemCategory[];
  } | null = null;

  clientsLoading = false;
  clientsError: string | null = null;

  debugClientControl = new FormControl<number | null>(null);

  // Project and category info
  projectResults = {
    clientId: 0,
    url: '',
    loading: false,
    error: null as string | null,
    projects: [] as Project[],
  };

  categoryResults = {
    clientId: 0,
    url: '',
    loading: false,
    error: null as string | null,
    categories: [] as ProblemCategory[],
  };

  // API Endpoints for reference
  projectEndpoint = '';
  categoryEndpoint = '';

  // Subscriptions to clean up
  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private categoryService: ProblemCategoryService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.initEndpoints();

    const clientSelectionSub = this.debugClientControl.valueChanges.subscribe(
      (clientId) => {
        if (clientId !== null) {
          this.debugClientId = clientId;
          this.testClientAssignments(clientId);
        } else {
          this.resetResults();
        }
      }
    );

    this.subscriptions.push(clientSelectionSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private initEndpoints(): void {
    this.projectEndpoint = `${environment.apiUrl}/projects/client/{clientId}/projects`;
    this.categoryEndpoint = `${environment.apiUrl}/problem-categories/client/{clientId}`;
  }

  loadAllData(): void {
    this.loading = true;
    this.clients = [];

    this.clientsLoading = true;
    this.clientsError = null;

    this.userService.getClients().subscribe({
      next: (clients: User[]) => {
        this.clients = clients;
        this.clientsLoading = false;
        if (clients.length === 0 && !this.clientsError) {
          this.clientsError = 'No clients found in the system.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.clientsError = `Failed to load clients: ${
          error.message || 'Unknown error'
        }`;
        this.clientsLoading = false;
        this.loading = false;
      },
    });
  }

  debugClientAssignments(clientId: number | undefined): void {
    if (clientId === undefined) {
      console.error('Client ID is undefined');
      this.snackBar.open('Client ID is undefined', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar',
      });
      return;
    }

    this.loading = true;
    this.debugClientId = clientId;
    this.debugResults = null;

    // Get projects for this client
    this.projectService.getClientProjects(clientId).subscribe(
      (projects: Project[]) => {
        console.log(
          `Debug: Found ${projects.length} projects for client ${clientId}`
        );

        // Get categories for this client
        this.categoryService
          .getCategoriesByClientId(clientId.toString())
          .subscribe(
            (categories: ProblemCategory[]) => {
              console.log(
                `Debug: Found ${categories.length} categories for client ${clientId}`
              );

              this.debugResults = {
                projectsFound: projects.length > 0,
                categoriesFound: categories.length > 0,
                projects: projects,
                categories: categories,
              };

              this.loading = false;
            },
            (error: any) => {
              console.error(
                `Error getting categories for client ${clientId}:`,
                error
              );
              this.snackBar.open(
                'Erreur lors du chargement des catégories',
                'Fermer',
                {
                  duration: 5000,
                }
              );

              this.debugResults = {
                projectsFound: projects.length > 0,
                categoriesFound: false,
                projects: projects,
                categories: [],
              };

              this.loading = false;
            }
          );
      },
      (error: any) => {
        console.error(`Error getting projects for client ${clientId}:`, error);
        this.snackBar.open('Erreur lors du chargement des projets', 'Fermer', {
          duration: 5000,
        });

        // Still try to get categories
        this.categoryService
          .getCategoriesByClientId(clientId.toString())
          .subscribe(
            (categories: ProblemCategory[]) => {
              this.debugResults = {
                projectsFound: false,
                categoriesFound: categories.length > 0,
                projects: [],
                categories: categories,
              };

              this.loading = false;
            },
            (categoryError: any) => {
              console.error(
                `Error getting categories for client ${clientId}:`,
                categoryError
              );

              this.debugResults = {
                projectsFound: false,
                categoriesFound: false,
                projects: [],
                categories: [],
              };

              this.loading = false;
            }
          );
      }
    );
  }

  fixClientAssignments(clientId: number | null): void {
    if (clientId === null) return;

    this.fixing = true;

    // Method 1: First try to reassign all projects to this client
    this.projectService.getProjects().subscribe(
      (allProjects) => {
        // Find projects for this client - don't rely on clientId property
        // Instead, we'll need to get assigned projects directly from the client API
        this.projectService.getClientProjects(clientId).subscribe(
          (clientProjects) => {
            if (clientProjects.length > 0) {
              console.log(
                `Found ${clientProjects.length} projects already assigned to client ${clientId}`
              );

              // Force reassign these projects to ensure the relationship is properly saved
              const reassignPromises = clientProjects.map((project) => {
                return new Promise<void>((resolve) => {
                  this.projectService
                    .assignProjectToClient(clientId, project.id)
                    .subscribe(
                      () => {
                        console.log(
                          `Reassigned project ${project.id} to client ${clientId}`
                        );
                        resolve();
                      },
                      (error) => {
                        console.error(
                          `Error reassigning project ${project.id}:`,
                          error
                        );
                        resolve(); // Still resolve to continue with other projects
                      }
                    );
                });
              });

              Promise.all(reassignPromises).then(() => {
                // Now check categories
                this.fixCategoriesForClient(clientId);
              });
            } else {
              console.log(`No projects found for client ${clientId}`);
              this.fixCategoriesForClient(clientId);
            }
          },
          (error) => {
            console.error(`Error getting client projects:`, error);
            this.fixCategoriesForClient(clientId);
          }
        );
      },
      (error) => {
        console.error('Error getting all projects:', error);
        this.snackBar.open(
          'Erreur lors de la récupération des projets',
          'Fermer',
          {
            duration: 5000,
          }
        );
        this.fixing = false;
      }
    );
  }

  private fixCategoriesForClient(clientId: number): void {
    // Get categories directly from client API instead of filtering by clientId
    this.categoryService.getCategoriesByClientId(clientId.toString()).subscribe(
      (clientCategories) => {
        if (clientCategories.length > 0) {
          console.log(
            `Found ${clientCategories.length} categories already assigned to client ${clientId}`
          );

          // Force reassign these categories
          const reassignPromises = clientCategories.map((category) => {
            return new Promise<void>((resolve) => {
              this.categoryService
                .assignCategoryToClient(
                  clientId.toString(),
                  category.id.toString()
                )
                .subscribe(
                  () => {
                    console.log(
                      `Reassigned category ${category.id} to client ${clientId}`
                    );
                    resolve();
                  },
                  (error) => {
                    console.error('Error assigning category:', error);
                    resolve(); // Still resolve to continue
                  }
                );
            });
          });

          Promise.all(reassignPromises).then(() => {
            this.finishRepair(clientId);
          });
        } else {
          console.log(`No categories found for client ${clientId}`);
          this.finishRepair(clientId);
        }
      },
      (error) => {
        console.error('Error fetching client categories:', error);
        this.snackBar.open(
          'Erreur lors de la récupération des catégories',
          'Fermer',
          {
            duration: 5000,
          }
        );
        this.fixing = false;
      }
    );
  }

  private finishRepair(clientId: number): void {
    // After attempting repairs, re-run the debug to see if it fixed the issue
    this.fixing = false;
    this.snackBar.open(
      'Réparation terminée, vérification des résultats...',
      'Fermer',
      {
        duration: 3000,
      }
    );

    // Wait a moment for potential backend caches to clear
    setTimeout(() => {
      this.debugClientAssignments(clientId);
    }, 1000);
  }

  testClientAssignments(clientId: number): void {
    if (!clientId) return;

    this.resetResults();
    this.projectResults.clientId = clientId;
    this.categoryResults.clientId = clientId;

    // Get projects for the client
    this.testClientProjects(clientId);

    // Get categories for the client
    this.testClientCategories(clientId);
  }

  testClientProjects(clientId: number): void {
    this.projectResults.loading = true;
    this.projectResults.url = this.projectEndpoint.replace(
      '{clientId}',
      clientId.toString()
    );

    this.subscriptions.push(
      this.projectService
        .getClientProjects(clientId)
        .pipe(
          catchError((error) => {
            this.projectResults.error = `Failed to load projects: ${
              error.message || 'Unknown error'
            }`;
            console.error(
              'Error loading projects for client',
              clientId,
              ':',
              error
            );
            return of([]);
          }),
          finalize(() => {
            this.projectResults.loading = false;
          })
        )
        .subscribe((projects) => {
          this.projectResults.projects = projects;
          if (projects.length === 0 && !this.projectResults.error) {
            this.projectResults.error = 'No projects found for this client.';
          }
        })
    );
  }

  testClientCategories(clientId: number): void {
    this.categoryResults.loading = true;
    this.categoryResults.url = this.categoryEndpoint.replace(
      '{clientId}',
      clientId.toString()
    );

    this.subscriptions.push(
      this.categoryService
        .getCategoriesByClientId(clientId.toString())
        .pipe(
          catchError((error) => {
            this.categoryResults.error = `Failed to load categories: ${
              error.message || 'Unknown error'
            }`;
            console.error(
              'Error loading categories for client',
              clientId,
              ':',
              error
            );
            return of([]);
          }),
          finalize(() => {
            this.categoryResults.loading = false;
          })
        )
        .subscribe((categories) => {
          this.categoryResults.categories = categories;
          if (categories.length === 0 && !this.categoryResults.error) {
            this.categoryResults.error = 'No categories found for this client.';
          }
        })
    );
  }

  resetResults(): void {
    this.projectResults = {
      clientId: 0,
      url: '',
      loading: false,
      error: null,
      projects: [],
    };

    this.categoryResults = {
      clientId: 0,
      url: '',
      loading: false,
      error: null,
      categories: [],
    };
  }

  // Test raw HTTP requests to diagnose potential issues
  testDirectHttpRequest(url: string, type: 'project' | 'category'): void {
    const headers = new HttpHeaders({
      'Cache-Control':
        'no-cache, no-store, must-revalidate, post-check=0, pre-check=0',
      Pragma: 'no-cache',
      Expires: '0',
      'If-Modified-Since': '0',
    });

    if (type === 'project') {
      this.projectResults.loading = true;
      this.projectResults.error = null;
    } else {
      this.categoryResults.loading = true;
      this.categoryResults.error = null;
    }

    this.http.get(url, { headers }).subscribe({
      next: (response: any) => {
        console.log(`Direct HTTP ${type} response:`, response);

        if (type === 'project') {
          this.projectResults.projects = response as Project[];
          this.projectResults.loading = false;
          this.snackBar.open(
            `Loaded ${response.length} projects directly`,
            'OK',
            { duration: 3000 }
          );
        } else {
          this.categoryResults.categories = response as ProblemCategory[];
          this.categoryResults.loading = false;
          this.snackBar.open(
            `Loaded ${response.length} categories directly`,
            'OK',
            { duration: 3000 }
          );
        }
      },
      error: (error: any) => {
        console.error(`Direct HTTP ${type} error:`, error);
        const errorMessage = `Direct request failed: ${
          error.message || 'Unknown error'
        }`;

        if (type === 'project') {
          this.projectResults.error = errorMessage;
          this.projectResults.loading = false;
        } else {
          this.categoryResults.error = errorMessage;
          this.categoryResults.loading = false;
        }

        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      },
    });
  }
}
