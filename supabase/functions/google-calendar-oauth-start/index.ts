// DOM-31: arranca el flujo OAuth de Google para la cuenta "dueña" del calendario
// compartido de Domus. Genera un state random, lo guarda para que
// google-calendar-oauth-callback lo valide (CSRF), y devuelve la URL de consentimiento
// de Google. El client_id nunca sale del proyecto de Supabase — la app solo recibe
// la URL final ya armada.

import { createClient } from 'npm:@supabase/supabase-js@2';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

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

Deno.serve(async () => {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!clientId) {
    console.error('google-calendar-oauth-start: missing GOOGLE_CLIENT_ID secret');
    return new Response(
      JSON.stringify({ error: 'Falta configurar el secreto GOOGLE_CLIENT_ID en el proyecto de Supabase.' }),
      { status: 500 }
    );
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const authUrl = buildGoogleAuthUrl(clientId, redirectUri, state);

  return new Response(JSON.stringify({ authUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
