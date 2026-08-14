import { getCalendarMonthGrid } from '../../lib/calendarGrid';

describe('getCalendarMonthGrid', () => {
  it('returns exactly 42 days (6 full weeks)', () => {
    expect(getCalendarMonthGrid(2026, 7)).toHaveLength(42);
  });

  it('starts the grid on a Monday', () => {
    const grid = getCalendarMonthGrid(2026, 7);
    expect(grid[0].date.getUTCDay()).toBe(1);
  });

  it('includes the 1st of the target month marked as inCurrentMonth', () => {
    const grid = getCalendarMonthGrid(2026, 7); // August 2026 (0-indexed month)
    const firstOfMonth = grid.find((d) => d.date.getUTCDate() === 1 && d.date.getUTCMonth() === 7);
    expect(firstOfMonth).toBeDefined();
    expect(firstOfMonth!.inCurrentMonth).toBe(true);
  });

  it('marks leading days from the previous month as not inCurrentMonth', () => {
    const grid = getCalendarMonthGrid(2026, 7);
    const leadingDays = grid.filter((d) => d.date.getUTCMonth() !== 7);
    for (const day of leadingDays) {
      expect(day.inCurrentMonth).toBe(false);
    }
  });

  it('produces consecutive days with no gaps', () => {
    const grid = getCalendarMonthGrid(2026, 7);
    for (let i = 1; i < grid.length; i++) {
      const diff = grid[i].date.getTime() - grid[i - 1].date.getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('handles December correctly (month rollover into next year)', () => {
    const grid = getCalendarMonthGrid(2026, 11);
    const firstOfMonth = grid.find((d) => d.date.getUTCDate() === 1 && d.date.getUTCMonth() === 11);
    expect(firstOfMonth).toBeDefined();
    expect(firstOfMonth!.inCurrentMonth).toBe(true);
  });
});
