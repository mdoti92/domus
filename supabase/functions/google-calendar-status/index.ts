// DOM-31: la app llama a esta función para saber el estado de la conexión con
// Google Calendar. Si el access_token está vencido (o por vencer), intenta
// refrescarlo con el refresh_token guardado; si Google devuelve invalid_grant
// (revocado por el usuario) o cualquier otro error, lo refleja en el status en
// vez de fallar en silencio (CA3). El refresh_token nunca sale de esta función.

import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
// Se refresca un poco antes del vencimiento real para no arrancar una request
// con un access_token que expira en el camino (mismo criterio que
// lib/googleCalendarConnection.ts isTokenExpired, portado acá porque las Edge
// Functions corren en un runtime Deno separado del bundle de la app).
const EXPIRY_BUFFER_MS = 60_000;

function isTokenExpired(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return true;
  return expiry - EXPIRY_BUFFER_MS <= now.getTime();
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: connection, error } = await supabase
    .from('google_calendar_connections')
    .select('status, google_account_email, calendar_summary, refresh_token, access_token_expires_at, updated_at')
    .eq('singleton', true)
    .maybeSingle();

  if (error) {
    console.error('google-calendar-status: failed to load connection', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!connection || connection.status === 'not_connected' || !connection.refresh_token) {
    return new Response(
      JSON.stringify({ status: 'not_connected', googleAccountEmail: null, calendarSummary: null, updatedAt: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let status = connection.status;

  if (status !== 'revoked' && isTokenExpired(connection.access_token_expires_at, new Date())) {
    if (!clientId || !clientSecret) {
      console.error('google-calendar-status: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET, cannot refresh');
    } else {
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

      if (refreshResp.ok && refreshData.access_token) {
        const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
        await supabase
          .from('google_calendar_connections')
          .update({ access_token: refreshData.access_token, access_token_expires_at: expiresAt, status: 'connected' })
          .eq('singleton', true);
        status = 'connected';
      } else {
        console.error('google-calendar-status: token refresh failed', refreshData);
        status = refreshData.error === 'invalid_grant' ? 'revoked' : 'expired';
        await supabase.from('google_calendar_connections').update({ status }).eq('singleton', true);
      }
    }
  }

  return new Response(
    JSON.stringify({
      status,
      googleAccountEmail: connection.google_account_email,
      calendarSummary: connection.calendar_summary,
      updatedAt: connection.updated_at,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
