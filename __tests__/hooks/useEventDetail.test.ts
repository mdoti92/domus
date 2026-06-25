import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useEventDetail } from '../../hooks/useEventDetail';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const singleMock = jest.fn();
const eqMock = jest.fn();
const selectMock = jest.fn();

const makeChain = (result: { data: unknown; error: unknown }) => ({
  select: selectMock.mockReturnValue({
    eq: eqMock.mockReturnValue({
      single: singleMock.mockResolvedValue(result),
    }),
  }),
});

const mockEvent = {
  id: 'event-1',
  asset_id: 'asset-1',
  date: '2026-06-25',
  notes: 'Test notes',
  status: 'done' as const,
  created_at: '2026-06-25T10:00:00Z',
  updated_at: '2026-06-25T10:00:00Z',
  event_parameter_values: [
    { id: 'pv-1', event_id: 'event-1', parameter_name: 'ph', parameter_value: '7.2', parameter_type: 'number', created_at: '2026-06-25T10:00:00Z' },
  ],
};

describe('useEventDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading is true initially', () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeChain({ data: mockEvent, error: null }));
    const { result } = renderHook(() => useEventDetail('event-1'));
    expect(result.current.loading).toBe(true);
  });

  it('event is null initially', () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeChain({ data: mockEvent, error: null }));
    const { result } = renderHook(() => useEventDetail('event-1'));
    expect(result.current.event).toBeNull();
  });

  it('fetches event with parameter values', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeChain({ data: mockEvent, error: null }));
    const { result } = renderHook(() => useEventDetail('event-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(supabase.from).toHaveBeenCalledWith('events');
    expect(selectMock).toHaveBeenCalledWith('*, event_parameter_values(*)');
    expect(eqMock).toHaveBeenCalledWith('id', 'event-1');
    expect(result.current.event).toEqual(mockEvent);
  });

  it('loading is false after fetch', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeChain({ data: mockEvent, error: null }));
    const { result } = renderHook(() => useEventDetail('event-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('sets error when fetch fails', async () => {
    const dbError = { message: 'Not found', code: '404' };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeChain({ data: null, error: dbError }));
    const { result } = renderHook(() => useEventDetail('event-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toEqual(dbError);
    expect(result.current.event).toBeNull();
  });

  it('refetch re-queries supabase', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeChain({ data: mockEvent, error: null }))
      .mockReturnValueOnce(makeChain({ data: mockEvent, error: null }));
    const { result } = renderHook(() => useEventDetail('event-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.refetch(); });

    expect(supabase.from).toHaveBeenCalledTimes(2);
  });
});
