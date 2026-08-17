import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const FOREIGN_KEY_VIOLATION = '23503';

export function useDeletePerson() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const deletePerson = useCallback(async (personId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('people')
        .delete()
        .eq('id', personId);

      if (deleteError) {
        if ((deleteError as { code?: string }).code === FOREIGN_KEY_VIOLATION) {
          throw new Error('No se puede eliminar: hay assets asociados a esta persona. Desvinculalos primero.');
        }
        throw deleteError;
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deletePerson, loading, error };
}
