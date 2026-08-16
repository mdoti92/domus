import { DayItem } from './calendarDayActivity';

export type EventVisualStatus = 'past' | 'scheduled' | 'overdue' | 'tentative';

// DOM-35: cómo se ve cada ítem del calendario según su estado. "hoy" cuenta
// como no vencido todavía para un pending (CA2/CA3) — recién pasa a "overdue"
// al día siguiente. Un evento done o cancelled se trata siempre como "past",
// independientemente de la fecha (marcarlo así ya es la señal que importa).
export function getEventVisualStatus(item: DayItem, dateISO: string, todayISO: string): EventVisualStatus {
  if (item.type === 'next_occurrence') return 'tentative';
  if (item.status === 'done' || item.status === 'cancelled') return 'past';
  return dateISO < todayISO ? 'overdue' : 'scheduled';
}
