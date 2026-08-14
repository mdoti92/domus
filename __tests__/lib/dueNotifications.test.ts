import {
  getDueNotificationsForUser,
  DueNotificationEvent,
} from '../../lib/dueNotifications';
import { RecurrenceConfig } from '../../lib/eventNotificationSchedule';

const dateConfig = (recurrence_date: string): RecurrenceConfig => ({
  enabled: true,
  recurrence_type: 'date',
  recurrence_date,
  recurrence_interval_value: null,
  recurrence_interval_unit: null,
});

const makeEvent = (overrides: Partial<DueNotificationEvent> = {}): DueNotificationEvent => ({
  eventId: 'event-1',
  eventDate: '2026-01-01T00:00:00+00:00',
  assetName: 'Piscina',
  config: dateConfig('2026-06-25T00:00:00+00:00'),
  notifyAllHousehold: true,
  reminders: [{ offset_value: 1, offset_unit: 'day' }],
  recipientMemberIds: [],
  ...overrides,
});

const now = new Date('2026-06-25T00:00:00+00:00');

describe('getDueNotificationsForUser', () => {
  it('returns an empty list when there are no due reminders (CA5)', () => {
    const events = [makeEvent({ config: dateConfig('2027-01-01T00:00:00+00:00') })];
    expect(getDueNotificationsForUser(events, 'member-1', [], now)).toEqual([]);
  });

  it('includes the reminder when notifyAllHousehold=true, regardless of who the user is (CA6)', () => {
    const events = [makeEvent({ notifyAllHousehold: true, recipientMemberIds: [] })];
    const result = getDueNotificationsForUser(events, 'member-1', [], now);
    expect(result).toHaveLength(1);
    expect(result[0].assetName).toBe('Piscina');
  });

  it('includes the reminder when the user is among the specific recipients (CA6)', () => {
    const events = [makeEvent({ notifyAllHousehold: false, recipientMemberIds: ['member-1', 'member-2'] })];
    const result = getDueNotificationsForUser(events, 'member-1', [], now);
    expect(result).toHaveLength(1);
  });

  it('excludes the reminder when the user is not among the specific recipients (CA6)', () => {
    const events = [makeEvent({ notifyAllHousehold: false, recipientMemberIds: ['member-2'] })];
    const result = getDueNotificationsForUser(events, 'member-1', [], now);
    expect(result).toEqual([]);
  });

  it('excludes a reminder the user already dismissed (CA4)', () => {
    const events = [makeEvent({ eventId: 'event-1', reminders: [{ offset_value: 1, offset_unit: 'day' }] })];
    const dismissed = [{ eventId: 'event-1', offset_value: 1, offset_unit: 'day' as const }];
    expect(getDueNotificationsForUser(events, 'member-1', dismissed, now)).toEqual([]);
  });

  it('keeps other reminders of the same event that were not dismissed', () => {
    const events = [
      makeEvent({
        eventId: 'event-1',
        reminders: [
          { offset_value: 1, offset_unit: 'day' },
          { offset_value: 1, offset_unit: 'week' },
        ],
      }),
    ];
    const dismissed = [{ eventId: 'event-1', offset_value: 1, offset_unit: 'day' as const }];

    const result = getDueNotificationsForUser(events, 'member-1', dismissed, now);

    expect(result).toHaveLength(1);
    expect(result[0].offset_unit).toBe('week');
  });

  it('returns items from multiple events, not just the first', () => {
    const events = [
      makeEvent({ eventId: 'event-1', assetName: 'Piscina' }),
      makeEvent({ eventId: 'event-2', assetName: 'Auto', config: dateConfig('2026-06-24T00:00:00+00:00') }),
    ];

    const result = getDueNotificationsForUser(events, 'member-1', [], now);

    expect(result.map((r) => r.assetName)).toEqual(['Piscina', 'Auto']);
  });

  it('includes the eventId, eventDate and nextOccurrence for navigation and display', () => {
    const events = [makeEvent({ eventId: 'event-42', eventDate: '2026-01-01T00:00:00+00:00' })];
    const result = getDueNotificationsForUser(events, 'member-1', [], now);

    expect(result[0].eventId).toBe('event-42');
    expect(result[0].eventDate).toBe('2026-01-01T00:00:00+00:00');
    expect(result[0].nextOccurrence).toEqual(new Date('2026-06-25T00:00:00+00:00'));
  });

  it('includes dueAt: the exact moment the reminder became due (nextOccurrence - offset)', () => {
    const events = [
      makeEvent({
        config: dateConfig('2026-06-25T00:00:00+00:00'),
        reminders: [{ offset_value: 1, offset_unit: 'day' }],
      }),
    ];

    const result = getDueNotificationsForUser(events, 'member-1', [], now);

    expect(result[0].dueAt).toEqual(new Date('2026-06-24T00:00:00+00:00'));
  });
});
