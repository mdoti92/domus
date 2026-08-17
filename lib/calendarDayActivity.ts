import { EventStatus } from '../types';
import { RecurrenceConfig, calculateNextOccurrence } from './eventNotificationSchedule';
import { toISODate } from './calendarGrid';

export interface EventActivityRecord {
  id: string;
  date: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  status: EventStatus;
  config: RecurrenceConfig | null;
}

export interface DayEventItem {
  type: 'event';
  eventId: string;
  assetId: string;
  assetName: string;
  assetCategory: string;
  status: EventStatus;
}

export interface DayOccurrenceItem {
  type: 'next_occurrence';
  assetId: string;
  assetName: string;
  assetCategory: string;
}

export type DayItem = DayEventItem | DayOccurrenceItem;

// DOM-29: para un día puntual, arma la lista que se muestra al tocarlo en el
// calendario de DOM-28 — misma combinación de fuentes que getMarkedDates
// (evento registrado ese día / próxima ocurrencia de una recurrencia activa),
// pero acá cada ítem lleva la identidad necesaria para navegar (CA2/CA3) y,
// para eventos reales, su status (DOM-35 lo usa para el estilo visual).
export function getDayItems(dateISO: string, records: EventActivityRecord[]): DayItem[] {
  const items: DayItem[] = [];

  for (const record of records) {
    if (toISODate(new Date(record.date)) === dateISO) {
      items.push({
        type: 'event',
        eventId: record.id,
        assetId: record.assetId,
        assetName: record.assetName,
        assetCategory: record.assetCategory,
        status: record.status,
      });
    }

    if (record.config) {
      const nextOccurrence = calculateNextOccurrence(record.date, record.config);
      if (nextOccurrence && toISODate(nextOccurrence) === dateISO) {
        items.push({
          type: 'next_occurrence',
          assetId: record.assetId,
          assetName: record.assetName,
          assetCategory: record.assetCategory,
        });
      }
    }
  }

  return items;
}
