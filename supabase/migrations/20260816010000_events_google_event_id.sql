-- DOM-32: guarda el id del evento espejo en el calendario de Google, para
-- poder actualizarlo/borrarlo más adelante en vez de crear uno nuevo cada vez.
-- Nullable: un evento sin conexión de Google activa (o creado antes de
-- conectarla) simplemente no tiene espejo todavía.

ALTER TABLE events ADD COLUMN google_event_id TEXT;
