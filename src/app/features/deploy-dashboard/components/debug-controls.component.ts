import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { DeployService } from '../services/deploy.service';

@Component({
  selector: 'app-debug-controls',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: ':host { display: block; }',
  templateUrl: './debug-controls.component.html',
})
export class DebugControlsComponent {
  private readonly deployService = inject(DeployService);

  protected readonly state = this.deployService.state;
  protected readonly debugDays = this.deployService.getDebugDays();
  protected readonly debugHours = this.deployService.getDebugHours();

  protected onDebugDayChange(day: number | null): void {
    const currentState = this.state();
    this.deployService.setDebugDateTime(day, currentState.debugHour);
  }

  protected onDebugHourChange(hour: number | null): void {
    const currentState = this.state();
    this.deployService.setDebugDateTime(currentState.debugDay, hour);
  }
}
