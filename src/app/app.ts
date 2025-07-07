import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { DeployService } from './services/deploy-service.service';
import { Country, Timezone } from './models/location.model';
import { DeployLevel } from './models/deploy-response.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './app.html'
})
export class App {
  private deployService = inject(DeployService);
  
  // Signals del servicio
  public state = this.deployService.state;
  
  // Datos para los selectores
  public countries = this.deployService.getCountries();
  public timezones = this.deployService.getTimezones();
  public debugDays = this.deployService.getDebugDays();
  public debugHours = this.deployService.getDebugHours();

  // Métodos para manejar selecciones
  onCountryChange(country: Country): void {
    this.deployService.selectCountry(country);
  }

  onTimezoneChange(timezone: Timezone): void {
    this.deployService.selectTimezone(timezone);
  }

  onRefresh(): void {
    this.deployService.refreshResponse();
  }

  onDetectLocation(): void {
    this.deployService.detectLocation();
  }

  onDebugDayChange(day: number): void {
    const currentState = this.state();
    this.deployService.setDebugDateTime(day, currentState.debugHour);
  }

  onDebugHourChange(hour: number): void {
    const currentState = this.state();
    this.deployService.setDebugDateTime(currentState.debugDay, hour);
  }

  // Getters para el template
  get currentLevelDisplay(): string {
    const level = this.state().currentLevel?.level;
    return level ? level.toString().toUpperCase() : '';
  }

  get cardBoxShadow(): string {
    const currentLevel = this.state().currentLevel;
    if (!currentLevel) {
      return '0 20px 40px -12px hsl(0, 0%, 50%, 0.5), 0 0 0 1px hsl(0, 0%, 50%, 0.3)';
    }
    return `0 20px 40px -12px ${currentLevel.glowColor}, 0 0 0 1px ${currentLevel.cardBorderColor}`;
  }

  // Métodos de utilidad para el template
  getCurrentTimeString(): string {
    const currentState = this.state();
    if (!currentState.currentTime) return '';
    
    return currentState.currentTime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: currentState.selectedTimezone?.value || 'UTC'
    });
  }

  getCurrentDateString(): string {
    const currentState = this.state();
    if (!currentState.currentTime) return '';
    
    return currentState.currentTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: currentState.selectedTimezone?.value || 'UTC'
    });
  }
}
