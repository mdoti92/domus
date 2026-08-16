import { getDayItems, EventActivityRecord } from '../../lib/calendarDayActivity';
import { RecurrenceConfig } from '../../lib/eventNotificationSchedule';

const disabledConfig: RecurrenceConfig = {
  enabled: false,
  recurrence_type: null,
  recurrence_date: null,
  recurrence_interval_value: null,
  recurrence_interval_unit: null,
};

const enabledDateConfig = (recurrenceDate: string): RecurrenceConfig => ({
  enabled: true,
  recurrence_type: 'date',
  recurrence_date: recurrenceDate,
  recurrence_interval_value: null,
  recurrence_interval_unit: null,
});

describe('getDayItems', () => {
  it('includes a registered event that falls on the given day, with its status (CA1)', () => {
    const records: EventActivityRecord[] = [
      { id: 'ev-1', date: '2026-08-20T00:00:00+00:00', assetId: 'asset-1', assetName: 'Piscina', status: 'pending', config: null },
    ];

    const items = getDayItems('2026-08-20', records);

    expect(items).toEqual([
      { type: 'event', eventId: 'ev-1', assetId: 'asset-1', assetName: 'Piscina', status: 'pending' },
    ]);
  });

  it('includes the next occurrence of an enabled recurring event on its day, without an event id (CA1/CA3)', () => {
    const records: EventActivityRecord[] = [
      {
        id: 'ev-1',
        date: '2026-08-01T00:00:00+00:00',
        assetId: 'asset-1',
        assetName: 'Piscina',
        status: 'pending',
        config: enabledDateConfig('2026-09-15T00:00:00+00:00'),
      },
    ];

    const items = getDayItems('2026-09-15', records);

    expect(items).toEqual([{ type: 'next_occurrence', assetId: 'asset-1', assetName: 'Piscina' }]);
  });

  it('ignores a disabled recurrence config', () => {
    const records: EventActivityRecord[] = [
      { id: 'ev-1', date: '2026-08-01T00:00:00+00:00', assetId: 'asset-1', assetName: 'Piscina', status: 'pending', config: disabledConfig },
    ];

    expect(getDayItems('2026-09-15', records)).toEqual([]);
  });

  it('returns an empty list for a day with no activity (CA4)', () => {
    const records: EventActivityRecord[] = [
      { id: 'ev-1', date: '2026-08-20T00:00:00+00:00', assetId: 'asset-1', assetName: 'Piscina', status: 'pending', config: null },
    ];

    expect(getDayItems('2026-08-21', records)).toEqual([]);
  });

  it('returns both an event and a next-occurrence item when both fall on the same day for different events', () => {
    const records: EventActivityRecord[] = [
      { id: 'ev-1', date: '2026-08-20T00:00:00+00:00', assetId: 'asset-1', assetName: 'Piscina', status: 'done', config: null },
      {
        id: 'ev-2',
        date: '2026-08-01T00:00:00+00:00',
        assetId: 'asset-2',
        assetName: 'Lavarropas',
        status: 'pending',
        config: enabledDateConfig('2026-08-20T00:00:00+00:00'),
      },
    ];

    const items = getDayItems('2026-08-20', records);

    expect(items).toEqual([
      { type: 'event', eventId: 'ev-1', assetId: 'asset-1', assetName: 'Piscina', status: 'done' },
      { type: 'next_occurrence', assetId: 'asset-2', assetName: 'Lavarropas' },
    ]);
  });
});
