import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useDeleteAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const deleteAsset = useCallback(async (assetId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);
      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteAsset, loading, error };
}
