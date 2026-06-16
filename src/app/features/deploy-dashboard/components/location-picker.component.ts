import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { Country, Timezone } from '../models/location.model';
import { DeployService } from '../services/deploy.service';

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: ':host { display: block; }',
  templateUrl: './location-picker.component.html',
})
export class LocationPickerComponent {
  private readonly deployService = inject(DeployService);

  protected readonly state = this.deployService.state;
  protected readonly countries = this.deployService.getCountries();
  protected readonly timezones = this.deployService.getTimezones();

  protected onCountryChange(country: Country | null): void {
    this.deployService.selectCountry(country);
  }

  protected onTimezoneChange(timezone: Timezone | null): void {
    this.deployService.selectTimezone(timezone);
  }

  protected onDetectLocation(): void {
    this.deployService.detectLocation();
  }
}
