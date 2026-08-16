import { getEventVisualStatus } from '../../lib/eventVisualStatus';
import { DayItem } from '../../lib/calendarDayActivity';

const eventItem = (status: 'pending' | 'done' | 'cancelled'): DayItem => ({
  type: 'event',
  eventId: 'ev-1',
  assetId: 'asset-1',
  assetName: 'Piscina',
  status,
});

const occurrenceItem: DayItem = { type: 'next_occurrence', assetId: 'asset-1', assetName: 'Piscina' };

const TODAY = '2026-08-15';

describe('getEventVisualStatus', () => {
  it('returns "past" for a done event dated today or earlier (CA1)', () => {
    expect(getEventVisualStatus(eventItem('done'), '2026-08-10', TODAY)).toBe('past');
    expect(getEventVisualStatus(eventItem('done'), TODAY, TODAY)).toBe('past');
  });

  it('returns "scheduled" for a pending event with a future date (CA2)', () => {
    expect(getEventVisualStatus(eventItem('pending'), '2026-08-20', TODAY)).toBe('scheduled');
  });

  it('returns "scheduled" for a pending event dated today (not yet overdue)', () => {
    expect(getEventVisualStatus(eventItem('pending'), TODAY, TODAY)).toBe('scheduled');
  });

  it('returns "overdue" for a pending event with a past date (CA3)', () => {
    expect(getEventVisualStatus(eventItem('pending'), '2026-08-10', TODAY)).toBe('overdue');
  });

  it('returns "tentative" for a next-occurrence item regardless of date (CA4)', () => {
    expect(getEventVisualStatus(occurrenceItem, '2026-08-10', TODAY)).toBe('tentative');
    expect(getEventVisualStatus(occurrenceItem, '2026-09-01', TODAY)).toBe('tentative');
  });

  it('returns "past" for a cancelled event', () => {
    expect(getEventVisualStatus(eventItem('cancelled'), '2026-08-20', TODAY)).toBe('past');
  });
});
