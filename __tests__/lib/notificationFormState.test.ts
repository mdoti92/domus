import {
  createDefaultNotificationFormState,
  createReminderFormRow,
  toSaveEventNotificationConfigInput,
  fromEventNotificationConfig,
  validateNotificationFormState,
  getPositiveNumberError,
  NotificationFormState,
} from '../../lib/notificationFormState';
import { EventNotificationConfig, EventNotificationReminder, EventNotificationRecipient } from '../../types';

describe('createDefaultNotificationFormState', () => {
  it('defaults to disabled, recurrence by date, notify all household, no reminders', () => {
    const state = createDefaultNotificationFormState();

    expect(state.enabled).toBe(false);
    expect(state.recurrenceType).toBe('date');
    expect(state.intervalUnit).toBe('week');
    expect(state.notifyAllHousehold).toBe(true);
    expect(state.reminders).toEqual([]);
    expect(state.recipientIds).toEqual([]);
  });
});

describe('createReminderFormRow', () => {
  it('defaults to value "1" and unit "day"', () => {
    const row = createReminderFormRow();
    expect(row.value).toBe('1');
    expect(row.unit).toBe('day');
    expect(row.id).toBeTruthy();
  });

  it('generates a unique id per call', () => {
    const a = createReminderFormRow();
    const b = createReminderFormRow();
    expect(a.id).not.toBe(b.id);
  });

  it('accepts overrides for value and unit', () => {
    const row = createReminderFormRow({ value: '3', unit: 'week' });
    expect(row.value).toBe('3');
    expect(row.unit).toBe('week');
  });
});

describe('getPositiveNumberError', () => {
  it('returns an error for empty, zero, negative or non-numeric values', () => {
    for (const value of ['', '0', '-3', 'abc']) {
      expect(getPositiveNumberError(value)).not.toBeNull();
    }
  });

  it('returns null for a valid positive number', () => {
    expect(getPositiveNumberError('6')).toBeNull();
  });
});

describe('toSaveEventNotificationConfigInput', () => {
  const baseState: NotificationFormState = {
    enabled: true,
    recurrenceType: 'date',
    recurrenceDate: '2026-12-25T00:00:00+00:00',
    intervalValue: '1',
    intervalUnit: 'week',
    reminders: [],
    notifyAllHousehold: true,
    recipientIds: [],
  };

  it('maps recurrence_type=date, nulling interval fields', () => {
    const result = toSaveEventNotificationConfigInput(baseState);

    expect(result.recurrence_type).toBe('date');
    expect(result.recurrence_date).toBe('2026-12-25T00:00:00+00:00');
    expect(result.recurrence_interval_value).toBeNull();
    expect(result.recurrence_interval_unit).toBeNull();
  });

  it('maps recurrence_type=interval, parsing intervalValue to a number and nulling recurrence_date', () => {
    const result = toSaveEventNotificationConfigInput({
      ...baseState,
      recurrenceType: 'interval',
      intervalValue: '6',
      intervalUnit: 'month',
    });

    expect(result.recurrence_type).toBe('interval');
    expect(result.recurrence_date).toBeNull();
    expect(result.recurrence_interval_value).toBe(6);
    expect(result.recurrence_interval_unit).toBe('month');
  });

  it('parses each reminder row value into a number, dropping the client-side id', () => {
    const reminders = [
      { id: 'a', value: '1', unit: 'week' as const },
      { id: 'b', value: '2', unit: 'day' as const },
    ];

    const result = toSaveEventNotificationConfigInput({ ...baseState, reminders });

    expect(result.reminders).toEqual([
      { offset_value: 1, offset_unit: 'week' },
      { offset_value: 2, offset_unit: 'day' },
    ]);
  });

  it('sends an empty recipient list when notifying the whole household', () => {
    const result = toSaveEventNotificationConfigInput({
      ...baseState,
      notifyAllHousehold: true,
      recipientIds: ['hm-1', 'hm-2'],
    });

    expect(result.notify_all_household).toBe(true);
    expect(result.recipient_household_member_ids).toEqual([]);
  });

  it('passes recipient ids through when notifying specific members', () => {
    const result = toSaveEventNotificationConfigInput({
      ...baseState,
      notifyAllHousehold: false,
      recipientIds: ['hm-1', 'hm-2'],
    });

    expect(result.notify_all_household).toBe(false);
    expect(result.recipient_household_member_ids).toEqual(['hm-1', 'hm-2']);
  });
});

describe('fromEventNotificationConfig', () => {
  const makeConfig = (overrides: Partial<EventNotificationConfig> = {}): EventNotificationConfig => ({
    id: 'config-1',
    event_id: 'event-1',
    enabled: true,
    recurrence_type: 'date',
    recurrence_date: '2026-12-25T00:00:00+00:00',
    recurrence_interval_value: null,
    recurrence_interval_unit: null,
    notify_all_household: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  });

  it('returns the default state when there is no config', () => {
    const result = fromEventNotificationConfig(null, [], []);
    expect(result).toEqual(createDefaultNotificationFormState());
  });

  it('maps a date-recurrence config', () => {
    const result = fromEventNotificationConfig(makeConfig(), [], []);

    expect(result.enabled).toBe(true);
    expect(result.recurrenceType).toBe('date');
    expect(result.recurrenceDate).toBe('2026-12-25T00:00:00+00:00');
  });

  it('maps an interval-recurrence config', () => {
    const config = makeConfig({
      recurrence_type: 'interval',
      recurrence_date: null,
      recurrence_interval_value: 6,
      recurrence_interval_unit: 'month',
    });

    const result = fromEventNotificationConfig(config, [], []);

    expect(result.recurrenceType).toBe('interval');
    expect(result.intervalValue).toBe('6');
    expect(result.intervalUnit).toBe('month');
  });

  it('maps reminders (using the row id from the DB, and the value as a string) and recipients', () => {
    const reminders: EventNotificationReminder[] = [
      { id: 'r1', config_id: 'config-1', offset_value: 1, offset_unit: 'day', created_at: '2026-01-01T00:00:00Z' },
    ];
    const recipients: EventNotificationRecipient[] = [
      { id: 'rc1', config_id: 'config-1', household_member_id: 'hm-1', created_at: '2026-01-01T00:00:00Z' },
    ];

    const result = fromEventNotificationConfig(
      makeConfig({ notify_all_household: false }),
      reminders,
      recipients
    );

    expect(result.reminders).toEqual([{ id: 'r1', value: '1', unit: 'day' }]);
    expect(result.notifyAllHousehold).toBe(false);
    expect(result.recipientIds).toEqual(['hm-1']);
  });
});

describe('validateNotificationFormState', () => {
  it('returns null when notifications are disabled, regardless of other fields', () => {
    const state = { ...createDefaultNotificationFormState(), enabled: false, recurrenceDate: '' };
    expect(validateNotificationFormState(state)).toBeNull();
  });

  it('requires a recurrence date when recurrenceType=date', () => {
    const state: NotificationFormState = {
      ...createDefaultNotificationFormState(),
      enabled: true,
      recurrenceType: 'date',
      recurrenceDate: '',
    };
    expect(validateNotificationFormState(state)).not.toBeNull();
  });

  it('passes when recurrenceType=date has a non-empty date', () => {
    const state: NotificationFormState = {
      ...createDefaultNotificationFormState(),
      enabled: true,
      recurrenceType: 'date',
      recurrenceDate: '2026-12-25T00:00:00+00:00',
    };
    expect(validateNotificationFormState(state)).toBeNull();
  });

  it('requires a positive numeric interval value when recurrenceType=interval', () => {
    const invalidValues = ['', '0', '-3', 'abc'];
    for (const intervalValue of invalidValues) {
      const state: NotificationFormState = {
        ...createDefaultNotificationFormState(),
        enabled: true,
        recurrenceType: 'interval',
        intervalValue,
      };
      expect(validateNotificationFormState(state)).not.toBeNull();
    }
  });

  it('passes when recurrenceType=interval has a valid positive value', () => {
    const state: NotificationFormState = {
      ...createDefaultNotificationFormState(),
      enabled: true,
      recurrenceType: 'interval',
      intervalValue: '6',
    };
    expect(validateNotificationFormState(state)).toBeNull();
  });

  it('requires every reminder row to have a positive numeric value', () => {
    const state: NotificationFormState = {
      ...createDefaultNotificationFormState(),
      enabled: true,
      recurrenceType: 'date',
      recurrenceDate: '2026-12-25T00:00:00+00:00',
      reminders: [
        { id: 'a', value: '1', unit: 'day' },
        { id: 'b', value: '0', unit: 'week' },
      ],
    };
    expect(validateNotificationFormState(state)).not.toBeNull();
  });

  it('passes when all reminder rows have a positive numeric value', () => {
    const state: NotificationFormState = {
      ...createDefaultNotificationFormState(),
      enabled: true,
      recurrenceType: 'date',
      recurrenceDate: '2026-12-25T00:00:00+00:00',
      reminders: [
        { id: 'a', value: '1', unit: 'day' },
        { id: 'b', value: '2', unit: 'week' },
      ],
    };
    expect(validateNotificationFormState(state)).toBeNull();
  });
});
