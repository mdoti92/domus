export function formatRelativeDate(dateStr: string, now?: Date): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = now ? new Date(now) : new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 30) return `hace ${diffDays} días`;

  const months = Math.floor(diffDays / 30);
  if (months < 12) return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;

  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}
