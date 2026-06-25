import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useDeleteEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteEvent, loading, error };
}
