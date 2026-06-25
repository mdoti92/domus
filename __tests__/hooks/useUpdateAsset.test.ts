import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUpdateAsset, UpdateAssetInput } from '../../hooks/useUpdateAsset';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const updateMock = jest.fn();
const eqMock = jest.fn();

const makeUpdateChain = (result: { error: unknown }) => ({
  update: updateMock.mockReturnValue({
    eq: eqMock.mockResolvedValue(result),
  }),
});

const baseInput: UpdateAssetInput = {
  name: 'Piscina Renovada',
  category: 'Mantenimiento',
  icon: '🏊',
  parameter_definitions: [
    { name: 'ph', type: 'number' },
    { name: 'cloro', type: 'number', unit: 'ppm' },
  ],
};

describe('useUpdateAsset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading is false initially', () => {
    const { result } = renderHook(() => useUpdateAsset());
    expect(result.current.loading).toBe(false);
  });

  it('error is null initially', () => {
    const { result } = renderHook(() => useUpdateAsset());
    expect(result.current.error).toBeNull();
  });

  it('calls update with the full input object', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpdateChain({ error: null }));

    const { result } = renderHook(() => useUpdateAsset());

    await act(async () => {
      await result.current.updateAsset('asset-1', baseInput);
    });

    expect(updateMock).toHaveBeenCalledWith(baseInput);
  });

  it('filters by asset id using eq', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpdateChain({ error: null }));

    const { result } = renderHook(() => useUpdateAsset());

    await act(async () => {
      await result.current.updateAsset('asset-42', baseInput);
    });

    expect(eqMock).toHaveBeenCalledWith('id', 'asset-42');
  });

  it('sets loading to true during update and false after', async () => {
    let resolveFn: (v: unknown) => void;
    const pendingPromise = new Promise((resolve) => { resolveFn = resolve; });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue(pendingPromise),
      }),
    });

    const { result } = renderHook(() => useUpdateAsset());

    act(() => {
      result.current.updateAsset('asset-1', baseInput);
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveFn!({ error: null });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('throws and sets error when supabase update fails', async () => {
    const dbError = { message: 'Update failed', code: '500' };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpdateChain({ error: dbError }));

    const { result } = renderHook(() => useUpdateAsset());

    let thrownError: unknown;
    await act(async () => {
      try { await result.current.updateAsset('asset-1', baseInput); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
    expect(result.current.loading).toBe(false);
  });
});
