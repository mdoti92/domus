export type GoogleCalendarConnectionStatus = 'not_connected' | 'connected' | 'expired' | 'revoked';

export interface GoogleCalendarConnectionInfo {
  status: GoogleCalendarConnectionStatus;
  googleAccountEmail: string | null;
  calendarSummary: string | null;
  updatedAt: string | null;
}

// Se refresca un poco antes del vencimiento real para no arrancar una request
// con un access_token que expira en el camino.
const EXPIRY_BUFFER_MS = 60_000;

export function isTokenExpired(expiresAt: string | null, now: Date = new Date()): boolean {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return true;
  return expiry - EXPIRY_BUFFER_MS <= now.getTime();
}

export interface ConnectionStatusDescription {
  label: string;
  detail: string;
  needsReconnect: boolean;
}

export function describeConnectionStatus(status: GoogleCalendarConnectionStatus): ConnectionStatusDescription {
  switch (status) {
    case 'connected':
      return {
        label: 'Conectado',
        detail: 'La cuenta de Google está conectada y el calendario Domus está listo.',
        needsReconnect: false,
      };
    case 'expired':
      return {
        label: 'Sesión expirada',
        detail: 'El acceso a Google expiró. Reconectá la cuenta para seguir sincronizando.',
        needsReconnect: true,
      };
    case 'revoked':
      return {
        label: 'Acceso revocado',
        detail: 'El acceso a Google fue revocado. Reconectá la cuenta para seguir usando el calendario compartido.',
        needsReconnect: true,
      };
    case 'not_connected':
    default:
      return {
        label: 'Sin conectar',
        detail: 'Conectá una cuenta de Google para compartir el calendario de Domus.',
        needsReconnect: false,
      };
  }
}
