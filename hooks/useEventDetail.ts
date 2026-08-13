import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EventWithValues } from '../types';

export function useEventDetail(eventId: string) {
  const [event, setEvent] = useState<EventWithValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*, event_parameter_values(*)')
      .eq('id', eventId)
      .single();
    if (fetchError) {
      setError(fetchError);
      setEvent(null);
    } else {
      setEvent(data as EventWithValues);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { event, loading, error, refetch: fetchDetail };
}
