import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
      exchangeCodeForSession: jest.fn(),
    },
  },
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'domus:///'),
}));

const mockSession = { user: { id: 'u1', email: 'a@b.com' }, access_token: 'tok' };

const setupAuthMocks = ({
  session = null,
  onAuthCallback,
}: {
  session?: typeof mockSession | null;
  onAuthCallback?: (cb: (event: string, session: unknown) => void) => void;
} = {}) => {
  const unsubscribeMock = jest.fn();

  (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session } });
  (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
    onAuthCallback?.(cb);
    return { data: { subscription: { unsubscribe: unsubscribeMock } } };
  });

  return { unsubscribeMock };
};

describe('useAuth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with loading true', () => {
    setupAuthMocks();
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it('sets session from getSession and loading becomes false', async () => {
    setupAuthMocks({ session: mockSession });
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.session).toEqual(mockSession);
  });

  it('sets session to null when no session exists', async () => {
    setupAuthMocks({ session: null });
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.session).toBeNull();
  });

  it('subscribes to onAuthStateChange on mount', async () => {
    setupAuthMocks();
    renderHook(() => useAuth());

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', async () => {
    const { unsubscribeMock } = setupAuthMocks();
    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it('updates session when onAuthStateChange fires', async () => {
    let capturedCb: ((event: string, session: unknown) => void) | undefined;
    setupAuthMocks({
      session: null,
      onAuthCallback: (cb) => { capturedCb = cb; },
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      capturedCb?.('SIGNED_IN', mockSession);
    });

    expect(result.current.session).toEqual(mockSession);
  });

  describe('signIn', () => {
    it('calls signInWithPassword with email and password', async () => {
      setupAuthMocks();
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn('a@b.com', 'pass123');
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'pass123',
      });
    });

    it('throws when signIn fails', async () => {
      setupAuthMocks();
      const authError = { message: 'Invalid credentials' };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: authError });

      const { result } = renderHook(() => useAuth());

      let thrownError: unknown;
      await act(async () => {
        try { await result.current.signIn('a@b.com', 'wrong'); }
        catch (e) { thrownError = e; }
      });

      expect(thrownError).toEqual(authError);
    });
  });

  describe('signUp', () => {
    it('calls signUp with email and password', async () => {
      setupAuthMocks();
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp('new@b.com', 'pass123');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@b.com',
        password: 'pass123',
      });
    });

    it('throws when signUp fails', async () => {
      setupAuthMocks();
      const authError = { message: 'Email already registered' };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: authError });

      const { result } = renderHook(() => useAuth());

      let thrownError: unknown;
      await act(async () => {
        try { await result.current.signUp('a@b.com', 'pass'); }
        catch (e) { thrownError = e; }
      });

      expect(thrownError).toEqual(authError);
    });
  });

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      setupAuthMocks();
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('throws when signOut fails', async () => {
      setupAuthMocks();
      const authError = { message: 'Network error' };
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: authError });

      const { result } = renderHook(() => useAuth());

      let thrownError: unknown;
      await act(async () => {
        try { await result.current.signOut(); }
        catch (e) { thrownError = e; }
      });

      expect(thrownError).toEqual(authError);
    });
  });

  describe('signInWithGoogle', () => {
    it('starts the OAuth flow, opens the browser session and exchanges the code (CA2/CA3)', async () => {
      setupAuthMocks();
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc' },
        error: null,
      });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'domus:///?code=the-code',
      });
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'domus:///', skipBrowserRedirect: true },
      });
      expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=abc',
        'domus:///'
      );
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('the-code');
    });

    it('throws when signInWithOAuth fails, without opening the browser', async () => {
      setupAuthMocks();
      const authError = { message: 'provider not configured' };
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({ data: { url: null }, error: authError });

      const { result } = renderHook(() => useAuth());

      let thrownError: unknown;
      await act(async () => {
        try { await result.current.signInWithGoogle(); }
        catch (e) { thrownError = e; }
      });

      expect(thrownError).toEqual(authError);
      expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
    });

    it('throws when the user cancels the Google auth session', async () => {
      setupAuthMocks();
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
        error: null,
      });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({ type: 'cancel' });

      const { result } = renderHook(() => useAuth());

      let thrownError: unknown;
      await act(async () => {
        try { await result.current.signInWithGoogle(); }
        catch (e) { thrownError = e; }
      });

      expect(thrownError).toBeInstanceOf(Error);
      expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('throws when exchangeCodeForSession fails', async () => {
      setupAuthMocks();
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
        error: null,
      });
      (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
        type: 'success',
        url: 'domus:///?code=the-code',
      });
      const exchangeError = { message: 'invalid code' };
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({ error: exchangeError });

      const { result } = renderHook(() => useAuth());

      let thrownError: unknown;
      await act(async () => {
        try { await result.current.signInWithGoogle(); }
        catch (e) { thrownError = e; }
      });

      expect(thrownError).toEqual(exchangeError);
    });
  });
});
