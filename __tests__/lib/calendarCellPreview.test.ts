import { getCellPreview } from '../../lib/calendarCellPreview';
import { DayItem } from '../../lib/calendarDayActivity';

const item = (n: number): DayItem => ({
  type: 'event',
  eventId: `ev-${n}`,
  assetId: `asset-${n}`,
  assetName: `Asset ${n}`,
  status: 'pending',
});

describe('getCellPreview', () => {
  it('shows the single item with no overflow when there is one event (CA1)', () => {
    const result = getCellPreview([item(1)], 2);
    expect(result.visibleItems).toEqual([item(1)]);
    expect(result.overflowCount).toBe(0);
  });

  it('shows all items with no overflow when they fit exactly', () => {
    const result = getCellPreview([item(1), item(2)], 2);
    expect(result.visibleItems).toEqual([item(1), item(2)]);
    expect(result.overflowCount).toBe(0);
  });

  it('caps to maxVisible and reports the remainder as overflow (CA2)', () => {
    const result = getCellPreview([item(1), item(2), item(3)], 2);
    expect(result.visibleItems).toEqual([item(1), item(2)]);
    expect(result.overflowCount).toBe(1);
  });

  it('returns nothing extra for a day with no activity (CA3)', () => {
    const result = getCellPreview([], 2);
    expect(result.visibleItems).toEqual([]);
    expect(result.overflowCount).toBe(0);
  });

  it('respects a smaller maxVisible for narrow screens (CA5)', () => {
    const result = getCellPreview([item(1), item(2), item(3)], 1);
    expect(result.visibleItems).toEqual([item(1)]);
    expect(result.overflowCount).toBe(2);
  });
});
