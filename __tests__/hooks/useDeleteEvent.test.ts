import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDeleteEvent } from '../../hooks/useDeleteEvent';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const deleteMock = jest.fn();
const eqMock = jest.fn();

const makeDeleteChain = (result: { error: unknown }) => ({
  delete: deleteMock.mockReturnValue({
    eq: eqMock.mockResolvedValue(result),
  }),
});

describe('useDeleteEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading is false initially', () => {
    const { result } = renderHook(() => useDeleteEvent());
    expect(result.current.loading).toBe(false);
  });

  it('error is null initially', () => {
    const { result } = renderHook(() => useDeleteEvent());
    expect(result.current.error).toBeNull();
  });

  it('calls delete on events table', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: null }));
    const { result } = renderHook(() => useDeleteEvent());

    await act(async () => { await result.current.deleteEvent('event-1'); });

    expect(supabase.from).toHaveBeenCalledWith('events');
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it('filters delete by event id', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: null }));
    const { result } = renderHook(() => useDeleteEvent());

    await act(async () => { await result.current.deleteEvent('event-42'); });

    expect(eqMock).toHaveBeenCalledWith('id', 'event-42');
  });

  it('sets loading to true during deletion and false after', async () => {
    let resolveFn: (v: unknown) => void;
    const pendingPromise = new Promise((resolve) => { resolveFn = resolve; });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue(pendingPromise),
      }),
    });

    const { result } = renderHook(() => useDeleteEvent());

    act(() => { result.current.deleteEvent('event-1'); });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => { resolveFn!({ error: null }); });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('throws and sets error when supabase delete fails', async () => {
    const dbError = { message: 'Delete failed', code: '500' };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: dbError }));

    const { result } = renderHook(() => useDeleteEvent());
    let thrownError: unknown;
    await act(async () => {
      try { await result.current.deleteEvent('event-1'); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
    expect(result.current.loading).toBe(false);
  });
});
