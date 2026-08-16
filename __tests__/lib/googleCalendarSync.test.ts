import { syncEventToGoogleCalendar } from '../../lib/googleCalendarSync';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const invokeMock = supabase.functions.invoke as jest.Mock;

describe('syncEventToGoogleCalendar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('invokes google-calendar-sync-event with a create payload (CA1)', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });

    await syncEventToGoogleCalendar({ action: 'create', eventId: 'event-1' });

    expect(invokeMock).toHaveBeenCalledWith('google-calendar-sync-event', {
      body: { action: 'create', eventId: 'event-1' },
    });
  });

  it('invokes google-calendar-sync-event with an update payload (CA2)', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });

    await syncEventToGoogleCalendar({ action: 'update', eventId: 'event-1' });

    expect(invokeMock).toHaveBeenCalledWith('google-calendar-sync-event', {
      body: { action: 'update', eventId: 'event-1' },
    });
  });

  it('invokes google-calendar-sync-event with a delete payload (CA2)', async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });

    await syncEventToGoogleCalendar({ action: 'delete', googleEventId: 'g-event-1' });

    expect(invokeMock).toHaveBeenCalledWith('google-calendar-sync-event', {
      body: { action: 'delete', googleEventId: 'g-event-1' },
    });
  });

  it('does not throw when the edge function returns an error (CA3)', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'token expired' } });

    await expect(syncEventToGoogleCalendar({ action: 'create', eventId: 'event-1' })).resolves.toBeUndefined();
  });

  it('does not throw when invoke itself rejects, e.g. a network error (CA3)', async () => {
    invokeMock.mockRejectedValue(new Error('network down'));

    await expect(syncEventToGoogleCalendar({ action: 'create', eventId: 'event-1' })).resolves.toBeUndefined();
  });

  it('logs the failure instead of failing silently (CA3)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    invokeMock.mockResolvedValue({ data: null, error: { message: 'token expired' } });

    await syncEventToGoogleCalendar({ action: 'create', eventId: 'event-1' });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
