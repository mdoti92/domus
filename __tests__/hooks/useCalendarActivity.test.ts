import { renderHook, waitFor } from '@testing-library/react-native';
import { useCalendarActivity } from '../../hooks/useCalendarActivity';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const selectMock = jest.fn();

function mockEventsQuery(result: { data: unknown; error: unknown }) {
  (supabase.from as jest.Mock).mockReturnValue({
    select: selectMock.mockResolvedValue(result),
  });
}

describe('useCalendarActivity', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks dates from registered events (CA1)', async () => {
    mockEventsQuery({
      data: [
        {
          id: 'ev-1',
          date: '2026-08-20T00:00:00+00:00',
          asset_id: 'asset-1',
          assets: { name: 'Piscina' },
          event_notification_configs: null,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.markedDates.has('2026-08-20')).toBe(true);
  });

  it('marks the next occurrence of an enabled recurring event (CA2)', async () => {
    mockEventsQuery({
      data: [
        {
          id: 'ev-1',
          date: '2026-08-01T00:00:00+00:00',
          asset_id: 'asset-1',
          assets: { name: 'Piscina' },
          event_notification_configs: {
            enabled: true,
            recurrence_type: 'date',
            recurrence_date: '2026-09-15T00:00:00+00:00',
            recurrence_interval_value: null,
            recurrence_interval_unit: null,
          },
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.markedDates.has('2026-09-15')).toBe(true);
  });

  it('normalizes assets and event_notification_configs when Supabase returns them as arrays', async () => {
    mockEventsQuery({
      data: [
        {
          id: 'ev-1',
          date: '2026-08-01T00:00:00+00:00',
          asset_id: 'asset-1',
          assets: [{ name: 'Piscina' }],
          event_notification_configs: [
            {
              enabled: true,
              recurrence_type: 'date',
              recurrence_date: '2026-09-15T00:00:00+00:00',
              recurrence_interval_value: null,
              recurrence_interval_unit: null,
            },
          ],
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.markedDates.has('2026-09-15')).toBe(true);
    expect(result.current.getItemsForDate('2026-08-01')).toEqual([
      { type: 'event', eventId: 'ev-1', assetId: 'asset-1', assetName: 'Piscina' },
    ]);
  });

  it('returns an empty set when there are no events (CA5)', async () => {
    mockEventsQuery({ data: [], error: null });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.markedDates.size).toBe(0);
  });

  it('sets an error and an empty set when the query fails', async () => {
    const queryError = { message: 'network error' };
    mockEventsQuery({ data: null, error: queryError });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(queryError);
    expect(result.current.markedDates.size).toBe(0);
  });

  describe('getItemsForDate', () => {
    it('returns the day items for a date with a registered event (DOM-29 CA1)', async () => {
      mockEventsQuery({
        data: [
          {
            id: 'ev-1',
            date: '2026-08-20T00:00:00+00:00',
            asset_id: 'asset-1',
            assets: { name: 'Piscina' },
            event_notification_configs: null,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useCalendarActivity());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.getItemsForDate('2026-08-20')).toEqual([
        { type: 'event', eventId: 'ev-1', assetId: 'asset-1', assetName: 'Piscina' },
      ]);
    });

    it('returns an empty list for a date with no activity (DOM-29 CA4)', async () => {
      mockEventsQuery({
        data: [
          {
            id: 'ev-1',
            date: '2026-08-20T00:00:00+00:00',
            asset_id: 'asset-1',
            assets: { name: 'Piscina' },
            event_notification_configs: null,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useCalendarActivity());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.getItemsForDate('2026-08-21')).toEqual([]);
    });
  });
});
