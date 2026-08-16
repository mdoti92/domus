// DOM-31: arranca el flujo OAuth de Google para la cuenta "dueña" del calendario
// compartido de Domus. Genera un state random, lo guarda para que
// google-calendar-oauth-callback lo valide (CSRF), y devuelve la URL de consentimiento
// de Google. El client_id nunca sale del proyecto de Supabase — la app solo recibe
// la URL final ya armada.

import { createClient } from 'npm:@supabase/supabase-js@2';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

// La llama supabase.functions.invoke() desde el browser (app web), que manda
// un preflight OPTIONS por el header Authorization. Sin estos headers Chrome
// bloquea la respuesta antes de que la app la vea (CORS).
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

function buildGoogleAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    // prompt=consent fuerza que Google devuelva refresh_token también en
    // reconexiones (si no, solo lo manda la primera vez que se autoriza el scope).
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: `openid email ${CALENDAR_SCOPE}`,
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!clientId) {
    console.error('google-calendar-oauth-start: missing GOOGLE_CLIENT_ID secret');
    return jsonResponse({ error: 'Falta configurar el secreto GOOGLE_CLIENT_ID en el proyecto de Supabase.' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const state = crypto.randomUUID();
  const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth-callback`;

  const { error } = await supabase.from('google_calendar_connections').upsert(
    {
      singleton: true,
      pending_oauth_state: state,
      pending_oauth_state_created_at: new Date().toISOString(),
    },
    { onConflict: 'singleton' }
  );

  if (error) {
    console.error('google-calendar-oauth-start: failed to store oauth state', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const authUrl = buildGoogleAuthUrl(clientId, redirectUri, state);

  return jsonResponse({ authUrl }, 200);
});
