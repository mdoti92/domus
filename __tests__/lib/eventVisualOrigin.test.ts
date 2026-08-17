import { getEventVisualOrigin } from '../../lib/eventVisualOrigin';
import { DayItem } from '../../lib/calendarDayActivity';

const eventItem = (status: 'pending' | 'done' | 'cancelled'): DayItem => ({
  type: 'event',
  eventId: 'ev-1',
  assetId: 'asset-1',
  assetName: 'Piscina',
  assetCategory: 'Mantenimiento',
  status,
});

const occurrenceItem: DayItem = {
  type: 'next_occurrence',
  assetId: 'asset-1',
  assetName: 'Piscina',
  assetCategory: 'Mantenimiento',
};

const TODAY = '2026-08-15';

describe('getEventVisualOrigin', () => {
  it('returns "direct_log" for a done event dated today or earlier (CA1)', () => {
    expect(getEventVisualOrigin(eventItem('done'), '2026-08-10', TODAY)).toEqual({
      origin: 'direct_log',
      overdue: false,
    });
    expect(getEventVisualOrigin(eventItem('done'), TODAY, TODAY)).toEqual({
      origin: 'direct_log',
      overdue: false,
    });
  });

  it('returns "direct_log" for a cancelled event, regardless of date', () => {
    expect(getEventVisualOrigin(eventItem('cancelled'), '2026-08-20', TODAY)).toEqual({
      origin: 'direct_log',
      overdue: false,
    });
  });

  it('returns "tentative_recurrence" for a next-occurrence item regardless of date (CA2)', () => {
    expect(getEventVisualOrigin(occurrenceItem, '2026-08-10', TODAY)).toEqual({
      origin: 'tentative_recurrence',
      overdue: false,
    });
    expect(getEventVisualOrigin(occurrenceItem, '2026-09-01', TODAY)).toEqual({
      origin: 'tentative_recurrence',
      overdue: false,
    });
  });

  it('returns "scheduled_future" without the overdue flag for a pending event with a future date (CA3)', () => {
    expect(getEventVisualOrigin(eventItem('pending'), '2026-08-20', TODAY)).toEqual({
      origin: 'scheduled_future',
      overdue: false,
    });
  });

  it('treats a pending event dated today as not yet overdue', () => {
    expect(getEventVisualOrigin(eventItem('pending'), TODAY, TODAY)).toEqual({
      origin: 'scheduled_future',
      overdue: false,
    });
  });

  it('keeps "scheduled_future" with the overdue flag when a pending event\'s date has passed, instead of reclassifying it as "direct_log" (CA4)', () => {
    expect(getEventVisualOrigin(eventItem('pending'), '2026-08-10', TODAY)).toEqual({
      origin: 'scheduled_future',
      overdue: true,
    });
  });
});
