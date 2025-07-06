import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, catchError, map, switchMap, delay } from 'rxjs';
import { Country, Timezone } from '../models/location.model';
import { DeployResponse, ResponseLevel, ResponseData } from '../models/deploy-response.model';

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
    appTitle: '¿DEBERÍAS DESPLEGAR HOY?'
  });

  // Cache de mensajes por idioma
  private messagesCache: { [lang: string]: any } = {};

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
      level: 'success',
      emoji: '🟢',
      backgroundColor: '#4caf50',
      textColor: '#ffffff'
    },
    {
      level: 'warning',
      emoji: '🟡',
      backgroundColor: '#ff9800',
      textColor: '#ffffff'
    },
    {
      level: 'error',
      emoji: '🔴',
      backgroundColor: '#f44336',
      textColor: '#ffffff'
    },
    {
      level: 'forbidden',
      emoji: '🌙',
      backgroundColor: '#ff4136',
      textColor: '#ffffff'
    }
  ];

  constructor() {
    this.initializeApp();
    this.checkDebugMode();
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
        const timezone = this.findTimezoneForCountry(country);
        
        this.stateSignal.update(state => ({
          ...state,
          selectedCountry: country,
          selectedTimezone: timezone,
          isLoading: false
        }));

        this.updateAppTitle(country.language);
        this.loadMessages(country.language).subscribe(() => {
          this.generateResponse();
        });
      },
      error: () => {
        // Fallback a España si falla la detección
        const defaultCountry = this.countries.find(c => c.code === 'ES') || this.countries[0];
        const defaultTimezone = this.findTimezoneForCountry(defaultCountry);
        
        this.stateSignal.update(state => ({
          ...state,
          selectedCountry: defaultCountry,
          selectedTimezone: defaultTimezone,
          isLoading: false
        }));

        this.updateAppTitle(defaultCountry.language);
        this.loadMessages(defaultCountry.language).subscribe(() => {
          this.generateResponse();
        });
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
      this.loadMessages(country.language).subscribe(() => {
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
      this.loadMessages(country.language).subscribe(() => {
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
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        value: i,
        label: `${i.toString().padStart(2, '0')}:00`
      });
    }
    return hours;
  }

  // Métodos privados
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
    const message = this.generateMessage(dayOfWeek, hour, country.language);

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
    // Lógica de niveles basada en día y hora
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Fines de semana
      return this.responseLevels.find(l => l.level === 'forbidden')!;
    }

    if (hour >= 18) {
      // Después de las 6 PM
      return this.responseLevels.find(l => l.level === 'error')!;
    }

    if (dayOfWeek === 1 && hour >= 9 && hour <= 12) {
      // Lunes por la mañana
      return this.responseLevels.find(l => l.level === 'success')!;
    }

    if (dayOfWeek === 5 && hour >= 13) {
      // Viernes después del mediodía
      return this.responseLevels.find(l => l.level === 'forbidden')!;
    }

    if (dayOfWeek === 5 && hour >= 9 && hour <= 12) {
      // Viernes por la mañana
      return this.responseLevels.find(l => l.level === 'warning')!;
    }

    // Otros casos
    return this.responseLevels.find(l => l.level === 'warning')!;
  }

  private generateMessage(dayOfWeek: number, hour: number, language: string): string {
    const messages = this.messagesCache[language] || this.messagesCache['es'];
    if (!messages) return 'No se encontraron mensajes para este idioma.';

    // Mapear día y franja horaria a la clave del JSON
    let key = 'default';
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      key = 'weekend';
    } else if (hour >= 18) {
      key = 'afterWork';
    } else if (dayOfWeek === 1 && hour >= 9 && hour < 13) {
      key = 'mondayMorning';
    } else if (dayOfWeek === 1 && hour >= 13) {
      key = 'mondayAfternoon';
    } else if (dayOfWeek === 2 && hour < 13) {
      key = 'tuesdayMorning';
    } else if (dayOfWeek === 2 && hour >= 13) {
      key = 'tuesdayAfternoon';
    } else if (dayOfWeek === 3 && hour < 13) {
      key = 'wednesdayMorning';
    } else if (dayOfWeek === 3 && hour >= 13) {
      key = 'wednesdayAfternoon';
    } else if (dayOfWeek === 4 && hour < 13) {
      key = 'thursdayMorning';
    } else if (dayOfWeek === 4 && hour >= 13) {
      key = 'thursdayAfternoon';
    } else if (dayOfWeek === 5 && hour < 13) {
      key = 'fridayMorning';
    } else if (dayOfWeek === 5 && hour >= 13) {
      key = 'fridayAfternoon';
    }

    const arr = messages[key] || messages['default'] || [];
    if (!arr.length) return 'No hay mensajes configurados para este contexto.';
    return this.getRandomMessage(arr).toUpperCase();
  }

  private getRandomMessage(messages: string[]): string {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  private loadMessages(language: string): Observable<any> {
    if (this.messagesCache[language]) {
      return of(this.messagesCache[language]);
    }
    const url = `assets/responses/${language}.json`;
    return this.http.get<any>(url).pipe(
      map(data => {
        this.messagesCache[language] = data;
        return data;
      }),
      catchError(() => {
        // fallback a español si no existe el idioma
        if (language !== 'es') {
          return this.loadMessages('es');
        }
        return of({});
      })
    );
  }
} 