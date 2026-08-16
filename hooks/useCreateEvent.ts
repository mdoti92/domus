import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ParameterType } from '../types';
import { syncEventToGoogleCalendar } from '../lib/googleCalendarSync';

export interface ParameterValueInput {
  name: string;
  value: string | number | boolean;
  type: ParameterType;
}

export interface CreateEventInput {
  date: string;
  notes: string | null;
  parameterValues: ParameterValueInput[];
}

export function useCreateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const createEvent = useCallback(async (assetId: string, input: CreateEventInput): Promise<{ id: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({ asset_id: assetId, date: input.date, notes: input.notes, status: 'done' })
        .select()
        .single();

      if (eventError) throw eventError;

      const createdEvent = event as { id: string };

      if (input.parameterValues.length > 0) {
        const values = input.parameterValues.map((pv) => ({
          event_id: createdEvent.id,
          parameter_name: pv.name,
          parameter_value: String(pv.value),
          parameter_type: pv.type,
        }));

        const { error: valError } = await supabase
          .from('event_parameter_values')
          .insert(values);

        if (valError) throw valError;
      }

      // best-effort: syncEventToGoogleCalendar ya nunca rechaza (ver su propio
      // try/catch), el .catch acá es una red de seguridad extra porque este
      // paso jamás debe poder tirar abajo la creación del evento (CA3).
      await syncEventToGoogleCalendar({ action: 'create', eventId: createdEvent.id }).catch(() => {});

      return createdEvent;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createEvent, loading, error };
}
