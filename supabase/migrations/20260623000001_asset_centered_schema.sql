-- DOM-5: Reemplazar schema de eventos por modelo centrado en Assets
-- El usuario interactúa desde el asset, no desde el módulo.

-- 1. Eliminar tablas que dependen del schema viejo
DROP TABLE IF EXISTS maintenance_events;
DROP TABLE IF EXISTS obra_events;
DROP TABLE IF EXISTS events;

-- 2. Eliminar enum que ya no corresponde al modelo
DROP TYPE IF EXISTS module_type;

-- 3. Agregar campo icon a assets (resto de la tabla ya existe)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS icon TEXT;

-- 4. Nueva tabla events — centrada en el asset, sin module_type
CREATE TABLE events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  date       TIMESTAMPTZ NOT NULL,
  notes      TEXT,
  status     event_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Valores de parámetros por evento (reemplaza parameters JSONB inline)
CREATE TABLE event_parameter_values (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  parameter_name  TEXT NOT NULL,
  parameter_value TEXT NOT NULL,
  parameter_type  TEXT NOT NULL CHECK (parameter_type IN ('text', 'number', 'boolean')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RLS permisivo para desarrollo
ALTER TABLE events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_parameter_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_allow_all" ON events                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON event_parameter_values FOR ALL USING (true) WITH CHECK (true);
