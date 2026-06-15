export enum DeployLevel {
  YES = 'yes',
  CAUTION = 'caution',
  NO = 'no',
  HELL_NO = 'hell-no',
}

export interface ResponseLevel {
  readonly level: DeployLevel;
  readonly emoji: string;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly message: string;
  readonly statusColor: string;
  readonly cardBackgroundColor: string;
  readonly cardBorderColor: string;
  readonly glowColor: string;
}

export interface DeployResponse {
  readonly message: string;
  readonly level: ResponseLevel;
  readonly timestamp: Date;
  readonly context: {
    readonly dayOfWeek: number;
    readonly hour: number;
    readonly minute: number;
    readonly timezone: string;
    readonly country: string;
  };
}

export interface TimeRange {
  readonly startHour: number;
  readonly endHour: number;
  readonly level: DeployLevel;
}

export interface DayConfiguration {
  readonly dayOfWeek: readonly number[];
  readonly ranges: readonly TimeRange[];
}

export type LevelConfiguration = readonly DayConfiguration[];

export type Messages = Readonly<Record<DeployLevel, readonly string[]>>;
