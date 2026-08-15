import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useGoogleCalendarConnection } from '../../hooks/useGoogleCalendarConnection';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const invokeMock = supabase.functions.invoke as jest.Mock;
const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

describe('useGoogleCalendarConnection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads the connection status on mount (CA1/CA4)', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        status: 'connected',
        googleAccountEmail: 'martin@example.com',
        calendarSummary: 'Domus',
        updatedAt: '2026-08-15T12:00:00Z',
      },
      error: null,
    });

    const { result } = renderHook(() => useGoogleCalendarConnection());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(invokeMock).toHaveBeenCalledWith('google-calendar-status');
    expect(result.current.info).toEqual({
      status: 'connected',
      googleAccountEmail: 'martin@example.com',
      calendarSummary: 'Domus',
      updatedAt: '2026-08-15T12:00:00Z',
    });
  });

  it('surfaces an expired/revoked status instead of failing silently (CA3)', async () => {
    invokeMock.mockResolvedValueOnce({
      data: { status: 'revoked', googleAccountEmail: 'martin@example.com', calendarSummary: 'Domus', updatedAt: null },
      error: null,
    });

    const { result } = renderHook(() => useGoogleCalendarConnection());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.info?.status).toBe('revoked');
    expect(result.current.error).toBeNull();
  });

  it('sets an error when the status check fails', async () => {
    const invokeError = { message: 'network error' };
    invokeMock.mockResolvedValueOnce({ data: null, error: invokeError });

    const { result } = renderHook(() => useGoogleCalendarConnection());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(invokeError);
    expect(result.current.info).toBeNull();
  });

  it('connect() starts the OAuth flow by opening the URL returned by the edge function (CA1)', async () => {
    invokeMock
      .mockResolvedValueOnce({ data: { status: 'not_connected', googleAccountEmail: null, calendarSummary: null, updatedAt: null }, error: null })
      .mockResolvedValueOnce({ data: { authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc' }, error: null });

    const { result } = renderHook(() => useGoogleCalendarConnection());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.connect();
    });

    expect(invokeMock).toHaveBeenCalledWith('google-calendar-oauth-start');
    expect(Linking.openURL).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?client_id=abc');
  });

  it('sets an error and rethrows when starting the OAuth flow fails', async () => {
    const invokeError = { message: 'missing GOOGLE_CLIENT_ID' };
    invokeMock
      .mockResolvedValueOnce({ data: { status: 'not_connected', googleAccountEmail: null, calendarSummary: null, updatedAt: null }, error: null })
      .mockResolvedValueOnce({ data: null, error: invokeError });

    const { result } = renderHook(() => useGoogleCalendarConnection());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.connect();
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toEqual(invokeError);
    expect(result.current.error).toEqual(invokeError);
    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
