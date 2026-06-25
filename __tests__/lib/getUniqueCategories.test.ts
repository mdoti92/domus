import { getUniqueCategories } from '../../lib/getUniqueCategories';
import { AssetWithLastEvent } from '../../types';

function makeAsset(id: string, category: string): AssetWithLastEvent {
  return {
    id,
    name: `Asset ${id}`,
    category,
    icon: null,
    parameter_definitions: [],
    created_at: '2026-06-25T00:00:00Z',
    updated_at: '2026-06-25T00:00:00Z',
    lastEvent: null,
  };
}

describe('getUniqueCategories', () => {
  it('returns empty array for empty assets', () => {
    expect(getUniqueCategories([])).toEqual([]);
  });

  it('returns single category for all same category', () => {
    const assets = [makeAsset('1', 'Mantenimiento'), makeAsset('2', 'Mantenimiento')];
    expect(getUniqueCategories(assets)).toEqual(['Mantenimiento']);
  });

  it('returns multiple unique categories', () => {
    const assets = [
      makeAsset('1', 'Mantenimiento'),
      makeAsset('2', 'Médico'),
      makeAsset('3', 'Obra'),
    ];
    const result = getUniqueCategories(assets);
    expect(result).toHaveLength(3);
    expect(result).toContain('Mantenimiento');
    expect(result).toContain('Médico');
    expect(result).toContain('Obra');
  });

  it('deduplicates repeated categories', () => {
    const assets = [
      makeAsset('1', 'Médico'),
      makeAsset('2', 'Mantenimiento'),
      makeAsset('3', 'Médico'),
      makeAsset('4', 'Mantenimiento'),
    ];
    expect(getUniqueCategories(assets)).toHaveLength(2);
  });

  it('preserves insertion order of first appearance', () => {
    const assets = [
      makeAsset('1', 'Obra'),
      makeAsset('2', 'Médico'),
      makeAsset('3', 'Mantenimiento'),
      makeAsset('4', 'Médico'),
    ];
    expect(getUniqueCategories(assets)).toEqual(['Obra', 'Médico', 'Mantenimiento']);
  });
});
