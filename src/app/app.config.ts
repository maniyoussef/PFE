import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()), // ✅ Ensure routes are correctly imported
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      MatSnackBarModule,
      MatCardModule,
      FormsModule // ✅ Correct usage of FormsModule
    ),
  ],
};
