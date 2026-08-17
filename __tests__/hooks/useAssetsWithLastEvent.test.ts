import { renderHook, waitFor } from '@testing-library/react-native';
import { useAssetsWithLastEvent } from '../../hooks/useAssetsWithLastEvent';
import { supabase } from '../../lib/supabase';
import { Asset } from '../../types';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makeAsset = (id: string, overrides: Partial<Asset> = {}): Asset => ({
  id,
  name: `Asset ${id}`,
  category: 'Mantenimiento',
  icon: null,
  parameter_definitions: [],
  person_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeAssetsChain = (result: { data: Asset[] | null; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    order: jest.fn().mockResolvedValue(result),
  }),
});

const makeEventsChain = (result: { data: Array<{ asset_id: string; date: string; notes: string | null }> | null; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    in: jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue(result),
    }),
  }),
});

describe('useAssetsWithLastEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with loading true', () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeAssetsChain({ data: [], error: null })
    );

    const { result } = renderHook(() => useAssetsWithLastEvent());
    expect(result.current.loading).toBe(true);
  });

  it('returns empty array when no assets', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeAssetsChain({ data: [], error: null })
    );

    const { result } = renderHook(() => useAssetsWithLastEvent());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.assets).toEqual([]);
  });

  it('returns assets with lastEvent null when no events exist', async () => {
    const assets = [makeAsset('a1'), makeAsset('a2')];
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetsChain({ data: assets, error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: [], error: null }));

    const { result } = renderHook(() => useAssetsWithLastEvent());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.assets[0].lastEvent).toBeNull();
    expect(result.current.assets[1].lastEvent).toBeNull();
  });

  it('returns assets with lastEvent populated from the most recent event', async () => {
    const assets = [makeAsset('a1')];
    const events = [
      { asset_id: 'a1', date: '2026-06-20', notes: 'pH corregido' },
      { asset_id: 'a1', date: '2026-05-10', notes: null },
    ];
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetsChain({ data: assets, error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: events, error: null }));

    const { result } = renderHook(() => useAssetsWithLastEvent());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.assets[0].lastEvent?.date).toBe('2026-06-20');
    expect(result.current.assets[0].lastEvent?.notes).toBe('pH corregido');
  });

  it('assigns different last events to different assets', async () => {
    const assets = [makeAsset('a1'), makeAsset('a2')];
    const events = [
      { asset_id: 'a2', date: '2026-06-25', notes: null },
      { asset_id: 'a1', date: '2026-06-20', notes: null },
    ];
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetsChain({ data: assets, error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: events, error: null }));

    const { result } = renderHook(() => useAssetsWithLastEvent());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const a1 = result.current.assets.find(a => a.id === 'a1');
    const a2 = result.current.assets.find(a => a.id === 'a2');
    expect(a1?.lastEvent?.date).toBe('2026-06-20');
    expect(a2?.lastEvent?.date).toBe('2026-06-25');
  });

  it('sets error when assets fetch fails', async () => {
    const dbError = { message: 'Network error', code: '500' };
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeAssetsChain({ data: null, error: dbError })
    );

    const { result } = renderHook(() => useAssetsWithLastEvent());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(dbError);
    expect(result.current.assets).toEqual([]);
  });

  it('still returns assets with null lastEvent when events fetch fails', async () => {
    const assets = [makeAsset('a1')];
    const dbError = { message: 'events failed', code: '500' };
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetsChain({ data: assets, error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: null, error: dbError }));

    const { result } = renderHook(() => useAssetsWithLastEvent());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.assets[0].id).toBe('a1');
    expect(result.current.assets[0].lastEvent).toBeNull();
  });
});
