import { DayItem } from './calendarDayActivity';

export type EventVisualOrigin = 'direct_log' | 'tentative_recurrence' | 'scheduled_future';

export interface EventVisualInfo {
  origin: EventVisualOrigin;
  overdue: boolean;
}

// DOM-36: reemplaza el esquema por estado de DOM-35 por uno por origen de
// creación. Un evento "pending" es siempre "scheduled_future" — si su fecha
// ya pasó sin marcarse done, se lo señala con overdue=true en vez de
// reclasificarlo como "direct_log" (CA4): el color representa cómo se creó
// el evento, no si está vencido.
export function getEventVisualOrigin(item: DayItem, dateISO: string, todayISO: string): EventVisualInfo {
  if (item.type === 'next_occurrence') {
    return { origin: 'tentative_recurrence', overdue: false };
  }

  if (item.status === 'pending') {
    return { origin: 'scheduled_future', overdue: dateISO < todayISO };
  }

  return { origin: 'direct_log', overdue: false };
}
