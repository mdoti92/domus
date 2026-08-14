// DOM-20: job programado (vía pg_cron, cada 15 min) que detecta recordatorios
// vencidos y los encola en notification_dispatch_log para que push/mail (DOM-21,
// DOM-22) los consuman.
//
// El algoritmo de "próxima ocurrencia" y "recordatorios vencidos" espeja
// lib/eventNotificationSchedule.ts del proyecto Expo (DOM-18). Se porta acá
// en vez de importarse porque las Edge Functions corren en un runtime Deno
// separado del bundle de la app.

import { createClient } from 'npm:@supabase/supabase-js@2';

type NotificationTimeUnit = 'hour' | 'day' | 'week' | 'month' | 'year';
type RecurrenceType = 'date' | 'interval';

interface RecurrenceConfig {
  enabled: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_date: string | null;
  recurrence_interval_value: number | null;
  recurrence_interval_unit: NotificationTimeUnit | null;
  notify_all_household: boolean;
  event_notification_reminders: ReminderRow[];
  event_notification_recipients: { household_member_id: string }[];
}

interface ReminderRow {
  id: string;
  offset_value: number;
  offset_unit: NotificationTimeUnit;
}

interface EventRow {
  id: string;
  date: string;
  event_notification_configs: RecurrenceConfig | RecurrenceConfig[] | null;
}

const MS_PER_UNIT: Record<'hour' | 'day' | 'week', number> = {
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
  week: 1000 * 60 * 60 * 24 * 7,
};

function addInterval(date: Date, value: number, unit: NotificationTimeUnit): Date {
  if (unit === 'month') {
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + value);
    return result;
  }
  if (unit === 'year') {
    const result = new Date(date);
    result.setUTCFullYear(result.getUTCFullYear() + value);
    return result;
  }
  return new Date(date.getTime() + value * MS_PER_UNIT[unit]);
}

function calculateNextOccurrence(eventDate: string, config: RecurrenceConfig | null): Date | null {
  if (!config || !config.enabled) return null;

  if (config.recurrence_type === 'date' && config.recurrence_date) {
    return new Date(config.recurrence_date);
  }

  if (
    config.recurrence_type === 'interval' &&
    config.recurrence_interval_value != null &&
    config.recurrence_interval_unit
  ) {
    return addInterval(new Date(eventDate), config.recurrence_interval_value, config.recurrence_interval_unit);
  }

  return null;
}

function getDueReminders(
  eventDate: string,
  config: RecurrenceConfig | null,
  reminders: ReminderRow[],
  now: Date
): ReminderRow[] {
  const nextOccurrence = calculateNextOccurrence(eventDate, config);
  if (!nextOccurrence) return [];

  return reminders.filter((reminder) => {
    const dueAt = addInterval(nextOccurrence, -reminder.offset_value, reminder.offset_unit);
    return now.getTime() >= dueAt.getTime();
  });
}

const CHANNELS = ['push', 'email'] as const;

const EVENTS_SELECT = `id, date, event_notification_configs!inner(
  enabled, recurrence_type, recurrence_date, recurrence_interval_value, recurrence_interval_unit, notify_all_household,
  event_notification_reminders(id, offset_value, offset_unit),
  event_notification_recipients(household_member_id)
)`;

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select(EVENTS_SELECT)
    .eq('event_notification_configs.enabled', true);

  if (eventsError) {
    console.error('detect-due-reminders: failed to load events', eventsError);
    return new Response(JSON.stringify({ error: eventsError.message }), { status: 500 });
  }

  const { data: allMembers, error: membersError } = await supabase.from('household_members').select('id');
  if (membersError) {
    console.error('detect-due-reminders: failed to load household_members', membersError);
    return new Response(JSON.stringify({ error: membersError.message }), { status: 500 });
  }
  const allMemberIds = (allMembers ?? []).map((m: { id: string }) => m.id);

  const rowsToInsert: { event_id: string; reminder_id: string; recipient_id: string; channel: string }[] = [];

  for (const row of (events ?? []) as unknown as EventRow[]) {
    const config = Array.isArray(row.event_notification_configs)
      ? row.event_notification_configs[0]
      : row.event_notification_configs;
    if (!config) continue;

    const dueReminders = getDueReminders(row.date, config, config.event_notification_reminders, now);
    if (dueReminders.length === 0) continue;

    const recipients = config.notify_all_household
      ? allMemberIds
      : config.event_notification_recipients.map((r) => r.household_member_id);

    for (const reminder of dueReminders) {
      for (const recipientId of recipients) {
        for (const channel of CHANNELS) {
          rowsToInsert.push({ event_id: row.id, reminder_id: reminder.id, recipient_id: recipientId, channel });
        }
      }
    }
  }

  if (rowsToInsert.length === 0) {
    console.log(`detect-due-reminders: evaluated ${events?.length ?? 0} events, nothing due`);
    return new Response(JSON.stringify({ ok: true, evaluatedEvents: events?.length ?? 0, inserted: 0 }), { status: 200 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('notification_dispatch_log')
    .upsert(rowsToInsert, { onConflict: 'event_id,reminder_id,recipient_id,channel', ignoreDuplicates: true })
    .select('id');

  if (insertError) {
    console.error('detect-due-reminders: failed to insert dispatch rows', insertError);
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  console.log(
    `detect-due-reminders: evaluated ${events?.length ?? 0} events, inserted ${inserted?.length ?? 0} dispatch rows (of ${rowsToInsert.length} candidates)`
  );

  return new Response(
    JSON.stringify({ ok: true, evaluatedEvents: events?.length ?? 0, candidates: rowsToInsert.length, inserted: inserted?.length ?? 0 }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
