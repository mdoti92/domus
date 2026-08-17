import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UpdatePersonInput {
  name: string;
  relationship: string | null;
  birth_date: string | null;
  icon: string | null;
}

export function useUpdatePerson() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const updatePerson = useCallback(async (personId: string, input: UpdatePersonInput): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('people')
        .update(input)
        .eq('id', personId);
      if (updateError) throw updateError;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updatePerson, loading, error };
}
