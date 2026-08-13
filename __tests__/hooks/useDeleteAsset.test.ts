import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDeleteAsset } from '../../hooks/useDeleteAsset';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const deleteMock = jest.fn();
const eqMock = jest.fn();

const makeDeleteChain = (result: { error: unknown }) => ({
  delete: deleteMock.mockReturnValue({
    eq: eqMock.mockResolvedValue(result),
  }),
});

describe('useDeleteAsset', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading is false initially', () => {
    const { result } = renderHook(() => useDeleteAsset());
    expect(result.current.loading).toBe(false);
  });

  it('error is null initially', () => {
    const { result } = renderHook(() => useDeleteAsset());
    expect(result.current.error).toBeNull();
  });

  it('calls delete on assets table', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: null }));

    const { result } = renderHook(() => useDeleteAsset());

    await act(async () => {
      await result.current.deleteAsset('asset-1');
    });

    expect(supabase.from).toHaveBeenCalledWith('assets');
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it('filters delete by asset id', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: null }));

    const { result } = renderHook(() => useDeleteAsset());

    await act(async () => {
      await result.current.deleteAsset('asset-42');
    });

    expect(eqMock).toHaveBeenCalledWith('id', 'asset-42');
  });

  it('sets loading to true during deletion and false after', async () => {
    let resolveFn: (v: unknown) => void;
    const pendingPromise = new Promise((resolve) => { resolveFn = resolve; });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue(pendingPromise),
      }),
    });

    const { result } = renderHook(() => useDeleteAsset());

    act(() => { result.current.deleteAsset('asset-1'); });

    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => { resolveFn!({ error: null }); });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('throws and sets error when supabase delete fails', async () => {
    const dbError = { message: 'Delete failed', code: '500' };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: dbError }));

    const { result } = renderHook(() => useDeleteAsset());

    let thrownError: unknown;
    await act(async () => {
      try { await result.current.deleteAsset('asset-1'); }
      catch (e) { thrownError = e; }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
    expect(result.current.loading).toBe(false);
  });
});
