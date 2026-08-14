import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useRegisterPushToken } from '../../hooks/useRegisterPushToken';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

const upsertMock = jest.fn();

const makeUpsertChain = (result: { error: unknown }) => ({
  upsert: upsertMock.mockResolvedValue(result),
});

describe('useRegisterPushToken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers the token when permission is already granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpsertChain({ error: null }));

    const { result } = renderHook(() => useRegisterPushToken());

    let token: string | null = null;
    await act(async () => {
      token = await result.current.registerToken('user-1');
    });

    expect(token).toBe('ExponentPushToken[abc]');
    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: 'user-1', expo_push_token: 'ExponentPushToken[abc]' },
      { onConflict: 'user_id,expo_push_token' }
    );
  });

  it('requests permission when not already granted, and registers if the user accepts', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpsertChain({ error: null }));

    const { result } = renderHook(() => useRegisterPushToken());

    let token: string | null = null;
    await act(async () => {
      token = await result.current.registerToken('user-1');
    });

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(token).toBe('ExponentPushToken[abc]');
  });

  it('returns null and does not upsert when the user denies permission', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useRegisterPushToken());

    let token: string | null = null;
    await act(async () => {
      token = await result.current.registerToken('user-1');
    });

    expect(token).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('sets error and returns null when the upsert fails', async () => {
    const dbError = { message: 'upsert failed' };
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'ExponentPushToken[abc]' });
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpsertChain({ error: dbError }));

    const { result } = renderHook(() => useRegisterPushToken());

    let token: string | null = null;
    await act(async () => {
      token = await result.current.registerToken('user-1');
    });

    expect(token).toBeNull();
    expect(result.current.error).toEqual(dbError);
  });

  it('skips registration entirely on web', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'web';

    const { result } = renderHook(() => useRegisterPushToken());

    let token: string | null = null;
    await act(async () => {
      token = await result.current.registerToken('user-1');
    });

    expect(token).toBeNull();
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();

    Platform.OS = originalOS;
  });
});
