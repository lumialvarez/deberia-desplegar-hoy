import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-footer',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: ':host { display: block; }',
  template: `
    <footer class="text-center pt-12 mt-8 border-t border-white/5 space-y-3">
      <p class="text-xs text-white/40">
        Hecho con
        <mat-icon class="!text-base align-middle text-rose-400">favorite</mat-icon>
        para devs que alguna vez se preguntaron
        <span class="italic">"¿desplego hoy?"</span>
      </p>
      <a
        href="https://github.com/lumialvarez/deberia-desplegar-hoy"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-xs text-white/50
               hover:text-white/80 transition">
        Ver en GitHub
        <mat-icon class="!text-sm">arrow_outward</mat-icon>
      </a>
    </footer>
  `,
})
export class DashboardFooterComponent {}
