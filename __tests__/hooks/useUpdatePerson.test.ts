import { renderHook, act } from '@testing-library/react-native';
import { useUpdatePerson } from '../../hooks/useUpdatePerson';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const eqMock = jest.fn();
const updateMock = jest.fn();

const makeUpdateChain = (result: { error: unknown }) => ({
  update: updateMock.mockReturnValue({
    eq: eqMock.mockResolvedValue(result),
  }),
});

describe('useUpdatePerson', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loading is false initially', () => {
    const { result } = renderHook(() => useUpdatePerson());
    expect(result.current.loading).toBe(false);
  });

  it('calls update on people table with correct data', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpdateChain({ error: null }));

    const { result } = renderHook(() => useUpdatePerson());

    await act(async () => {
      await result.current.updatePerson('person-1', {
        name: 'María',
        relationship: 'hija',
        birth_date: '2020-01-01',
        icon: '👧',
      });
    });

    expect(supabase.from).toHaveBeenCalledWith('people');
    expect(updateMock).toHaveBeenCalledWith({
      name: 'María',
      relationship: 'hija',
      birth_date: '2020-01-01',
      icon: '👧',
    });
    expect(eqMock).toHaveBeenCalledWith('id', 'person-1');
  });

  it('throws and sets error when update fails', async () => {
    const dbError = { message: 'update failed' };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeUpdateChain({ error: dbError }));

    const { result } = renderHook(() => useUpdatePerson());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.updatePerson('person-1', { name: 'María', relationship: null, birth_date: null, icon: null });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toEqual(dbError);
    expect(result.current.error).toEqual(dbError);
  });
});
