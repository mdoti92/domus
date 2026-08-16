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

// Las Edge Functions de Supabase no sirven HTML: cualquier GET que devuelva
// text/html se reescribe a text/plain a nivel plataforma (documentado en
// https://supabase.com/docs/guides/functions/development-tips), y esa
// reescritura no preserva el charset declarado -- el browser termina
// adivinando la codificación y mangla tildes/¡/¿. Por eso esta página de
// resultado es texto plano sin acentos: así el mensaje se ve bien sin
// depender de qué encoding adivine el browser.
function textPage(title: string, message: string): Response {
  return new Response(`${title}\n\n${message}`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
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
    return textPage(
      'Conexion cancelada',
      'No se completo la autorizacion con Google. Podes volver a intentarlo desde Ajustes en Domus.'
    );
  }

  if (!code || !state) {
    return textPage(
      'Enlace invalido',
      'Falta informacion en el enlace de autorizacion. Volve a intentarlo desde Ajustes en Domus.'
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    console.error('google-calendar-oauth-callback: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET secrets');
    return textPage(
      'Falta configuracion',
      'GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no estan configurados en el proyecto de Supabase.'
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
    return textPage('Error interno', 'No se pudo validar la conexion. Intenta de nuevo desde Ajustes en Domus.');
  }

  const stateAge = connection?.pending_oauth_state_created_at
    ? Date.now() - new Date(connection.pending_oauth_state_created_at).getTime()
    : Infinity;

  if (!connection || connection.pending_oauth_state !== state || stateAge > STATE_MAX_AGE_MS) {
    return textPage('Enlace invalido o expirado', 'Inicia la conexion de nuevo desde Ajustes en Domus.');
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
    return textPage('No se pudo conectar', 'Google rechazo la autorizacion. Intenta de nuevo desde Ajustes en Domus.');
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
      return textPage(
        'Conectado, con un problema',
        'La cuenta se conecto pero no se pudo crear el calendario "Domus". Reintenta desde Ajustes en Domus.'
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
    return textPage('Error interno', 'La cuenta se conecto pero no se pudo guardar. Reintenta desde Ajustes en Domus.');
  }

  return textPage('Cuenta conectada!', 'Ya podes volver a Domus. El calendario "Domus" esta listo para compartir.');
});
