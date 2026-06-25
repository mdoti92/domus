import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ParameterDefinition } from '../types';

export interface UpdateAssetInput {
  name: string;
  category: string;
  icon: string | null;
  parameter_definitions: ParameterDefinition[];
}

export function useUpdateAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const updateAsset = useCallback(async (assetId: string, input: UpdateAssetInput): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('assets')
        .update(input)
        .eq('id', assetId);
      if (updateError) throw updateError;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateAsset, loading, error };
}
