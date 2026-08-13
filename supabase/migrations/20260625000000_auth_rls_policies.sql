-- DOM-14: Actualizar RLS para requerir autenticación
-- Reemplaza políticas permisivas (dev_allow_all) por autenticación obligatoria.
-- Cualquier usuario autenticado puede ver y modificar todos los assets y eventos.

-- assets
DROP POLICY IF EXISTS "dev_allow_all" ON assets;
CREATE POLICY "require_auth" ON assets
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- events
DROP POLICY IF EXISTS "dev_allow_all" ON events;
CREATE POLICY "require_auth" ON events
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- event_parameter_values
DROP POLICY IF EXISTS "dev_allow_all" ON event_parameter_values;
CREATE POLICY "require_auth" ON event_parameter_values
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
