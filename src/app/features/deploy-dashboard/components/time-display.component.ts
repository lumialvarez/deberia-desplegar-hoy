import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DeployService } from '../services/deploy.service';

@Component({
  selector: 'app-time-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: ':host { display: block; }',
  template: `
    @if (state().currentTime) {
      <div class="text-center space-y-2 animate-fade-up">
        <div class="font-display text-6xl md:text-8xl font-extralight
                    tracking-tighter tabular-nums text-white/90 leading-none">
          {{ timeString() }}
        </div>
        <div class="text-xs md:text-sm uppercase tracking-[0.3em] text-white/40">
          {{ dateString() }} · {{ timezone() }}
        </div>
      </div>
    }
  `,
})
export class TimeDisplayComponent {
  private readonly deployService = inject(DeployService);

  protected readonly state = this.deployService.state;

  protected readonly timeString = computed(() => {
    const s = this.state();
    if (!s.currentTime) return '';
    return s.currentTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: s.selectedTimezone?.value || 'UTC',
    });
  });

  protected readonly dateString = computed(() => {
    const s = this.state();
    if (!s.currentTime) return '';
    return s.currentTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: s.selectedTimezone?.value || 'UTC',
    });
  });

  protected readonly timezone = computed(() => {
    const s = this.state();
    if (!s.selectedTimezone) return '';
    return s.selectedTimezone.value.replace(/_/g, ' ');
  });
}
