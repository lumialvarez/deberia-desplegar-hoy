import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DeployLevel } from '../models/deploy-response.model';
import { DeployService } from '../services/deploy.service';

interface LevelVisuals {
  readonly gradientClass: string;
  readonly ringClass: string;
  readonly badgeText: string;
}

const LEVEL_VISUALS: Readonly<Record<DeployLevel, LevelVisuals>> = {
  [DeployLevel.YES]: {
    gradientClass:
      'from-emerald-200 via-green-300 to-teal-400',
    ringClass: 'ring-deploy-yes/30',
    badgeText: 'Procede con confianza',
  },
  [DeployLevel.CAUTION]: {
    gradientClass:
      'from-amber-200 via-orange-300 to-yellow-400',
    ringClass: 'ring-deploy-caution/30',
    badgeText: 'Procede con cuidado',
  },
  [DeployLevel.NO]: {
    gradientClass:
      'from-rose-300 via-red-400 to-pink-500',
    ringClass: 'ring-deploy-no/30',
    badgeText: 'Mejor espera',
  },
  [DeployLevel.HELL_NO]: {
    gradientClass:
      'from-red-500 via-rose-600 to-fuchsia-700',
    ringClass: 'ring-deploy-hell-no/30',
    badgeText: 'Absolutamente no',
  },
};

@Component({
  selector: 'app-status-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-card.component.html',
  styles: ':host { display: block; }',
})
export class StatusCardComponent {
  private readonly deployService = inject(DeployService);

  protected readonly state = this.deployService.state;

  protected readonly visuals = computed<LevelVisuals | null>(() => {
    const level = this.state().currentLevel?.level;
    return level ? LEVEL_VISUALS[level] : null;
  });

  protected onCardClick(): void {
    this.deployService.refreshResponse();
  }

  protected onCardKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.deployService.refreshResponse();
    }
  }
}
