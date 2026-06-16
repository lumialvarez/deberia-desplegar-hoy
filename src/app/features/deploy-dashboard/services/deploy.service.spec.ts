import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { Country } from '../models/location.model';
import { DeployLevel } from '../models/deploy-response.model';
import { DeployService } from './deploy.service';

const SPAIN: Country = {
  code: 'ES',
  name: 'España',
  timezone: 'Europe/Madrid',
  language: 'es',
};

@Component({ template: '', standalone: true })
class TestHost {
  readonly service = inject(DeployService);
}

/**
 * Creates the service and flushes the afterNextRender effects so the
 * constructor's auto-detection (checkDebugMode, startTimeUpdates,
 * detectLocation) actually runs. Without this, the IP HTTP call would
 * never be made in the test environment because no real render happens.
 */
function setupService(): { service: DeployService; httpMock: HttpTestingController } {
  const httpMock = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  // afterNextRender callbacks are flushed on the next change detection.
  fixture.detectChanges();
  return { service: fixture.componentInstance.service, httpMock };
}

describe('DeployService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('should be created', () => {
    const { service, httpMock } = setupService();
    expect(service).toBeTruthy();
    // Drain the IP detection call from afterNextRender.
    httpMock.expectOne('https://ipapi.co/json/').flush({});
  });

  describe('initial state', () => {
    it('should start with no country, no timezone, no response', () => {
      const { service, httpMock } = setupService();
      const state = service.state();
      expect(state.selectedCountry).toBeNull();
      expect(state.selectedTimezone).toBeNull();
      expect(state.currentResponse).toBeNull();
      expect(state.appTitle).toBe('¿DEBERÍAS DESPLEGAR HOY?');
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should expose countries and timezones as readonly lists', () => {
      const { service, httpMock } = setupService();
      expect(service.getCountries().length).toBeGreaterThan(0);
      expect(service.getTimezones().length).toBeGreaterThan(0);
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });
  });

  describe('selectCountry', () => {
    it('should set country and resolve its timezone', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      const state = service.state();
      expect(state.selectedCountry).toEqual(SPAIN);
      expect(state.selectedTimezone?.value).toBe('Europe/Madrid');
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should clear timezone when null is passed', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.selectCountry(null);
      const state = service.state();
      expect(state.selectedCountry).toBeNull();
      expect(state.selectedTimezone).toBeNull();
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });
  });

  describe('level determination', () => {
    it('should return HELL_NO on Sunday at any hour', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.setDebugDateTime(0, 12);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.HELL_NO);
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should return HELL_NO on Saturday at any hour', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.setDebugDateTime(6, 12);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.HELL_NO);
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should return YES on Monday morning (9:00)', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.setDebugDateTime(1, 9);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.YES);
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should return NO on Monday evening (20:00)', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.setDebugDateTime(1, 20);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.NO);
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should return CAUTION on Monday late night (3:00)', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.setDebugDateTime(1, 3);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.CAUTION);
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should return HELL_NO on Friday evening (19:00)', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.setDebugDateTime(5, 19);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.HELL_NO);
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });
  });

  describe('message generation', () => {
    it('should return an uppercase message in the country language', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);
      service.setDebugDateTime(1, 9);
      const message = service.state().currentResponse?.message;
      expect(message).toBeTruthy();
      expect(message).toBe(message!.toUpperCase());
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should return a non-empty message for every level', () => {
      const { service, httpMock } = setupService();
      service.selectCountry(SPAIN);

      const cases: { day: number; hour: number }[] = [
        { day: 1, hour: 9 },
        { day: 1, hour: 3 },
        { day: 1, hour: 20 },
        { day: 0, hour: 12 },
        { day: 5, hour: 19 },
      ];

      for (const c of cases) {
        service.setDebugDateTime(c.day, c.hour);
        const message = service.state().currentResponse?.message;
        expect(message).toBeTruthy();
        expect(message!.length).toBeGreaterThan(0);
      }
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });
  });

  describe('debug mode', () => {
    it('should respect URL ?debug=true on afterNextRender', () => {
      const originalSearch = window.location.search;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, search: '?debug=true' },
      });

      try {
        const { service, httpMock } = setupService();
        expect(service.state().isDebugMode).toBe(true);
        httpMock.expectOne('https://ipapi.co/json/').flush({});
      } finally {
        Object.defineProperty(window, 'location', {
          writable: true,
          value: { ...window.location, search: originalSearch },
        });
      }
    });
  });

  describe('IP-based location detection (afterNextRender auto)', () => {
    it('should fall back to default country when IP returns unknown code', () => {
      const { service, httpMock } = setupService();
      const req = httpMock.expectOne('https://ipapi.co/json/');
      req.flush({ country_code: 'ZZ' });

      const state = service.state();
      expect(state.selectedCountry).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('should match known country by code', () => {
      const { service, httpMock } = setupService();
      const req = httpMock.expectOne('https://ipapi.co/json/');
      req.flush({ country_code: 'ES' });

      const state = service.state();
      expect(state.selectedCountry?.code).toBe('ES');
    });

    it('should fall back gracefully on HTTP error', () => {
      const { service, httpMock } = setupService();
      const req = httpMock.expectOne('https://ipapi.co/json/');
      req.error(new ProgressEvent('error'));

      const state = service.state();
      expect(state.selectedCountry).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('manual detectLocation()', () => {
    it('should make a new IP request each time it is called', () => {
      const { service, httpMock } = setupService();
      // First auto-call from afterNextRender:
      httpMock.expectOne('https://ipapi.co/json/').flush({ country_code: 'US' });
      // Manually retrigger:
      service.detectLocation();
      const req = httpMock.expectOne('https://ipapi.co/json/');
      req.flush({ country_code: 'AR' });
      expect(service.state().selectedCountry?.code).toBe('AR');
    });
  });

  describe('getDebugDays / getDebugHours', () => {
    it('should return 7 days starting with Domingo', () => {
      const { service, httpMock } = setupService();
      const days = service.getDebugDays();
      expect(days.length).toBe(7);
      expect(days[0]!.label).toBe('Domingo');
      expect(days[6]!.label).toBe('Sábado');
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });

    it('should return 24 hours zero-padded', () => {
      const { service, httpMock } = setupService();
      const hours = service.getDebugHours();
      expect(hours.length).toBe(24);
      expect(hours[0]!.label).toBe('00:00');
      expect(hours[9]!.label).toBe('09:00');
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });
  });

  describe('Messages fallback chain', () => {
    it('should use country-specific messages when available', () => {
      const { service, httpMock } = setupService();
      const argentina: Country = {
        code: 'AR',
        name: 'Argentina',
        timezone: 'America/Argentina/Buenos_Aires',
        language: 'es',
      };
      service.selectCountry(argentina);
      service.setDebugDateTime(1, 9);

      const response = service.state().currentResponse;
      expect(response?.message).toBeTruthy();
      httpMock.expectOne('https://ipapi.co/json/').flush({});
    });
  });
});
