import { formatRelativeDate } from '../../lib/formatRelativeDate';

const makeNow = (dateStr: string) => new Date(dateStr + 'T12:00:00');

describe('formatRelativeDate', () => {
  it('returns "hoy" for today', () => {
    expect(formatRelativeDate('2026-06-25', makeNow('2026-06-25'))).toBe('hoy');
  });

  it('returns "ayer" for yesterday', () => {
    expect(formatRelativeDate('2026-06-24', makeNow('2026-06-25'))).toBe('ayer');
  });

  it('returns "hace X días" for 2-29 days', () => {
    expect(formatRelativeDate('2026-06-22', makeNow('2026-06-25'))).toBe('hace 3 días');
    expect(formatRelativeDate('2026-06-12', makeNow('2026-06-25'))).toBe('hace 13 días');
    expect(formatRelativeDate('2026-05-27', makeNow('2026-06-25'))).toBe('hace 29 días');
  });

  it('returns "hace 1 mes" for ~30 days', () => {
    expect(formatRelativeDate('2026-05-26', makeNow('2026-06-25'))).toBe('hace 1 mes');
  });

  it('returns "hace X meses" for 2-11 months', () => {
    expect(formatRelativeDate('2026-04-25', makeNow('2026-06-25'))).toBe('hace 2 meses');
    expect(formatRelativeDate('2025-07-25', makeNow('2026-06-25'))).toBe('hace 11 meses');
  });

  it('returns "hace 1 año" for ~365 days', () => {
    expect(formatRelativeDate('2025-06-25', makeNow('2026-06-25'))).toBe('hace 1 año');
  });

  it('returns "hace X años" for 2+ years', () => {
    expect(formatRelativeDate('2024-06-25', makeNow('2026-06-25'))).toBe('hace 2 años');
  });

  it('handles a full timestamp with UTC offset, not just a plain date', () => {
    expect(formatRelativeDate('2026-06-25T00:00:00+00:00', makeNow('2026-06-25'))).toBe('hoy');
    expect(formatRelativeDate('2026-06-24T00:00:00+00:00', makeNow('2026-06-25'))).toBe('ayer');
    expect(formatRelativeDate('2026-06-22T15:30:00+00:00', makeNow('2026-06-25'))).toBe('hace 3 días');
  });
});
