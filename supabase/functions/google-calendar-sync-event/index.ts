// DOM-32: sincroniza un evento de Domus hacia el calendario de Google "Domus"
// (create/update/delete). La invoca la app desde useCreateEvent/useUpdateEvent/
// useDeleteEvent como best-effort — siempre devuelve 200 (incluso cuando no
// pudo sincronizar) porque el fallo nunca debe hacer que el cliente trate esto
// como un error que rompa el flujo local (CA3). El token vive únicamente acá,
// nunca se expone al cliente.

import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_EVENTS_BASE = 'https://www.googleapis.com/calendar/v3/calendars';
// Mismo criterio que google-calendar-status: se refresca un poco antes del
// vencimiento real. Portado acá (no importado) porque las Edge Functions
// corren en un runtime Deno separado del bundle de la app.
const EXPIRY_BUFFER_MS = 60_000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function isTokenExpired(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return true;
  return expiry - EXPIRY_BUFFER_MS <= now.getTime();
}

type SupabaseClient = ReturnType<typeof createClient>;

interface GoogleAuth {
  accessToken: string;
  calendarId: string;
}

async function getValidGoogleAuth(
  supabase: SupabaseClient,
  clientId: string | undefined,
  clientSecret: string | undefined
): Promise<GoogleAuth | null> {
  const { data: connection, error } = await supabase
    .from('google_calendar_connections')
    .select('status, calendar_id, refresh_token, access_token, access_token_expires_at')
    .eq('singleton', true)
    .maybeSingle();

  if (
    error ||
    !connection ||
    connection.status !== 'connected' ||
    !connection.calendar_id ||
    !connection.refresh_token
  ) {
    return null;
  }

  if (!isTokenExpired(connection.access_token_expires_at, new Date())) {
    return { accessToken: connection.access_token, calendarId: connection.calendar_id };
  }

  if (!clientId || !clientSecret) return null;

  const refreshResp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: connection.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  const refreshData = await refreshResp.json();

  if (!refreshResp.ok || !refreshData.access_token) {
    console.error('google-calendar-sync-event: token refresh failed', refreshData);
    const revoked = refreshData.error === 'invalid_grant';
    await supabase
      .from('google_calendar_connections')
      .update({ status: revoked ? 'revoked' : 'expired' })
      .eq('singleton', true);
    return null;
  }

  const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
  await supabase
    .from('google_calendar_connections')
    .update({ access_token: refreshData.access_token, access_token_expires_at: expiresAt, status: 'connected' })
    .eq('singleton', true);

  return { accessToken: refreshData.access_token, calendarId: connection.calendar_id };
}

// Domus no maneja hora del día para los eventos, así que se sincronizan como
// eventos "de todo el día". Google usa fecha de fin exclusiva: para un evento
// de un solo día, end.date es el día siguiente al de start.date.
function toGoogleAllDayRange(eventDate: string): { start: string; end: string } {
  const start = new Date(eventDate);
  const startDate = start.toISOString().split('T')[0];
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const endDate = end.toISOString().split('T')[0];
  return { start: startDate, end: endDate };
}

async function writeCalendarEvent(
  auth: GoogleAuth,
  eventId: string,
  supabase: SupabaseClient
): Promise<{ ok: boolean; googleEventId?: string }> {
  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('date, notes, google_event_id, assets(name)')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError || !eventRow) {
    console.error('google-calendar-sync-event: event not found', eventId, eventError);
    return { ok: false };
  }

  const asset = Array.isArray(eventRow.assets) ? eventRow.assets[0] : eventRow.assets;
  const { start, end } = toGoogleAllDayRange(eventRow.date);
  const googleEventBody = {
    summary: asset?.name ?? 'Domus',
    description: eventRow.notes ?? undefined,
    start: { date: start },
    end: { date: end },
  };

  const existingId: string | null = eventRow.google_event_id;
  const headers = { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' };

  let resp: Response;
  if (existingId) {
    resp = await fetch(`${CALENDAR_EVENTS_BASE}/${encodeURIComponent(auth.calendarId)}/events/${encodeURIComponent(existingId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(googleEventBody),
    });
    if (resp.status === 404) {
      // El evento fue borrado del lado de Google (manualmente, por ejemplo) -- se recrea.
      resp = await fetch(`${CALENDAR_EVENTS_BASE}/${encodeURIComponent(auth.calendarId)}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(googleEventBody),
      });
    }
  } else {
    resp = await fetch(`${CALENDAR_EVENTS_BASE}/${encodeURIComponent(auth.calendarId)}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(googleEventBody),
    });
  }

  const respData = await resp.json();
  if (!resp.ok) {
    console.error('google-calendar-sync-event: Calendar API write failed', resp.status, respData);
    return { ok: false };
  }

  if (respData.id && respData.id !== existingId) {
    await supabase.from('events').update({ google_event_id: respData.id }).eq('id', eventId);
  }

  return { ok: true, googleEventId: respData.id };
}

async function deleteCalendarEvent(auth: GoogleAuth, googleEventId: string): Promise<{ ok: boolean }> {
  const resp = await fetch(
    `${CALENDAR_EVENTS_BASE}/${encodeURIComponent(auth.calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${auth.accessToken}` } }
  );

  // 404/410: ya no existía en Google (borrado a mano, o nunca se creó bien) -- se lo trata como éxito, es idempotente.
  if (!resp.ok && resp.status !== 404 && resp.status !== 410) {
    const errBody = await resp.text();
    console.error('google-calendar-sync-event: delete failed', resp.status, errBody);
    return { ok: false };
  }

  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  let payload: { action?: string; eventId?: string; googleEventId?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const auth = await getValidGoogleAuth(supabase, clientId, clientSecret);
  if (!auth) {
    // Sin conexión activa: no es un error del evento en sí, se lo indica al
    // cliente como "skipped" y listo -- nunca debe romper el flujo (CA3).
    console.error('google-calendar-sync-event: no valid Google Calendar connection, skipping', payload);
    return jsonResponse({ ok: false, skipped: true }, 200);
  }

  if (payload.action === 'delete') {
    if (!payload.googleEventId) return jsonResponse({ ok: false, error: 'missing_google_event_id' }, 200);
    const result = await deleteCalendarEvent(auth, payload.googleEventId);
    return jsonResponse(result, 200);
  }

  if (payload.action === 'create' || payload.action === 'update') {
    if (!payload.eventId) return jsonResponse({ ok: false, error: 'missing_event_id' }, 200);
    const result = await writeCalendarEvent(auth, payload.eventId, supabase);
    return jsonResponse(result, 200);
  }

  return jsonResponse({ ok: false, error: 'unknown_action' }, 400);
});
