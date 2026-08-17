import { formatDayTitle } from '../../components/modules/home/DayActivitySheet';

describe('formatDayTitle', () => {
  it('formats the date fully in lowercase (no CSS capitalize is applied to it)', () => {
    expect(formatDayTitle('2026-08-14')).toBe('14 de agosto 2026');
  });

  it('formats a single-digit day and month correctly', () => {
    expect(formatDayTitle('2026-01-05')).toBe('5 de enero 2026');
  });
});
