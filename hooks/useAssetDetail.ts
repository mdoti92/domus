import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Asset, EventWithValues } from '../types';

export function useAssetDetail(assetId: string) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [events, setEvents] = useState<EventWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);

    const [assetResult, eventsResult] = await Promise.all([
      supabase.from('assets').select('*').eq('id', assetId).single(),
      supabase
        .from('events')
        .select('*, event_parameter_values(*)')
        .eq('asset_id', assetId)
        .order('date', { ascending: false }),
    ]);

    if (assetResult.error) {
      setError(assetResult.error);
      setAsset(null);
    } else {
      setAsset(assetResult.data as Asset);
      setError(null);
    }

    if (eventsResult.error) {
      setError(eventsResult.error);
      setEvents([]);
    } else {
      setEvents((eventsResult.data ?? []) as EventWithValues[]);
    }

    setLoading(false);
  }, [assetId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { asset, events, loading, error };
}
