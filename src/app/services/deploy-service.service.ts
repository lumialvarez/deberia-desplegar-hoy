import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, catchError, map, switchMap, delay, interval, takeUntil, Subject } from 'rxjs';
import { Country, Timezone } from '../models/location.model';
import { DeployResponse, ResponseLevel, ResponseData, LevelConfiguration, DeployLevel } from '../models/deploy-response.model';
import { AsyncKeyword } from 'typescript';

interface AppState {
  isLoading: boolean;
  error: string | null;
  currentTime: Date | null;
  selectedCountry: Country | null;
  selectedTimezone: Timezone | null;
  currentResponse: DeployResponse | null;
  currentLevel: ResponseLevel | null;
  isDebugMode: boolean;
  debugDay: number | null;
  debugHour: number | null;
  appTitle: string;
  levelConfiguration: LevelConfiguration | null;
}

@Injectable({
  providedIn: 'root'
})
export class DeployService {
  private http = inject(HttpClient);

  // Estado principal usando signals
  private stateSignal = signal<AppState>({
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
    levelConfiguration: null
  });

  // Cache de mensajes por idioma
  private messagesCache: { [lang: string]: any } = {};

  // Manejo del intervalo automático
  private destroy$ = new Subject<void>();
  private timeInterval$ = interval(5000); // 5 segundos

  // Computed signals
  public state = this.stateSignal.asReadonly();

  // Datos estáticos
  private readonly countries: Country[] = [
    { code: 'CO', name: 'Colombia', timezone: 'America/Bogota', language: 'es' },
    { code: 'ES', name: 'España', timezone: 'Europe/Madrid', language: 'es' },
    { code: 'MX', name: 'México', timezone: 'America/Mexico_City', language: 'es' },
    { code: 'AR', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', language: 'es' },
    { code: 'PE', name: 'Perú', timezone: 'America/Lima', language: 'es' },
    { code: 'CL', name: 'Chile', timezone: 'America/Santiago', language: 'es' },
    { code: 'US', name: 'Estados Unidos', timezone: 'America/New_York', language: 'en' },
    { code: 'BR', name: 'Brasil', timezone: 'America/Sao_Paulo', language: 'pt' }
  ];

  private readonly timezones: Timezone[] = [
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
    { value: 'Europe/Paris', label: 'París', offset: 'UTC+1/+2' }
  ];

  private readonly responseLevels: ResponseLevel[] = [
    {
      level: DeployLevel.YES,
      emoji: '🟢',
      backgroundColor: '#4caf50',
      textColor: '#ffffff',
      message: '¡SÍ!',
      statusColor: '#16a249',
      cardBackgroundColor: 'hsl(142, 76%, 36%, 0.1)',
      cardBorderColor: 'hsl(142, 76%, 36%, 0.3)',
      glowColor: 'hsl(142, 76%, 36%, 0.5)'
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
      glowColor: 'hsl(45, 93%, 47%, 0.5)'
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
      glowColor: 'hsl(0, 84%, 60%, 0.5)'
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
      glowColor: 'hsl(0, 65%, 35%, 0.5)'
    }
  ];

  constructor() {
    this.checkDebugMode();
    this.loadLevelConfiguration().subscribe(() => {
      this.initializeApp();
      this.startTimeUpdates();
    });
  }

  // Métodos públicos
  public getCountries(): Country[] {
    return this.countries;
  }

  public getTimezones(): Timezone[] {
    return this.timezones;
  }

  public detectLocation(): void {
    this.stateSignal.update(state => ({ ...state, isLoading: true, error: null }));

    this.detectCountryByIP().subscribe({
      next: (detectedCountry) => {
        const country = detectedCountry || this.countries.find(c => c.code === 'ES') || this.countries[0];

        this.stateSignal.update(state => ({
          ...state,
          isLoading: false
        }));

        this.selectCountry(country);
      },
      error: () => {
        // Fallback a España si falla la detección
        const defaultCountry = this.countries.find(c => c.code === 'ES') || this.countries[0];

        this.stateSignal.update(state => ({
          ...state,
          isLoading: false
        }));

        this.selectCountry(defaultCountry);
      }
    });
  }

  public selectCountry(country: Country | null): void {
    this.stateSignal.update(state => ({
      ...state,
      selectedCountry: country,
      selectedTimezone: country ? this.findTimezoneForCountry(country) : null
    }));

    if (country) {
      this.updateAppTitle(country.language);
      this.loadMessages(country).subscribe(() => {
        this.generateResponse();
      });
    }
  }

  public selectTimezone(timezone: Timezone | null): void {
    this.stateSignal.update(state => ({
      ...state,
      selectedTimezone: timezone
    }));

    const country = this.stateSignal().selectedCountry;
    if (timezone && country) {
      this.loadMessages(country).subscribe(() => {
        this.generateResponse();
      });
    }
  }

  public refreshResponse(): void {
    this.generateResponse();
  }

  public setDebugDateTime(day: number | null, hour: number | null): void {
    this.stateSignal.update(state => ({
      ...state,
      debugDay: day,
      debugHour: hour
    }));

    this.generateResponse();
  }

  public getDebugDays(): { value: number; label: string }[] {
    return [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Lunes' },
      { value: 2, label: 'Martes' },
      { value: 3, label: 'Miércoles' },
      { value: 4, label: 'Jueves' },
      { value: 5, label: 'Viernes' },
      { value: 6, label: 'Sábado' }
    ];
  }

  public getDebugHours(): { value: number; label: string }[] {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: `${i.toString().padStart(2, '0')}:00`
    }));
  }

  public getLevelConfiguration(): LevelConfiguration | null {
    return this.stateSignal().levelConfiguration;
  }

  public destroyTimeUpdates(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startTimeUpdates(): void {
    this.timeInterval$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateCurrentTime();
    });
  }

  private updateCurrentTime(): void {
    const currentState = this.stateSignal();
    if (!currentState.selectedCountry || !currentState.selectedTimezone) {
      return;
    }
    try {
      const currentTime = new Date();

      this.stateSignal.update(state => ({
        ...state,
        currentTime
      }));
    } catch (error) {
      console.error('Error al actualizar el tiempo:', error);
    }
  }

  // Métodos privados
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
        console.warn(`Nivel desconocido: ${level}, usando CAUTION por defecto`);
        return DeployLevel.CAUTION;
    }
  }

  private transformJsonToConfiguration(jsonConfig: any[]): LevelConfiguration {
    return jsonConfig.map(dayConfig => ({
      dayOfWeek: dayConfig.dayOfWeek,
      ranges: dayConfig.ranges.map((range: any) => ({
        startHour: range.startHour,
        endHour: range.endHour,
        level: this.mapStringToDeployLevel(range.level)
      }))
    }));
  }

  private loadLevelConfiguration(): Observable<LevelConfiguration> {
    return this.http.get<any[]>('assets/deploy-config.json').pipe(
      map(jsonConfig => {
        const config = this.transformJsonToConfiguration(jsonConfig);
        this.stateSignal.update(state => ({
          ...state,
          levelConfiguration: config
        }));
        return config;
      }),
      catchError(error => {
        console.error('Error al cargar configuración de niveles:', error);
                 // Configuración por defecto en caso de error
         const defaultConfig: LevelConfiguration = [
           {
             dayOfWeek: [0, 6],
             ranges: [{ startHour: 0, endHour: 23, level: DeployLevel.HELL_NO }]
           },
           {
             dayOfWeek: [1, 2, 3, 4, 5],
             ranges: [{ startHour: 0, endHour: 23, level: DeployLevel.CAUTION }]
           }
         ];

        this.stateSignal.update(state => ({
          ...state,
          levelConfiguration: defaultConfig
        }));

        return of(defaultConfig);
      })
    );
  }
  private initializeApp(): void {
    this.detectLocation();
  }

  private checkDebugMode(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const isDebugMode = urlParams.get('debug') === 'true';

    this.stateSignal.update(state => ({
      ...state,
      isDebugMode
    }));
  }

  private updateAppTitle(language: string): void {
    const titles: { [key: string]: string } = {
      'es': '¿DEBERÍAS DESPLEGAR HOY?',
      'en': 'SHOULD YOU DEPLOY TODAY?',
      'pt': 'VOCÊ DEVERIA FAZER DEPLOY HOJE?'
    };

    this.stateSignal.update(state => ({
      ...state,
      appTitle: titles[language] || titles['es']
    }));
  }

  private detectCountryByIP(): Observable<Country | null> {
    // Usar una API gratuita de geolocalización por IP
    return this.http.get<any>('https://ipapi.co/json/').pipe(
      map(response => {
        const countryCode = response.country_code;
        const detectedCountry = this.countries.find(c => c.code === countryCode);

        if (detectedCountry) {
          console.log(`País detectado: ${detectedCountry.name} (${countryCode})`);
          return detectedCountry;
        }

        // Si no encontramos el país, intentar con el código de región
        const regionCode = response.region_code;
        const fallbackCountry = this.countries.find(c => c.code === regionCode);

        if (fallbackCountry) {
          console.log(`País detectado (fallback): ${fallbackCountry.name} (${regionCode})`);
          return fallbackCountry;
        }

        console.log('No se pudo detectar el país, usando España por defecto');
        return null;
      }),
      catchError(error => {
        console.error('Error al detectar país por IP:', error);
        return of(null);
      })
    );
  }

  private findTimezoneForCountry(country: Country): Timezone | null {
    return this.timezones.find(tz => tz.value === country.timezone) || null;
  }

  private generateResponse(): void {
    const currentState = this.stateSignal();

    if (!currentState.selectedCountry || !currentState.selectedTimezone) {
      return;
    }

    this.stateSignal.update(state => ({ ...state, isLoading: true, error: null }));

    // Simular delay de carga
    setTimeout(() => {
      try {
        const currentTime = new Date();
        const response = this.createResponse(currentTime, currentState.selectedCountry!, currentState.selectedTimezone!);

        this.stateSignal.update(state => ({
          ...state,
          isLoading: false,
          currentTime,
          currentResponse: response,
          currentLevel: response.level
        }));
      } catch (error) {
        this.stateSignal.update(state => ({
          ...state,
          isLoading: false,
          error: 'Error al generar respuesta'
        }));
      }
    }, 1000);
  }

  private createResponse(currentTime: Date, country: Country, timezone: Timezone): DeployResponse {
    const currentState = this.stateSignal();

    // Usar valores de debug si están disponibles
    const dayOfWeek = currentState.isDebugMode && currentState.debugDay !== null
      ? currentState.debugDay
      : currentTime.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    const hour = currentState.isDebugMode && currentState.debugHour !== null
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
        country: country.code
      }
    };
  }

  private determineLevel(dayOfWeek: number, hour: number): ResponseLevel {
    const levelConfig = this.stateSignal().levelConfiguration;

    // Si no hay configuración cargada, usar fallback
    if (!levelConfig) {
      return this.responseLevels.find(l => l.level === DeployLevel.CAUTION)!;
    }

    // Buscar configuración para el día de la semana
    for (const config of levelConfig) {
      if (config.dayOfWeek.includes(dayOfWeek)) {
        // Buscar el rango de horas que coincide
        for (const range of config.ranges) {
          if (hour >= range.startHour && hour <= range.endHour) {
            return this.responseLevels.find(l => l.level === range.level)!;
          }
        }
      }
    }

    // Fallback por defecto
    return this.responseLevels.find(l => l.level === DeployLevel.CAUTION)!;
  }

  private generateMessage(level: ResponseLevel, country: Country): string {
    const messages = this.messagesCache[country.language+country.code] || 
      this.messagesCache[country.language] ||
      this.messagesCache['es'];
    if (!messages) return 'No se encontraron mensajes para este idioma.';

    // Usar el nivel directamente como clave
    const arr = messages[level.level] || messages[DeployLevel.CAUTION] || [];
    if (!arr.length) return 'No hay mensajes configurados para este nivel.';

    return this.getRandomMessage(arr).toUpperCase();
  }

  private getRandomMessage(messages: string[]): string {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  private loadMessages(country: Country): Observable<any> {
    if (this.messagesCache[country.language+country.code]) {
      return of(this.messagesCache[country.language+country.code]);
    }
    const url = `assets/responses/${country.language}.json`;
    const urlCountry = `assets/responses/${country.language}-${country.code}.json`;

    return this.http.get<any>(urlCountry).pipe(
      map(data => {
        this.messagesCache[country.language+country.code] = data;
        return data;
      }),
      catchError(() => {
        if (this.messagesCache[country.language]) {
          return of(this.messagesCache[country.language]);
        }
        return this.http.get<any>(url).pipe(
          map(data => {
            this.messagesCache[country.language] = data;
            return data;
          }),
          catchError(() => {
            // fallback a español si no existe el idioma
            if (country.language !== 'es') {
              return this.loadMessages(this.countries[0]);
            }
            return of({});
          })
        );
      })
    );
  }
}
