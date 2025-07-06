export interface ResponseLevel {
  level: 'success' | 'warning' | 'error' | 'forbidden';
  emoji: string;
  backgroundColor: string;
  textColor: string;
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