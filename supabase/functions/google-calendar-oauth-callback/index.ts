// DOM-31: recibe el redirect de Google al terminar el consentimiento. Valida el
// state (CSRF) generado por google-calendar-oauth-start, intercambia el code por
// tokens, busca o crea el calendario "Domus" en la cuenta, y guarda la conexión.
// La llama Google directamente (navegación de browser), no la app — por eso
// verify_jwt está deshabilitado a nivel deploy y la seguridad la da el state.

import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_LIST_ENDPOINT = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const CALENDARS_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars';
const DOMUS_CALENDAR_SUMMARY = 'Domus';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function htmlPage(title: string, message: string): Response {
  const body = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: sans-serif; background:#0d1a0f; color:#c8d4c0; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
  <div style="text-align:center; max-width:420px; padding:24px;">
    <h1 style="color:#c8b560; font-size:22px;">${title}</h1>
    <p>${message}</p>
  </div>
</body></html>`;
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function decodeIdTokenEmail(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.email === 'string' ? json.email : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    return htmlPage(
      'Conexión cancelada',
      'No se completó la autorización con Google. Podés volver a intentarlo desde Ajustes en Domus.'
    );
  }

  if (!code || !state) {
    return htmlPage(
      'Enlace inválido',
      'Falta información en el enlace de autorización. Volvé a intentarlo desde Ajustes en Domus.'
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('google-calendar-oauth-callback: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET secrets');
    return htmlPage(
      'Falta configuración',
      'GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no están configurados en el proyecto de Supabase.'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: connection, error: fetchError } = await supabase
    .from('google_calendar_connections')
    .select('pending_oauth_state, pending_oauth_state_created_at')
    .eq('singleton', true)
    .maybeSingle();

  if (fetchError) {
    console.error('google-calendar-oauth-callback: failed to load pending state', fetchError);
    return htmlPage('Error interno', 'No se pudo validar la conexión. Intentá de nuevo desde Ajustes en Domus.');
  }

  const stateAge = connection?.pending_oauth_state_created_at
    ? Date.now() - new Date(connection.pending_oauth_state_created_at).getTime()
    : Infinity;

  if (!connection || connection.pending_oauth_state !== state || stateAge > STATE_MAX_AGE_MS) {
    return htmlPage('Enlace inválido o expirado', 'Iniciá la conexión de nuevo desde Ajustes en Domus.');
  }

  const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-oauth-callback`;

  const tokenResp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenResp.json();

  if (!tokenResp.ok || !tokenData.access_token) {
    console.error('google-calendar-oauth-callback: token exchange failed', tokenData);
    return htmlPage('No se pudo conectar', 'Google rechazó la autorización. Intentá de nuevo desde Ajustes en Domus.');
  }

  const accessToken: string = tokenData.access_token;
  const refreshToken: string | undefined = tokenData.refresh_token;
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  const googleAccountEmail = decodeIdTokenEmail(tokenData.id_token);

  const listResp = await fetch(CALENDAR_LIST_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const listData = await listResp.json();

  let calendarId: string | null = null;
  if (listResp.ok) {
    const existing = (listData.items ?? []).find(
      (item: { summary?: string; id?: string }) => item.summary === DOMUS_CALENDAR_SUMMARY
    );
    calendarId = existing?.id ?? null;
  }

  if (!calendarId) {
    const createResp = await fetch(CALENDARS_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: DOMUS_CALENDAR_SUMMARY }),
    });
    const createData = await createResp.json();
    if (!createResp.ok) {
      console.error('google-calendar-oauth-callback: failed to create calendar', createData);
      return htmlPage(
        'Conectado, con un problema',
        'La cuenta se conectó pero no se pudo crear el calendario "Domus". Reintentá desde Ajustes en Domus.'
      );
    }
    calendarId = createData.id;
  }

  const { error: saveError } = await supabase
    .from('google_calendar_connections')
    .update({
      status: 'connected',
      google_account_email: googleAccountEmail,
      calendar_id: calendarId,
      calendar_summary: DOMUS_CALENDAR_SUMMARY,
      access_token: accessToken,
      access_token_expires_at: expiresAt,
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
      pending_oauth_state: null,
      pending_oauth_state_created_at: null,
    })
    .eq('singleton', true);

  if (saveError) {
    console.error('google-calendar-oauth-callback: failed to persist connection', saveError);
    return htmlPage('Error interno', 'La cuenta se conectó pero no se pudo guardar. Reintentá desde Ajustes en Domus.');
  }

  return htmlPage('¡Cuenta conectada!', 'Ya podés volver a Domus. El calendario "Domus" está listo para compartir.');
});
