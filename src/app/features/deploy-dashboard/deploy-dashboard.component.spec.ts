import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';

import { DeployDashboardComponent } from './deploy-dashboard.component';

describe('DeployDashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeployDashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DeployDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the page eyebrow title', () => {
    const fixture = TestBed.createComponent(DeployDashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const eyebrow = compiled.querySelector('header p');
    expect(eyebrow).toBeTruthy();
    expect(eyebrow?.textContent).toContain('desplegar');
  });

  it('should render sub-components', () => {
    const fixture = TestBed.createComponent(DeployDashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-status-card')).toBeTruthy();
    expect(compiled.querySelector('app-time-display')).toBeTruthy();
    expect(compiled.querySelector('app-location-picker')).toBeTruthy();
    expect(compiled.querySelector('app-dashboard-footer')).toBeTruthy();
  });

  it('should not render debug controls in non-debug mode', () => {
    const fixture = TestBed.createComponent(DeployDashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-debug-controls')).toBeFalsy();
  });

  it('should apply the aurora background class to the shell', () => {
    const fixture = TestBed.createComponent(DeployDashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const shell = compiled.querySelector('.aurora');
    expect(shell).toBeTruthy();
  });
});
