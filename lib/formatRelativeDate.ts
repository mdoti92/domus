function toUTCCalendarDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function formatRelativeDate(dateStr: string, now?: Date): string {
  const parsedDate = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00Z');
  const date = toUTCCalendarDay(parsedDate);
  const today = toUTCCalendarDay(now ?? new Date());

  const diffDays = Math.round((today - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 30) return `hace ${diffDays} días`;

  const months = Math.floor(diffDays / 30);
  if (months < 12) return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;

  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}
