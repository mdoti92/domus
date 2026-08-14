import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { HouseholdMember } from '../types';

export function useHouseholdMembers() {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchMembers = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('household_members')
      .select('*')
      .order('display_name', { ascending: true });

    if (fetchError) {
      setError(fetchError);
      setMembers([]);
    } else {
      setMembers((data ?? []) as HouseholdMember[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, refetch: fetchMembers };
}
