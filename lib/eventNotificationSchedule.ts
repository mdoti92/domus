import { NotificationTimeUnit, RecurrenceType } from '../types';

export interface RecurrenceConfig {
  enabled: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_date: string | null;
  recurrence_interval_value: number | null;
  recurrence_interval_unit: NotificationTimeUnit | null;
}

export interface ReminderOffset {
  offset_value: number;
  offset_unit: NotificationTimeUnit;
}

const MS_PER_UNIT: Record<'hour' | 'day' | 'week', number> = {
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
  week: 1000 * 60 * 60 * 24 * 7,
};

export function addInterval(date: Date, value: number, unit: NotificationTimeUnit): Date {
  if (unit === 'month') {
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + value);
    return result;
  }
  if (unit === 'year') {
    const result = new Date(date);
    result.setUTCFullYear(result.getUTCFullYear() + value);
    return result;
  }
  return new Date(date.getTime() + value * MS_PER_UNIT[unit]);
}

export function calculateNextOccurrence(eventDate: string, config: RecurrenceConfig | null): Date | null {
  if (!config || !config.enabled) return null;

  if (config.recurrence_type === 'date' && config.recurrence_date) {
    return new Date(config.recurrence_date);
  }

  if (
    config.recurrence_type === 'interval' &&
    config.recurrence_interval_value != null &&
    config.recurrence_interval_unit
  ) {
    return addInterval(new Date(eventDate), config.recurrence_interval_value, config.recurrence_interval_unit);
  }

  return null;
}

export function getDueReminders(
  eventDate: string,
  config: RecurrenceConfig | null,
  reminders: ReminderOffset[],
  now: Date = new Date()
): ReminderOffset[] {
  const nextOccurrence = calculateNextOccurrence(eventDate, config);
  if (!nextOccurrence) return [];

  return reminders.filter((reminder) => {
    const dueAt = addInterval(nextOccurrence, -reminder.offset_value, reminder.offset_unit);
    return now.getTime() >= dueAt.getTime();
  });
}
