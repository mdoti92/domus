import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { NotificationTimeUnit } from '../types';
import { DueNotificationItem, DismissedReminderKey, getDueNotificationsForUser } from '../lib/dueNotifications';
import { RawEventRow, mapDueNotificationRows } from '../lib/mapDueNotificationRows';

const EVENTS_SELECT = `id, date, assets(name), event_notification_configs!inner(
  enabled, recurrence_type, recurrence_date, recurrence_interval_value, recurrence_interval_unit, notify_all_household,
  event_notification_reminders(offset_value, offset_unit),
  event_notification_recipients(household_member_id)
)`;

export function useDueNotifications() {
  const [items, setItems] = useState<DueNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  const fetchDue = useCallback(async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError(userError);
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: memberRow, error: memberError } = await supabase
      .from('household_members')
      .select('id')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (memberError || !memberRow) {
      setError(memberError);
      setItems([]);
      setLoading(false);
      return;
    }

    const currentMemberId = (memberRow as { id: string }).id;
    setMemberId(currentMemberId);

    const [eventsResult, dismissedResult] = await Promise.all([
      supabase.from('events').select(EVENTS_SELECT).eq('event_notification_configs.enabled', true),
      supabase
        .from('dismissed_reminders')
        .select('event_id, offset_value, offset_unit')
        .eq('household_member_id', currentMemberId),
    ]);

    if (eventsResult.error) {
      setError(eventsResult.error);
      setItems([]);
      setLoading(false);
      return;
    }

    const events = mapDueNotificationRows((eventsResult.data ?? []) as unknown as RawEventRow[]);
    const dismissed: DismissedReminderKey[] = ((dismissedResult.data ?? []) as {
      event_id: string;
      offset_value: number;
      offset_unit: NotificationTimeUnit;
    }[]).map((d) => ({ eventId: d.event_id, offset_value: d.offset_value, offset_unit: d.offset_unit }));

    setItems(getDueNotificationsForUser(events, currentMemberId, dismissed));
    setError(dismissedResult.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDue();
  }, [fetchDue]);

  const dismiss = useCallback(
    async (eventId: string, offsetValue: number, offsetUnit: NotificationTimeUnit): Promise<void> => {
      if (!memberId) return;

      const { error: dismissError } = await supabase.from('dismissed_reminders').insert({
        event_id: eventId,
        household_member_id: memberId,
        offset_value: offsetValue,
        offset_unit: offsetUnit,
      });

      if (dismissError) throw dismissError;

      setItems((prev) =>
        prev.filter(
          (item) => !(item.eventId === eventId && item.offset_value === offsetValue && item.offset_unit === offsetUnit)
        )
      );
    },
    [memberId]
  );

  return { items, loading, error, dismiss, refetch: fetchDue };
}
