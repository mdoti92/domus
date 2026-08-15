// DOM-30: el flujo OAuth de Google via Supabase Auth (PKCE) vuelve a la app con
// un ?code=... en la URL de redirect (esquema domus:// en nativo, origin propio
// en web). Se extrae acá para pasárselo a supabase.auth.exchangeCodeForSession.

export function extractOAuthCode(redirectUrl: string): string | null {
  try {
    return new URL(redirectUrl).searchParams.get('code');
  } catch {
    return null;
  }
}
