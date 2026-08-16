import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RecurrenceConfig } from '../lib/eventNotificationSchedule';
import { getMarkedDates, RecurringEventInput } from '../lib/calendarActivity';

const EVENTS_SELECT = `date, event_notification_configs(
  enabled, recurrence_type, recurrence_date, recurrence_interval_value, recurrence_interval_unit
)`;

interface EventActivityRow {
  date: string;
  event_notification_configs: RecurrenceConfig | RecurrenceConfig[] | null;
}

export function useCalendarActivity() {
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchActivity = useCallback(async (): Promise<void> => {
    setLoading(true);

    const { data, error: fetchError } = await supabase.from('events').select(EVENTS_SELECT);

    if (fetchError) {
      setError(fetchError);
      setMarkedDates(new Set());
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as EventActivityRow[];
    const eventDates = rows.map((row) => row.date);
    const recurringEvents: RecurringEventInput[] = rows
      .map((row) => {
        const config = Array.isArray(row.event_notification_configs)
          ? row.event_notification_configs[0]
          : row.event_notification_configs;
        return config ? { date: row.date, config } : null;
      })
      .filter((entry): entry is RecurringEventInput => entry !== null);

    setMarkedDates(getMarkedDates(eventDates, recurringEvents));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { markedDates, loading, error, refetch: fetchActivity };
}
