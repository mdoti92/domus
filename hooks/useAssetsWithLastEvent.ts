import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mergeLastEvents } from '../lib/mergeLastEvents';
import { Asset, AssetWithLastEvent, ParameterDefinition } from '../types';

export interface CreateAssetInput {
  name: string;
  category: string;
  icon: string | null;
  parameter_definitions: ParameterDefinition[];
}

export function useAssetsWithLastEvent() {
  const [assets, setAssets] = useState<AssetWithLastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: rawAssets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (assetsError) {
      setError(assetsError);
      setAssets([]);
      setLoading(false);
      return;
    }

    const assets = (rawAssets ?? []) as Asset[];

    if (assets.length === 0) {
      setAssets([]);
      setError(null);
      setLoading(false);
      return;
    }

    const assetIds = assets.map((a) => a.id);

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('asset_id, date, notes')
      .in('asset_id', assetIds)
      .order('date', { ascending: false });

    if (eventsError) {
      setAssets(assets.map((a) => ({ ...a, lastEvent: null })));
    } else {
      setAssets(mergeLastEvents(assets, (events ?? []) as Array<{ asset_id: string; date: string; notes: string | null }>));
    }

    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createAsset = useCallback(
    async (input: CreateAssetInput): Promise<Asset> => {
      const { data, error: insertError } = await supabase
        .from('assets')
        .insert(input)
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchData();
      return data as Asset;
    },
    [fetchData]
  );

  return { assets, loading, error, createAsset, refetch: fetchData };
}
