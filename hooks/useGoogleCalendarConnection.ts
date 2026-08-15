import { useState, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { GoogleCalendarConnectionInfo } from '../lib/googleCalendarConnection';

export function useGoogleCalendarConnection() {
  const [info, setInfo] = useState<GoogleCalendarConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [connecting, setConnecting] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('google-calendar-status');
    if (invokeError) {
      setError(invokeError);
      setInfo(null);
    } else {
      setInfo(data as GoogleCalendarConnectionInfo);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async (): Promise<void> => {
    setConnecting(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('google-calendar-oauth-start');
      if (invokeError) throw invokeError;

      const { authUrl } = data as { authUrl: string };
      await Linking.openURL(authUrl);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  return { info, loading, error, connecting, refresh, connect };
}
