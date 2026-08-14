import { NotificationTimeUnit, RecurrenceType } from '../types';
import { DueNotificationEvent } from './dueNotifications';

interface RawReminderRow {
  offset_value: number;
  offset_unit: NotificationTimeUnit;
}

interface RawRecipientRow {
  household_member_id: string;
}

interface RawConfigRow {
  enabled: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_date: string | null;
  recurrence_interval_value: number | null;
  recurrence_interval_unit: NotificationTimeUnit | null;
  notify_all_household: boolean;
  event_notification_reminders: RawReminderRow[];
  event_notification_recipients: RawRecipientRow[];
}

interface RawAssetRow {
  name: string;
}

export interface RawEventRow {
  id: string;
  date: string;
  assets: RawAssetRow | RawAssetRow[] | null;
  event_notification_configs: RawConfigRow | RawConfigRow[] | null;
}

function toSingle<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapDueNotificationRows(rows: RawEventRow[]): DueNotificationEvent[] {
  const events: DueNotificationEvent[] = [];

  for (const row of rows) {
    const config = toSingle(row.event_notification_configs);
    if (!config || !config.enabled) continue;

    const asset = toSingle(row.assets);

    events.push({
      eventId: row.id,
      eventDate: row.date,
      assetName: asset?.name ?? '',
      config: {
        enabled: config.enabled,
        recurrence_type: config.recurrence_type,
        recurrence_date: config.recurrence_date,
        recurrence_interval_value: config.recurrence_interval_value,
        recurrence_interval_unit: config.recurrence_interval_unit,
      },
      notifyAllHousehold: config.notify_all_household,
      reminders: config.event_notification_reminders.map((r) => ({
        offset_value: r.offset_value,
        offset_unit: r.offset_unit,
      })),
      recipientMemberIds: config.event_notification_recipients.map((r) => r.household_member_id),
    });
  }

  return events;
}
