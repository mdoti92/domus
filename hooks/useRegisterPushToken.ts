import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

async function obtainExpoPushToken(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  return tokenResponse.data;
}

export function useRegisterPushToken() {
  const [error, setError] = useState<unknown>(null);

  const registerToken = useCallback(async (userId: string): Promise<string | null> => {
    if (Platform.OS === 'web') return null;

    setError(null);
    try {
      const token = await obtainExpoPushToken();
      if (!token) return null;

      const { error: upsertError } = await supabase
        .from('push_tokens')
        .upsert({ user_id: userId, expo_push_token: token }, { onConflict: 'user_id,expo_push_token' });

      if (upsertError) {
        setError(upsertError);
        return null;
      }

      return token;
    } catch (err) {
      setError(err);
      return null;
    }
  }, []);

  return { registerToken, error };
}
