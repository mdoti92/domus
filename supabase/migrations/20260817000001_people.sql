-- DOM-38: entidad Persona para miembros del hogar sin cuenta de usuario
-- (ej. hijas, mascotas) — necesaria para asociar eventos médicos sin
-- crear una cuenta por cada una.

CREATE TABLE people (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  relationship TEXT,
  birth_date   DATE,
  icon         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER people_set_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sin ON DELETE CASCADE a propósito (CA5): borrar una persona con Assets
-- asociados debe fallar explícitamente, no arrastrar el borrado en cascada.
ALTER TABLE assets ADD COLUMN person_id UUID REFERENCES people(id) ON DELETE RESTRICT;

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "require_auth" ON people
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
