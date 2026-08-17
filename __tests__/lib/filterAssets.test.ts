import { filterAssetsByName } from '../../lib/filterAssets';
import { Asset } from '../../types';

const makeAsset = (name: string): Asset => ({
  id: name,
  name,
  category: 'Mantenimiento',
  icon: null,
  parameter_definitions: [],
  person_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const assets = [makeAsset('Piscina'), makeAsset('Lavarropas Samsung'), makeAsset('Auto')];

describe('filterAssetsByName', () => {
  it('returns every asset when the query is empty (CA2)', () => {
    expect(filterAssetsByName(assets, '')).toEqual(assets);
  });

  it('matches case-insensitively and by partial name', () => {
    expect(filterAssetsByName(assets, 'lava')).toEqual([makeAsset('Lavarropas Samsung')]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterAssetsByName(assets, 'heladera')).toEqual([]);
  });

  it('ignores surrounding whitespace in the query', () => {
    expect(filterAssetsByName(assets, '  piscina  ')).toEqual([makeAsset('Piscina')]);
  });
});
