import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUpdateEvent, UpdateEventInput } from '../../hooks/useUpdateEvent';
import { supabase } from '../../lib/supabase';
import * as googleCalendarSync from '../../lib/googleCalendarSync';

jest.mock('../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../../lib/googleCalendarSync', () => ({
  syncEventToGoogleCalendar: jest.fn().mockResolvedValue(undefined),
}));

const syncMock = googleCalendarSync.syncEventToGoogleCalendar as jest.Mock;

const baseInput: UpdateEventInput = {
  date: '2026-06-25',
  notes: 'Updated notes',
  status: 'done',
  parameterValues: [
    { name: 'ph', value: '7.4', type: 'number' },
    { name: 'cloro', value: '1.5', type: 'number' },
  ],
};

function makeUpdateChain(result: { error: unknown }) {
  const eqMock = jest.fn().mockResolvedValue(result);
  const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
  return { update: updateMock, _eq: eqMock };
}

function makeDeleteChain(result: { error: unknown }) {
  const eqMock = jest.fn().mockResolvedValue(result);
  const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
  return { delete: deleteMock, _eq: eqMock };
}

function makeInsertChain(result: { error: unknown }) {
  const insertMock = jest.fn().mockResolvedValue(result);
  return { insert: insertMock };
}

describe('useUpdateEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading is false initially', () => {
    const { result } = renderHook(() => useUpdateEvent());
    expect(result.current.loading).toBe(false);
  });

  it('error is null initially', () => {
    const { result } = renderHook(() => useUpdateEvent());
    expect(result.current.error).toBeNull();
  });

  it('updates events table with date, notes, status', async () => {
    const updateChain = makeUpdateChain({ error: null });
    const deleteChain = makeDeleteChain({ error: null });
    const insertChain = makeInsertChain({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);

    const { result } = renderHook(() => useUpdateEvent());
    await act(async () => { await result.current.updateEvent('event-1', baseInput); });

    expect(supabase.from).toHaveBeenNthCalledWith(1, 'events');
    expect(updateChain.update).toHaveBeenCalledWith({
      date: baseInput.date,
      notes: baseInput.notes,
      status: baseInput.status,
    });
    expect(updateChain._eq).toHaveBeenCalledWith('id', 'event-1');
  });

  it('deletes existing parameter values before inserting new ones', async () => {
    const updateChain = makeUpdateChain({ error: null });
    const deleteChain = makeDeleteChain({ error: null });
    const insertChain = makeInsertChain({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);

    const { result } = renderHook(() => useUpdateEvent());
    await act(async () => { await result.current.updateEvent('event-1', baseInput); });

    expect(supabase.from).toHaveBeenNthCalledWith(2, 'event_parameter_values');
    expect(deleteChain.delete).toHaveBeenCalledTimes(1);
    expect(deleteChain._eq).toHaveBeenCalledWith('event_id', 'event-1');
  });

  it('inserts new parameter values with correct shape', async () => {
    const updateChain = makeUpdateChain({ error: null });
    const deleteChain = makeDeleteChain({ error: null });
    const insertChain = makeInsertChain({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);

    const { result } = renderHook(() => useUpdateEvent());
    await act(async () => { await result.current.updateEvent('event-1', baseInput); });

    expect(supabase.from).toHaveBeenNthCalledWith(3, 'event_parameter_values');
    expect(insertChain.insert).toHaveBeenCalledWith([
      { event_id: 'event-1', parameter_name: 'ph', parameter_value: '7.4', parameter_type: 'number' },
      { event_id: 'event-1', parameter_name: 'cloro', parameter_value: '1.5', parameter_type: 'number' },
    ]);
  });

  it('skips insert when parameterValues is empty', async () => {
    const updateChain = makeUpdateChain({ error: null });
    const deleteChain = makeDeleteChain({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain);

    const { result } = renderHook(() => useUpdateEvent());
    await act(async () => {
      await result.current.updateEvent('event-1', { ...baseInput, parameterValues: [] });
    });

    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it('throws and sets error when event update fails', async () => {
    const dbError = { message: 'Update failed', code: '500' };
    const updateChain = makeUpdateChain({ error: dbError });

    (supabase.from as jest.Mock).mockReturnValueOnce(updateChain);

    const { result } = renderHook(() => useUpdateEvent());
    let thrownError: unknown;
    await act(async () => {
      try { await result.current.updateEvent('event-1', baseInput); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
    expect(result.current.loading).toBe(false);
  });

  it('throws and sets error when delete parameter values fails', async () => {
    const dbError = { message: 'Delete failed', code: '500' };
    const updateChain = makeUpdateChain({ error: null });
    const deleteChain = makeDeleteChain({ error: dbError });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain);

    const { result } = renderHook(() => useUpdateEvent());
    let thrownError: unknown;
    await act(async () => {
      try { await result.current.updateEvent('event-1', baseInput); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
  });

  it('syncs the updated event to Google Calendar after saving it (CA2)', async () => {
    const updateChain = makeUpdateChain({ error: null });
    const deleteChain = makeDeleteChain({ error: null });
    const insertChain = makeInsertChain({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);

    const { result } = renderHook(() => useUpdateEvent());
    await act(async () => { await result.current.updateEvent('event-1', baseInput); });

    expect(syncMock).toHaveBeenCalledWith({ action: 'update', eventId: 'event-1' });
  });

  it('does not throw when the Google Calendar sync fails (CA3)', async () => {
    syncMock.mockRejectedValueOnce(new Error('should never happen, but just in case'));
    const updateChain = makeUpdateChain({ error: null });
    const deleteChain = makeDeleteChain({ error: null });
    const insertChain = makeInsertChain({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(deleteChain)
      .mockReturnValueOnce(insertChain);

    const { result } = renderHook(() => useUpdateEvent());
    let thrownError: unknown;
    await act(async () => {
      try { await result.current.updateEvent('event-1', baseInput); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toBeUndefined();
  });
});
