import { getMarkedDates } from '../../lib/calendarActivity';
import { RecurrenceConfig } from '../../lib/eventNotificationSchedule';

const disabledConfig: RecurrenceConfig = {
  enabled: false,
  recurrence_type: null,
  recurrence_date: null,
  recurrence_interval_value: null,
  recurrence_interval_unit: null,
};

describe('getMarkedDates', () => {
  it('marks the date of a registered event (CA1)', () => {
    const marked = getMarkedDates(['2026-08-20T00:00:00+00:00'], []);
    expect(marked.has('2026-08-20')).toBe(true);
  });

  it('marks the next occurrence of an enabled recurring event, even without a registered event that day (CA2)', () => {
    const config: RecurrenceConfig = {
      enabled: true,
      recurrence_type: 'date',
      recurrence_date: '2026-09-01T00:00:00+00:00',
      recurrence_interval_value: null,
      recurrence_interval_unit: null,
    };

    const marked = getMarkedDates([], [{ date: '2026-08-01T00:00:00+00:00', config }]);

    expect(marked.has('2026-09-01')).toBe(true);
    expect(marked.size).toBe(1);
  });

  it('does not mark anything for a disabled recurrence config', () => {
    const marked = getMarkedDates([], [{ date: '2026-08-01T00:00:00+00:00', config: disabledConfig }]);
    expect(marked.size).toBe(0);
  });

  it('deduplicates when an event date and a recurrence next-occurrence land on the same day', () => {
    const config: RecurrenceConfig = {
      enabled: true,
      recurrence_type: 'date',
      recurrence_date: '2026-08-20T00:00:00+00:00',
      recurrence_interval_value: null,
      recurrence_interval_unit: null,
    };

    const marked = getMarkedDates(
      ['2026-08-20T00:00:00+00:00'],
      [{ date: '2026-08-01T00:00:00+00:00', config }]
    );

    expect(marked.size).toBe(1);
    expect(marked.has('2026-08-20')).toBe(true);
  });

  it('returns an empty set when there is no activity (CA5)', () => {
    expect(getMarkedDates([], []).size).toBe(0);
  });
});
