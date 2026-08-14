import {
  calculateNextOccurrence,
  getDueReminders,
  RecurrenceConfig,
} from '../../lib/eventNotificationSchedule';

const enabledDateConfig = (recurrence_date: string): RecurrenceConfig => ({
  enabled: true,
  recurrence_type: 'date',
  recurrence_date,
  recurrence_interval_value: null,
  recurrence_interval_unit: null,
});

const enabledIntervalConfig = (value: number, unit: RecurrenceConfig['recurrence_interval_unit']): RecurrenceConfig => ({
  enabled: true,
  recurrence_type: 'interval',
  recurrence_date: null,
  recurrence_interval_value: value,
  recurrence_interval_unit: unit,
});

describe('calculateNextOccurrence', () => {
  it('returns the recurrence_date as-is when recurrence_type=date (CA1)', () => {
    const config = enabledDateConfig('2026-12-25T00:00:00+00:00');

    const result = calculateNextOccurrence('2026-01-01T00:00:00+00:00', config);

    expect(result).toEqual(new Date('2026-12-25T00:00:00+00:00'));
  });

  it('adds the interval in months to the event date when recurrence_type=interval (CA2)', () => {
    const config = enabledIntervalConfig(6, 'month');

    const result = calculateNextOccurrence('2026-01-15T00:00:00+00:00', config);

    expect(result).toEqual(new Date('2026-07-15T00:00:00+00:00'));
  });

  it.each([
    ['hour', 3, '2026-01-01T03:00:00+00:00'],
    ['day', 10, '2026-01-11T00:00:00+00:00'],
    ['week', 2, '2026-01-15T00:00:00+00:00'],
    ['year', 1, '2027-01-01T00:00:00+00:00'],
  ] as const)('applies the equivalent logic for unit=%s', (unit, value, expected) => {
    const config = enabledIntervalConfig(value, unit);

    const result = calculateNextOccurrence('2026-01-01T00:00:00+00:00', config);

    expect(result).toEqual(new Date(expected));
  });

  it('returns null when there is no config', () => {
    expect(calculateNextOccurrence('2026-01-01T00:00:00+00:00', null)).toBeNull();
  });

  it('returns null when the config is disabled', () => {
    const config = { ...enabledDateConfig('2026-12-25T00:00:00+00:00'), enabled: false };
    expect(calculateNextOccurrence('2026-01-01T00:00:00+00:00', config)).toBeNull();
  });
});

describe('getDueReminders', () => {
  it('marks a reminder as due when now >= nextOccurrence - offset (CA3)', () => {
    const config = enabledDateConfig('2026-06-25T00:00:00+00:00');
    const reminder = { offset_value: 1, offset_unit: 'day' as const };

    const dueExactlyAtThreshold = getDueReminders(
      '2026-01-01T00:00:00+00:00',
      config,
      [reminder],
      new Date('2026-06-24T00:00:00+00:00')
    );
    expect(dueExactlyAtThreshold).toEqual([reminder]);

    const notYetDue = getDueReminders(
      '2026-01-01T00:00:00+00:00',
      config,
      [reminder],
      new Date('2026-06-23T23:59:59+00:00')
    );
    expect(notYetDue).toEqual([]);
  });

  it('returns every overdue reminder, not just the first (CA4)', () => {
    const config = enabledDateConfig('2026-06-25T00:00:00+00:00');
    const reminders = [
      { offset_value: 1, offset_unit: 'week' as const }, // due at 2026-06-18
      { offset_value: 1, offset_unit: 'day' as const },  // due at 2026-06-24
      { offset_value: 1, offset_unit: 'hour' as const }, // due at 2026-06-24T23:00
    ];

    const result = getDueReminders(
      '2026-01-01T00:00:00+00:00',
      config,
      reminders,
      new Date('2026-06-25T00:00:00+00:00')
    );

    expect(result).toEqual(reminders);
  });

  it('returns no reminders when the event has no active notification (CA5)', () => {
    const reminder = { offset_value: 1, offset_unit: 'day' as const };

    expect(getDueReminders('2026-01-01T00:00:00+00:00', null, [reminder], new Date())).toEqual([]);

    const disabledConfig = { ...enabledDateConfig('2026-06-25T00:00:00+00:00'), enabled: false };
    expect(getDueReminders('2026-01-01T00:00:00+00:00', disabledConfig, [reminder], new Date('2026-12-01T00:00:00+00:00'))).toEqual([]);
  });
});
