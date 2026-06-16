import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="text-center space-y-6 max-w-md">
        <div class="text-7xl">🛰️</div>
        <h1 class="text-5xl font-extrabold text-foreground">404</h1>
        <p class="text-xl text-muted-foreground">
          Esta ruta no existe. Ni un deploy a las 3 AM tiene tanta pérdida.
        </p>
        <a
          mat-flat-button
          color="primary"
          routerLink="/"
          class="inline-flex items-center gap-2">
          <mat-icon>home</mat-icon>
          Volver al inicio
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
