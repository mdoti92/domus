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

  it('returns the day items for a date with a registered event, including its status (CA1)', async () => {
    mockEventsQuery({
      data: [
        {
          id: 'ev-1',
          date: '2026-08-20T00:00:00+00:00',
          asset_id: 'asset-1',
          status: 'pending',
          assets: { name: 'Piscina' },
          event_notification_configs: null,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.getItemsForDate('2026-08-20')).toEqual([
      { type: 'event', eventId: 'ev-1', assetId: 'asset-1', assetName: 'Piscina', status: 'pending' },
    ]);
  });

  it('returns the next occurrence of an enabled recurring event on its date (CA2)', async () => {
    mockEventsQuery({
      data: [
        {
          id: 'ev-1',
          date: '2026-08-01T00:00:00+00:00',
          asset_id: 'asset-1',
          status: 'pending',
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

    expect(result.current.getItemsForDate('2026-09-15')).toEqual([
      { type: 'next_occurrence', assetId: 'asset-1', assetName: 'Piscina' },
    ]);
  });

  it('normalizes assets and event_notification_configs when Supabase returns them as arrays', async () => {
    mockEventsQuery({
      data: [
        {
          id: 'ev-1',
          date: '2026-08-01T00:00:00+00:00',
          asset_id: 'asset-1',
          status: 'done',
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

    expect(result.current.getItemsForDate('2026-08-01')).toEqual([
      { type: 'event', eventId: 'ev-1', assetId: 'asset-1', assetName: 'Piscina', status: 'done' },
    ]);
    expect(result.current.getItemsForDate('2026-09-15')).toEqual([
      { type: 'next_occurrence', assetId: 'asset-1', assetName: 'Piscina' },
    ]);
  });

  it('returns an empty list for a date with no activity (CA3)', async () => {
    mockEventsQuery({
      data: [
        {
          id: 'ev-1',
          date: '2026-08-20T00:00:00+00:00',
          asset_id: 'asset-1',
          status: 'pending',
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

  it('returns an empty list for every date when there are no events', async () => {
    mockEventsQuery({ data: [], error: null });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.getItemsForDate('2026-08-20')).toEqual([]);
  });

  it('sets an error and returns no items when the query fails', async () => {
    const queryError = { message: 'network error' };
    mockEventsQuery({ data: null, error: queryError });

    const { result } = renderHook(() => useCalendarActivity());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(queryError);
    expect(result.current.getItemsForDate('2026-08-20')).toEqual([]);
  });
});
