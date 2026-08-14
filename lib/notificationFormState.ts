import {
  EventNotificationConfig,
  EventNotificationRecipient,
  EventNotificationReminder,
  NotificationTimeUnit,
  RecurrenceType,
} from '../types';
import { ReminderInput, SaveEventNotificationConfigInput } from '../hooks/useSaveEventNotificationConfig';

export interface NotificationFormState {
  enabled: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDate: string;
  intervalValue: string;
  intervalUnit: NotificationTimeUnit;
  reminders: ReminderInput[];
  notifyAllHousehold: boolean;
  recipientIds: string[];
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
    return state.recurrenceDate.trim() ? null : 'Ingresá la fecha de la próxima ocurrencia';
  }

  const intervalValue = Number(state.intervalValue);
  if (!state.intervalValue.trim() || Number.isNaN(intervalValue) || intervalValue <= 0) {
    return 'Ingresá una cantidad válida para el intervalo';
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
    reminders: state.reminders,
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
    reminders: reminders.map((r) => ({ offset_value: r.offset_value, offset_unit: r.offset_unit })),
    notifyAllHousehold: config.notify_all_household,
    recipientIds: recipients.map((r) => r.household_member_id),
  };
}
