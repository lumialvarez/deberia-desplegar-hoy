import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';

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
  private readonly cardRef = viewChild<ElementRef<HTMLElement>>('cardEl');
  private readonly haloRef = viewChild<ElementRef<HTMLElement>>('clickHalo');

  protected readonly visuals = computed<LevelVisuals | null>(() => {
    const level = this.state().currentLevel?.level;
    return level ? LEVEL_VISUALS[level] : null;
  });

  protected onCardClick(): void {
    this.deployService.refreshResponse();
    this.playClickFx();
  }

  protected onCardKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.deployService.refreshResponse();
      this.playClickFx();
    }
  }

  /**
   * Fires a Web Animations burst on click: the card pulses up briefly
   * while the glow halo expands and brightens. Web Animations API is
   * used so repeated clicks always restart the animation cleanly without
   * any reflow tricks.
   */
  private playClickFx(): void {
    const card = this.cardRef()?.nativeElement;
    if (!card) return;
    card.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.025)', filter: 'brightness(1.25)', offset: 0.35 },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    );

    const halo = this.haloRef()?.nativeElement;
    if (halo) {
      halo.animate(
        [
          { opacity: 0.25, transform: 'translate(-50%, 0) scale(0.9)' },
          { opacity: 0.95, transform: 'translate(-50%, 0) scale(1.9)', offset: 0.4 },
          { opacity: 0.25, transform: 'translate(-50%, 0) scale(0.9)' },
        ],
        { duration: 720, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      );
    }
  }
}
