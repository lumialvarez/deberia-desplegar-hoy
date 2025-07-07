export enum DeployLevel {
  YES = 'yes',
  CAUTION = 'caution',
  NO = 'no',
  HELL_NO = 'hell-no'
}

export interface ResponseLevel {
  level: DeployLevel;
  emoji: string;
  backgroundColor: string;
  textColor: string;
  message: string;
  statusColor: string;
  cardBackgroundColor: string;
  cardBorderColor: string;
  glowColor: string;
}

export interface DeployResponse {
  message: string;
  level: ResponseLevel;
  timestamp: Date;
  context: {
    dayOfWeek: number;
    hour: number;
    minute: number;
    timezone: string;
    country: string;
  };
}

export interface ResponseData {
  [key: string]: {
    [key: string]: string[];
  };
}

export interface TimeRange {
  startHour: number;
  endHour: number;
  level: DeployLevel;
}

export interface DayConfiguration {
  dayOfWeek: number[];
  ranges: TimeRange[];
}

export type LevelConfiguration = DayConfiguration[]; 