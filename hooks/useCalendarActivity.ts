import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EventStatus } from '../types';
import { RecurrenceConfig } from '../lib/eventNotificationSchedule';
import { getDayItems, DayItem, EventActivityRecord } from '../lib/calendarDayActivity';

const EVENTS_SELECT = `id, date, asset_id, status, assets(name, category), event_notification_configs(
  enabled, recurrence_type, recurrence_date, recurrence_interval_value, recurrence_interval_unit
)`;

interface RawEventActivityRow {
  id: string;
  date: string;
  asset_id: string;
  status: EventStatus;
  assets: { name: string; category: string } | { name: string; category: string }[] | null;
  event_notification_configs: RecurrenceConfig | RecurrenceConfig[] | null;
}

function normalizeRecord(row: RawEventActivityRow): EventActivityRecord {
  const asset = Array.isArray(row.assets) ? row.assets[0] : row.assets;
  const config = Array.isArray(row.event_notification_configs)
    ? row.event_notification_configs[0]
    : row.event_notification_configs;

  return {
    id: row.id,
    date: row.date,
    assetId: row.asset_id,
    assetName: asset?.name ?? '',
    assetCategory: asset?.category ?? '',
    status: row.status,
    config: config ?? null,
  };
}

export function useCalendarActivity() {
  const [records, setRecords] = useState<EventActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchActivity = useCallback(async (): Promise<void> => {
    setLoading(true);

    const { data, error: fetchError } = await supabase.from('events').select(EVENTS_SELECT);

    if (fetchError) {
      setError(fetchError);
      setRecords([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as RawEventActivityRow[];
    setRecords(rows.map(normalizeRecord));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const getItemsForDate = useCallback((iso: string): DayItem[] => getDayItems(iso, records), [records]);

  return { getItemsForDate, loading, error, refetch: fetchActivity };
}
