import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Person } from '../types';

export interface CreatePersonInput {
  name: string;
  relationship: string | null;
  birth_date: string | null;
  icon: string | null;
}

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchPeople = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('people')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError);
      setPeople([]);
    } else {
      setPeople((data ?? []) as Person[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const createPerson = useCallback(
    async (input: CreatePersonInput): Promise<Person> => {
      const { data, error: insertError } = await supabase
        .from('people')
        .insert(input)
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchPeople();
      return data as Person;
    },
    [fetchPeople]
  );

  return { people, loading, error, createPerson, refetch: fetchPeople };
}
