export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export interface Alarm {
  id: string;
  time: string; // HH:mm format (24h)
  days: DayOfWeek[];
  enabled: boolean;
  videoUrl: string;
  label: string;
}

export const DAYS_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const FULL_DAYS_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];