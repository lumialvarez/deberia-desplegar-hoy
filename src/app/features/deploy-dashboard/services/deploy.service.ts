import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { Observable, catchError, interval, map, of, Subject, takeUntil } from 'rxjs';

import { Country, Timezone } from '../models/location.model';
import {
  DayConfiguration,
  DeployLevel,
  DeployResponse,
  LevelConfiguration,
  Messages,
  ResponseLevel,
  TimeRange,
} from '../models/deploy-response.model';

import deployConfigRaw from '../data/deploy-config.json';
import enMessages from '../data/responses/en.json';
import esMessages from '../data/responses/es.json';
import esArMessages from '../data/responses/es-AR.json';
import esClMessages from '../data/responses/es-CL.json';
import esCoMessages from '../data/responses/es-CO.json';
import esEsMessages from '../data/responses/es-ES.json';
import ptMessages from '../data/responses/pt.json';

export const LOCATION_SEARCH = new InjectionToken<string>('LOCATION_SEARCH', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return '';
    return inject(DOCUMENT).location?.search ?? '';
  },
});

interface RawTimeRange {
  startHour: number;
  endHour: number;
  level: string;
}

interface RawDayConfig {
  dayOfWeek: number[];
  ranges: RawTimeRange[];
}

interface IpApiResponse {
  readonly country_code?: string;
  readonly region_code?: string;
}

interface AppState {
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly currentTime: Date | null;
  readonly selectedCountry: Country | null;
  readonly selectedTimezone: Timezone | null;
  readonly currentResponse: DeployResponse | null;
  readonly currentLevel: ResponseLevel | null;
  readonly isDebugMode: boolean;
  readonly debugDay: number | null;
  readonly debugHour: number | null;
  readonly appTitle: string;
  readonly levelConfiguration: LevelConfiguration | null;
}

@Injectable({ providedIn: 'root' })
export class DeployService {
  private readonly http = inject(HttpClient);
  private readonly locationSearch = inject(LOCATION_SEARCH);

  private readonly stateSignal = signal<AppState>({
    isLoading: false,
    error: null,
    currentTime: null,
    selectedCountry: null,
    selectedTimezone: null,
    currentResponse: null,
    currentLevel: null,
    isDebugMode: false,
    debugDay: null,
    debugHour: null,
    appTitle: '¿DEBERÍAS DESPLEGAR HOY?',
    levelConfiguration: this.parseLevelConfiguration(
      deployConfigRaw as readonly RawDayConfig[],
    ),
  });

  private readonly destroy$ = new Subject<void>();
  private readonly timeInterval$ = interval(60_000);

  public readonly state = this.stateSignal.asReadonly();

  private readonly countries: readonly Country[] = [
    { code: 'CO', name: 'Colombia', timezone: 'America/Bogota', language: 'es' },
    { code: 'ES', name: 'España', timezone: 'Europe/Madrid', language: 'es' },
    { code: 'MX', name: 'México', timezone: 'America/Mexico_City', language: 'es' },
    { code: 'AR', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', language: 'es' },
    { code: 'PE', name: 'Perú', timezone: 'America/Lima', language: 'es' },
    { code: 'CL', name: 'Chile', timezone: 'America/Santiago', language: 'es' },
    { code: 'US', name: 'Estados Unidos', timezone: 'America/New_York', language: 'en' },
    { code: 'BR', name: 'Brasil', timezone: 'America/Sao_Paulo', language: 'pt' },
  ];

  private readonly timezones: readonly Timezone[] = [
    { value: 'UTC', label: 'UTC', offset: 'UTC+0' },
    { value: 'Europe/Madrid', label: 'Madrid', offset: 'UTC+1/+2' },
    { value: 'America/Mexico_City', label: 'Ciudad de México', offset: 'UTC-6/-5' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', offset: 'UTC-3' },
    { value: 'America/Bogota', label: 'Bogotá', offset: 'UTC-5' },
    { value: 'America/Lima', label: 'Lima', offset: 'UTC-5' },
    { value: 'America/Santiago', label: 'Santiago', offset: 'UTC-3/-4' },
    { value: 'America/New_York', label: 'Nueva York', offset: 'UTC-5/-4' },
    { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'UTC-3/-2' },
    { value: 'Europe/London', label: 'Londres', offset: 'UTC+0/+1' },
    { value: 'Europe/Berlin', label: 'Berlín', offset: 'UTC+1/+2' },
    { value: 'Europe/Paris', label: 'París', offset: 'UTC+1/+2' },
  ];

  private readonly responseLevels: readonly ResponseLevel[] = [
    {
      level: DeployLevel.YES,
      emoji: '🟢',
      backgroundColor: '#4caf50',
      textColor: '#ffffff',
      message: '¡SÍ!',
      statusColor: '#16a249',
      cardBackgroundColor: 'hsl(142, 76%, 36%, 0.1)',
      cardBorderColor: 'hsl(142, 76%, 36%, 0.3)',
      glowColor: 'hsl(142, 76%, 36%, 0.5)',
    },
    {
      level: DeployLevel.CAUTION,
      emoji: '🟡',
      backgroundColor: '#ff9800',
      textColor: '#ffffff',
      message: 'SÍ... PERO CUIDADO!',
      statusColor: '#e7b008',
      cardBackgroundColor: 'hsl(45, 93%, 47%, 0.1)',
      cardBorderColor: 'hsl(45, 93%, 47%, 0.3)',
      glowColor: 'hsl(45, 93%, 47%, 0.5)',
    },
    {
      level: DeployLevel.NO,
      emoji: '🔴',
      backgroundColor: '#f44336',
      textColor: '#ffffff',
      message: '¡NO!',
      statusColor: '#ef4343',
      cardBackgroundColor: 'hsl(0, 84%, 60%, 0.1)',
      cardBorderColor: 'hsl(0, 84%, 60%, 0.3)',
      glowColor: 'hsl(0, 84%, 60%, 0.5)',
    },
    {
      level: DeployLevel.HELL_NO,
      emoji: '🚫',
      backgroundColor: '#d32f2f',
      textColor: '#ffffff',
      message: '¡DEFINITIVAMENTE NO!',
      statusColor: '#931f1f',
      cardBackgroundColor: 'hsl(0, 65%, 35%, 0.1)',
      cardBorderColor: 'hsl(0, 65%, 35%, 0.3)',
      glowColor: 'hsl(0, 65%, 35%, 0.5)',
    },
  ];

  private readonly titles: Readonly<Record<string, string>> = {
    es: '¿DEBERÍAS DESPLEGAR HOY?',
    en: 'SHOULD YOU DEPLOY TODAY?',
    pt: 'VOCÊ DEVERIA FAZER DEPLOY HOJE?',
  };

  private readonly messages: Readonly<Record<string, Messages>> = {
    'es-AR': esArMessages as Messages,
    'es-CL': esClMessages as Messages,
    'es-CO': esCoMessages as Messages,
    'es-ES': esEsMessages as Messages,
    es: esMessages as Messages,
    en: enMessages as Messages,
    pt: ptMessages as Messages,
  };

  constructor() {
    // Defer client-side initialization until after the first render
    // (post-hydration). The server transferState would otherwise
    // overwrite any state set here.
    afterNextRender(() => {
      this.checkDebugMode();
      this.startTimeUpdates();
      this.detectLocation();
    });
  }

  public getCountries(): readonly Country[] {
    return this.countries;
  }

  public getTimezones(): readonly Timezone[] {
    return this.timezones;
  }

  public getDebugDays(): readonly { readonly value: number; readonly label: string }[] {
    return [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Lunes' },
      { value: 2, label: 'Martes' },
      { value: 3, label: 'Miércoles' },
      { value: 4, label: 'Jueves' },
      { value: 5, label: 'Viernes' },
      { value: 6, label: 'Sábado' },
    ];
  }

  public getDebugHours(): readonly { readonly value: number; readonly label: string }[] {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: `${i.toString().padStart(2, '0')}:00`,
    }));
  }

  public detectLocation(): void {
    this.stateSignal.update((state) => ({ ...state, isLoading: true, error: null }));

    this.detectCountryByIP().subscribe({
      next: (detectedCountry) => {
        const country = detectedCountry ?? this.findDefaultCountry();
        this.stateSignal.update((state) => ({ ...state, isLoading: false }));
        this.selectCountry(country);
      },
      error: () => {
        const defaultCountry = this.findDefaultCountry();
        this.stateSignal.update((state) => ({ ...state, isLoading: false }));
        this.selectCountry(defaultCountry);
      },
    });
  }

  public selectCountry(country: Country | null): void {
    this.stateSignal.update((state) => ({
      ...state,
      selectedCountry: country,
      selectedTimezone: country ? this.findTimezoneForCountry(country) : null,
    }));

    if (country) {
      this.updateAppTitle(country.language);
      this.generateResponse();
    }
  }

  public selectTimezone(timezone: Timezone | null): void {
    this.stateSignal.update((state) => ({ ...state, selectedTimezone: timezone }));

    const country = this.stateSignal().selectedCountry;
    if (timezone && country) {
      this.generateResponse();
    }
  }

  public refreshResponse(): void {
    this.generateResponse();
  }

  public setDebugDateTime(day: number | null, hour: number | null): void {
    this.stateSignal.update((state) => ({
      ...state,
      isDebugMode: true,
      debugDay: day,
      debugHour: hour,
    }));
    this.generateResponse();
  }

  public destroyTimeUpdates(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private findDefaultCountry(): Country {
    return this.countries.find((c) => c.code === 'CO') ?? this.countries[0];
  }

  private startTimeUpdates(): void {
    this.timeInterval$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateCurrentTime();
    });
  }

  private updateCurrentTime(): void {
    const currentState = this.stateSignal();
    if (!currentState.selectedCountry || !currentState.selectedTimezone) {
      return;
    }
    this.stateSignal.update((state) => ({ ...state, currentTime: new Date() }));
  }

  private parseLevelConfiguration(raw: readonly RawDayConfig[]): LevelConfiguration {
    return raw.map(
      (day): DayConfiguration => ({
        dayOfWeek: day.dayOfWeek,
        ranges: day.ranges.map(
          (range): TimeRange => ({
            startHour: range.startHour,
            endHour: range.endHour,
            level: this.mapStringToDeployLevel(range.level),
          }),
        ),
      }),
    );
  }

  private mapStringToDeployLevel(level: string): DeployLevel {
    switch (level) {
      case 'yes':
        return DeployLevel.YES;
      case 'caution':
        return DeployLevel.CAUTION;
      case 'no':
        return DeployLevel.NO;
      case 'hell-no':
        return DeployLevel.HELL_NO;
      default:
        return DeployLevel.CAUTION;
    }
  }

  private checkDebugMode(): void {
    const isDebugMode = new URLSearchParams(this.locationSearch).get('debug') === 'true';
    this.stateSignal.update((state) => ({ ...state, isDebugMode }));
  }

  private updateAppTitle(language: string): void {
    this.stateSignal.update((state) => ({
      ...state,
      appTitle: this.titles[language] ?? this.titles['es']!,
    }));
  }

  private detectCountryByIP(): Observable<Country | null> {
    return this.http.get<IpApiResponse>('https://ipapi.co/json/').pipe(
      map((response) => {
        const countryCode = response.country_code;
        if (countryCode) {
          const detected = this.countries.find((c) => c.code === countryCode);
          if (detected) return detected;
        }

        const regionCode = response.region_code;
        if (regionCode) {
          const fallback = this.countries.find((c) => c.code === regionCode);
          if (fallback) return fallback;
        }

        return null;
      }),
      catchError(() => of(null)),
    );
  }

  private findTimezoneForCountry(country: Country): Timezone | null {
    return this.timezones.find((tz) => tz.value === country.timezone) ?? null;
  }

  private generateResponse(): void {
    const currentState = this.stateSignal();
    if (!currentState.selectedCountry || !currentState.selectedTimezone) {
      return;
    }

    this.stateSignal.update((state) => ({ ...state, isLoading: true, error: null }));

    const currentTime = new Date();
    try {
      const response = this.createResponse(
        currentTime,
        currentState.selectedCountry,
        currentState.selectedTimezone,
      );
      this.stateSignal.update((state) => ({
        ...state,
        isLoading: false,
        currentTime,
        currentResponse: response,
        currentLevel: response.level,
      }));
    } catch {
      this.stateSignal.update((state) => ({
        ...state,
        isLoading: false,
        error: 'Error al generar respuesta',
      }));
    }
  }

  private createResponse(
    currentTime: Date,
    country: Country,
    timezone: Timezone,
  ): DeployResponse {
    const currentState = this.stateSignal();

    const dayOfWeek =
      currentState.isDebugMode && currentState.debugDay !== null
        ? currentState.debugDay
        : currentTime.getDay();

    const hour =
      currentState.isDebugMode && currentState.debugHour !== null
        ? currentState.debugHour
        : currentTime.getHours();

    const minute = currentTime.getMinutes();

    const level = this.determineLevel(dayOfWeek, hour);
    const message = this.generateMessage(level, country);

    return {
      message,
      level,
      timestamp: currentTime,
      context: {
        dayOfWeek,
        hour,
        minute,
        timezone: timezone.value,
        country: country.code,
      },
    };
  }

  private determineLevel(dayOfWeek: number, hour: number): ResponseLevel {
    const levelConfig = this.stateSignal().levelConfiguration;
    const fallback = this.responseLevels.find((l) => l.level === DeployLevel.CAUTION)!;

    if (!levelConfig) {
      return fallback;
    }

    for (const config of levelConfig) {
      if (!config.dayOfWeek.includes(dayOfWeek)) continue;
      for (const range of config.ranges) {
        if (hour >= range.startHour && hour <= range.endHour) {
          return this.responseLevels.find((l) => l.level === range.level) ?? fallback;
        }
      }
    }

    return fallback;
  }

  private generateMessage(level: ResponseLevel, country: Country): string {
    const messages =
      this.messages[`${country.language}-${country.code}`] ??
      this.messages[country.language] ??
      this.messages['es']!;

    const arr = messages[level.level] ?? messages[DeployLevel.CAUTION];
    if (!arr?.length) return 'No hay mensajes configurados para este nivel.';

    return this.getRandomMessage(arr).toUpperCase();
  }

  private getRandomMessage(messages: readonly string[]): string {
    return messages[Math.floor(Math.random() * messages.length)]!;
  }
}
