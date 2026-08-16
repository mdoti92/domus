import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { syncEventToGoogleCalendar } from '../lib/googleCalendarSync';

export function useDeleteEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // .select().single() sobre el delete devuelve la fila borrada: es la
      // única forma de conocer su google_event_id después de este punto, ya
      // que la fila deja de existir en Domus (CA2).
      const { data, error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .select('google_event_id')
        .single();
      if (deleteError) throw deleteError;

      const googleEventId = (data as { google_event_id: string | null } | null)?.google_event_id;
      if (googleEventId) {
        // best-effort: syncEventToGoogleCalendar ya nunca rechaza, el .catch
        // acá es una red de seguridad extra (CA3).
        await syncEventToGoogleCalendar({ action: 'delete', googleEventId }).catch(() => {});
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteEvent, loading, error };
}
