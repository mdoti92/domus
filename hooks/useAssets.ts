import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Asset, ParameterDefinition } from '../types';

export interface CreateAssetInput {
  name: string;
  category: string;
  icon: string | null;
  parameter_definitions: ParameterDefinition[];
  person_id: string | null;
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchAssets = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError);
      setAssets([]);
    } else {
      setAssets(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const createAsset = useCallback(
    async (input: CreateAssetInput): Promise<Asset> => {
      const { data, error: insertError } = await supabase
        .from('assets')
        .insert(input)
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchAssets();
      return data as Asset;
    },
    [fetchAssets]
  );

  return { assets, loading, error, createAsset, refetch: fetchAssets };
}
