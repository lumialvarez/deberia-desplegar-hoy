export interface Country {
  readonly code: string;
  readonly name: string;
  readonly timezone: string;
  readonly language: string;
}

export interface Timezone {
  readonly value: string;
  readonly label: string;
  readonly offset: string;
  readonly country?: string;
}

export interface Location {
  readonly country: Country;
  readonly timezone: Timezone;
  readonly coordinates?: {
    readonly latitude: number;
    readonly longitude: number;
  };
}
