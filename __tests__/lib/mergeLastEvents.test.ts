import { mergeLastEvents } from '../../lib/mergeLastEvents';
import { Asset } from '../../types';

const makeAsset = (id: string): Asset => ({
  id,
  name: `Asset ${id}`,
  category: 'Mantenimiento',
  icon: null,
  parameter_definitions: [],
  person_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const makeEvent = (assetId: string, date: string, notes: string | null = null) => ({
  asset_id: assetId,
  date,
  notes,
});

describe('mergeLastEvents', () => {
  it('returns assets with lastEvent null when events array is empty', () => {
    const assets = [makeAsset('a1'), makeAsset('a2')];
    const result = mergeLastEvents(assets, []);

    expect(result[0].lastEvent).toBeNull();
    expect(result[1].lastEvent).toBeNull();
  });

  it('picks the first (most recent) event per asset when events are sorted desc', () => {
    const assets = [makeAsset('a1')];
    const events = [
      makeEvent('a1', '2026-06-20'),
      makeEvent('a1', '2026-05-10'),
      makeEvent('a1', '2026-04-01'),
    ];

    const result = mergeLastEvents(assets, events);

    expect(result[0].lastEvent?.date).toBe('2026-06-20');
  });

  it('includes notes in lastEvent when present', () => {
    const assets = [makeAsset('a1')];
    const events = [makeEvent('a1', '2026-06-20', 'pH bajo, agregar cloro')];

    const result = mergeLastEvents(assets, events);

    expect(result[0].lastEvent?.notes).toBe('pH bajo, agregar cloro');
  });

  it('assigns null lastEvent to assets with no matching events', () => {
    const assets = [makeAsset('a1'), makeAsset('a2')];
    const events = [makeEvent('a1', '2026-06-20')];

    const result = mergeLastEvents(assets, events);

    expect(result.find(a => a.id === 'a1')?.lastEvent?.date).toBe('2026-06-20');
    expect(result.find(a => a.id === 'a2')?.lastEvent).toBeNull();
  });

  it('correctly assigns different last events to different assets', () => {
    const assets = [makeAsset('a1'), makeAsset('a2')];
    const events = [
      makeEvent('a2', '2026-06-25'),
      makeEvent('a1', '2026-06-20'),
      makeEvent('a1', '2026-05-01'),
    ];

    const result = mergeLastEvents(assets, events);

    expect(result.find(a => a.id === 'a1')?.lastEvent?.date).toBe('2026-06-20');
    expect(result.find(a => a.id === 'a2')?.lastEvent?.date).toBe('2026-06-25');
  });

  it('preserves all original asset fields', () => {
    const asset = makeAsset('a1');
    asset.name = 'Piscina';
    asset.category = 'Mantenimiento';

    const result = mergeLastEvents([asset], []);

    expect(result[0].name).toBe('Piscina');
    expect(result[0].category).toBe('Mantenimiento');
  });
});
