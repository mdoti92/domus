import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EventStatus, ParameterType } from '../types';

export interface UpdateEventInput {
  date: string;
  notes: string | null;
  status: EventStatus;
  parameterValues: Array<{ name: string; value: string; type: ParameterType }>;
}

export function useUpdateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const updateEvent = useCallback(async (eventId: string, input: UpdateEventInput): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ date: input.date, notes: input.notes, status: input.status })
        .eq('id', eventId);
      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('event_parameter_values')
        .delete()
        .eq('event_id', eventId);
      if (deleteError) throw deleteError;

      if (input.parameterValues.length > 0) {
        const rows = input.parameterValues.map((pv) => ({
          event_id: eventId,
          parameter_name: pv.name,
          parameter_value: pv.value,
          parameter_type: pv.type,
        }));
        const { error: insertError } = await supabase
          .from('event_parameter_values')
          .insert(rows);
        if (insertError) throw insertError;
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateEvent, loading, error };
}
