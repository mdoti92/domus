import { RecurrenceConfig, calculateNextOccurrence } from './eventNotificationSchedule';
import { toISODate } from './calendarGrid';

export interface RecurringEventInput {
  date: string;
  config: RecurrenceConfig;
}

// DOM-28: combina dos fuentes de actividad para marcar días en el calendario
// de Inicio — eventos ya registrados, y la próxima ocurrencia (única, no una
// proyección de todo el ciclo) de eventos con recurrencia activa, misma
// lógica de cálculo que DOM-18.
export function getMarkedDates(eventDates: string[], recurringEvents: RecurringEventInput[]): Set<string> {
  const marked = new Set<string>();

  for (const date of eventDates) {
    marked.add(toISODate(new Date(date)));
  }

  for (const { date, config } of recurringEvents) {
    const nextOccurrence = calculateNextOccurrence(date, config);
    if (nextOccurrence) marked.add(toISODate(nextOccurrence));
  }

  return marked;
}
