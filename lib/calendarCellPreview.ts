import { DayItem } from './calendarDayActivity';

export interface CellPreview {
  visibleItems: DayItem[];
  overflowCount: number;
}

// DOM-33: qué ítems mostrar dentro de la celda de un día y cuántos quedan
// afuera del "+N más", según cuántas líneas entran (varía por ancho de
// pantalla, CA5 — el caller decide maxVisible).
export function getCellPreview(items: DayItem[], maxVisible: number): CellPreview {
  if (items.length <= maxVisible) {
    return { visibleItems: items, overflowCount: 0 };
  }
  return { visibleItems: items.slice(0, maxVisible), overflowCount: items.length - maxVisible };
}
