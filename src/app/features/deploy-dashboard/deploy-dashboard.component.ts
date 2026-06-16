import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  inject,
} from '@angular/core';

import { DashboardFooterComponent } from './components/dashboard-footer.component';
import { DebugControlsComponent } from './components/debug-controls.component';
import { LocationPickerComponent } from './components/location-picker.component';
import { StatusCardComponent } from './components/status-card.component';
import { TimeDisplayComponent } from './components/time-display.component';
import { DeployService } from './services/deploy.service';

@Component({
  selector: 'app-deploy-dashboard',
  standalone: true,
  imports: [
    StatusCardComponent,
    TimeDisplayComponent,
    LocationPickerComponent,
    DebugControlsComponent,
    DashboardFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .shell {
      position: relative;
      min-height: 100dvh;
      isolation: isolate;
    }
  `,
  templateUrl: './deploy-dashboard.component.html',
})
export class DeployDashboardComponent implements OnDestroy {
  private readonly deployService = inject(DeployService);

  protected readonly state = this.deployService.state;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space' || event.key === ' ') {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      event.preventDefault();
      this.deployService.refreshResponse();
    }
  }

  ngOnDestroy(): void {
    this.deployService.destroyTimeUpdates();
  }
}
