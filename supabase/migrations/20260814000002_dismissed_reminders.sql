-- DOM-19: persistencia de recordatorios descartados por el centro de notificaciones in-app
-- Identifica el recordatorio por su offset (no hay fila persistente por "ocurrencia":
-- el vencimiento se recalcula en base a DOM-18, así que el descarte se ata a
-- evento + destinatario + offset).

CREATE TABLE dismissed_reminders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  household_member_id UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  offset_value        INTEGER NOT NULL,
  offset_unit         TEXT NOT NULL CHECK (offset_unit IN ('hour', 'day', 'week', 'month', 'year')),
  dismissed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, household_member_id, offset_value, offset_unit)
);

ALTER TABLE dismissed_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "require_auth" ON dismissed_reminders
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
