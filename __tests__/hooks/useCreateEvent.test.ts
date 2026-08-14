import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCreateEvent, CreateEventInput } from '../../hooks/useCreateEvent';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const insertEventMock = jest.fn();
const insertValuesMock = jest.fn();

const makeEventsChain = (result: { data: { id: string } | null; error: unknown }) => ({
  insert: insertEventMock.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(result),
    }),
  }),
});

const makeValuesChain = (result: { data: null; error: unknown }) => ({
  insert: insertValuesMock.mockResolvedValue(result),
});

const baseInput: CreateEventInput = {
  date: '2026-06-25',
  notes: null,
  parameterValues: [
    { name: 'ph', value: '7.2', type: 'number' },
    { name: 'aspirado', value: true, type: 'boolean' },
  ],
};

describe('useCreateEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading is false initially', () => {
    const { result } = renderHook(() => useCreateEvent());
    expect(result.current.loading).toBe(false);
  });

  it('error is null initially', () => {
    const { result } = renderHook(() => useCreateEvent());
    expect(result.current.error).toBeNull();
  });

  it('inserts event into events table with correct fields', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeEventsChain({ data: { id: 'ev-1' }, error: null }))
      .mockReturnValueOnce(makeValuesChain({ data: null, error: null }));

    const { result } = renderHook(() => useCreateEvent());

    await act(async () => {
      await result.current.createEvent('asset-1', baseInput);
    });

    expect(insertEventMock).toHaveBeenCalledWith({
      asset_id: 'asset-1',
      date: '2026-06-25',
      notes: null,
      status: 'done',
    });
  });

  it('returns the id of the created event', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeEventsChain({ data: { id: 'ev-1' }, error: null }))
      .mockReturnValueOnce(makeValuesChain({ data: null, error: null }));

    const { result } = renderHook(() => useCreateEvent());

    let createdEvent: { id: string } | undefined;
    await act(async () => {
      createdEvent = await result.current.createEvent('asset-1', baseInput);
    });

    expect(createdEvent).toEqual({ id: 'ev-1' });
  });

  it('inserts parameter values with correct mapping', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeEventsChain({ data: { id: 'ev-1' }, error: null }))
      .mockReturnValueOnce(makeValuesChain({ data: null, error: null }));

    const { result } = renderHook(() => useCreateEvent());

    await act(async () => {
      await result.current.createEvent('asset-1', baseInput);
    });

    expect(insertValuesMock).toHaveBeenCalledWith([
      { event_id: 'ev-1', parameter_name: 'ph', parameter_value: '7.2', parameter_type: 'number' },
      { event_id: 'ev-1', parameter_name: 'aspirado', parameter_value: 'true', parameter_type: 'boolean' },
    ]);
  });

  it('converts boolean values to string', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeEventsChain({ data: { id: 'ev-1' }, error: null }))
      .mockReturnValueOnce(makeValuesChain({ data: null, error: null }));

    const { result } = renderHook(() => useCreateEvent());

    await act(async () => {
      await result.current.createEvent('asset-1', {
        date: '2026-06-25',
        notes: null,
        parameterValues: [
          { name: 'hecho', value: false, type: 'boolean' },
        ],
      });
    });

    expect(insertValuesMock).toHaveBeenCalledWith([
      { event_id: 'ev-1', parameter_name: 'hecho', parameter_value: 'false', parameter_type: 'boolean' },
    ]);
  });

  it('skips parameter values insert when parameterValues is empty', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeEventsChain({ data: { id: 'ev-1' }, error: null }));

    const { result } = renderHook(() => useCreateEvent());

    await act(async () => {
      await result.current.createEvent('asset-1', {
        date: '2026-06-25',
        notes: null,
        parameterValues: [],
      });
    });

    expect(insertValuesMock).not.toHaveBeenCalled();
    expect((supabase.from as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('sets loading to true during creation and false after', async () => {
    let resolveFn: (v: unknown) => void;
    const pendingPromise = new Promise((resolve) => { resolveFn = resolve; });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue(pendingPromise),
        }),
      }),
    });

    const { result } = renderHook(() => useCreateEvent());

    act(() => {
      result.current.createEvent('asset-1', { date: '2026-06-25', notes: null, parameterValues: [] });
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveFn!({ data: { id: 'ev-1' }, error: null });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('throws and sets error when event insert fails', async () => {
    const dbError = { message: 'insert failed', code: '500' };
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeEventsChain({ data: null, error: dbError })
    );

    const { result } = renderHook(() => useCreateEvent());

    let thrownError: unknown;
    await act(async () => {
      try { await result.current.createEvent('asset-1', baseInput); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
    expect(result.current.loading).toBe(false);
  });

  it('throws and sets error when values insert fails', async () => {
    const dbError = { message: 'values insert failed', code: '500' };
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeEventsChain({ data: { id: 'ev-1' }, error: null }))
      .mockReturnValueOnce(makeValuesChain({ data: null, error: dbError }));

    const { result } = renderHook(() => useCreateEvent());

    let thrownError: unknown;
    await act(async () => {
      try { await result.current.createEvent('asset-1', baseInput); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
  });
});
