export interface Country {
  code: string;
  name: string;
  timezone: string;
  language: string;
}

export interface Timezone {
  value: string;
  label: string;
  offset: string;
  country?: string;
}

export interface Location {
  country: Country;
  timezone: Timezone;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
} 