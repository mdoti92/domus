import { NotificationTimeUnit } from '../types';
import { RecurrenceConfig, ReminderOffset, addInterval, calculateNextOccurrence, getDueReminders } from './eventNotificationSchedule';

export interface DueNotificationEvent {
  eventId: string;
  eventDate: string;
  assetName: string;
  config: RecurrenceConfig;
  notifyAllHousehold: boolean;
  reminders: ReminderOffset[];
  recipientMemberIds: string[];
}

export interface DismissedReminderKey {
  eventId: string;
  offset_value: number;
  offset_unit: NotificationTimeUnit;
}

export interface DueNotificationItem {
  eventId: string;
  assetName: string;
  eventDate: string;
  nextOccurrence: Date;
  dueAt: Date;
  offset_value: number;
  offset_unit: NotificationTimeUnit;
}

function isDismissed(dismissed: DismissedReminderKey[], eventId: string, reminder: ReminderOffset): boolean {
  return dismissed.some(
    (d) => d.eventId === eventId && d.offset_value === reminder.offset_value && d.offset_unit === reminder.offset_unit
  );
}

export function getDueNotificationsForUser(
  events: DueNotificationEvent[],
  currentMemberId: string,
  dismissed: DismissedReminderKey[],
  now: Date = new Date()
): DueNotificationItem[] {
  const result: DueNotificationItem[] = [];

  for (const event of events) {
    const isRecipient = event.notifyAllHousehold || event.recipientMemberIds.includes(currentMemberId);
    if (!isRecipient) continue;

    const dueReminders = getDueReminders(event.eventDate, event.config, event.reminders, now);
    if (dueReminders.length === 0) continue;

    const nextOccurrence = calculateNextOccurrence(event.eventDate, event.config)!;

    for (const reminder of dueReminders) {
      if (isDismissed(dismissed, event.eventId, reminder)) continue;
      result.push({
        eventId: event.eventId,
        assetName: event.assetName,
        eventDate: event.eventDate,
        nextOccurrence,
        dueAt: addInterval(nextOccurrence, -reminder.offset_value, reminder.offset_unit),
        offset_value: reminder.offset_value,
        offset_unit: reminder.offset_unit,
      });
    }
  }

  return result;
}
