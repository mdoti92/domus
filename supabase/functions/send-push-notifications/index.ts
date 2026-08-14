// DOM-21: consume las filas "pending" de canal push en notification_dispatch_log
// (encoladas por DOM-20) y las envía vía Expo Push API.

import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

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
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: pending, error: pendingError } = await supabase
    .from('notification_dispatch_log')
    .select('id, event_id, events(date, assets(name)), household_members(user_id)')
    .eq('status', 'pending')
    .eq('channel', 'push');

  if (pendingError) {
    console.error('send-push-notifications: failed to load pending rows', pendingError);
    return new Response(JSON.stringify({ error: pendingError.message }), { status: 500 });
  }

  const rows = (pending ?? []) as unknown as PendingRow[];

  if (rows.length === 0) {
    console.log('send-push-notifications: nothing pending');
    return new Response(JSON.stringify({ ok: true, processed: 0, sent: 0, failed: 0 }), { status: 200 });
  }

  const userIds = [
    ...new Set(
      rows
        .map((r) => toSingle(r.household_members)?.user_id)
        .filter((v): v is string => Boolean(v))
    ),
  ];

  const { data: tokenRows, error: tokensError } = await supabase
    .from('push_tokens')
    .select('user_id, expo_push_token')
    .in('user_id', userIds);

  if (tokensError) {
    console.error('send-push-notifications: failed to load push tokens', tokensError);
    return new Response(JSON.stringify({ error: tokensError.message }), { status: 500 });
  }

  const tokensByUser = new Map<string, string[]>();
  for (const t of (tokenRows ?? []) as { user_id: string; expo_push_token: string }[]) {
    const list = tokensByUser.get(t.user_id) ?? [];
    list.push(t.expo_push_token);
    tokensByUser.set(t.user_id, list);
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const eventInfo = toSingle(row.events);
    const asset = eventInfo ? toSingle(eventInfo.assets) : null;
    const userId = toSingle(row.household_members)?.user_id;
    const tokens = userId ? tokensByUser.get(userId) ?? [] : [];

    if (tokens.length === 0) {
      await supabase
        .from('notification_dispatch_log')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', row.id);
      failed++;
      continue;
    }

    const title = asset?.name ?? 'Domus';
    const body = eventInfo
      ? `Tenés un recordatorio pendiente para el ${formatEventDate(eventInfo.date)}`
      : 'Tenés un recordatorio pendiente';

    const messages = tokens.map((to) => ({ to, title, body, data: { eventId: row.event_id } }));

    let anySent = false;
    try {
      const resp = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      const result = await resp.json();
      const tickets = Array.isArray(result?.data) ? result.data : [];
      anySent = tickets.some((ticket: { status: string }) => ticket.status === 'ok');
    } catch (err) {
      console.error(`send-push-notifications: Expo Push API call failed for row ${row.id}`, err);
    }

    await supabase
      .from('notification_dispatch_log')
      .update({ status: anySent ? 'sent' : 'failed', updated_at: new Date().toISOString() })
      .eq('id', row.id);

    if (anySent) sent++;
    else failed++;
  }

  console.log(`send-push-notifications: processed ${rows.length} rows, sent=${sent}, failed=${failed}`);

  return new Response(JSON.stringify({ ok: true, processed: rows.length, sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
