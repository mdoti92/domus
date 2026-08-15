-- DOM-31: conexión OAuth con la cuenta de Google dueña del calendario compartido
-- de Domus. Fila única (singleton, no una conexión por usuario del hogar) -- el
-- UNIQUE sobre "singleton" (siempre true) impide una segunda fila y habilita
-- upsert con ON CONFLICT (singleton) desde las Edge Functions.
--
-- Sin políticas de RLS para anon/authenticated a propósito: nadie que use el
-- cliente (anon key o sesión de usuario) puede leer ni escribir esta tabla, ni
-- siquiera el refresh_token vía columnas sueltas. Solo service_role (usado
-- adentro de las Edge Functions) la accede, porque service_role bypassea RLS.

CREATE TABLE google_calendar_connections (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton                       BOOLEAN NOT NULL DEFAULT true,
  status                          TEXT NOT NULL DEFAULT 'not_connected'
                                   CHECK (status IN ('not_connected', 'connected', 'expired', 'revoked')),
  google_account_email            TEXT,
  calendar_id                     TEXT,
  calendar_summary                TEXT,
  refresh_token                   TEXT,
  access_token                    TEXT,
  access_token_expires_at         TIMESTAMPTZ,
  pending_oauth_state              TEXT,
  pending_oauth_state_created_at   TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT google_calendar_connections_singleton CHECK (singleton),
  CONSTRAINT google_calendar_connections_singleton_unique UNIQUE (singleton)
);

CREATE TRIGGER google_calendar_connections_set_updated_at
  BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
