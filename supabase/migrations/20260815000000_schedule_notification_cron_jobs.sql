-- DOM-25: instala pg_cron y pg_net, y programa las 3 Edge Functions de notificaciones
-- (DOM-20/21/22) para que corran solas cada 15 minutos, sin invocacion manual.
--
-- Encadenamiento: detect-due-reminders corre en :00/:15/:30/:45 y encola en
-- notification_dispatch_log; send-push-notifications y send-email-notifications corren
-- 2 minutos despues (:02/:17/:32/:47) para que la cola tenga datos frescos (CA3).
--
-- Las 3 Edge Functions se redeployaron con verify_jwt=false (antes exigian un JWT
-- valido en el header Authorization). Estan pensadas para invocarse solo desde este
-- cron interno y ya usan su propio SUPABASE_SERVICE_ROLE_KEY via env vars para acceder
-- a la base -- no dependen de la identidad del caller. net.http_post es asincronico:
-- encola el request y devuelve un request_id, no espera la respuesta de la funcion.
--
-- timeout_milliseconds=10000: el default de net.http_post (5000ms) no alcanza para
-- un cold start de la funcion (~7.6s medido en la primera corrida real), asi que
-- pg_net registraba un timeout en net._http_response aunque la funcion terminaba
-- bien (200, confirmado en function_edge_logs).
--
-- Nota de seguridad: el linter de Supabase marca pg_net como instalado en el
-- schema public (extension_in_public, WARN). No se puede mover con
-- ALTER EXTENSION ... SET SCHEMA (pg_net no lo soporta); sus funciones ya viven
-- en el schema "net", no expuesto por PostgREST, asi que el riesgo real es bajo.
-- Queda como posible item de seguimiento si se quiere resolver el WARN.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'detect-due-reminders-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qkipfmjykzslhxdgwlxw.supabase.co/functions/v1/detect-due-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'send-push-notifications-every-15-min',
  '2,17,32,47 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qkipfmjykzslhxdgwlxw.supabase.co/functions/v1/send-push-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'send-email-notifications-every-15-min',
  '2,17,32,47 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qkipfmjykzslhxdgwlxw.supabase.co/functions/v1/send-email-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  ) AS request_id;
  $$
);
