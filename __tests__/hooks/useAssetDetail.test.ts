import { renderHook, waitFor } from '@testing-library/react-native';
import { useAssetDetail } from '../../hooks/useAssetDetail';
import { supabase } from '../../lib/supabase';
import { Asset, EventWithValues } from '../../types';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makeAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'asset-1',
  name: 'Piscina',
  category: 'Mantenimiento',
  icon: '🏊',
  parameter_definitions: [
    { name: 'ph', type: 'number' },
    { name: 'cloro', type: 'number', unit: 'ppm' },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeEvent = (overrides: Partial<EventWithValues> = {}): EventWithValues => ({
  id: 'event-1',
  asset_id: 'asset-1',
  date: '2026-06-20',
  notes: null,
  status: 'done',
  created_at: '2026-06-20T10:00:00Z',
  updated_at: '2026-06-20T10:00:00Z',
  event_parameter_values: [
    {
      id: 'val-1',
      event_id: 'event-1',
      parameter_name: 'ph',
      parameter_value: '7.2',
      parameter_type: 'number',
      created_at: '2026-06-20T10:00:00Z',
    },
  ],
  ...overrides,
});

const orderMock = jest.fn();

const makeAssetChain = (result: { data: Asset | null; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(result),
    }),
  }),
});

const makeEventsChain = (result: { data: EventWithValues[] | null; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      order: orderMock.mockResolvedValue(result),
    }),
  }),
});

describe('useAssetDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with loading true', () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: makeAsset(), error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: [], error: null }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    expect(result.current.loading).toBe(true);
  });

  it('returns asset data after successful fetch', async () => {
    const asset = makeAsset();
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: asset, error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: [], error: null }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.asset).toEqual(asset);
    expect(result.current.error).toBeNull();
  });

  it('returns asset with parameter_definitions', async () => {
    const asset = makeAsset({
      parameter_definitions: [
        { name: 'ph', type: 'number' },
        { name: 'aspirado', type: 'boolean' },
      ],
    });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: asset, error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: [], error: null }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.asset?.parameter_definitions).toHaveLength(2);
    expect(result.current.asset?.parameter_definitions[0].name).toBe('ph');
  });

  it('returns events with parameter values', async () => {
    const events = [makeEvent(), makeEvent({ id: 'event-2', date: '2026-06-10', event_parameter_values: [] })];
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: makeAsset(), error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: events, error: null }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].event_parameter_values).toHaveLength(1);
    expect(result.current.events[0].event_parameter_values[0].parameter_name).toBe('ph');
  });

  it('returns empty events array when asset has no events', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: makeAsset(), error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: [], error: null }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.events).toEqual([]);
  });

  it('requests events ordered by date descending', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: makeAsset(), error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: [], error: null }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(orderMock).toHaveBeenCalledWith('date', { ascending: false });
  });

  it('sets error when asset fetch fails', async () => {
    const dbError = { message: 'Not found', code: '404' };
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: null, error: dbError }))
      .mockReturnValueOnce(makeEventsChain({ data: [], error: null }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(dbError);
    expect(result.current.asset).toBeNull();
  });

  it('sets error when events fetch fails', async () => {
    const dbError = { message: 'Network error', code: '500' };
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeAssetChain({ data: makeAsset(), error: null }))
      .mockReturnValueOnce(makeEventsChain({ data: null, error: dbError }));

    const { result } = renderHook(() => useAssetDetail('asset-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(dbError);
    expect(result.current.events).toEqual([]);
  });
});
