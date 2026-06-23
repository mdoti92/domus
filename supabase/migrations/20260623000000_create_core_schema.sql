-- Core schema for Domus
-- Modelo: todo es un Evento. Cada módulo extiende la tabla base.

-- Enum types
CREATE TYPE module_type AS ENUM ('maintenance', 'obra', 'medical', 'calendar');
CREATE TYPE event_status AS ENUM ('pending', 'done', 'cancelled');

-- Assets: entidades físicas del hogar que se mantienen (piscina, lavarropas, etc.)
CREATE TABLE assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  category              TEXT NOT NULL,
  -- [{name: string, type: 'text'|'number'|'boolean', unit?: string}]
  parameter_definitions JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events: tabla base para todos los eventos del hogar
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type module_type  NOT NULL,
  title       TEXT         NOT NULL,
  description TEXT,
  date        TIMESTAMPTZ  NOT NULL,
  status      event_status NOT NULL DEFAULT 'pending',
  created_by  UUID,  -- referenciará auth.users cuando se implemente auth
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Maintenance events: extiende events con asset y parámetros medidos
CREATE TABLE maintenance_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  asset_id   UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  -- [{name: string, value: string|number|boolean, type: 'text'|'number'|'boolean'}]
  parameters JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Obra events: extiende events con info del contratista
CREATE TABLE obra_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contractor TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_set_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security — políticas permisivas para desarrollo
ALTER TABLE assets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_events        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dev_allow_all" ON assets             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON events             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON maintenance_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON obra_events        FOR ALL USING (true) WITH CHECK (true);
