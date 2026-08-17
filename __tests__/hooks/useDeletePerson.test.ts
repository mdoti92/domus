import { renderHook, act } from '@testing-library/react-native';
import { useDeletePerson } from '../../hooks/useDeletePerson';
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

describe('useDeletePerson', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls delete on people table filtered by id', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: null }));

    const { result } = renderHook(() => useDeletePerson());

    await act(async () => {
      await result.current.deletePerson('person-1');
    });

    expect(supabase.from).toHaveBeenCalledWith('people');
    expect(eqMock).toHaveBeenCalledWith('id', 'person-1');
  });

  it('throws a friendly, explicit message when the person has associated assets (CA5, FK restrict violation)', async () => {
    const restrictError = { code: '23503', message: 'update or delete on table "people" violates foreign key constraint' };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: restrictError }));

    const { result } = renderHook(() => useDeletePerson());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deletePerson('person-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect((thrownError as Error).message).toBe(
      'No se puede eliminar: hay assets asociados a esta persona. Desvinculalos primero.'
    );
  });

  it('rethrows the original error for any other failure', async () => {
    const dbError = { code: '500', message: 'network error' };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeDeleteChain({ error: dbError }));

    const { result } = renderHook(() => useDeletePerson());

    let thrownError: unknown;
    await act(async () => {
      try {
        await result.current.deletePerson('person-1');
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toEqual(dbError);
  });
});
