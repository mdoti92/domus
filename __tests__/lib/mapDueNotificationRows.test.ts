import { mapDueNotificationRows, RawEventRow } from '../../lib/mapDueNotificationRows';

describe('mapDueNotificationRows', () => {
  it('maps a config returned as a single object (not array)', () => {
    const rows: RawEventRow[] = [
      {
        id: 'event-1',
        date: '2026-01-01T00:00:00+00:00',
        assets: { name: 'Piscina' },
        event_notification_configs: {
          enabled: true,
          recurrence_type: 'date',
          recurrence_date: '2026-06-25T00:00:00+00:00',
          recurrence_interval_value: null,
          recurrence_interval_unit: null,
          notify_all_household: true,
          event_notification_reminders: [{ offset_value: 1, offset_unit: 'day' }],
          event_notification_recipients: [],
        },
      },
    ];

    const result = mapDueNotificationRows(rows);

    expect(result).toEqual([
      {
        eventId: 'event-1',
        eventDate: '2026-01-01T00:00:00+00:00',
        assetName: 'Piscina',
        config: {
          enabled: true,
          recurrence_type: 'date',
          recurrence_date: '2026-06-25T00:00:00+00:00',
          recurrence_interval_value: null,
          recurrence_interval_unit: null,
        },
        notifyAllHousehold: true,
        reminders: [{ offset_value: 1, offset_unit: 'day' }],
        recipientMemberIds: [],
      },
    ]);
  });

  it('maps a config and asset returned as single-element arrays', () => {
    const rows: RawEventRow[] = [
      {
        id: 'event-1',
        date: '2026-01-01T00:00:00+00:00',
        assets: [{ name: 'Piscina' }],
        event_notification_configs: [
          {
            enabled: true,
            recurrence_type: 'interval',
            recurrence_date: null,
            recurrence_interval_value: 6,
            recurrence_interval_unit: 'month',
            notify_all_household: false,
            event_notification_reminders: [],
            event_notification_recipients: [{ household_member_id: 'hm-1' }],
          },
        ],
      },
    ];

    const result = mapDueNotificationRows(rows);

    expect(result[0].assetName).toBe('Piscina');
    expect(result[0].config.recurrence_type).toBe('interval');
    expect(result[0].notifyAllHousehold).toBe(false);
    expect(result[0].recipientMemberIds).toEqual(['hm-1']);
  });

  it('skips events with no notification config', () => {
    const rows: RawEventRow[] = [
      { id: 'event-1', date: '2026-01-01T00:00:00+00:00', assets: { name: 'Piscina' }, event_notification_configs: null },
    ];

    expect(mapDueNotificationRows(rows)).toEqual([]);
  });

  it('skips events whose config is disabled', () => {
    const rows: RawEventRow[] = [
      {
        id: 'event-1',
        date: '2026-01-01T00:00:00+00:00',
        assets: { name: 'Piscina' },
        event_notification_configs: {
          enabled: false,
          recurrence_type: 'date',
          recurrence_date: '2026-06-25T00:00:00+00:00',
          recurrence_interval_value: null,
          recurrence_interval_unit: null,
          notify_all_household: true,
          event_notification_reminders: [],
          event_notification_recipients: [],
        },
      },
    ];

    expect(mapDueNotificationRows(rows)).toEqual([]);
  });
});
