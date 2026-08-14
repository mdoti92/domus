-- DOM-20: cola de despacho para el job programado que detecta recordatorios vencidos
-- Una fila por recordatorio vencido x destinatario x canal. El UNIQUE compuesto
-- da idempotencia gratis: corridas posteriores del job usan ON CONFLICT DO NOTHING
-- y no duplican filas para lo ya encolado (CA3).

CREATE TABLE notification_dispatch_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_id  UUID NOT NULL REFERENCES event_notification_reminders(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('push', 'email')),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, reminder_id, recipient_id, channel)
);

CREATE TRIGGER notification_dispatch_log_set_updated_at
  BEFORE UPDATE ON notification_dispatch_log
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE notification_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "require_auth" ON notification_dispatch_log
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
