// DOM-22: consume las filas "pending" de canal email en notification_dispatch_log
// (encoladas por DOM-20) y las envía por SMTP de Gmail usando una "Contraseña
// de aplicación" — nunca hardcodeada, se lee de los secretos de Supabase
// (GMAIL_USER, GMAIL_APP_PASSWORD). Si no están configurados, la función
// frena con un error explícito en vez de intentar enviar.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

interface AssetRow {
  name: string;
}

interface EventRow {
  date: string;
  assets: AssetRow | AssetRow[] | null;
}

interface HouseholdMemberRow {
  user_id: string;
}

interface PendingRow {
  id: string;
  event_id: string;
  events: EventRow | EventRow[] | null;
  household_members: HouseholdMemberRow | HouseholdMemberRow[] | null;
}

function toSingle<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

Deno.serve(async () => {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');

  if (!gmailUser || !gmailAppPassword) {
    console.error('send-email-notifications: missing GMAIL_USER or GMAIL_APP_PASSWORD secret');
    return new Response(
      JSON.stringify({
        error:
          'Faltan las credenciales de Gmail. Configurá los secretos GMAIL_USER y GMAIL_APP_PASSWORD en el proyecto de Supabase (Edge Functions → Manage secrets).',
      }),
      { status: 500 }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: pending, error: pendingError } = await supabase
    .from('notification_dispatch_log')
    .select('id, event_id, events(date, assets(name)), household_members(user_id)')
    .eq('status', 'pending')
    .eq('channel', 'email');

  if (pendingError) {
    console.error('send-email-notifications: failed to load pending rows', pendingError);
    return new Response(JSON.stringify({ error: pendingError.message }), { status: 500 });
  }

  const rows = (pending ?? []) as unknown as PendingRow[];

  if (rows.length === 0) {
    console.log('send-email-notifications: nothing pending');
    return new Response(JSON.stringify({ ok: true, processed: 0, sent: 0, failed: 0 }), { status: 200 });
  }

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailAppPassword },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const eventInfo = toSingle(row.events);
    const asset = eventInfo ? toSingle(eventInfo.assets) : null;
    const userId = toSingle(row.household_members)?.user_id;

    const { data: userData, error: userError } = userId
      ? await supabase.auth.admin.getUserById(userId)
      : { data: null, error: new Error('missing recipient user_id') };

    const recipientEmail = userData?.user?.email;

    if (userError || !recipientEmail) {
      console.error(`send-email-notifications: no email for row ${row.id}`, userError);
      await supabase
        .from('notification_dispatch_log')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      failed++;
      continue;
    }

    const assetName = asset?.name ?? 'Domus';
    const dueText = eventInfo
      ? `Tenés un recordatorio pendiente para el ${formatEventDate(eventInfo.date)}.`
      : 'Tenés un recordatorio pendiente.';

    try {
      await client.send({
        from: gmailUser,
        to: recipientEmail,
        subject: `Domus — Recordatorio: ${assetName}`,
        content: `${assetName}\n\n${dueText}`,
      });

      await supabase
        .from('notification_dispatch_log')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      sent++;
    } catch (err) {
      console.error(`send-email-notifications: SMTP send failed for row ${row.id}`, err);
      await supabase
        .from('notification_dispatch_log')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      failed++;
    }
  }

  await client.close();

  console.log(`send-email-notifications: processed ${rows.length} rows, sent=${sent}, failed=${failed}`);

  return new Response(JSON.stringify({ ok: true, processed: rows.length, sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
