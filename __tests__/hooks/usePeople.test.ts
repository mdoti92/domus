import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePeople } from '../../hooks/usePeople';
import { supabase } from '../../lib/supabase';
import { Person } from '../../types';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const makePerson = (overrides: Partial<Person> = {}): Person => ({
  id: '1',
  name: 'María',
  relationship: 'hija',
  birth_date: '2020-01-01',
  icon: '👧',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockSelectChain = (result: { data: Person[] | null; error: unknown }) => ({
  select: jest.fn().mockReturnValue({
    order: jest.fn().mockResolvedValue(result),
  }),
});

describe('usePeople', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with loading true', () => {
    (supabase.from as jest.Mock).mockReturnValue(mockSelectChain({ data: [], error: null }));
    const { result } = renderHook(() => usePeople());
    expect(result.current.loading).toBe(true);
  });

  it('returns people after successful fetch', async () => {
    const people = [makePerson()];
    (supabase.from as jest.Mock).mockReturnValue(mockSelectChain({ data: people, error: null }));

    const { result } = renderHook(() => usePeople());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.people).toEqual(people);
    expect(result.current.error).toBeNull();
  });

  it('sets error when supabase fails', async () => {
    const dbError = { message: 'Network error' };
    (supabase.from as jest.Mock).mockReturnValue(mockSelectChain({ data: null, error: dbError }));

    const { result } = renderHook(() => usePeople());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(dbError);
    expect(result.current.people).toEqual([]);
  });

  describe('createPerson', () => {
    it('calls supabase insert with correct data and refetches list', async () => {
      const newPerson = makePerson({ id: '2', name: 'Toby', relationship: 'mascota', birth_date: null, icon: '🐕' });
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: newPerson, error: null }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectChain({ data: [], error: null }))
        .mockReturnValueOnce({ insert: mockInsert })
        .mockReturnValueOnce(mockSelectChain({ data: [newPerson], error: null }));

      const { result } = renderHook(() => usePeople());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.createPerson({
          name: 'Toby',
          relationship: 'mascota',
          birth_date: null,
          icon: '🐕',
        });
      });

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Toby',
        relationship: 'mascota',
        birth_date: null,
        icon: '🐕',
      });
      await waitFor(() => expect(result.current.people).toEqual([newPerson]));
    });

    it('throws when supabase insert fails', async () => {
      const dbError = { message: 'insert failed' };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectChain({ data: [], error: null }))
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: dbError }),
            }),
          }),
        });

      const { result } = renderHook(() => usePeople());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.createPerson({ name: 'Toby', relationship: null, birth_date: null, icon: null });
        })
      ).rejects.toEqual(dbError);
    });
  });
});
