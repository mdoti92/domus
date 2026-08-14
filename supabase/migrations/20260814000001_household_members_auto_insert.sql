-- DOM-17: alta automática en household_members
-- DOM-16 dejó fuera de scope cómo se puebla la tabla. Como el hogar es
-- compartido entre todos los usuarios autenticados (mismo criterio que el
-- resto del schema desde DOM-14), el criterio más simple es: cada usuario
-- que se registra pasa a ser un integrante del hogar automáticamente.

CREATE OR REPLACE FUNCTION public.handle_new_user_household_member()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.household_members (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_household_member
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_household_member();

-- Backfill: usuarios que ya existían antes de este trigger
INSERT INTO public.household_members (user_id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.household_members hm WHERE hm.user_id = u.id
);
