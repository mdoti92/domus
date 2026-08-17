import { groupAssetsByCategory } from '../../lib/groupAssetsByCategory';
import { Asset } from '../../types';

const makeAsset = (overrides: Partial<Asset>): Asset => ({
  id: '1',
  name: 'Test',
  category: 'Mantenimiento',
  icon: null,
  parameter_definitions: [],
  person_id: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  ...overrides,
});

describe('groupAssetsByCategory', () => {
  it('returns empty object for empty array', () => {
    expect(groupAssetsByCategory([])).toEqual({});
  });

  it('groups assets under their category', () => {
    const assets = [
      makeAsset({ id: '1', category: 'Mantenimiento' }),
      makeAsset({ id: '2', category: 'Médico' }),
      makeAsset({ id: '3', category: 'Mantenimiento' }),
    ];

    const result = groupAssetsByCategory(assets);

    expect(Object.keys(result)).toHaveLength(2);
    expect(result['Mantenimiento']).toHaveLength(2);
    expect(result['Médico']).toHaveLength(1);
  });

  it('preserves asset order within each category', () => {
    const assets = [
      makeAsset({ id: '1', name: 'Piscina', category: 'Mantenimiento' }),
      makeAsset({ id: '2', name: 'Auto', category: 'Mantenimiento' }),
    ];

    const result = groupAssetsByCategory(assets);

    expect(result['Mantenimiento'][0].name).toBe('Piscina');
    expect(result['Mantenimiento'][1].name).toBe('Auto');
  });

  it('handles a single asset', () => {
    const assets = [makeAsset({ id: '1', category: 'Obra' })];

    const result = groupAssetsByCategory(assets);

    expect(result['Obra']).toHaveLength(1);
  });
});
