export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
}

export const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_IN_GRID = 6;
const DAYS_IN_WEEK = 7;

export function getCalendarMonthGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, month, 1 - mondayOffset));

  const days: CalendarDay[] = [];
  for (let i = 0; i < WEEKS_IN_GRID * DAYS_IN_WEEK; i++) {
    const date = new Date(gridStart.getTime() + i * DAY_MS);
    days.push({ date, inCurrentMonth: date.getUTCMonth() === month });
  }
  return days;
}

export function chunkIntoWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += DAYS_IN_WEEK) {
    weeks.push(days.slice(i, i + DAYS_IN_WEEK));
  }
  return weeks;
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
