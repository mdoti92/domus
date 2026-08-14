import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EventNotificationConfig, EventNotificationReminder, EventNotificationRecipient } from '../types';

interface NotificationConfigDetail {
  config: EventNotificationConfig | null;
  reminders: EventNotificationReminder[];
  recipients: EventNotificationRecipient[];
}

const EMPTY_DETAIL: NotificationConfigDetail = { config: null, reminders: [], recipients: [] };

export function useEventNotificationConfig(eventId: string) {
  const [detail, setDetail] = useState<NotificationConfigDetail>(EMPTY_DETAIL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);

    const { data: configRow, error: configError } = await supabase
      .from('event_notification_configs')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (configError) {
      setError(configError);
      setDetail(EMPTY_DETAIL);
      setLoading(false);
      return;
    }

    if (!configRow) {
      setError(null);
      setDetail(EMPTY_DETAIL);
      setLoading(false);
      return;
    }

    const config = configRow as EventNotificationConfig;

    const [remindersResult, recipientsResult] = await Promise.all([
      supabase.from('event_notification_reminders').select('*').eq('config_id', config.id),
      supabase.from('event_notification_recipients').select('*').eq('config_id', config.id),
    ]);

    setError(remindersResult.error ?? recipientsResult.error ?? null);
    setDetail({
      config,
      reminders: (remindersResult.data ?? []) as EventNotificationReminder[],
      recipients: (recipientsResult.data ?? []) as EventNotificationRecipient[],
    });
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { ...detail, loading, error, refetch: fetchConfig };
}
