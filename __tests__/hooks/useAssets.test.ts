import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAssets } from '../../hooks/useAssets';
import { supabase } from '../../lib/supabase';
import { Asset } from '../../types';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makeAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: '1',
  name: 'Piscina',
  category: 'Mantenimiento',
  icon: '🏊',
  parameter_definitions: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockSelectChain = (result: { data: Asset[] | null; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    order: jest.fn().mockResolvedValue(result),
  }),
});

describe('useAssets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with loading true', () => {
    (supabase.from as jest.Mock).mockReturnValue(
      mockSelectChain({ data: [], error: null })
    );

    const { result } = renderHook(() => useAssets());
    expect(result.current.loading).toBe(true);
  });

  it('returns assets after successful fetch', async () => {
    const assets = [makeAsset()];
    (supabase.from as jest.Mock).mockReturnValue(
      mockSelectChain({ data: assets, error: null })
    );

    const { result } = renderHook(() => useAssets());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.assets).toEqual(assets);
    expect(result.current.error).toBeNull();
  });

  it('returns empty array when no assets exist', async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      mockSelectChain({ data: [], error: null })
    );

    const { result } = renderHook(() => useAssets());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.assets).toEqual([]);
  });

  it('sets error when supabase fails', async () => {
    const dbError = { message: 'Network error', code: '500' };
    (supabase.from as jest.Mock).mockReturnValue(
      mockSelectChain({ data: null, error: dbError })
    );

    const { result } = renderHook(() => useAssets());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(dbError);
    expect(result.current.assets).toEqual([]);
  });

  describe('createAsset', () => {
    it('calls supabase insert with correct data and refetches list', async () => {
      const newAsset = makeAsset({ id: '2', name: 'Auto', category: 'Mantenimiento' });
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: newAsset, error: null }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectChain({ data: [], error: null }))
        .mockReturnValueOnce({ insert: mockInsert })
        .mockReturnValueOnce(mockSelectChain({ data: [newAsset], error: null }));

      const { result } = renderHook(() => useAssets());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createAsset({
          name: 'Auto',
          category: 'Mantenimiento',
          icon: null,
          parameter_definitions: [],
        });
      });

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Auto',
        category: 'Mantenimiento',
        icon: null,
        parameter_definitions: [],
      });
      await waitFor(() => expect(result.current.assets).toEqual([newAsset]));
    });

    it('throws when supabase insert fails', async () => {
      const dbError = { message: 'Duplicate key', code: '23505' };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectChain({ data: [], error: null }))
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: dbError }),
            }),
          }),
        });

      const { result } = renderHook(() => useAssets());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.createAsset({
            name: 'Auto',
            category: 'Mantenimiento',
            icon: null,
            parameter_definitions: [],
          });
        })
      ).rejects.toEqual(dbError);
    });
  });
});
