import { supabase } from './supabase';

export type GoogleCalendarSyncPayload =
  | { action: 'create' | 'update'; eventId: string }
  | { action: 'delete'; googleEventId: string };

// DOM-32: la escritura a Google Calendar es best-effort — nunca debe bloquear
// ni revertir la operación local en Domus (CA3). Por eso esta función nunca
// rechaza: cualquier error (de red o devuelto por la Edge Function) se
// registra con console.error y se descarta ahí mismo.
export async function syncEventToGoogleCalendar(payload: GoogleCalendarSyncPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('google-calendar-sync-event', { body: payload });
    if (error) {
      console.error('syncEventToGoogleCalendar: edge function returned an error', error);
    }
  } catch (err) {
    console.error('syncEventToGoogleCalendar: failed to invoke edge function', err);
  }
}
