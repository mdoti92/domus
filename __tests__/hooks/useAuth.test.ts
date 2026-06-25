import { renderHook, act, waitFor } from '@testing-library/react-native';
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
    },
  },
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
});
