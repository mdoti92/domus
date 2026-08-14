import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { NotificationTimeUnit, RecurrenceType } from '../types';

export interface ReminderInput {
  offset_value: number;
  offset_unit: NotificationTimeUnit;
}

export interface SaveEventNotificationConfigInput {
  enabled: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_date: string | null;
  recurrence_interval_value: number | null;
  recurrence_interval_unit: NotificationTimeUnit | null;
  notify_all_household: boolean;
  reminders: ReminderInput[];
  recipient_household_member_ids: string[];
}

export function useSaveEventNotificationConfig() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const saveConfig = useCallback(async (eventId: string, input: SaveEventNotificationConfigInput): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data: configRow, error: configError } = await supabase
        .from('event_notification_configs')
        .upsert(
          {
            event_id: eventId,
            enabled: input.enabled,
            recurrence_type: input.recurrence_type,
            recurrence_date: input.recurrence_type === 'date' ? input.recurrence_date : null,
            recurrence_interval_value: input.recurrence_type === 'interval' ? input.recurrence_interval_value : null,
            recurrence_interval_unit: input.recurrence_type === 'interval' ? input.recurrence_interval_unit : null,
            notify_all_household: input.notify_all_household,
          },
          { onConflict: 'event_id' }
        )
        .select()
        .single();

      if (configError) throw configError;

      const configId = (configRow as { id: string }).id;

      const { error: deleteRemindersError } = await supabase
        .from('event_notification_reminders')
        .delete()
        .eq('config_id', configId);
      if (deleteRemindersError) throw deleteRemindersError;

      if (input.reminders.length > 0) {
        const { error: insertRemindersError } = await supabase
          .from('event_notification_reminders')
          .insert(input.reminders.map((r) => ({
            config_id: configId,
            offset_value: r.offset_value,
            offset_unit: r.offset_unit,
          })));
        if (insertRemindersError) throw insertRemindersError;
      }

      const { error: deleteRecipientsError } = await supabase
        .from('event_notification_recipients')
        .delete()
        .eq('config_id', configId);
      if (deleteRecipientsError) throw deleteRecipientsError;

      if (!input.notify_all_household && input.recipient_household_member_ids.length > 0) {
        const { error: insertRecipientsError } = await supabase
          .from('event_notification_recipients')
          .insert(input.recipient_household_member_ids.map((householdMemberId) => ({
            config_id: configId,
            household_member_id: householdMemberId,
          })));
        if (insertRecipientsError) throw insertRecipientsError;
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveConfig, loading, error };
}
