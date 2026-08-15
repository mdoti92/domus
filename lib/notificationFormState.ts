import {
  EventNotificationConfig,
  EventNotificationRecipient,
  EventNotificationReminder,
  NotificationTimeUnit,
  RecurrenceType,
} from '../types';
import { SaveEventNotificationConfigInput } from '../hooks/useSaveEventNotificationConfig';

export interface ReminderFormRow {
  id: string;
  value: string;
  unit: NotificationTimeUnit;
}

export interface NotificationFormState {
  enabled: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDate: string;
  intervalValue: string;
  intervalUnit: NotificationTimeUnit;
  reminders: ReminderFormRow[];
  notifyAllHousehold: boolean;
  recipientIds: string[];
}

let reminderIdSeq = 0;

export function createReminderFormRow(overrides: Partial<Omit<ReminderFormRow, 'id'>> = {}): ReminderFormRow {
  reminderIdSeq += 1;
  return {
    id: `reminder-${Date.now()}-${reminderIdSeq}`,
    value: '1',
    unit: 'day',
    ...overrides,
  };
}

export function getPositiveNumberError(value: string): string | null {
  const parsed = Number(value);
  if (!value.trim() || Number.isNaN(parsed) || parsed <= 0) {
    return 'Ingresá un valor mayor a 0';
  }
  return null;
}

export function createDefaultNotificationFormState(): NotificationFormState {
  return {
    enabled: false,
    recurrenceType: 'date',
    recurrenceDate: '',
    intervalValue: '1',
    intervalUnit: 'week',
    reminders: [],
    notifyAllHousehold: true,
    recipientIds: [],
  };
}

export function validateNotificationFormState(state: NotificationFormState): string | null {
  if (!state.enabled) return null;

  if (state.recurrenceType === 'date') {
    if (!state.recurrenceDate.trim()) return 'Ingresá la fecha de la próxima ocurrencia';
  } else if (getPositiveNumberError(state.intervalValue)) {
    return 'Ingresá una cantidad válida para el intervalo';
  }

  if (state.reminders.some((r) => getPositiveNumberError(r.value))) {
    return 'Revisá los valores de los recordatorios';
  }

  return null;
}

export function toSaveEventNotificationConfigInput(
  state: NotificationFormState
): SaveEventNotificationConfigInput {
  return {
    enabled: state.enabled,
    recurrence_type: state.recurrenceType,
    recurrence_date: state.recurrenceType === 'date' ? state.recurrenceDate : null,
    recurrence_interval_value: state.recurrenceType === 'interval' ? Number(state.intervalValue) : null,
    recurrence_interval_unit: state.recurrenceType === 'interval' ? state.intervalUnit : null,
    notify_all_household: state.notifyAllHousehold,
    reminders: state.reminders.map((r) => ({ offset_value: Number(r.value), offset_unit: r.unit })),
    recipient_household_member_ids: state.notifyAllHousehold ? [] : state.recipientIds,
  };
}

export function fromEventNotificationConfig(
  config: EventNotificationConfig | null,
  reminders: EventNotificationReminder[],
  recipients: EventNotificationRecipient[]
): NotificationFormState {
  if (!config) return createDefaultNotificationFormState();

  return {
    enabled: config.enabled,
    recurrenceType: config.recurrence_type ?? 'date',
    recurrenceDate: config.recurrence_date ?? '',
    intervalValue: config.recurrence_interval_value != null ? String(config.recurrence_interval_value) : '1',
    intervalUnit: config.recurrence_interval_unit ?? 'week',
    reminders: reminders.map((r) => ({ id: r.id, value: String(r.offset_value), unit: r.offset_unit })),
    notifyAllHousehold: config.notify_all_household,
    recipientIds: recipients.map((r) => r.household_member_id),
  };
}
