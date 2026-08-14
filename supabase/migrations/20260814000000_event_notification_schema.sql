-- DOM-16: Modelo de datos para notificaciones de eventos (recurrencia, recordatorios y destinatarios)
-- Solo modelo de datos y acceso — sin UI (DOM-17) ni cálculo de próxima ocurrencia (DOM-18).

-- Integrantes del hogar, para el selector de destinatarios
CREATE TABLE household_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Config de notificación de un evento (1 a 1)
CREATE TABLE event_notification_configs (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                   UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  enabled                    BOOLEAN NOT NULL DEFAULT false,
  recurrence_type            TEXT CHECK (recurrence_type IN ('date', 'interval')),
  recurrence_date            TIMESTAMPTZ,
  recurrence_interval_value  INTEGER,
  recurrence_interval_unit   TEXT CHECK (recurrence_interval_unit IN ('hour', 'day', 'week', 'month', 'year')) DEFAULT 'week',
  notify_all_household       BOOLEAN NOT NULL DEFAULT true,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER event_notification_configs_set_updated_at
  BEFORE UPDATE ON event_notification_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Recordatorios previos a la próxima ocurrencia (N por config)
CREATE TABLE event_notification_reminders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id    UUID NOT NULL REFERENCES event_notification_configs(id) ON DELETE CASCADE,
  offset_value INTEGER NOT NULL,
  offset_unit  TEXT NOT NULL CHECK (offset_unit IN ('hour', 'day', 'week', 'month', 'year')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Destinatarios específicos (solo se usa si notify_all_household = false)
CREATE TABLE event_notification_recipients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id           UUID NOT NULL REFERENCES event_notification_configs(id) ON DELETE CASCADE,
  household_member_id UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (config_id, household_member_id)
);

-- RLS — mismo criterio que el resto del schema desde DOM-14: cualquier autenticado accede a todo
ALTER TABLE household_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notification_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notification_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notification_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "require_auth" ON household_members
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "require_auth" ON event_notification_configs
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "require_auth" ON event_notification_reminders
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "require_auth" ON event_notification_recipients
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
