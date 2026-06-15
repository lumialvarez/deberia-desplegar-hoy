import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
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

describe('DeployService', () => {
  let service: DeployService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        DeployService,
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(DeployService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with no country, no timezone, no response', () => {
      const state = service.state();
      expect(state.selectedCountry).toBeNull();
      expect(state.selectedTimezone).toBeNull();
      expect(state.currentResponse).toBeNull();
      expect(state.appTitle).toBe('¿DEBERÍAS DESPLEGAR HOY?');
    });

    it('should expose countries and timezones as readonly lists', () => {
      expect(service.getCountries().length).toBeGreaterThan(0);
      expect(service.getTimezones().length).toBeGreaterThan(0);
    });
  });

  describe('selectCountry', () => {
    it('should set country and resolve its timezone', () => {
      service.selectCountry(SPAIN);
      const state = service.state();
      expect(state.selectedCountry).toEqual(SPAIN);
      expect(state.selectedTimezone?.value).toBe('Europe/Madrid');
    });

    it('should clear timezone when null is passed', () => {
      service.selectCountry(SPAIN);
      service.selectCountry(null);
      const state = service.state();
      expect(state.selectedCountry).toBeNull();
      expect(state.selectedTimezone).toBeNull();
    });
  });

  describe('level determination', () => {
    beforeEach(() => {
      service.selectCountry(SPAIN);
    });

    it('should return HELL_NO on Sunday at any hour', () => {
      service.setDebugDateTime(0, 12);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.HELL_NO);
    });

    it('should return HELL_NO on Saturday at any hour', () => {
      service.setDebugDateTime(6, 12);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.HELL_NO);
    });

    it('should return YES on Monday morning (9:00)', () => {
      service.setDebugDateTime(1, 9);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.YES);
    });

    it('should return NO on Monday evening (20:00)', () => {
      service.setDebugDateTime(1, 20);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.NO);
    });

    it('should return CAUTION on Monday late night (3:00)', () => {
      service.setDebugDateTime(1, 3);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.CAUTION);
    });

    it('should return HELL_NO on Friday evening (19:00)', () => {
      service.setDebugDateTime(5, 19);
      expect(service.state().currentLevel?.level).toBe(DeployLevel.HELL_NO);
    });
  });

  describe('message generation', () => {
    beforeEach(() => {
      service.selectCountry(SPAIN);
    });

    it('should return an uppercase message in the country language', () => {
      service.setDebugDateTime(1, 9);
      const message = service.state().currentResponse?.message;
      expect(message).toBeTruthy();
      expect(message).toBe(message!.toUpperCase());
    });

    it('should return a non-empty message for every level', () => {
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
    });
  });

  describe('debug mode', () => {
    it('should respect URL ?debug=true on construction', () => {
      const originalSearch = window.location.search;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, search: '?debug=true' },
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideHttpClient(),
          provideHttpClientTesting(),
          DeployService,
        ],
      });
      const debugService = TestBed.inject(DeployService);

      // Flush the IP detect HTTP request triggered in constructor
      httpMock.expectOne('https://ipapi.co/json/').flush({});

      expect(debugService.state().isDebugMode).toBe(true);

      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...window.location, search: originalSearch },
      });
    });
  });

  describe('IP-based location detection', () => {
    it('should fall back to default country when IP returns unknown code', () => {
      const req = httpMock.expectOne('https://ipapi.co/json/');
      req.flush({ country_code: 'ZZ' });

      const state = service.state();
      expect(state.selectedCountry).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it('should match known country by code', () => {
      const req = httpMock.expectOne('https://ipapi.co/json/');
      req.flush({ country_code: 'ES' });

      const state = service.state();
      expect(state.selectedCountry?.code).toBe('ES');
    });

    it('should fall back gracefully on HTTP error', () => {
      const req = httpMock.expectOne('https://ipapi.co/json/');
      req.error(new ProgressEvent('error'));

      const state = service.state();
      expect(state.selectedCountry).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('getDebugDays / getDebugHours', () => {
    it('should return 7 days starting with Domingo', () => {
      const days = service.getDebugDays();
      expect(days.length).toBe(7);
      expect(days[0]!.label).toBe('Domingo');
      expect(days[6]!.label).toBe('Sábado');
    });

    it('should return 24 hours zero-padded', () => {
      const hours = service.getDebugHours();
      expect(hours.length).toBe(24);
      expect(hours[0]!.label).toBe('00:00');
      expect(hours[9]!.label).toBe('09:00');
    });
  });

  describe('Messages fallback chain', () => {
    it('should use country-specific messages when available', () => {
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
    });
  });
});
