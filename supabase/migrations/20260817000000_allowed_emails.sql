-- DOM-37: restringir el acceso a Domus solo a emails autorizados de antemano.
-- Domus es una app de dos personas — cualquiera con cuenta de Google podía
-- loguearse hasta ahora, porque Supabase auto-crea el usuario en auth.users
-- al autenticar. El trigger bloquea esa alta a nivel de base, no solo en la UI.

CREATE TABLE allowed_emails (
  email TEXT PRIMARY KEY
);

INSERT INTO allowed_emails (email) VALUES
  ('mdoti92@gmail.com'),
  ('mariajosepalomequer@gmail.com');

-- Sin policies: nadie accede vía API pública (mismo criterio que
-- google_calendar_connections). Solo el trigger SECURITY DEFINER y el
-- dashboard/SQL editor pueden leer o modificar esta tabla.
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reject_unauthorized_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.allowed_emails WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: % no tiene acceso a Domus', NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reject_unauthorized_signup_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.reject_unauthorized_signup();
