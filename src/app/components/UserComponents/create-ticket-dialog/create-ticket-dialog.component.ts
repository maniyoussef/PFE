import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TicketService } from '../../../services/ticket.service';
import { ProjectService } from '../../../services/project.service';
import { ProblemCategoryService } from '../../../services/problem-category.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { ClientService } from '../../../services/client.service';
import { AssignmentService } from '../../../services/assignment.service';
import { Project } from '../../../models/project.model';
import { ProblemCategory } from '../../../models/problem-category.model';
import { User } from '../../../models/user.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

interface ApiResponse {
  projects: Project[];
  categories: ProblemCategory[];
}

interface UserWithCategories extends User {
  assignedProblemCategories?: ProblemCategory[];
}

interface DialogData {
  priorities: string[];
  qualifications: string[];
}

@Component({
  selector: 'app-create-ticket-dialog',
  templateUrl: './create-ticket-dialog.component.html',
  styleUrls: ['./create-ticket-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
})
export class CreateTicketDialogComponent implements OnInit {
  ticketForm: FormGroup;
  isLoading = false;
  isLoadingAssignments = false;
  isUploading = false;
  errorMessage = '';
  availableProjects: Project[] = [];
  availableCategories: ProblemCategory[] = [];
  selectedFile: File | null = null;
  selectedFileName: string = '';
  uploadProgress = 0;
  qualifications = ['Low', 'Medium', 'High'];
  priorities = ['Low', 'Medium', 'High'];
  data: DialogData = {
    priorities: ['Low', 'Medium', 'High'],
    qualifications: ['Low', 'Medium', 'High'],
  };
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private projectService: ProjectService,
    private problemCategoryService: ProblemCategoryService,
    private userService: UserService,
    private authService: AuthService,
    private clientService: ClientService,
    private assignmentService: AssignmentService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) dialogData: DialogData
  ) {
    if (dialogData) {
      this.data = dialogData;
    }

    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      projectId: ['', Validators.required],
      categoryId: ['', Validators.required],
      priority: ['Medium', Validators.required],
      qualification: ['Medium', Validators.required],
      attachment: [''],
      commentaire: [''],
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.isLoading = true;
    this.isLoadingAssignments = true;
    this.errorMessage = '';

    // Try to get user from localStorage directly as fallback
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          this.userId = user.id;
          console.log('User ID from localStorage:', this.userId);
          this.fetchData();
          return;
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    // Get the current user from the auth service as an Observable
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (!user || !user.id) {
          this.errorMessage = 'User not authenticated or missing ID';
          this.isLoading = false;
          this.isLoadingAssignments = false;
          return;
        }

        this.userId = user.id;
        console.log('Current user ID from auth service:', this.userId);

        // Now fetch the data using the user ID
        this.fetchData();
      },
      error: (error) => {
        this.errorMessage = 'Error getting current user: ' + error;
        this.isLoading = false;
        this.isLoadingAssignments = false;
      },
    });
  }

  fetchData(): void {
    if (!this.userId) {
      this.errorMessage = 'No user ID available';
      this.isLoading = false;
      this.isLoadingAssignments = false;
      return;
    }

    // Try both methods to get projects
    this.fetchProjectsAndCategories();
  }

  fetchProjectsAndCategories(): void {
    // First try client service
    if (!this.userId) {
      this.errorMessage = 'No user ID available';
      this.isLoading = false;
      this.isLoadingAssignments = false;
      return;
    }

    // Now we're sure userId is a number, not null
    const userId = this.userId;

    this.clientService.getClientProjects(userId).subscribe({
      next: (projects) => {
        console.log('Client projects loaded:', projects);
        if (projects && projects.length > 0) {
          this.availableProjects = projects;
        } else {
          // If no projects found, try assignment service
          this.assignmentService.getProjectsByClientId(userId).subscribe({
            next: (assignedProjects: Project[]) => {
              console.log('Assigned projects loaded:', assignedProjects);
              this.availableProjects = assignedProjects;
            },
            error: (error: any) => {
              console.error('Error loading assigned projects:', error);
            },
          });
        }

        // Try to load categories from problem category service
        this.problemCategoryService
          .getCategoriesByClientId(userId.toString())
          .subscribe({
            next: (categories) => {
              console.log('Categories loaded:', categories);
              if (categories && categories.length > 0) {
                this.availableCategories = categories;
              } else {
                // If no categories, fetch all categories as fallback
                this.problemCategoryService.getCategories().subscribe({
                  next: (allCategories) => {
                    console.log('All categories loaded:', allCategories);
                    this.availableCategories = allCategories;
                  },
                  error: (catError) => {
                    console.error('Error loading all categories:', catError);
                  },
                });
              }

              this.isLoading = false;
              this.isLoadingAssignments = false;
            },
            error: (catError) => {
              console.error('Error loading categories for client:', catError);
              // Fallback to all categories
              this.problemCategoryService.getCategories().subscribe({
                next: (allCategories) => {
                  this.availableCategories = allCategories;
                  this.isLoading = false;
                  this.isLoadingAssignments = false;
                },
                error: (allCatError) => {
                  this.errorMessage =
                    'Error loading categories: ' + allCatError;
                  this.isLoading = false;
                  this.isLoadingAssignments = false;
                },
              });
            },
          });
      },
      error: (error) => {
        console.error('Error loading client projects:', error);
        // Try assignment service as fallback
        this.assignmentService.getProjectsByClientId(userId).subscribe({
          next: (assignedProjects: Project[]) => {
            this.availableProjects = assignedProjects;
            this.isLoading = false;
            this.isLoadingAssignments = false;
          },
          error: (assignError: any) => {
            // As a last resort, get all projects
            this.projectService.getProjects().subscribe({
              next: (allProjects) => {
                this.availableProjects = allProjects;
                this.isLoading = false;
                this.isLoadingAssignments = false;
              },
              error: (allProjError) => {
                this.errorMessage = 'Error loading projects: ' + allProjError;
                this.isLoading = false;
                this.isLoadingAssignments = false;
              },
            });
          },
        });
      },
    });
  }

  refreshData(): void {
    this.isLoading = true;
    this.isLoadingAssignments = true;
    this.errorMessage = '';
    this.fetchData();
  }

  tryHardcodedClientIds(): void {
    // This is a fallback method with hardcoded IDs for testing
    const hardcodedUserIds = [1, 2, 3, 4, 5]; // Try several common user IDs
    this.isLoadingAssignments = true;
    this.errorMessage = 'Trying hardcoded client IDs...';

    let successFound = false;

    // Try each ID until we find one that works
    for (const id of hardcodedUserIds) {
      this.clientService.getClientProjects(id).subscribe({
        next: (projects) => {
          if (projects && projects.length > 0 && !successFound) {
            successFound = true;
            this.availableProjects = projects;
            this.userId = id;
            console.log(`Found projects using hardcoded ID: ${id}`);

            this.problemCategoryService
              .getCategoriesByClientId(id.toString())
              .subscribe({
                next: (categories) => {
                  this.availableCategories = categories;
                  this.isLoadingAssignments = false;
                  this.errorMessage = `Using test client ID: ${id}`;
                },
                error: () => {
                  this.problemCategoryService
                    .getCategories()
                    .subscribe(
                      (allCats) => (this.availableCategories = allCats)
                    );
                  this.isLoadingAssignments = false;
                },
              });
          }
        },
        error: () => {
          // Silent error, will try next ID
        },
      });
    }

    // If all hardcoded IDs fail, fetch all projects as last resort
    setTimeout(() => {
      if (!successFound) {
        this.projectService.getProjects().subscribe({
          next: (allProjects) => {
            this.availableProjects = allProjects;
            this.problemCategoryService.getCategories().subscribe({
              next: (allCategories) => {
                this.availableCategories = allCategories;
                this.isLoadingAssignments = false;
                this.errorMessage =
                  'Using all available projects and categories';
              },
            });
          },
          error: () => {
            this.isLoadingAssignments = false;
            this.errorMessage = 'Failed to load any projects or categories';
          },
        });
      }
    }, 2000);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
      this.ticketForm.patchValue({ attachment: this.selectedFile.name });
    }
  }

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.isUploading = true;
    this.uploadProgress = 0;

    // Create a proper ticket object instead of FormData
    const ticketData = {
      title: this.ticketForm.get('title')?.value,
      description: this.ticketForm.get('description')?.value,
      priority: this.ticketForm.get('priority')?.value,
      qualification: this.ticketForm.get('qualification')?.value,
      projectId: this.ticketForm.get('projectId')?.value,
      categoryId: this.ticketForm.get('categoryId')?.value,
      commentaire: this.ticketForm.get('commentaire')?.value || '',
      attachment: this.selectedFileName || '',
      clientId: this.userId?.toString() || '',
    };

    console.log('Submitting ticket with data:', ticketData);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 300);

    // Upload file separately if needed
    let fileUploadComplete = true;
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name);
      fileUploadComplete = false;

      this.ticketService.uploadFile(formData).subscribe({
        next: () => {
          fileUploadComplete = true;
          this.createTicket(ticketData, progressInterval);
        },
        error: (error) => {
          clearInterval(progressInterval);
          this.isLoading = false;
          this.isUploading = false;
          this.errorMessage = 'Error uploading file: ' + error;
          this.snackBar.open('Error uploading file', 'Close', {
            duration: 3000,
          });
        },
      });
    }

    // If no file to upload, create ticket directly
    if (fileUploadComplete) {
      this.createTicket(ticketData, progressInterval);
    }
  }

  createTicket(ticketData: any, progressInterval: any): void {
    this.ticketService.createTicket(ticketData).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.isLoading = false;
        this.isUploading = false;
        this.snackBar.open('Ticket created successfully', 'Close', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isLoading = false;
        this.isUploading = false;
        this.errorMessage = 'Error creating ticket: ' + error;
        this.snackBar.open('Error creating ticket', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCancel(): void {
    this.closeDialog();
  }
}
